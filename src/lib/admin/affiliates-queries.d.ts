// Synced from my-money-v2 (src/lib/admin/affiliates-queries.ts). Do not edit here: change it
// in the web repo and run `npm run sync:web`.
import { type CommissionTotals } from "@/lib/admin/commission-totals";
import { type BillingInterval, type PaidPlanTier } from "@/lib/billing/plans";
import type { DateRangeParams } from "@/lib/date-range";
import { type FilterPeriod } from "@/lib/period-window";
export type AffiliatePeriod = FilterPeriod;
/** Plan filter for conversions: a paid tier, or every paid tier. */
export type AffiliatePlanFilter = PaidPlanTier | "all";
export declare function parseAffiliatePlanFilter(value: unknown): AffiliatePlanFilter;
export type PaidByTier = Record<PaidPlanTier, number>;
/** Conversions per plan, split by how the invitee is billed. */
export type PaidByPlan = Record<PaidPlanTier, Record<BillingInterval, number>>;
export type AffiliateRow = {
    userId: string;
    name: string | null;
    email: string;
    code: string;
    /** Accounts created with the code inside the period (paid or not). */
    signedUp: number;
    /** Invitees whose paid checkout completed inside the period (and matched
     *  the plan filter): the number that counts for an affiliate. */
    paid: number;
    /** The period's conversions split by the plan the invitee bought. Not
     *  narrowed by the plan filter, so the mix is always visible. */
    paidByTier: PaidByTier;
    /** The same mix, split into monthly and annual subscriptions: the two pay
     *  a different commission. */
    paidByPlan: PaidByPlan;
    /** Conversions over all time (plan filter applied), for context. */
    paidAllTime: number;
    lastPaidAt: string | null;
    /** Commission earned by the period's conversions (plan filter applied). */
    commission: CommissionTotals;
    /** The part of `commission` already paid to the affiliate. */
    commissionPaid: CommissionTotals;
    /** Everything still unpaid, over all time and every plan: the balance to
     *  settle, whatever the filters say. */
    commissionOwed: CommissionTotals;
    /** When the oldest unpaid commission falls due; in the past = overdue. */
    nextDueAt: string | null;
};
export type AffiliatesPage = {
    period: AffiliatePeriod;
    plan: AffiliatePlanFilter;
    window: {
        start: string;
        end: string;
    };
    totals: {
        signedUp: number;
        paid: number;
        paidByTier: PaidByTier;
        paidByPlan: PaidByPlan;
        affiliates: number;
        commission: CommissionTotals;
        commissionPaid: CommissionTotals;
        commissionOwed: CommissionTotals;
        nextDueAt: string | null;
    };
    rows: AffiliateRow[];
};
/**
 * Per-inviter referral performance for the admin dashboard. Attribution
 * follows the same period filter as the finance pages: sign-ups are placed
 * by the invitee's account creation, paid conversions by the moment the
 * invitee's card-backed checkout completed (`rewardedAt`), so a friend who
 * signed up in March and paid in May counts as a March sign-up and a May
 * conversion. Each conversion is credited to the plan the invitee bought
 * (`inviteeTier`), which the plan filter narrows the conversion counts to.
 *
 * Money follows the conversions: the period's commission is what the
 * conversions counted above earned, while the balance still owed ignores
 * both filters so an old unpaid commission never drops out of sight.
 */
export declare function loadAffiliates(period: AffiliatePeriod, customRange?: DateRangeParams, ref?: Date, plan?: AffiliatePlanFilter): Promise<AffiliatesPage>;
/** One paid conversion, as the affiliate's payment ledger lists it. */
export type AffiliateConversion = {
    referralId: string;
    inviteeName: string | null;
    inviteeEmail: string;
    tier: PaidPlanTier | null;
    interval: BillingInterval | null;
    convertedAt: string;
    /** Minor units of `commissionCurrency`; null for a conversion settled
     *  before commissions were recorded. */
    commissionAmount: number | null;
    commissionCurrency: string | null;
    dueAt: string;
    paidAt: string | null;
};
export type AffiliateDetail = {
    affiliate: {
        userId: string;
        name: string | null;
        email: string;
        code: string;
    };
    conversions: AffiliateConversion[];
    totals: {
        commission: CommissionTotals;
        commissionPaid: CommissionTotals;
        commissionOwed: CommissionTotals;
    };
};
export declare function isUuid(value: unknown): value is string;
/**
 * Every paid conversion one affiliate has brought in, newest first, with what
 * each one pays, when it falls due and whether it was already paid. Null when
 * the user does not exist.
 */
export declare function loadAffiliateDetail(userId: string): Promise<AffiliateDetail | null>;
