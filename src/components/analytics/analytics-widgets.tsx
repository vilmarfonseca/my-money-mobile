import { LinearGradient } from 'expo-linear-gradient';
import { useState, type ReactNode } from 'react';
import { ScrollView, View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';

import {
  EmptyChartNote,
  FanChart,
  Gauge,
  HeatmapGrid,
  NetWorthChart,
  PairedBarsChart,
  RateBarsChart,
  WaterfallChart,
  type WaterfallStep,
} from '@/components/analytics/analytics-charts';
import {
  SankeyChart,
  SankeyFlowDetails,
  type SankeyChartNode,
  type SankeyRibbon,
} from '@/components/analytics/sankey-chart';
import { Text } from '@/components/ui/text';
import type { AnalyticsCardId } from '@/lib/analytics/analytics-catalog';
import type { AnalyticsPageData, SankeyData } from '@/lib/analytics/analytics-queries';
import { useI18n } from '@/lib/i18n/provider';
import { useTheme } from '@/theme/theme-provider';
import { resolveColor } from '@/theme/tones';
import { palette, radius } from '@/theme/tokens';

/**
 * Card bodies for every analytics widget. Each body renders both the live
 * card and (with `preview`) the small non-interactive tile shown inside the
 * customize modal, so previews always match the real thing.
 */

type WidgetProps = { data: AnalyticsPageData; preview?: boolean };

/* ---------------------------------------------------------------------- */
/* shared bits                                                             */
/* ---------------------------------------------------------------------- */

type ChipTone = 'pos' | 'neg' | 'warm' | 'accent' | 'amber' | 'neutral';

export function AnalyticsChip({
  tone = 'neutral',
  children,
  style,
}: {
  tone?: ChipTone;
  children: string;
  style?: StyleProp<ViewStyle>;
}) {
  const { colors } = useTheme();
  const tones = {
    neutral: { bg: colors.surface2, fg: colors.ink2 },
    pos: { bg: colors.positiveSoft, fg: colors.positiveFg },
    neg: { bg: colors.negativeSoft, fg: colors.negativeFg },
    warm: { bg: colors.warmSoft, fg: colors.warmSoftFg },
    accent: { bg: colors.accentSoft, fg: colors.accentSoftFg },
    amber: { bg: colors.warningSoft, fg: colors.warningFg },
  }[tone];

  return (
    <View
      style={[
        {
          height: 24,
          flexShrink: 0,
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 10,
          borderRadius: radius.pill,
          backgroundColor: tones.bg,
        },
        style,
      ]}>
      <Text font="sansMedium" size="xs" color={tones.fg} numberOfLines={1}>
        {children}
      </Text>
    </View>
  );
}

function StatRow({
  stats,
  preview,
}: {
  stats: { label: string; value: string; positive?: boolean }[];
  preview?: boolean;
}) {
  if (preview) return null;
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', columnGap: 32, rowGap: 12 }}>
      {stats.map((s) => (
        <View key={s.label}>
          <Text size={11} color="ink3" uppercase tracking={0.55} numberOfLines={1}>
            {s.label}
          </Text>
          <Text
            font="display"
            size="2xl"
            tight
            color={s.positive ? 'positiveFg' : 'ink1'}
            style={{ marginTop: 4 }}>
            {s.value}
          </Text>
        </View>
      ))}
    </View>
  );
}

/** Rows separated by hairlines; each row lays out its own cells. */
function ListRows({ rows }: { rows: { key: string; cells: ReactNode }[] }) {
  const { colors } = useTheme();
  return (
    <View>
      {rows.map((row, i) => (
        <View
          key={row.key}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 14,
            paddingVertical: 10,
            borderTopWidth: i > 0 ? 1 : 0,
            borderTopColor: colors.line,
          }}>
          {row.cells}
        </View>
      ))}
    </View>
  );
}

