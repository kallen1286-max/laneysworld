# LaneysWorld.com

**Delaney's World** — Fighting BPAN through gene therapy research.

A charity website raising awareness and funding for BPAN (Beta-propeller Protein-Associated Neurodegeneration), a rare neurodegenerative disease affecting ~500 children worldwide. Built for Delaney, a brave 2-year-old whose joy is contagious and whose fight deserves action.

🌐 **Live site:** [laneysworld.com](https://www.laneysworld.com)

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

Health check. Returns `{ "status": "ok" }`.

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

All identifiers are random UUIDs assigned to a first-party cookie — no personally identifiable information is stored. See the Privacy Policy for details.

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

Last verified: June 8, 2026 (post-Railway cutover)

### Live Records

| Type | Host | Value | Purpose |
|------|------|-------|---------|
| CNAME | `www.laneysworld.com` | `kzwz52r1.up.railway.app` | Production traffic → Railway |
| A | `laneysworld.com` | `204.69.207.1` | Apex (still pointed at Figma; redirect via `www` recommended) |
| MX | `send.laneysworld.com` | `feedback-smtp.us-east-1.amazonses.com` (prio 10) | Resend bounce handling |
| TXT | `laneysworld.com` | `v=spf1 include:amazonses.com ~all` | Root SPF |
| TXT | `send.laneysworld.com` | `v=spf1 include:amazonses.com ~all` | Send subdomain SPF |
| TXT | `resend._domainkey.laneysworld.com` | DKIM public key (RSA) | DKIM signing |
| TXT | `_dmarc.laneysworld.com` | `v=DMARC1; p=quarantine; rua=mailto:...` | DMARC policy |
| TXT | `_acme-challenge.laneysworld.com` | ACME challenge tokens | TLS certificate issuance |

### Records Pending Removal

| Type | Host | Reason |
|------|------|--------|
| TXT | `_figma_sites_verify_www.laneysworld.com` | Figma Sites no longer used |
| MX | `laneysworld.com` (inbound SES) | No active mailbox |
| TXT | `default._domainkey.laneysworld.com` | Confirm Resend doesn't need it, then drop |

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
│   ├── og-image.jpg          # 1200x630 social card
│   └── logo.png              # 512x512 (referenced by JSON-LD)
├── scripts/
│   └── optimize-images.mjs   # sharp / MozJPEG image pre-processor
├── src/                      # React + TypeScript app
│   ├── main.tsx
│   ├── app/
│   │   ├── App.tsx           # Lazy-loads FeedbackModal + PrivacyPolicy
│   │   ├── components/
│   │   ├── data/
│   │   └── utils/
│   ├── assets/               # Optimized hero/photo images
│   └── styles/
├── server/                   # Express backend
│   ├── package.json          # express + cors (helmet hoisted from root)
│   └── index.mjs             # /health, /feedback, helmet+CSP, static dist/
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

---

*Delaney's World — Her joy is contagious. Her fight deserves action.*
