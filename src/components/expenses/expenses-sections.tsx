import type { Href } from 'expo-router';
import { View } from 'react-native';

import { CategorySpendCard } from '@/components/expenses/category-spend-card';
import { ExpensePeriodFilter } from '@/components/expenses/expense-period-filter';
import { SpendingTrendCard } from '@/components/expenses/spending-trend-card';
import { PageHeader, PageHeaderAddLink } from '@/components/page-header';
import type { PeriodSelection } from '@/components/period-filter';
import { QuickTipCard } from '@/components/quick-tip-card';
import { Text } from '@/components/ui/text';
import type { ExpensesPageData } from '@/lib/expenses/expenses-queries';
import { localizeExpenseCategory } from '@/lib/i18n/labels';
import { useI18n } from '@/lib/i18n/provider';

/*
 * The sections of the Spending page. On the web each one is a server
 * component that loads the page data itself; here the screen loads it once
 * (`expenses.page`) and hands every section the part it needs.
 */

const NEW_EXPENSE_HREF = '/transactions/new?type=expense&lockType=1' as Href;

/** Header: the title reflects the category filter once its data has loaded. */
export function ExpensesHeaderSection({
  onPeriodChange,
  period,
  selectedCategory,
}: {
  onPeriodChange: (selection: PeriodSelection) => void;
  period: PeriodSelection;
  selectedCategory: ExpensesPageData['selectedCategory'] | undefined;
}) {
  const { locale, messages } = useI18n();
  const selectedName = selectedCategory
    ? localizeExpenseCategory(selectedCategory.name, locale)
    : null;

  return (
    <PageHeader
      titlePrefix={selectedName ? messages.expenses.title : undefined}
      title={selectedName ? `· ${selectedName}` : messages.expenses.title}
      description={
        selectedName
          ? messages.expenses.filteredDescription(selectedName)
          : messages.expenses.description
      }
      mobileAction={
        <PageHeaderAddLink href={NEW_EXPENSE_HREF} ariaLabel={messages.common.addTransaction} />
      }
      actions={<ExpensePeriodFilter selection={period} onChange={onPeriodChange} />}
    />
  );
}

/** Emphasis inside a tip: the italic serif the web's `<em>` gets there. */
function TipEm({ children }: { children: string }) {
  return (
    <Text font="displayItalic" size="xl" style={{ lineHeight: 27 }}>
      {children}
    </Text>
  );
}

export function ExpensesTipSection({
  overview,
  selectedCategory,
  trend,
}: Pick<ExpensesPageData, 'overview' | 'selectedCategory' | 'trend'>) {
  const { locale, messages } = useI18n();
  const selectedName = selectedCategory
    ? localizeExpenseCategory(selectedCategory.name, locale)
    : null;

  // Filtered tip compares the category's latest trend month to the prior one.
  const latestSpend = trend.at(-1)?.spending ?? 0;
  const previousSpend = trend.at(-2)?.spending ?? 0;
  const previousMonth = trend.at(-2)?.month ?? '';
  const tipDeltaPct =
    previousSpend > 0 ? ((latestSpend - previousSpend) / previousSpend) * 100 : 0;

  if (selectedCategory && selectedName) {
    if (previousSpend <= 0) return null;
    return (
      <QuickTipCard
        eyebrow={messages.expenses.categoryReading}
        primaryAction={{ label: messages.expenses.setCapFor(selectedName) }}
        secondaryAction={{ label: messages.common.notNow }}>
        {messages.expenses.tipCategoryIs(selectedName)}
        <TipEm>{`${tipDeltaPct >= 0 ? '+' : '−'}${Math.abs(tipDeltaPct).toFixed(0)}%`}</TipEm>
        {tipDeltaPct >= 0
          ? messages.expenses.tipAbove(previousMonth)
          : messages.expenses.tipBelow(previousMonth)}
        <TipEm>{`${selectedCategory.percent.toFixed(1)}%`}</TipEm>
        {messages.expenses.tipShareSuffix(overview.periodLabel)}
      </QuickTipCard>
    );
  }

  if (overview.total <= 0) return null;
  return (
    <QuickTipCard
      eyebrow={messages.expenses.subtleNudge}
      primaryAction={{ label: messages.expenses.setCap }}
      secondaryAction={{ label: messages.common.notNow }}>
      {messages.expenses.nudge}
      <TipEm>{messages.expenses.nudgeAmount}</TipEm>
      {messages.expenses.nudgeSuffix}
    </QuickTipCard>
  );
}

/** Category donut, then the trend, stacked as on phones. */
export function ExpensesBreakdownSection({
  categories,
  onPeriodChange,
  overview,
  period,
  selectedCategory,
  trend,
}: Pick<ExpensesPageData, 'categories' | 'overview' | 'selectedCategory' | 'trend'> & {
  onPeriodChange: (selection: PeriodSelection) => void;
  period: PeriodSelection;
}) {
  return (
    <View style={{ gap: 20, marginBottom: 20 }}>
      <CategorySpendCard overview={overview} categories={categories} selected={selectedCategory} />
      <SpendingTrendCard
        inverted={!selectedCategory && categories.length >= 7}
        // The web's bar click navigates to `?period=custom&from&to`.
        onSelectMonth={(range) => onPeriodChange({ period: 'custom', ...range })}
        periodLabel={overview.periodLabel}
        selected={selectedCategory}
        selectedRange={period.period === 'custom' ? period : undefined}
        trend={trend}
      />
    </View>
  );
}
