// Synced from my-money-v2 (src/lib/accounts/accounts-actions.ts). Do not edit here: change it
// in the web repo and run `npm run sync:web`.
import { type BankTone, type InterestMode, type SavingsLabel } from "@/lib/accounts/accounts-data";
export type UpdateBankAccountInput = {
    accountIds: string[];
    /** New bank (institution) name; renames the bank when provided. */
    name?: string;
    nickname: string;
    /** Semantic tone or a user-picked "#rrggbb" hex icon color. */
    tone: BankTone | string;
    /** Make this bank the default destination for income deposits. */
    isPrimary?: boolean;
    /** Manual balance adjustments, one entry per account being edited. */
    balances?: Array<{
        accountId: string;
        balance: number;
    }>;
    /** Interest settings for savings accounts this bank already has. */
    savings?: Array<{
        accountId: string;
        label: SavingsLabel | null;
        mode: InterestMode;
        rate: number;
    }>;
    /**
     * Savings accounts to open on an existing bank — the form offers the fields
     * either way, so editing a checking-only bank can add its poupança/cofrinho
     * without going through "add account" again.
     */
    addSavings?: SavingsAccountInput[];
    /** Opening balance for a checking account this bank does not have yet. */
    addChecking?: {
        balance: number;
    };
};
export declare function updateBankAccount(input: UpdateBankAccountInput): Promise<TransferResult>;
export type SavingsAccountInput = {
    balance: number;
    label: SavingsLabel | null;
    mode: InterestMode;
    rate: number;
};
export type CreateBankAccountInput = {
    /** Bank (institution) name; both member accounts are named after it. */
    name: string;
    nickname: string;
    /** Semantic tone or a user-picked "#rrggbb" hex icon color. */
    tone: BankTone | string;
    isPrimary: boolean;
    /** Opening checking balance; null when the bank has no checking account. */
    checkingBalance: number | null;
    /** Savings accounts to open; a bank can hold several. */
    savings: SavingsAccountInput[];
};
/**
 * Adds a bank from the accounts page: one row per account kind, grouped by
 * `institution` the same way the onboarding wizard groups them. At least one
 * of checking/savings must be present — a bank with neither has nothing to
 * show on the page.
 */
export declare function createBankAccount(input: CreateBankAccountInput): Promise<TransferResult>;
export declare function deleteBankAccount(input: {
    accountIds: string[];
}): Promise<TransferResult>;
export type TransferInput = {
    fromAccountId: string;
    toAccountId: string;
    amount: number;
};
export type TransferResult = {
    ok: true;
} | {
    ok: false;
    message: string;
};
export declare function transferBetweenAccounts(input: TransferInput): Promise<TransferResult>;
