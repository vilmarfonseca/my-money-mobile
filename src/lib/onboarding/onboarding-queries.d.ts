// Synced from my-money-v2 (src/lib/onboarding/onboarding-queries.ts). Do not edit here: change it
// in the web repo and run `npm run sync:web`.
import type { BankTone, SavingsLabel } from "@/lib/accounts/accounts-data";
import type { CardPaletteId } from "@/lib/cards/cards-data";
import { type ScopeContext } from "@/lib/db/current-scope";
export declare const ONBOARDING_STEP_KEY = "onboardingStep";
/** Preference flag set when the user skips the first-transaction coachmark. */
export declare const FIRST_TRANSACTION_TIP_KEY = "firstTransactionTipDismissed";
/** Preference flag set once the user has seen the user-guide coachmark. */
export declare const DOCS_TIP_KEY = "docsTipDismissed";
export declare const ONBOARDING_TOTAL_STEPS = 6;
export type OnboardingState = {
    /** The user explicitly finished the onboarding flow. */
    completed: boolean;
    /** At least one checking/savings account exists (required step 1 done). */
    hasBankAccounts: boolean;
};
/** Everything needed to resume the onboarding flow exactly where it stopped. */
export type OnboardingResume = {
    step: number;
    banks: Array<{
        accountIds: string[];
        name: string;
        nickname: string;
        tone: BankTone;
        isPrimary: boolean;
        checking: number | null;
        savings: Array<{
            balance: number;
            label: SavingsLabel | null;
        }>;
    }>;
    goals: Array<{
        id: string;
        name: string;
        tone: "plum" | "coral" | "sage" | "amber";
        target: number;
        targetDate: string | null;
    }>;
    cards: Array<{
        id: string;
        nickname: string;
        last4: string;
        palette: CardPaletteId;
        limit: number;
    }>;
};
/**
 * Whether the dashboard's first-transaction coachmark should be shown: the
 * workspace has no transaction yet and the user never skipped the tip. Shared
 * by the dashboard (desktop spotlight) and the mobile tab bar.
 */
export declare function shouldShowFirstStepCoachmark(ctx: ScopeContext): Promise<boolean>;
/**
 * Whether the sidebar's user-guide coachmark should be shown. Unlike the
 * first-transaction tip it has no data condition: it points at a menu item, so
 * a single preference flag decides, and it never returns once dismissed.
 */
export declare function shouldShowDocsTip(ctx: ScopeContext): Promise<boolean>;
export declare function getOnboardingState(): Promise<OnboardingState>;
/**
 * Rebuild the flow's client state from what the user has already saved. Each
 * onboarding step writes real rows immediately, so a reload or re-login can
 * hydrate the banks, goals, and cards and drop the user back on their step.
 */
export declare function getOnboardingResume(): Promise<OnboardingResume>;
