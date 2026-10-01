import type { ReactNode } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';

import { PeriodTrendChart } from '@/components/finance/period-trend-chart';
import { Card } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { useI18n } from '@/lib/i18n/provider';
import { gradients } from '@/theme/tokens';

export type PeriodTrendPoint = {
  month: string;
  /**
   * First day of the month (YYYY-MM-DD). When set, pressing the bar reports
   * that month through `onSelectMonth`.
   */
  monthStart?: string;
  spending: number;
  /** Overall monthly value when `spending` is a filtered slice of it. */
  total?: number;
};

type PeriodTrendCardProps = {
  /**
   * Bar colour of the web card's wide-screen chart. The phone bars always use
   * the brand gradient, so this (like `accentLabel` and `inverted`) is
   * accepted to keep callers identical to the web's and has no effect here.
   */
  accentColor?: string;
  /** Legend label of the wide-screen chart's overlay; see `accentColor`. */
  accentLabel?: string;
  /** Serif line under the bars: a string, or strings with nested `Text`. */
  footer?: ReactNode;
  /** Axis orientation of the wide-screen chart; see `accentColor`. */
  inverted?: boolean;
  /** Eyebrow over the bars (defaults to "Monthly spend"). */
  mobileEyebrow?: string;
  /**
   * Called with a month's first and last day when its bar is pressed. The
   * web navigates to `?period=custom&from&to`; here the screen owns that
   * state. Without it the bars are not pressable.
   */
  onSelectMonth?: (range: { from: string; to: string }) => void;
  rangeLabel: string;
  /**
   * The screen's custom period, when one is active. If it is exactly one of
   * the trend months, that bar is highlighted and the others are muted.
   */
  selectedRange?: { from?: string; to?: string };
  style?: StyleProp<ViewStyle>;
  title?: string;
  trend: PeriodTrendPoint[];
};

export function PeriodTrendCard({
  footer,
  mobileEyebrow,
  onSelectMonth,
  rangeLabel,
  selectedRange,
  style,
  title,
  trend,
}: PeriodTrendCardProps) {
  const { messages } = useI18n();
  const resolvedTitle = title ?? messages.expenses.trendTitle;
  const clickable = Boolean(onSelectMonth) && trend.some((point) => point.monthStart);

  const selectMonth = (point?: PeriodTrendPoint) => {
    if (!point?.monthStart) return;
    onSelectMonth?.({ from: point.monthStart, to: monthEnd(point.monthStart) });
  };

  // When the page filter is exactly one of the trend months, highlight that
  // bar; otherwise the latest month keeps the highlight.
  const selectedIndex = selectedRange?.from
    ? trend.findIndex(
        (point) =>
          point.monthStart !== undefined &&
          selectedRange.from === point.monthStart &&
          selectedRange.to === monthEnd(point.monthStart),
      )
    : -1;

  return (
    // The section header floats above its own card.
    <View style={style}>
      <Text
        font="display"
        size="2xl"
        tight
        numberOfLines={1}
        style={{ marginBottom: 12, paddingHorizontal: 6 }}>
        {resolvedTitle}
      </Text>

      <Card>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
            marginBottom: 16,
          }}>
          <Text
            font="sansSemiBold"
            size="2xs"
            color="ink3"
            uppercase
            tracking={0.5}
            numberOfLines={1}
            style={{ flexShrink: 1 }}>
            {mobileEyebrow ?? messages.expenses.monthlySpend}
          </Text>
          <Text font="mono" size="xs" color="ink3">
            {rangeLabel}
          </Text>
        </View>

        <PeriodTrendChart
          clickable={clickable}
          gradientStops={[gradients.bar[0], gradients.bar[1]]}
          onSelectMonth={selectMonth}
          selectedIndex={selectedIndex}
          trend={trend}
        />

        {footer ? (
          <Text
            font="display"
            size="lg"
            color="ink2"
            tracking={0.45}
            style={{ marginTop: 16, lineHeight: 25 }}>
            {footer}
          </Text>
        ) : null}
      </Card>
    </View>
  );
}

/** Last day of the month containing the given YYYY-MM-DD date. */
function monthEnd(monthStart: string) {
  const [year, month] = monthStart.split('-').map(Number);
  // Day 0 of the following month is the last day of this one.
  const end = new Date(year, month, 0);
  const endMonth = String(end.getMonth() + 1).padStart(2, '0');
  const day = String(end.getDate()).padStart(2, '0');
  return `${end.getFullYear()}-${endMonth}-${day}`;
}
