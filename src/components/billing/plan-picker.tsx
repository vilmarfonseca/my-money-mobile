import { LinearGradient } from 'expo-linear-gradient';
import { Check } from 'lucide-react-native';
import { useState } from 'react';
import { Linking, Platform, Pressable, View } from 'react-native';

import { callApi } from '@/api/client';
import { useRefreshData } from '@/api/hooks';
import { openWebFlow, openWebPage } from '@/api/web-handoff';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { toast } from '@/components/ui/toast';
import type { DisplayPrices } from '@/lib/billing/display-prices';
import {
  FREE_TIER,
  PLAN_TIERS,
  isPaidPlanTier,
  type BillingInterval,
  type PaidPlanTier,
} from '@/lib/billing/plans';
import type { Messages } from '@/lib/i18n/messages';
import { useI18n } from '@/lib/i18n/provider';
import {
  deviceStore,
  purchaseStoreProduct,
  restoreStorePurchases,
  type StoreProduct,
} from '@/providers/store-billing';
import { useTheme } from '@/theme/theme-provider';
import { palette, radius, shadows } from '@/theme/tokens';

/** `text-action-foreground/60`: a hex token at partial opacity. */
function withAlpha(hex: string, alpha: number) {
  const value = hex.replace('#', '');
  if (value.length !== 6) return hex;
  const channels = parseInt(value, 16);
  return `rgba(${(channels >> 16) & 255}, ${(channels >> 8) & 255}, ${channels & 255}, ${alpha})`;
}

/** Apple's standard licence agreement, linked from the paywall as its terms of use. */
const APPLE_STANDARD_EULA = 'https://www.apple.com/legal/internet-services/itunes/dev/stdeula/';

/**
 * In-app plan picker for signed-in users on the free Starter tier (new
 * account, abandoned checkout, canceled/lapsed plan). Starter is the current
 * plan and continues into the app. The paid tiers are sold one of two ways:
 *
 * - with `storeProducts` (a store build), through the App Store or Google
 *   Play at the store's prices, then the account is synced from Adapty;
 * - otherwise through Stripe Checkout in an in-app browser, after which the
 *   account is reloaded to see whether it paid.
 */
