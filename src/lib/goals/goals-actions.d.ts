// Synced from my-money-v2 (src/lib/goals/goals-actions.ts). Do not edit here: change it
// in the web repo and run `npm run sync:web`.
declare const GOAL_TONES: readonly ["plum", "coral", "sage", "amber"];
export type CreateGoalInput = {
    name: string;
    tone: (typeof GOAL_TONES)[number];
    target: number;
    saved: number;
    monthlyContribution: number;
    /** ISO date (yyyy-mm-dd) or null when the goal has no deadline. */
    targetDate: string | null;
};
export type CreateGoalResult = {
    ok: true;
} | {
    ok: false;
    message: string;
};
/**
 * In-app sibling of `createOnboardingGoal`: same validation and tier cap, but
 * scope-aware so household workspaces attach the goal to the household.
 */
export declare function createGoal(input: CreateGoalInput): Promise<CreateGoalResult>;
/** Applies a full edit to one of the workspace's goals. */
export declare function updateGoal(goalId: string, input: CreateGoalInput): Promise<CreateGoalResult>;
/** Removes a goal and (via cascade) its activity history. */
export declare function deleteGoal(goalId: string): Promise<CreateGoalResult>;
export {};
