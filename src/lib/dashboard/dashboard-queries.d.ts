// Synced from my-money-v2 (src/lib/dashboard/dashboard-queries.ts). Do not edit here: change it
// in the web repo and run `npm run sync:web`.
import type { TransactionExtraCategory } from "@/lib/expenses/expenses-queries";
export type DashboardBalanceAccount = {
    label: string;
    value: string;
    delta: string;
    color: "plum" | "sage" | "coral";
};
export type DashboardBalanceOverview = {
    total: string;
    fraction: string;
    weekDelta: string;
    monthDelta: string;
    cardNote: string;
    currentMonthBalance: {
        label: string;
        value: string;
        delta: string;
        positive: boolean;
    };
    accounts: DashboardBalanceAccount[];
    flow: {
        month: string;
        rows: Array<{
            label: string;
            value: string;
            color: "plum" | "sage" | "coral";
            positive?: true;
        }>;
        bar: Array<{
            color: "plum" | "sage" | "coral";
            amount: number;
        }>;
        leftToSaveLabel: string;
        leftToSave: string;
    };
};
export type DashboardBalanceTrendPoint = {
    month: string;
    balance: number;
};
export type DashboardGoal = {
    date: string;
    name: string;
    progress: number;
    saved: string;
    target: string;
};
export type DashboardUpcomingItem = {
    id: string;
    day: string;
    month: string;
    name: string;
    detail: string;
    amount: number;
    /** Set on virtual card-bill items: opens the pay-bill modal on click. */
    billCardId?: string;
    /** Unpaid manual card bill whose due day has arrived — shows a red badge. */
    overdue?: boolean;
};
export type DashboardTransaction = {
    id: string;
    name: string;
    category: string;
    categoryColor: string | null;
    categoryIcon: string | null;
    /** Extra categories beyond the primary one, in the order they were added. */
    otherCategories: TransactionExtraCategory[];
    type: "Income" | "Expense";
    date: string;
    occurredAt: string;
    amount: number;
};
export type DashboardTip = {
    prefix: string;
    emphasis: string;
    suffix: string;
    actionLabel: string;
    href: string;
};
export type DashboardPageData = {
    greetingName: string;
    headerSummary: string;
    balanceOverview: DashboardBalanceOverview;
    balanceTrend: DashboardBalanceTrendPoint[];
    goals: DashboardGoal[];
    upcomingItems: DashboardUpcomingItem[];
    recentTransactions: DashboardTransaction[];
    /** Null when the tip's amount is zero — the card is hidden entirely. */
    tip: DashboardTip | null;
    /** Empty ledger and the coachmark was never skipped: guide the first step. */
    showFirstStepCoachmark: boolean;
};
/** Greeting and the savings-rate summary line. */
export declare function getDashboardHeaderData(): Promise<Pick<DashboardPageData, "greetingName" | "headerSummary">>;
/** Balance hero: headline balance, month flow, and the 9-month trend. */
export declare function getDashboardBalanceData(): Promise<Pick<DashboardPageData, "balanceOverview" | "balanceTrend">>;
/** The quick tip under the balance hero (null hides the card). */
export declare function getDashboardTip(): Promise<DashboardTip | null>;
/** Top three active goals by amount saved. */
export declare function getDashboardGoals(): Promise<DashboardGoal[]>;
/** Next five due items, from the same source as the Calendar page so the
 * card can never disagree with it: standalone scheduled items, dated ledger
 * rows, and the projected occurrences of recurring charges. */
export declare function getDashboardUpcoming(): Promise<DashboardUpcomingItem[]>;
/** The ten most recent income/expense rows. */
export declare function getDashboardRecentTransactions(): Promise<DashboardTransaction[]>;
/** Empty ledger and the coachmark was never skipped: guide the first step. */
export declare function getDashboardCoachmark(): Promise<boolean>;
export declare function getDashboardPageData(): Promise<DashboardPageData>;
