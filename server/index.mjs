import express from 'express';
import cors from 'cors';
import compression from 'compression';
import helmet from 'helmet';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import { dbHealthy, isDbConfigured } from './db.mjs';
import { handleIngest } from './ingest.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// dist/ is produced by `vite build` at the repo root, one level above server/.
const distDir = path.resolve(__dirname, '..', 'dist');

const app = express();
// Railway terminates TLS and proxies to this container through its edge
// network before the request reaches us. The number of internal hops isn't
// stable (Railway has been rolling out an additional CDN layer, and their
// own docs say hop count "typically" is 1 but can vary), so trusting a fixed
// hop count (`trust proxy: 1`) is fragile — if the real path has 2 hops, Express
// resolves req.ip to an intermediate Railway proxy address instead of the
// client, which silently breaks IP-based rate limiting. Instead, trust by CIDR:
// Railway's internal network consistently uses the 100.64.0.0/10 (CGNAT) range
// for its proxy hops, so any hop in that range is treated as trusted, and
// Express walks X-Forwarded-For right-to-left until it finds the first address
// outside that range — which is the true client IP regardless of hop count.
app.set('trust proxy', '100.64.0.0/10');
const PORT = process.env.PORT || 3001;
const NOTIFICATION_TO =
  process.env.FEEDBACK_NOTIFICATION_TO || 'kallen1286@gmail.com';

// /feedback field limits. The feedback body is attacker-controlled and gets
// embedded in an HTML email — cap sizes so a single request can't blow up
// the notification email regardless of the escaping below.
const FEEDBACK_MAX_NAME_LEN = 200;
const FEEDBACK_MAX_MESSAGE_LEN = 5000;
// RFC 5321-ish, permissive-but-sane email format check. This is not meant to
// guarantee deliverability — it just rejects obviously malformed input before
// it's used as the outbound email's Reply-To and rendered in the HTML body.
const EMAIL_RE = /^[^\s@<>"']+@[^\s@<>"']+\.[^\s@<>"']+$/;

// -- Rate limiting (in-memory token bucket per client IP) -------------------
// /feedback is public and unauthenticated, and every accepted request fires a
// real, billable outbound email via Resend to the site admin's inbox. Without
// a limit, a scripted attacker can mail-bomb the admin and burn Resend quota
// indefinitely. Mirrors the token-bucket approach already used for POST /e
// (server/ingest.mjs), keyed on IP instead of anon_id since this endpoint has
// no cookie. 5 requests burst, refilling at 5 per 15 minutes — generous for a
// real visitor, well below what makes mail-bombing or quota exhaustion viable.
const FEEDBACK_RATE_CAPACITY = 5;
const FEEDBACK_RATE_WINDOW_MS = 15 * 60 * 1000;
const FEEDBACK_RATE_REFILL_PER_MS = FEEDBACK_RATE_CAPACITY / FEEDBACK_RATE_WINDOW_MS;
const feedbackBuckets = new Map(); // ip -> { tokens, last }
function feedbackRateLimitOk(ip) {
  const now = Date.now();
  let b = feedbackBuckets.get(ip);
  if (!b) {
    b = { tokens: FEEDBACK_RATE_CAPACITY, last: now };
    feedbackBuckets.set(ip, b);
  }
  const elapsed = now - b.last;
  b.tokens = Math.min(FEEDBACK_RATE_CAPACITY, b.tokens + elapsed * FEEDBACK_RATE_REFILL_PER_MS);
  b.last = now;
  if (b.tokens < 1) return false;
  b.tokens -= 1;
  return true;
}
// Light janitor so the map can't grow unbounded under a distributed attack.
function maybeFeedbackJanitor() {
  if (feedbackBuckets.size < 5000) return;
  const cutoff = Date.now() - FEEDBACK_RATE_WINDOW_MS;
  for (const [k, v] of feedbackBuckets) if (v.last < cutoff) feedbackBuckets.delete(k);
}

const HTML_ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
/** Escape a string for safe interpolation into HTML markup. */
function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (ch) => HTML_ESCAPES[ch]);
}
/** Strip control/newline characters so a field can't inject extra email headers. */
function stripControlChars(str) {
  return String(str).replace(/[\r\n\t\x00-\x1f\x7f]/g, ' ');
}

