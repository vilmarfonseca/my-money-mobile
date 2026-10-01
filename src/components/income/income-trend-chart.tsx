import { useState } from 'react';
import { Pressable, View } from 'react-native';
import Svg, {
  Circle,
  Defs,
  Line,
  LinearGradient,
  Path,
  Stop,
  Text as SvgText,
} from 'react-native-svg';

import { Text } from '@/components/ui/text';
import type { IncomeTrendPoint } from '@/lib/income/income-queries';
import { useI18n } from '@/lib/i18n/provider';
import { useTheme } from '@/theme/theme-provider';
import { fonts, radius, shadows } from '@/theme/tokens';

type SeriesKey = 'income' | 'recurring';

export type IncomeChartConfig = Record<SeriesKey, { label: string; color: string }>;

type IncomeTrendChartProps = {
  chartConfig: IncomeChartConfig;
  trend: IncomeTrendPoint[];
  xAxisTicks: string[] | undefined;
};

type Point = { x: number; y: number };

/** `h-44`: the chart's height on phones. */
const HEIGHT = 176;
const MARGIN_TOP = 12;
/** Room for half of the last x label, which is centred on the last point. */
const MARGIN_RIGHT = 14;
const X_AXIS_HEIGHT = 30;
const TICK_FONT_SIZE = 12;
/** Average glyph width of the tick face, in em: sizes the axis gutters. */
const TICK_CHAR_EM = 0.56;
const MIN_TICK_GAP = 12;

/** Drawn back to front: the income line sits on top, as on the web. */
const SERIES: ReadonlyArray<{ key: SeriesKey; strokeWidth: number; fillOpacity: number }> = [
  { key: 'recurring', strokeWidth: 2, fillOpacity: 0.2 },
  { key: 'income', strokeWidth: 3, fillOpacity: 0.34 },
];

/** Five ticks from zero to a rounded ceiling, like recharts' auto domain. */
function axisTicks(max: number) {
  const rough = Math.max(max, 1) / 4;
  const magnitude = 10 ** Math.floor(Math.log10(rough));
  const multiple = [1, 1.5, 2, 2.5, 3, 4, 5, 7.5, 10].find((m) => m * magnitude >= rough) ?? 10;
  const step = multiple * magnitude;
  return [0, 1, 2, 3, 4].map((index) => index * step);
}

