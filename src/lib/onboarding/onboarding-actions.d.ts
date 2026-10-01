// Synced from my-money-v2 (src/lib/onboarding/onboarding-actions.ts). Do not edit here: change it
// in the web repo and run `npm run sync:web`.
import { type BankTone, type InterestMode, type SavingsLabel } from "@/lib/accounts/accounts-data";
export type OnboardingActionResult = {
    ok: true;
} | {
    ok: false;
    message: string;
};
export type OnboardingCreatedResult = {
    ok: true;
    ids: string[];
} | {
    ok: false;
    message: string;
};
export type OnboardingBankInput = {
    name: string;
    nickname: string;
    tone: BankTone;
    isPrimary: boolean;
    /** Opening checking balance; null when the bank has no checking account. */
    checkingBalance: number | null;
    /** Savings accounts to open; a bank can hold several. */
    savings: Array<{
        balance: number;
        label: SavingsLabel | null;
        mode: InterestMode;
        rate: number;
    }>;
};
declare const goalIcons: readonly ["reserve", "travel", "laptop"];
declare const goalTones: readonly ["plum", "coral", "sage", "amber"];
export type OnboardingGoalInput = {
    name: string;
    icon: (typeof goalIcons)[number];
    tone: (typeof goalTones)[number];
    target: number;
    saved: number;
    monthlyContribution: number;
    /** ISO date (yyyy-mm-dd) or null when the goal has no deadline. */
    targetDate: string | null;
};
export declare function createOnboardingBank(input: OnboardingBankInput): Promise<OnboardingCreatedResult>;
/** Remove a bank added during onboarding (both its account rows). */
export declare function deleteOnboardingBank(accountIds: string[]): Promise<OnboardingActionResult>;
/** Make the given bank (its account rows) the primary income destination. */
export declare function setOnboardingPrimaryBank(accountIds: string[]): Promise<OnboardingActionResult>;
export declare function createOnboardingGoal(input: OnboardingGoalInput): Promise<OnboardingCreatedResult>;
/** Remove a goal added during onboarding. */
export declare function deleteOnboardingGoal(goalId: string): Promise<OnboardingActionResult>;
/**
 * Remember which step the user is on so a reload or re-login resumes there.
 * Stored alongside the other user preference flags in the jsonb column.
 */
export declare function saveOnboardingStep(step: number): Promise<OnboardingActionResult>;
/**
 * Retires the dashboard first-transaction coachmark for good. Like onboarding,
 * the tip is a one-shot: it is flagged as soon as it has been shown once, so
 * skipping, acting on it, or simply leaving the page all end it.
 */
/**
 * Retires the first-transaction coachmark. Only an explicit act writes this —
 * skipping the tip or opening the transaction flow it points at — so a tip the
 * user ignored still greets them next visit.
 */
export declare function dismissFirstTransactionTip(): Promise<OnboardingActionResult>;
/**
 * Retires the sidebar user-guide coachmark. Written both when the tip is shown
 * and when it is dismissed, so it only ever appears once per account.
 */
export declare function dismissDocsTip(): Promise<OnboardingActionResult>;
export declare function completeOnboarding(): Promise<OnboardingActionResult>;
export {};
