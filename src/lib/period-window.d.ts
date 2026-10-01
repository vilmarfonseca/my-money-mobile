// Synced from my-money-v2 (src/lib/period-window.ts). Do not edit here: change it
// in the web repo and run `npm run sync:web`.
import { type AnyColumn, type SQL } from "drizzle-orm";
import { type DateRangeParams } from "@/lib/date-range";
import type { AppLocale } from "@/lib/i18n/config";
/**
 * Single source of truth for how the page-level period filters translate to
 * date windows. Every feature page (balance, expenses, income, cards) resolves
 * its filter through here so the same filter always means the same dates.
 *
 * Semantics:
 * - `month`   — the full current calendar month, including transactions dated
 *               later in the month.
 * - `quarter` — the past 3 calendar months including the current one
 *               (e.g. on Jul 8: May 1 → Jul 31).
 * - `ytd`     — Jan 1 of the current year through the end of the current month.
 * - `custom`  — an explicit from/to range (inclusive), or all history when no
 *               range is given.
 *
 * All `end` dates are exclusive.
 */
export type FilterPeriod = "month" | "quarter" | "ytd" | "custom";
export type ResolvedPeriodWindow = {
    start: Date;
    /** Exclusive. */
    end: Date;
    prevStart: Date | null;
    prevEnd: Date | null;
    /** Calendar months covered by the window (>= 1). */
    months: number;
    /** True when the window came from explicit from/to params. */
    explicitRange: boolean;
};
export declare function resolvePeriodWindow(period: FilterPeriod, ref: Date, earliest: Date, customRange?: DateRangeParams): ResolvedPeriodWindow;
/**
 * Membership condition for a page period filter. Month / quarter / YTD (and
 * all-history) windows place a transaction by its fiscal month, so a bill filed
 * under the month it covers is included even when its actual date falls in a
 * later month. Explicit day ranges keep the actual date, since a fiscal month
 * has no day-level precision.
 */
export declare function periodMembership(window: {
    start: Date;
    end: Date;
    explicitRange: boolean;
}, occurredAtColumn: AnyColumn, fiscalMonthColumn: AnyColumn): SQL;
/** Local `yyyy-mm-dd` for comparing against a `date` column. */
export declare function toDateOnlyString(date: Date): string;
/** "May – Jul 2026", or "Nov 2025 – Jan 2026" when the range crosses years. */
export declare function formatMonthRangeLabel(start: Date, endExclusive: Date, locale: AppLocale): string;
