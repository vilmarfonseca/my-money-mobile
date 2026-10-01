// Synced from my-money-v2 (src/lib/analytics/analytics-actions.ts). Do not edit here: change it
// in the web repo and run `npm run sync:web`.
/**
 * Persists the visible analytics card set as boolean flags inside
 * `users.preferences` (`analyticsCard:<id>`), writing every catalog id
 * explicitly so "never customized" (no flags) stays distinguishable from
 * "deselected everything".
 */
export declare function saveAnalyticsCardSelection(selectedIds: string[]): Promise<{
    ok: boolean;
}>;
