// =============================================================================
// LaneysWorld Analytics Ingest — POST /e
// =============================================================================
// First-party event ingestion endpoint. Lives in its own module so the main
// server file stays readable.
//
// Privacy posture (see PR #11 / docs/privacy update):
//   * Honors GPC (Sec-GPC: 1) and DNT (DNT: 1) headers: no cookie, no DB write,
//     immediate 204. This is the "fully silent" stance recommended for a
//     rare-disease NPO touching donor money and an identifiable cohort.
//   * Issues an `anon_id` first-party cookie (UUID v4, 1y, Secure, SameSite=Lax,
//     HttpOnly) only when GPC/DNT is *not* signalled.
//   * Sessions are derived server-side from the anon_id and a 30-min inactivity
//     window. We never store raw IP or User-Agent — only coarse derived fields
//     (UA family, device type).
//   * Rate limited per anon_id via an in-memory token bucket (60 events / min,
//     burst 20). Adequate for charity-site volume; revisit if we ever exceed it.
//
// Endpoint contract:
//   POST /e
//   Headers (read):  Cookie: anon_id=<uuid>, User-Agent, Referer, Sec-GPC, DNT
//   Body (json):     { name: string, page_path?: string, props?: object,
//                      utm?: { source?, medium?, campaign? } }
//   Responses:
//     204 No Content — accepted (or silently dropped under GPC/DNT)
//     400 Bad Request — invalid body
//     413 Payload Too Large — body > 8 KB (express.json limit caught earlier)
//     429 Too Many Requests — rate-limit exceeded
//     500 Internal Server Error — DB or unexpected failure
// =============================================================================

import { randomUUID } from 'node:crypto';
import { query, isDbConfigured } from './db.mjs';

// -- Configuration -----------------------------------------------------------
const ANON_COOKIE = 'anon_id';
const ANON_MAX_AGE_MS = 365 * 24 * 60 * 60 * 1000; // 1 year
const SESSION_INACTIVITY_MS = 30 * 60 * 1000;       // 30 min
// Names we accept. Anything outside this allow-list is rejected so bad clients
// can't pollute the table with arbitrary garbage.
const ALLOWED_EVENT_NAMES = new Set([
  'page_view',
  'section_view',
  'video_play',
  'video_watched_25',
  'video_watched_50',
  'video_watched_75',
  'video_watched_100',
  'donate_cta_click',
  'donate_outbound',
  'feedback_submitted',
  'share_click',
  'external_click',
]);
// Hard caps so a misbehaving client can't bloat rows.
const MAX_NAME_LEN = 64;
const MAX_PATH_LEN = 512;
const MAX_PROPS_BYTES = 4 * 1024; // 4 KB serialized

// -- Rate limiting (in-memory token bucket per anon_id) ----------------------
const RATE_CAPACITY = 20;          // burst
const RATE_REFILL_PER_MS = 60 / 60000; // 60 events per minute → 1 per second
const buckets = new Map();          // anon_id -> { tokens, last }
function rateLimitOk(anonId) {
  const now = Date.now();
  let b = buckets.get(anonId);
  if (!b) {
    b = { tokens: RATE_CAPACITY, last: now };
    buckets.set(anonId, b);
  }
  // Refill since last touch
  const elapsed = now - b.last;
  b.tokens = Math.min(RATE_CAPACITY, b.tokens + elapsed * RATE_REFILL_PER_MS);
  b.last = now;
  if (b.tokens < 1) return false;
  b.tokens -= 1;
  return true;
}
// Light janitor — drop buckets we haven't touched in 10 min so the map can't
// grow unbounded. Cheap to run on every request.
function maybeJanitor() {
  if (buckets.size < 5000) return;
  const cutoff = Date.now() - 10 * 60 * 1000;
  for (const [k, v] of buckets) if (v.last < cutoff) buckets.delete(k);
}

// -- Helpers -----------------------------------------------------------------
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isOptOut(req) {
  // Both signals respected. GPC is the legally relevant one in 2026; DNT is
  // kept for users who set it explicitly.
  if (req.get('Sec-GPC') === '1') return true;
  if (req.get('DNT') === '1') return true;
  return false;
}

function parseCookies(header) {
  if (!header) return {};
  const out = {};
  for (const part of header.split(';')) {
    const i = part.indexOf('=');
    if (i < 0) continue;
    const k = part.slice(0, i).trim();
    const v = part.slice(i + 1).trim();
    if (k) out[k] = decodeURIComponent(v);
  }
  return out;
}

function readAnonId(req) {
  const cookies = parseCookies(req.headers.cookie);
  const v = cookies[ANON_COOKIE];
  return v && UUID_RE.test(v) ? v : null;
}

function setAnonCookie(res, anonId) {
  // HttpOnly is fine because the frontend never reads the cookie — only sends
  // it back automatically with same-origin POSTs.
  const expires = new Date(Date.now() + ANON_MAX_AGE_MS).toUTCString();
  res.setHeader(
    'Set-Cookie',
    `${ANON_COOKIE}=${anonId}; Path=/; Expires=${expires}; HttpOnly; Secure; SameSite=Lax`,
  );
}

