import { useId, useState, type ReactNode } from 'react';
import { View } from 'react-native';
import Svg, {
  Circle,
  Defs,
  G,
  Line,
  LinearGradient,
  Path,
  Rect,
  Stop,
  Text as SvgText,
} from 'react-native-svg';

import { Text } from '@/components/ui/text';
import { useI18n } from '@/lib/i18n/provider';
import { useTheme } from '@/theme/theme-provider';
import { fonts, palette, radius } from '@/theme/tokens';

/**
 * SVG chart primitives for the Analytics page, ported from the web app's
 * `analytics-charts.tsx`. The web draws in a fixed viewBox and lets the
 * browser squeeze it into the card; here each chart is laid out in real
 * pixels for the width it is given, so axis text keeps a readable size and
 * the money labels (always with cents) get the gutter they need.
 */

const PLUM = palette.plum500;
const POS = palette.sage500;
const NEG = palette.coral500;

/**
 * Rough advance width of a string. Good enough to size gutters without
 * measuring text; erring wide only adds whitespace.
 */
export const textWidth = (text: string, fontSize: number, mono = false) =>
  text.length * fontSize * (mono ? 0.62 : 0.58);

/** Largest font size (up to `max`) at which `chars` glyphs fit in `available`. */
const fitFontSize = (chars: number, available: number, max: number, mono = false) =>
  Math.max(7, Math.min(max, available / (Math.max(chars, 1) * (mono ? 0.62 : 0.58))));

const longest = (labels: string[]) => labels.reduce((a, label) => Math.max(a, label.length), 0);

const truncate = (label: string, maxChars: number) =>
  label.length > maxChars ? `${label.slice(0, Math.max(1, maxChars - 1))}…` : label;

/** Fixed-height box that hands its measured width to the chart inside. */
function ChartFrame({
  children,
  height,
}: {
  children: (width: number) => ReactNode;
  height: number;
}) {
  const [width, setWidth] = useState(0);
  return (
    <View
      style={{ height }}
      onLayout={(event) => setWidth(Math.floor(event.nativeEvent.layout.width))}>
      {width > 0 ? children(width) : null}
    </View>
  );
}

function useAxisText() {
  const { colors } = useTheme();
  return { fontSize: 10, fill: colors.ink3, fontFamily: fonts.mono } as const;
}

/* -------------------------------------------------------------------------- */
/* Net worth area                                                              */
/* -------------------------------------------------------------------------- */

type NetWorthChartProps = {
  points: { label: string; value: number }[];
  markerIndexes?: number[];
  compact?: boolean;
};

