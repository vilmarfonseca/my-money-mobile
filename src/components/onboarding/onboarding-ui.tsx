import { LinearGradient } from 'expo-linear-gradient';
import { Check, Plus, X, type LucideIcon } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

import { Text } from '@/components/ui/text';
import { toast } from '@/components/ui/toast';
import { useTheme } from '@/theme/theme-provider';
import { durations, palette, radius, shadows, themes } from '@/theme/tokens';

export type ObGradient = readonly [string, string, ...string[]];

/** Icon-tile gradients shared by the bank and goal rows (`bg-linear-to-br`). */
export const obToneGradients = {
  plum: [palette.plum800, palette.plum500],
  coral: [palette.coral600, palette.coral400],
  // Fixed dark ink: the tile carries a white icon in both themes.
  ink: [themes.light.ink1, themes.light.ink2],
  sage: [palette.sage700, palette.sage500],
  amber: [palette.amber500, palette.amber500],
} as const satisfies Record<string, ObGradient>;

/**
 * Runs an API action, turning a request that never got an answer into the
 * same error toast an `{ ok: false }` result gets. Null means it failed.
 */
export async function obAttempt<T>(action: () => Promise<T>): Promise<T | null> {
  try {
    return await action();
  } catch (error) {
    toast.error(error instanceof Error ? error.message : String(error));
    return null;
  }
}

/* ------------------------------------------------------------------------ */
/* Selectable option card (savings kind, fresh/import, light/dark)           */
/* ------------------------------------------------------------------------ */

/** Small uppercase pill beside a title ("locked", "Primary"). */
export function ObTag({ children }: { children: string }) {
  const { colors } = useTheme();
  return (
    <View
      style={{
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: radius.pill,
        backgroundColor: colors.accentSoft,
      }}>
      <Text font="sansMedium" size="2xs" color="accentSoftFg" uppercase tracking={0.6}>
        {children}
      </Text>
    </View>
  );
}

/** The check badge in the corner of a selected option. */
export function ObSelectedBadge() {
  return (
    <View
      style={{
        position: 'absolute',
        top: 12,
        right: 12,
        zIndex: 1,
        width: 20,
        height: 20,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: palette.plum500,
      }}>
      <Check size={12} color={palette.white} />
    </View>
  );
}

/** Frame shared by every selectable card in the wizard. */
export function ObSelectable({
  children,
  disabled,
  label,
  onSelect,
  selected,
}: {
  children: ReactNode;
  disabled?: boolean;
  label: string;
  onSelect: () => void;
  selected: boolean;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected, disabled: Boolean(disabled) }}
      disabled={disabled}
      onPress={onSelect}
      style={({ pressed }) => ({
        gap: 4,
        padding: 16,
        borderRadius: radius.md,
        borderWidth: 1,
        borderColor: selected ? palette.plum500 : colors.controlBorder,
        backgroundColor: selected ? colors.accentSoft : colors.control,
        boxShadow: selected ? `0 0 0 3px ${colors.accentSoft}` : undefined,
        opacity: disabled ? 0.5 : pressed ? 0.85 : 1,
      })}>
      {selected ? <ObSelectedBadge /> : null}
      {children}
    </Pressable>
  );
}

export function ObOptionCard({
  description,
  icon: Icon,
  onSelect,
  selected,
  tag,
  title,
}: {
  description: string;
  icon: LucideIcon;
  onSelect: () => void;
  selected: boolean;
  tag?: string;
  title: string;
}) {
  const { colors } = useTheme();
  return (
    <ObSelectable label={title} selected={selected} onSelect={onSelect}>
      <View
        style={{
          width: 36,
          height: 36,
          marginBottom: 8,
          borderRadius: 18,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: selected ? palette.plum500 : colors.surface2,
        }}>
        <Icon size={20} color={selected ? palette.white : colors.ink2} />
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingRight: 24 }}>
        <Text font="sansMedium" size="sm" style={{ flexShrink: 1 }}>
          {title}
        </Text>
        {tag ? <ObTag>{tag}</ObTag> : null}
      </View>
      <Text size="xs" color="ink3" style={{ lineHeight: 19 }}>
        {description}
      </Text>
    </ObSelectable>
  );
}

/* ------------------------------------------------------------------------ */
/* Added-item row (accounts / goals / cards lists)                           */
/* ------------------------------------------------------------------------ */

