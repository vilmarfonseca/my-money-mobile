import { View } from 'react-native';

import { IncomeTrendChart, type IncomeChartConfig } from '@/components/income/income-trend-chart';
import { Card } from '@/components/ui/card';
import { Chip } from '@/components/ui/chip';
import { Separator } from '@/components/ui/separator';
import { Text } from '@/components/ui/text';
import type { IncomeOverview, IncomeTrendPoint } from '@/lib/income/income-queries';
import { useI18n } from '@/lib/i18n/provider';
import { useTheme } from '@/theme/theme-provider';

type IncomeOverviewCardProps = {
  overview: IncomeOverview;
  trend: IncomeTrendPoint[];
};

export function IncomeOverviewCard({ overview, trend }: IncomeOverviewCardProps) {
  const { messages, splitCurrencyParts } = useI18n();
  const { colors } = useTheme();
  // `--color-chart-1` and `--color-chart-3` on the web.
  const chartConfig: IncomeChartConfig = {
    income: { label: messages.common.income, color: colors.accent },
    recurring: { label: messages.income.recurring, color: colors.positive },
  };
  const toParts = (value: number) => {
    const { whole, decimal, cents } = splitCurrencyParts(Math.abs(value));
    return { value: whole, fraction: `${decimal}${cents}` };
  };
  const total = toParts(overview.total);
  const ytd = toParts(overview.ytdTotal);
  const xAxisTicks = getXAxisTicks(trend);

  return (
    <Card>
      <Text font="sansMedium" size="xs" color="ink3" uppercase tracking={1.2}>
        {overview.periodLabel} {messages.common.income}
      </Text>
      <Text font="display" size="5xl" tight style={{ marginTop: 8 }}>
        +{total.value}
        <Text font="display" size="2xl" color="ink3">
          {total.fraction}
        </Text>
      </Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 16 }}>
        <Chip tone="positive" label={overview.delta} />
        <Chip
          tone="outline"
          label={`${overview.sourceCount} ${messages.income
            .sourceCount(overview.sourceCount)
            .replace(`${overview.sourceCount} `, '')}`}
          style={{ borderColor: colors.line }}
        />
        <Chip tone="accent" label={overview.trendBadge} />
      </View>

      {/* The design's dashed-divider row in the hero. */}
      <Separator dashed style={{ marginTop: 28 }} />
      <View style={{ paddingTop: 16 }}>
        <Text font="sansMedium" size="2xs" color="ink3" uppercase tracking={1}>
          {overview.secondaryLabel}
        </Text>
        <Text font="display" size="3xl" tight style={{ marginTop: 8 }}>
          {ytd.value}
          <Text font="display" size="lg" color="ink3">
            {ytd.fraction}
          </Text>
        </Text>
        <Text size="xs" color="ink3" style={{ marginTop: 8 }}>
          {overview.ytdDelta}
        </Text>
      </View>

      <View style={{ marginTop: 20 }}>
        <IncomeTrendChart chartConfig={chartConfig} trend={trend} xAxisTicks={xAxisTicks} />
      </View>
    </Card>
  );
}

function getXAxisTicks(trend: IncomeTrendPoint[]) {
  const isDailySeries = trend.length > 15 && trend.every((point) => /^\d+$/.test(point.month));

  if (!isDailySeries) return undefined;

  return Array.from(
    new Set(
      ['1', '7', '14', '21', trend[trend.length - 1]?.month].filter(
        (tick): tick is string => Boolean(tick),
      ),
    ),
  );
}
