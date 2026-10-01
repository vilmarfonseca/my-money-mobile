import { Pressable, View } from 'react-native';
import Svg, { G, Path, Rect, Text as SvgText } from 'react-native-svg';

import { textWidth } from '@/components/analytics/analytics-charts';
import { Text } from '@/components/ui/text';
import { useI18n } from '@/lib/i18n/provider';
import { useTheme } from '@/theme/theme-provider';
import { resolveColor } from '@/theme/tones';
import { fonts, radius } from '@/theme/tokens';

/**
 * The income-to-spending flow map, ported from the web's hand-written layout:
 * two columns of nodes sized by amount, joined by ribbons. It draws in the
 * same viewBox units as the web chart and scales to the box it is given.
 */

export type SankeyChartNode = {
  id: string;
  label: string;
  amount: number;
  color: string;
};

/** The ribbon a tap selected: what the web shows in its hover tooltip. */
export type SankeyRibbon = {
  key: string;
  source: SankeyChartNode;
  target: SankeyChartNode;
  amount: number;
};

/** Gap between a node and its label, in viewBox units. */
const LABEL_GAP = 12;
const PAD_TB = 24;
const NODE_W = 14;
const COL_GAP = 10;
const MIN_NODE_H = 14;
/** Nodes shorter than this get a single-line label. */
const ONE_LINE_BELOW = 30;

type Laid = SankeyChartNode & { h: number; y: number };

function layoutColumn(items: SankeyChartNode[], total: number, innerH: number): Laid[] {
  const usable = innerH - (items.length - 1) * COL_GAP;
  const scale = usable / total;
  const laid = items.map((it) => ({
    ...it,
    h: Math.max(MIN_NODE_H, it.amount * scale),
    y: 0,
  }));
  // Nodes lifted to the minimum height take their extra from the others.
  const extra = laid.reduce((a, it) => a + Math.max(0, MIN_NODE_H - it.amount * scale), 0);
  if (extra > 0) {
    const adj = laid.filter((it) => it.amount * scale >= MIN_NODE_H);
    const tot = adj.reduce((a, x) => a + x.h, 0);
    adj.forEach((it) => {
      it.h -= (it.h / tot) * extra;
    });
  }
  let y = PAD_TB;
  for (const it of laid) {
    it.y = y;
    y += it.h + COL_GAP;
  }
  return laid;
}

function layoutSankey({
  compact,
  flows,
  formatCurrency,
  height,
  sources,
  targets,
  width,
}: {
  compact: boolean;
  flows: { source: string; target: string; amount: number }[];
  formatCurrency: (value: number) => string;
  height: number;
  sources: SankeyChartNode[];
  targets: SankeyChartNode[];
  width: number;
}) {
  const total = Math.max(
    sources.reduce((a, s) => a + s.amount, 0),
    targets.reduce((a, t) => a + t.amount, 0),
    1,
  );
  const innerH = height - PAD_TB * 2;
  const laidSources = layoutColumn(sources, total, innerH);
  const laidTargets = layoutColumn(targets, total, innerH);

  /*
   * Labels are SVG text, so the viewBox has to reserve a gutter wide enough
   * for the longest one. Widths are estimated from the font size rather than
   * measured, and capped so one very long name can't squeeze the ribbons.
   */
  const labelWidth = (item: Laid) => {
    const value = formatCurrency(item.amount);
    return item.h < ONE_LINE_BELOW
      ? textWidth(`${item.label} · ${value}`, 11)
      : Math.max(textWidth(item.label, 13), textWidth(value, 12, true));
  };
  const gutter = (items: Laid[]) =>
    compact
      ? 16
      : Math.min(
          items.reduce((a, it) => Math.max(a, labelWidth(it)), 0) + LABEL_GAP + 8,
          width * 0.3,
        );

  const sourceGutter = gutter(laidSources);
  const targetGutter = gutter(laidTargets);
  const sx = sourceGutter;
  const tx = width - targetGutter - NODE_W;
  const sMap = new Map(laidSources.map((s) => [s.id, s]));
  const tMap = new Map(laidTargets.map((t) => [t.id, t]));

  const srcOffsets = new Map<string, number>();
  const tgtOffsets = new Map<string, number>();
  const ribbons = flows
    .filter((f) => f.amount > 0)
    .map((f) => {
      const s = sMap.get(f.source);
      const t = tMap.get(f.target);
      if (!s || !t) return null;
      const hSrc = f.amount * (s.h / Math.max(1, s.amount));
      const hTgt = f.amount * (t.h / Math.max(1, t.amount));
      const srcY = s.y + (srcOffsets.get(s.id) ?? 0);
      const tgtY = t.y + (tgtOffsets.get(t.id) ?? 0);
      srcOffsets.set(s.id, (srcOffsets.get(s.id) ?? 0) + hSrc);
      tgtOffsets.set(t.id, (tgtOffsets.get(t.id) ?? 0) + hTgt);
      const x0 = sx + NODE_W;
      const x1 = tx;
      const cx = (x0 + x1) / 2;
      return {
        key: `${f.source}-${f.target}`,
        color: s.color,
        source: s,
        target: t,
        amount: f.amount,
        title: `${s.label} → ${t.label}: ${formatCurrency(f.amount)}`,
        d: `M ${x0} ${srcY} C ${cx} ${srcY}, ${cx} ${tgtY}, ${x1} ${tgtY} L ${x1} ${tgtY + hTgt} C ${cx} ${tgtY + hTgt}, ${cx} ${srcY + hSrc}, ${x0} ${srcY + hSrc} Z`,
      };
    })
    .filter((r): r is NonNullable<typeof r> => r !== null);

  return {
    laidSources,
    laidTargets,
    ribbons,
    sx,
    tx,
    // Text room inside each gutter, for trimming names the cap cut short.
    sourceLabelRoom: sourceGutter - LABEL_GAP - 4,
    targetLabelRoom: targetGutter - LABEL_GAP - 4,
  };
}

