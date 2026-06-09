// PostgreSQL connection layer for LaneysWorld.
//
// Reads DATABASE_URL from the environment (Railway-injected via the Postgres
// service variable reference). Falls back to a no-op stub in environments
// where the DB is not configured, so the Express server still starts cleanly
// during local development without Postgres running.
//
// Usage:
//   import { query, dbHealthy, isDbConfigured } from './db.mjs';
//   const { rows } = await query('SELECT 1');

import pg from 'pg';

const { Pool } = pg;

const DATABASE_URL = process.env.DATABASE_URL;

/** Whether a Postgres connection string is configured. */
export const isDbConfigured = Boolean(DATABASE_URL);

/**
 * Shared connection pool. Created lazily on first import so that
 * environments without DATABASE_URL never open a socket.
 */
let pool = null;

if (isDbConfigured) {
  pool = new Pool({
    connectionString: DATABASE_URL,
    // Railway's managed Postgres uses TLS but with an internal CA.
    // Local Postgres (docker, localhost) usually doesn't.
    ssl: shouldUseSsl(DATABASE_URL) ? { rejectUnauthorized: false } : false,
    max: 5,                       // small site, small pool
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 5_000,
  });

  pool.on('error', (err) => {
    // Don't crash the process on idle client errors — just log.
    console.error('[db] idle client error:', err.message);
  });
}

function shouldUseSsl(url) {
  // No SSL for localhost / 127.0.0.1 / docker-compose hostnames.
  if (/@(localhost|127\.0\.0\.1|host\.docker\.internal)/.test(url)) return false;
  return true;
}

/**
 * Run a parameterised SQL query. Throws if DB is not configured.
 * @param {string} text
 * @param {Array<any>} [params]
 */
export async function query(text, params) {
  if (!pool) {
    throw new Error('Database not configured (DATABASE_URL is unset).');
  }
  return pool.query(text, params);
}

/**
 * Best-effort health check. Returns true if the DB responds to SELECT 1
 * within a short timeout, false otherwise. Never throws.
 */
export async function dbHealthy() {
  if (!pool) return false;
  try {
    const res = await pool.query('SELECT 1 as ok');
    return res.rows[0]?.ok === 1;
  } catch (err) {
    console.error('[db] health check failed:', err.message);
    return false;
  }
}

/** Close the pool — for graceful shutdown / tests. */
export async function closePool() {
  if (pool) {
    await pool.end();
    pool = null;
  }
}
