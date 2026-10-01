import { RotateCcw } from 'lucide-react-native';
import { useState } from 'react';
import { View } from 'react-native';

import { usePullToRefresh, useScreenQuery } from '@/api/hooks';
import { CardTransactionsTable } from '@/components/cards/card-transactions-table';
import { CardsKpiRow } from '@/components/cards/cards-kpi-row';
import { CreditCardRail } from '@/components/cards/credit-card-rail';
import { ManageCardsButton } from '@/components/cards/manage-cards-button';
import { StatementBalanceCard } from '@/components/cards/statement-balance-card';
import {
  CategoryDonutCard,
  type CategoryDonutItem,
} from '@/components/finance/category-donut-card';
import { PeriodTrendCard } from '@/components/finance/period-trend-card';
import { PageHeader, PageHeaderAddLink } from '@/components/page-header';
import { PeriodFilter, usePeriodSelection } from '@/components/period-filter';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Screen } from '@/components/ui/screen';
import { Skeleton, SkeletonCard } from '@/components/ui/skeleton';
import { Text } from '@/components/ui/text';
import { getCardsScope } from '@/lib/cards/cards-data';
import type { AppLocale } from '@/lib/i18n/config';
import { getMessages } from '@/lib/i18n/messages';
import { useI18n } from '@/lib/i18n/provider';
import { useTheme } from '@/theme/theme-provider';
import { radius } from '@/theme/tokens';

const chartColors = [
  'var(--color-coral-400)',
  'var(--color-warning)',
  'var(--color-plum-500)',
  'var(--color-sage-500)',
  'var(--color-ink-3)',
];

/** The credit cards page: card rail, statement, KPIs, trend, categories, activity. */
export default function CardsScreen() {
  const { locale, messages } = useI18n();
  const { colors } = useTheme();
  const period = usePeriodSelection();
  // The web's `?cards=` param: the cards tapped in the rail scope the page.
  const [selection, setSelection] = useState<string[]>([]);
  const query = useScreenQuery('cards.page', [period.query], {
    // Changing the period keeps the page on screen while the new one loads.
    placeholderData: (previous) => previous,
  });
  const { onRefresh, refreshing } = usePullToRefresh(query);
  const data = query.data;

  const selectedCardIds = data
    ? selection.filter((id) => data.cards.some((item) => item.id === id))
    : [];
  const scope = data
    ? getCardsScope(
        data.cards,
        data.transactions,
        selectedCardIds,
        data.locale,
        data.trendTransactions,
      )
    : null;
  const scopeLabel = scope?.selectedCard
    ? `${scope.selectedCard.nickname} - ${scope.selectedCard.last4}`
    : selectedCardIds.length > 1
      ? messages.cardsPage.selectedCount(selectedCardIds.length)
      : messages.cardsPage.allCards;

  return (
    <Screen onRefresh={onRefresh} refreshing={refreshing}>
      <PageHeader
        title={messages.cardsPage.title}
        mobileSubtitle={
          <>
            <View
              style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: colors.positiveFg }}
            />
            <Text size="xs" color="ink3" numberOfLines={1} style={{ flexShrink: 1 }}>
              {messages.cardsPage.scopeSummary(scopeLabel)}
            </Text>
          </>
        }
        mobileAction={
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <PageHeaderAddLink
              ariaLabel={messages.common.addTransaction}
              href="/transactions/new?type=expense"
            />
            {data ? <ManageCardsButton cards={data.cards} iconOnly /> : null}
          </View>
        }
        actions={
          <View style={{ gap: 12 }}>
            {selectedCardIds.length > 0 ? (
              <Button
                variant="outline"
                block
                icon={(props) => <RotateCcw {...props} />}
                label={messages.cardsPage.reset}
                onPress={() => setSelection([])}
              />
            ) : null}
            <PeriodFilter
              ariaLabel={messages.cardsPage.activityPeriod}
              selection={period.selection}
              onChange={period.onChange}
            />
          </View>
        }
      />

      {data && scope ? (
        <>
          <CreditCardRail
            cards={data.cards}
            selectedCardIds={selectedCardIds}
            onSelectionChange={setSelection}
          />

          <StatementBalanceCard bills={data.bills} scope={scope} scopeLabel={scopeLabel} />

          <CardsKpiRow isCardSelected={Boolean(scope.selectedCard)} summary={scope.summary} />

          <View style={{ gap: 20, marginBottom: 20 }}>
            <PeriodTrendCard
              footer={trendSummary(scope.trend, data.locale)}
              inverted={scope.categories.length >= 7}
              // Pressing a month's bar filters the page to it, as on the web.
              onSelectMonth={(range) => period.onChange({ period: 'custom', ...range })}
              selectedRange={
                period.selection.period === 'custom'
                  ? { from: period.selection.from, to: period.selection.to }
                  : undefined
              }
              rangeLabel={
                scope.trend.length > 0
                  ? `${scope.trend[0].month}-${scope.trend[scope.trend.length - 1].month}`
                  : ''
              }
              trend={scope.trend}
              title={messages.cardsPage.trendTitle}
            />
            <CategoryDonutCard
              alwaysStacked
              categories={scope.categories.map(
                (category, index): CategoryDonutItem => ({
                  amount: category.amount,
                  color: chartColors[index] ?? chartColors[4],
                  id: category.id,
                  name: category.name,
                  percent: category.percent,
                }),
              )}
              mobileCompact
              periodLabel={data.periodLabel}
              total={scope.summary.periodCharges}
            />
          </View>

          <CardTransactionsTable cards={data.cards} transactions={scope.transactions} />
        </>
      ) : query.error ? (
        <Card style={{ alignItems: 'center', gap: 16 }}>
          <Text size="sm" color="ink3" align="center">
            {query.error.message}
          </Text>
          <Button
            label={locale === 'pt-BR' ? 'Tentar de novo' : 'Try again'}
            onPress={() => void query.refetch()}
          />
        </Card>
      ) : (
        <CardsSkeleton />
      )}
    </Screen>
  );
}

function trendSummary(trend: ReturnType<typeof getCardsScope>['trend'], locale: AppLocale) {
  const messages = getMessages(locale);
  const latest = trend.at(-1)?.spending ?? 0;
  const previous = trend.at(-2)?.spending ?? 0;
  const latestMonth = trend.at(-1)?.month ?? (locale === 'pt-BR' ? 'Este período' : 'This period');
  const previousMonth =
    trend.at(-2)?.month ?? (locale === 'pt-BR' ? 'período anterior' : 'prior period');
  const deltaPct = previous > 0 ? ((latest - previous) / previous) * 100 : 0;

  return messages.cardsPage.trendComparison(
    latestMonth,
    `${Math.abs(deltaPct).toFixed(1)}%`,
    deltaPct >= 0 ? messages.cardsPage.trendAbove : messages.cardsPage.trendBelow,
    previousMonth,
  );
}

/** Placeholders in the page's shape: rail, statement, KPI tiles, charts, list. */
function CardsSkeleton() {
  return (
    <View style={{ gap: 20 }}>
      <View style={{ flexDirection: 'row', gap: 12, paddingTop: 14, paddingBottom: 16, overflow: 'hidden' }}>
        <Skeleton width={232} height={144} rounded={radius.sm} />
        <Skeleton width={232} height={144} rounded={radius.sm} />
      </View>
      <SkeletonCard lines={6} />
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <View style={{ flex: 1 }}>
          <SkeletonCard />
        </View>
        <View style={{ flex: 1 }}>
          <SkeletonCard />
        </View>
      </View>
      <SkeletonCard lines={5} />
      <SkeletonCard lines={5} />
    </View>
  );
}