/** Cuts a label to the characters that fit `room` at the given font size. */
function fitLabel(label: string, suffix: string, room: number, fontSize: number) {
  const maxChars = Math.floor(room / (fontSize * 0.58)) - suffix.length;
  if (label.length <= maxChars) return `${label}${suffix}`;
  return `${label.slice(0, Math.max(1, maxChars - 1))}…${suffix}`;
}

type SankeyChartProps = {
  sources: SankeyChartNode[];
  targets: SankeyChartNode[];
  flows: { source: string; target: string; amount: number }[];
  /** Hide node labels and ignore taps (previews). */
  compact?: boolean;
  /** Taller narrow layout for phone widths. */
  tall?: boolean;
  /** Key of the highlighted ribbon. */
  selectedKey?: string | null;
  /** A ribbon was tapped (`null`: the selection was cleared). */
  onSelect?: (ribbon: SankeyRibbon | null) => void;
};

export function SankeyChart({
  sources,
  targets,
  flows,
  compact = false,
  tall = false,
  selectedKey = null,
  onSelect,
}: SankeyChartProps) {
  const { formatCurrency } = useI18n();
  const { colors } = useTheme();
  // Previews in the customize modal are decorative, so they stay inert.
  const interactive = !compact && Boolean(onSelect);
  const W = tall ? 820 : 1200;
  const H = tall ? 560 : 430;

  const paint = (node: SankeyChartNode) => ({ ...node, color: resolveColor(node.color, colors) });
  const { laidSources, laidTargets, ribbons, sx, tx, sourceLabelRoom, targetLabelRoom } =
    layoutSankey({
      compact,
      flows,
      formatCurrency,
      height: H,
      sources: sources.map(paint),
      targets: targets.map(paint),
      width: W,
    });

  const selected = ribbons.find((r) => r.key === selectedKey) ?? null;
  const isDimmed = (id: string) =>
    selected !== null && selected.source.id !== id && selected.target.id !== id;

  const nodeLabel = (item: Laid, x: number, anchorRight: boolean, room: number) => {
    if (compact) return null;
    const lx = anchorRight ? x + NODE_W + LABEL_GAP : x - LABEL_GAP;
    const anchor = anchorRight ? 'start' : 'end';
    const value = formatCurrency(item.amount);
    // Small nodes get one compact line so stacked labels can't overlap.
    if (item.h < ONE_LINE_BELOW) {
      return (
        <SvgText
          key={`label-${item.id}`}
          x={lx}
          y={item.y + item.h / 2 + 4}
          textAnchor={anchor}
          fontSize={11}
          fontFamily={fonts.sansMedium}
          fill={colors.ink2}>
          {fitLabel(item.label, ` · ${value}`, room, 11)}
        </SvgText>
      );
    }
    return (
      <G key={`label-${item.id}`}>
        <SvgText
          x={lx}
          y={item.y + item.h / 2 - 2}
          textAnchor={anchor}
          fontSize={13}
          fontFamily={fonts.sansMedium}
          fill={colors.ink1}>
          {fitLabel(item.label, '', room, 13)}
        </SvgText>
        <SvgText
          x={lx}
          y={item.y + item.h / 2 + 12}
          textAnchor={anchor}
          fontSize={12}
          fontFamily={fonts.mono}
          fill={colors.ink3}>
          {value}
        </SvgText>
      </G>
    );
  };

  return (
    <View style={{ aspectRatio: W / H }}>
      <Svg width="100%" height="100%" viewBox={`0 0 ${W} ${H}`} accessibilityRole="image">
        {interactive ? (
          // Tapping outside the ribbons clears the selection.
          <Rect
            x={0}
            y={0}
            width={W}
            height={H}
            fill="#000000"
            fillOpacity={0}
            onPress={() => onSelect?.(null)}
          />
        ) : null}
        {ribbons.map((r) => (
          <Path
            key={r.key}
            d={r.d}
            fill={r.color}
            opacity={selected === null ? 0.45 : selected.key === r.key ? 0.85 : 0.12}
            accessibilityLabel={r.title}
            onPress={
              interactive
                ? () =>
                    onSelect?.(
                      selected?.key === r.key
                        ? null
                        : { key: r.key, source: r.source, target: r.target, amount: r.amount },
                    )
                : undefined
            }
          />
        ))}
        {laidSources.map((s) => (
          <Rect
            key={s.id}
            x={sx}
            y={s.y}
            width={NODE_W}
            height={s.h}
            rx={3}
            fill={s.color}
            opacity={isDimmed(s.id) ? 0.3 : 1}
          />
        ))}
        {laidTargets.map((t) => (
          <Rect
            key={t.id}
            x={tx}
            y={t.y}
            width={NODE_W}
            height={t.h}
            rx={3}
            fill={t.color}
            opacity={isDimmed(t.id) ? 0.3 : 1}
          />
        ))}
        {laidSources.map((s) => nodeLabel(s, sx, false, sourceLabelRoom))}
        {laidTargets.map((t) => nodeLabel(t, tx, true, targetLabelRoom))}
      </Svg>
    </View>
  );
}

