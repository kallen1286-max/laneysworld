-- =============================================================================
-- LaneysWorld Analytics Schema — Migration 001
-- =============================================================================
-- Two-table event store for first-party visitor analytics:
--   * events    — every individual interaction (page views, clicks, scrolls, etc.)
--   * sessions  — per-session rollup, refreshed by the API on each event
--
-- Design notes:
--   * No personally identifiable information is stored. Anon IDs are random
--     UUIDs assigned to a first-party cookie.
--   * No raw IP addresses or user-agents are persisted — only derived fields
--     (country approximation, user-agent family, device class).
--   * `props` is JSONB so each event type can carry its own shape without
--     schema migrations. Index it with GIN when query patterns emerge.
--   * Partitioning by month is deferred. At expected charity-site volume
--     (10s-100s of events/day), a single table is fine for years.
-- =============================================================================

-- Use the pgcrypto extension for gen_random_uuid() (available on Railway PG by default).
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- -----------------------------------------------------------------------------
-- sessions
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sessions (
  session_id    UUID PRIMARY KEY,
  anon_id       UUID NOT NULL,
  first_ts      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_ts       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  entry_page    TEXT,
  exit_page     TEXT,
  referrer      TEXT,
  utm_source    TEXT,
  utm_medium    TEXT,
  utm_campaign  TEXT,
  ua_family     TEXT,         -- e.g. "Chrome", "Safari", "Firefox", "Edge"
  device_type   TEXT,         -- "mobile" | "tablet" | "desktop"
  country       TEXT,         -- ISO-2 country code if derivable, else NULL
  event_count   INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS sessions_anon_id_idx ON sessions (anon_id);
CREATE INDEX IF NOT EXISTS sessions_first_ts_idx ON sessions (first_ts DESC);
CREATE INDEX IF NOT EXISTS sessions_utm_source_idx ON sessions (utm_source) WHERE utm_source IS NOT NULL;

-- -----------------------------------------------------------------------------
-- events
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS events (
  event_id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id    UUID NOT NULL REFERENCES sessions(session_id) ON DELETE CASCADE,
  anon_id       UUID NOT NULL,
  name          TEXT NOT NULL,                                  -- e.g. "page_view", "donate_cta_click"
  ts            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  page_path     TEXT,
  props         JSONB NOT NULL DEFAULT '{}'::jsonb              -- event-specific payload
);

CREATE INDEX IF NOT EXISTS events_session_id_idx ON events (session_id);
CREATE INDEX IF NOT EXISTS events_anon_id_ts_idx ON events (anon_id, ts DESC);
CREATE INDEX IF NOT EXISTS events_name_ts_idx ON events (name, ts DESC);
CREATE INDEX IF NOT EXISTS events_ts_idx ON events (ts DESC);

-- -----------------------------------------------------------------------------
-- migrations bookkeeping
-- -----------------------------------------------------------------------------
-- Tracks which migrations have been applied so the runner is idempotent
-- and we can add 002, 003, etc. without re-running everything.
CREATE TABLE IF NOT EXISTS schema_migrations (
  version     TEXT PRIMARY KEY,
  applied_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO schema_migrations (version)
VALUES ('001_init_analytics')
ON CONFLICT (version) DO NOTHING;