const RowName = ({ flex = 1, main, sub }: { flex?: number; main: string; sub?: string }) => (
  <View style={{ flex, minWidth: 0 }}>
    <Text font="sansMedium" size={13} numberOfLines={1}>
      {main}
    </Text>
    {sub ? (
      <Text size={11} color="ink3" numberOfLines={1} style={{ marginTop: 2 }}>
        {sub}
      </Text>
    ) : null}
  </View>
);

const RowAmount = ({
  children,
  minWidth,
  tone,
}: {
  children: string;
  /** The web column's width; amounts with cents may need more and grow. */
  minWidth?: number;
  tone?: 'pos' | 'neg';
}) => (
  <Text
    font="monoMedium"
    size={13}
    align="right"
    color={tone === 'pos' ? 'positiveFg' : tone === 'neg' ? 'negativeFg' : 'ink1'}
    style={{ minWidth }}>
    {children}
  </Text>
);

function TrackBar({
  percent,
  tone = 'plum',
  height = 8,
  style,
}: {
  percent: number;
  tone?: 'plum' | 'pos' | 'neg';
  height?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const { colors } = useTheme();
  const width = `${Math.max(0, Math.min(100, Number.isFinite(percent) ? percent : 0))}%` as const;
  return (
    <View
      style={[
        { height, overflow: 'hidden', borderRadius: height / 2, backgroundColor: colors.surface2 },
        style,
      ]}>
      {tone === 'plum' ? (
        <LinearGradient
          colors={[palette.plum500, palette.coral300]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ width, height, borderRadius: height / 2 }}
        />
      ) : (
        <View
          style={{
            width,
            height,
            borderRadius: height / 2,
            backgroundColor: tone === 'pos' ? palette.sage500 : palette.coral500,
          }}
        />
      )}
    </View>
  );
}

function Legend({ items }: { items: { label: string; color: string }[] }) {
  return (
    <View
      style={{ flexDirection: 'row', flexWrap: 'wrap', columnGap: 16, rowGap: 10, marginTop: 14 }}>
      {items.map((it) => (
        <View
          key={it.label}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 8, maxWidth: '100%' }}>
          <View style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: it.color }} />
          <Text size="xs" color="ink2" style={{ flexShrink: 1 }}>
            {it.label}
          </Text>
        </View>
      ))}
    </View>
  );
}

function EmptyListNote() {
  const { messages } = useI18n();
  const { colors } = useTheme();
  return (
    <View
      style={{
        height: 80,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 16,
        borderRadius: radius.md,
        backgroundColor: colors.surface2,
      }}>
      <Text size="xs" color="ink3" align="center">
        {messages.analytics.noData}
      </Text>
    </View>
  );
}

/** The width wide charts keep on phones (`w-160` on the web). */
const WIDE_CHART_WIDTH = 640;

/**
 * Wide charts keep a readable size on phones by scrolling horizontally
 * instead of squeezing into the card.
 */
function ScrollX({ children }: { children: ReactNode }) {
  const [available, setAvailable] = useState(0);
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={{ marginHorizontal: -4 }}
      contentContainerStyle={{ paddingHorizontal: 4 }}
      onLayout={(event) => setAvailable(Math.floor(event.nativeEvent.layout.width) - 8)}>
      {/* On a tablet the card can be wider than the chart's phone width. */}
      <View style={{ width: Math.max(WIDE_CHART_WIDTH, available) }}>{children}</View>
    </ScrollView>
  );
}

/* ---------------------------------------------------------------------- */
/* sankey labels: translate the synthetic node ids                         */
/* ---------------------------------------------------------------------- */

function useSankeyNodes(sankey: SankeyData) {
  const { messages } = useI18n();
  const translate = (node: SankeyChartNode) => ({
    ...node,
    label:
      node.label === '__saved__'
        ? messages.analytics.savedNode
        : node.label === '__balance__'
          ? messages.analytics.fromBalanceNode
          : node.label === '__other__'
            ? messages.common.other
            : node.label,
  });
  return {
    sources: sankey.sources.map(translate),
    targets: sankey.targets.map(translate),
  };
}

