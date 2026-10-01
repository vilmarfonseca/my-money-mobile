import { ExternalLink, TriangleAlert } from 'lucide-react-native';
import { useState } from 'react';
import { Modal as RNModal, View } from 'react-native';

import { useRefreshData } from '@/api/hooks';
import { openWebFlow } from '@/api/web-handoff';
import { useEntitlements } from '@/components/billing/entitlements-provider';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { toast, ToastViewport } from '@/components/ui/toast';
import { hasPaymentIssue, PAST_DUE_GRACE_DAYS } from '@/lib/billing/plans';
import { useI18n } from '@/lib/i18n/provider';
import { useTheme } from '@/theme/theme-provider';
import { radius } from '@/theme/tokens';

/**
 * Blocking overlay shown while the subscription's last payment failed. Not
 * dismissible on purpose: the only way forward is fixing the payment in the
 * Stripe portal. Closing the portal reloads the shell, whose server side
 * re-checks Stripe, so the dialog clears itself once the payment is sorted.
 */
export function PaymentIssueDialog() {
  const { locale, messages } = useI18n();
  const { colors } = useTheme();
  const entitlements = useEntitlements();
  const refresh = useRefreshData();
  const [opening, setOpening] = useState(false);

  if (!hasPaymentIssue(entitlements.status)) return null;

  const t = messages.billing.paymentIssue;
  const graceDeadline = entitlements.currentPeriodEnd
    ? new Date(
        new Date(entitlements.currentPeriodEnd).getTime() +
          PAST_DUE_GRACE_DAYS * 24 * 60 * 60 * 1000,
      ).toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' })
    : null;

  const fixPayment = async () => {
    setOpening(true);
    try {
      await openWebFlow('/api/billing/portal?flow=payment');
      await refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : String(error));
    } finally {
      setOpening(false);
    }
  };

  return (
    <RNModal transparent visible statusBarTranslucent animationType="fade" onRequestClose={() => {}}>
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          padding: 16,
          backgroundColor: colors.scrim,
        }}>
        <Card variant="solid" padding={20} style={{ gap: 16 }}>
          <Text font="display" size="3xl" tight>
            {t.title}
          </Text>
          <Text size="sm" color="ink3" style={{ lineHeight: 22 }}>
            {t.body}
          </Text>
          {graceDeadline ? (
            <View
              style={{
                flexDirection: 'row',
                gap: 10,
                padding: 12,
                borderRadius: radius.lg,
                backgroundColor: colors.negativeSoft,
              }}>
              <TriangleAlert size={16} color={colors.negativeFg} style={{ marginTop: 3 }} />
              <Text size="sm" color="negativeFg" style={{ flex: 1, lineHeight: 22 }}>
                {t.deadline(graceDeadline)}
              </Text>
            </View>
          ) : null}
          <Button
            block
            label={t.cta}
            loading={opening}
            icon={(props) => <ExternalLink {...props} />}
            onPress={fixPayment}
          />
        </Card>
      </View>
      <ToastViewport />
    </RNModal>
  );
}
