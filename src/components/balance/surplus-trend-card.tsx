import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { Pressable, ScrollView, View, type ViewStyle } from 'react-native';
import Svg, { Line } from 'react-native-svg';

import { Card } from '@/components/ui/card';
import { Chip } from '@/components/ui/chip';
import { Text } from '@/components/ui/text';
import type { BalancePeriodData } from '@/lib/balance/balance-data';
import { computeSurplusSummary, type SurplusSummary } from '@/lib/balance/balance-utils';
import { formatDateRangeLabel, parseDateParam } from '@/lib/date-range';
import { useI18n } from '@/lib/i18n/provider';
import { useTheme } from '@/theme/theme-provider';
import { gradients, radius, shadows } from '@/theme/tokens';

type FormatCurrency = ReturnType<typeof useI18n>['formatCurrency'];

const formatMoney = (formatCurrency: FormatCurrency, value: number) => formatCurrency(value);

type SurplusTrendCardProps = {
  data: BalancePeriodData;
  /** A bar was tapped: narrow the page to its range (the web writes `?from=&to=`). */
  onFilterRange: (range: { from: string; to: string }) => void;
};

export function SurplusTrendCard({ data, onFilterRange }: SurplusTrendCardProps) {
  const { formatCurrency, locale, messages } = useI18n();
  const { colors } = useTheme();
  const summary = computeSurplusSummary(data);
  const trendCopy =
    locale === 'pt-BR'
      ? `${Math.abs(summary.trendPct).toFixed(0)}% vs. ${summary.half} anterior`
      : `${Math.abs(summary.trendPct).toFixed(0)}% vs prior ${summary.half}`;
  const rate = messages.common.rate.toLowerCase();
  const barSub = (index: number) =>
    `${data.bars[index]?.label ?? ''} · ${(summary.rates[index] ?? 0).toFixed(1)}% ${rate}`;
  // `bg-line` under `gap-px` tiles: the gaps read as hairlines.
  const statRow: ViewStyle = { flexDirection: 'row', gap: 1 };

  return (
    // The section header floats above its own card.
    <View>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          marginBottom: 12,
          paddingHorizontal: 6,
        }}>
        <Text font="display" size="3xl" tight style={{ flex: 1 }}>
          {messages.balancePage.surplusTrend}
        </Text>
        <Chip
          tone={summary.trendUp ? 'positive' : 'warm'}
          label={`${summary.trendUp ? '↑' : '↓'} ${summary.trendUp ? '+' : ''}${summary.trendPct.toFixed(0)}%${
            locale === 'pt-BR' ? ' vs. ' : ' vs prior '
          }${summary.half}`}
          style={{ height: 24, paddingHorizontal: 10 }}
        />
      </View>

      <Card style={{ marginBottom: 24 }}>
        <Text size="sm" color="ink2" style={{ lineHeight: 21, marginBottom: 16 }}>
          {locale === 'pt-BR'
            ? `${summary.count} ${data.unitLong} positivos em sequência. Guardou `
            : `${summary.count} green ${data.unitLong} in a row. Banked `}
          <Text font="sansMedium" size="sm" color="ink2" style={{ lineHeight: 21 }}>
            {formatMoney(formatCurrency, summary.totalBanked)}
          </Text>
          {locale === 'pt-BR'
            ? ` com a sobra ${summary.trendUp ? 'aumentando' : 'diminuindo'} ${Math.abs(summary.trendPct).toFixed(0)}% em relação ao período anterior.`
            : ` with surplus ${summary.trendUp ? 'widening' : 'narrowing'} ${Math.abs(summary.trendPct).toFixed(0)}% vs the prior ${summary.half}.`}
        </Text>

        <View
          style={{
            gap: 1,
            marginBottom: 20,
            borderRadius: radius.md,
            borderWidth: 1,
            borderColor: colors.line,
            backgroundColor: colors.line,
            overflow: 'hidden',
          }}>
          <View style={statRow}>
            <Stat
              label={messages.balancePage.banked}
              value={formatMoney(formatCurrency, summary.totalBanked)}
              sub={
                locale === 'pt-BR'
                  ? `Últimos ${summary.count} ${data.unitLong}`
                  : `Last ${summary.count} ${data.unitLong}`
              }
            />
            <Stat
              label={`${messages.balancePage.averageShort} / ${data.unitShort}`}
              value={formatMoney(formatCurrency, summary.avg)}
              sub={`${summary.trendUp ? '↑' : '↓'} ${trendCopy}`}
              subPositive={summary.trendUp}
            />
          </View>
          <View style={statRow}>
            <Stat
              label={messages.balancePage.high}
              value={formatMoney(formatCurrency, summary.high ?? 0)}
              sub={barSub(summary.highIndex)}
            />
            <Stat
              label={messages.balancePage.low}
              value={formatMoney(formatCurrency, summary.low ?? 0)}
              sub={barSub(summary.lowIndex)}
            />
          </View>
          <View style={statRow}>
            <Stat
              label={messages.balancePage.onTarget}
              value={`${summary.onTarget}/${summary.count}`}
              sub={messages.balancePage.aboveTarget(data.target.toFixed(0))}
            />
          </View>
        </View>

        <SurplusChart data={data} summary={summary} onFilterRange={onFilterRange} />
      </Card>
    </View>
  );
}

