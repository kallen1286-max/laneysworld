# LaneysWorld.com

**Delaney's World** — Fighting BPAN through gene therapy research.

A charity website raising awareness and funding for BPAN (Beta-propeller Protein-Associated Neurodegeneration), a rare neurodegenerative disease affecting ~500 children worldwide. Built for Delaney, a brave 2-year-old whose joy is contagious and whose fight deserves action.

🌐 **Live site:** [laneysworld.com](https://www.laneysworld.com)

**Current release:** [v2.0.0](https://github.com/kallen1286-max/laneysworld/releases/tag/v2.0.0) — Horizon Wordmark brand identity + dynamic dark mode

---

## Brand & Design System

### Horizon Wordmark (shipped June 18, 2026)

The "Laney's World" wordmark uses the **sun-rising-over-horizon** mark with the sun replacing the `O` in the wordmark, paired with the tagline "Horizon of hope for BPAN."

**Palette:**

| Token | Hex | Role |
|-------|-----|------|
| Midnight | `#0F172A` | Light-mode text |
| Ice | `#F8FAFC` | Dark-mode text |
| Horizon Ochre | `#E6A100` | Brand accent (sun, CTAs) |
| Steel | `#475569` | Tagline / muted text on light |
| Ice Muted | `#CBD5E1` | Tagline / muted text on dark |

**Logo assets** (all in `src/assets/brand/`):

| File | Use |
|------|-----|
| `horizontal-light.svg` / `horizontal-dark.svg` | Sticky nav, loading screen — theme-aware swap |
| `stacked-light.svg` / `stacked-dark.svg` | Anchored section, Privacy Policy page — theme-aware swap |
| `icon-transparent.svg` | Footer mark (Ochre sun only, theme-neutral) |
| `icon-light.svg` | Reserved for Ice-background placements |

Public PNG fallbacks (referenced by JSON-LD / OG meta) live in `public/brand/`:
`horizontal-light.png`, `stacked-light.png`, `icon-transparent.png`.

### Dynamic Dark Mode (OS-driven)

As of v2.0.0, the site honors `prefers-color-scheme` automatically:

- **Anti-FOUC:** inline script in `index.html` sets `.dark` on `<html>` before CSS paints.
- **Live updates:** `src/main.tsx` adds a `matchMedia` listener so the theme tracks live OS changes without a reload.
- **Tokens:** `src/styles/globals.css` exposes `--brand-ink`, `--brand-ink-muted`, `--brand-accent`, `--brand-surface`, `--brand-surface-alt`, and `--brand-border` via `@theme inline` so Tailwind sees `bg-brand-accent` / `text-brand-accent` etc.
- **Logo theme swap:** a `MutationObserver` on `<html>.class` drives an `isDark` state; horizontal and stacked wordmark `<img src>` attributes swap to dark SVG variants in dark mode. The footer Ochre-sun stays neutral.
- **Categorical color cards** (medical centers, science flowchart, Essential Resource highlight) intentionally stay light in both modes — they're "islands of light" on the dark page surface.

There is **no manual toggle** — OS-only by design.

---

## Architecture

| Layer | Technology | Details |
|-------|-----------|---------|
| **Frontend** | Vite + React 18 + TypeScript | Tailwind CSS 4, Radix UI, lucide-react, Motion |
| **Backend** | Node.js + Express | `server/index.mjs` — feedback endpoint, calls Resend directly; helmet/CSP, cache headers |
| **Email** | Resend API | Scoped API key, custom domain `laneysworld.com` |
| **Hosting** | Railway | Auto-deploys from `main` via Railpack |
| **DNS** | Porkbun | Nameservers: `*.ns.porkbun.com` |
| **Analytics** | Google Analytics + first-party Postgres event log | GA4 ID: `G-ZS831G1M89` |

The site previously ran on Figma Sites + a Supabase edge function. As of June 2026, both have been removed in favor of a single repo containing the Vite frontend and a small Express backend that talks to Resend directly.

---

## Backend Endpoints

Implemented in `server/index.mjs`.

### `GET /health`

Lightweight health check. Always returns `200` if the Node process is up.
Reports DB connectivity but does **not** fail the check on DB outages — see
the [Database → Health check](#health-check) section.

### `POST /e`

First-party analytics event ingestion. Same-origin only. Honors **Global Privacy
Control (`Sec-GPC: 1`)** and **Do Not Track (`DNT: 1`)** — when either is set,
the server returns `204` immediately and writes nothing.

**Request body:**
```json
{
  "name": "donate_cta_click",
  "page_path": "/",
  "referrer": "https://example.com",
  "props": { "location": "hero" },
  "utm": { "source": "twitter", "medium": "social", "campaign": "bpan-awareness" }
}
```

**Allow-listed event names** (server rejects anything else):

`page_view`, `section_view`, `video_play`, `video_watched_25`, `video_watched_50`,
`video_watched_75`, `video_watched_100`, `donate_cta_click`, `donate_outbound`,
`feedback_submitted`, `share_click`, `external_click`.

**Responses:**

| Status | Meaning |
|--------|---------|
| `204 No Content` | Event accepted (or silently dropped under GPC/DNT) |
| `400 Bad Request` | Invalid body, unknown event name, oversize props |
| `429 Too Many Requests` | Rate-limited (60 events / minute per `anon_id`) |
| `500 Internal Server Error` | DB or unexpected failure (logged) |

**Cookie:** First-party `anon_id` (UUID v4) is set on the first non-opt-out
request. `HttpOnly; Secure; SameSite=Lax; Max-Age=1y`. The frontend never reads
it — it just rides along automatically on same-origin POSTs.

See `server/ingest.mjs` for the full implementation and `src/app/utils/analytics.ts`
for the frontend SDK that emits these events.

### `POST /feedback`

Accepts user feedback from the site's contact form. Body capped at 32 KB.

**Request body:**
```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "feedback": "Thank you for sharing Delaney's story."
}
```

| Field | Required | Notes |
|-------|----------|-------|
| `name` | No | Defaults to "Anonymous" |
| `email` | Yes | Used as reply-to on notification |
| `feedback` | Yes | The message body |

**What happens:**
1. Validates `email` and `feedback` are present
2. Generates a unique `feedbackId` (`feedback_{timestamp}_{random}`)
3. Sends an HTML notification email via Resend to `kallen1286@gmail.com` (configurable via `FEEDBACK_NOTIFICATION_TO`)
4. Returns `{ success: true, message: "Thank you for your message!", feedbackId }`

> Feedback is no longer persisted to a database — it is dispatched directly as email. If long-term storage is needed later, wire up Railway Postgres or any other store inside `/feedback`.

### Static Serving

The same Express process serves the Vite-built `dist/` folder:

- `/assets/*` — hashed bundles, `Cache-Control: public, max-age=31536000, immutable` (1 year)
- `/` and SPA fallback routes — `index.html`, `Cache-Control: no-cache` (so deploys are picked up immediately)
- `/robots.txt`, `/sitemap.xml`, `/og-image.jpg`, `/logo.png` — copied from `public/` by Vite

---

## Security Headers

`server/index.mjs` wires [helmet](https://helmetjs.github.io/) with a hand-tuned Content-Security-Policy:

| Header | Value |
|--------|-------|
| `Content-Security-Policy` | Allowlists self, GA, YouTube nocookie, Resend API. Inline scripts/styles allowed (required by Vite bootstrap + Tailwind). |
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains` |
| `X-Frame-Options` | `SAMEORIGIN` |
| `Cross-Origin-Opener-Policy` | `same-origin-allow-popups` (so GoFundMe new-tab links work) |
| `Cross-Origin-Embedder-Policy` | Disabled (so YouTube iframes embed) |

When adding new third-party scripts, frames, or fetch destinations, update the corresponding `script-src`/`frame-src`/`connect-src` directive in `server/index.mjs`.

---

## Environment Variables

| Variable | Where | Description |
|----------|-------|-------------|
| `RESEND_API_KEY` | Backend (Railway) | Scoped Resend key for `laneysworld.com` **only** (isolated from TradeEscape) |
| `PORT` | Backend (Railway) | Defaults to `3001` locally; Railway sets this automatically |
| `FEEDBACK_NOTIFICATION_TO` | Backend (Railway, optional) | Where notification emails are sent. Defaults to `kallen1286@gmail.com`. |
| `DATABASE_URL` | Backend (Railway) | PostgreSQL connection string. Provisioned via the linked `Postgres` service. Used by the analytics event store. |
| `VITE_API_URL` | Frontend (build time) | Base URL of the backend. Leave empty to call same-origin. |

See `.env.example` for reference.

---

## Database (PostgreSQL)

A Railway-managed Postgres instance backs the first-party analytics event store. The connection is wired into the Express service via Railway's variable references (`DATABASE_URL` references the `Postgres` service's internal URL — traffic stays on Railway's private network).

### Schema

Two tables, defined in `server/migrations/001_init_analytics.sql`:

| Table | Purpose |
|-------|---------|
| `sessions` | One row per visitor session (30-min inactivity window). Tracks entry/exit page, referrer, UTM params, derived UA family + device class, and a denormalized event count. |
| `events` | One row per individual interaction (`page_view`, `donate_cta_click`, `video_play`, etc.). Carries a flexible `props JSONB` payload for event-specific data. Foreign-keyed to `sessions`. |

All identifiers are random UUIDs assigned to a first-party cookie — no personally identifiable information is stored. No raw IPs or User-Agents are persisted. See the Privacy Policy for details.

### Retention

Raw event rows are purged after **90 days** (configurable via
`ANALYTICS_RETENTION_DAYS`):

```bash
# Sweep events + orphan sessions older than the retention window
pnpm run db:purge
```

Idempotent and safe to run on a daily schedule (Railway Cron Trigger). Sessions
are deleted only when (a) their last activity is outside the retention window
AND (b) they have no surviving events — belt-and-suspenders against fresh
sessions that haven't yet logged their first event.

### Migrations

```bash
# Apply any pending migrations
pnpm run db:migrate
```

The runner (`server/migrate.mjs`) reads every `.sql` file in `server/migrations/` in lexicographic order, applies each within a transaction, and records the version in `schema_migrations`. Already-applied migrations are skipped. Run it once from the Railway service shell after a new migration is added.

### Health check

`GET /health` reports DB connectivity:

```json
{ "status": "ok", "db": "ok" }              // happy path
{ "status": "ok", "db": "unreachable" }     // DB hiccup; container stays alive
{ "status": "ok", "db": "not_configured" }  // DATABASE_URL is unset
```

A DB outage does **not** fail the health check — Railway will not kill an otherwise-healthy container just because Postgres briefly hiccupped.

---

## Resend Configuration

- **Sending address:** `Delaney's World <updates@laneysworld.com>`
- **Notification recipient:** `kallen1286@gmail.com` (override via `FEEDBACK_NOTIFICATION_TO`)
- **Reply-to:** Set dynamically to the submitter's email
- **API endpoint:** `https://api.resend.com/emails`
- **Dashboard:** [resend.com/emails](https://resend.com/emails)

### API Key Isolation

As of April 12, 2026, LaneysWorld and TradeEscape use **separate Resend API keys** scoped to their respective domains:

| Project | Resend API Key Scope | Domain |
|---------|---------------------|--------|
| LaneysWorld | Sending access only | `laneysworld.com` |
| TradeEscape | Separate key | `tradeescape.com` |

To rotate the LaneysWorld key: create a new key at [resend.com/api-keys](https://resend.com/api-keys) scoped to `laneysworld.com`, then update `RESEND_API_KEY` in the Railway service variables.

---

## DNS Configuration (Porkbun)

Last verified: June 18, 2026 (live `dig` against `1.1.1.1`)

All legacy Figma + inbound-SES records have been cleaned out of the Porkbun zone. The bare apex no longer resolves — only `www` is live, pointed at Railway. The active zone is purely: Railway hosting + Resend outbound mail + ACME certificate issuance.

### Live Records

| Type | Host | Value | Purpose |
|------|------|-------|---------|
| CNAME | `www.laneysworld.com` | `kzwz52r1.up.railway.app` | Production traffic → Railway |
| MX | `send.laneysworld.com` | `feedback-smtp.us-east-1.amazonses.com` (prio 10) | Resend bounce handling |
| TXT | `laneysworld.com` | `v=spf1 include:amazonses.com ~all` | Root SPF |
| TXT | `send.laneysworld.com` | `v=spf1 include:amazonses.com ~all` | Send subdomain SPF |
| TXT | `resend._domainkey.laneysworld.com` | DKIM public key (RSA) | Resend DKIM signing |
| TXT | `_dmarc.laneysworld.com` | `v=DMARC1; p=quarantine; rua=mailto:...; ruf=mailto:...; fo=1` | DMARC policy (quarantine + aggregate/forensic reporting) |
| TXT | `_railway-verify.www.laneysworld.com` | `railway-verify=<token>` | Railway custom-domain ownership proof |
| TXT | `_acme-challenge.laneysworld.com` | ACME challenge tokens (rotates) | Let's Encrypt TLS issuance for Railway |

### Notes

- **No A record on the apex** (`laneysworld.com`). The previous Figma apex `A → 204.69.207.1` was removed during the Railway cutover. Visitors hitting the bare apex won't resolve — share `www.laneysworld.com` everywhere (the canonical URL in `index.html` and `sitemap.xml`).
- **No inbound MX** on the root domain. There is no mailbox at `@laneysworld.com`; the only MX is on the `send.` subdomain for Resend bounce handling.
- **Only `resend._domainkey` is in use for DKIM.** The legacy `default._domainkey` record from the old SES setup has been removed.

---

## File Structure

```
laneysworld/
├── README.md
├── ATTRIBUTIONS.md
├── .env.example
├── .gitignore
├── .npmrc                    # pnpm node-linker=hoisted
├── package.json              # Vite frontend + scripts; pnpm@9.15.9
├── pnpm-lock.yaml
├── pnpm-workspace.yaml       # root + server/
├── vite.config.ts            # figma:asset/ resolver, React, Tailwind
├── postcss.config.mjs
├── index.html                # SEO meta, OG/Twitter, JSON-LD structured data
├── default_shadcn_theme.css
├── public/                   # Copied verbatim to dist/ root
│   ├── robots.txt
│   ├── sitemap.xml
│   ├── og-image.jpg          # 1200x630 social card (Horizon Wordmark, v=3 cache-bust)
│   ├── favicon.ico           # 48x48 multi-frame ICO (Ochre sun)
│   ├── favicon.png           # 64x64 PNG fallback
│   ├── favicon-16.png        # 16x16 PNG (Ochre sun)
│   ├── favicon-32.png        # 32x32 PNG (Ochre sun)
│   ├── apple-touch-icon.png  # 180x180 (Ochre sun)
│   └── brand/                # Public PNG renditions referenced by JSON-LD / OG
│       ├── horizontal-light.png
│       ├── stacked-light.png
│       └── icon-transparent.png
├── scripts/
│   └── optimize-images.mjs   # sharp / MozJPEG image pre-processor
├── src/                      # React + TypeScript app
│   ├── main.tsx              # React mount + prefers-color-scheme listener
│   ├── app/
│   │   ├── App.tsx           # Lazy-loads FeedbackModal + PrivacyPolicy; isDark hook
│   │   ├── components/
│   │   │   ├── ui/           # 5 actively used shadcn primitives only (button, card, link, sonner, utils)
│   │   │   ├── FeedbackModal.tsx
│   │   │   ├── PrivacyPolicy.tsx
│   │   │   ├── animated-poem.tsx
│   │   │   └── science-flowchart.tsx
│   │   ├── data/
│   │   └── utils/
│   │       └── analytics.ts  # trackEvent SDK — dual-writes to GA4 + POST /e,
│   │                          # honors GPC/DNT, uses sendBeacon when available
│   ├── assets/
│   │   ├── brand/            # Horizon Wordmark SVGs (light/dark variants)
│   │   └── [photos].png      # Optimized hero/photo images
│   └── styles/
│       └── globals.css       # Tailwind v4 + brand tokens for light/dark
├── server/                   # Express backend
│   ├── package.json          # express + cors + pg (helmet hoisted from root)
│   ├── index.mjs             # /health, /e, /feedback, helmet+CSP, static dist/
│   ├── db.mjs                # lazy pg.Pool, query(), dbHealthy(), SSL auto-detect
│   ├── ingest.mjs            # POST /e — GPC/DNT honoring, sessionization, rate limit
│   ├── migrate.mjs           # transactional migration runner
│   ├── purge.mjs             # 90-day retention sweep
│   └── migrations/
│       └── 001_init_analytics.sql
└── .github/
    └── workflows/
        └── frontend-ci.yml   # CI: pnpm install + vite build, sticky bot PR comments
```

---

## Performance & SEO

The site is optimized for fast first-paint and good search indexing:

- **Lazy-loaded modals:** `FeedbackModal` and `PrivacyPolicy` are `React.lazy` boundaries, trimming ~30 KB off the initial bundle.
- **Image pipeline:** Hero photos are pre-processed with [sharp](https://sharp.pixelplumbing.com/) (MozJPEG q78, 1920 px max width, EXIF stripped). Total image weight dropped from ~23 MB to ~4 MB. Run `pnpm run optimize:images` after adding new photos to `src/assets/`.
- **Long-term asset caching:** Vite emits content-hashed filenames; Express serves them with `max-age=31536000, immutable`.
- **Structured data:** `index.html` ships JSON-LD describing the NGO, the `MedicalCondition` (BPAN), the founder/subject (Delaney), and the `WebSite`. Update if org details change.
- **Robots + sitemap:** `/robots.txt` allows all crawlers and points to `/sitemap.xml`. Update `public/sitemap.xml` whenever new top-level routes are added.
- **OG/Twitter cards:** `og-image.jpg` and Twitter `summary_large_image` set; rebuild via `scripts/optimize-images.mjs`-style sharp script if the source photo changes.

---

## Branch Protection

- **GitHub Ruleset:** "Protect main — require CI" (ID: 14955287)
- All changes to `main` must go through a PR
- Required status check: `Vite Build` must pass

---

## Deployment

### Railway

The repo auto-deploys to Railway on every push to `main`. Railpack reads `packageManager: pnpm@9.15.9` from `package.json`, installs with pnpm, runs `pnpm run build`, then `pnpm start` (which boots `server/index.mjs` and serves both the API and the built `dist/`).

**Service config:**
- Start command: `pnpm start` (do **not** override in the Railway dashboard — see April 2026 incident below)
- Port: `8080` (Railway injects `process.env.PORT`)
- Public domain: `www.laneysworld.com` (CNAME → `kzwz52r1.up.railway.app`)

### Local Development

```bash
# Install dependencies (pnpm required — see packageManager in package.json)
pnpm install

# Run the Vite dev server on :5173
pnpm dev

# In a separate terminal, run the Express backend on :3001
cd server && node index.mjs

# Or simulate the production combo (Express serving dist/) on :3001
pnpm run build && PORT=3001 RESEND_API_KEY="re_xxx" pnpm start
```

Set `VITE_API_URL=http://localhost:3001` in `.env` to point the dev frontend at the local backend.

---

## Incident History

### April 11, 2026 — Feedback Email Not Delivering

- **Root cause:** Edge function v7 sent notifications to `updates@laneysworld.com`, which has no mailbox behind the MX record. Emails were dispatched by Resend (API 200) but dropped at the AWS SES inbound gateway.
- **Fix:** Updated `to` address to `kallen1286@gmail.com` in edge function v8.
- **Full report:** [Google Doc — Incident Report](https://docs.google.com/document/d/1duFnRUBQSqE-wonEq8vaOxEVv-MuapFzOTzrMSVu5G0/edit)

### April 12, 2026 — Resend API Key Isolation

- **Issue:** LaneysWorld and TradeEscape shared a single Resend API key. A queued v7 email was delivered from `support@tradeescape.com` instead of `updates@laneysworld.com`.
- **Fix:** Created a dedicated Resend API key scoped to `laneysworld.com` sending only. Projects are now fully isolated.

### June 8, 2026 — Migration off Figma Sites + Supabase

- **Change:** Replaced Figma Sites frontend with the Vite/React app committed in PR #2. Removed the Supabase edge function (`make-server-6b4cfc8d`) and `kv_store_6b4cfc8d` table entirely; the feedback endpoint now lives in `server/index.mjs` and calls Resend directly. Hosting moved to Railway.

### June 8, 2026 — Railway Restart Loop

- **Root cause:** Railway dashboard had a stale "Custom Start Command" override of `npm install && node index.mjs`, which fought the pnpm-based build and crashed on the Figma-Make-shaped `package.json` keys.
- **Fix:** Cleared the dashboard override so Railpack uses the `start` script from `package.json` (`node server/index.mjs`). Container now boots cleanly on port 8080.

### June 8, 2026 — Perf + SEO + Security Hardening (PR #6)

- **Change:** Added helmet + CSP, fixed asset cache headers, switched `robots` from `noindex` to `index,follow`, added OG/Twitter cards + JSON-LD structured data, code-split `FeedbackModal` and `PrivacyPolicy`, and re-encoded hero images (23 MB → 4 MB) via a new `scripts/optimize-images.mjs` pipeline.

### June 9, 2026 — First-party Analytics Pipeline (PRs #10–#12)

- **Change:** Stood up a first-party Postgres analytics pipeline alongside GA4.
  - **PR #10:** Added `pg`, `server/db.mjs`, `sessions` + `events` schema, migration runner, `/health` DB ping.
  - **PR #11:** `POST /e` ingest endpoint with `anon_id` cookie, GPC + DNT honoring (fully silent), token-bucket rate limit, allow-listed event names, 90-day retention via `pnpm run db:purge`. Privacy Policy updated.
  - **PR #12:** Frontend `trackEvent`/`trackPageView` SDK dual-writes to GA4 and `POST /e` (via `sendBeacon`); wires `page_view`, `section_view`, `video_play`, donate clicks, share, feedback, and external-link events.

### June 18, 2026 — Horizon Wordmark Brand Identity (PRs #13–#17)

- **PR #13** — Initial wing-silhouette brand mark + favicon set + refreshed OG image.
- **PR #14** — Tightened hero rhythm; switched footer to icon-only Ochre-sun mark.
- **PR #15** — Moved full lockup from hero into the "Anchored in Love & Joy" section.
- **PR #16** — Full Horizon Wordmark rollout: 5 logo touchpoints swapped, favicon/apple-touch/OG regenerated, JSON-LD updated, theme-color flipped to `#0F172A`.
- **PR #17** — Stripped baked white backdrop from logo SVGs (transparent placement on all surfaces, including the Anchored gradient).

### June 18, 2026 — Dynamic Dark Mode + Horizon Palette Sweep (PR #18)

- **Change:** OS-driven `.dark` class on `<html>` via inline anti-FOUC script + live `matchMedia` listener. Brand tokens (`--brand-ink`, `--brand-accent`, `--brand-surface`, etc.) defined for both modes via `@theme inline`.
- **Sweep:** 41 hardcoded `purple-*` / `pink-*` / `lavender-*` refs replaced with semantic tokens across `App.tsx`, `science-flowchart.tsx`, `FeedbackModal.tsx`, `animated-poem.tsx`, `PrivacyPolicy.tsx`. ~115 `text-gray-*` / `bg-white` refs given `dark:` variants.
- **Logo theme swap:** `MutationObserver` watches `<html>.class`; wordmark `<img src>` swaps to dark SVG when `.dark` active. Footer Ochre-sun stays theme-neutral.
- **Anchored + final-CTA gradients** preserved in light mode; Midnight→Ochre treatment in dark.

### June 18, 2026 — Privacy Page Logo + Codebase Cleanup (PR #19)

- **Privacy Policy page** still imported the legacy purple BPAN-silhouette PNG as a thumbnail. Swapped for theme-aware stacked Horizon Wordmark; bumped to `w-48 sm:w-56` so it reads as a brand mark.
- **Cleanup:** Deleted 44 unused shadcn/ui primitives (only `button`, `card`, `link`, `sonner`, `utils.ts` were imported by app code). Removed the orphan legacy silhouette PNG.
- **Impact:** 45 files removed, ~4,940 LOC deleted. CSS bundle: **127.67 kB → 67.98 kB (gzip 19.89 → 11.35, −47%)**.

### June 18, 2026 — Favicon Cache-Bust (PR #20)

- Added `?v=2` query string to all favicon `<link>` tags so browsers re-fetch the new Ochre-sun favicon instead of serving the cached legacy purple silhouette from bookmarks and the address bar.

### June 18, 2026 — Dark-Mode Contrast Repair (PR #21)

- PR #18's blanket `dark:text-Ice` sweep applied to text inside categorical color cards (medical centers, science flowchart, Essential Resource) that intentionally keep light surfaces in dark mode — producing white-on-near-white ghost text.
- **Fix:** Stripped `dark:text-*` overrides from those cards (they stay light in both modes — "islands of light" pattern). Added `dark:` gradient variant to the Find Expert Care section wrapper. Normalized the science flowchart's purple card #4 to match its categorical siblings.

---

*Delaney's World — Her joy is contagious. Her fight deserves action.*
