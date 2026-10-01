import type { ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { Text } from '@/components/ui/text';
import { useTheme } from '@/theme/theme-provider';
import { radius, type FontSizeToken } from '@/theme/tokens';

export type ButtonVariant = 'default' | 'outline' | 'secondary' | 'ghost' | 'destructive' | 'link';
export type ButtonSize = 'sm' | 'md' | 'lg' | 'xl';

type IconRenderer = (props: { color: string; size: number }) => ReactNode;

export type ButtonProps = Omit<PressableProps, 'children' | 'style'> & {
  /** Button text. Use `children` instead for custom content. */
  label?: string;
  children?: ReactNode;
  variant?: ButtonVariant;
  /** Heights: sm 32, md 40 (the app default, `h-10`), lg 44, xl 48 (`h-12`). */
  size?: ButtonSize;
  /** `pill` is `rounded-full`; `rounded` is `rounded-xl` (wide mobile actions). */
  shape?: 'pill' | 'rounded';
  /** Lucide icon, rendered before the label in the button's text colour. */
  icon?: IconRenderer;
  iconRight?: IconRenderer;
  /** Swaps the icon for a spinner and blocks presses. */
  loading?: boolean;
  /** Stretch to the parent's width. */
  block?: boolean;
  style?: StyleProp<ViewStyle>;
};

const heights: Record<ButtonSize, number> = { sm: 32, md: 40, lg: 44, xl: 48 };
const paddings: Record<ButtonSize, number> = { sm: 12, md: 16, lg: 18, xl: 20 };
const textSizes: Record<ButtonSize, FontSizeToken> = { sm: 'xs', md: 'sm', lg: 'sm', xl: 'base' };
const iconSizes: Record<ButtonSize, number> = { sm: 14, md: 16, lg: 18, xl: 18 };

export function Button({
  block,
  children,
  disabled,
  icon,
  iconRight,
  label,
  loading,
  shape = 'pill',
  size = 'md',
  style,
  variant = 'default',
  ...props
}: ButtonProps) {
  const { colors } = useTheme();

  const tone = {
    default: { bg: colors.action, border: 'transparent', fg: colors.actionForeground },
    outline: { bg: colors.control, border: colors.controlBorder, fg: colors.ink1 },
    secondary: { bg: colors.surface2, border: 'transparent', fg: colors.ink1 },
    ghost: { bg: 'transparent', border: 'transparent', fg: colors.ink1 },
    destructive: { bg: colors.negativeSoft, border: 'transparent', fg: colors.negative },
    link: { bg: 'transparent', border: 'transparent', fg: colors.accent },
  }[variant];

  const inactive = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: Boolean(inactive), busy: Boolean(loading) }}
      disabled={inactive}
      {...props}
      style={({ pressed }) => [
        {
          height: heights[size],
          paddingHorizontal: paddings[size],
          borderRadius: shape === 'pill' ? radius.pill : radius.sm + 2,
          borderWidth: 1,
          borderColor: tone.border,
          backgroundColor: tone.bg,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
          opacity: disabled ? 0.5 : pressed ? 0.8 : 1,
          alignSelf: block ? 'stretch' : 'auto',
        },
        style,
      ]}>
      {loading ? (
        <ActivityIndicator size="small" color={tone.fg} />
      ) : (
        icon?.({ color: tone.fg, size: iconSizes[size] })
      )}
      {label ? (
        <Text font="sansMedium" size={textSizes[size]} color={tone.fg} numberOfLines={1}>
          {label}
        </Text>
      ) : (
        children
      )}
      {iconRight?.({ color: tone.fg, size: iconSizes[size] })}
    </Pressable>
  );
}

type IconButtonProps = Omit<PressableProps, 'children' | 'style'> & {
  icon: IconRenderer;
  /** Required: icon buttons have no visible text. */
  accessibilityLabel: string;
  /**
   * `surface`: white round control (page-header back button).
   * `action`: dark round control (page-header add button).
   * `ghost`: no chrome.
   */
  variant?: 'surface' | 'action' | 'ghost' | 'outline';
  /** Diameter in px. */
  size?: number;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
};

/** Round icon-only control (`grid size-10 place-items-center rounded-full`). */
export function IconButton({
  disabled,
  icon,
  loading,
  size = 40,
  style,
  variant = 'surface',
  ...props
}: IconButtonProps) {
  const { colors } = useTheme();
  const tone = {
    surface: { bg: colors.surface1, border: colors.line, fg: colors.ink2 },
    action: { bg: colors.action, border: 'transparent', fg: colors.actionForeground },
    ghost: { bg: 'transparent', border: 'transparent', fg: colors.ink2 },
    outline: { bg: colors.control, border: colors.controlBorder, fg: colors.ink1 },
  }[variant];

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled || loading}
      hitSlop={6}
      {...props}
      style={({ pressed }) => [
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: 1,
          borderColor: tone.border,
          backgroundColor: tone.bg,
          alignItems: 'center',
          justifyContent: 'center',
          opacity: disabled ? 0.5 : pressed ? 0.75 : 1,
        },
        style,
      ]}>
      {loading ? (
        <ActivityIndicator size="small" color={tone.fg} />
      ) : (
        icon({ color: tone.fg, size: Math.round(size * 0.45) })
      )}
    </Pressable>
  );
}
