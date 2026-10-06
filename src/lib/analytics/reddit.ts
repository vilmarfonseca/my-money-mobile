// Synced from my-money-v2 (src/lib/analytics/reddit.ts). Do not edit here: change it
// in the web repo and run `npm run sync:web`.
/**
 * Conversion events for the Reddit Pixel, the two milestones a Reddit Ads
 * campaign optimises for: an account created and a paid plan bought.
 *
 * The pixel only exists for visitors who haven't opted out of marketing
 * cookies (see `TrackingScripts`), and it loads after hydration, usually
 * later than the effect reporting the event. Events fired before then wait in
 * `window.rdtPending`, which the pixel snippet replays right after its
 * `init`; when the pixel never loads they are never sent, which is the point.
 */

export type RedditConversion =
  | { event: "SignUp" }
  | {
      event: "Purchase";
      value: number;
      /** ISO 4217, upper case. */
      currency: string;
      itemCount: number;
      /** Lets Reddit drop a repeat of the same purchase. */
      conversionId: string;
    };

type RedditCommand = [command: string, ...args: unknown[]];

declare global {
  interface Window {
    rdt?: (...command: RedditCommand) => void;
    rdtPending?: RedditCommand[];
  }
}

export function trackRedditConversion({ event, ...metadata }: RedditConversion) {
  if (typeof window === "undefined") return;
  const command: RedditCommand =
    Object.keys(metadata).length > 0
      ? ["track", event, metadata]
      : ["track", event];
  if (window.rdt) {
    window.rdt(...command);
  } else {
    (window.rdtPending ??= []).push(command);
  }
}
