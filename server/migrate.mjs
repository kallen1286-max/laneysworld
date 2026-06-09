#!/usr/bin/env node
// =============================================================================
// LaneysWorld migration runner
// =============================================================================
// Applies every *.sql file in ./migrations/ in lexicographic order, recording
// each applied version in schema_migrations. Safe to re-run — already-applied
// migrations are skipped (assumes each file's INSERT into schema_migrations
// uses ON CONFLICT DO NOTHING; the 001 file does).
//
// Usage:
//   pnpm run db:migrate           # against DATABASE_URL in env / .env
//
// Designed for Railway: run once from the Railway service shell after
// DATABASE_URL is wired up, then leave alone unless a new migration is added.
// =============================================================================

import { readdir, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import pg from 'pg';

const { Client } = pg;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const migrationsDir = path.join(__dirname, 'migrations');

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error('[migrate] DATABASE_URL is not set. Aborting.');
    process.exit(1);
  }

  const client = new Client({
    connectionString: url,
    ssl: /@(localhost|127\.0\.0\.1|host\.docker\.internal)/.test(url)
      ? false
      : { rejectUnauthorized: false },
  });

  await client.connect();
  console.log('[migrate] Connected.');

  // Make sure the bookkeeping table exists before we try to read from it.
  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version     TEXT PRIMARY KEY,
      applied_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  const { rows: applied } = await client.query('SELECT version FROM schema_migrations');
  const appliedSet = new Set(applied.map((r) => r.version));
  console.log(`[migrate] Already applied: ${[...appliedSet].sort().join(', ') || '(none)'}`);

  const files = (await readdir(migrationsDir))
    .filter((f) => f.endsWith('.sql'))
    .sort();

  let appliedCount = 0;
  for (const file of files) {
    const version = file.replace(/\.sql$/, '');
    if (appliedSet.has(version)) {
      console.log(`[migrate] = skip ${version}`);
      continue;
    }
    const sql = await readFile(path.join(migrationsDir, file), 'utf8');
    console.log(`[migrate] > applying ${version} (${sql.length} bytes)`);
    try {
      await client.query('BEGIN');
      await client.query(sql);
      await client.query('COMMIT');
      console.log(`[migrate] + applied ${version}`);
      appliedCount++;
    } catch (err) {
      await client.query('ROLLBACK').catch(() => {});
      console.error(`[migrate] ! FAILED ${version}: ${err.message}`);
      throw err;
    }
  }

  console.log(`[migrate] Done. ${appliedCount} new migration(s) applied.`);
  await client.end();
}

main().catch((err) => {
  console.error('[migrate] fatal:', err);
  process.exit(1);
});