/**
 * Details of the tapped ribbon: the content of the web chart's hover tooltip,
 * shown as a panel under the chart (tap it to dismiss).
 */
export function SankeyFlowDetails({
  onDismiss,
  ribbon,
}: {
  onDismiss: () => void;
  ribbon: SankeyRibbon;
}) {
  const { formatCurrency, messages } = useI18n();
  const { colors } = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${ribbon.source.label} → ${ribbon.target.label}: ${formatCurrency(ribbon.amount)}`}
      onPress={onDismiss}
      style={{
        marginTop: 12,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: radius.md,
        borderWidth: 1,
        borderColor: colors.line,
        backgroundColor: colors.surface1,
      }}>
      <View style={{ gap: 4 }}>
        {[ribbon.source, ribbon.target].map((node) => (
          <View key={node.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View
              style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: resolveColor(node.color, colors),
              }}
            />
            <Text size="xs" color="ink2" numberOfLines={1} style={{ flex: 1 }}>
              {node.label}
            </Text>
            <Text font="mono" size="xs" color="ink3">
              {formatCurrency(node.amount)}
            </Text>
          </View>
        ))}
      </View>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          gap: 16,
          marginTop: 8,
          paddingTop: 8,
          borderTopWidth: 1,
          borderTopColor: colors.line,
        }}>
        <Text size="xs" color="ink3">
          {messages.analytics.sankeyFlowLabel}
        </Text>
        <Text font="monoMedium" size="sm">
          {formatCurrency(ribbon.amount)}
        </Text>
      </View>
    </Pressable>
  );
}
