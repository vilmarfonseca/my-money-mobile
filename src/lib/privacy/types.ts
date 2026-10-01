// Synced from my-money-v2 (src/lib/privacy/types.ts). Do not edit here: change it
// in the web repo and run `npm run sync:web`.
/**
 * Content model for the Privacy Policy page. The policy is authored as data
 * in `src/lib/i18n/messages.ts` (once per language) and rendered by
 * `src/components/privacy/*`, so both languages share one layout and the
 * legal text never lives in JSX.
 */

export type PrivacyBlock =
  | { type: "p"; text: string }
  | { type: "h3"; text: string }
  | { type: "list"; items: string[] }
  | { type: "note"; text: string }
  | { type: "table"; head: [string, string]; rows: [string, string][] }
  /** The contact line (email, contact form, company) from `privacy.contact`. */
  | { type: "contact" };

export type PrivacySection = {
  /** Anchor id, also the table-of-contents target. */
  id: string;
  title: string;
  blocks: PrivacyBlock[];
};