/** Monotone cubic through the points (recharts' `type="monotone"`). */
function monotonePath(points: Point[]) {
  if (points.length === 0) return '';
  if (points.length === 1) return `M${points[0].x},${points[0].y}`;

  const dx: number[] = [];
  const slope: number[] = [];
  for (let i = 0; i < points.length - 1; i++) {
    dx.push(points[i + 1].x - points[i].x);
    slope.push((points[i + 1].y - points[i].y) / dx[i]);
  }

  const tangent: number[] = [slope[0]];
  for (let i = 1; i < points.length - 1; i++) {
    // A flat tangent at every local extreme keeps the curve from overshooting.
    tangent.push(
      slope[i - 1] * slope[i] <= 0
        ? 0
        : (3 * (dx[i - 1] + dx[i])) /
            ((2 * dx[i] + dx[i - 1]) / slope[i - 1] + (dx[i] + 2 * dx[i - 1]) / slope[i]),
    );
  }
  tangent.push(slope[slope.length - 1]);

  let path = `M${points[0].x},${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const third = dx[i] / 3;
    path +=
      ` C${points[i].x + third},${points[i].y + tangent[i] * third}` +
      ` ${points[i + 1].x - third},${points[i + 1].y - tangent[i + 1] * third}` +
      ` ${points[i + 1].x},${points[i + 1].y}`;
  }
  return path;
}

/** The income hero's area chart: income over its recurring share. */
export function IncomeTrendChart({ chartConfig, trend, xAxisTicks }: IncomeTrendChartProps) {
  const { formatCurrency } = useI18n();
  const { colors } = useTheme();
  const [width, setWidth] = useState(0);
  // Tapping a point shows its values (the web's hover tooltip). Kept by label
  // so a new period's data does not inherit a stale index.
  const [activeLabel, setActiveLabel] = useState<string | null>(null);

  const ticks = axisTicks(
    Math.max(0, ...trend.map((point) => Math.max(point.income, point.recurring))),
  );
  const top = ticks[ticks.length - 1];
  const tickLabels = ticks.map((tick) => formatCurrency(tick));
  const yAxisWidth =
    Math.ceil(
      Math.max(...tickLabels.map((label) => label.length)) * TICK_FONT_SIZE * TICK_CHAR_EM,
    ) + 8;

  const plotLeft = yAxisWidth;
  const plotRight = Math.max(width - MARGIN_RIGHT, plotLeft + 1);
  const plotBottom = HEIGHT - X_AXIS_HEIGHT;
  const plotWidth = plotRight - plotLeft;
  const count = trend.length;

  const xAt = (index: number) =>
    count <= 1 ? plotLeft + plotWidth / 2 : plotLeft + (index * plotWidth) / (count - 1);
  const yAt = (value: number) =>
    plotBottom - (Math.min(Math.max(value, 0), top) / top) * (plotBottom - MARGIN_TOP);

  // Daily series label (and dot) only the web's fixed ticks; monthly series
  // label as many points as fit, counted back from the latest one.
  const tickSet = xAxisTicks ? new Set(xAxisTicks) : null;
  const labelSlot =
    Math.max(1, ...trend.map((point) => point.month.length)) * TICK_FONT_SIZE * TICK_CHAR_EM +
    MIN_TICK_GAP;
  const labelEvery = Math.max(1, Math.ceil((count * labelSlot) / plotWidth));
  const hasLabel = (index: number) =>
    tickSet ? tickSet.has(trend[index].month) : (count - 1 - index) % labelEvery === 0;
  const hasDot = (index: number) => (tickSet ? tickSet.has(trend[index].month) : true);

  const activeIndex = activeLabel
    ? trend.findIndex((point) => point.tooltipLabel === activeLabel)
    : -1;
  const active = activeIndex >= 0 ? trend[activeIndex] : null;

  const selectAt = (locationX: number) => {
    if (count === 0) return;
    const ratio = count <= 1 ? 0 : (locationX - plotLeft) / plotWidth;
    const index = Math.min(count - 1, Math.max(0, Math.round(ratio * (count - 1))));
    const label = trend[index].tooltipLabel;
    setActiveLabel(label === activeLabel ? null : label);
  };

  return (
    <View
      style={{ height: HEIGHT }}
      onLayout={(event) => setWidth(event.nativeEvent.layout.width)}>
      {width > 0 ? (
        <Svg width={width} height={HEIGHT}>
          <Defs>
            {SERIES.map((series) => (
              <LinearGradient key={series.key} id={`${series.key}-area`} x1="0" x2="0" y1="0" y2="1">
                <Stop
                  offset="5%"
                  stopColor={chartConfig[series.key].color}
                  stopOpacity={series.fillOpacity}
                />
                <Stop offset="95%" stopColor={chartConfig[series.key].color} stopOpacity={0} />
              </LinearGradient>
            ))}
          </Defs>

          {ticks.map((tick, index) => (
            <Line
              key={`grid-${tick}`}
              x1={plotLeft}
              x2={plotRight}
              y1={yAt(tick)}
              y2={yAt(tick)}
              stroke={colors.lineStrong}
              strokeDasharray={index === 0 ? undefined : '3 6'}
            />
          ))}
          {tickLabels.map((label, index) => (
            <SvgText
              key={`y-${label}`}
              x={yAxisWidth - 8}
              y={yAt(ticks[index]) + 4}
              fill={colors.ink3}
              fontFamily={fonts.sans}
              fontSize={TICK_FONT_SIZE}
              textAnchor="end">
              {label}
            </SvgText>
          ))}
          {trend.map((point, index) =>
            hasLabel(index) ? (
              <SvgText
                key={`x-${index}`}
                x={xAt(index)}
                y={plotBottom + 22}
                fill={colors.ink3}
                fontFamily={fonts.sans}
                fontSize={TICK_FONT_SIZE}
                textAnchor="middle">
                {point.month}
              </SvgText>
            ) : null,
          )}

          {SERIES.map((series) => {
            const color = chartConfig[series.key].color;
            const points = trend.map((point, index) => ({
              x: xAt(index),
              y: yAt(point[series.key]),
            }));
            const line = monotonePath(points);
            if (!line) return null;
            const last = points[points.length - 1];

            return [
              <Path
                key={`${series.key}-fill`}
                d={`${line} L${last.x},${plotBottom} L${points[0].x},${plotBottom} Z`}
                fill={`url(#${series.key}-area)`}
              />,
              <Path
                key={`${series.key}-line`}
                d={line}
                fill="none"
                stroke={color}
                strokeWidth={series.strokeWidth}
                strokeLinecap="round"
                strokeLinejoin="round"
              />,
              ...points.map((point, index) =>
                hasDot(index) || index === activeIndex ? (
                  <Circle
                    key={`${series.key}-dot-${index}`}
                    cx={point.x}
                    cy={point.y}
                    r={index === activeIndex ? (series.key === 'income' ? 5 : 4.5) : 3}
                    fill={color}
                    stroke={colors.surface1}
                    strokeWidth={1.5}
                  />
                ) : null,
              ),
            ];
          })}
        </Svg>
      ) : null}

      <Pressable
        accessibilityRole="image"
        accessibilityLabel={`${chartConfig.income.label}, ${chartConfig.recurring.label}`}
        onPress={(event) => selectAt(event.nativeEvent.locationX)}
        style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }}
      />

      {active ? (
        <View
          style={[
            {
              position: 'absolute',
              top: 0,
              gap: 4,
              paddingHorizontal: 10,
              paddingVertical: 8,
              borderRadius: radius.sm,
              borderWidth: 1,
              borderColor: colors.line,
              backgroundColor: colors.surface1,
              boxShadow: shadows.lg,
              pointerEvents: 'none',
            },
            // Opens toward the wider side so it never leaves the card.
            xAt(activeIndex) < width / 2
              ? { left: xAt(activeIndex) + 12 }
              : { right: width - xAt(activeIndex) + 12 },
          ]}>
          <Text font="sansMedium" size="xs">
            {active.tooltipLabel}
          </Text>
          {SERIES.map((series) => (
            <View
              key={series.key}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 14,
              }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <View
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: 2,
                    backgroundColor: chartConfig[series.key].color,
                  }}
                />
                <Text size="xs" color="ink3">
                  {chartConfig[series.key].label}
                </Text>
              </View>
              <Text font="monoMedium" size="xs">
                {formatCurrency(active[series.key])}
              </Text>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}