type StatProps = {
  label: string;
  value: string;
  sub: string;
  subPositive?: boolean;
};

function Stat({ label, value, sub, subPositive }: StatProps) {
  const { colors } = useTheme();

  return (
    // `bg-surface-1/45`: the surface colour at 45% alpha.
    <View style={{ flex: 1, padding: 14, backgroundColor: `${colors.surface1}73` }}>
      <Text font="sansMedium" size="xs" color="ink3" uppercase tracking={1.2} numberOfLines={1}>
        {label}
      </Text>
      <Text font="display" size="2xl" style={{ marginTop: 6, lineHeight: 30 }}>
        {value}
      </Text>
      <Text
        font="mono"
        size="xs"
        color={subPositive ? 'positiveFg' : 'ink3'}
        numberOfLines={1}
        style={{ marginTop: 4 }}>
        {sub}
      </Text>
    </View>
  );
}

function getBarRangeLabel(
  from?: string,
  to?: string,
  fallback = 'Selected range',
  locale: Parameters<typeof formatDateRangeLabel>[2] = 'en-US',
) {
  const start = parseDateParam(from);
  const end = parseDateParam(to);

  if (!start && !end) return fallback;
  return formatDateRangeLabel(start, end, locale);
}

/** `h-36`: the plot's height on phones. */
const CHART_HEIGHT = 144;
const COLUMN_GAP = 8;
/** `minmax(5.5rem, 1fr)`: the floor width of one period column. */
const MIN_COLUMN_WIDTH = 88;
const MAX_BAR_WIDTH = 56;

