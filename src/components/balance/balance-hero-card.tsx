import { type Href, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, View, type ViewStyle } from 'react-native';

import { Card } from '@/components/ui/card';
import { Chip } from '@/components/ui/chip';
import { Separator } from '@/components/ui/separator';
import { Text } from '@/components/ui/text';
import type { BalanceMeta, BalancePeriodData } from '@/lib/balance/balance-data';
import { computeWaterfall } from '@/lib/balance/balance-utils';
import { useI18n } from '@/lib/i18n/provider';
import { useTheme } from '@/theme/theme-provider';
import { palette, radius } from '@/theme/tokens';

/** `text-white` on the flow bar, and its `opacity-70` percentage. */
const onSegment = palette.white;
const onSegmentMuted = `${palette.white}b3`;
const SEGMENT_PADDING = 12;

export function BalanceHeroCard({ data }: { data: BalancePeriodData }) {
  const { formatCurrency, messages, splitCurrencyParts } = useI18n();
  const { colors } = useTheme();
  const router = useRouter();
  // Natural width of each segment's content, measured off-screen: Yoga has no
  // `min-width: fit-content`, which is what keeps a thin segment readable.
  const [fitWidths, setFitWidths] = useState<Record<string, number>>({});
  const formatMoney = (value: number) => formatCurrency(value);
  const waterfall = computeWaterfall(data);
  const amountSign = data.amount < 0 ? '−' : '';
  const heroAmount = splitCurrencyParts(Math.abs(data.amount));
  // Zero-amount segments are dropped entirely so they don't render as a
  // padded sliver in the bar.
  const segments = [
    {
      key: 'spending',
      color: palette.coral500,
      label: messages.balancePage.spending,
      href: '/expenses' as Href | undefined,
      amount: data.spending,
      pct: waterfall.pSpend,
    },
    {
      key: 'goals',
      color: palette.plum500,
      label: messages.balancePage.goals,
      href: '/goals' as Href | undefined,
      amount: data.goals,
      pct: waterfall.pGoals,
    },
    {
      key: 'free',
      color: palette.sage500,
      label: messages.common.free,
      href: undefined,
      amount: waterfall.left,
      pct: waterfall.pLeft,
    },
  ].filter((segment) => segment.amount > 0);
  const segmentWidths = getReadableSegmentWidths(segments.map((segment) => segment.pct));

  return (
    <Card style={{ marginBottom: 24 }}>
      <Text font="sansMedium" size="xs" color="ink3" uppercase tracking={1.2}>
        {data.eyebrow}
      </Text>
      <Text font="display" size="5xl" tight style={{ marginTop: 10 }}>
        {amountSign}
        {heroAmount.whole}
        <Text font="display" size="5xl" tight color="ink3">
          {heroAmount.decimal}
          {heroAmount.cents}
        </Text>
      </Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 }}>
        <Chip
          tone="positive"
          label={`${data.rate.toFixed(1)}% ${messages.balancePage.savingsRate}`}
          style={chipSize}
        />
        <Chip
          color={{ bg: colors.control, fg: colors.ink2 }}
          label={data.chips.delta}
          style={chipSize}
        />
        <Chip tone="accent" label={data.chips.context} style={chipSize} />
      </View>

      {/* The metas are the design's dashed-divider pair row. */}
      <Separator dashed style={{ marginTop: 32 }} />
      <View style={{ flexDirection: 'row', gap: 14, paddingTop: 16 }}>
        <HeroMeta meta={data.meta1} />
        <HeroMeta meta={data.meta2} />
      </View>

      <View style={{ marginTop: 16 }}>
        <View
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          style={{ position: 'absolute', flexDirection: 'row', opacity: 0, pointerEvents: 'none' }}>
          {segments.map((segment, index) => (
            <View
              key={segment.key}
              style={{ paddingHorizontal: SEGMENT_PADDING }}
              onLayout={(event) => {
                const width = Math.ceil(event.nativeEvent.layout.width);
                setFitWidths((current) =>
                  current[segment.key] === width ? current : { ...current, [segment.key]: width },
                );
              }}>
              <Segment
                label={segment.label}
                amount={formatMoney(segment.amount)}
                pct={segment.pct}
                compact={segmentWidths[index] < 30}
              />
            </View>
          ))}
        </View>

        {/* Mobile Balance flow bar: slim, tight radius, hairline gaps. The
            bordered track stays when there is nothing to plot. */}
        <View
          style={[
            {
              flexDirection: 'row',
              height: 52,
              gap: 2,
              borderRadius: radius.md,
              overflow: 'hidden',
            },
            segments.length === 0 && {
              borderWidth: 1,
              borderColor: colors.line,
              backgroundColor: colors.surface2,
            },
          ]}>
          {segments.map((segment, index) => {
            const { href } = segment;
            return (
              <WaterfallSegment
                key={segment.key}
                color={segment.color}
                label={segment.label}
                amount={formatMoney(segment.amount)}
                pct={segment.pct}
                widthPct={segmentWidths[index]}
                minWidth={fitWidths[segment.key]}
                onPress={href ? () => router.push(href) : undefined}
              />
            );
          })}
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
          <Text font="mono" size="xs" color="ink3">
            {formatMoney(0)}
          </Text>
          <Text font="mono" size="xs" color="ink3">
            {formatMoney(data.income)}
          </Text>
        </View>
      </View>
    </Card>
  );
}

