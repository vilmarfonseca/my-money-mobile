import { View } from 'react-native';

import { Text } from '@/components/ui/text';
import { useTheme } from '@/theme/theme-provider';
import { radius } from '@/theme/tokens';

type GoalChipProps = {
  children: string;
  tone?: 'accent' | 'neutral' | 'positive' | 'warm';
};

/** Goal status pill; the neutral tone keeps the web chip's hairline border. */
export function GoalChip({ children, tone = 'neutral' }: GoalChipProps) {
  const { colors } = useTheme();
  const palette = {
    neutral: { bg: colors.surface2, border: colors.line, fg: colors.ink2 },
    accent: { bg: colors.accentSoft, border: 'transparent', fg: colors.accentSoftFg },
    positive: { bg: colors.positiveSoft, border: 'transparent', fg: colors.positiveFg },
    warm: { bg: colors.warmSoft, border: 'transparent', fg: colors.warmSoftFg },
  }[tone];

  return (
    <View
      style={{
        alignSelf: 'flex-start',
        height: 28,
        justifyContent: 'center',
        paddingHorizontal: 12,
        borderRadius: radius.pill,
        borderWidth: 1,
        borderColor: palette.border,
        backgroundColor: palette.bg,
      }}>
      <Text font="sansMedium" size="xs" color={palette.fg} numberOfLines={1}>
        {children}
      </Text>
    </View>
  );
}
