// Synced from my-money-v2 (src/lib/billing/entitlements.ts). Do not edit here: change it
// in the web repo and run `npm run sync:web`.
import { type GatedFeature, type LimitedResource, type PlanTier } from "@/lib/billing/plans";
import { schema } from "@/lib/db";
/**
 * A user's resolved billing state. All feature/limit checks in server code go
 * through this object so the tier policy lives in exactly one place
 * (`plans.ts`) and the subscription lookup in exactly one query.
 */
export type Entitlements = {
    /** Starter (free, the default for every account) or the active paid tier. */
    tier: PlanTier;
    /** active | past_due | canceled | … | null (never checked out) */
    status: string | null;
    /**
     * Whether a paid subscription is currently in force (active/past_due).
     * The app is usable either way: without one the account is on Starter.
     */
    hasActiveSubscription: boolean;
    /**
     * The tier is a complimentary plan we granted (`users.comp_tier`): it never
     * ends, has no Stripe subscription behind it and must never reach a
     * checkout, so there is nothing to bill, upgrade or manage.
     */
    complimentary: boolean;
    limits: Record<LimitedResource, number>;
    features: Record<GatedFeature, boolean>;
    currentPeriodEnd: string | null;
    /**
     * End of the free days the account is on (a plan's 7-day trial or days
     * granted by a referral; Stripe models both as a trial). Set while `status`
     * is "trialing"; billing resumes, or access ends, on this date.
     */
    trialEndsAt: string | null;
    /** Which free days are running: the plan trial or referral gift days. */
    freeDaysKind: "trial" | "gift" | null;
    /** The account already used its one plan trial; the next checkout bills. */
    planTrialUsed: boolean;
    /**
     * The plan trial ended and nothing was ever paid: the app redirects to the
     * plan picker and every gate closes until a plan is paid for.
     */
    lockedOut: boolean;
    cancelAtPeriodEnd: boolean;
    interval: "month" | "year" | null;
    /** Stripe holds a card for this subscription; free days from a referral
     *  gifted to a Starter account start without one. */
    hasPaymentMethod: boolean;
    /**
     * Who bills the plan in force: Stripe (bought on the web) or the App Store
     * / Google Play (bought in the native app). Null on Starter and on a
     * complimentary plan. A store plan is managed in the store, never through
     * Stripe's checkout or portal.
     */
    provider: BillingProvider | null;
};
export type BillingProvider = "stripe" | "app_store" | "play_store";
type SubscriptionRow = typeof schema.subscriptions.$inferSelect;
type StoreSubscriptionRow = typeof schema.storeSubscriptions.$inferSelect;
export declare function buildEntitlements(row: SubscriptionRow | undefined, compTier?: PlanTier | null, store?: StoreSubscriptionRow | null, now?: Date): Entitlements;
export declare function getSubscriptionForUserId(userId: string): Promise<{
    createdAt: Date;
    updatedAt: Date;
    id: string;
    userId: string;
    stripeCustomerId: string;
    stripeSubscriptionId: string | null;
    tier: "starter" | "plus" | "premium" | null;
    status: "trialing" | "active" | "past_due" | "unpaid" | "canceled" | "incomplete" | "incomplete_expired" | "paused" | null;
    interval: "month" | "year" | null;
    currentPeriodEnd: Date | null;
    trialEndsAt: Date | null;
    trialKind: "checkout" | "gift" | null;
    planTrialUsedAt: Date | null;
    firstPaidAt: Date | null;
    cancelAtPeriodEnd: boolean;
    hasPaymentMethod: boolean;
}>;
/** Entitlements for the signed-in user. Deduped per request via React cache. */
export declare const getEntitlements: () => Promise<Entitlements>;
export declare function getEntitlementsForUserId(userId: string): Promise<Entitlements>;
/** True when the signed-in user's tier unlocks the feature. */
export declare function hasFeature(feature: GatedFeature): Promise<boolean>;
export type LimitCheck = {
    ok: true;
} | {
    ok: false;
    limit: number;
    tier: PlanTier;
};
/**
 * Block-new-keep-existing enforcement: creating item number `currentCount + 1`
 * must stay within the tier cap. Existing over-cap data (after a downgrade)
 * remains untouched.
 */
export declare function checkResourceLimit(resource: LimitedResource, currentCount: number): Promise<LimitCheck>;
export {};
