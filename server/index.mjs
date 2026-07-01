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
const PORT = process.env.PORT || 3001;
const NOTIFICATION_TO =
  process.env.FEEDBACK_NOTIFICATION_TO || 'kallen1286@gmail.com';

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
    const { name, email, feedback } = req.body ?? {};

    if (!email?.trim()) {
      return res.status(400).json({ error: 'Email address is required.' });
    }
    if (!feedback?.trim()) {
      return res.status(400).json({ error: 'Feedback message is required.' });
    }

    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    const feedbackId = `feedback_${timestamp}_${randomStr}`;

    const displayName = name?.trim() || 'Anonymous';
    const senderEmail = email.trim();
    const message = feedback.trim();

    const resendApiKey = process.env.RESEND_API_KEY;
    if (resendApiKey) {
      const submittedAt = new Date(timestamp).toLocaleString('en-US', {
        timeZone: 'America/New_York',
        dateStyle: 'full',
        timeStyle: 'short',
      });

      const emailHtml = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 24px; background: #ffffff;">
          <div style="border-bottom: 3px solid #2563eb; padding-bottom: 20px; margin-bottom: 24px;">
            <h1 style="margin: 0; font-size: 22px; color: #1e40af;">📬 New Message — Delaney's World</h1>
            <p style="margin: 6px 0 0; font-size: 13px; color: #6b7280;">Received ${submittedAt} ET</p>
          </div>

          <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
            <tr>
              <td style="padding: 10px 0; font-size: 13px; font-weight: 600; color: #374151; width: 72px; vertical-align: top;">From</td>
              <td style="padding: 10px 0; font-size: 14px; color: #111827; vertical-align: top;">${displayName}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; font-size: 13px; font-weight: 600; color: #374151; vertical-align: top;">Email</td>
              <td style="padding: 10px 0; font-size: 14px; vertical-align: top;">
                <a href="mailto:${senderEmail}" style="color: #2563eb; text-decoration: none;">${senderEmail}</a>
              </td>
            </tr>
          </table>

          <div style="background: #f0f7ff; border-left: 4px solid #2563eb; border-radius: 6px; padding: 18px 20px;">
            <p style="margin: 0 0 6px; font-size: 12px; font-weight: 600; color: #1e40af; text-transform: uppercase; letter-spacing: 0.05em;">Message</p>
            <p style="margin: 0; font-size: 15px; color: #1f2937; line-height: 1.6; white-space: pre-wrap;">${message}</p>
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
