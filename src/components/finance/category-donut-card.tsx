import type { ReactNode } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';

import { DonutCenterLabel } from '@/components/finance/donut-center-label';
import { DonutChart } from '@/components/finance/donut-chart';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Text } from '@/components/ui/text';
import { useI18n } from '@/lib/i18n/provider';
import { useTheme } from '@/theme/theme-provider';
import { radius } from '@/theme/tokens';
import { resolveColor } from '@/theme/tones';

export type CategoryDonutItem = {
  amount: number;
  color: string;
  id: string;
  name: string;
  percent: number;
};

type CategoryDonutCardProps = {
  categories: CategoryDonutItem[];
  /** Ring above the legend, however few categories there are. */
  alwaysStacked?: boolean;
  /** Caption under the centre figure (defaults to "Spending"). */
  centerCaption?: string;
  /** Replaces the default "top category" line under the legend. */
  footer?: ReactNode;
  /** Mobile Cards design: small fixed ring beside the legend. */
  mobileCompact?: boolean;
  periodLabel: string;
  /** Legend as full-width rows under the ring instead of a column beside it. */
  rowLegend?: boolean;
  /** Show each legend row's amount next to its percentage. */
  showAmounts?: boolean;
  style?: StyleProp<ViewStyle>;
  title?: string;
  total: number;
};

export function CategoryDonutCard({
  alwaysStacked = false,
  categories,
  centerCaption,
  footer,
  mobileCompact = false,
  periodLabel,
  rowLegend = false,
  showAmounts = false,
  style,
  title,
  total,
}: CategoryDonutCardProps) {
  const { formatCurrency, messages, splitCurrencyParts } = useI18n();
  const { colors } = useTheme();
  const resolvedTitle = title ?? messages.common.byCategory;
  const topCategory = categories[0];
  const stacked = alwaysStacked || categories.length >= 7;
  const { whole, decimal, cents } = splitCurrencyParts(total);
  // Stacked (7+ categories) uses the fixed thick ring from the Mobile Spending
  // design; compact (Mobile Cards) uses a small thick ring beside the legend.
  // The hole does not widen for long totals: the centre label sizes itself to
  // whatever it holds, so a bigger hole would only thin the ring.
  const compact = mobileCompact && !stacked;
  const holePercent = stacked ? 72 : compact ? 67 : 70;
  const outerRadius = stacked || compact ? '100%' : '82%';
  const ringOnTop = stacked || rowLegend;
  const chartData =
    categories.length > 0
      ? categories
      : [
          {
            amount: 1,
            color: 'var(--ink-3)',
            id: 'empty',
            name: messages.common.other,
            percent: 100,
          },
        ];

  const legendRow = (category: CategoryDonutItem) => (
    <View
      key={category.id}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: rowLegend ? 10 : 16,
      }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 1 }}>
        <View
          style={{
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: resolveColor(category.color, colors),
          }}
        />
        <Text size="sm" color="ink2" numberOfLines={1} style={{ flexShrink: 1 }}>
          {category.name}
        </Text>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 12 }}>
        <Text font="monoMedium" size="xs" color="ink3">
          {category.percent.toFixed(1)}%
        </Text>
        {showAmounts ? (
          <Text
            font="monoMedium"
            size="xs"
            align={rowLegend ? undefined : 'right'}
            style={rowLegend ? undefined : { minWidth: 80 }}>
            {formatCurrency(category.amount)}
          </Text>
        ) : null}
      </View>
    </View>
  );

  // The stacked legend is a two-column grid; pair the rows up for it.
  const legendPairs: CategoryDonutItem[][] = [];
  for (let index = 0; index < categories.length; index += 2) {
    legendPairs.push(categories.slice(index, index + 2));
  }

  return (
    // The section header floats above its own card.
    <View style={style}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
          marginBottom: 12,
          paddingHorizontal: 6,
        }}>
        <Text font="display" size="2xl" tight numberOfLines={1} style={{ flexShrink: 1 }}>
          {resolvedTitle}
        </Text>
        {/* The period reads as the section-header pill (design .link). */}
        <View
          style={{
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: radius.pill,
            borderWidth: 1,
            borderColor: colors.lineStrong,
            backgroundColor: colors.surface1,
          }}>
          <Text font="sansMedium" size="xs" color="accentSoftFg" numberOfLines={1}>
            {periodLabel}
          </Text>
        </View>
      </View>

      <Card>
        <View
          style={
            ringOnTop
              ? { alignItems: 'center', gap: 24 }
              : { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 24 }
          }>
          <View
            style={[
              { aspectRatio: 1, maxWidth: 208 },
              ringOnTop
                ? { width: 192 }
                : compact
                  ? { width: 120 }
                  : { flex: 1.1, minWidth: 112 },
            ]}>
            <DonutChart
              data={chartData}
              innerRadius={`${holePercent}%`}
              outerRadius={outerRadius}
            />
            <DonutCenterLabel
              caption={centerCaption ?? messages.common.spending}
              fit={`${whole}${decimal}${cents}`}
              holePercent={holePercent}
              // The hole is sized for the longest total this card can show, so
              // the figure is free to grow until it fills that width.
              maxRem={compact ? 1.75 : 4}>
              {whole}
              <Text color="ink3">
                {decimal}
                {cents}
              </Text>
            </DonutCenterLabel>
          </View>

          {rowLegend ? (
            <View style={{ alignSelf: 'stretch', gap: 8 }}>{categories.map(legendRow)}</View>
          ) : stacked ? (
            <View style={{ alignSelf: 'stretch', gap: 12 }}>
              {legendPairs.map((pair) => (
                <View key={pair[0].id} style={{ flexDirection: 'row', gap: 24 }}>
                  <View style={{ flex: 1 }}>{legendRow(pair[0])}</View>
                  <View style={{ flex: 1 }}>{pair[1] ? legendRow(pair[1]) : null}</View>
                </View>
              ))}
            </View>
          ) : (
            <View style={{ flex: 1, gap: 12 }}>{categories.map(legendRow)}</View>
          )}
        </View>

        {footer ? (
          <>
            <Separator dashed style={{ marginTop: 20 }} />
            <View style={{ paddingTop: 16 }}>{footer}</View>
          </>
        ) : topCategory ? (
          <>
            <Separator dashed style={{ marginTop: 20 }} />
            <Text size="sm" color="ink3" style={{ paddingTop: 16 }}>
              {topCategory.name}:{' '}
              <Text font="sansSemiBold" size="sm">
                {formatCurrency(topCategory.amount)}
              </Text>
            </Text>
          </>
        ) : null}
      </Card>
    </View>
  );
}
