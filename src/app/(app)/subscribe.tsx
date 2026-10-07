import { useQuery } from '@tanstack/react-query';
import { Redirect, useRouter } from 'expo-router';
import { LogOut, X } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

import { usePullToRefresh, useRefreshData, useScreenQuery } from '@/api/hooks';
import { DeleteAccountDialog } from '@/components/billing/delete-account-dialog';
import { useEntitlements } from '@/components/billing/entitlements-provider';
import { PlanPicker } from '@/components/billing/plan-picker';
import { Button, IconButton } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { Skeleton, SkeletonCard } from '@/components/ui/skeleton';
import { Text } from '@/components/ui/text';
import { useI18n } from '@/lib/i18n/provider';
import { useBootstrap } from '@/providers/app-data-provider';
import { useSession } from '@/providers/auth-provider';
import { loadStoreProducts, storeBillingEnabled } from '@/providers/store-billing';
import { useTheme } from '@/theme/theme-provider';
import { radius } from '@/theme/tokens';

/**
 * Sign-out escape hatch: this screen sits outside the tabs, so there is no
 * menu to sign out from.
 */
function SignOutButton({ label }: { label: string }) {
  const { colors } = useTheme();
  const { signOut } = useSession();

  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => signOut()}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        height: 40,
        paddingHorizontal: 16,
        borderRadius: radius.pill,
        borderWidth: 1,
        borderColor: colors.line,
        backgroundColor: pressed ? colors.controlHover : colors.surface1,
      })}>
      <LogOut size={16} color={colors.ink2} />
      <Text font="sansMedium" size="sm" color="ink2">
        {label}
      </Text>
    </Pressable>
  );
}

/**
 * Plan picker for signed-in users on the free Starter tier: brand-new
 * accounts (every sign-up lands here before onboarding), abandoned
 * checkouts, and canceled or lapsed paid plans. Usually an upgrade offer with
 * a way to continue for free (into onboarding for a new account, back to the
 * app otherwise); for an account whose plan trial ended unpaid it is the
 * locked screen, where paying for a plan (or deleting the account) is the
 * only way forward. Subscribers change plans where they bought them (the
 * Stripe portal, or the store), so an active paid plan (or a complimentary
 * one) skips it.
 */
export default function SubscribeScreen() {
  const { locale, messages } = useI18n();
  const entitlements = useEntitlements();
  const { onboarding } = useBootstrap();
  const router = useRouter();
  const refresh = useRefreshData();
  // A store build sells the store's products; anywhere else, Stripe's plans.
  const prices = useScreenQuery('billing.displayPrices', [], { enabled: !storeBillingEnabled });
  const storeProducts = useQuery({
    queryKey: ['store-products'],
    queryFn: loadStoreProducts,
    enabled: storeBillingEnabled,
  });
  const catalog = storeBillingEnabled ? storeProducts : prices;
  // Reloads the plan as well as the prices: a payment made elsewhere unlocks
  // the account from here.
  const { onRefresh, refreshing } = usePullToRefresh({ refetch: refresh });

  // A new account continues into onboarding, whichever plan it picks.
  const next = onboarding.completed ? '/dashboard' : '/onboard';

  if (entitlements.hasActiveSubscription || entitlements.complimentary) {
    return <Redirect href={next} />;
  }

  const locked = entitlements.lockedOut;
  const notice = locked
    ? messages.billing.subscribe.trialEnded
    : entitlements.status === 'canceled'
      ? messages.billing.subscribe.subscriptionEnded
      : null;

  const leave = () =>
    onboarding.completed && router.canGoBack() ? router.back() : router.replace(next);

  return (
    <Screen onRefresh={onRefresh} refreshing={refreshing} bottomInset={56}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: locked ? 'flex-end' : 'space-between',
          marginTop: 14,
          marginBottom: 28,
        }}>
        {locked ? null : (
          <IconButton
            accessibilityLabel={messages.nav.back}
            icon={(props) => <X {...props} />}
            onPress={leave}
          />
        )}
        <SignOutButton label={messages.nav.signOut} />
      </View>

      {catalog.data ? (
        <PlanPicker
          messages={messages.billing.subscribe}
          plans={messages.landing.pricing.plans}
          prices={prices.data}
          storeProducts={storeProducts.data}
          notice={notice}
          locked={locked}
          trialAvailable={!entitlements.planTrialUsed}
          onContinueFree={leave}
          onSubscribed={() => router.replace(next)}
        />
      ) : catalog.isError ? (
        <View style={{ alignItems: 'center', gap: 12, paddingVertical: 48 }}>
          <Text size="sm" color="ink3" align="center">
            {storeBillingEnabled ? messages.billing.store.unavailable : catalog.error?.message}
          </Text>
          <Button
            variant="outline"
            label={locale === 'pt-BR' ? 'Tentar de novo' : 'Try again'}
            onPress={() => catalog.refetch()}
          />
        </View>
      ) : (
        <View style={{ gap: 20 }}>
          <View style={{ alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <Skeleton width={64} height={14} />
            <Skeleton width="80%" height={40} />
            <Skeleton width="90%" height={16} />
            <Skeleton width={220} height={44} rounded={radius.pill} style={{ marginTop: 16 }} />
          </View>
          <SkeletonCard lines={5} />
          <SkeletonCard lines={5} />
        </View>
      )}

      {locked ? (
        <View style={{ marginTop: 56 }}>
          <DeleteAccountDialog messages={messages.billing.deleteAccount} />
        </View>
      ) : null}
    </Screen>
  );
}