export function PlanPicker({
  messages,
  plans,
  prices,
  storeProducts,
  notice = null,
  locked = false,
  trialAvailable = false,
  onContinueFree,
  onSubscribed,
}: {
  messages: Messages['billing']['subscribe'];
  plans: Messages['landing']['pricing']['plans'];
  /** Stripe prices, for selling through the web checkout. */
  prices?: DisplayPrices;
  /** The store's products: sell through the App Store / Google Play instead. */
  storeProducts?: StoreProduct[];
  /** Why the user is here (subscription ended, trial over), if known. */
  notice?: string | null;
  /** Plan trial ended unpaid: no free tier to fall back on, pay to go on. */
  locked?: boolean;
  /** The account has not used its plan trial: paid plans start with free days. */
  trialAvailable?: boolean;
  /** The free Starter card's action: onboarding for a new account, else back to the app. */
  onContinueFree: () => void;
  /** Checkout closed and the account now has a paid plan. */
  onSubscribed: () => void;
}) {
  const { colors } = useTheme();
  const { locale, messages: allMessages } = useI18n();
  const refresh = useRefreshData();
  const storeMessages = allMessages.billing.store;
  const storeName = storeMessages.names[deviceStore];
  const [restoring, setRestoring] = useState(false);

  const productFor = (tier: PaidPlanTier, interval: BillingInterval) =>
    storeProducts?.find((product) => product.tier === tier && product.interval === interval);

  /** Per-month price and the yearly total, from the store or from Stripe. */
  const priceOf = (tier: PaidPlanTier) => {
    if (!storeProducts) {
      return {
        perMonth: prices?.[tier][cycle] ?? null,
        yearTotal: prices?.[tier].yearTotal ?? null,
      };
    }
    const product = productFor(tier, cycle);
    if (!product) return { perMonth: null, yearTotal: null };
    if (cycle === 'month') return { perMonth: product.priceLabel, yearTotal: null };
    // A yearly plan shows its per-month equivalent, with the yearly charge
    // right under it, as the web's pricing does.
    const perMonth =
      product.amount != null && product.currencyCode
        ? new Intl.NumberFormat(locale, {
            style: 'currency',
            currency: product.currencyCode,
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          }).format(product.amount / 12)
        : product.priceLabel;
    return { perMonth, yearTotal: product.priceLabel };
  };

  /** After a store purchase or restore: let the server read it from Adapty. */
  const syncStoreAccess = async () => {
    const entitlements = await callApi('billing.syncStore');
    await refresh();
    return entitlements.hasActiveSubscription;
  };

  const restore = async () => {
    setRestoring(true);
    try {
      await restoreStorePurchases();
      if (await syncStoreAccess()) {
        toast.success(storeMessages.restored);
        onSubscribed();
      } else {
        toast.message(storeMessages.nothingToRestore);
      }
    } catch (failure) {
      toast.error(failure instanceof Error ? failure.message : storeMessages.purchaseFailed);
    } finally {
      setRestoring(false);
    }
  };
  // Yearly first, matching the landing page's pricing section.
  const [cycle, setCycle] = useState<BillingInterval>('year');
  const [pendingTier, setPendingTier] = useState<PaidPlanTier | null>(null);
  const [error, setError] = useState(false);
  // The web learns this from Stripe's cancel_url; here it is the browser
  // closing with the account still unpaid.
  const [canceled, setCanceled] = useState(false);

  const startStorePurchase = async (tier: PaidPlanTier) => {
    const product = productFor(tier, cycle);
    if (!product) return;
    setError(false);
    setCanceled(false);
    setPendingTier(tier);
    try {
      let outcome;
      try {
        outcome = await purchaseStoreProduct(product);
      } catch {
        toast.error(storeMessages.purchaseFailed);
        return;
      }
      if (outcome === 'cancelled') return;
      if (outcome === 'pending') {
        toast.message(storeMessages.pending);
        return;
      }
      // The store has taken the payment. If the server cannot confirm it yet
      // the webhook will, and the screen leaves once the account reloads paid;
      // the user must not be told to buy again.
      try {
        if (await syncStoreAccess()) {
          onSubscribed();
          return;
        }
      } catch {
        // Falls through to the reassurance below.
      }
      toast.message(storeMessages.activating);
    } finally {
      setPendingTier(null);
    }
  };

  const startCheckout = async (tier: PaidPlanTier) => {
    if (storeProducts) {
      await startStorePurchase(tier);
      return;
    }
    setError(false);
    setCanceled(false);
    setPendingTier(tier);
    try {
      await openWebFlow(`/api/billing/checkout?plan=${tier}&interval=${cycle}`);
    } catch {
      setError(true);
      setPendingTier(null);
      return;
    }
    try {
      await refresh();
      const entitlements = await callApi('billing.entitlements');
      if (entitlements.hasActiveSubscription) {
        onSubscribed();
        return;
      }
      setCanceled(true);
    } catch {
      // Could not tell whether it paid; the picker stays as it was and the
      // screen leaves by itself once the account reloads as subscribed.
    } finally {
      setPendingTier(null);
    }
  };

  const tiers = PLAN_TIERS.filter((tier) => !locked || isPaidPlanTier(tier));

  return (
    <View>
      <View style={{ alignItems: 'center' }}>
        <Text
          font="monoSemiBold"
          size="xs"
          color="accentSoftFg"
          uppercase
          tracking={0.6}
          align="center">
          {messages.eyebrow}
        </Text>
        <Text
          accessibilityRole="header"
          font="display"
          size="4xl"
          tracking={-0.9}
          align="center"
          style={{ marginTop: 12 }}>
          {messages.titleLead}{' '}
          <Text font="displayItalic" size="4xl" color="ink2" tracking={-0.9}>
            {messages.titleEmphasis}
          </Text>
        </Text>
        <Text size="sm" color="ink3" align="center" style={{ marginTop: 12 }}>
          {messages.subtitle}
        </Text>

        {notice ? (
          <View
            style={{
              alignSelf: 'stretch',
              marginTop: 20,
              paddingHorizontal: 16,
              paddingVertical: 12,
              borderRadius: radius.md,
              backgroundColor: colors.warmSoft,
            }}>
            <Text size="sm" color="warmSoftFg" align="center">
              {notice}
            </Text>
          </View>
        ) : null}

        {error || canceled ? (
          <View
            accessibilityRole="alert"
            style={{
              marginTop: 20,
              paddingHorizontal: 16,
              paddingVertical: 8,
              borderRadius: radius.lg,
              backgroundColor: error ? colors.negativeSoft : colors.warmSoft,
            }}>
            <Text size="sm" color={error ? 'negativeFg' : 'warmSoftFg'} align="center">
              {error ? messages.error : messages.canceled}
            </Text>
          </View>
        ) : null}

        <View
          accessibilityRole="tablist"
          style={{
            flexDirection: 'row',
            gap: 4,
            marginTop: 28,
            padding: 4,
            borderRadius: radius.pill,
            borderWidth: 1,
            borderColor: colors.line,
            backgroundColor: colors.surface1,
          }}>
          {(['month', 'year'] as const).map((option) => {
            const active = cycle === option;
            return (
              <Pressable
                key={option}
                accessibilityRole="tab"
                accessibilityState={{ selected: active }}
                onPress={() => setCycle(option)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                  paddingHorizontal: 20,
                  paddingVertical: 8,
                  borderRadius: radius.pill,
                  backgroundColor: active ? colors.action : 'transparent',
                }}>
                <Text font="sansMedium" size="sm" color={active ? 'actionForeground' : 'ink2'}>
                  {option === 'month' ? messages.monthly : messages.yearly}
                </Text>
                {option === 'year' ? (
                  <View
                    style={{
                      paddingHorizontal: 8,
                      paddingVertical: 2,
                      borderRadius: radius.pill,
                      backgroundColor: colors.positiveSoft,
                    }}>
                    <Text font="sansMedium" size="xs" color="positiveFg">
                      {messages.saveTag}
                    </Text>
                  </View>
                ) : null}
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={{ gap: 20, marginTop: 40 }}>
        {tiers.map((tier) => {
          const plan = plans[tier];
          const free = tier === FREE_TIER;
          const paid = isPaidPlanTier(tier) ? priceOf(tier) : null;
          const price = free ? messages.free : (paid?.perMonth ?? null);
          const yearTotal = paid?.yearTotal ?? null;
          // The store says whether this account still gets a free trial.
          const showTrial = storeProducts
            ? isPaidPlanTier(tier) && Boolean(productFor(tier, cycle)?.hasFreeTrial)
            : trialAvailable;
          const unavailable = Boolean(storeProducts) && !free && price == null;
          const featured = tier === 'plus';
          const fg = featured ? colors.actionForeground : colors.ink1;
          const muted = featured ? withAlpha(colors.actionForeground, 0.6) : colors.ink3;

          return (
            <View
              key={tier}
              style={{
                padding: 28,
                borderRadius: radius.xl,
                borderWidth: 1,
                borderColor: colors.line,
                backgroundColor: featured ? colors.action : colors.surface1,
                boxShadow: featured ? shadows.xl : shadows.md,
              }}>
              {featured ? (
                <LinearGradient
                  colors={[palette.plum400, palette.coral400]}
                  start={{ x: 0, y: 0.35 }}
                  end={{ x: 1, y: 0.65 }}
                  style={{
                    position: 'absolute',
                    top: 20,
                    right: 20,
                    paddingHorizontal: 10,
                    paddingVertical: 6,
                    borderRadius: radius.pill,
                  }}>
                  <Text font="mono" size="xs" color={palette.white} uppercase tracking={0.6}>
                    {messages.mostPopular}
                  </Text>
                </LinearGradient>
              ) : null}

              <Text
                font="monoSemiBold"
                size="xs"
                color={featured ? colors.actionForeground : colors.ink2}
                uppercase
                tracking={0.6}>
                {plan.name}
              </Text>
              <Text
                font="display"
                size="5xl"
                tight
                tracking={-1.2}
                color={fg}
                style={{ marginTop: 12 }}>
                {price ?? '—'}
                {free ? null : (
                  <Text font="sans" size="base" color={muted} tracking={0}>
                    {` ${messages.perMonth}`}
                  </Text>
                )}
              </Text>
              {/* Kept in the layout on the monthly toggle so the card does not jump. */}
              <Text
                size="xs"
                color={muted}
                style={{ marginTop: 4, opacity: !free && cycle === 'month' ? 0 : 1 }}>
                {free
                  ? messages.freeNote
                  : yearTotal
                    ? `${yearTotal} ${messages.billedYearly}`
                    : messages.billedYearly}
              </Text>
              {!free && showTrial ? (
                <Text
                  font="sansMedium"
                  size="xs"
                  color={featured ? palette.coral300 : colors.accentSoftFg}
                  style={{ marginTop: 8 }}>
                  {messages.trialNote}
                </Text>
              ) : null}

              <View accessibilityRole="list" style={{ gap: 10, marginTop: 16, marginBottom: 24 }}>
                {plan.features.map((feature) => (
                  <View key={feature} style={{ flexDirection: 'row', gap: 10 }}>
                    <Check
                      size={16}
                      strokeWidth={2}
                      color={featured ? palette.coral300 : palette.plum500}
                      style={{ marginTop: 2 }}
                    />
                    <Text size="sm" color={fg} style={{ flex: 1 }}>
                      {feature}
                    </Text>
                  </View>
                ))}
              </View>

              {isPaidPlanTier(tier) ? (
                <Button
                  block
                  variant="outline"
                  label={showTrial ? messages.trialCta : messages.cta}
                  loading={pendingTier === tier}
                  disabled={
                    unavailable || restoring || (pendingTier !== null && pendingTier !== tier)
                  }
                  onPress={() => startCheckout(tier)}
                  style={
                    featured
                      ? { backgroundColor: colors.surface1, borderColor: 'transparent' }
                      : undefined
                  }
                />
              ) : (
                <Button
                  block
                  variant="outline"
                  label={messages.continueFreeCta}
                  onPress={onContinueFree}
                />
              )}
            </View>
          );
        })}
      </View>

      {storeProducts ? (
        // What the stores require next to a subscription offer: a way to
        // restore purchases, the auto-renewal terms, and the legal links.
        <View style={{ alignItems: 'center', gap: 14, marginTop: 28 }}>
          {storeProducts.length === 0 ? (
            <Text size="sm" color="ink3" align="center">
              {storeMessages.unavailable}
            </Text>
          ) : null}
          <Button
            variant="ghost"
            label={storeMessages.restore}
            loading={restoring}
            disabled={pendingTier !== null}
            onPress={restore}
          />
          <Text size="xs" color="ink3" align="center">
            {storeMessages.autoRenew(storeName)}
          </Text>
          <View style={{ flexDirection: 'row', gap: 20 }}>
            {Platform.OS === 'ios' ? (
              <LegalLink
                label={storeMessages.terms}
                onPress={() => openExternal(APPLE_STANDARD_EULA)}
              />
            ) : null}
            <LegalLink
              label={storeMessages.privacy}
              onPress={() => openWebPage(locale === 'pt-BR' ? '/privacy' : '/en/privacy')}
            />
          </View>
        </View>
      ) : null}
    </View>
  );
}

function LegalLink({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="link" onPress={onPress} hitSlop={8}>
      <Text size="xs" color="ink2" style={{ textDecorationLine: 'underline' }}>
        {label}
      </Text>
    </Pressable>
  );
}

function openExternal(url: string) {
  Linking.openURL(url).catch(() => {});
}
