// Synced from my-money-v2 (src/lib/analytics/analytics-queries.ts). Do not edit here: change it
// in the web repo and run `npm run sync:web`.
import { type AnalyticsCardId } from "@/lib/analytics/analytics-catalog";
import type { DateRangeParams } from "@/lib/date-range";
import type { AppLocale } from "@/lib/i18n/config";
import { type FilterPeriod } from "@/lib/period-window";
/** Page-level period filter — same options as every other feature page. */
export type AnalyticsPeriod = FilterPeriod;
/**
 * Server-only data access for the Analytics page. Every widget is derived
 * from the live ledger (`transactions`), account balances, goals, and
 * scheduled items — no mock values. Heavier math (projections, allocation of
 * income to categories in the flow map) happens in TS over a handful of SQL
 * aggregates.
 */
export type AnalyticsKpis = {
    netWorth: {
        value: number;
        momPct: number | null;
    };
    saveRate: {
        value: number | null;
        target: number;
    };
    avgMonthlyIncome: {
        value: number;
        delta: number | null;
    };
    avgMonthlySpend: {
        value: number;
        deltaPct: number | null;
    };
};
export type SankeyNode = {
    id: string;
    label: string;
    amount: number;
    color: string;
};
export type SankeyFlow = {
    source: string;
    target: string;
    amount: number;
};
export type SankeyData = {
    sources: SankeyNode[];
    targets: SankeyNode[];
    flows: SankeyFlow[];
    totalIn: number;
    targetCount: number;
    retained: number;
    largestInflow: {
        label: string;
        amount: number;
    } | null;
    largestOutflow: {
        label: string;
        amount: number;
    } | null;
    fixedPct: number | null;
    savedPct: number | null;
    topOutflowShareOfSpendPct: number | null;
};
export type TrendPoint = {
    label: string;
    monthKey: string;
    value: number;
};
export type NetWorthTrendData = {
    points: TrendPoint[];
    current: number;
    growthPct: number | null;
    deltaOverRange: number;
    markers: string[];
    /** Indexes into `points` worth dotting (goal completions, all-time high). */
    markerIndexes: number[];
};
export type SaveRateTrendData = {
    points: {
        label: string;
        rate: number;
    }[];
    target: number;
    latest: number | null;
    best: number | null;
    average: number | null;
};
export type HeatmapData = {
    monthLabels: string[];
    categories: {
        name: string;
        values: number[];
    }[];
};
export type BalanceAheadRow = {
    label: string;
    sublabel: string;
    amount: number;
    kind: "incoming" | "outgoing" | "estimate";
};
export type BalanceAheadData = {
    monthEndLabel: string;
    today: number;
    incoming: number;
    billsDue: number;
    estimatedVariable: number;
    projected: number;
    rows: BalanceAheadRow[];
};
export type CompoundPoint = {
    label: string;
    base: number;
    lo: number;
    hi: number;
};
export type CompoundData = {
    points: CompoundPoint[];
    saveRatePct: number | null;
    tenYearValue: number;
};
export type RunwayData = {
    months: number | null;
    saved: number;
    avgMonthlySpend: number;
};
export type GoalEtaRow = {
    name: string;
    saved: number;
    target: number;
    percent: number;
    chip: {
        kind: "eta" | "onTrack" | "behind" | "noContribution";
        label: string;
    };
};
export type BudgetRow = {
    name: string;
    typical: number;
    actual: number;
    over: boolean;
    diff: number;
};
export type RecurringSplitData = {
    fixed: number;
    variable: number;
    fixedPct: number | null;
};
export type MerchantRow = {
    name: string;
    amount: number;
    count: number;
};
export type UnusualRow = {
    merchant: string;
    category: string;
    amount: number;
    ratio: number;
};
export type SubscriptionRow = {
    merchant: string;
    monthlyAmount: number;
    costPerDay: number;
    frequency: "weekly" | "monthly" | "yearly";
};
export type BenchmarksData = {
    aboveTargetPct: number | null;
    streak: number;
    last12: boolean[];
    target: number;
};
export type CompareCategoriesData = {
    categories: {
        name: string;
        current: number;
        previous: number;
    }[];
    currentTotal: number;
    previousTotal: number;
};
export type SeasonalityData = {
    points: {
        label: string;
        current: number;
        previous: number;
    }[];
};
export type AnalyticsPageData = {
    period: AnalyticsPeriod;
    rangeLabel: string;
    kpis: AnalyticsKpis;
    sankey: SankeyData;
    netWorthTrend: NetWorthTrendData;
    saveRateTrend: SaveRateTrendData;
    heatmap: HeatmapData;
    balanceAhead: BalanceAheadData;
    compound: CompoundData;
    runway: RunwayData;
    goalEtas: GoalEtaRow[];
    budget: BudgetRow[];
    recurringSplit: RecurringSplitData;
    effectiveSaveRate: SaveRateTrendData;
    merchants: MerchantRow[];
    unusual: UnusualRow[];
    subscriptions: SubscriptionRow[];
    benchmarks: BenchmarksData;
    thisVsLast: CompareCategoriesData;
    seasonality: SeasonalityData;
};
/**
 * The user's visible card set, from the raw preference flags. (The settings
 * page's normalized preference reader strips unknown keys, so this reads the
 * row directly.)
 */
export declare function getSelectedAnalyticsCards(userId: string): Promise<AnalyticsCardId[]>;
export declare function getAnalyticsPageData(period: AnalyticsPeriod, customRange: DateRangeParams, locale: AppLocale, savingsGoalRate: number | null): Promise<AnalyticsPageData>;
