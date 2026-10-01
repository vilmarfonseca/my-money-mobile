import { keepPreviousData } from '@tanstack/react-query';
import { View } from 'react-native';

import { usePullToRefresh, useScreenQuery } from '@/api/hooks';
import { IncomeKpiCards } from '@/components/income/income-kpi-cards';
import { IncomeOverviewCard } from '@/components/income/income-overview-card';
import { IncomeSourcesTable } from '@/components/income/income-sources-table';
import { PayoutCalendarCard } from '@/components/income/payout-calendar-card';
import { PageHeader, PageHeaderAddLink } from '@/components/page-header';
import { PeriodFilter, usePeriodSelection } from '@/components/period-filter';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Screen } from '@/components/ui/screen';
import { Skeleton, SkeletonCard } from '@/components/ui/skeleton';
import { Text } from '@/components/ui/text';
import { useI18n } from '@/lib/i18n/provider';
import { radius } from '@/theme/tokens';

export default function IncomeRoute() {
  const { locale, messages } = useI18n();
  const period = usePeriodSelection();
  // The previous period stays on screen while the next one loads, as the
  // web's filter transition does.
  const query = useScreenQuery('income.page', [period.query], {
    placeholderData: keepPreviousData,
  });
  const { onRefresh, refreshing } = usePullToRefresh(query);
  const data = query.data;

  return (
    <Screen onRefresh={onRefresh} refreshing={refreshing}>
      <PageHeader
        title={messages.income.title}
        description={data?.headerSummary}
        mobileAction={
          <PageHeaderAddLink
            href="/transactions/new?type=income&lockType=1"
            ariaLabel={messages.income.addIncome}
          />
        }
        actions={
          <PeriodFilter
            ariaLabel={messages.income.title}
            selection={period.selection}
            onChange={period.onChange}
          />
        }
      />

      {data ? (
        <View style={{ opacity: query.isPlaceholderData ? 0.7 : 1 }}>
          <IncomeKpiCards kpis={data.kpis} />
          <View style={{ gap: 20 }}>
            <IncomeOverviewCard overview={data.overview} trend={data.trend} />
            <PayoutCalendarCard calendar={data.payoutCalendar} />
            <IncomeSourcesTable sources={data.sources} />
          </View>
        </View>
      ) : query.isError ? (
        <Card style={{ alignItems: 'center', gap: 12 }}>
          <Text size="sm" color="ink2" align="center">
            {locale === 'pt-BR'
              ? 'Não foi possível carregar a receita.'
              : "Couldn't load your income."}
          </Text>
          <Button
            variant="outline"
            label={locale === 'pt-BR' ? 'Tentar novamente' : 'Try again'}
            onPress={() => void query.refetch()}
          />
        </Card>
      ) : (
        <IncomeSkeleton />
      )}
    </Screen>
  );
}

function IncomeSkeleton() {
  return (
    <View>
      <View style={{ gap: 8, marginBottom: 16 }}>
        {[0, 1].map((row) => (
          <View key={row} style={{ flexDirection: 'row', gap: 8 }}>
            {[0, 1].map((column) => (
              <View key={column} style={{ flex: 1 }}>
                <Skeleton height={104} rounded={radius.xl} />
              </View>
            ))}
          </View>
        ))}
      </View>
      <View style={{ gap: 20 }}>
        <SkeletonCard lines={6} height={20} />
        <SkeletonCard lines={5} height={20} />
        <SkeletonCard lines={6} />
      </View>
    </View>
  );
}