export function NetWorthChart({
  points,
  markerIndexes = [],
  compact = false,
}: NetWorthChartProps) {
  // `useId` contains colons, which are not valid in an SVG paint reference.
  const uid = `nw${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const { formatCurrency } = useI18n();
  const { colors } = useTheme();
  const axisText = useAxisText();
  const n = points.length;
  if (n < 2) return <EmptyChartNote />;

  const H = compact ? 128 : 192;
  const PR = 14;
  const PT = 16;
  const PB = compact ? 12 : 24;

  const values = points.map((p) => p.value);
  const rawLo = Math.min(...values);
  const rawHi = Math.max(...values);
  const pad = Math.max(1, (rawHi - rawLo) * 0.15);
  const lo = rawLo - pad;
  const hi = rawHi + pad;
  const grid = [0, 1 / 3, 2 / 3, 1].map((t) => {
    const value = lo + (hi - lo) * t;
    return { value, label: formatCurrency(value) };
  });
  const PL = Math.ceil(Math.max(...grid.map((g) => textWidth(g.label, 10, true)))) + 12;

  return (
    <ChartFrame height={H}>
      {(W) => {
        const x = (i: number) => PL + (W - PL - PR) * (i / (n - 1));
        const y = (v: number) => PT + (H - PT - PB) * (1 - (v - lo) / (hi - lo));
        const line = values.map((v, i) => `${i ? 'L' : 'M'}${x(i)} ${y(v)}`).join(' ');
        const area = `${line} L ${x(n - 1)} ${y(lo)} L ${x(0)} ${y(lo)} Z`;

        return (
          <Svg width={W} height={H} accessibilityRole="image">
            <Defs>
              <LinearGradient id={uid} x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0%" stopColor={PLUM} stopOpacity={0.28} />
                <Stop offset="100%" stopColor={PLUM} stopOpacity={0} />
              </LinearGradient>
            </Defs>
            {grid.map((g) => (
              <G key={g.value}>
                <Line
                  x1={PL}
                  y1={y(g.value)}
                  x2={W - PR}
                  y2={y(g.value)}
                  stroke={colors.line}
                  strokeWidth={1}
                />
                <SvgText x={PL - 8} y={y(g.value) + 3} textAnchor="end" {...axisText}>
                  {g.label}
                </SvgText>
              </G>
            ))}
            <Path d={area} fill={`url(#${uid})`} />
            <Path
              d={line}
              fill="none"
              stroke={PLUM}
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {markerIndexes
              .filter((i) => i >= 0 && i < n)
              .map((i) => (
                <G key={i}>
                  <Line
                    x1={x(i)}
                    y1={y(values[i])}
                    x2={x(i)}
                    y2={H - PB}
                    stroke={palette.plum300}
                    strokeWidth={1}
                    strokeDasharray={[2, 3]}
                  />
                  <Circle
                    cx={x(i)}
                    cy={y(values[i])}
                    r={4.5}
                    fill={PLUM}
                    stroke={colors.surface1}
                    strokeWidth={2}
                  />
                </G>
              ))}
            <Circle
              cx={x(n - 1)}
              cy={y(values[n - 1])}
              r={5}
              fill={PLUM}
              stroke={colors.surface1}
              strokeWidth={2}
            />
            {!compact &&
              points.map((p, i) =>
                // Every other month, plus the last one; its neighbour is
                // dropped so the two never print on top of each other.
                i !== n - 1 && (i % 2 || i === n - 2) ? null : (
                  <SvgText
                    key={p.label + i}
                    x={x(i)}
                    y={H - 8}
                    textAnchor={i === n - 1 ? 'end' : 'middle'}
                    {...axisText}>
                    {p.label}
                  </SvgText>
                ),
              )}
          </Svg>
        );
      }}
    </ChartFrame>
  );
}

/* -------------------------------------------------------------------------- */
/* Rate bars (save rate / effective save rate)                                 */
/* -------------------------------------------------------------------------- */

type RateBarsProps = {
  points: { label: string; rate: number }[];
  target: number;
  targetLabel?: string;
  compact?: boolean;
  /** Rendered height in px (the web sizes this chart from its container). */
  height?: number;
};

