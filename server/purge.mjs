// =============================================================================
// LaneysWorld Analytics Purge — 90-day raw-event retention
// =============================================================================
// Deletes events older than RETENTION_DAYS (default 90) and any sessions that
// no longer have events. Designed to be run by a Railway scheduled job
// (`pnpm run db:purge`) once per day during quiet hours, but is safe to run
// any time — purely additive deletes.
//
// Rationale: rare-disease NPO best practice is to retain raw analytics for a
// short, defensible window (30-90 days) and rely on aggregated rollups for
// longer-horizon analysis. 90 days lets us see QoQ donate-funnel trends
// without holding identifiable cohort data indefinitely.
// =============================================================================

import { query, closePool, isDbConfigured } from './db.mjs';

const RETENTION_DAYS = Number(process.env.ANALYTICS_RETENTION_DAYS || 90);

async function main() {
  if (!isDbConfigured) {
    console.error('[purge] DATABASE_URL is not set; refusing to run.');
    process.exit(1);
  }

  console.log(`[purge] retention = ${RETENTION_DAYS} days`);

  // 1) Delete old events. ON DELETE CASCADE doesn't trigger here because we're
  //    deleting from the child table; sessions get cleaned up in step 2.
  const deletedEvents = await query(
    `DELETE FROM events
       WHERE ts < NOW() - ($1 || ' days')::interval`,
    [String(RETENTION_DAYS)],
  );
  console.log(`[purge] deleted events: ${deletedEvents.rowCount}`);

  // 2) Delete sessions with no remaining events AND whose last activity is
  //    also outside the retention window. Belt-and-suspenders — keeps the
  //    table tidy without dropping fresh sessions that just haven't logged
  //    an event yet.
  const deletedSessions = await query(
    `DELETE FROM sessions s
       WHERE s.last_ts < NOW() - ($1 || ' days')::interval
         AND NOT EXISTS (
           SELECT 1 FROM events e WHERE e.session_id = s.session_id
         )`,
    [String(RETENTION_DAYS)],
  );
  console.log(`[purge] deleted sessions: ${deletedSessions.rowCount}`);

  await closePool();
  console.log('[purge] Done.');
}

main().catch(async (err) => {
  console.error('[purge] failed:', err);
  await closePool().catch(() => {});
  process.exit(1);
});