// Light, allocation-free UA classification. Good enough for charity-site
// reporting; not a fingerprint.
function classifyUserAgent(ua) {
  if (!ua) return { ua_family: null, device_type: null };
  const lower = ua.toLowerCase();
  let ua_family = 'Other';
  if (lower.includes('edg/')) ua_family = 'Edge';
  else if (lower.includes('chrome/') && !lower.includes('chromium')) ua_family = 'Chrome';
  else if (lower.includes('firefox/')) ua_family = 'Firefox';
  else if (lower.includes('safari/') && !lower.includes('chrome/')) ua_family = 'Safari';
  else if (lower.includes('chromium')) ua_family = 'Chromium';

  let device_type = 'desktop';
  if (/ipad|tablet/.test(lower)) device_type = 'tablet';
  else if (/mobi|iphone|android/.test(lower)) device_type = 'mobile';
  return { ua_family, device_type };
}

function safeProps(props) {
  if (props == null) return {};
  if (typeof props !== 'object' || Array.isArray(props)) return null; // invalid
  let serialized;
  try {
    serialized = JSON.stringify(props);
  } catch {
    return null;
  }
  if (Buffer.byteLength(serialized, 'utf8') > MAX_PROPS_BYTES) return null;
  return props;
}

function clampStr(s, max) {
  if (typeof s !== 'string') return null;
  const t = s.trim();
  if (!t) return null;
  return t.length > max ? t.slice(0, max) : t;
}

// -- Session management ------------------------------------------------------
// Strategy: look up the most recent session for the anon_id. If it's within
// the inactivity window, reuse it (UPDATE last_ts + event_count). Otherwise
// open a new one.
async function upsertSession({ anonId, pagePath, referrer, utm, uaInfo }) {
  const recent = await query(
    `SELECT session_id, last_ts
       FROM sessions
       WHERE anon_id = $1
       ORDER BY last_ts DESC
       LIMIT 1`,
    [anonId],
  );

  const now = new Date();
  if (recent.rows.length) {
    const { session_id, last_ts } = recent.rows[0];
    const ageMs = now.getTime() - new Date(last_ts).getTime();
    if (ageMs < SESSION_INACTIVITY_MS) {
      await query(
        `UPDATE sessions
           SET last_ts = NOW(),
               exit_page = COALESCE($2, exit_page),
               event_count = event_count + 1
         WHERE session_id = $1`,
        [session_id, pagePath],
      );
      return session_id;
    }
  }

  // New session
  const sessionId = randomUUID();
  await query(
    `INSERT INTO sessions (
       session_id, anon_id, first_ts, last_ts,
       entry_page, exit_page, referrer,
       utm_source, utm_medium, utm_campaign,
       ua_family, device_type, event_count
     ) VALUES ($1, $2, NOW(), NOW(), $3, $3, $4, $5, $6, $7, $8, $9, 1)`,
    [
      sessionId,
      anonId,
      pagePath,
      referrer,
      utm?.source ?? null,
      utm?.medium ?? null,
      utm?.campaign ?? null,
      uaInfo.ua_family,
      uaInfo.device_type,
    ],
  );
  return sessionId;
}

// -- Route handler -----------------------------------------------------------
export async function handleIngest(req, res) {
  // 1) Opt-out: 204 + no cookie + no DB write.
  if (isOptOut(req)) {
    return res.status(204).end();
  }

  // 2) Validate body.
  const body = req.body ?? {};
  const name = clampStr(body.name, MAX_NAME_LEN);
  if (!name || !ALLOWED_EVENT_NAMES.has(name)) {
    return res.status(400).json({ error: 'Invalid event name.' });
  }
  const pagePath = clampStr(body.page_path, MAX_PATH_LEN);
  const props = safeProps(body.props);
  if (props === null) {
    return res.status(400).json({ error: 'Invalid props.' });
  }
  const utm = body.utm && typeof body.utm === 'object' ? body.utm : null;
  const referrer = clampStr(body.referrer, MAX_PATH_LEN);

  // 3) Anon ID: read existing cookie or mint a new one.
  let anonId = readAnonId(req);
  let mintedCookie = false;
  if (!anonId) {
    anonId = randomUUID();
    mintedCookie = true;
  }

  // 4) Rate limit by anon_id.
  if (!rateLimitOk(anonId)) {
    if (mintedCookie) setAnonCookie(res, anonId); // still issue cookie so retry works
    return res.status(429).json({ error: 'Rate limit exceeded.' });
  }
  maybeJanitor();

  // 5) If the DB isn't configured, accept silently — useful for local dev
  //    and for the brief window after a deploy before DATABASE_URL is set.
  if (!isDbConfigured) {
    if (mintedCookie) setAnonCookie(res, anonId);
    return res.status(204).end();
  }

  // 6) Write to DB.
  try {
    const uaInfo = classifyUserAgent(req.get('User-Agent'));
    const sessionId = await upsertSession({
      anonId,
      pagePath,
      referrer,
      utm,
      uaInfo,
    });

    await query(
      `INSERT INTO events (session_id, anon_id, name, page_path, props)
       VALUES ($1, $2, $3, $4, $5::jsonb)`,
      [sessionId, anonId, name, pagePath, JSON.stringify(props)],
    );
  } catch (err) {
    // Log but don't leak details. Never let tracking break the user's request.
    console.error('[ingest] DB write failed:', err.message);
    // Best-effort cookie set so the next request can still group.
    if (mintedCookie) setAnonCookie(res, anonId);
    return res.status(500).json({ error: 'Could not record event.' });
  }

  if (mintedCookie) setAnonCookie(res, anonId);
  return res.status(204).end();
}
