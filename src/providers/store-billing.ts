import { Linking, Platform } from 'react-native';
import { adapty, isRunningInExpoGo, type AdaptyPaywallProduct } from 'react-native-adapty';

import { storePlanForProduct } from '@/lib/billing/store-products';
import type { BillingInterval, PaidPlanTier } from '@/lib/billing/plans';

/*
 * Plans sold through the App Store and Google Play, via Adapty.
 *
 * Adapty knows each buyer by our `users.id` (its "customer user ID"), which
 * is how the web app's webhook and `billing.syncStore` find the account a
 * purchase belongs to. The SDK is activated once per launch with the
 * signed-in user and re-identified when the account changes.
 */

/** The Adapty placement whose paywall lists the plans' store products. */
export const PLANS_PLACEMENT_ID = 'plans';

const publicKey = process.env.EXPO_PUBLIC_ADAPTY_PUBLIC_KEY?.trim() ?? '';

/**
 * Whether purchases go through the store. Needs a native build (Expo Go has
 * no store access; Adapty would only mock it) and the Adapty public key.
 * Everywhere else the app keeps selling through the web checkout.
 */
export const storeBillingEnabled =
  Boolean(publicKey) &&
  (Platform.OS === 'ios' || Platform.OS === 'android') &&
  !isRunningInExpoGo();

export type StoreName = 'app_store' | 'play_store';

/** The store this device buys from. */
export const deviceStore: StoreName = Platform.OS === 'android' ? 'play_store' : 'app_store';

/** Where a store subscriber changes or cancels their plan. */
export const STORE_SUBSCRIPTIONS_URL: Record<StoreName, string> = {
  app_store: 'https://apps.apple.com/account/subscriptions',
  play_store: 'https://play.google.com/store/account/subscriptions',
};

export function openStoreSubscriptions(store: StoreName = deviceStore) {
  return Linking.openURL(STORE_SUBSCRIPTIONS_URL[store]);
}

/** A store product the plan picker can sell. */
export type StoreProduct = {
  product: AdaptyPaywallProduct;
  tier: PaidPlanTier;
  interval: BillingInterval;
  /** Store-formatted price for the whole period ("R$ 299,90"). */
  priceLabel: string | null;
  /** Price amount and currency, for the per-month figure of a yearly plan. */
  amount: number | null;
  currencyCode: string | null;
  /** The store offers this account a free trial on this product. */
  hasFreeTrial: boolean;
};

let activeUserId: string | null = null;
// Serialises activate / identify / logout: Adapty rejects calls made while
// one of them is still running.
let ready: Promise<void> = Promise.resolve();

// Resolves once an account is connected. Screens can ask for products before
// the shell has connected (child effects run first), so SDK calls wait here.
let markConnected: () => void = () => {};
let connected = new Promise<void>((resolve) => {
  markConnected = resolve;
});

async function whenConnected() {
  await connected;
  await ready;
}

function accountParams(userId: string) {
  // Ties each store transaction to the account, so App Store and Play
  // records can be matched to our users even without Adapty.
  return {
    ios: { appAccountToken: userId },
    android: { obfuscatedAccountId: userId },
  };
}

/** Activates Adapty for the signed-in user, or switches it to them. */
export function connectStoreBilling(userId: string): Promise<void> {
  if (!storeBillingEnabled || activeUserId === userId) return ready;

  const previous = activeUserId;
  activeUserId = userId;
  ready = ready
    .catch(() => {})
    .then(async () => {
      if (!(await adapty.isActivated())) {
        await adapty.activate(publicKey, {
          customerUserId: userId,
          __ignoreActivationOnFastRefresh: __DEV__,
          // The app collects no advertising data; Adapty need not either.
          ipAddressCollectionDisabled: true,
          ios: { idfaCollectionDisabled: true, appAccountToken: userId },
          android: { adIdCollectionDisabled: true, obfuscatedAccountId: userId },
        });
        return;
      }
      if (previous !== userId) {
        await adapty.identify(userId, accountParams(userId));
      }
    })
    .then(() => markConnected());
  return ready;
}

/** Forgets the signed-in user (sign-out), so the next one starts clean. */
export function disconnectStoreBilling(): Promise<void> {
  if (!storeBillingEnabled || activeUserId === null) return ready;
  activeUserId = null;
  connected = new Promise<void>((resolve) => {
    markConnected = resolve;
  });
  ready = ready.catch(() => {}).then(() => adapty.logout());
  return ready;
}

/** The plans' store products, with the tier and interval each one sells. */
export async function loadStoreProducts(): Promise<StoreProduct[]> {
  await whenConnected();
  const flow = await adapty.getFlow(PLANS_PLACEMENT_ID);
  const products = await adapty.getPaywallProducts(flow);

  return products.flatMap((product) => {
    const plan = storePlanForProduct(
      product.vendorProductId,
      product.subscription?.android?.basePlanId,
    );
    const interval = plan?.interval ?? periodInterval(product);
    if (!plan || !interval) return [];
    return [
      {
        product,
        tier: plan.tier,
        interval,
        priceLabel: product.price?.localizedString ?? null,
        amount: product.price?.amount ?? null,
        currencyCode: product.price?.currencyCode ?? null,
        hasFreeTrial:
          product.subscription?.offer?.phases.some((phase) => phase.paymentMode === 'free_trial') ??
          false,
      },
    ];
  });
}

/** The interval from the store's own subscription period, when the ID has none. */
function periodInterval(product: AdaptyPaywallProduct): BillingInterval | null {
  const period = product.subscription?.subscriptionPeriod;
  if (!period) return null;
  if (period.unit === 'year' || (period.unit === 'month' && period.numberOfUnits === 12)) {
    return 'year';
  }
  if (period.unit === 'month' && period.numberOfUnits === 1) return 'month';
  return null;
}

export type StorePurchaseOutcome = 'success' | 'cancelled' | 'pending';

/** Runs the store's purchase sheet for one product. */
export async function purchaseStoreProduct(product: StoreProduct): Promise<StorePurchaseOutcome> {
  await whenConnected();
  // A dismissed sheet is a result (`user_cancelled`), not an error.
  const result = await adapty.makePurchase(product.product);
  return result.type === 'success'
    ? 'success'
    : result.type === 'pending'
      ? 'pending'
      : 'cancelled';
}

/** Re-attaches the store purchases of this device's store account. */
export async function restoreStorePurchases(): Promise<void> {
  await whenConnected();
  await adapty.restorePurchases();
}
