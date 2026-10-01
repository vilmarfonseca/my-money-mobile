import { View } from 'react-native';

import { Text } from '@/components/ui/text';
import type { DueStatus } from '@/lib/calendar/types';
import { useI18n } from '@/lib/i18n/provider';
import { useTheme } from '@/theme/theme-provider';
import { radius } from '@/theme/tokens';

export function StatusBadge({ status }: { status: DueStatus }) {
  const { messages } = useI18n();
  const { colors } = useTheme();
  const statusLabels: Record<DueStatus, string> = messages.calendar.statuses;
  const tone = {
    review: { bg: colors.accentSoft, fg: colors.accentSoftFg },
    autopay: { bg: colors.positiveSoft, fg: colors.positiveFg },
    scheduled: { bg: colors.surface2, fg: colors.ink2 },
    paid: { bg: colors.control, fg: colors.ink3 },
    overdue: { bg: colors.negativeSoft, fg: colors.negativeFg },
  }[status];

  return (
    <View
      style={{
        height: 24,
        justifyContent: 'center',
        paddingHorizontal: 10,
        borderRadius: radius.pill,
        backgroundColor: tone.bg,
      }}>
      <Text font="sansMedium" size="xs" color={tone.fg} numberOfLines={1}>
        {statusLabels[status]}
      </Text>
    </View>
  );
}
