import { Pressable } from 'react-native';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';

import { useTheme } from '@/theme/theme-provider';
import { durations, shadows } from '@/theme/tokens';

/** Toggle matching the web switch: 44x24 track, action-coloured when on. */
export function Switch({
  accessibilityLabel,
  checked,
  disabled,
  onCheckedChange,
}: {
  accessibilityLabel?: string;
  checked: boolean;
  disabled?: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  const { colors } = useTheme();
  const thumb = useAnimatedStyle(() => ({
    transform: [{ translateX: withTiming(checked ? 20 : 0, { duration: durations.base }) }],
  }));

  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ checked, disabled: Boolean(disabled) }}
      disabled={disabled}
      hitSlop={8}
      onPress={() => onCheckedChange(!checked)}
      style={{
        width: 44,
        height: 24,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.controlBorder,
        backgroundColor: checked ? colors.action : colors.control,
        justifyContent: 'center',
        paddingHorizontal: 1,
        opacity: disabled ? 0.5 : 1,
      }}>
      <Animated.View
        style={[
          {
            width: 20,
            height: 20,
            borderRadius: 10,
            backgroundColor: colors.actionForeground,
            borderWidth: 1,
            borderColor: colors.line,
            boxShadow: shadows.md,
          },
          thumb,
        ]}
      />
    </Pressable>
  );
}