/* ---------------------------------------------------------------------- */
/* widget bodies                                                           */
/* ---------------------------------------------------------------------- */

function SankeyWidget({ data, preview }: WidgetProps) {
  const { formatCurrency } = useI18n();
  const { colors } = useTheme();
  const { sankey } = data;
  const { sources, targets } = useSankeyNodes(sankey);
  const [selected, setSelected] = useState<SankeyRibbon | null>(null);

  if (!sankey.totalIn && !sankey.targets.length) return <EmptyChartNote />;

  // The preview fits the whole map in its tile, like the web's desktop tile.
  if (preview) {
    return <SankeyChart sources={sources} targets={targets} flows={sankey.flows} compact />;
  }

  return (
    <View>
      {/* Phones scroll the flow map sideways like the other wide charts:
          shrinking it to the card's width makes the labels unreadable. */}
      <ScrollX>
        <SankeyChart
          sources={sources}
          targets={targets}
          flows={sankey.flows}
          tall
          selectedKey={selected?.key ?? null}
          onSelect={setSelected}
        />
      </ScrollX>
      {selected ? (
        <SankeyFlowDetails ribbon={selected} onDismiss={() => setSelected(null)} />
      ) : null}
      <Legend
        items={sources.map((s) => ({
          label: `${s.label} ${formatCurrency(s.amount)}`,
          color: resolveColor(s.color, colors),
        }))}
      />
    </View>
  );
}

function NetWorthWidget({ data, preview }: WidgetProps) {
  const { formatCurrency, messages } = useI18n();
  const { colors } = useTheme();
  const m = messages.analytics;
  const trend = data.netWorthTrend;

  return (
    <View>
      <StatRow
        preview={preview}
        stats={[
          { label: m.now, value: formatCurrency(trend.current) },
          ...(trend.growthPct !== null
            ? [
                {
                  label: m.growth12mo,
                  value: `${trend.growthPct > 0 ? '+' : ''}${trend.growthPct}%`,
                  positive: trend.growthPct >= 0,
                },
              ]
            : []),
        ]}
      />
      <View style={{ marginTop: preview ? 0 : 16 }}>
        <NetWorthChart
          points={trend.points}
          markerIndexes={trend.markerIndexes}
          compact={preview}
        />
      </View>
      {!preview && trend.markers.length > 0 ? (
        <View
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            columnGap: 20,
            rowGap: 8,
            marginTop: 14,
            paddingTop: 14,
            borderTopWidth: 1,
            borderTopColor: colors.line,
          }}>
          {trend.markers.map((marker) => (
            <View
              key={marker}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 8, maxWidth: '100%' }}>
              <View
                style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: palette.plum500 }}
              />
              <Text size="xs" color="ink2" style={{ flexShrink: 1 }}>
                {marker}
              </Text>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

function SaveRateWidget({ data, preview }: WidgetProps) {
  const { messages } = useI18n();
  const m = messages.analytics;
  const trend = data.saveRateTrend;
  if (!trend.points.length) return <EmptyChartNote />;

  return (
    <View>
      <StatRow
        preview={preview}
        stats={[
          ...(trend.latest !== null ? [{ label: m.latest, value: `${trend.latest}%` }] : []),
          ...(trend.best !== null ? [{ label: m.bestMonth, value: `${trend.best}%` }] : []),
        ]}
      />
      <View style={{ marginTop: preview ? 0 : 16 }}>
        <RateBarsChart
          points={trend.points}
          target={trend.target}
          targetLabel={m.targetLine(trend.target)}
          compact={preview}
        />
      </View>
    </View>
  );
}

function HeatmapWidget({ data, preview }: WidgetProps) {
  const grid = (
    <HeatmapGrid
      monthLabels={data.heatmap.monthLabels}
      categories={data.heatmap.categories}
      compact={preview}
    />
  );
  if (preview || !data.heatmap.categories.length) return grid;
  // The grid is as wide as its amounts need, so it scrolls on its own width.
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={{ marginHorizontal: -4 }}
      contentContainerStyle={{ paddingHorizontal: 4 }}>
      {grid}
    </ScrollView>
  );
}

