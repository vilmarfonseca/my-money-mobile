import { useState } from 'react';
import { Pressable, View } from 'react-native';
import Animated, { useAnimatedStyle, withSpring } from 'react-native-reanimated';

import { Text } from '@/components/ui/text';
import { useTheme } from '@/theme/theme-provider';
import { radius, shadows } from '@/theme/tokens';

type Layout = { width: number; x: number };

const spring = { stiffness: 360, damping: 30 };

/**
 * The page's view tabs. Same look as `SegmentedControl`, but each segment is
 * as wide as its label plus an equal share of the spare room, as on the web:
 * equal quarters cannot fit "Próximos vencimentos" on a phone.
 */
export function ViewSwitcher<T extends string>({
  accessibilityLabel,
  onValueChange,
  options,
  value,
}: {
  accessibilityLabel?: string;
  onValueChange: (value: T) => void;
  options: ReadonlyArray<{ label: string; value: T }>;
  value: T;
}) {
  const { colors } = useTheme();
  const [layouts, setLayouts] = useState<Partial<Record<T, Layout>>>({});
  const active = layouts[value];

  return (
    <View
      accessibilityRole="tablist"
      accessibilityLabel={accessibilityLabel}
      style={{
        padding: 4,
        borderRadius: radius.pill,
        borderWidth: 1,
        borderColor: colors.controlBorder,
        backgroundColor: colors.control,
      }}>
      <View style={{ flexDirection: 'row', height: 32 }}>
        {/* Mounted once measured, so the thumb starts in place instead of growing in. */}
        {active ? <Thumb layout={active} /> : null}
        {options.map((option) => {
          const selected = option.value === value;
          return (
            <Pressable
              key={option.value}
              accessibilityRole="tab"
              accessibilityState={{ selected }}
              onPress={() => onValueChange(option.value)}
              onLayout={(event) => {
                const { width, x } = event.nativeEvent.layout;
                setLayouts((current) => {
                  const known = current[option.value];
                  if (known && known.x === x && known.width === width) return current;
                  return { ...current, [option.value]: { width, x } };
                });
              }}
              style={{
                flexGrow: 1,
                flexShrink: 1,
                alignItems: 'center',
                justifyContent: 'center',
                paddingHorizontal: 6,
              }}>
              <Text
                font="sansMedium"
                size="xs"
                color={selected ? 'actionForeground' : 'ink2'}
                numberOfLines={1}>
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function Thumb({ layout }: { layout: Layout }) {
  const { colors } = useTheme();
  const { width, x } = layout;
  const animated = useAnimatedStyle(() => ({
    width: withSpring(width, spring),
    transform: [{ translateX: withSpring(x, spring) }],
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: 0,
          borderRadius: radius.pill,
          backgroundColor: colors.action,
          boxShadow: shadows.sm,
        },
        animated,
      ]}
    />
  );
}
