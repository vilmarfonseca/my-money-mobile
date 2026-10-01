import { keepPreviousData, useQueryClient } from '@tanstack/react-query';
import { View } from 'react-native';

import type { ApiResult } from '@/api/client';
import { usePullToRefresh, useScreenQuery } from '@/api/hooks';
import {
  AnalyticsPageHeader,
  AnalyticsPageSkeleton,
  AnalyticsView,
} from '@/components/analytics/analytics-view';
import { useEntitlements } from '@/components/billing/entitlements-provider';
import { UpgradeGate } from '@/components/billing/upgrade-gate';
import { PeriodFilter, usePeriodSelection } from '@/components/period-filter';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Screen } from '@/components/ui/screen';
import { Text } from '@/components/ui/text';
import type { AnalyticsCardId } from '@/lib/analytics/analytics-catalog';
import { useI18n } from '@/lib/i18n/provider';
import { radius } from '@/theme/tokens';

export default function AnalyticsScreen() {
  const { features } = useEntitlements();

  if (!features.analyticsPage) {
    return (
      <Screen contentStyle={{ flexGrow: 1 }}>
        <UpgradeGate feature="analyticsPage" />
      </Screen>
    );
  }

  // The page query lives in its own component so a plan without the feature
  // never mounts it (a screen query also refetches on focus).
  return <AnalyticsPage />;
}

function AnalyticsPage() {
  const { locale, messages } = useI18n();
  const queryClient = useQueryClient();
  const period = usePeriodSelection('ytd');
  // Changing the period keeps the current cards on screen until the new range
  // arrives, as the web page does while it navigates.
  const query = useScreenQuery('analytics.page', [period.query], {
    placeholderData: keepPreviousData,
  });
  const { onRefresh, refreshing } = usePullToRefresh(query);

  // The visible card set is part of the page payload: write the new selection
  // into every cached range so it shows at once and survives a period change.
  const applySelection = (ids: AnalyticsCardId[]) => {
    queryClient.setQueriesData<ApiResult<'analytics.page'>>(
      { queryKey: ['analytics.page'] },
      (current) => (current ? { ...current, selected: ids } : current),
    );
  };

  const periodFilter = (
    <PeriodFilter
      ariaLabel={messages.expenses.period}
      selection={period.selection}
      onChange={period.onChange}
    />
  );

  return (
    <Screen onRefresh={onRefresh} refreshing={refreshing}>
      {query.data ? (
        <AnalyticsView
          data={query.data.data}
          selected={query.data.selected}
          onApplySelection={applySelection}
          periodFilter={periodFilter}
        />
      ) : (
        <>
          <AnalyticsPageHeader periodFilter={periodFilter} />
          {query.isError ? (
            <Card variant="solid" rounded={radius.md} style={{ alignItems: 'center', gap: 14 }}>
              <Text size="sm" color="ink2" align="center">
                {locale === 'pt-BR'
                  ? 'Não foi possível carregar suas análises.'
                  : "Couldn't load your analytics."}
              </Text>
              <View>
                <Button
                  variant="outline"
                  label={locale === 'pt-BR' ? 'Tentar novamente' : 'Try again'}
                  loading={query.isFetching}
                  onPress={() => query.refetch()}
                />
              </View>
            </Card>
          ) : (
            <AnalyticsPageSkeleton />
          )}
        </>
      )}
    </Screen>
  );
}
