import { useFocusEffect } from 'expo-router';
import { ArrowUpRight, Plus } from 'lucide-react-native';
import { useCallback, useEffect, useRef, useState } from 'react';
import { BackHandler, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';

import { AddGoalModal } from '@/components/goals/add-goal-modal';
import { Button, IconButton } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { useI18n } from '@/lib/i18n/provider';
import { useTheme } from '@/theme/theme-provider';
import { palette, radius, shadows } from '@/theme/tokens';

/** Where the header's add button sits in the window, for the coachmark. */
export type AddGoalAnchor = { x: number; y: number; width: number; height: number };

/**
 * "New goal" action — icon-only in the app bar, labeled pill elsewhere. On its
 * own (`<AddGoalButton />`, as the dashboard uses it) it opens its own
 * new-goal sheet. The goals page passes `onPress` instead and owns the sheet
 * itself, because there the app-bar button shares it with the empty-state
 * coachmark (see `AddGoalCoachmark`), which also needs the button's position.
 */
export function AddGoalButton({
  iconOnly = false,
  onAnchor,
  onPress,
  variant,
}: {
  iconOnly?: boolean;
  /** Called with the button's window position once it is laid out. */
  onAnchor?: (anchor: AddGoalAnchor) => void;
  /** Takes over the press: the caller opens the new-goal sheet. */
  onPress?: () => void;
  variant?: 'default' | 'outline';
}) {
  const { messages } = useI18n();
  const ref = useRef<View>(null);
  const [open, setOpen] = useState(false);
  const press = onPress ?? (() => setOpen(true));

  const button = iconOnly ? (
    <IconButton
      accessibilityLabel={messages.goals.newGoal}
      variant="action"
      icon={(props) => <Plus {...props} />}
      onPress={press}
    />
  ) : (
    <Button
      variant={variant}
      icon={(props) => <Plus {...props} />}
      label={messages.goals.newGoal}
      onPress={press}
    />
  );

  return (
    <View
      ref={ref}
      // Keeps the native view around so it can be measured.
      collapsable={false}
      onLayout={() => {
        if (!onAnchor) return;
        ref.current?.measureInWindow((x, y, width, height) => {
          // A view that is not on screen yet measures as an empty box.
          if (width > 0 && height > 0) onAnchor({ x, y, width, height });
        });
      }}>
      {button}
      {onPress ? null : <AddGoalModal open={open} onOpenChange={setOpen} />}
    </View>
  );
}

const HALO_SPREAD = 14;

/**
 * Empty-goals spotlight over the page: a scrim dims every card while a tip
 * points at the app bar's add button, redrawn on top with a pulsing halo.
 * Unlike the dashboard's one-shot first-step coachmark, this one keeps no
 * "seen" flag — it is purely derived from the goal count, so it returns
 * whenever the user is back to zero goals and disappears once one exists.
 *
 * Rendered by the screen above its scroll view (the button itself lives inside
 * it and could not rise above a scrim).
 */
export function AddGoalCoachmark({
  anchor,
  onAdd,
  onSkip,
}: {
  anchor: AddGoalAnchor;
  onAdd: () => void;
  onSkip: () => void;
}) {
  const { messages } = useI18n();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const copy = messages.goals.emptyCoach;
  const pulse = useSharedValue(0);

  useEffect(() => {
    pulse.value = withRepeat(
      withTiming(1, { duration: 2400, easing: Easing.out(Easing.cubic) }),
      -1,
      false,
    );
  }, [pulse]);

  // `coach-halo`: the ring spreads and fades over the first 70% of each beat.
  const halo = useAnimatedStyle(() => {
    const progress = Math.min(pulse.value / 0.7, 1);
    return {
      opacity: 0.55 * (1 - progress),
      transform: [{ scale: 1 + ((HALO_SPREAD * 2) / anchor.width) * progress }],
    };
  });

  // The web skips on Escape; Android's back button is the closest thing.
  useFocusEffect(
    useCallback(() => {
      const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
        onSkip();
        return true;
      });
      return () => subscription.remove();
    }, [onSkip]),
  );

  // The anchor was measured with the page at rest; keep it clear of the notch
  // should the measurement ever come back off-screen.
  const top = Math.max(anchor.y, insets.top + 4);
  const right = Math.max(width - (anchor.x + anchor.width), 16);

  return (
    <View style={[StyleSheet.absoluteFill, { overflow: 'hidden' }]}>
      <Animated.View
        entering={FadeIn.duration(400)}
        exiting={FadeOut.duration(160)}
        style={StyleSheet.absoluteFill}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={copy.skip}
          onPress={onSkip}
          style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(20, 10, 40, 0.42)' }]}>
          {/* `ob-scrim`: a plum wash from the top right over the dim layer. */}
          <Svg width={width} height={height}>
            <Defs>
              <RadialGradient
                id="goal-coach-scrim"
                cx={width * 0.7}
                cy={height * -0.1}
                fx={width * 0.7}
                fy={height * -0.1}
                rx={1200}
                ry={700}
                gradientUnits="userSpaceOnUse">
                <Stop offset={0} stopColor={palette.plum500} stopOpacity={0.18} />
                <Stop offset={0.6} stopColor={palette.plum500} stopOpacity={0} />
              </RadialGradient>
            </Defs>
            <Rect x={0} y={0} width={width} height={height} fill="url(#goal-coach-scrim)" />
          </Svg>
        </Pressable>
      </Animated.View>

      <View
        style={{ position: 'absolute', top, right, width: anchor.width, height: anchor.height }}>
        <Animated.View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            { borderRadius: radius.pill, backgroundColor: palette.plum500 },
            halo,
          ]}
        />
        <IconButton
          accessibilityLabel={messages.goals.newGoal}
          variant="action"
          size={anchor.width}
          icon={(props) => <Plus {...props} />}
          onPress={onAdd}
        />
      </View>

      <Animated.View
        entering={FadeInDown.duration(260)}
        exiting={FadeOut.duration(160)}
        accessibilityRole="alert"
        style={{
          position: 'absolute',
          top: top + anchor.height + 16,
          right,
          width: Math.min(352, width - 32),
          padding: 20,
          borderRadius: radius.xl,
          borderWidth: 1,
          borderColor: colors.line,
          backgroundColor: colors.surface1,
          boxShadow: shadows.xl,
        }}>
        {/* The arrow, pointing up at the middle of the button. */}
        <View
          style={{
            position: 'absolute',
            top: -7,
            right: anchor.width / 2 - 6,
            width: 12,
            height: 12,
            borderRadius: 2,
            borderLeftWidth: 1,
            borderTopWidth: 1,
            borderColor: colors.line,
            backgroundColor: colors.surface1,
            transform: [{ rotate: '45deg' }],
          }}
        />

        <View
          style={{
            alignSelf: 'flex-start',
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            height: 24,
            paddingHorizontal: 10,
            borderRadius: radius.pill,
            backgroundColor: colors.accentSoft,
          }}>
          <ArrowUpRight size={14} color={colors.accentSoftFg} />
          <Text font="sansSemiBold" size="2xs" color="accentSoftFg" uppercase tracking={0.5}>
            {copy.badge}
          </Text>
        </View>

        <Text font="display" size="2xl" style={{ marginTop: 12, lineHeight: 30 }}>
          {copy.title}
        </Text>
        <Text size="sm" color="ink3" style={{ marginTop: 8, lineHeight: 21 }}>
          {copy.body}
        </Text>

        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', paddingTop: 16 }}>
          <Button variant="outline" style={{ height: 36 }} onPress={onSkip}>
            <Text font="sansMedium" size="sm" color="ink2">
              {copy.skip}
            </Text>
          </Button>
        </View>
      </Animated.View>
    </View>
  );
}
