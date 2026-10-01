import type { ReactNode } from 'react';
import { View, type StyleProp, type ViewProps, type ViewStyle } from 'react-native';

import { useTheme } from '@/theme/theme-provider';
import { radius, shadows } from '@/theme/tokens';

type CardProps = ViewProps & {
  children?: ReactNode;
  /**
   * `glass`: the translucent primary surface (`.glass rounded-xl`).
   * `solid`: opaque bordered surface (`border border-line bg-surface-1`).
   * `soft`: inset tile on top of another card (`bg-surface-2`).
   * `control`: faint bordered tile (`border border-line bg-control`).
   */
  variant?: 'glass' | 'solid' | 'soft' | 'control';
  /** Inner padding in px. Web cards use 24 (20 on phones). */
  padding?: number;
  /** Corner radius in px; defaults per variant. */
  rounded?: number;
  style?: StyleProp<ViewStyle>;
};

export function Card({
  children,
  padding = 20,
  rounded,
  style,
  variant = 'glass',
  ...props
}: CardProps) {
  const { colors, scheme } = useTheme();

  const surface: ViewStyle =
    variant === 'glass'
      ? {
          backgroundColor: colors.glassBg,
          borderColor: colors.glassBorder,
          borderWidth: 1,
          borderRadius: rounded ?? radius.xl,
          boxShadow: scheme === 'dark' ? shadows.glassDark : shadows.glass,
        }
      : variant === 'solid'
        ? {
            backgroundColor: colors.surface1,
            borderColor: colors.line,
            borderWidth: 1,
            borderRadius: rounded ?? radius.lg,
            boxShadow: shadows.sm,
          }
        : variant === 'soft'
          ? { backgroundColor: colors.surface2, borderRadius: rounded ?? radius.md }
          : {
              backgroundColor: colors.control,
              borderColor: colors.line,
              borderWidth: 1,
              borderRadius: rounded ?? radius.lg,
            };

  return (
    <View {...props} style={[surface, { padding }, style]}>
      {children}
    </View>
  );
}
