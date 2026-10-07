// Synced from my-money-v2 (src/lib/billing/store-products.ts). Do not edit here: change it
// in the web repo and run `npm run sync:web`.
import type { BillingInterval, PaidPlanTier } from "@/lib/billing/plans";

/**
 * Plans sold inside the native app, through the App Store and Google Play.
 *
 * Store products are named so that the tier and the billing interval can be
 * read off the IDs, the way Stripe products carry `metadata.tier`:
 *
 *   App Store:    mymoney.plus.monthly, mymoney.premium.yearly, …
 *   Google Play:  subscription `mymoney.plus` with base plans `monthly` and
 *                 `yearly` (Adapty reports both IDs).
 *
 * The tier is the word `plus` or `premium`; the interval is `month`/`monthly`
 * or `year`/`yearly`/`annual`, in either ID. An ID that says neither tier is
 * not one of ours and grants nothing.
 */
export type StorePlan = { tier: PaidPlanTier; interval: BillingInterval | null };

export function storePlanForProduct(
  productId: string,
  basePlanId?: string | null,
): StorePlan | null {
  const words = `${productId} ${basePlanId ?? ""}`
    .toLowerCase()
    .split(/[^a-z0-9]+/);

  // Premium first: a name like "premium_plus_bundle" is the higher tier.
  const tier: PaidPlanTier | null = words.includes("premium")
    ? "premium"
    : words.includes("plus")
      ? "plus"
      : null;
  if (!tier) return null;

  const interval: BillingInterval | null = words.some((word) =>
    ["year", "yearly", "annual", "annually", "1y", "p1y"].includes(word),
  )
    ? "year"
    : words.some((word) =>
          ["month", "monthly", "1m", "p1m"].includes(word),
        )
      ? "month"
      : null;

  return { tier, interval };
}

/** The part of an Adapty access level this app reads. */
export type AdaptyAccessLevel = {
  access_level_id: string;
  store: string;
  store_product_id: string;
  store_base_plan_id?: string | null;
  store_original_transaction_id?: string | null;
  offer?: { category?: string | null; type?: string | null } | null;
  starts_at?: string | null;
  expires_at?: string | null;
  renewal_cancelled_at?: string | null;
  is_in_grace_period?: boolean | null;
};

/** The part of an Adapty profile this app reads. */
export type AdaptyProfile = {
  profile_id: string;
  customer_user_id: string | null;
  access_levels: AdaptyAccessLevel[];
};

/** What a store purchase grants, ready to store in `store_subscriptions`. */
export type StoreAccess = {
  adaptyProfileId: string;
  store: string;
  productId: string;
  basePlanId: string | null;
  tier: PaidPlanTier;
  interval: BillingInterval | null;
  isActive: boolean;
  expiresAt: Date | null;
  renewalCancelled: boolean;
  isInGracePeriod: boolean;
  isTrial: boolean;
  originalTransactionId: string | null;
};

const TIER_RANK: Record<PaidPlanTier, number> = { plus: 1, premium: 2 };

/** Stores whose purchases this app recognises. Stripe is billed directly. */
const NATIVE_STORES = new Set(["app_store", "play_store"]);

function parseDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function toAccess(
  profileId: string,
  level: AdaptyAccessLevel,
  now: Date,
): StoreAccess | null {
  if (!NATIVE_STORES.has(level.store)) return null;
  const plan = storePlanForProduct(
    level.store_product_id,
    level.store_base_plan_id,
  );
  if (!plan) return null;

  const startsAt = parseDate(level.starts_at);
  const expiresAt = parseDate(level.expires_at);
  // Adapty computes "active" the same way: started, and not yet expired
  // (a missing expiry is access that never ends). During a grace period the
  // expiry is the end of the grace period.
  const isActive =
    (!startsAt || startsAt.getTime() <= now.getTime()) &&
    (!expiresAt || expiresAt.getTime() > now.getTime());

  return {
    adaptyProfileId: profileId,
    store: level.store,
    productId: level.store_product_id,
    basePlanId: level.store_base_plan_id ?? null,
    tier: plan.tier,
    interval: plan.interval,
    isActive,
    expiresAt,
    renewalCancelled: level.renewal_cancelled_at != null,
    isInGracePeriod: level.is_in_grace_period === true,
    isTrial:
      level.offer?.category === "introductory" &&
      level.offer?.type === "free_trial",
    originalTransactionId: level.store_original_transaction_id ?? null,
  };
}

/**
 * The store access an Adapty profile grants: the highest active tier, or,
 * when nothing is active any more, the most recently expired one (kept so
 * the row records that the plan ended). Null when the profile has no store
 * purchase of ours at all.
 */
export function storeAccessFromProfile(
  profile: AdaptyProfile,
  now: Date = new Date(),
): StoreAccess | null {
  const candidates = profile.access_levels
    .map((level) => toAccess(profile.profile_id, level, now))
    .filter((access): access is StoreAccess => access !== null);
  if (candidates.length === 0) return null;

  const active = candidates.filter((access) => access.isActive);
  if (active.length > 0) {
    return active.reduce((best, access) =>
      TIER_RANK[access.tier] > TIER_RANK[best.tier] ? access : best,
    );
  }

  return candidates.reduce((latest, access) =>
    (access.expiresAt?.getTime() ?? 0) > (latest.expiresAt?.getTime() ?? 0)
      ? access
      : latest,
  );
}
