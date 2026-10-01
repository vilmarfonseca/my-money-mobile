// Synced from my-money-v2 (src/lib/mobile/api.ts). Do not edit here: change it
// in the web repo and run `npm run sync:web`.
import { deleteOwnAccount } from "@/lib/account/account-actions";
import { createBankAccount, deleteBankAccount, transferBetweenAccounts, updateBankAccount } from "@/lib/accounts/accounts-actions";
import { markAffiliateCommissionsPaid, setCommissionPaid } from "@/lib/admin/affiliate-actions";
import { saveAnalyticsCardSelection } from "@/lib/analytics/analytics-actions";
import { getCardBillContext, listBankAccountOptions, payCardBill } from "@/lib/cards/card-bills-actions";
import { createCreditCard, deleteCreditCard, reorderCreditCards, updateCreditCard, updateCreditCardPalette } from "@/lib/cards/cards-actions";
import { updateCategory } from "@/lib/categories/category-actions";
import { createGoal, deleteGoal, updateGoal } from "@/lib/goals/goals-actions";
import { acceptInvitation, createHousehold, deleteHousehold, inviteToHousehold, leaveHousehold, removeMember, renameHousehold, revokeInvitation, switchWorkspace } from "@/lib/household/household-actions";
import { getInvitePreview } from "@/lib/household/household-queries";
import { saveLocalePreference } from "@/lib/i18n/locale-actions";
import { disconnectGoogleCalendar, syncCalendarNow, updateCalendarSyncTypes } from "@/lib/integrations/integration-actions";
import { completeOnboarding, createOnboardingBank, createOnboardingGoal, deleteOnboardingBank, deleteOnboardingGoal, dismissDocsTip, dismissFirstTransactionTip, saveOnboardingStep, setOnboardingPrimaryBank } from "@/lib/onboarding/onboarding-actions";
import type { FilterPeriod } from "@/lib/period-window";
import { applyReferralCode } from "@/lib/referrals/referral-actions";
import { saveDefaultSetting, savePreferenceSetting, saveProfileSettings } from "@/lib/settings/settings-actions";
import { sendSupportMessage } from "@/lib/support/support-actions";
import { getExportSummary, getTransactionsForExport, importTransactions } from "@/lib/transactions/import-export-actions";
import { createTransaction } from "@/lib/transactions/transaction-actions";
import { deleteTransaction, getTransactionEditContext, updateTransaction } from "@/lib/transactions/transaction-edit-actions";
/**
 * The native app's API surface: every query and action the signed-in web app
 * calls from its server components and forms, reachable by name through
 * `POST /api/mobile/rpc/<name>`.
 *
 * Only what is listed here can be called. Each entry resolves the user from
 * the request's own session (never from an argument), so the scoping and plan
 * gates the web relies on apply unchanged. Where the web page itself, rather
 * than the query, does the validation or the plan check, the entry below does
 * the same before delegating.
 */
/** Raised for requests the route should answer with a status other than 500. */
export declare class MobileApiError extends Error {
    readonly status: 400 | 403 | 404;
    constructor(status: 400 | 403 | 404, message: string);
}
export type PeriodQuery = {
    from?: string;
    period?: FilterPeriod;
    to?: string;
};
/**
 * Everything the app shell needs before it can show a screen: the same reads
 * the web layout does, including the live Stripe re-check that clears a
 * payment-issue dialog as soon as the payment is fixed.
 */
