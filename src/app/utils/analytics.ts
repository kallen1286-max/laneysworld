/**
 * Shared GA4 event tracking utility.
 * Re-exported by App.tsx, science-flowchart.tsx, and FeedbackModal.tsx
 * so there is only one definition to maintain.
 */
export const trackEvent = (
  eventName: string,
  eventParams?: Record<string, any>
): void => {
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', eventName, eventParams);
  }
};
