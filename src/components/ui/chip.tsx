import type { ReactNode } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';

import { Text } from '@/components/ui/text';
import { useTheme } from '@/theme/theme-provider';
import { radius, type ThemeColors } from '@/theme/tokens';

export type ChipTone = 'positive' | 'negative' | 'warm' | 'accent' | 'warning' | 'neutral' | 'outline';

export function chipColors(tone: ChipTone, colors: ThemeColors) {
  return {
    positive: { bg: colors.positiveSoft, fg: colors.positiveFg, border: 'transparent' },
    negative: { bg: colors.negativeSoft, fg: colors.negativeFg, border: 'transparent' },
    warm: { bg: colors.warmSoft, fg: colors.warmSoftFg, border: 'transparent' },
    accent: { bg: colors.accentSoft, fg: colors.accentSoftFg, border: 'transparent' },
    warning: { bg: colors.warningSoft, fg: colors.warningFg, border: 'transparent' },
    neutral: { bg: colors.surface2, fg: colors.ink2, border: 'transparent' },
    outline: { bg: colors.control, fg: colors.ink2, border: colors.controlBorder },
  }[tone];
}

type ChipProps = {
  children?: ReactNode;
  label?: string;
  tone?: ChipTone;
  /** `sm` is the table pill (22px); `md` the hero-card chip (28px). */
  size?: 'sm' | 'md';
  /** Leading status dot in the chip's foreground colour. */
  dot?: boolean;
  /** Overrides the tone with a custom colour pair (user-picked category colours). */
  color?: { bg: string; fg: string };
  style?: StyleProp<ViewStyle>;
};

/** Status pill (`.chip.pos`, `.chip.neg`, ... in the design system). */
export function Chip({ children, color, dot, label, size = 'md', style, tone = 'neutral' }: ChipProps) {
  const { colors } = useTheme();
  const palette = color ? { ...color, border: 'transparent' } : chipColors(tone, colors);

  return (
    <View
      style={[
        {
          alignSelf: 'flex-start',
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          height: size === 'sm' ? 22 : 28,
          paddingHorizontal: size === 'sm' ? 8 : 12,
          borderRadius: radius.pill,
          borderWidth: 1,
          borderColor: palette.border,
          backgroundColor: palette.bg,
        },
        style,
      ]}>
      {dot ? (
        <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: palette.fg }} />
      ) : null}
      {label ? (
        <Text font="sansMedium" size={size === 'sm' ? '2xs' : 'xs'} color={palette.fg} numberOfLines={1}>
          {label}
        </Text>
      ) : (
        children
      )}
    </View>
  );
}
