import { Check } from 'lucide-react-native';
import { useEffect } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { Text } from '@/components/ui/text';
import { useTheme } from '@/theme/theme-provider';
import { durations, palette, shadows } from '@/theme/tokens';

const DISC = 128;
const easeOut = Easing.out(Easing.cubic);

/**
 * The completion overlay: two expanding rings, the check disc popping in, the
 * title rising, and confetti falling over it all. It stays up until the shell
 * swaps the onboarding screen for the app.
 */
export function OnboardingCelebration({ sub, title }: { sub: string; title: string }) {
  const { colors } = useTheme();
  const pop = useSharedValue(0);

  useEffect(() => {
    pop.value = withDelay(
      80,
      withSequence(
        withTiming(1.08, { duration: 312, easing: easeOut }),
        withTiming(1, { duration: 208, easing: easeOut }),
      ),
    );
  }, [pop]);

  const disc = useAnimatedStyle(() => ({ transform: [{ scale: pop.value }] }));

  return (
    <Animated.View
      entering={FadeIn.duration(durations.base)}
      accessibilityViewIsModal
      style={[StyleSheet.absoluteFill, styles.center]}>
      <View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, { backgroundColor: colors.surface1, opacity: 0.92 }]}
      />
      <Confetti />

      <View style={{ alignItems: 'center', paddingHorizontal: 24 }}>
        <View style={{ width: DISC, height: DISC, marginBottom: 24 }}>
          <Ring delay={0} />
          <Ring delay={140} />
          <Animated.View
            style={[
              StyleSheet.absoluteFill,
              styles.center,
              {
                borderRadius: DISC / 2,
                backgroundColor: palette.plum500,
                boxShadow: shadows.avatar,
              },
              disc,
            ]}>
            <Check size={64} color={palette.white} strokeWidth={3} />
          </Animated.View>
        </View>
        <Animated.View entering={rise(520)}>
          <Text font="display" size="5xl" align="center" tracking={-0.5} accessibilityRole="header">
            {title}
          </Text>
        </Animated.View>
        <Animated.View entering={rise(640)} style={{ marginTop: 10 }}>
          <Text size="sm" color="ink3" align="center">
            {sub}
          </Text>
        </Animated.View>
      </View>
    </Animated.View>
  );
}

const rise = (delay: number) =>
  FadeInDown.delay(delay)
    .duration(480)
    .withInitialValues({ transform: [{ translateY: 10 }] });

function Ring({ delay }: { delay: number }) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(delay, withTiming(1, { duration: 900, easing: easeOut }));
  }, [delay, progress]);

  const style = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.7, 1], [0.8, 0.25, 0]),
    transform: [{ scale: interpolate(progress.value, [0, 1], [0.6, 1.9]) }],
  }));

  return (
    <Animated.View
      style={[
        StyleSheet.absoluteFill,
        { borderRadius: DISC / 2, borderWidth: 3, borderColor: palette.plum500 },
        style,
      ]}
    />
  );
}

/* Confetti burst */

const CONFETTI_COLORS = [
  palette.plum500,
  palette.coral500,
  palette.sage500,
  palette.amber500,
  palette.plum300,
  palette.coral300,
];

// Hash-based pseudo-random keeps the render pure while scattering bits.
function random(index: number, salt: number) {
  const value = Math.sin(index * 127.1 + salt * 311.7) * 43758.5453;
  return value - Math.floor(value);
}

type Bit = {
  color: string;
  delay: number;
  duration: number;
  height: number;
  left: number;
  round: boolean;
  width: number;
};

const BITS: Bit[] = Array.from({ length: 64 }, (_, index) => ({
  left: random(index, 1),
  color: CONFETTI_COLORS[index % CONFETTI_COLORS.length],
  width: 6 + random(index, 2) * 6,
  height: 10 + random(index, 3) * 8,
  round: random(index, 4) > 0.6,
  duration: 2400 + random(index, 5) * 1800,
  delay: random(index, 6) * 500,
}));

function Confetti() {
  const { height, width } = useWindowDimensions();

  return (
    <View
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[StyleSheet.absoluteFill, { overflow: 'hidden' }]}>
      {BITS.map((bit, index) => (
        <ConfettiBit key={index} bit={bit} fall={height * 1.02 + 20} x={bit.left * width} />
      ))}
    </View>
  );
}

function ConfettiBit({ bit, fall, x }: { bit: Bit; fall: number; x: number }) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      bit.delay,
      withTiming(1, { duration: bit.duration, easing: Easing.bezier(0.2, 0.6, 0.4, 1) }),
    );
  }, [bit, progress]);

  const style = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.1, 1], [0, 1, 0.9]),
    transform: [
      { translateY: interpolate(progress.value, [0, 1], [-10, fall]) },
      { rotate: `${progress.value * 720}deg` },
    ],
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          top: -20,
          left: x,
          width: bit.width,
          height: bit.height,
          borderRadius: bit.round ? 999 : 2,
          backgroundColor: bit.color,
        },
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center' },
});
