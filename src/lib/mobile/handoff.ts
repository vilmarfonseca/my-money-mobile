// Synced from my-money-v2 (src/lib/mobile/handoff.ts). Do not edit here: change it
// in the web repo and run `npm run sync:web`.
/**
 * Pages of the signed-in web app the native app hands off to in a browser,
 * for the flows that end on a third party's own page (Stripe, Google).
 *
 * Shared by the API method that mints the handoff link and the page that
 * consumes it, so neither can be pointed anywhere else.
 */
const HANDOFF_PATHS = [
  "/api/billing/checkout",
  "/api/billing/payment-method",
  "/api/billing/portal",
  "/api/integrations/google-calendar/connect",
] as const;

export function isHandoffPath(path: unknown): path is string {
  if (typeof path !== "string" || !path.startsWith("/")) return false;
  const pathname = path.split("?")[0];
  return HANDOFF_PATHS.some((allowed) => allowed === pathname);
}
