import { Laptop, Plane, Settings, ShieldCheck, type LucideIcon } from 'lucide-react-native';
import { useState } from 'react';
import { View } from 'react-native';

import { AddGoalButton } from '@/components/goals/add-goal-button';
import { GoalChip } from '@/components/goals/goal-chip';
import { goalToneColors } from '@/components/goals/goal-tone';
import { GoalsNoData } from '@/components/goals/goals-no-data';
import { ManageGoalModal } from '@/components/goals/manage-goal-modal';
import { IconButton } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import type { Goal, GoalIcon } from '@/lib/goals/goals-data';
import { useI18n } from '@/lib/i18n/provider';
import { useTheme } from '@/theme/theme-provider';
import { radius } from '@/theme/tokens';

const iconMap = {
  laptop: Laptop,
  reserve: ShieldCheck,
  travel: Plane,
} satisfies Record<GoalIcon, LucideIcon>;

export function ActiveGoals({
  goals,
  onAddGoal,
}: {
  goals: Goal[];
  /** Opens the page's new-goal sheet; without it the button opens its own. */
  onAddGoal?: () => void;
}) {
  const { formatCurrency, messages } = useI18n();
  const { colors } = useTheme();
  const totalSaved = goals.reduce((sum, goal) => sum + goal.saved, 0);
  // The id outlives the open flag so the sheet keeps its goal while it slides
  // away.
  const [managedGoalId, setManagedGoalId] = useState<string | null>(null);
  const [manageOpen, setManageOpen] = useState(false);
  const managedGoal = goals.find((goal) => goal.id === managedGoalId) ?? null;

  return (
    <View style={{ marginTop: 16 }}>
      {/* The heading floats above the list card. */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
          marginBottom: 12,
          paddingHorizontal: 6,
        }}>
        <Text font="display" size="2xl" tight style={{ flexShrink: 1 }}>
          {messages.goals.active}
        </Text>
        <AddGoalButton onPress={onAddGoal} />
      </View>

      {goals.length === 0 ? (
        <GoalsNoData style={{ borderRadius: radius.xl, backgroundColor: colors.glassBg }} />
      ) : (
        <Card padding={0} style={{ paddingHorizontal: 8, paddingVertical: 6 }}>
          <View style={{ paddingHorizontal: 8, paddingTop: 8, paddingBottom: 4 }}>
            <Text font="sansMedium" size="sm">
              {messages.goals.activeSummary(goals.length, formatCurrency(totalSaved))}
            </Text>
          </View>
          {goals.map((goal, index) => (
            <MobileGoalRow
              key={goal.id ?? goal.name}
              first={index === 0}
              goal={goal}
              onManage={() => {
                setManagedGoalId(goal.id ?? null);
                setManageOpen(goal.id !== undefined);
              }}
            />
          ))}
        </Card>
      )}

      <ManageGoalModal
        goal={managedGoal}
        open={manageOpen && managedGoal !== null}
        onOpenChange={setManageOpen}
      />
    </View>
  );
}

function MobileGoalRow({
  first,
  goal,
  onManage,
}: {
  first: boolean;
  goal: Goal;
  onManage: () => void;
}) {
  const { formatCurrency, messages } = useI18n();
  const { colors } = useTheme();
  const Icon = iconMap[goal.icon];
  const tone = goalToneColors(goal.tone, colors);

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingHorizontal: 8,
        paddingVertical: 14,
        borderTopWidth: first ? 0 : 1,
        borderTopColor: colors.line,
      }}>
      <View
        style={{
          width: 44,
          height: 44,
          borderRadius: radius.md,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: tone.bg,
        }}>
        <Icon size={20} color={tone.fg} />
      </View>
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
          <Text font="display" size="lg" tight style={{ flexShrink: 1 }}>
            {goal.name}
          </Text>
          <GoalChip tone={goal.paceTone === 'warm' ? 'warm' : 'positive'}>
            {getPaceSummary(goal, messages)}
          </GoalChip>
        </View>
        <Text font="mono" size="xs" color="ink3" style={{ marginTop: 6 }}>
          {formatCurrency(goal.monthlyContribution)}
          {messages.goals.monthlySuffix} · {messages.goals.target} {goal.targetDate}
        </Text>
      </View>
      <IconButton
        accessibilityLabel={messages.goals.manageGoal(goal.name)}
        variant="outline"
        size={32}
        icon={({ color }) => <Settings size={16} color={color} />}
        onPress={onManage}
      />
    </View>
  );
}

function getPaceSummary(goal: Goal, messages: ReturnType<typeof useI18n>['messages']) {
  if (goal.paceTone === 'warm') {
    return messages.goals.paceBehind(2);
  }

  if (goal.pace.includes('ahead')) {
    return messages.goals.paceAhead(4);
  }

  return messages.goals.onPace;
}
