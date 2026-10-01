import { View } from 'react-native';
import Svg, { Line } from 'react-native-svg';

import { GoalChip } from '@/components/goals/goal-chip';
import { GoalsNoData } from '@/components/goals/goals-no-data';
import { GoalsSavedChart } from '@/components/goals/goals-saved-chart';
import { Card } from '@/components/ui/card';
import { ProgressBar } from '@/components/ui/progress-bar';
import { Text } from '@/components/ui/text';
import type { Goal } from '@/lib/goals/goals-data';
import type { GoalOverview, MonthlySavingsPoint } from '@/lib/goals/goals-queries';
import { useI18n } from '@/lib/i18n/provider';
import { useTheme } from '@/theme/theme-provider';

export function SavingsOverview({
  activeGoals,
  monthlySavingsTrend,
  overview,
}: {
  activeGoals: Goal[];
  monthlySavingsTrend: MonthlySavingsPoint[];
  overview: GoalOverview;
}) {
  const { formatCurrency, messages } = useI18n();
  const { colors } = useTheme();
  const needsAttentionCount = activeGoals.filter((goal) => goal.paceTone === 'warm').length;
  const onPaceCount = activeGoals.length - needsAttentionCount;
  const savedPercent =
    overview.combinedTarget > 0
      ? Math.min((overview.totalSaved / overview.combinedTarget) * 100, 100)
      : 0;

  return (
    <View style={{ gap: 16, marginBottom: 20 }}>
      <Card>
        <Text font="sansMedium" size="2xs" color="ink3" uppercase tracking={1}>
          {messages.goals.savingNow}
        </Text>
        {activeGoals.length === 0 ? (
          <GoalsNoData style={{ marginTop: 16 }} />
        ) : (
          <>
            <View style={{ gap: 12, marginTop: 8 }}>
              <Text font="display" size="5xl" tight numberOfLines={1} adjustsFontSizeToFit>
                {formatCurrency(overview.monthlySavings)}
                <Text font="display" size="xl" color="ink3">
                  {messages.goals.monthlySuffix}
                </Text>
              </Text>
              <Text size="sm" color="ink2">
                {messages.goals.overviewSummary(activeGoals.length, overview.finishNote)}
              </Text>
            </View>

            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 16 }}>
              <GoalChip>{messages.goals.ofIncome(overview.savingsRate)}</GoalChip>
              {onPaceCount > 0 ? (
                <GoalChip tone="positive">{messages.goals.onPaceSummary(onPaceCount)}</GoalChip>
              ) : null}
              {needsAttentionCount > 0 ? (
                <GoalChip tone="warm">
                  {messages.goals.attentionSummary(needsAttentionCount)}
                </GoalChip>
              ) : null}
            </View>

            {/* Phones swap the area chart for the design's slim progress track. */}
            <View style={{ marginTop: 16 }}>
              <ProgressBar
                height={10}
                value={savedPercent / 100}
                style={{ backgroundColor: colors.surface2 }}
              />
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  marginTop: 6,
                  paddingHorizontal: 2,
                }}>
                {monthlySavingsTrend.map((point) => (
                  <Text key={point.month} font="mono" size="2xs" color="ink4">
                    {point.month}
                  </Text>
                ))}
              </View>
            </View>
          </>
        )}
      </Card>

      {/* The section header floats above its own card. */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          gap: 16,
          marginTop: 4,
          paddingHorizontal: 6,
        }}>
        <Text font="display" size="2xl" tight style={{ flexShrink: 1 }}>
          {messages.goals.totalSavedAcrossGoals}
        </Text>
        <Text font="mono" size="xs" color="ink3">
          {monthlySavingsTrend.at(-1)?.month}
        </Text>
      </View>
      <Card>
        {activeGoals.length === 0 ? (
          <GoalsNoData />
        ) : (
          <>
            <GoalsSavedChart goals={activeGoals} overview={overview} />
            {/* A dashed top rule: RN only dashes a full border, so draw it. */}
            <Svg height={1} width="100%" style={{ marginTop: 12 }}>
              <Line
                x1="0"
                y1="0.5"
                x2="100%"
                y2="0.5"
                stroke={colors.lineStrong}
                strokeWidth={1}
                strokeDasharray="4 3"
              />
            </Svg>
            <View style={{ flexDirection: 'row', gap: 16, paddingTop: 12 }}>
              <Text font="mono" size="xs" color="ink3" style={{ flex: 1 }}>
                {messages.goals.totalTarget(
                  formatCurrency(overview.totalSaved),
                  formatCurrency(overview.combinedTarget),
                )}
              </Text>
              <Text font="mono" size="xs" color="ink3" style={{ flex: 1 }}>
                {messages.goals.nextGoal}: {activeGoals[0]?.name ?? messages.goals.addGoal} ·{' '}
                {overview.nextMilestone}
              </Text>
            </View>
          </>
        )}
      </Card>
    </View>
  );
}
