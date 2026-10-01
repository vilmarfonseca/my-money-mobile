import { Check, CircleCheck, Plus } from 'lucide-react-native';
import { View } from 'react-native';

import { goalToneColors } from '@/components/goals/goal-tone';
import { GoalsNoData } from '@/components/goals/goals-no-data';
import { Card } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import type { GoalActivity } from '@/lib/goals/goals-data';
import { useI18n } from '@/lib/i18n/provider';
import { useTheme } from '@/theme/theme-provider';

export function ActivityTimeline({ activities }: { activities: GoalActivity[] }) {
  const { messages } = useI18n();

  return (
    <View>
      {/* The section header floats above its own card. */}
      <Text font="display" size="2xl" tight style={{ marginBottom: 12, paddingHorizontal: 6 }}>
        {messages.goals.recentActivity}
      </Text>
      <Card padding={0} style={{ paddingHorizontal: 8, paddingVertical: 6 }}>
        {activities.length === 0 ? (
          <GoalsNoData style={{ borderWidth: 0 }} />
        ) : (
          activities.map((activity, index) => (
            <ActivityItem
              // Two identical contributions can land on the same day.
              key={`${activity.kind}-${activity.goal}-${activity.meta}-${activity.amount}-${index}`}
              activity={activity}
              first={index === 0}
            />
          ))
        )}
      </Card>
    </View>
  );
}

function ActivityItem({ activity, first }: { activity: GoalActivity; first: boolean }) {
  const { colors } = useTheme();
  // Mobile Goals renders contributions as neutral circles with a positive
  // plus icon.
  const tone =
    activity.kind === 'added'
      ? { bg: colors.surface2, fg: colors.positiveFg }
      : goalToneColors(activity.tone, colors);

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
          width: 34,
          height: 34,
          borderRadius: 17,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: tone.bg,
        }}>
        <ActivityIcon kind={activity.kind} color={tone.fg} />
      </View>
      <View style={{ flex: 1 }}>
        <Text font="sansMedium" size="sm" color={activity.kind === 'completed' ? 'ink2' : 'ink1'}>
          {activity.title}{' '}
          <Text font="sansMedium" size="sm" color="accentSoftFg">
            {activity.goal}
          </Text>
        </Text>
        <Text font="mono" size="xs" color="ink3" style={{ marginTop: 4 }}>
          {activity.meta}
        </Text>
      </View>
      <Text font="monoMedium" size="sm" color={activity.kind === 'added' ? 'positiveFg' : 'ink3'}>
        {activity.amount}
      </Text>
    </View>
  );
}

function ActivityIcon({ color, kind }: { color: string; kind: GoalActivity['kind'] }) {
  if (kind === 'milestone' || kind === 'completed') {
    return <Check size={16} color={color} />;
  }

  if (kind === 'created') {
    return <CircleCheck size={16} color={color} />;
  }

  return <Plus size={16} color={color} />;
}
