import { LinearGradient } from 'expo-linear-gradient';
import { useRef } from 'react';
import { Pressable, ScrollView, View } from 'react-native';

import type { PeriodTrendPoint } from '@/components/finance/period-trend-card';
import { Text } from '@/components/ui/text';
import { useI18n } from '@/lib/i18n/provider';
import { useTheme } from '@/theme/theme-provider';
import { radius, shadows } from '@/theme/tokens';
import { resolveColor } from '@/theme/tones';

type PeriodTrendChartProps = {
  accentColor?: string;
  clickable: boolean;
  gradientId?: string;
  gradientStops: [string, string];
  hasOverlay?: boolean;
  isInverted?: boolean;
  onSelectMonth: (point?: PeriodTrendPoint) => void;
  selectedIndex: number;
  trend: PeriodTrendPoint[];
};

/** Height of the row (`h-32`) and of what is left for a bar between its labels. */
const ROW_HEIGHT = 128;
const LABEL_HEIGHT = 14;
const LABEL_GAP = 6;
const BAR_AREA = ROW_HEIGHT - 2 * (LABEL_HEIGHT + LABEL_GAP);
const BAR_WIDTH = 32;

/**
 * The bars of `PeriodTrendCard`: one column per month, the active month
 * highlighted (design `.trend`). This is the web card's phone presentation;
 * its recharts variant for wider screens is not ported, so the props that
 * only that one reads (`accentColor`, `gradientId`, `hasOverlay`,
 * `isInverted`) are accepted and ignored.
 */
export function PeriodTrendChart({
  clickable,
  gradientStops,
  onSelectMonth,
  selectedIndex,
  trend,
}: PeriodTrendChartProps) {
  const { formatCurrency } = useI18n();
  const { colors } = useTheme();
  const scrollRef = useRef<ScrollView>(null);
  const activeIndex = selectedIndex >= 0 ? selectedIndex : trend.length - 1;
  const maxSpending = Math.max(...trend.map((point) => point.spending), 0);
  // Columns have to hold their own value label. The face is monospaced at
  // `2xs`, so the widest label's character count sizes the column.
  const longestValue = trend.reduce(
    (longest, point) =>
      point.spending > 0 ? Math.max(longest, formatCurrency(point.spending).length) : longest,
    0,
  );
  const minColumn = Math.max(44, Math.round(longestValue * 6.2) + 10);
  const stops: [string, string] = [
    resolveColor(gradientStops[0], colors),
    resolveColor(gradientStops[1], colors),
  ];

  return (
    // Columns are floored at the widest value label so no two labels collide;
    // the row scrolls only when those minimums outgrow the card, and starts
    // at the most recent month.
    <ScrollView
      ref={scrollRef}
      horizontal
      showsHorizontalScrollIndicator={false}
      onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}
      style={{ marginHorizontal: -4 }}
      contentContainerStyle={{
        flexGrow: 1,
        gap: 10,
        height: ROW_HEIGHT,
        paddingHorizontal: 4,
      }}>
      {trend.map((point, index) => {
        const isCurrent = index === activeIndex;
        const isMuted = selectedIndex >= 0 && !isCurrent;
        const share = maxSpending > 0 ? Math.max(point.spending, 0) / maxSpending : 0;
        const height = Math.max(share * BAR_AREA, 4);
        const labelFont = isCurrent ? 'monoSemiBold' : 'mono';
        const labelColor = isCurrent ? 'ink1' : 'ink3';

        return (
          <Pressable
            key={point.month}
            accessibilityRole="button"
            accessibilityLabel={point.month}
            accessibilityState={{ selected: selectedIndex === index }}
            disabled={!clickable || !point.monthStart}
            onPress={() => onSelectMonth(point)}
            style={{
              flexGrow: 1,
              flexBasis: minColumn,
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: LABEL_GAP,
            }}>
            {point.spending > 0 ? (
              <Text font={labelFont} size="2xs" color={labelColor} numberOfLines={1}>
                {formatCurrency(point.spending)}
              </Text>
            ) : null}
            {isMuted ? (
              <View
                style={{
                  width: BAR_WIDTH,
                  height,
                  borderRadius: radius.bar,
                  backgroundColor: colors.surface2,
                }}
              />
            ) : (
              <View
                style={{
                  borderRadius: radius.bar,
                  boxShadow: isCurrent ? shadows.md : undefined,
                }}>
                <LinearGradient
                  colors={stops}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{ width: BAR_WIDTH, height, borderRadius: radius.bar }}
                />
              </View>
            )}
            <Text font={labelFont} size="2xs" color={labelColor} numberOfLines={1}>
              {point.month}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
