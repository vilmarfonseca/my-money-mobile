import { useRouter } from 'expo-router';
import { Lock } from 'lucide-react-native';
import { useState } from 'react';
import { View } from 'react-native';

import { useRefreshData } from '@/api/hooks';
import { openWebFlow } from '@/api/web-handoff';
import { openStoreSubscriptions } from '@/providers/store-billing';
import { useEntitlements } from '@/components/billing/entitlements-provider';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { toast } from '@/components/ui/toast';
import { minTierForFeature, type GatedFeature } from '@/lib/billing/plans';
import { useI18n } from '@/lib/i18n/provider';
import { useTheme } from '@/theme/theme-provider';

/**
 * Upsell rendered in place of a page the user's plan does not include.
 * Subscribers change plan in the Stripe portal; Starter accounts go to the
 * plan picker (where the web portal route would send them anyway).
 */
export function UpgradeGate({ feature }: { feature: GatedFeature }) {
  const { messages } = useI18n();
  const { colors } = useTheme();
  const { hasActiveSubscription, provider } = useEntitlements();
  const router = useRouter();
  const refresh = useRefreshData();
  const [opening, setOpening] = useState(false);
  const billing = messages.billing;
  const tierName = billing.tierNames[minTierForFeature(feature)];

  const upgrade = async () => {
    // A store plan changes tier in the store that bills it.
    if (provider === 'app_store' || provider === 'play_store') {
      openStoreSubscriptions(provider).catch(() => {});
      return;
    }
    if (!hasActiveSubscription) {
      router.push('/subscribe');
      return;
    }
    setOpening(true);
    try {
      await openWebFlow('/api/billing/portal?flow=update');
      await refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : String(error));
    } finally {
      setOpening(false);
    }
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', paddingVertical: 48 }}>
      <Card variant="solid" padding={28} style={{ alignItems: 'center' }}>
        <View
          style={{
            width: 56,
            height: 56,
            borderRadius: 28,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 20,
            backgroundColor: colors.accentSoft,
          }}>
          <Lock size={24} color={colors.accentSoftFg} />
        </View>
        <Text font="display" size="3xl" tight align="center">
          {billing.gate.title}
        </Text>
        <Text size="sm" color="ink2" align="center" style={{ marginTop: 10, lineHeight: 22 }}>
          {billing.gate.body(billing.gate.features[feature], tierName)}
        </Text>
        <Button
          label={billing.gate.cta(tierName)}
          loading={opening}
          onPress={upgrade}
          style={{ marginTop: 24 }}
        />
      </Card>
    </View>
  );
}
