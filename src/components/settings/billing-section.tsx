import { useRouter } from 'expo-router';
import { ArrowLeftRight, CreditCard, ExternalLink, ShieldCheck, Sparkles } from 'lucide-react-native';
import { useState } from 'react';
import { View } from 'react-native';

import { useRefreshData } from '@/api/hooks';
import { openWebFlow, type WebFlowPath } from '@/api/web-handoff';
import { openStoreSubscriptions } from '@/providers/store-billing';
import { useEntitlements } from '@/components/billing/entitlements-provider';
import { errorMessage } from '@/components/settings/action-result';
import { SectionHeading } from '@/components/settings/section-heading';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { toast } from '@/components/ui/toast';
import { useI18n } from '@/lib/i18n/provider';
import { daysUntil } from '@/lib/referrals/referral-code';
import { useTheme } from '@/theme/theme-provider';
import { radius } from '@/theme/tokens';

/**
 * Settings → Billing: current plan, status, and the door to the Stripe
 * Billing Portal (payment method, invoices, plan changes, cancellation). On
 * the free Starter tier there is no portal, so the card offers the upgrade
 * picker instead.
 */
export function BillingSection() {
  const { locale, messages } = useI18n();
  const { colors } = useTheme();
  const entitlements = useEntitlements();
  const router = useRouter();
  const refresh = useRefreshData();
  const [opening, setOpening] = useState<WebFlowPath | null>(null);
  const t = messages.billing.settings;

  // Status only means something while a paid subscription is in force. A
  // canceled or never-started one is simply the free plan. Free days are
  // either the plan's 7-day trial or days a referral granted.
  const statusKey = entitlements.status;
  const onTrial = entitlements.freeDaysKind === 'trial';
  const statusLabel = entitlements.complimentary
    ? t.status.complimentary
    : !entitlements.hasActiveSubscription
      ? t.status.free
      : statusKey === 'trialing'
        ? onTrial
          ? t.status.trial
          : t.status.trialing
        : statusKey === 'active' || statusKey === 'past_due'
          ? t.status[statusKey]
          : t.status.free;

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString(locale, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

  // Inside free days from a referral, Stripe reports the subscription as
  // trialing and the period ends when the days do; that date is when billing
  // resumes (card on file) or when the account goes back to Starter (none).
  const freeDays = entitlements.hasActiveSubscription && entitlements.trialEndsAt;
  const periodEnd = freeDays ? entitlements.trialEndsAt : entitlements.currentPeriodEnd;

  const renewalLine = entitlements.complimentary
    ? t.complimentaryLine
    : !entitlements.hasActiveSubscription
      ? t.freePlanLine
      : periodEnd
        ? freeDays
          ? onTrial
            ? t.trialEndsOn(formatDate(periodEnd))
            : t.freeUntil(formatDate(periodEnd))
          : entitlements.cancelAtPeriodEnd
            ? t.cancelsOn(formatDate(periodEnd))
            : t.renewsOn(formatDate(periodEnd))
        : null;

  // "N days left · Next billing on <date>" for every paid plan, so the user
  // always knows how long the current period runs and when the card is hit.
  const countdownLine =
    entitlements.hasActiveSubscription && periodEnd
      ? [
          t.daysLeft(daysUntil(periodEnd)),
          entitlements.hasPaymentMethod && !entitlements.cancelAtPeriodEnd
            ? t.nextBilling(formatDate(periodEnd))
            : null,
        ]
          .filter(Boolean)
          .join(' · ')
      : null;

  // Free days with nothing set up to pay: the trial locks the account when
  // it ends, gifted days simply lapse to Starter. Either way the fix is the
  // same door: "Keep my plan" (a Stripe page that takes payment details).
  const tierName = messages.billing.tierNames[entitlements.tier];

  // A plan bought through the App Store or Google Play is the store's to
  // change or cancel: no Stripe portal, no "Keep my plan".
  const store =
    entitlements.provider === 'app_store' || entitlements.provider === 'play_store'
      ? entitlements.provider
      : null;
  const storeName = store ? messages.billing.store.names[store] : null;
  const noPaymentLine =
    freeDays && !entitlements.hasPaymentMethod && periodEnd
      ? onTrial
        ? t.trialNoPayment(formatDate(periodEnd), tierName)
        : t.freeDaysNoPayment(formatDate(periodEnd), tierName)
      : null;

  // The web links straight to these routes; here they open in the in-app
  // browser and the plan is read again once it closes.
  const openFlow = async (path: WebFlowPath) => {
    setOpening(path);
    try {
      await openWebFlow(path);
      await refresh();
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setOpening(null);
    }
  };

  return (
    <View>
      <SectionHeading eyebrow={t.title} title={t.currentPlan} description={t.description} />

      <Card padding={16}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
          <View
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: colors.accentSoft,
            }}>
            <CreditCard size={20} color={colors.accentSoftFg} />
          </View>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 10 }}>
              <Text font="sansSemiBold" size="base">
                {tierName}
              </Text>
              <View
                style={{
                  paddingHorizontal: 10,
                  paddingVertical: 2,
                  borderRadius: radius.pill,
                  backgroundColor: colors.accentSoft,
                }}>
                <Text font="sansMedium" size="xs" color="accentSoftFg">
                  {statusLabel}
                </Text>
              </View>
            </View>
            <View style={{ gap: 4, marginTop: 2 }}>
              {entitlements.hasActiveSubscription && entitlements.interval ? (
                <Text size="sm" color="ink3">
                  {t.interval[entitlements.interval]}
                </Text>
              ) : null}
              {renewalLine ? (
                <Text size="sm" color="ink3">
                  {renewalLine}
                </Text>
              ) : null}
              {countdownLine ? (
                <Text font="mono" size="xs" color="ink3">
                  {countdownLine}
                </Text>
              ) : null}
            </View>
          </View>
        </View>

        {entitlements.complimentary ? null : store && storeName ? (
          <View style={{ gap: 12, marginTop: 16 }}>
            <Text size="sm" color="ink3" style={{ lineHeight: 21 }}>
              {t.storeManaged(storeName)}
            </Text>
            <Button
              block
              size="lg"
              variant="outline"
              label={t.manageInStore(storeName)}
              icon={(props) => <ExternalLink {...props} />}
              onPress={() => openStoreSubscriptions(store).catch(() => {})}
            />
          </View>
        ) : entitlements.hasActiveSubscription ? (
          <View style={{ gap: 10, marginTop: 16 }}>
            <Button
              block
              size="lg"
              variant="outline"
              label={t.manage}
              icon={(props) => <ExternalLink {...props} />}
              loading={opening === '/api/billing/portal'}
              disabled={opening !== null}
              onPress={() => openFlow('/api/billing/portal')}
            />
            <Button
              block
              size="lg"
              label={t.changePlan}
              icon={(props) => <ArrowLeftRight {...props} />}
              loading={opening === '/api/billing/portal?flow=update'}
              disabled={opening !== null}
              onPress={() => openFlow('/api/billing/portal?flow=update')}
            />
          </View>
        ) : (
          <Button
            block
            size="lg"
            label={t.upgrade}
            icon={(props) => <Sparkles {...props} />}
            onPress={() => router.push('/subscribe')}
            style={{ marginTop: 16 }}
          />
        )}

        {noPaymentLine ? (
          <View
            style={{
              gap: 12,
              marginTop: 16,
              paddingHorizontal: 16,
              paddingVertical: 12,
              borderRadius: radius.lg,
              borderWidth: 1,
              borderColor: colors.line,
              backgroundColor: colors.accentSoft,
            }}>
            <Text size="sm" color="accentSoftFg" style={{ lineHeight: 21 }}>
              {noPaymentLine}
            </Text>
            <Button
              block
              size="lg"
              label={t.keepPlan}
              icon={(props) => <ShieldCheck {...props} />}
              loading={opening === '/api/billing/payment-method'}
              disabled={opening !== null}
              onPress={() => openFlow('/api/billing/payment-method')}
            />
          </View>
        ) : null}
      </Card>
    </View>
  );
}
