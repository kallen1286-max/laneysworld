# LaneysWorld.com

**Delaney's World** — Fighting BPAN through gene therapy research.

A charity website raising awareness and funding for BPAN (Beta-propeller Protein-Associated Neurodegeneration), a rare neurodegenerative disease affecting ~500 children worldwide. Built for Delaney, a brave 2-year-old whose joy is contagious and whose fight deserves action.

🌐 **Live site:** [laneysworld.com](https://www.laneysworld.com)

---

## Architecture

| Layer | Technology | Details |
|-------|-----------|---------|
| **Frontend** | Vite + React 18 + TypeScript | Tailwind CSS 4, Radix UI, lucide-react, Motion |
| **Backend** | Node.js + Express | `server/index.mjs` — feedback endpoint, calls Resend directly |
| **Email** | Resend API | Scoped API key, custom domain `laneysworld.com` |
| **Hosting** | Railway | Auto-deploys from `main` via Railpack |
| **DNS** | Porkbun | Nameservers: `*.ns.porkbun.com` |
| **Analytics** | Google Analytics | GA4 ID: `G-BJL7K6S6PC` |

The site previously ran on Figma Sites + a Supabase edge function. As of June 2026, both have been removed in favor of a single repo containing the Vite frontend and a small Express backend that talks to Resend directly.

---

## Backend Endpoints

Implemented in `server/index.mjs`.

### `GET /health`

Health check. Returns `{ "status": "ok" }`.

### `POST /feedback`

Accepts user feedback from the site's contact form.

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
3. Sends an HTML notification email via Resend to `kallen1286@gmail.com`
4. Returns `{ success: true, message: "Thank you for your message!", feedbackId }`

> Feedback is no longer persisted to a database — it is dispatched directly as email. If long-term storage is needed later, wire up Railway Postgres or any other store inside `/feedback`.

---

## Environment Variables

| Variable | Where | Description |
|----------|-------|-------------|
| `RESEND_API_KEY` | Backend (Railway) | Scoped Resend key for `laneysworld.com` **only** (isolated from TradeEscape) |
| `PORT` | Backend (Railway) | Defaults to `3001` locally; Railway sets this automatically |
| `VITE_API_URL` | Frontend (build time) | Base URL of the backend, e.g. `https://laneysworld.up.railway.app`. Leave empty to call same-origin. |

See `.env.example` for reference.

---

## Resend Configuration

- **Sending address:** `Delaney's World <updates@laneysworld.com>`
- **Notification recipient:** `kallen1286@gmail.com`
- **Reply-to:** Set dynamically to the submitter's email
- **API endpoint:** `https://api.resend.com/emails`
- **Dashboard:** [resend.com/emails](https://resend.com/emails)

### API Key Isolation

As of April 12, 2026, LaneysWorld and TradeEscape use **separate Resend API keys** scoped to their respective domains:

| Project | Resend API Key Scope | Domain |
|---------|---------------------|--------|
| LaneysWorld | Sending access only | `laneysworld.com` |
| TradeEscape | Separate key | `tradeescape.com` |

This prevents cross-domain sending. To rotate the LaneysWorld key: create a new key at [resend.com/api-keys](https://resend.com/api-keys) scoped to `laneysworld.com`, then update `RESEND_API_KEY` in the Railway service variables.

### Email Template

Notification emails include:
- Branded header: "📬 New Message — Delaney's World" with blue accent bar (`#2563eb`)
- Sender name and email (with mailto link)
- Full message text in a styled blue card
- Feedback ID and timestamp (Eastern time)

---

## DNS Configuration (Porkbun)

Last verified: April 12, 2026

### Core Records

| Type | Host | Value | TTL |
|------|------|-------|-----|
| A | `laneysworld.com` | `204.69.207.1` | 600 |
| CNAME | `www.laneysworld.com` | `sites.figma.net` | 600 |

> The `www` CNAME still points at `sites.figma.net`. Once the Railway deployment is verified, swap this to the Railway-provided CNAME and remove the Figma verification TXT record.

### Email (Resend)

| Type | Host | Value | TTL | Purpose |
|------|------|-------|-----|---------|
| MX | `send.laneysworld.com` | `feedback-smtp.us-east-1.amazonses.com` (prio 10) | 600 | Resend bounce handling |
| TXT | `send.laneysworld.com` | `v=spf1 include:amazonses.com ~all` | 600 | SPF for send subdomain |
| TXT | `resend._domainkey.laneysworld.com` | DKIM public key (RSA) | 600 | DKIM signing |
| TXT | `default._domainkey.laneysworld.com` | DKIM public key (RSA) | 300 | Additional DKIM key |
| TXT | `_dmarc.laneysworld.com` | `v=DMARC1; p=quarantine; rua=mailto:...@mxtoolbox.dmarc-report.com` | 300 | DMARC policy |

### Other

| Type | Host | Value | TTL | Purpose |
|------|------|-------|-----|---------|
| MX | `laneysworld.com` | `inbound-smtp.us-east-1.amazonaws.com` (prio 10) | 600 | AWS SES inbound (no active mailbox) |
| TXT | `_figma_sites_verify_www.laneysworld.com` | Figma Sites verification token | 600 | Domain ownership for Figma — can be removed after Railway cutover |
| TXT | `_acme-challenge.laneysworld.com` | Two ACME challenge tokens | 600 | SSL certificate provisioning |

### Recommended DNS Additions

| Type | Host | Value | Notes |
|------|------|-------|-------|
| TXT | `laneysworld.com` | `v=spf1 include:amazonses.com ~all` | Root SPF — currently missing |

---

## File Structure

```
laneysworld/
├── README.md
├── .env.example
├── .gitignore
├── package.json              # Vite frontend, pnpm@9.15.9
├── pnpm-lock.yaml
├── pnpm-workspace.yaml
├── vite.config.ts
├── postcss.config.mjs
├── index.html
├── default_shadcn_theme.css
├── src/                      # React + TypeScript app
│   ├── main.tsx
│   ├── app/
│   ├── assets/
│   └── styles/
├── server/                   # Express backend
│   ├── package.json
│   └── index.mjs             # /health and /feedback
└── .github/
    └── workflows/
        └── frontend-ci.yml   # CI: pnpm install + vite build, sticky bot PR comments
```

### Branch Protection

- **GitHub Ruleset:** "Protect main — require CI" (ID: 14955287)
- All changes to `main` must go through a PR
- Required status check: `Vite Build` must pass

---

## Deployment

### Railway

The repo auto-deploys to Railway on every push to `main`. Railpack reads `packageManager: pnpm@9.15.9` from `package.json`, installs with pnpm, and runs the configured build/deploy commands.

### Local Development

```bash
# Install dependencies (pnpm required — see packageManager in package.json)
pnpm install

# Run the Vite dev server
pnpm dev

# In a separate terminal, run the Express backend
cd server && node index.mjs
```

Set `VITE_API_URL=http://localhost:3001` in a `.env` file at the repo root to point the frontend at the local backend during development.

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

---

*Delaney's World — Her joy is contagious. Her fight deserves action.*