function BalanceAheadWidget({ data, preview }: WidgetProps) {
  const { messages, formatCurrency, formatSignedCurrency } = useI18n();
  const m = messages.analytics;
  const b = data.balanceAhead;

  const steps: WaterfallStep[] = [
    { kind: 'start', label: m.today, value: b.today },
    ...(b.incoming > 0 ? [{ kind: 'delta', label: m.incoming, value: b.incoming } as const] : []),
    ...(b.billsDue > 0 ? [{ kind: 'delta', label: m.billsDue, value: -b.billsDue } as const] : []),
    ...(b.estimatedVariable > 0
      ? [{ kind: 'delta', label: m.estVariable, value: -b.estimatedVariable } as const]
      : []),
    { kind: 'end', label: b.monthEndLabel, value: b.projected },
  ];

  const delta = b.projected - b.today;

  if (preview) {
    return <WaterfallChart steps={steps} compact />;
  }

  return (
    <View style={{ gap: 24 }}>
      <View>
        <Text size="xs" color="ink3" uppercase tracking={0.6}>
          {m.projectedBalance(b.monthEndLabel)}
        </Text>
        <Text
          font="display"
          size="5xl"
          tight
          tracking={-1.2}
          numberOfLines={1}
          adjustsFontSizeToFit
          style={{ marginVertical: 6 }}>
          {formatCurrency(b.projected)}
        </Text>
        <Text size={13} color={delta >= 0 ? 'positiveFg' : 'negativeFg'}>
          {`${delta >= 0 ? '↑' : '↓'} ${formatCurrency(Math.abs(Math.round(delta)))} ${m.vsToday}`}
        </Text>
        <View style={{ marginTop: 14 }}>
          <WaterfallChart steps={steps} />
        </View>
      </View>
      <View>
        <Text size="xs" color="ink3" uppercase tracking={0.6} style={{ marginBottom: 6 }}>
          {m.stillToCome}
        </Text>
        {b.rows.length ? (
          <ListRows
            rows={b.rows.map((row, i) => ({
              key: `${row.label}-${i}`,
              cells: (
                <>
                  <RowName
                    main={
                      row.kind === 'incoming'
                        ? m.incoming
                        : row.kind === 'estimate'
                          ? m.estVariableRow
                          : row.label
                    }
                    sub={
                      row.kind === 'incoming'
                        ? m.deposits(Number(row.sublabel))
                        : row.kind === 'estimate'
                          ? m.fromYourAverage
                          : row.sublabel
                    }
                  />
                  <RowAmount tone={row.amount > 0 ? 'pos' : undefined}>
                    {formatSignedCurrency(row.amount)}
                  </RowAmount>
                </>
              ),
            }))}
          />
        ) : (
          <EmptyListNote />
        )}
      </View>
    </View>
  );
}

function CompoundWidget({ data, preview }: WidgetProps) {
  const { formatCurrency, messages } = useI18n();
  const m = messages.analytics;
  const points = data.compound.points.map((p) => ({
    ...p,
    label: p.label === '__now__' ? m.now : p.label,
  }));

  if (preview) return <FanChart points={points} compact />;

  return (
    <View>
      <ScrollX>
        <FanChart points={points} />
      </ScrollX>
      <Text size="xs" color="ink3" style={{ marginTop: 10, lineHeight: 19.5 }}>
        {m.compoundNote(data.compound.saveRatePct ?? 0, formatCurrency(data.compound.tenYearValue))}
      </Text>
    </View>
  );
}