function SurplusChart({
  data,
  onFilterRange,
  summary,
}: {
  data: BalancePeriodData;
  onFilterRange: SurplusTrendCardProps['onFilterRange'];
  summary: SurplusSummary;
}) {
  const { formatCurrency, locale, messages } = useI18n();
  const { colors } = useTheme();
  const [width, setWidth] = useState(0);
  // Phones cannot fit five full currency labels across, and shrinking them to
  // fit makes them unreadable: each column keeps a floor width and the chart
  // scrolls sideways instead.
  const gaps = COLUMN_GAP * Math.max(summary.count - 1, 0);
  const columnWidth = Math.max(
    MIN_COLUMN_WIDTH,
    summary.count > 0 ? (width - gaps) / summary.count : 0,
  );
  const contentWidth = columnWidth * summary.count + gaps;
  const toPx = (pct: number) => (pct / 100) * CHART_HEIGHT;
  const positionForValue = (value: number) =>
    Math.min(100, Math.max(0, ((value - summary.chartMin) / summary.chartRange) * 100));

  return (
    <View onLayout={(event) => setWidth(event.nativeEvent.layout.width)}>
      {/* One scroller for the chart and its period labels, so the two stay in
          step when the chart is wider than the screen. */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ marginHorizontal: -4 }}
        contentContainerStyle={{ paddingHorizontal: 4 }}>
        {width > 0 ? (
          <View style={{ width: contentWidth }}>
            <View style={{ flexDirection: 'row', gap: COLUMN_GAP, height: CHART_HEIGHT }}>
              {data.streak.map((value, index) => {
                const height = (Math.abs(value) / summary.chartRange) * 100;
                const bottom =
                  value >= 0 ? summary.zeroPct : Math.max(summary.zeroPct - height, 0);
                const bar = data.bars[index];
                // Keep the figure inside the plot even when a bar nearly fills it.
                const barTop = Math.min(bottom + (value === 0 ? 0 : Math.max(height, 2)), 88);
                const { filterFrom, filterTo } = bar;
                const canFilter = Boolean(filterFrom && filterTo);
                const rangeLabel = getBarRangeLabel(filterFrom, filterTo, bar.label, locale);
                const gradient = bar.current && value >= 0;
                const corners: ViewStyle =
                  value < 0
                    ? { borderBottomLeftRadius: radius.sm, borderBottomRightRadius: radius.sm }
                    : { borderTopLeftRadius: radius.sm, borderTopRightRadius: radius.sm };

                return (
                  <View
                    key={`${bar.label}-${index}`}
                    style={{ width: columnWidth, alignItems: 'center' }}>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={messages.balancePage.filterTo(rangeLabel)}
                      disabled={!canFilter}
                      onPress={() => {
                        if (filterFrom && filterTo) {
                          onFilterRange({ from: filterFrom, to: filterTo });
                        }
                      }}
                      style={({ pressed }) => [
                        {
                          position: 'absolute',
                          bottom: toPx(bottom),
                          width: '100%',
                          maxWidth: MAX_BAR_WIDTH,
                          height: value === 0 ? 0 : toPx(Math.max(height, 2)),
                          backgroundColor: gradient
                            ? undefined
                            : value < 0
                              ? colors.negative
                              : colors.positive,
                          opacity: pressed ? 0.8 : 1,
                        },
                        corners,
                        gradient && { boxShadow: shadows.lg },
                      ]}>
                      {gradient ? (
                        <LinearGradient
                          colors={gradients.bar}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                          style={[{ flex: 1 }, corners]}
                        />
                      ) : null}
                    </Pressable>

                    {/* The figure rides its own bar: above the tip when the
                        period is positive, under it when the bar hangs below
                        zero. Zero-value bars draw nothing, so a "0,00" figure
                        would only sit on the baseline and collide with the
                        average pill. */}
                    {value === 0 ? null : (
                      <View
                        style={[
                          {
                            position: 'absolute',
                            // Wider than the column: a long figure may spill
                            // over the gaps instead of being cut.
                            left: -16,
                            right: -16,
                            alignItems: 'center',
                            pointerEvents: 'none',
                          },
                          value >= 0
                            ? { bottom: toPx(barTop) + 6 }
                            : { top: toPx(100 - bottom) + 6 },
                        ]}>
                        <Text
                          font={bar.current ? 'monoSemiBold' : 'mono'}
                          size="xs"
                          color={bar.current ? 'ink1' : 'ink2'}
                          numberOfLines={1}>
                          {formatMoney(formatCurrency, value)}
                        </Text>
                      </View>
                    )}
                  </View>
                );
              })}

              <View
                style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  bottom: toPx(summary.zeroPct),
                  height: 1,
                  backgroundColor: colors.line,
                  pointerEvents: 'none',
                }}
              />
              <View
                style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  bottom: toPx(positionForValue(summary.avg)) - 1,
                  height: 1,
                  pointerEvents: 'none',
                }}>
                <Svg width={contentWidth} height={1}>
                  {/* `border-dashed border-ink-2/50` */}
                  <Line
                    x1={0}
                    x2={contentWidth}
                    y1={0.5}
                    y2={0.5}
                    stroke={colors.ink2}
                    strokeOpacity={0.5}
                    strokeDasharray="4 3"
                  />
                </Svg>
                <View
                  style={{
                    position: 'absolute',
                    top: -12,
                    right: 0,
                    paddingHorizontal: 6,
                    paddingVertical: 2,
                    borderRadius: radius.pill,
                    borderWidth: 1,
                    borderColor: colors.line,
                    backgroundColor: colors.surface1,
                  }}>
                  <Text font="mono" size="2xs" color="ink2" numberOfLines={1}>
                    {messages.balancePage.averageShort} {formatMoney(formatCurrency, summary.avg)}
                  </Text>
                </View>
              </View>
            </View>

            <View
              style={{
                flexDirection: 'row',
                gap: COLUMN_GAP,
                marginTop: 10,
                paddingTop: 10,
                borderTopWidth: 1,
                borderTopColor: colors.line,
              }}>
              {data.bars.map((bar, index) => (
                <View
                  key={`${bar.label}-${index}`}
                  style={{ width: columnWidth, alignItems: 'center' }}>
                  <Text
                    font="sansMedium"
                    size="xs"
                    color={bar.current ? 'ink1' : 'ink2'}
                    align="center">
                    {bar.label}
                  </Text>
                  <Text font="mono" size="xs" color="ink3" numberOfLines={1} style={{ marginTop: 2 }}>
                    {(summary.rates[index] ?? 0).toFixed(1)}%
                  </Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}
