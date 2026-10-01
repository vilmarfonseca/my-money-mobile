// Synced from my-money-v2 (src/lib/calendar/calendar-queries.ts). Do not edit here: change it
// in the web repo and run `npm run sync:web`.
import { type ScopeContext } from "@/lib/db/current-scope";
import type { DueItem } from "./types";
/**
 * Server-only data access for the Calendar page. The calendar shows two
 * sources side by side: `scheduled_items` (standalone bills and dues) and the
 * ledger itself — a transaction with a date is an event on the calendar, which
 * is how imported and manually added entries show up there.
 */
export type CalendarPageData = {
    items: DueItem[];
    /** "Today" anchor for the client, derived from the seeded data window. */
    referenceDate: string;
};
export declare function getCalendarPageData(): Promise<CalendarPageData>;
/**
 * The next `limit` events due after today, from the same three sources the
 * calendar shows. The dashboard's "Upcoming" card used to read `scheduled_items`
 * alone, which left it empty for workspaces whose bills live in the ledger (the
 * normal case after an import). Today's entries are excluded: they already show
 * up in the recent transactions list, so repeating them here reads as a bug.
 */
export declare function getUpcomingCalendarItems(ctx: ScopeContext, limit: number): Promise<DueItem[]>;