function RunwayWidget({ data, preview }: WidgetProps) {
  const { messages, formatCurrency } = useI18n();
  const { colors } = useTheme();
  const m = messages.analytics;
  const r = data.runway;
  if (r.months === null) return <EmptyChartNote />;
  const scaleMax = Math.max(9, Math.ceil(r.months / 3) * 3);

  return (
    <View>
      <Text font="display" size="4xl" tight tracking={-0.9}>
        {m.monthsShort(r.months)}
      </Text>
      {!preview && (
        <Text size="xs" color="ink3" style={{ marginTop: 8, marginBottom: 14, lineHeight: 19.5 }}>
          {m.runwayNote(formatCurrency(r.saved), r.months, formatCurrency(r.avgMonthlySpend))}
        </Text>
      )}
      <View
        style={{
          height: 14,
          overflow: 'hidden',
          borderRadius: 7,
          marginTop: preview ? 12 : 0,
          backgroundColor: colors.surface2,
        }}>
        <LinearGradient
          colors={[palette.sage500, palette.sage300]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{
            width: `${Math.max(0, Math.min(100, (r.months / scaleMax) * 100))}%`,
            height: 14,
            borderRadius: 7,
          }}
        />
      </View>
      {!preview && (
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 }}>
          {['0', m.runwayTargetTick, String(Math.round(scaleMax * (2 / 3))), String(scaleMax)].map(
            (tick, i) => (
              <Text key={i} font="mono" size={10} color="ink3">
                {tick}
              </Text>
            ),
          )}
        </View>
      )}
    </View>
  );
}

function GoalsWidget({ data, preview }: WidgetProps) {
  const { formatCurrency, messages } = useI18n();
  const m = messages.analytics;
  if (!data.goalEtas.length) return <EmptyListNote />;

  const chipFor = (chip: (typeof data.goalEtas)[number]['chip']) => {
    switch (chip.kind) {
      case 'eta':
        return <AnalyticsChip tone="pos">{chip.label}</AnalyticsChip>;
      case 'onTrack':
        return <AnalyticsChip tone="accent">{m.onTrack}</AnalyticsChip>;
      case 'behind':
        return <AnalyticsChip tone="warm">{m.monthsBehind(Number(chip.label))}</AnalyticsChip>;
      case 'noContribution':
        return <AnalyticsChip tone="warm">{m.noContribution}</AnalyticsChip>;
    }
  };

  return (
    <ListRows
      rows={data.goalEtas.map((goal, i) => ({
        key: `${goal.name}-${i}`,
        cells: (
          <>
            <RowName
              flex={preview ? 1 : 1.1}
              main={goal.name}
              sub={`${formatCurrency(goal.saved)} / ${formatCurrency(goal.target)}`}
            />
            <TrackBar percent={goal.percent} style={{ flex: 1 }} />
            {preview ? null : chipFor(goal.chip)}
          </>
        ),
      }))}
    />
  );
}

