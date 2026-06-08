# Migration Plan: Supabase → Railway

## Context

The site currently uses a Supabase edge function (Deno/Hono) to handle feedback form submissions: it stores them in a Postgres KV table and sends an email via Resend. The goal is to eliminate Supabase entirely and consolidate on Railway — a platform the user already has a relationship with — by replacing the edge function with a Node.js/Express API server deployed on Railway, and moving the Vite frontend to Railway as a static site.

The KV store (`kv_store_6b4cfc8d`) is redundant — Resend logs every delivery and the email lands in `updates@laneysworld.com`. It will be dropped; no database is needed.

---

## Critical Files

| File | Action |
|---|---|
| `src/app/components/FeedbackModal.tsx` | Update `SERVER_URL` to use env var; remove `Authorization` header |
| `src/app/utils/supabase/info.tsx` | Delete (projectId and publicAnonKey no longer needed) |
| `src/app/supabase/functions/server/index.tsx` | Delete (replaced by Railway Express server) |
| `src/app/supabase/functions/server/kv_store.tsx` | Delete |
| `package.json` | Remove `@jsr/supabase__supabase-js` dependency |
| `server/index.js` | **Create** — new Express API server |
| `server/package.json` | **Create** — Node.js dependencies for API |

---

## Step-by-Step Implementation

### Step 1 — Create the Express API server

Create `server/package.json`:
```json
{
  "name": "laneysworld-api",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "start": "node index.js"
  },
  "dependencies": {
    "cors": "^2.8.5",
    "express": "^4.18.2"
  }
}
```

Create `server/index.js` — port the Deno/Hono logic to Express/Node:
- `GET /health` → `{ status: "ok" }`
- `POST /feedback` → validate email + message, call Resend API, return success/error
- Keep identical email HTML template from current `index.tsx`
- Read `RESEND_API_KEY` from `process.env`
- CORS: allow `*` (or lock to `https://laneysworld.com` after DNS cutover)
- No auth header required — the Supabase anon key was never validated server-side
- Use Node 18+ native `fetch` (no node-fetch needed)
- Listen on `process.env.PORT || 3001`

### Step 2 — Update `FeedbackModal.tsx`

Replace:
```ts
import { projectId, publicAnonKey } from '../utils/supabase/info';
const SERVER_URL = `https://${projectId}.supabase.co/functions/v1/make-server-6b4cfc8d`;
```
With:
```ts
const SERVER_URL = import.meta.env.VITE_API_URL ?? '';
```

In `handleSubmit`, remove the `Authorization` header from the fetch call entirely.

The `VITE_API_URL` will be set as a Railway environment variable on the frontend service, so no URL is hardcoded.

### Step 3 — Clean up Supabase artifacts

- Delete `src/app/utils/supabase/info.tsx`
- Delete `src/app/supabase/` directory (both files)
- In `package.json`, remove `"@jsr/supabase__supabase-js@2.49.8"` from `dependencies`

### Step 4 — Export from Figma Make and push to GitHub

Outside this editor:
1. Download/export the project from Figma Make
2. Create a new GitHub repo (e.g., `laneysworld`)
3. Push the full project (frontend + new `server/` directory)

### Step 5 — Deploy to Railway

Create a Railway project with **two services**:

**Service 1 — API (Node.js)**
- Source: same GitHub repo, root directory = `/server`
- Railway auto-detects Node.js via `package.json`
- Start command: `node index.js` (or via `npm start`)
- Environment variable: `RESEND_API_KEY=re_...` (the correct key from Resend dashboard)
- Deploy → note the generated URL, e.g. `https://laneysworld-api.up.railway.app`

**Service 2 — Frontend (Static site)**
- Source: same GitHub repo, root directory = `/` 
- Build command: `pnpm install && pnpm build`
- Publish directory: `dist`
- Environment variable: `VITE_API_URL=https://laneysworld-api.up.railway.app`
- Deploy

### Step 6 — Custom domain (Porkbun DNS)

In Railway frontend service → Settings → Domains → Add custom domain → `laneysworld.com`
Railway will provide a CNAME target (e.g. `laneysworld.up.railway.app`).

In Porkbun DNS:
- Delete the current CNAME/A record pointing to Figma Make
- Add a new CNAME record: `laneysworld.com` → Railway's provided target
- TTL: 300 (low, for faster propagation during cutover)

---

## Verification

1. **API health check**: `curl https://laneysworld-api.up.railway.app/health` → `{"status":"ok"}`
2. **Feedback form**: Submit the form on the live site → confirm success state appears in UI → confirm email arrives at `updates@laneysworld.com`
3. **DNS**: `dig laneysworld.com` resolves to Railway's IP (not Figma Make's)
4. **No Supabase references**: `grep -r "supabase" src/` returns no results
5. **Analytics**: GA4 `feedback_submit` and `generate_lead` events still fire (no changes to tracking logic)
