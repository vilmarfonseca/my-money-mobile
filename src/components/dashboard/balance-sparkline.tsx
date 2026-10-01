import { useState } from 'react';
import { Pressable, View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Path, Stop } from 'react-native-svg';

import { Text } from '@/components/ui/text';
import type { DashboardBalanceTrendPoint } from '@/lib/dashboard/dashboard-queries';
import { useI18n } from '@/lib/i18n/provider';
import { useTheme } from '@/theme/theme-provider';
import { radius, shadows } from '@/theme/tokens';

/** `h-24`, of which the month axis takes the bottom 30 (recharts' default). */
const HEIGHT = 96;
const AXIS_HEIGHT = 30;
/** The web chart's margins: room for the first month label and the line cap. */
const MARGIN_LEFT = 12;
const MARGIN_TOP = 4;
/** The canvas extends past the plot so edge dots and curve overshoot are not cut. */
const BLEED = 8;

/**
 * Control points of a natural cubic spline through `values` (d3's
 * `curveNatural`, which is what recharts' `type="natural"` draws).
 */
function naturalControlPoints(values: number[]): [number[], number[]] {
  const n = values.length - 1;
  const a: number[] = new Array(n).fill(0);
  const b: number[] = new Array(n).fill(0);
  const r: number[] = new Array(n).fill(0);

  a[0] = 0;
  b[0] = 2;
  r[0] = values[0] + 2 * values[1];
  for (let i = 1; i < n - 1; i++) {
    a[i] = 1;
    b[i] = 4;
    r[i] = 4 * values[i] + 2 * values[i + 1];
  }
  a[n - 1] = 2;
  b[n - 1] = 7;
  r[n - 1] = 8 * values[n - 1] + values[n];

  for (let i = 1; i < n; i++) {
    const m = a[i] / b[i - 1];
    b[i] -= m;
    r[i] -= m * r[i - 1];
  }
  a[n - 1] = r[n - 1] / b[n - 1];
  for (let i = n - 2; i >= 0; i--) a[i] = (r[i] - a[i + 1]) / b[i];
  b[n - 1] = (values[n] + a[n - 1]) / 2;
  for (let i = 0; i < n - 1; i++) b[i] = 2 * values[i + 1] - a[i + 1];

  return [a, b];
}

function curvePath(xs: number[], ys: number[]) {
  const count = xs.length;
  if (count === 0) return '';
  let path = `M${xs[0]},${ys[0]}`;
  if (count === 2) return `${path}L${xs[1]},${ys[1]}`;
  if (count < 2) return path;

  const [ax, bx] = naturalControlPoints(xs);
  const [ay, by] = naturalControlPoints(ys);
  for (let i = 0; i < count - 1; i++) {
    path += `C${ax[i]},${ay[i]} ${bx[i]},${by[i]} ${xs[i + 1]},${ys[i + 1]}`;
  }
  return path;
}

/**
 * Balance trend of the last six months: a smooth area line with a dot per
 * month and the month names underneath. Tapping near a month shows its balance.
 */
