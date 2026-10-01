import { Check, Gift, Goal, House, Plane, type LucideIcon } from 'lucide-react-native';
import { View } from 'react-native';

import { GoalsNoData } from '@/components/goals/goals-no-data';
import { Card } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import type { CompletedGoal } from '@/lib/goals/goals-data';
import { useI18n } from '@/lib/i18n/provider';
import { useTheme } from '@/theme/theme-provider';
import { radius } from '@/theme/tokens';

const iconMap = {
  gift: Gift,
  home: House,
  run: Goal,
  travel: Plane,
} satisfies Record<CompletedGoal['icon'], LucideIcon>;

export function CompletedGoalsTable({ goals }: { goals: CompletedGoal[] }) {
  const { formatCurrency, messages } = useI18n();
  const { colors } = useTheme();
  const totalSaved = goals.reduce((sum, goal) => sum + goal.amount, 0);

  return (
    <View style={{ marginTop: 16 }}>
      {/* The heading floats above the list card. */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          gap: 16,
          marginBottom: 12,
          paddingHorizontal: 6,
        }}>
        <Text font="display" size="2xl" tight>
          {messages.goals.completed}
        </Text>
        <Text font="mono" size="xs" color="ink3" style={{ flexShrink: 1 }}>
          {messages.goals.completedSummary(goals.length, formatCurrency(totalSaved))}
        </Text>
      </View>

      {goals.length === 0 ? (
        <GoalsNoData style={{ borderRadius: radius.xl, backgroundColor: colors.glassBg }} />
      ) : (
        <Card padding={0} style={{ paddingHorizontal: 8, paddingVertical: 6 }}>
          {goals.map((goal, index) => (
            <MobileCompletedRow key={`${goal.name}-${index}`} first={index === 0} goal={goal} />
          ))}
        </Card>
      )}
    </View>
  );
}

function MobileCompletedRow({ first, goal }: { first: boolean; goal: CompletedGoal }) {
  const { colors } = useTheme();
  const Icon = iconMap[goal.icon];

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingHorizontal: 8,
        paddingVertical: 12,
        borderTopWidth: first ? 0 : 1,
        borderTopColor: colors.line,
      }}>
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: radius.sm,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.surface2,
        }}>
        <Icon size={18} color={colors.ink2} />
      </View>
      <View style={{ flex: 1 }}>
        <Text font="display" size="lg" tight numberOfLines={1}>
          {goal.name}
        </Text>
        <Text size="xs" color="ink3" style={{ marginTop: 4 }}>
          {goal.note}
        </Text>
      </View>
      <View
        style={{
          width: 24,
          height: 24,
          borderRadius: 12,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.positiveSoft,
        }}>
        <Check size={14} color={colors.positiveFg} />
      </View>
    </View>
  );
}
