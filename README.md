# LaneysWorld.com

**Delaney's World** — Fighting BPAN through gene therapy research.

A charity website raising awareness and funding for BPAN (Beta-propeller Protein-Associated Neurodegeneration), a rare neurodegenerative disease affecting ~500 children worldwide. Built for Delaney, a brave 2-year-old whose joy is contagious and whose fight deserves action.

🌐 **Live site:** [laneysworld.com](https://www.laneysworld.com)

---

## Architecture

| Layer | Technology | Details |
|-------|-----------|---------|
| **Frontend** | Figma Make (Figma Sites) | Static site hosted via `sites.figma.net` |
| **Backend** | Supabase Edge Functions | Hono framework on Deno runtime |
| **Database** | Supabase Postgres | `kv_store_6b4cfc8d` table (key-value) |
| **Email** | Resend API | Scoped API key, custom domain `laneysworld.com` |
| **DNS** | Porkbun | Nameservers: `*.ns.porkbun.com` |
| **Analytics** | Google Analytics | GA4 ID: `G-BJL7K6S6PC` |

### Supabase

- **Project:** Delaney's World website
- **Project ID:** `gzphjcwligemkrnhtvec`
- **Region:** us-east-1
- **Dashboard:** [supabase.com/dashboard/project/gzphjcwligemkrnhtvec](https://supabase.com/dashboard/project/gzphjcwligemkrnhtvec)

### Edge Function

- **Slug:** `make-server-6b4cfc8d`
- **Runtime:** Deno (Supabase Edge Runtime)
- **Framework:** Hono
- **Current version:** 11
- **JWT Verification:** ON (legacy secret — anon key satisfies)

---

## Edge Function Endpoints

### `GET /make-server-6b4cfc8d/health`

Health check. Returns `{ "status": "ok" }`.

### `POST /make-server-6b4cfc8d/feedback`

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
3. Stores the entry in `kv_store_6b4cfc8d` via Supabase Postgres
4. Sends an HTML notification email via Resend to `kallen1286@gmail.com`
5. Returns `{ success: true, message: "Thank you for your message!", feedbackId }`

**Full endpoint URL:**
```
https://gzphjcwligemkrnhtvec.supabase.co/functions/v1/make-server-6b4cfc8d/feedback
```

---

## Environment Variables

Set in **Supabase Dashboard → Edge Functions → Secrets**:

| Variable | Description |
|----------|-------------|
| `SUPABASE_URL` | Auto-injected by Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Auto-injected by Supabase |
| `RESEND_API_KEY` | Scoped Resend key for `laneysworld.com` **only** (isolated from TradeEscape) |

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

This prevents cross-domain sending. To rotate the LaneysWorld key: create a new key at [resend.com/api-keys](https://resend.com/api-keys) scoped to `laneysworld.com`, then update `RESEND_API_KEY` in the Supabase edge function secrets.

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
| TXT | `_figma_sites_verify_www.laneysworld.com` | Figma Sites verification token | 600 | Domain ownership for Figma |
| TXT | `_acme-challenge.laneysworld.com` | Two ACME challenge tokens | 600 | SSL certificate provisioning |

### Recommended DNS Additions

| Type | Host | Value | Notes |
|------|------|-------|-------|
| TXT | `laneysworld.com` | `v=spf1 include:amazonses.com ~all` | Root SPF — currently missing |

---

## Database Schema

### `kv_store_6b4cfc8d`

```sql
CREATE TABLE kv_store_6b4cfc8d (
  key TEXT NOT NULL PRIMARY KEY,
  value JSONB NOT NULL
);
```

Feedback entries are stored with key format `feedback_{timestamp}_{random}` and value:

```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "feedback": "Message text here",
  "timestamp": 1775932376650,
  "source": "delaneys_world"
}
```

RLS is enabled on this table. The edge function uses the service role key to bypass RLS.

---

## Incident History

### April 11, 2026 — Feedback Email Not Delivering

- **Root cause:** Edge function v7 sent notifications to `updates@laneysworld.com`, which has no mailbox behind the MX record. Emails were dispatched by Resend (API 200) but dropped at the AWS SES inbound gateway.
- **Fix:** Updated `to` address to `kallen1286@gmail.com` in edge function v8.
- **Full report:** [Google Doc — Incident Report](https://docs.google.com/document/d/1duFnRUBQSqE-wonEq8vaOxEVv-MuapFzOTzrMSVu5G0/edit)

### April 12, 2026 — Resend API Key Isolation

- **Issue:** LaneysWorld and TradeEscape shared a single Resend API key. A queued v7 email was delivered from `support@tradeescape.com` instead of `updates@laneysworld.com`.
- **Fix:** Created a dedicated Resend API key scoped to `laneysworld.com` sending only. Updated `RESEND_API_KEY` secret in Supabase. Projects are now fully isolated.

---

## File Structure

```
laneysworld/
├── README.md
├── .env.example
├── .gitignore
├── .github/
│   └── workflows/
│       └── lint.yml              # CI: Deno lint, type check, import validation
└── supabase/
    └── functions/
        └── make-server-6b4cfc8d/
            ├── index.tsx          # Main edge function (Hono server)
            └── kv_store.tsx       # KV store interface (Supabase Postgres)
```

### Branch Protection

- **GitHub Ruleset:** "Protect main — require CI" (ID: 14955287)
- All changes to `main` must go through a PR
- Required status check: `Deno Lint & Type Check` must pass
- PR comments posted automatically with pass/fail table and expandable error details

---

## Deployment

The edge function is deployed via the Supabase dashboard or CLI:

```bash
supabase functions deploy make-server-6b4cfc8d --project-ref gzphjcwligemkrnhtvec
```

The frontend is managed in Figma and published via Figma Sites. DNS CNAME for `www` points to `sites.figma.net`.

---

## Future Migration Notes

If migrating off Figma Make to a custom frontend (e.g., Vite + React + Tailwind):

1. Scaffold new project, rebuild the single-page layout
2. Reuse the same Supabase edge function endpoint — no backend changes needed
3. Deploy frontend to Railway/Vercel/Netlify
4. Update `www.laneysworld.com` CNAME from `sites.figma.net` to new host
5. Move GA4 snippet (`G-BJL7K6S6PC`) to new codebase
6. Verify SSL, test feedback form, confirm email delivery

---

*Delaney's World — Her joy is contagious. Her fight deserves action.*
