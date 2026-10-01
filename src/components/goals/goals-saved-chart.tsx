import { View } from 'react-native';

import { GoalsSavedDonut, type GoalsSavedSlice } from '@/components/goals/goals-saved-donut';
import { Text } from '@/components/ui/text';
import type { Goal } from '@/lib/goals/goals-data';
import type { GoalOverview } from '@/lib/goals/goals-queries';
import { useI18n } from '@/lib/i18n/provider';
import { useTheme } from '@/theme/theme-provider';
import { resolveColor } from '@/theme/tones';

const goalChartColors = [
  'var(--ds-accent)',
  'var(--warm)',
  'var(--positive)',
  'var(--warning)',
  'var(--color-plum-300)',
  'var(--color-coral-300)',
  'var(--color-sage-300)',
  'var(--color-clay-500)',
  'var(--color-plum-700)',
  'var(--color-coral-600)',
] as const;

// The phone ring: a 128px box with a thick 44-64 band.
const SIZE = 128;
const INNER_RADIUS = 44;
const OUTER_RADIUS = 64;

/**
 * The web's `DonutCenterLabel` sizing: the figure shrinks with its length so
 * it always fits the hole (70% of the box, of which 94% is usable; a display
 * glyph is about half its size wide).
 */
function centerFontSize(text: string) {
  const size = (SIZE * ((70 * 0.94) / Math.max(text.length, 1) / 0.5)) / 100;
  return Math.min(Math.max(size, 12), 64);
}

export function GoalsSavedChart({ goals, overview }: { goals: Goal[]; overview: GoalOverview }) {
  const { messages, splitCurrencyParts } = useI18n();
  const { colors } = useTheme();
  const saved = splitCurrencyParts(overview.totalSaved);
  const chartData: GoalsSavedSlice[] = [
    ...goals.map((goal, index) => ({
      key: `goal-${index + 1}`,
      label: goal.name,
      color: resolveColor(goalChartColors[index % goalChartColors.length], colors),
      value: goal.saved,
    })),
    {
      key: 'remaining',
      label: messages.goals.remaining,
      color: colors.surface2,
      value: Math.max(0, overview.combinedTarget - overview.totalSaved),
    },
  ];
  const fontSize = centerFontSize(`${saved.whole}${saved.decimal}${saved.cents}`);

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
      <View style={{ width: SIZE, height: SIZE }}>
        <GoalsSavedDonut
          chartData={chartData}
          emptyColor={colors.surface2}
          innerRadius={INNER_RADIUS}
          outerRadius={OUTER_RADIUS}
          size={SIZE}
        />
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            bottom: 0,
            left: 0,
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          <Text font="display" size={fontSize} tight tracking={-fontSize * 0.025} numberOfLines={1}>
            {saved.whole}
            <Text font="display" size={fontSize} tight color="ink3" tracking={-fontSize * 0.025}>
              {saved.decimal}
              {saved.cents}
            </Text>
          </Text>
          <Text
            font="sansMedium"
            size={8}
            color="ink3"
            uppercase
            tracking={0.8}
            style={{ marginTop: 2 }}>
            {messages.goals.saved}
          </Text>
        </View>
      </View>

      {/* The Mobile Goals legend shows names only. */}
      <View style={{ flex: 1, gap: 10 }}>
        {chartData.map((item) => (
          <View key={item.key} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View
              style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: item.color }}
            />
            <Text size="sm" color="ink2" numberOfLines={1} style={{ flex: 1 }}>
              {item.label}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}
