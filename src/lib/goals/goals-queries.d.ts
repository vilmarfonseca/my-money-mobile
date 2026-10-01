// Synced from my-money-v2 (src/lib/goals/goals-queries.ts). Do not edit here: change it
// in the web repo and run `npm run sync:web`.
import type { CompletedGoal, Goal, GoalActivity } from "@/lib/goals/goals-data";
export type MonthlySavingsPoint = {
    month: string;
    saved: number;
};
export type GoalOverview = {
    monthlySavings: number;
    savingsRate: string;
    autoTransfer: string;
    totalSaved: number;
    combinedTarget: number;
    nextMilestone: string;
    finishNote: string;
};
export type WhatIfScenario = {
    goalName: string;
    remaining: number;
    currentMonthlyContribution: number;
    initialExtraContribution: number;
    maxExtraContribution: number;
    step: number;
    startMonthIndex: number;
    startYear: number;
};
export type GoalsPageData = {
    overview: GoalOverview;
    monthlySavingsTrend: MonthlySavingsPoint[];
    activeGoals: Goal[];
    completedGoals: CompletedGoal[];
    activities: GoalActivity[];
    whatIfScenario: WhatIfScenario | null;
};
export declare function getGoalsPageData(): Promise<GoalsPageData>;
/** Per-request memo of `getGoalsPageData` shared by the streamed cards. */
export declare const loadGoalsPage: () => Promise<GoalsPageData>;
