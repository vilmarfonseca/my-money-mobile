// Synced from my-money-v2 (src/lib/expenses/expenses-queries.ts). Do not edit here: change it
// in the web repo and run `npm run sync:web`.
import { type DateRangeParams } from "@/lib/date-range";
/**
 * Server-only data access for the Expenses page. Every figure here is derived
 * from the `transactions` ledger with SQL aggregation — no precomputed totals.
 *
 * This is the reference for how feature pages should read from the database:
 * one query module per feature, returning view-ready shapes that match what the
 * presentational components already expect.
 */
/** Tone tokens the breakdown chart knows how to color, cycled for the rest. */
declare const TONE_PALETTE: readonly ["plum", "coral", "amber", "sage", "ink"];
export type CategoryTone = (typeof TONE_PALETTE)[number];
/** Page-level period filter: this month, this quarter, YTD, or custom range. */
export type ExpensePeriod = "month" | "quarter" | "ytd" | "custom";
export type ExpenseOverview = {
    periodLabel: string;
    total: number;
    dailyAverage: number;
    transactionCount: number;
    budgetLeft: number;
    delta: string;
    note: string;
};
export type ExpenseCategoryBreakdown = {
    id: string;
    name: string;
    description: string;
    amount: number;
    percent: number;
    tone: CategoryTone;
    /** Resolved CSS color (custom hex or the tone token) for charts/accents. */
    chartColor: string;
    count: number;
    flag: "trending" | null;
};
export type ExpenseTrendPoint = {
    month: string;
    /** First day of the month (YYYY-MM-DD) — lets trend bars set the filter. */
    monthStart: string;
    spending: number;
    /** Overall monthly spend when `spending` is a single category's slice. */
    total?: number;
};
/** Page-wide category filter payload — set when `?category=` is active. */
export type SelectedExpenseCategory = {
    name: string;
    chartColor: string;
    amount: number;
    count: number;
    /** Share of the period's total spend, 0–100. */
    percent: number;
    delta: string;
    deltaUp: boolean;
    avgPerTransaction: number;
    largest: {
        merchant: string;
        amount: number;
    } | null;
    merchants: {
        id: string;
        name: string;
        amount: number;
        percent: number;
    }[];
};
/** A secondary category tagged on a transaction, for its own pill. */
export type TransactionExtraCategory = {
    name: string;
    color: string | null;
};
export type ExpenseTransaction = {
    id: string;
    merchant: string;
    detail: string;
    category: string;
    /** Custom category color (hex) when the user picked one. */
    categoryColor: string | null;
    /** Custom category icon (lucide name or emoji) when the user picked one. */
    categoryIcon: string | null;
    /** Extra categories beyond the primary one, in the order they were added. */
    otherCategories: TransactionExtraCategory[];
    card: string;
    date: string;
    /** ISO timestamp — used for period filtering and chronological sorting. */
    occurredAt: string;
    amount: number;
};
export type ExpensesPageData = {
    overview: ExpenseOverview;
    categories: ExpenseCategoryBreakdown[];
    selectedCategory: SelectedExpenseCategory | null;
    trend: ExpenseTrendPoint[];
    transactions: ExpenseTransaction[];
};
export declare function getExpensesPageData(period?: ExpensePeriod, customRange?: DateRangeParams, categoryFilter?: string): Promise<ExpensesPageData>;
/**
 * Per-request memo of `getExpensesPageData` keyed on primitives, so the page
 * header and every streamed card share one load instead of repeating it.
 */
export declare const loadExpensesPage: (period: ExpensePeriod, from: string | undefined, to: string | undefined, categoryFilter: string | undefined) => Promise<ExpensesPageData>;
export {};