/** `h-6 px-2.5`: the hero's chips are a step smaller than the default. */
const chipSize: ViewStyle = { height: 24, paddingHorizontal: 10 };

function getReadableSegmentWidths(values: number[]) {
  const minVisiblePct = 10;
  const positiveIndexes = values
    .map((value, index) => ({ value, index }))
    .filter(({ value }) => value > 0);

  if (positiveIndexes.length === 0) return values;
  if (positiveIndexes.length * minVisiblePct >= 100) {
    return values.map((value) => (value > 0 ? 100 / positiveIndexes.length : 0));
  }

  const widths = [...values];
  const locked = new Set<number>();

  positiveIndexes.forEach(({ value, index }) => {
    if (value < minVisiblePct) {
      widths[index] = minVisiblePct;
      locked.add(index);
    }
  });

  const lockedTotal = [...locked].reduce((sum, index) => sum + widths[index], 0);
  const remainingWidth = Math.max(100 - lockedTotal, 0);
  const flexible = positiveIndexes.filter(({ index }) => !locked.has(index));
  const flexibleTotal = flexible.reduce((sum, { value }) => sum + value, 0);

  flexible.forEach(({ value, index }) => {
    widths[index] = flexibleTotal > 0 ? (value / flexibleTotal) * remainingWidth : 0;
  });

  return widths;
}

function HeroMeta({ meta }: { meta: BalanceMeta }) {
  return (
    <View style={{ flex: 1, gap: 6 }}>
      <Text font="sansMedium" size="2xs" color="ink3" uppercase tracking={1}>
        {meta.label}
      </Text>
      <Text font="mono" size="sm" tight>
        {meta.value}
      </Text>
      <Text size="xs" color="ink3">
        {meta.sub}
      </Text>
    </View>
  );
}

type SegmentProps = {
  label: string;
  amount: string;
  pct: number;
  /** Narrow segments drop the % so the amount stays readable. */
  compact?: boolean;
};

function Segment({ label, amount, pct, compact }: SegmentProps) {
  return (
    <>
      <Text
        font="sansMedium"
        size="2xs"
        color={onSegment}
        uppercase
        tracking={0.5}
        numberOfLines={1}
        style={{ opacity: 0.8 }}>
        {label}
      </Text>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8, marginTop: 2 }}>
        <Text font="display" size="base" color={onSegment} numberOfLines={1}>
          {amount}
        </Text>
        {compact ? null : (
          <Text size="xs" color={onSegmentMuted} numberOfLines={1}>
            {pct.toFixed(1)}%
          </Text>
        )}
      </View>
    </>
  );
}

type WaterfallSegmentProps = Omit<SegmentProps, 'compact'> & {
  color: string;
  minWidth: number | undefined;
  onPress?: () => void;
  widthPct: number;
};

function WaterfallSegment({
  color,
  label,
  amount,
  minWidth,
  onPress,
  pct,
  widthPct,
}: WaterfallSegmentProps) {
  // Grow ratios (not fixed % bases) so the bar's gaps never push the last
  // segment past the container and get it cropped.
  const style: ViewStyle = {
    flexGrow: widthPct,
    flexBasis: 0,
    minWidth,
    justifyContent: 'center',
    paddingHorizontal: SEGMENT_PADDING,
    backgroundColor: color,
  };
  const content = <Segment label={label} amount={amount} pct={pct} compact={widthPct < 30} />;

  if (onPress) {
    return (
      <Pressable
        accessibilityRole="link"
        accessibilityLabel={`${label} ${amount}`}
        onPress={onPress}
        style={({ pressed }) => [style, { opacity: pressed ? 0.85 : 1 }]}>
        {content}
      </Pressable>
    );
  }

  return <View style={style}>{content}</View>;
}
