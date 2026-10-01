// Synced from my-money-v2 (src/lib/integrations/google-calendar/types.ts). Do not edit here: change it
// in the web repo and run `npm run sync:web`.
import type { DueType } from "@/lib/calendar/types";

/**
 * Scheduled-item types the user can choose to sync to Google Calendar. Mirrors
 * the `scheduled_type` enum; the user picks any subset on the settings card.
 */
export const SYNCABLE_TYPES = [
  "bill",
  "subscription",
  "credit",
  "income",
  "tax",
  "loan",
] as const satisfies readonly DueType[];

export type SyncableType = (typeof SYNCABLE_TYPES)[number];

/** Default selection applied when a user first connects: everything. */
export const DEFAULT_SYNC_TYPES: SyncableType[] = [...SYNCABLE_TYPES];

export function isSyncableType(value: string): value is SyncableType {
  return (SYNCABLE_TYPES as readonly string[]).includes(value);
}

/** Keep only recognized types, preserving canonical order. */
export function normalizeSyncTypes(values: readonly string[]): SyncableType[] {
  return SYNCABLE_TYPES.filter((type) => values.includes(type));
}