function BudgetWidget({ data, preview }: WidgetProps) {
  const { messages, formatCurrency, formatSignedCurrency } = useI18n();
  const { colors } = useTheme();
  const m = messages.analytics;
  const rows = preview ? data.budget.slice(0, 3) : data.budget;
  if (!rows.length) return <EmptyListNote />;

  const pacing = (row: (typeof rows)[number]) =>
    row.typical > 0 ? (row.actual / row.typical) * 100 : 100;

  if (preview) {
    return (
      <ListRows
        rows={rows.map((row, i) => ({
          key: `${row.name}-${i}`,
          cells: (
            <>
              <RowName main={row.name} />
              <TrackBar
                height={12}
                percent={pacing(row)}
                tone={row.over ? 'neg' : 'pos'}
                style={{ flex: 1.3 }}
              />
            </>
          ),
        }))}
      />
    );
  }

  // The phone layout: the full name plus its pacing on the first line (values
  // right, tightly spaced), with the bar running underneath so names never
  // truncate.
  return (
    <View>
      {rows.map((row, i) => (
        <View
          key={`${row.name}-${i}`}
          style={{
            gap: 10,
            paddingVertical: 12,
            borderTopWidth: i > 0 ? 1 : 0,
            borderTopColor: colors.line,
          }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text font="sansMedium" size="sm" style={{ lineHeight: 19 }}>
                {row.name}
              </Text>
              <Text size={11} color="ink3" style={{ marginTop: 2 }}>
                {m.typicalPrefix(formatCurrency(row.typical))}
              </Text>
            </View>
            <RowAmount>{formatCurrency(row.actual)}</RowAmount>
            <AnalyticsChip tone={row.over ? 'neg' : 'pos'}>
              {formatSignedCurrency(row.over ? row.diff : -row.diff)}
            </AnalyticsChip>
          </View>
          <TrackBar height={12} percent={pacing(row)} tone={row.over ? 'neg' : 'pos'} />
        </View>
      ))}
    </View>
  );
}

const DONUT_SIZE = 128;
const DONUT_CIRCUMFERENCE = 2 * Math.PI * 48;

function RecurringWidget({ data, preview }: WidgetProps) {
  const { messages, formatCurrency } = useI18n();
  const { colors } = useTheme();
  const m = messages.analytics;
  const split = data.recurringSplit;
  const total = split.fixed + split.variable;
  if (!total) return <EmptyChartNote />;

  const fixedLength = (split.fixed / total) * DONUT_CIRCUMFERENCE;
  const segments = [
    {
      label: m.fixedRecurringLabel,
      value: split.fixed,
      color: palette.plum500,
      length: fixedLength,
      offset: 0,
    },
    {
      label: m.variableLabel,
      value: split.variable,
      color: palette.coral600,
      length: DONUT_CIRCUMFERENCE - fixedLength,
      offset: fixedLength,
    },
  ];
  const centerValue = `${split.fixedPct ?? 0}%`;

  return (
    <View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 20 }}>
        <View style={{ width: DONUT_SIZE, height: DONUT_SIZE }}>
          <Svg width={DONUT_SIZE} height={DONUT_SIZE} viewBox="0 0 120 120">
            {/* Start the ring at 12 o'clock. */}
            <G rotation={-90} origin="60, 60">
              <Circle
                cx={60}
                cy={60}
                r={48}
                fill="none"
                stroke={colors.surface2}
                strokeWidth={16}
              />
              {segments.map((seg) => (
                <Circle
                  key={seg.label}
                  cx={60}
                  cy={60}
                  r={48}
                  fill="none"
                  stroke={seg.color}
                  strokeWidth={16}
                  strokeDasharray={[seg.length, DONUT_CIRCUMFERENCE - seg.length]}
                  strokeDashoffset={-seg.offset}
                />
              ))}
            </G>
          </Svg>
          <View
            style={{
              position: 'absolute',
              top: 0,
              right: 0,
              bottom: 0,
              left: 0,
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            <Text font="display" size="2xl" tight>
              {centerValue}
            </Text>
            <Text
              font="sansMedium"
              size={8}
              color="ink3"
              uppercase
              tracking={0.6}
              style={{ marginTop: 2 }}>
              {m.fixedCenter}
            </Text>
          </View>
        </View>
        <View style={{ flex: 1, minWidth: 144, gap: 8 }}>
          {segments.map((seg) => (
            <View
              key={seg.label}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 8,
              }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 1 }}>
                <View
                  style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: seg.color }}
                />
                <Text size={13} numberOfLines={1} style={{ flexShrink: 1 }}>
                  {seg.label}
                </Text>
              </View>
              <Text font="monoMedium" size={13}>
                {formatCurrency(seg.value)}
              </Text>
            </View>
          ))}
        </View>
      </View>
      {!preview && (
        <Text size="xs" color="ink3" style={{ marginTop: 12, lineHeight: 19.5 }}>
          {m.committedNote(formatCurrency(split.fixed), formatCurrency(total))}
        </Text>
      )}
    </View>
  );
}