export function BalanceSparkline({
  data,
  style,
}: {
  data: DashboardBalanceTrendPoint[];
  style?: StyleProp<ViewStyle>;
}) {
  const { formatCurrency, messages } = useI18n();
  const { colors } = useTheme();
  const [width, setWidth] = useState(0);
  const [activeMonth, setActiveMonth] = useState<string | null>(null);

  // Phones show the last 6 months only; the full range is the desktop chart.
  const chartData = data.slice(-6);
  const stroke = colors.accent;

  if (width === 0 || chartData.length === 0) {
    return (
      <View
        onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
        style={[
          { height: HEIGHT, borderRadius: radius.md, backgroundColor: colors.surface2, opacity: 0.6 },
          style,
        ]}
      />
    );
  }

  const plotHeight = HEIGHT - AXIS_HEIGHT;
  const plotWidth = width - MARGIN_LEFT;
  const count = chartData.length;
  // The axis always includes zero, as the web chart's does.
  const max = Math.max(0, ...chartData.map((point) => point.balance));
  const min = Math.min(0, ...chartData.map((point) => point.balance));
  const range = max - min;

  const xs = chartData.map((_, index) =>
    count === 1 ? MARGIN_LEFT + plotWidth / 2 : MARGIN_LEFT + (index * plotWidth) / (count - 1),
  );
  const yOf = (value: number) =>
    range === 0 ? plotHeight : MARGIN_TOP + (1 - (value - min) / range) * (plotHeight - MARGIN_TOP);
  const ys = chartData.map((point) => yOf(point.balance));
  const baseline = yOf(0);

  // Canvas coordinates: shifted by the bleed on both axes.
  const cx = xs.map((x) => x + BLEED);
  const cy = ys.map((y) => y + BLEED);
  const line = curvePath(cx, cy);
  const area = `${line}L${cx[count - 1]},${baseline + BLEED}L${cx[0]},${baseline + BLEED}Z`;

  const activeIndex = chartData.findIndex((point) => point.month === activeMonth);
  const active = activeIndex >= 0 ? chartData[activeIndex] : null;

  const selectNearest = (locationX: number) => {
    let nearest = 0;
    for (let i = 1; i < count; i++) {
      if (Math.abs(xs[i] - locationX) < Math.abs(xs[nearest] - locationX)) nearest = i;
    }
    const month = chartData[nearest].month;
    // A second tap on the same month puts the value away again.
    setActiveMonth(month === activeMonth ? null : month);
  };

  return (
    <View
      onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
      style={[{ height: HEIGHT }, style]}>
      <Svg
        width={width + BLEED * 2}
        height={plotHeight + BLEED * 2}
        style={{ position: 'absolute', left: -BLEED, top: -BLEED }}>
        <Defs>
          <LinearGradient id="balance-fill" x1="0" x2="0" y1="0" y2="1">
            <Stop offset="5%" stopColor={stroke} stopOpacity={0.22} />
            <Stop offset="95%" stopColor={stroke} stopOpacity={0} />
          </LinearGradient>
        </Defs>
        {count > 1 ? <Path d={area} fill="url(#balance-fill)" /> : null}
        {count > 1 ? (
          <Path d={line} fill="none" stroke={stroke} strokeWidth={2} strokeLinecap="round" />
        ) : null}
        {chartData.map((point, index) => (
          <Circle
            key={point.month}
            cx={cx[index]}
            cy={cy[index]}
            r={index === activeIndex ? 4.5 : 3}
            fill={stroke}
            stroke={colors.surface1}
            strokeWidth={1.5}
          />
        ))}
      </Svg>

      {chartData.map((point, index) => {
        // The last label hugs the right edge instead of overflowing it.
        const last = count > 1 && index === count - 1;
        return (
          <View
            key={point.month}
            pointerEvents="none"
            style={[
              { position: 'absolute', top: plotHeight + 6 },
              last
                ? { right: 0, alignItems: 'flex-end' }
                : { left: xs[index] - 32, width: 64, alignItems: 'center' },
            ]}>
            <Text size="xs" color="ink3" numberOfLines={1}>
              {point.month}
            </Text>
          </View>
        );
      })}

      <Pressable
        accessibilityRole="image"
        accessibilityLabel={messages.common.balance}
        onPress={(event) => selectNearest(event.nativeEvent.locationX)}
        style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}
      />

      {active ? (
        <View
          pointerEvents="none"
          style={[
            {
              position: 'absolute',
              bottom: HEIGHT - ys[activeIndex] + 10,
              minWidth: 144,
              gap: 8,
              padding: 12,
              borderRadius: radius.md,
              borderWidth: 1,
              borderColor: colors.line,
              backgroundColor: colors.surface1,
              boxShadow: shadows.md,
            },
            xs[activeIndex] < width / 2
              ? { left: Math.max(0, xs[activeIndex] - 16) }
              : { right: Math.max(0, width - xs[activeIndex] - 16) },
          ]}>
          <Text font="sansMedium" size="xs">
            {active.month}
          </Text>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 24,
            }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: stroke }} />
              <Text size="xs" color="ink2">
                {messages.common.balance}
              </Text>
            </View>
            <Text font="monoMedium" size="sm">
              {formatCurrency(active.balance)}
            </Text>
          </View>
        </View>
      ) : null}
    </View>
  );
}