// Security headers. Content-Security-Policy is hand-tuned for the resources this
// page actually uses: Google Analytics, YouTube nocookie embed, Resend API, and
// inline styles produced by Vite/Tailwind. Tighten further when new third-party
// scripts are removed or replaced.
app.use(
  helmet({
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        'default-src': ["'self'"],
        'base-uri': ["'self'"],
        'object-src': ["'none'"],
        'frame-ancestors': ["'none'"],
        'img-src': ["'self'", 'data:', 'https://i.ytimg.com', 'https://www.google-analytics.com'],
        'media-src': ["'self'"],
        'script-src': [
          "'self'",
          "'unsafe-inline'", // Vite injects a small inline bootstrap; Tailwind also occasionally inlines
          'https://www.googletagmanager.com',
          'https://www.google-analytics.com',
        ],
        'connect-src': [
          "'self'",
          'https://www.google-analytics.com',
          'https://region1.google-analytics.com',
          'https://api.resend.com',
        ],
        'style-src': ["'self'", "'unsafe-inline'"],
        'font-src': ["'self'", 'data:'],
        'frame-src': ['https://www.youtube-nocookie.com', 'https://www.youtube.com'],
        'upgrade-insecure-requests': [],
      },
    },
    // Allow embedding YouTube iframes — Helmet's COEP would block them.
    crossOriginEmbedderPolicy: false,
    // Permissive opener policy so the GoFundMe link in a new tab works cleanly.
    crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' },
    // Helmet's default 'no-referrer' strips the Referer header on every outbound
    // request, which makes YouTube's embedded player fail with Error 153
    // ("embedder identity missing referrer"). 'strict-origin-when-cross-origin'
    // is the modern browser default — it sends just the origin to third parties
    // (enough for YouTube to verify the embedder) while hiding the full URL path.
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  }),
);

// gzip / brotli compression for all responses. Ships before other
// middleware so 301 redirects and static assets both benefit. `compression`
// automatically negotiates the best supported encoding via Accept-Encoding.
app.use(compression());

app.use(cors());
app.use(express.json({ limit: '32kb' }));

// Canonical host redirect. Once the apex `laneysworld.com` is added as a
// custom domain in Railway (Porkbun ALIAS / Railway-issued cert), traffic
// reaching this server with a non-www host gets 301'd to the canonical
// `https://www.laneysworld.com` equivalent. The health check is exempt so
// Railway's load-balancer probe still returns 200 on the apex hostname.
const CANONICAL_HOST = 'www.laneysworld.com';
const APEX_HOSTS = new Set(['laneysworld.com']);
app.use((req, res, next) => {
  if (req.path === '/health') return next();
  // Express strips the port; req.hostname is just the bare hostname.
  if (APEX_HOSTS.has(req.hostname)) {
    const target = `https://${CANONICAL_HOST}${req.originalUrl}`;
    return res.redirect(301, target);
  }
  next();
});

// TEMP DEBUG — will be removed in a fast follow-up once trust-proxy config
// is confirmed correct against Railway's real proxy chain. No sensitive data
// exposed — only request metadata already visible to any HTTP client.
app.get('/__debug_ip', (req, res) => {
  res.json({
    ip: req.ip,
    ips: req.ips,
    xff: req.headers['x-forwarded-for'],
    xrealip: req.headers['x-real-ip'],
    remoteAddress: req.socket.remoteAddress,
  });
});

app.get('/health', async (_req, res) => {
  // Lightweight liveness check. Always returns 200 if the Node process is up.
  // DB connectivity is reported but does NOT fail the health check — we don't
  // want Railway to kill an otherwise-healthy container just because Postgres
  // briefly hiccupped. Use /health?db=required for a stricter check.
  const db = isDbConfigured
    ? (await dbHealthy()) ? 'ok' : 'unreachable'
    : 'not_configured';
  res.json({ status: 'ok', db });
});

// First-party analytics ingest. See server/ingest.mjs for the privacy model
// (GPC/DNT honored, anon_id cookie, 30-min session window, rate-limit, etc.)
app.post('/e', handleIngest);

