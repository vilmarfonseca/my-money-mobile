import { keepPreviousData } from '@tanstack/react-query';
import { View } from 'react-native';

import { usePullToRefresh, useScreenQuery } from '@/api/hooks';
import { BalanceComparisonCard } from '@/components/balance/balance-comparison-card';
import { BalanceHeroCard } from '@/components/balance/balance-hero-card';
import { SurplusTrendCard } from '@/components/balance/surplus-trend-card';
import { useEntitlements } from '@/components/billing/entitlements-provider';
import { UpgradeGate } from '@/components/billing/upgrade-gate';
import { PageHeader, PageHeaderAddLink } from '@/components/page-header';
import { PeriodFilter, usePeriodSelection } from '@/components/period-filter';
import { QuickTipCard } from '@/components/quick-tip-card';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Screen } from '@/components/ui/screen';
import { SkeletonCard } from '@/components/ui/skeleton';
import { Text } from '@/components/ui/text';
import { useI18n } from '@/lib/i18n/provider';

export default function BalanceRoute() {
  const { features } = useEntitlements();

  // The gate replaces the page, so the gated query is never mounted.
  if (!features.balancePage) {
    return (
      <Screen contentStyle={{ flexGrow: 1 }}>
        <UpgradeGate feature="balancePage" />
      </Screen>
    );
  }

  return <BalancePage />;
}

function BalancePage() {
  const { locale, messages } = useI18n();
  const period = usePeriodSelection();
  // The previous period stays on screen while the next one loads, as the
  // web's filter transition does.
  const query = useScreenQuery('balance.page', [period.query], {
    placeholderData: keepPreviousData,
  });
  const { onRefresh, refreshing } = usePullToRefresh(query);
  const data = query.data;

  return (
    <Screen onRefresh={onRefresh} refreshing={refreshing}>
      <PageHeader
        title={messages.balancePage.title}
        description={messages.balancePage.headerDescription}
        mobileAction={
          <PageHeaderAddLink
            href="/transactions/new?type=income&lockType=1"
            ariaLabel={messages.common.addTransaction}
          />
        }
        actions={
          <PeriodFilter
            ariaLabel={messages.balancePage.period}
            selection={period.selection}
            onChange={period.onChange}
          />
        }
      />

      {data ? (
        <View style={{ opacity: query.isPlaceholderData ? 0.7 : 1 }}>
          <BalanceHeroCard data={data} />
          {data.rate !== 0 ? (
            <QuickTipCard
              eyebrow={data.tip.eyebrow}
              primaryAction={{ label: messages.balancePage.tryIt }}
              secondaryAction={{ label: messages.common.notNow }}>
              {data.tip.copy.map((segment, index) =>
                segment.emphasis ? (
                  <Text
                    key={index}
                    font="displayItalic"
                    size="xl"
                    color="warmSoftFg"
                    style={{ lineHeight: 27 }}>
                    {segment.text}
                  </Text>
                ) : (
                  segment.text
                ),
              )}
            </QuickTipCard>
          ) : null}
          <SurplusTrendCard
            data={data}
            onFilterRange={(range) => period.onChange({ period: 'custom', ...range })}
          />
          <BalanceComparisonCard data={data} />
        </View>
      ) : query.isError ? (
        <Card style={{ alignItems: 'center', gap: 12 }}>
          <Text size="sm" color="ink2" align="center">
            {locale === 'pt-BR'
              ? 'Não foi possível carregar o saldo.'
              : "Couldn't load your balance."}
          </Text>
          <Button
            variant="outline"
            label={locale === 'pt-BR' ? 'Tentar novamente' : 'Try again'}
            onPress={() => void query.refetch()}
          />
        </Card>
      ) : (
        <View style={{ gap: 24 }}>
          <SkeletonCard lines={6} height={20} />
          <SkeletonCard lines={6} height={20} />
          <SkeletonCard lines={6} height={20} />
        </View>
      )}
    </Screen>
  );
}