function EffectiveSaveRateWidget({ data, preview }: WidgetProps) {
  const { messages } = useI18n();
  const m = messages.analytics;
  const trend = data.effectiveSaveRate;
  if (!trend.points.length) return <EmptyChartNote />;
  return (
    <RateBarsChart
      points={trend.points}
      target={trend.target}
      targetLabel={m.targetLine(trend.target)}
      compact={preview}
      height={preview ? 128 : 176}
    />
  );
}

function MerchantsWidget({ data, preview }: WidgetProps) {
  const { messages, formatCurrency } = useI18n();
  const m = messages.analytics;
  const rows = preview ? data.merchants.slice(0, 3) : data.merchants;
  if (!rows.length) return <EmptyListNote />;
  const max = Math.max(...rows.map((r) => r.amount), 1);

  return (
    <ListRows
      rows={rows.map((row, i) => ({
        key: `${row.name}-${i}`,
        cells: (
          <>
            <RowName main={row.name} sub={m.charges(row.count)} />
            <TrackBar percent={(row.amount / max) * 100} style={{ flex: 1 }} />
            {preview ? null : <RowAmount minWidth={72}>{formatCurrency(row.amount)}</RowAmount>}
          </>
        ),
      }))}
    />
  );
}

function UnusualWidget({ data, preview }: WidgetProps) {
  const { messages, formatCurrency } = useI18n();
  const { colors } = useTheme();
  const m = messages.analytics;
  const rows = preview ? data.unusual.slice(0, 3) : data.unusual;

  if (!rows.length) {
    return (
      <View
        style={{
          height: 96,
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: 16,
          borderRadius: radius.lg,
          backgroundColor: colors.positiveSoft,
        }}>
        <Text size="xs" color="positiveFg" align="center">
          {m.noUnusual}
        </Text>
      </View>
    );
  }

  return (
    <ListRows
      rows={rows.map((row, i) => ({
        key: `${row.merchant}-${i}`,
        cells: (
          <>
            <View style={{ width: 16 }}>
              <View
                style={{
                  width: 9,
                  height: 9,
                  borderRadius: 4.5,
                  backgroundColor: row.ratio >= 2.5 ? palette.coral500 : palette.amber500,
                }}
              />
            </View>
            <RowName main={row.merchant} sub={row.category} />
            <RowAmount minWidth={72}>{formatCurrency(row.amount)}</RowAmount>
            {preview ? null : (
              <AnalyticsChip tone={row.ratio >= 2.5 ? 'neg' : 'amber'}>
                {m.timesUsual(row.ratio)}
              </AnalyticsChip>
            )}
          </>
        ),
      }))}
    />
  );
}

function SubscriptionsWidget({ data, preview }: WidgetProps) {
  const { messages, formatCurrency } = useI18n();
  const m = messages.analytics;
  const rows = preview ? data.subscriptions.slice(0, 3) : data.subscriptions;
  if (!rows.length) return <EmptyListNote />;

  const freqLabel = {
    weekly: m.freqWeekly,
    monthly: m.freqMonthly,
    yearly: m.freqYearly,
  } as const;

  return (
    <ListRows
      rows={rows.map((row, i) => ({
        key: `${row.merchant}-${i}`,
        cells: (
          <>
            <RowName
              main={row.merchant}
              sub={`${formatCurrency(row.monthlyAmount)}${m.perMonthSuffix}`}
            />
            <RowAmount minWidth={96}>{`${formatCurrency(row.costPerDay)}${m.perDaySuffix}`}</RowAmount>
            {preview ? null : <AnalyticsChip tone="accent">{freqLabel[row.frequency]}</AnalyticsChip>}
          </>
        ),
      }))}
    />
  );
}

