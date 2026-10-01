import { LinearGradient } from 'expo-linear-gradient';
import { View, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme } from '@/theme/theme-provider';
import { gradients } from '@/theme/tokens';

/** Progress track with the plum-to-coral gradient fill (`bar-gradient`). */
export function ProgressBar({
  color,
  height = 8,
  style,
  value,
}: {
  /** Solid fill colour; omit for the brand gradient. */
  color?: string;
  height?: number;
  style?: StyleProp<ViewStyle>;
  /** 0 to 1. */
  value: number;
}) {
  const { colors } = useTheme();
  const clamped = Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(clamped * 100) }}
      style={[
        { height, borderRadius: height / 2, backgroundColor: colors.surface3, overflow: 'hidden' },
        style,
      ]}>
      {color ? (
        <View style={{ width: `${clamped * 100}%`, height, borderRadius: height / 2, backgroundColor: color }} />
      ) : (
        <LinearGradient
          colors={gradients.bar}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ width: `${clamped * 100}%`, height, borderRadius: height / 2 }}
        />
      )}
    </View>
  );
}
