/**
 * Shared event tracking utility.
 *
 * Sends every event to TWO pipelines in parallel:
 *
 *   1. Google Analytics 4 (via window.gtag) — unchanged behaviour for existing
 *      call sites. Will be removed in PR #13 once the first-party pipeline is
 *      validated.
 *
 *   2. First-party POST /e — server-side Postgres analytics. Allow-list of
 *      event names is enforced by the server (see server/ingest.mjs); we map
 *      richer GA event names down to the smaller allow-list here.
 *
 * Privacy:
 *   - We short-circuit (send nothing to /e) if Global Privacy Control or DNT
 *     is set. The server enforces this too — this is just a network-save.
 *   - sendBeacon is used when available so events fire reliably on unload.
 *   - Failures are swallowed: analytics must never break the user's experience.
 */

// -- GA event name → first-party event name --------------------------------
// The server's allow-list is intentionally short. Anything richer rides in
// `props` so we can still slice in the dashboard later.
const NAME_MAP: Record<string, string> = {
  // 1:1
  page_view: 'page_view',
  section_view: 'section_view',
  // donate
  donate_button_click: 'donate_cta_click',
  donate_outbound: 'donate_outbound',
  // share / feedback
  share: 'share_click',
  share_click: 'share_click',
  feedback_submit: 'feedback_submitted',
  // video
  video_play: 'video_play',
  video_watched_25: 'video_watched_25',
  video_watched_50: 'video_watched_50',
  video_watched_75: 'video_watched_75',
  video_watched_100: 'video_watched_100',
  // Everything else outbound gets collapsed to external_click with kind=.
  youtube_external_click: 'external_click',
  partner_link_click: 'external_click',
  medical_resource_click: 'external_click',
  research_article_click: 'external_click',
  center_of_excellence_contact: 'external_click',
  center_of_excellence_website: 'external_click',
  social_media_click: 'external_click',
  video_transcript_open: 'external_click',
};

// Events we DON'T send first-party (too noisy or low signal for now).
const SKIP_FIRST_PARTY = new Set<string>([
  'scroll',                  // already covered by section_view
  'feedback_button_click',   // we already track the submit
  'feedback_modal_open',     // covered by submit
]);

// -- Opt-out detection ------------------------------------------------------
function isOptedOut(): boolean {
  if (typeof navigator === 'undefined') return false;
  // GPC is the legally relevant one in 2026 (CCPA/CPRA enforcement).
  // DNT is honored too because we said so in the Privacy Policy.
  const nav = navigator as Navigator & { globalPrivacyControl?: boolean };
  if (nav.globalPrivacyControl === true) return true;
  if (typeof navigator.doNotTrack === 'string' && navigator.doNotTrack === '1') return true;
  // Some older browsers expose DNT differently.
  const w = window as Window & { doNotTrack?: string };
  if (typeof w.doNotTrack === 'string' && w.doNotTrack === '1') return true;
  return false;
}

// -- First-party send -------------------------------------------------------
function sendFirstParty(eventName: string, params?: Record<string, unknown>): void {
  if (SKIP_FIRST_PARTY.has(eventName)) return;
  if (isOptedOut()) return;

  const mapped = NAME_MAP[eventName];
  if (!mapped) return; // unknown GA event — skip rather than 400

  // For events that collapse to external_click, stash the original GA name as
  // props.kind so we can still distinguish them in the dashboard.
  const props: Record<string, unknown> = { ...(params || {}) };
  if (mapped === 'external_click' && !props.kind) {
    props.kind = eventName;
  }

  const body = JSON.stringify({
    name: mapped,
    page_path: typeof window !== 'undefined' ? window.location.pathname : undefined,
    referrer: typeof document !== 'undefined' ? document.referrer || undefined : undefined,
    props,
  });

  try {
    // sendBeacon survives page unload; fall back to fetch.
    if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
      const blob = new Blob([body], { type: 'application/json' });
      const ok = navigator.sendBeacon('/e', blob);
      if (ok) return;
    }
    void fetch('/e', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      // include the anon_id cookie on every request
      credentials: 'same-origin',
      keepalive: true,
    }).catch(() => {/* analytics must never break UX */});
  } catch {
    /* analytics must never break UX */
  }
}

// -- Public API -------------------------------------------------------------
export const trackEvent = (
  eventName: string,
  eventParams?: Record<string, any>,
): void => {
  // 1) GA4 — unchanged.
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', eventName, eventParams);
  }
  // 2) First-party.
  sendFirstParty(eventName, eventParams);
};

/**
 * Fire a page_view to the first-party pipeline ONLY.
 *
 * GA4 already auto-emits page_view on initial load and on history changes via
 * `send_page_view: true`. Calling trackEvent('page_view', …) would double-count
 * in GA4, so this helper exists to keep first-party in step without polluting
 * the GA4 metric.
 */
export const trackPageView = (params?: { page_path?: string; page_title?: string }): void => {
  sendFirstParty('page_view', params);
};
