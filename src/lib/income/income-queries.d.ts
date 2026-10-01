// Synced from my-money-v2 (src/lib/income/income-queries.ts). Do not edit here: change it
// in the web repo and run `npm run sync:web`.
import { type DateRangeParams } from "@/lib/date-range";
/**
 * Server-only data access for the Income page. The page reads posted income
 * from the transaction ledger, source metadata from `income_sources`, and
 * upcoming deposits from `scheduled_items`.
 */
export type IncomeSourceStatus = "Recurring" | "Variable" | "One-off";
export type IncomeKpiTone = "positive" | "neutral";
export type IncomePeriod = "month" | "quarter" | "ytd" | "custom";
export type IncomeOverview = {
    periodLabel: string;
    total: number;
    delta: string;
    sourceCount: number;
    trendBadge: string;
    secondaryLabel: string;
    ytdTotal: number;
    ytdDelta: string;
};
export type IncomeTrendPoint = {
    month: string;
    tooltipLabel: string;
    income: number;
    recurring: number;
};
export type IncomeKpi = {
    label: string;
    value: string;
    fraction: string;
    delta: string;
    tone: IncomeKpiTone;
};
export type IncomeSourceRow = {
    id: string;
    name: string;
    institution: string;
    category: string;
    cadence: string;
    lastPaid: string;
    amount: number;
    status: IncomeSourceStatus;
    categoryColor: string | null;
    categoryIcon: string | null;
    /** Most recent income transaction; row click opens it for editing. */
    latestTransactionId: string | null;
};
export type PayoutCalendarDay = {
    day: number;
    sourceName: string;
    type: string;
    amount: number;
    state: "cleared" | "scheduled";
};
export type PayoutCalendarMonth = {
    label: string;
    days: number;
    startOffset: number;
    payouts: PayoutCalendarDay[];
};
export type PayoutCalendarData = {
    months: PayoutCalendarMonth[];
    initialMonthIndex: number;
    initialSelectedDay: number;
};
export type IncomePageData = {
    overview: IncomeOverview;
    trend: IncomeTrendPoint[];
    kpis: IncomeKpi[];
    sources: IncomeSourceRow[];
    payoutCalendar: PayoutCalendarData;
    headerSummary: string;
};
export declare function getIncomePageData(period?: IncomePeriod, customRange?: DateRangeParams): Promise<IncomePageData>;
/** Per-request memo of `getIncomePageData` shared by the streamed cards. */
export declare const loadIncomePage: (period: IncomePeriod, from: string | undefined, to: string | undefined) => Promise<IncomePageData>;
