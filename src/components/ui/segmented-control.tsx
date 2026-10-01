import { useEffect, useState, type ReactNode } from 'react';
import { Pressable, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { Text } from '@/components/ui/text';
import { useTheme } from '@/theme/theme-provider';
import { radius, shadows } from '@/theme/tokens';

export type SegmentedControlOption<T extends string = string> = {
  label: string;
  value: T;
  /** Optional leading icon, coloured like the label. */
  icon?: (props: { color: string; size: number }) => ReactNode;
};

type Size = 'md' | 'lg' | 'xl';
const heights: Record<Size, number> = { md: 28, lg: 32, xl: 40 };

/**
 * Pill tab bar with a sliding dark thumb (`.seg`). Stretches to its parent's
 * width, as the web control does on phones.
 */
export function SegmentedControl<T extends string = string>({
  accessibilityLabel,
  disabled = false,
  onValueChange,
  options,
  size = 'md',
  style,
  value,
}: {
  accessibilityLabel?: string;
  disabled?: boolean;
  onValueChange: (value: T) => void;
  options: ReadonlyArray<SegmentedControlOption<T>>;
  size?: Size;
  style?: StyleProp<ViewStyle>;
  value: T;
}) {
  const { colors } = useTheme();
  const [width, setWidth] = useState(0);
  const segment = options.length > 0 ? width / options.length : 0;
  const index = Math.max(
    0,
    options.findIndex((option) => option.value === value),
  );

  // The thumb's slot, as a fraction-free index: it starts on the active
  // option (no slide-in on mount) and springs to the next one on change.
  const position = useSharedValue(index);
  useEffect(() => {
    position.value = withSpring(index, { stiffness: 360, damping: 30 });
  }, [index, position]);

  const thumb = useAnimatedStyle(
    () => ({ transform: [{ translateX: position.value * segment }] }),
    [segment],
  );

  return (
    <View
      accessibilityRole="tablist"
      accessibilityLabel={accessibilityLabel}
      style={[
        {
          padding: 4,
          borderRadius: radius.pill,
          borderWidth: 1,
          borderColor: colors.controlBorder,
          backgroundColor: colors.control,
          opacity: disabled ? 0.6 : 1,
        },
        style,
      ]}>
      <View
        onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
        style={{ flexDirection: 'row', height: heights[size] }}>
        {segment > 0 ? (
          <Animated.View
            style={[
              {
                position: 'absolute',
                top: 0,
                bottom: 0,
                left: 0,
                width: segment,
                borderRadius: radius.pill,
                backgroundColor: colors.action,
                boxShadow: shadows.sm,
              },
              thumb,
            ]}
          />
        ) : null}
        {options.map((option) => {
          const active = option.value === value;
          const color = active ? colors.actionForeground : colors.ink2;
          return (
            <Pressable
              key={option.value}
              accessibilityRole="tab"
              accessibilityState={{ selected: active, disabled }}
              disabled={disabled}
              onPress={() => onValueChange(option.value)}
              style={{
                flex: 1,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                paddingHorizontal: 4,
              }}>
              {option.icon?.({ color, size: 16 })}
              <Text
                font="sansMedium"
                size={size === 'xl' ? 'sm' : 'xs'}
                color={color}
                numberOfLines={1}
                // Four options on a phone leave a long label a few pixels short.
                adjustsFontSizeToFit
                minimumFontScale={0.85}>
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
