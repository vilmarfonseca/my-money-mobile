// Synced from my-money-v2 (src/lib/analytics/analytics-catalog.ts). Do not edit here: change it
// in the web repo and run `npm run sync:web`.
/**
 * Client-safe catalog for the Analytics page: which cards exist, the section
 * each belongs to, its layout span, and the default visible set (the first
 * card of every section). Titles and descriptions live in the i18n messages
 * under `analytics.cards.<id>`.
 */

export const ANALYTICS_SECTION_IDS = [
  "overview",
  "ahead",
  "spend",
  "compare",
] as const;
export type AnalyticsSectionId = (typeof ANALYTICS_SECTION_IDS)[number];

export type AnalyticsCardId =
  | "sankey"
  | "networth"
  | "saverate"
  | "heatmap"
  | "balance"
  | "compound"
  | "runway"
  | "goals"
  | "budget"
  | "recurring"
  | "effsave"
  | "merchants"
  | "unusual"
  | "subs"
  | "benchmarks"
  | "thisvslast"
  | "seasonality";

export type AnalyticsCardDef = {
  id: AnalyticsCardId;
  section: AnalyticsSectionId;
  /** Grid columns the live card spans on desktop. */
  span: 1 | 2;
};

/** Ordered catalog — order within a section is the render order. */
export const ANALYTICS_CATALOG: readonly AnalyticsCardDef[] = [
  // Overview
  { id: "sankey", section: "overview", span: 2 },
  { id: "networth", section: "overview", span: 1 },
  { id: "saverate", section: "overview", span: 1 },
  { id: "heatmap", section: "overview", span: 2 },
  // Look ahead
  { id: "balance", section: "ahead", span: 2 },
  { id: "compound", section: "ahead", span: 2 },
  { id: "runway", section: "ahead", span: 1 },
  { id: "goals", section: "ahead", span: 1 },
  // Where it goes
  { id: "budget", section: "spend", span: 2 },
  { id: "recurring", section: "spend", span: 1 },
  { id: "effsave", section: "spend", span: 1 },
  { id: "merchants", section: "spend", span: 1 },
  { id: "unusual", section: "spend", span: 1 },
  { id: "subs", section: "spend", span: 1 },
  { id: "benchmarks", section: "spend", span: 1 },
  // Compare
  { id: "thisvslast", section: "compare", span: 2 },
  { id: "seasonality", section: "compare", span: 2 },
];

export const ANALYTICS_CARD_IDS = ANALYTICS_CATALOG.map((card) => card.id);

/** Default visible set: the first card of each section. */
export const DEFAULT_ANALYTICS_CARDS: readonly AnalyticsCardId[] =
  ANALYTICS_SECTION_IDS.map(
    (section) =>
      ANALYTICS_CATALOG.find((card) => card.section === section)!.id,
  );

export function isAnalyticsCardId(value: string): value is AnalyticsCardId {
  return (ANALYTICS_CARD_IDS as string[]).includes(value);
}

/** Preference key holding a card's visibility in `users.preferences`. */
export const analyticsCardPreferenceKey = (id: AnalyticsCardId) =>
  `analyticsCard:${id}`;

/**
 * Resolves the visible card set from the stored preference flags. Users who
 * never customized (no analytics keys at all) get the defaults.
 */
export function resolveSelectedAnalyticsCards(
  preferences: Record<string, boolean> | null | undefined,
): AnalyticsCardId[] {
  const hasAnyFlag = ANALYTICS_CARD_IDS.some(
    (id) => typeof preferences?.[analyticsCardPreferenceKey(id)] === "boolean",
  );
  if (!hasAnyFlag) {
    return [...DEFAULT_ANALYTICS_CARDS];
  }
  return ANALYTICS_CARD_IDS.filter(
    (id) => preferences?.[analyticsCardPreferenceKey(id)] === true,
  );
}