app.post('/feedback', async (req, res) => {
  try {
    if (!feedbackRateLimitOk(req.ip)) {
      return res.status(429).json({ error: 'Too many requests. Please try again later.' });
    }
    maybeFeedbackJanitor();

    const { name, email, feedback } = req.body ?? {};

    if (!email?.trim()) {
      return res.status(400).json({ error: 'Email address is required.' });
    }
    if (!feedback?.trim()) {
      return res.status(400).json({ error: 'Feedback message is required.' });
    }
    if (typeof email !== 'string' || !EMAIL_RE.test(email.trim())) {
      return res.status(400).json({ error: 'Please enter a valid email address.' });
    }

    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    const feedbackId = `feedback_${timestamp}_${randomStr}`;

    const displayName =
      (typeof name === 'string' && stripControlChars(name.trim()).slice(0, FEEDBACK_MAX_NAME_LEN)) ||
      'Anonymous';
    const senderEmail = email.trim();
    const message = feedback.trim().slice(0, FEEDBACK_MAX_MESSAGE_LEN);

    const resendApiKey = process.env.RESEND_API_KEY;
    if (resendApiKey) {
      const submittedAt = new Date(timestamp).toLocaleString('en-US', {
        timeZone: 'America/New_York',
        dateStyle: 'full',
        timeStyle: 'short',
      });

      // displayName/senderEmail/message are attacker-controlled (submitted by any
      // unauthenticated visitor) and get rendered as HTML in an email opened by a
      // human — escape them so injected markup/links can't spoof or alter the
      // notification email's content.
      const safeDisplayName = escapeHtml(displayName);
      const safeSenderEmail = escapeHtml(senderEmail);
      const safeMessage = escapeHtml(message);

      const emailHtml = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 24px; background: #ffffff;">
          <div style="border-bottom: 3px solid #2563eb; padding-bottom: 20px; margin-bottom: 24px;">
            <h1 style="margin: 0; font-size: 22px; color: #1e40af;">📬 New Message — Delaney's World</h1>
            <p style="margin: 6px 0 0; font-size: 13px; color: #6b7280;">Received ${submittedAt} ET</p>
          </div>

          <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
            <tr>
              <td style="padding: 10px 0; font-size: 13px; font-weight: 600; color: #374151; width: 72px; vertical-align: top;">From</td>
              <td style="padding: 10px 0; font-size: 14px; color: #111827; vertical-align: top;">${safeDisplayName}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; font-size: 13px; font-weight: 600; color: #374151; vertical-align: top;">Email</td>
              <td style="padding: 10px 0; font-size: 14px; vertical-align: top;">
                <a href="mailto:${safeSenderEmail}" style="color: #2563eb; text-decoration: none;">${safeSenderEmail}</a>
              </td>
            </tr>
          </table>

          <div style="background: #f0f7ff; border-left: 4px solid #2563eb; border-radius: 6px; padding: 18px 20px;">
            <p style="margin: 0 0 6px; font-size: 12px; font-weight: 600; color: #1e40af; text-transform: uppercase; letter-spacing: 0.05em;">Message</p>
            <p style="margin: 0; font-size: 15px; color: #1f2937; line-height: 1.6; white-space: pre-wrap;">${safeMessage}</p>
          </div>

          <p style="margin-top: 28px; font-size: 11px; color: #9ca3af; border-top: 1px solid #e5e7eb; padding-top: 16px;">
            Feedback ID: ${feedbackId} &nbsp;·&nbsp; Delaney's World &nbsp;·&nbsp; laneysworld.com
          </p>
        </div>
      `;

      const resendResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: "Delaney's World <updates@laneysworld.com>",
          to: [NOTIFICATION_TO],
          reply_to: senderEmail,
          subject: `New message from ${displayName} — Delaney's World`,
          html: emailHtml,
        }),
      });

      if (!resendResponse.ok) {
        const resendError = await resendResponse.text();
        console.error(`Resend API error: ${resendError}`);
        return res.status(502).json({ error: 'Failed to send email. Please try again.' });
      }

      console.log(`Email sent for feedback ${feedbackId}`);
    } else {
      console.warn('RESEND_API_KEY not set — skipping email.');
    }

    return res.json({
      success: true,
      message: 'Thank you for your message!',
      feedbackId,
    });
  } catch (error) {
    console.error(`POST /feedback error:`, error);
    return res.status(500).json({ error: `Failed to submit feedback: ${error.message}` });
  }
});

// Serve the Vite-built frontend from dist/ when it exists (production).
if (fs.existsSync(distDir)) {
  // Hashed assets under /assets/* are content-addressed by Vite, so we can
  // safely tell browsers/CDNs to cache them for a year. index.html itself is
  // served with a short TTL so users always pick up the latest deployment.
  app.use(
    '/assets',
    express.static(path.join(distDir, 'assets'), {
      maxAge: '1y',
      immutable: true,
      index: false,
    }),
  );
  // Root-level static files. Version-busted assets (og-image.jpg, favicons,
  // brand PNGs, sitemap.xml, robots.txt) get a 1-year cache since their URLs
  // change when the content does. index.html and any HTML fallback stay at
  // no-cache so deployments are picked up immediately.
  const VERSIONED_STATIC_EXT = /\.(?:jpg|jpeg|png|svg|webp|ico|xml|txt|woff2?|ttf|otf)$/i;
  app.use(
    express.static(distDir, {
      maxAge: '5m',
      index: false,
      setHeaders: (res, filePath) => {
        if (filePath.endsWith('index.html')) {
          res.setHeader('Cache-Control', 'no-cache');
        } else if (VERSIONED_STATIC_EXT.test(filePath)) {
          res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        }
      },
    }),
  );
  // SPA fallback: anything that isn't /health or /feedback gets index.html
  app.get(/^\/(?!health$|feedback$|e$).*/, (_req, res) => {
    res.setHeader('Cache-Control', 'no-cache');
    res.sendFile(path.join(distDir, 'index.html'));
  });
  console.log(`Serving static frontend from ${distDir}`);
} else {
  console.warn(`dist/ not found at ${distDir} — running API only.`);
}

app.listen(PORT, () => {
  console.log(`Laneysworld server listening on port ${PORT}`);
  console.log(`Feedback notifications -> ${NOTIFICATION_TO}`);
});