function BenchmarksWidget({ data, preview }: WidgetProps) {
  const { messages } = useI18n();
  const { colors } = useTheme();
  const m = messages.analytics;
  const b = data.benchmarks;
  if (b.aboveTargetPct === null) return <EmptyChartNote />;

  return (
    <View>
      <Gauge
        pct={b.aboveTargetPct}
        label={`${b.aboveTargetPct}%`}
        sub={m.monthsAboveTarget(b.target)}
      />
      {!preview && (
        <View style={{ marginTop: 8 }}>
          <Text size={13} color="ink2" style={{ marginBottom: 8 }}>
            {m.streakLabel(b.streak, b.target)}
          </Text>
          <View style={{ flexDirection: 'row', gap: 6 }}>
            {b.last12.map((on, i) => (
              <View
                key={i}
                style={{
                  flex: 1,
                  height: 10,
                  borderRadius: 5,
                  backgroundColor: on ? palette.sage500 : colors.surface3,
                }}
              />
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

function ThisVsLastWidget({ data, preview }: WidgetProps) {
  const { formatCurrency, messages } = useI18n();
  const { colors } = useTheme();
  const m = messages.analytics;
  const cmp = data.thisVsLast;
  if (!cmp.categories.length) return <EmptyChartNote />;

  const chart = (
    <PairedBarsChart
      points={cmp.categories.map((c) => ({
        label: c.name,
        current: c.current,
        previous: c.previous,
      }))}
      compact={preview}
    />
  );
  if (preview) return chart;

  return (
    <View>
      <ScrollX>{chart}</ScrollX>
      <Legend
        items={[
          {
            label: `${m.thisMonth} ${formatCurrency(cmp.currentTotal)}`,
            color: palette.plum500,
          },
          {
            label: `${m.lastMonth} ${formatCurrency(cmp.previousTotal)}`,
            color: colors.surface3,
          },
        ]}
      />
    </View>
  );
}

function SeasonalityWidget({ data, preview }: WidgetProps) {
  const { messages } = useI18n();
  const { colors } = useTheme();
  const m = messages.analytics;
  const points = data.seasonality.points;
  if (!points.some((p) => p.current || p.previous)) return <EmptyChartNote />;

  if (preview) return <PairedBarsChart points={points} compact />;

  return (
    <View>
      <ScrollX>
        <PairedBarsChart points={points} />
      </ScrollX>
      <Legend
        items={[
          { label: m.thisYear, color: palette.plum500 },
          { label: m.lastYear, color: colors.surface3 },
        ]}
      />
    </View>
  );
}

/* ---------------------------------------------------------------------- */
/* registry                                                                */
/* ---------------------------------------------------------------------- */

export const ANALYTICS_WIDGETS: Record<AnalyticsCardId, (props: WidgetProps) => ReactNode> = {
  sankey: SankeyWidget,
  networth: NetWorthWidget,
  saverate: SaveRateWidget,
  heatmap: HeatmapWidget,
  balance: BalanceAheadWidget,
  compound: CompoundWidget,
  runway: RunwayWidget,
  goals: GoalsWidget,
  budget: BudgetWidget,
  recurring: RecurringWidget,
  effsave: EffectiveSaveRateWidget,
  merchants: MerchantsWidget,
  unusual: UnusualWidget,
  subs: SubscriptionsWidget,
  benchmarks: BenchmarksWidget,
  thisvslast: ThisVsLastWidget,
  seasonality: SeasonalityWidget,
};

/** Chip shown in a card's title row, when the card has one. */
export function AnalyticsCardChip({ id, data }: { id: AnalyticsCardId; data: AnalyticsPageData }) {
  const { messages, formatSignedCurrency } = useI18n();
  const m = messages.analytics;

  switch (id) {
    case 'networth':
      return (
        <AnalyticsChip tone="pos">
          {`${formatSignedCurrency(data.netWorthTrend.deltaOverRange)} ${m.trailing12mo}`}
        </AnalyticsChip>
      );
    case 'saverate':
      return data.saveRateTrend.average !== null ? (
        <AnalyticsChip tone="accent">{m.avgChip(data.saveRateTrend.average)}</AnalyticsChip>
      ) : null;
    case 'heatmap':
      return <AnalyticsChip>{m.heatmapChip(data.heatmap.categories.length)}</AnalyticsChip>;
    default:
      return null;
  }
}
