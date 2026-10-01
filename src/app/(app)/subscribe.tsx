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
import { useSession } from '@/providers/auth-provider';
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
 * Plan picker for signed-in users on the free Starter tier: new accounts that
 * skipped or abandoned checkout, and canceled or lapsed paid plans. Usually
 * an upgrade offer with a way back to the app; for an account whose plan
 * trial ended unpaid it is the locked screen, where paying for a plan (or
 * deleting the account) is the only way forward. Subscribers change plans
 * through the Stripe portal instead, so an active paid plan skips it.
 */
export default function SubscribeScreen() {
  const { locale, messages } = useI18n();
  const entitlements = useEntitlements();
  const router = useRouter();
  const refresh = useRefreshData();
  const prices = useScreenQuery('billing.displayPrices', []);
  // Reloads the plan as well as the prices: a payment made elsewhere unlocks
  // the account from here.
  const { onRefresh, refreshing } = usePullToRefresh({ refetch: refresh });

  if (entitlements.hasActiveSubscription) {
    return <Redirect href="/dashboard" />;
  }

  const locked = entitlements.lockedOut;
  const notice = locked
    ? messages.billing.subscribe.trialEnded
    : entitlements.status === 'canceled'
      ? messages.billing.subscribe.subscriptionEnded
      : null;

  const leave = () => (router.canGoBack() ? router.back() : router.replace('/dashboard'));

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

      {prices.data ? (
        <PlanPicker
          messages={messages.billing.subscribe}
          plans={messages.landing.pricing.plans}
          prices={prices.data}
          notice={notice}
          locked={locked}
          trialAvailable={!entitlements.planTrialUsed}
          onContinueFree={leave}
          onSubscribed={() => router.replace('/dashboard')}
        />
      ) : prices.isError ? (
        <View style={{ alignItems: 'center', gap: 12, paddingVertical: 48 }}>
          <Text size="sm" color="ink3" align="center">
            {prices.error.message}
          </Text>
          <Button
            variant="outline"
            label={locale === 'pt-BR' ? 'Tentar de novo' : 'Try again'}
            onPress={() => prices.refetch()}
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