export function RateBarsChart({
  points,
  target,
  targetLabel,
  compact = false,
  height,
}: RateBarsProps) {
  const { colors } = useTheme();
  const axisText = useAxisText();
  const n = points.length;
  if (!n) return <EmptyChartNote />;

  const H = height ?? (compact ? 128 : 192);
  const PL = 34;
  const PR = 14;
  const PT = 18;
  const PB = compact ? 10 : 24;
  const top = Math.max(45, ...points.map((p) => p.rate + 5), target + 10);
  const y = (v: number) => PT + (H - PT - PB) * (1 - v / top);
  const grid = [0, Math.round(top / 3), Math.round((top / 3) * 2), top];

  return (
    <ChartFrame height={H}>
      {(W) => {
        const bandW = (W - PL - PR) / n;
        const bw = Math.min(30, bandW * 0.56);
        const labelSize = fitFontSize(longest(points.map((p) => p.label)), bandW - 1, 10, true);

        return (
          <Svg width={W} height={H} accessibilityRole="image">
            {grid.map((v) => (
              <G key={v}>
                <Line
                  x1={PL}
                  y1={y(v)}
                  x2={W - PR}
                  y2={y(v)}
                  stroke={colors.line}
                  strokeWidth={1}
                />
                <SvgText x={PL - 8} y={y(v) + 3} textAnchor="end" {...axisText}>
                  {`${v}%`}
                </SvgText>
              </G>
            ))}
            {points.map((p, i) => {
              const cx = PL + bandW * (i + 0.5);
              const above = p.rate >= target;
              return (
                <G key={p.label + i}>
                  <Rect
                    x={cx - bw / 2}
                    y={y(p.rate)}
                    width={bw}
                    height={Math.max(0, y(0) - y(p.rate))}
                    rx={Math.min(5, bw / 2)}
                    fill={above ? POS : NEG}
                    opacity={above ? 0.9 : 0.85}
                  />
                  {!compact && (
                    <SvgText
                      x={cx}
                      y={y(Math.max(p.rate, 0)) - 6}
                      textAnchor="middle"
                      {...axisText}
                      fontSize={Math.min(10, labelSize + 1)}
                      fill={colors.ink2}>
                      {String(p.rate)}
                    </SvgText>
                  )}
                  {!compact && (
                    <SvgText
                      x={cx}
                      y={H - 9}
                      textAnchor="middle"
                      {...axisText}
                      fontSize={labelSize}>
                      {p.label}
                    </SvgText>
                  )}
                </G>
              );
            })}
            <Line
              x1={PL}
              y1={y(target)}
              x2={W - PR}
              y2={y(target)}
              stroke={colors.ink1}
              strokeWidth={1.5}
              strokeDasharray={[4, 4]}
            />
            {!compact && targetLabel ? (
              <SvgText
                x={W - PR}
                y={y(target) - 6}
                textAnchor="end"
                fontSize={10}
                fontFamily={fonts.sansSemiBold}
                fill={colors.ink1}>
                {targetLabel}
              </SvgText>
            ) : null}
          </Svg>
        );
      }}
    </ChartFrame>
  );
}

/* -------------------------------------------------------------------------- */
/* Heat-map grid (views)                                                       */
/* -------------------------------------------------------------------------- */

type HeatmapGridProps = {
  monthLabels: string[];
  categories: { name: string; values: number[] }[];
  compact?: boolean;
};

const HEATMAP_GAP = 4;

/**
 * Compact (preview) cells share the tile's width. The live grid sizes its
 * square cells to the longest amount, as the web's grid does, and is wider
 * than the card: the caller scrolls it sideways.
 */
