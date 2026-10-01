import { useRouter } from 'expo-router';
import { View } from 'react-native';

import { CardNoData } from '@/components/card-no-data';
import { SectionHeader, SectionLink } from '@/components/dashboard/section-header';
import { AddGoalButton } from '@/components/goals/add-goal-button';
import { Card } from '@/components/ui/card';
import { ProgressBar } from '@/components/ui/progress-bar';
import { Text } from '@/components/ui/text';
import type { DashboardGoal } from '@/lib/dashboard/dashboard-queries';
import { useI18n } from '@/lib/i18n/provider';
import { useTheme } from '@/theme/theme-provider';

export function GoalsCard({ goals }: { goals: DashboardGoal[] }) {
  const { messages } = useI18n();
  const { colors } = useTheme();
  const router = useRouter();
  const hasGoals = goals.length > 0;

  return (
    <View>
      <SectionHeader
        title={messages.common.goals}
        action={
          // Nothing to look at yet, so the action becomes "add a goal" instead
          // of a link into an equally empty page.
          hasGoals ? (
            <SectionLink
              label={messages.dashboard.seeGoals}
              onPress={() => router.navigate('/goals')}
            />
          ) : (
            <AddGoalButton />
          )
        }
      />

      <Card style={{ gap: 20 }}>
        {hasGoals ? (
          goals.map((goal) => (
            <View key={goal.name}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'baseline',
                  justifyContent: 'space-between',
                  gap: 16,
                }}>
                <Text
                  font="display"
                  size="xl"
                  tracking={0.5}
                  numberOfLines={1}
                  style={{ flexShrink: 1 }}>
                  {goal.name}
                </Text>
                <Text
                  font="display"
                  size="xl"
                  color="ink2"
                  style={{ fontVariant: ['tabular-nums'] }}>
                  {goal.progress}%
                </Text>
              </View>
              <ProgressBar
                value={goal.progress / 100}
                style={{ marginTop: 6, backgroundColor: colors.surface2 }}
              />
              <Text font="mono" size="xs" color="ink3" style={{ marginTop: 8 }}>
                {goal.saved} / {goal.target} · {goal.date}
              </Text>
            </View>
          ))
        ) : (
          <CardNoData body={messages.dashboard.emptyGoals} />
        )}
      </Card>
    </View>
  );
}
