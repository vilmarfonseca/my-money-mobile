import { useEffect } from 'react';
import type { DimensionValue, StyleProp, ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { useTheme } from '@/theme/theme-provider';
import { radius } from '@/theme/tokens';

/** Pulsing placeholder block shown while a query loads. */
export function Skeleton({
  height = 16,
  rounded = radius.sm,
  style,
  width = '100%',
}: {
  height?: DimensionValue;
  rounded?: number;
  style?: StyleProp<ViewStyle>;
  width?: DimensionValue;
}) {
  const { colors } = useTheme();
  const opacity = useSharedValue(1);

  useEffect(() => {
    opacity.value = withRepeat(withTiming(0.45, { duration: 800 }), -1, true);
  }, [opacity]);

  const animated = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      style={[
        { width, height, borderRadius: rounded, backgroundColor: colors.surface3 },
        animated,
        style,
      ]}
    />
  );
}

/** A glass card of skeleton lines: the default loading state for a section. */
export function SkeletonCard({ lines = 3, height = 16 }: { lines?: number; height?: number }) {
  const { colors } = useTheme();
  return (
    <Animated.View
      style={{
        gap: 12,
        padding: 20,
        borderRadius: radius.xl,
        borderWidth: 1,
        borderColor: colors.glassBorder,
        backgroundColor: colors.glassBg,
      }}>
      {Array.from({ length: lines }, (_, index) => (
        <Skeleton key={index} height={height} width={index === 0 ? '45%' : index % 2 ? '100%' : '70%'} />
      ))}
    </Animated.View>
  );
}