export function ObAddedRow({
  actions,
  gradient,
  icon: Icon,
  iconColor = palette.white,
  meta,
  name,
  nameNote,
  tag,
}: {
  actions?: ReactNode;
  gradient: ObGradient;
  icon: LucideIcon;
  iconColor?: string;
  meta: string;
  name: string;
  /** Muted text after the name (a bank's nickname). */
  nameNote?: string;
  tag?: string;
}) {
  const { colors } = useTheme();
  return (
    <Animated.View
      entering={FadeInUp.duration(durations.base).withInitialValues({
        transform: [{ translateY: -6 }],
      })}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: radius['2xl'],
        borderWidth: 1,
        borderColor: colors.line,
        backgroundColor: colors.surface1,
        boxShadow: shadows.sm,
      }}>
      <LinearGradient
        colors={gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          width: 44,
          height: 44,
          borderRadius: 22,
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        <Icon size={20} color={iconColor} />
      </LinearGradient>
      <View style={{ flex: 1, minWidth: 0 }}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
          <Text font="sansMedium" size="sm" style={{ flexShrink: 1 }}>
            {name}
            {nameNote ? (
              <Text font="sansMedium" size="sm" color="ink3">
                {` · ${nameNote}`}
              </Text>
            ) : null}
          </Text>
          {tag ? <ObTag>{tag}</ObTag> : null}
        </View>
        <Text font="mono" size="xs" color="ink3" numberOfLines={1} style={{ marginTop: 2 }}>
          {meta}
        </Text>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>{actions}</View>
    </Animated.View>
  );
}

export function ObMiniButton({
  active,
  disabled,
  icon,
  label,
  onPress,
}: {
  active?: boolean;
  disabled?: boolean;
  icon: (props: { color: string; size: number }) => ReactNode;
  label: string;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: Boolean(active), disabled: Boolean(disabled) }}
      disabled={disabled}
      hitSlop={6}
      onPress={onPress}
      style={({ pressed }) => ({
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: active ? palette.plum500 : colors.controlBorder,
        backgroundColor: active ? colors.accentSoft : pressed ? colors.controlHover : colors.control,
        opacity: disabled ? 0.5 : 1,
      })}>
      {icon({ color: active ? colors.accentSoftFg : colors.ink2, size: 16 })}
    </Pressable>
  );
}

export function ObRemoveButton({
  disabled,
  label,
  onPress,
}: {
  disabled?: boolean;
  label: string;
  onPress: () => void;
}) {
  return (
    <ObMiniButton
      disabled={disabled}
      label={label}
      onPress={onPress}
      icon={(props) => <X {...props} />}
    />
  );
}

/* ------------------------------------------------------------------------ */
/* Dashed "add" button and the empty-list note                               */
/* ------------------------------------------------------------------------ */

export function ObDashedButton({
  disabled,
  height = 48,
  label,
  loading,
  onPress,
  rounded = radius.pill,
}: {
  disabled?: boolean;
  height?: number;
  label: string;
  loading?: boolean;
  onPress: () => void;
  rounded?: number;
}) {
  const { colors } = useTheme();
  const inactive = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: Boolean(inactive), busy: Boolean(loading) }}
      disabled={inactive}
      onPress={onPress}
      style={({ pressed }) => ({
        height,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        borderRadius: rounded,
        borderWidth: 1,
        borderStyle: 'dashed',
        borderColor: pressed ? palette.plum500 : colors.lineStrong,
        backgroundColor: pressed ? colors.accentSoft : 'transparent',
        opacity: inactive ? 0.55 : 1,
      })}>
      {({ pressed }) => {
        const color = pressed ? colors.accentSoftFg : colors.ink2;
        return (
          <>
            {loading ? (
              <ActivityIndicator size="small" color={color} />
            ) : (
              <Plus size={16} color={color} />
            )}
            <Text font="sansMedium" size="sm" color={color}>
              {label}
            </Text>
          </>
        );
      }}
    </Pressable>
  );
}

export function ObEmptyNote({ children }: { children: string }) {
  return (
    <Text size="xs" color="ink4" align="center" style={{ paddingVertical: 8, fontStyle: 'italic' }}>
      {children}
    </Text>
  );
}

/* ------------------------------------------------------------------------ */
/* Snap a picked hex to the closest entry of a fixed brand set               */
/* ------------------------------------------------------------------------ */

export function nearestColorOption<T extends string>(
  hex: string,
  options: ReadonlyArray<{ value: T; hex: string }>,
): T {
  const rgb = hexToRgb(hex);
  let best = options[0].value;
  let bestDistance = Number.POSITIVE_INFINITY;
  for (const option of options) {
    const candidate = hexToRgb(option.hex);
    const distance =
      (rgb.r - candidate.r) ** 2 + (rgb.g - candidate.g) ** 2 + (rgb.b - candidate.b) ** 2;
    if (distance < bestDistance) {
      bestDistance = distance;
      best = option.value;
    }
  }
  return best;
}

function hexToRgb(hex: string) {
  const value = hex.replace('#', '');
  const full =
    value.length === 3
      ? value
          .split('')
          .map((c) => c + c)
          .join('')
      : value.padEnd(6, '0');
  return {
    r: parseInt(full.slice(0, 2), 16) || 0,
    g: parseInt(full.slice(2, 4), 16) || 0,
    b: parseInt(full.slice(4, 6), 16) || 0,
  };
}
