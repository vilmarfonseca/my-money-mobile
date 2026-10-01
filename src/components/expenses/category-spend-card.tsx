import { View } from 'react-native';

import {
  CategoryDonutCard,
  type CategoryDonutItem,
} from '@/components/finance/category-donut-card';
import { Text } from '@/components/ui/text';
import { isCreditCardCategory } from '@/lib/expenses/expense-categories';
import type {
  ExpenseCategoryBreakdown,
  ExpenseOverview,
  SelectedExpenseCategory,
} from '@/lib/expenses/expenses-queries';
import { localizeExpenseCategory } from '@/lib/i18n/labels';
import { useI18n } from '@/lib/i18n/provider';
import { useTheme } from '@/theme/theme-provider';
import { resolveColor } from '@/theme/tones';

type CategorySpendCardProps = {
  overview: ExpenseOverview;
  categories: ExpenseCategoryBreakdown[];
  selected?: SelectedExpenseCategory | null;
};

/**
 * The web's `color-mix(in srgb, <color> <share>%, white)`, which React Native
 * cannot evaluate. Colours that are not plain hex are returned untouched.
 */
function tint(color: string, share: number) {
  const match = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(color);
  if (!match) return color;
  const hex =
    match[1].length === 3
      ? match[1]
          .split('')
          .map((digit) => digit + digit)
          .join('')
      : match[1];
  const channels = [0, 2, 4].map((offset) => {
    const channel = parseInt(hex.slice(offset, offset + 2), 16);
    return Math.round(channel * share + 255 * (1 - share));
  });
  return `rgb(${channels.join(', ')})`;
}

export function CategorySpendCard({
  overview,
  categories,
  selected = null,
}: CategorySpendCardProps) {
  const { locale, messages } = useI18n();
  const { colors } = useTheme();

  // Filtered view: the donut becomes the category's merchants, slices
  // alternating between the category color and a lighter tint of it.
  if (selected) {
    const chartColor = resolveColor(selected.chartColor, colors);
    const items: CategoryDonutItem[] = selected.merchants.map((merchant, index) => ({
      amount: merchant.amount,
      color: index % 2 === 0 ? chartColor : tint(chartColor, 0.62),
      id: merchant.id,
      name: merchant.name,
      percent: merchant.percent,
    }));

    return (
      <CategoryDonutCard
        categories={items}
        centerCaption={localizeExpenseCategory(selected.name, locale)}
        periodLabel={overview.periodLabel}
        rowLegend
        showAmounts
        title={
          isCreditCardCategory(selected.name)
            ? messages.expenses.byCard
            : messages.expenses.byMerchant
        }
        total={selected.amount}
        footer={
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Text size="sm" color="ink3">
              {messages.expenses.shareOfPeriod}
            </Text>
            <View
              style={{
                flex: 1,
                height: 6,
                borderRadius: 3,
                overflow: 'hidden',
                backgroundColor: colors.surface2,
              }}>
              <View
                style={{
                  width: `${Math.max(0, Math.min(100, selected.percent))}%`,
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: chartColor,
                }}
              />
            </View>
            <Text font="monoMedium" size="xs">
              {selected.percent.toFixed(1)}%
            </Text>
          </View>
        }
      />
    );
  }

  const items: CategoryDonutItem[] = categories.map((category) => ({
    amount: category.amount,
    color: category.chartColor,
    id: category.id,
    name: localizeExpenseCategory(category.name, locale),
    percent: category.percent,
  }));

  return (
    <CategoryDonutCard
      categories={items}
      periodLabel={overview.periodLabel}
      total={overview.total}
    />
  );
}
