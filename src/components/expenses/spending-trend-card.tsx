import { TrendingDown, TrendingUp } from 'lucide-react-native';

import { PeriodTrendCard } from '@/components/finance/period-trend-card';
import { Text } from '@/components/ui/text';
import type {
  ExpenseTrendPoint,
  SelectedExpenseCategory,
} from '@/lib/expenses/expenses-queries';
import { localizeExpenseCategory } from '@/lib/i18n/labels';
import { useI18n } from '@/lib/i18n/provider';
import { useTheme } from '@/theme/theme-provider';

export function SpendingTrendCard({
  inverted = false,
  onSelectMonth,
  periodLabel,
  selected = null,
  selectedRange,
  trend,
}: {
  inverted?: boolean;
  /** Pressing a month's bar sets the page period to that month. */
  onSelectMonth?: (range: { from: string; to: string }) => void;
  /** Active period label ("July"), for the filtered footnote's share suffix. */
  periodLabel?: string;
  selected?: SelectedExpenseCategory | null;
  /** The page's custom period, so the matching bar is highlighted. */
  selectedRange?: { from?: string; to?: string };
  trend: ExpenseTrendPoint[];
}) {
  const { locale, messages } = useI18n();
  const { colors } = useTheme();
  const rangeLabel =
    trend.length > 0 ? `${trend[0].month}-${trend[trend.length - 1].month}` : '';
  const latest = trend.at(-1)?.spending ?? 0;
  const previous = trend.at(-2)?.spending ?? 0;
  const previousMonth = trend.at(-2)?.month ?? '';
  const deltaPct = previous > 0 ? ((latest - previous) / previous) * 100 : 0;
  const isUp = deltaPct >= 0;
  const TrendIcon = isUp ? TrendingUp : TrendingDown;
  const deltaColor = isUp ? colors.warmSoftFg : colors.positiveFg;
  const subject = selected
    ? localizeExpenseCategory(selected.name, locale)
    : messages.common.total;

  return (
    <PeriodTrendCard
      accentColor={selected?.chartColor}
      accentLabel={selected ? subject : undefined}
      inverted={inverted}
      onSelectMonth={onSelectMonth}
      rangeLabel={rangeLabel}
      selectedRange={selectedRange}
      trend={trend}
      footer={
        previous > 0 ? (
          <>
            {isUp
              ? messages.expenses.trendRosePrefix(subject)
              : messages.expenses.trendFellPrefix(subject)}
            <Text font="displayItalic" size="lg" color={deltaColor} style={{ lineHeight: 25 }}>
              {isUp ? '+' : '−'}
              {Math.abs(deltaPct).toFixed(0)}%
            </Text>
            {messages.expenses.trendVs(previousMonth)}
            {selected && periodLabel
              ? messages.expenses.trendShareSuffix(`${selected.percent.toFixed(1)}%`, periodLabel)
              : null}
            {'  '}
            <TrendIcon size={16} color={deltaColor} />
          </>
        ) : null
      }
    />
  );
}