declare function bootstrap(): Promise<{
    displayPreferences: import("@/lib/settings/settings-queries").UserDisplayPreferences;
    entitlements: import("@/lib/billing/entitlements").Entitlements;
    isAdmin: boolean;
    onboarding: import("@/lib/onboarding/onboarding-queries").OnboardingState;
    scope: import("@/lib/db/current-scope").WorkspaceScope;
    showDocsCoachmark: boolean;
    showFirstStepCoachmark: boolean;
    user: {
        email: string;
        id: string;
        name: string | null;
    };
    workspaces: import("@/lib/household/household-queries").WorkspaceOptionsData;
}>;
export declare const mobileApi: {
    readonly "app.bootstrap": typeof bootstrap;
    readonly "dashboard.page": () => Promise<import("@/lib/dashboard/dashboard-queries").DashboardPageData>;
    readonly "expenses.page": (query?: PeriodQuery & {
        category?: string;
    }) => Promise<import("@/lib/expenses/expenses-queries").ExpensesPageData>;
    readonly "income.page": (query?: PeriodQuery) => Promise<import("@/lib/income/income-queries").IncomePageData>;
    readonly "balance.page": (query?: PeriodQuery) => Promise<import("../balance/balance-data").BalancePeriodData>;
    readonly "accounts.page": () => Promise<import("@/lib/accounts/accounts-queries").AccountsPageData>;
    readonly "accounts.create": typeof createBankAccount;
    readonly "accounts.update": typeof updateBankAccount;
    readonly "accounts.delete": typeof deleteBankAccount;
    readonly "accounts.transfer": typeof transferBetweenAccounts;
    readonly "cards.page": (query?: PeriodQuery) => Promise<import("@/lib/cards/cards-queries").CardsPageData>;
    readonly "cards.create": typeof createCreditCard;
    readonly "cards.update": typeof updateCreditCard;
    readonly "cards.updatePalette": typeof updateCreditCardPalette;
    readonly "cards.delete": typeof deleteCreditCard;
    readonly "cards.reorder": typeof reorderCreditCards;
    readonly "cards.billContext": typeof getCardBillContext;
    readonly "cards.bankAccountOptions": typeof listBankAccountOptions;
    readonly "cards.payBill": typeof payCardBill;
    readonly "goals.page": () => Promise<import("@/lib/goals/goals-queries").GoalsPageData>;
    readonly "goals.create": typeof createGoal;
    readonly "goals.update": typeof updateGoal;
    readonly "goals.delete": typeof deleteGoal;
    readonly "calendar.page": () => Promise<import("@/lib/calendar/calendar-queries").CalendarPageData>;
    readonly "analytics.page": (query?: PeriodQuery) => Promise<{
        data: import("@/lib/analytics/analytics-queries").AnalyticsPageData;
        selected: import("../analytics/analytics-catalog").AnalyticsCardId[];
    }>;
    readonly "analytics.saveCardSelection": typeof saveAnalyticsCardSelection;
    readonly "transactions.formOptions": () => Promise<import("../transactions/transaction-utils").TransactionFormOptions>;
    readonly "transactions.create": typeof createTransaction;
    readonly "transactions.editContext": typeof getTransactionEditContext;
    readonly "transactions.update": typeof updateTransaction;
    readonly "transactions.delete": typeof deleteTransaction;
    readonly "transactions.import": typeof importTransactions;
    readonly "transactions.exportSummary": typeof getExportSummary;
    readonly "transactions.exportRows": typeof getTransactionsForExport;
    readonly "categories.update": typeof updateCategory;
    readonly "settings.get": () => Promise<import("@/lib/settings/settings-queries").UserSettings>;
    readonly "settings.saveProfile": typeof saveProfileSettings;
    readonly "settings.savePreference": typeof savePreferenceSetting;
    readonly "settings.saveDefault": typeof saveDefaultSetting;
    readonly "settings.saveLocale": typeof saveLocalePreference;
    readonly "account.delete": typeof deleteOwnAccount;
    readonly "support.send": typeof sendSupportMessage;
    readonly "household.settings": () => Promise<import("@/lib/household/household-queries").HouseholdSettingsData>;
    readonly "household.workspaces": () => Promise<import("@/lib/household/household-queries").WorkspaceOptionsData>;
    readonly "household.invitePreview": typeof getInvitePreview;
    readonly "household.create": typeof createHousehold;
    readonly "household.rename": typeof renameHousehold;
    readonly "household.switchWorkspace": typeof switchWorkspace;
    readonly "household.invite": typeof inviteToHousehold;
    readonly "household.revokeInvitation": typeof revokeInvitation;
    readonly "household.removeMember": typeof removeMember;
    readonly "household.leave": typeof leaveHousehold;
    readonly "household.delete": typeof deleteHousehold;
    readonly "household.acceptInvitation": typeof acceptInvitation;
    readonly "onboarding.state": () => Promise<import("@/lib/onboarding/onboarding-queries").OnboardingState>;
    readonly "onboarding.resume": () => Promise<{
        canCreateHousehold: boolean;
        firstName: string | null;
        initialHousehold: {
            invitedEmail: string;
            name: string;
        } | null;
        resume: import("@/lib/onboarding/onboarding-queries").OnboardingResume;
    }>;
    readonly "onboarding.createBank": typeof createOnboardingBank;
    readonly "onboarding.deleteBank": typeof deleteOnboardingBank;
    readonly "onboarding.setPrimaryBank": typeof setOnboardingPrimaryBank;
    readonly "onboarding.createGoal": typeof createOnboardingGoal;
    readonly "onboarding.deleteGoal": typeof deleteOnboardingGoal;
    readonly "onboarding.saveStep": typeof saveOnboardingStep;
    readonly "onboarding.dismissFirstTransactionTip": typeof dismissFirstTransactionTip;
    readonly "onboarding.dismissDocsTip": typeof dismissDocsTip;
    readonly "onboarding.complete": typeof completeOnboarding;
    readonly "referrals.summary": () => Promise<import("@/lib/referrals/referral-queries").ReferralSummary>;
    readonly "referrals.applyCode": typeof applyReferralCode;
    readonly "integrations.calendar": () => Promise<import("@/lib/integrations/integration-queries").CalendarIntegrationView>;
    readonly "integrations.updateCalendarSyncTypes": typeof updateCalendarSyncTypes;
    readonly "integrations.syncCalendarNow": typeof syncCalendarNow;
    readonly "integrations.disconnectCalendar": typeof disconnectGoogleCalendar;
    readonly "billing.entitlements": () => Promise<import("@/lib/billing/entitlements").Entitlements>;
    /** Prices for the plan picker, in the currency the request's country pays. */
    readonly "billing.displayPrices": () => Promise<import("@/lib/billing/display-prices").DisplayPrices>;
    /**
     * A link that opens one of the web app's hosted flows in a browser, signed
     * in as this user: `/mobile/handoff` consumes a single-use Clerk ticket,
     * valid for a minute, and continues to `path`.
     */
    readonly "web.handoffUrl": (path: string) => Promise<{
        url: string;
    }>;
    readonly "admin.affiliates": (query?: PeriodQuery & {
        plan?: string;
    }) => Promise<{
        period: import("@/lib/admin/affiliates-queries").AffiliatePeriod;
        plan: import("@/lib/admin/affiliates-queries").AffiliatePlanFilter;
        window: {
            start: string;
            end: string;
        };
        totals: {
            signedUp: number;
            paid: number;
            paidByTier: import("@/lib/admin/affiliates-queries").PaidByTier;
            paidByPlan: import("@/lib/admin/affiliates-queries").PaidByPlan;
            affiliates: number;
            commission: import("../admin/commission-totals").CommissionTotals;
            commissionPaid: import("../admin/commission-totals").CommissionTotals;
            commissionOwed: import("../admin/commission-totals").CommissionTotals;
            nextDueAt: string | null;
        };
        rows: import("@/lib/admin/affiliates-queries").AffiliateRow[];
        asOf: string;
    }>;
    readonly "admin.affiliateDetail": (userId: string) => Promise<{
        asOf: string;
        detail: import("@/lib/admin/affiliates-queries").AffiliateDetail;
    }>;
    readonly "admin.setCommissionPaid": typeof setCommissionPaid;
    readonly "admin.markAffiliateCommissionsPaid": typeof markAffiliateCommissionsPaid;
};
export type MobileApi = typeof mobileApi;
export type MobileApiMethod = keyof MobileApi;
export declare function isMobileApiMethod(name: string): name is MobileApiMethod;
export {};
