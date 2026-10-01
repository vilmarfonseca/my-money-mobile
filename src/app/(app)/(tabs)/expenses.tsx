import { keepPreviousData } from '@tanstack/react-query';
import { useState } from 'react';
import { View } from 'react-native';

import { usePullToRefresh, useScreenQuery } from '@/api/hooks';
import {
  ExpensesBreakdownSection,
  ExpensesHeaderSection,
  ExpensesTipSection,
} from '@/components/expenses/expenses-sections';
import { SpendingOverviewCard } from '@/components/expenses/spending-overview-card';
import { TransactionsTable } from '@/components/expenses/transactions-table';
import { usePeriodSelection } from '@/components/period-filter';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Screen } from '@/components/ui/screen';
import { SkeletonCard } from '@/components/ui/skeleton';
import { Text } from '@/components/ui/text';
import { useI18n } from '@/lib/i18n/provider';

/** Spending: where the money went, by category, by month and by entry. */
export default function ExpensesScreen() {
  const { locale } = useI18n();
  const period = usePeriodSelection('month');
  // The web's `?category=`: scopes every section below to one category.
  const [category, setCategory] = useState<string | undefined>(undefined);
  const query = useScreenQuery('expenses.page', [{ ...period.query, category }], {
    // Changing a filter keeps the current figures on screen (dimmed) until
    // the new ones arrive, as the web's transition does.
    placeholderData: keepPreviousData,
  });
  const { onRefresh, refreshing } = usePullToRefresh(query);
  const data = query.data;

  return (
    <Screen onRefresh={onRefresh} refreshing={refreshing}>
      <ExpensesHeaderSection
        period={period.selection}
        onPeriodChange={period.onChange}
        selectedCategory={data?.selectedCategory}
      />

      {data ? (
        <>
          <SpendingOverviewCard
            overview={data.overview}
            categories={data.categories}
            selected={data.selectedCategory}
            onSelectCategory={(name) => setCategory(name ?? undefined)}
            pending={query.isPlaceholderData}
          />
          <ExpensesTipSection
            overview={data.overview}
            selectedCategory={data.selectedCategory}
            trend={data.trend}
          />
          <ExpensesBreakdownSection
            categories={data.categories}
            overview={data.overview}
            selectedCategory={data.selectedCategory}
            trend={data.trend}
            period={period.selection}
            onPeriodChange={period.onChange}
          />
          <TransactionsTable transactions={data.transactions} />
        </>
      ) : query.isError ? (
        <Card style={{ alignItems: 'center', gap: 12 }}>
          <Text size="sm" color="ink3" align="center">
            {locale === 'pt-BR'
              ? 'Não foi possível carregar seus gastos.'
              : "We couldn't load your spending."}
          </Text>
          <Button
            variant="outline"
            label={locale === 'pt-BR' ? 'Tentar novamente' : 'Try again'}
            loading={query.isFetching}
            onPress={() => void query.refetch()}
          />
        </Card>
      ) : (
        <View style={{ gap: 20 }}>
          <SkeletonCard lines={6} height={20} />
          <SkeletonCard lines={4} />
          <SkeletonCard lines={4} />
          <SkeletonCard lines={5} />
        </View>
      )}
    </Screen>
  );
}