export function HeatmapGrid({ monthLabels, categories, compact = false }: HeatmapGridProps) {
  const { formatCurrency } = useI18n();
  if (!categories.length) return <EmptyChartNote />;

  const max = Math.max(1, ...categories.flatMap((c) => c.values));
  const labelCol = compact ? 40 : 128;
  const cellText = (value: number) => (compact || !value ? '' : formatCurrency(value));
  const cell = compact
    ? undefined
    : Math.max(
        38,
        Math.ceil(
          textWidth(
            'x'.repeat(longest(categories.flatMap((c) => c.values.map(cellText)))),
            9,
            true,
          ),
        ) + 16,
      );
  const cellStyle = cell
    ? ({ width: cell, height: cell } as const)
    : ({ flex: 1, aspectRatio: 1 } as const);

  return (
    <View style={{ gap: HEATMAP_GAP, alignSelf: compact ? 'stretch' : 'flex-start' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: HEATMAP_GAP }}>
        <View style={{ width: labelCol }} />
        {monthLabels.map((month, i) => (
          <View key={month + i} style={cell ? { width: cell } : { flex: 1 }}>
            <Text font="mono" size={10} color="ink3" align="center" numberOfLines={1}>
              {compact ? month.slice(0, 1) : month}
            </Text>
          </View>
        ))}
      </View>
      {categories.map((cat) => (
        <View
          key={cat.name}
          style={{ flexDirection: 'row', alignItems: 'center', gap: HEATMAP_GAP }}>
          <View style={{ width: labelCol, paddingRight: 6 }}>
            <Text font="sansMedium" size="xs" numberOfLines={1}>
              {compact ? cat.name.slice(0, 4) : cat.name}
            </Text>
          </View>
          {cat.values.map((v, i) => {
            const t = v / max;
            const alpha = v ? 0.1 + t * 0.72 : 0.03;
            return (
              <View
                key={i}
                accessible={!compact}
                accessibilityLabel={`${cat.name} · ${monthLabels[i]}: ${formatCurrency(v)}`}
                style={[
                  cellStyle,
                  {
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: radius.sm,
                    backgroundColor: `rgba(124, 58, 237, ${alpha.toFixed(2)})`,
                  },
                ]}>
                {cell && v ? (
                  <Text
                    font="mono"
                    size={9}
                    color={t > 0.5 ? palette.white : 'ink3'}
                    numberOfLines={1}>
                    {cellText(v)}
                  </Text>
                ) : null}
              </View>
            );
          })}
        </View>
      ))}
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/* Waterfall                                                                   */
/* -------------------------------------------------------------------------- */

export type WaterfallStep =
  | { kind: 'start' | 'end'; label: string; value: number }
  | { kind: 'delta'; label: string; value: number };

export function WaterfallChart({
  steps,
  compact = false,
}: {
  steps: WaterfallStep[];
  compact?: boolean;
}) {
  const { formatSignedCurrency, formatCurrency } = useI18n();
  const { colors } = useTheme();
  const n = steps.length;
  if (!n) return <EmptyChartNote />;

  const H = compact ? 100 : 190;
  const PL = 6;
  const PR = 6;
  const PT = compact ? 10 : 26;
  const PB = compact ? 10 : 34;

  const pts: (WaterfallStep & { from: number; to: number })[] = [];
  let cum = 0;
  for (const st of steps) {
    if (st.kind === 'start' || st.kind === 'end') {
      cum = st.value;
      pts.push({ ...st, from: 0, to: st.value });
    } else {
      pts.push({ ...st, from: cum, to: cum + st.value });
      cum += st.value;
    }
  }
  const mn = Math.min(0, ...pts.flatMap((p) => [p.from, p.to]));
  const mx = Math.max(0, ...pts.flatMap((p) => [p.from, p.to])) * 1.08;
  const y = (v: number) => PT + (H - PT - PB) * (1 - (v - mn) / (mx - mn || 1));
  const valueLabels = pts.map((p) =>
    p.kind === 'delta' ? formatSignedCurrency(p.value) : formatCurrency(p.value),
  );

  return (
    <ChartFrame height={H}>
      {(W) => {
        const band = (W - PL - PR) / n;
        const bw = Math.min(70, band * 0.58);
        // Five money labels share the card's width: shrink them to their band
        // rather than let neighbours overlap.
        const valueSize = fitFontSize(longest(valueLabels), band - 2, 12, true);
        const labelSize = fitFontSize(longest(pts.map((p) => p.label)), band - 2, 11);

        return (
          <Svg width={W} height={H} accessibilityRole="image">
            {pts.map((p, i) => {
              const cx = PL + band * (i + 0.5);
              const yTop = y(Math.max(p.from, p.to));
              const yBot = y(Math.min(p.from, p.to));
              const color =
                p.kind === 'start'
                  ? PLUM
                  : p.kind === 'end'
                    ? colors.ink1
                    : p.value > 0
                      ? POS
                      : NEG;
              const prev = pts[i - 1];
              return (
                <G key={p.label + i}>
                  {i > 0 && prev ? (
                    <Line
                      x1={PL + band * (i - 0.5) + bw / 2}
                      y1={y(prev.to)}
                      x2={cx - bw / 2}
                      y2={y(prev.to)}
                      stroke={colors.lineStrong}
                      strokeWidth={1}
                      strokeDasharray={[2, 2]}
                    />
                  ) : null}
                  <Rect
                    x={cx - bw / 2}
                    y={yTop}
                    width={bw}
                    height={Math.max(2, yBot - yTop)}
                    rx={5}
                    fill={color}
                    opacity={0.92}
                  />
                  {!compact && (
                    <SvgText
                      x={cx}
                      y={yTop - 8}
                      textAnchor="middle"
                      fontSize={valueSize}
                      fontFamily={fonts.monoMedium}
                      fill={colors.ink2}>
                      {valueLabels[i]}
                    </SvgText>
                  )}
                  {!compact && (
                    <SvgText
                      x={cx}
                      y={H - 12}
                      textAnchor="middle"
                      fontSize={labelSize}
                      fontFamily={fonts.sans}
                      fill={colors.ink3}>
                      {p.label}
                    </SvgText>
                  )}
                </G>
              );
            })}
          </Svg>
        );
      }}
    </ChartFrame>
  );
}

/* -------------------------------------------------------------------------- */
/* Fan projection                                                              */
/* -------------------------------------------------------------------------- */

export function FanChart({
  points,
  compact = false,
}: {
  points: { label: string; base: number; lo: number; hi: number }[];
  compact?: boolean;
}) {
  const { formatCurrency } = useI18n();
  const { colors } = useTheme();
  const axisText = useAxisText();
  const n = points.length;
  if (n < 2) return <EmptyChartNote />;

  const H = compact ? 100 : 150;
  const PR = 12;
  const PT = 14;
  const PB = compact ? 10 : 24;
  const max = Math.max(...points.map((p) => p.hi)) * 1.05 || 1;
  const grid = [0, max / 2, max].map((value) => ({ value, label: formatCurrency(value) }));
  const PL = Math.ceil(Math.max(...grid.map((g) => textWidth(g.label, 10, true)))) + 10;
  const y = (v: number) => PT + (H - PT - PB) * (1 - v / max);

  return (
    <ChartFrame height={H}>
      {(W) => {
        const x = (i: number) => PL + (W - PL - PR) * (i / (n - 1));
        const bandPath =
          points.map((p, i) => `${i ? 'L' : 'M'}${x(i)} ${y(p.hi)}`).join(' ') +
          ' ' +
          [...points]
            .reverse()
            .map((p, i) => `L${x(n - 1 - i)} ${y(p.lo)}`)
            .join(' ') +
          ' Z';
        const linePath = points.map((p, i) => `${i ? 'L' : 'M'}${x(i)} ${y(p.base)}`).join(' ');

        return (
          <Svg width={W} height={H} accessibilityRole="image">
            {grid.map((g) => (
              <G key={g.value}>
                <Line
                  x1={PL}
                  y1={y(g.value)}
                  x2={W - PR}
                  y2={y(g.value)}
                  stroke={colors.line}
                  strokeWidth={1}
                />
                <SvgText x={PL - 6} y={y(g.value) + 3} textAnchor="end" {...axisText}>
                  {g.label}
                </SvgText>
              </G>
            ))}
            <Path d={bandPath} fill={PLUM} opacity={0.14} />
            <Path d={linePath} fill="none" stroke={PLUM} strokeWidth={2.5} />
            {!compact &&
              points.map((p, i) => (
                <SvgText
                  key={p.label + i}
                  x={x(i)}
                  y={H - 8}
                  textAnchor={i === 0 ? 'start' : i === n - 1 ? 'end' : 'middle'}
                  {...axisText}>
                  {p.label}
                </SvgText>
              ))}
          </Svg>
        );
      }}
    </ChartFrame>
  );
}

/* -------------------------------------------------------------------------- */
/* Paired bars (this vs. last)                                                 */
/* -------------------------------------------------------------------------- */

export function PairedBarsChart({
  points,
  compact = false,
}: {
  points: { label: string; current: number; previous: number }[];
  compact?: boolean;
}) {
  const { formatCurrency } = useI18n();
  const { colors } = useTheme();
  const axisText = useAxisText();
  const n = points.length;
  if (!n) return <EmptyChartNote />;

  const H = compact ? 100 : 150;
  const PR = 12;
  const PT = 16;
  const PB = compact ? 10 : 24;
  const max = Math.max(...points.flatMap((p) => [p.current, p.previous])) * 1.1 || 1;
  const grid = [0, max / 2, max].map((value) => ({ value, label: formatCurrency(value) }));
  const PL = Math.ceil(Math.max(...grid.map((g) => textWidth(g.label, 10, true)))) + 10;
  const y = (v: number) => PT + (H - PT - PB) * (1 - v / max);

  return (
    <ChartFrame height={H}>
      {(W) => {
        const band = (W - PL - PR) / n;
        const bw = band * 0.28;
        // Category names can be longer than their band.
        const maxChars = Math.max(3, Math.floor(band / textWidth('x', 10, true)));

        return (
          <Svg width={W} height={H} accessibilityRole="image">
            {grid.map((g) => (
              <G key={g.value}>
                <Line
                  x1={PL}
                  y1={y(g.value)}
                  x2={W - PR}
                  y2={y(g.value)}
                  stroke={colors.line}
                  strokeWidth={1}
                />
                <SvgText x={PL - 6} y={y(g.value) + 3} textAnchor="end" {...axisText}>
                  {g.label}
                </SvgText>
              </G>
            ))}
            {points.map((p, i) => {
              const cx = PL + band * (i + 0.5);
              return (
                <G key={p.label + i}>
                  <Rect
                    x={cx - bw - 2}
                    y={y(p.previous)}
                    width={bw}
                    height={Math.max(0, y(0) - y(p.previous))}
                    rx={Math.min(3, bw / 2)}
                    fill={colors.surface3}
                  />
                  <Rect
                    x={cx + 2}
                    y={y(p.current)}
                    width={bw}
                    height={Math.max(0, y(0) - y(p.current))}
                    rx={Math.min(3, bw / 2)}
                    fill={PLUM}
                    opacity={0.9}
                  />
                  {!compact && (
                    <SvgText x={cx} y={H - 8} textAnchor="middle" {...axisText}>
                      {truncate(p.label, maxChars)}
                    </SvgText>
                  )}
                </G>
              );
            })}
          </Svg>
        );
      }}
    </ChartFrame>
  );
}

/* -------------------------------------------------------------------------- */
/* Gauge                                                                       */
/* -------------------------------------------------------------------------- */

export function Gauge({ pct, label, sub }: { pct: number; label: string; sub?: string }) {
  const { colors } = useTheme();
  const cx = 100;
  const cy = 100;
  const r = 82;
  const arc = (a: number): [number, number] => {
    const rad = Math.PI * (1 - a);
    return [cx + r * Math.cos(rad), cy - r * Math.sin(rad)];
  };
  const [sx, sy] = arc(0);
  const [ex, ey] = arc(1);
  const clamped = Math.max(0.001, Math.min(1, pct / 100));
  const [px, py] = arc(clamped);
  const color = pct >= 66 ? POS : pct >= 40 ? palette.amber500 : NEG;

  return (
    <Svg
      width={192}
      height={113}
      viewBox="0 0 200 118"
      style={{ alignSelf: 'center' }}
      accessibilityRole="image"
      accessibilityLabel={`${label}${sub ? `: ${sub}` : ''}`}>
      <Path
        d={`M ${sx} ${sy} A ${r} ${r} 0 0 1 ${ex} ${ey}`}
        fill="none"
        stroke={colors.surface2}
        strokeWidth={14}
        strokeLinecap="round"
      />
      <Path
        d={`M ${sx} ${sy} A ${r} ${r} 0 0 1 ${px} ${py}`}
        fill="none"
        stroke={color}
        strokeWidth={14}
        strokeLinecap="round"
      />
      <SvgText
        x={cx}
        y={cy - 14}
        textAnchor="middle"
        fontSize={30}
        fontFamily={fonts.display}
        fill={colors.ink1}>
        {label}
      </SvgText>
      {sub ? (
        <SvgText
          x={cx}
          y={cy + 6}
          textAnchor="middle"
          fontSize={11}
          fontFamily={fonts.sans}
          fill={colors.ink3}>
          {sub}
        </SvgText>
      ) : null}
    </Svg>
  );
}

/* -------------------------------------------------------------------------- */
/* shared bits                                                                 */
/* -------------------------------------------------------------------------- */

export function EmptyChartNote() {
  const { messages } = useI18n();
  const { colors } = useTheme();
  return (
    <View
      style={{
        height: 96,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 16,
        borderRadius: radius.lg,
        backgroundColor: colors.surface2,
      }}>
      <Text size="xs" color="ink3" align="center">
        {messages.analytics.noData}
      </Text>
    </View>
  );
}
