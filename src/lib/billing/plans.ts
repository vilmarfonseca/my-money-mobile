// Synced from my-money-v2 (src/lib/billing/plans.ts). Do not edit here: change it
// in the web repo and run `npm run sync:web`.
/**
 * Single source of truth for the pricing tiers: per-tier resource limits and
 * the minimum tier each gated feature requires. Every gate in the app (server
 * actions, pages, sidebar, onboarding) reads from here — changing a tier's
 * entitlements is a one-line edit in this file.
 */

export const PLAN_TIERS = ["starter", "plus", "premium"] as const;
export type PlanTier = (typeof PLAN_TIERS)[number];

/**
 * Starter is free: every signed-in account has it without a Stripe
 * subscription. Only the paid tiers go through Checkout, and a canceled or
 * lapsed paid subscription falls back to Starter instead of locking the app.
 */
export const FREE_TIER = "starter" satisfies PlanTier;
export const PAID_PLAN_TIERS = ["plus", "premium"] as const;
export type PaidPlanTier = (typeof PAID_PLAN_TIERS)[number];

export function isPaidPlanTier(value: unknown): value is PaidPlanTier {
  return PAID_PLAN_TIERS.includes(value as PaidPlanTier);
}

export const BILLING_INTERVALS = ["month", "year"] as const;
export type BillingInterval = (typeof BILLING_INTERVALS)[number];

/**
 * Currencies the Stripe catalog is priced in. Brazil is billed in reais;
 * every other country is billed in US dollars.
 */
export const BILLING_CURRENCIES = ["brl", "usd"] as const;
export type BillingCurrency = (typeof BILLING_CURRENCIES)[number];

export const DEFAULT_BILLING_CURRENCY: BillingCurrency = "usd";

export function isBillingCurrency(value: unknown): value is BillingCurrency {
  return BILLING_CURRENCIES.includes(value as BillingCurrency);
}

const TIER_RANK: Record<PlanTier, number> = {
  starter: 0,
  plus: 1,
  premium: 2,
};

/** Countable resources with per-tier caps. */
export type LimitedResource = "accounts" | "creditCards" | "goals";

export const UNLIMITED = Number.POSITIVE_INFINITY;

export const PLAN_LIMITS: Record<PlanTier, Record<LimitedResource, number>> = {
  starter: { accounts: 1, creditCards: 1, goals: 1 },
  plus: { accounts: 5, creditCards: 5, goals: 5 },
  premium: { accounts: UNLIMITED, creditCards: UNLIMITED, goals: UNLIMITED },
};

/** Boolean features gated behind a minimum tier. */
export type GatedFeature =
  | "csvImportExport"
  | "calendarPage"
  | "balancePage"
  | "fiscalMonth"
  | "smartTips"
  | "support"
  | "analyticsPage"
  | "household"
  | "calendarSync";

export const FEATURE_MIN_TIER: Record<GatedFeature, PlanTier> = {
  csvImportExport: "starter",
  calendarPage: "plus",
  balancePage: "plus",
  fiscalMonth: "plus",
  smartTips: "plus",
  support: "plus",
  analyticsPage: "premium",
  household: "premium",
  calendarSync: "premium",
};

/** Free days a paid plan starts with at checkout. No card is asked for. */
export const TRIAL_PERIOD_DAYS = 7;

/**
 * What happens to an account whose plan trial ended without a payment:
 * "lock" keeps it out of the app until a plan is paid for; "starter" would
 * drop it to the free tier instead. One switch, read by `trial-lock.ts`.
 */
export const TRIAL_LAPSE_BEHAVIOR: "lock" | "starter" = "lock";

/**
 * Subscription statuses under which a paid tier's entitlements apply.
 * `past_due` keeps the paid tier while Stripe retries payment; hard-failed
 * states (canceled/unpaid/incomplete) drop the account to the free Starter
 * tier immediately. `trialing` covers a plan's 7 free days and the free days
 * a referral grants.
 */
export const ACCESS_STATUSES: ReadonlySet<string> = new Set([
  "trialing",
  "active",
  "past_due",
]);

/**
 * How long past the billing period a `past_due` subscription keeps access.
 * Stripe's dunning can be configured to leave a subscription `past_due`
 * indefinitely, which would otherwise be unlimited free access on a dead card.
 */
export const PAST_DUE_GRACE_DAYS = 14;

/**
 * True when the subscription's last payment failed and needs the user's
 * attention. `past_due` still grants access during the grace window, so the
 * app blocks the UI with a payment-issue dialog instead of locking the user
 * out; `unpaid` is what Stripe parks a subscription in when dunning gives up.
 */
export function hasPaymentIssue(status: string | null): boolean {
  return status === "past_due" || status === "unpaid";
}

export function isPlanTier(value: unknown): value is PlanTier {
  return PLAN_TIERS.includes(value as PlanTier);
}

export function isBillingInterval(value: unknown): value is BillingInterval {
  return BILLING_INTERVALS.includes(value as BillingInterval);
}

export function tierHasFeature(tier: PlanTier, feature: GatedFeature): boolean {
  return TIER_RANK[tier] >= TIER_RANK[FEATURE_MIN_TIER[feature]];
}

export function tierLimit(tier: PlanTier, resource: LimitedResource): number {
  return PLAN_LIMITS[tier][resource];
}

/** Smallest tier that unlocks a feature — used by upgrade prompts. */
export function minTierForFeature(feature: GatedFeature): PlanTier {
  return FEATURE_MIN_TIER[feature];
}
