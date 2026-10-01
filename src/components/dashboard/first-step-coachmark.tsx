import { usePathname, useRouter } from 'expo-router';
import { ArrowUpRight, Plus } from 'lucide-react-native';
import { useEffect, useRef, useState, type RefObject } from 'react';
import { BackHandler, Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { callApi } from '@/api/client';
import {
  FIRST_TRANSACTION_TIP_STORAGE_KEY,
  rememberCoachmarkDismissed,
  wasCoachmarkDismissed,
} from '@/components/dashboard/coachmark-storage';
import { useCoachmarkDelay } from '@/components/dashboard/use-coachmark-delay';
import { Button, IconButton } from '@/components/ui/button';
import { SCREEN_GUTTER } from '@/components/ui/screen';
import { Text } from '@/components/ui/text';
import { useI18n } from '@/lib/i18n/provider';
import { useTheme } from '@/theme/theme-provider';
import { durations, palette, radius, shadows } from '@/theme/tokens';

type Rect = { height: number; width: number; x: number; y: number };

/** The web's `ob-scrim`: the same dim in both themes. */
const SCRIM = 'rgba(20, 10, 40, 0.42)';
/** How far the halo spreads past the control (`coach-halo`: 14px). */
const HALO_SPREAD = 14;

/**
 * First-run coachmark for an empty ledger: dims the dashboard behind a scrim
 * while the header's new-transaction button stays lit above it, with a tip
 * pointing at it. Render it as the last child of a view that fills the screen;
 * it lays itself over that view.
 *
 * The tip is retired only by an explicit act: skipping it, or opening the flow
 * it points at. Showing it is not enough: a user who never engaged with it
 * still gets it next visit, and one who did never sees it again.
 */
export function FirstStepCoachmark({
  active,
  anchorRef,
  anchorInView,
}: {
  /** `showFirstStepCoachmark` from the API. */
  active: boolean;
  /** The view wrapping the header's "+" button. */
  anchorRef: RefObject<View | null>;
  /** False while the header is scrolled away: the tip waits for it to return. */
  anchorInView: boolean;
}) {
  const { messages } = useI18n();
  const { colors } = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const copy = messages.dashboard.firstStep;
  const rootRef = useRef<View>(null);
  // Null until the device flag has been read: a spent tip must not flash.
  const [dismissed, setDismissed] = useState<boolean | null>(null);
  const [anchor, setAnchor] = useState<Rect | null>(null);

  useEffect(() => {
    let cancelled = false;
    void wasCoachmarkDismissed(FIRST_TRANSACTION_TIP_STORAGE_KEY).then((stored) => {
      if (!cancelled) setDismissed(stored);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Hold the tip back for a beat so it never lands on top of a page the user
  // has not had a chance to look at yet. Tabs stay mounted, so it also only
  // counts while the dashboard is the page on screen.
  const ready = useCoachmarkDelay(active && dismissed === false && pathname === '/dashboard');
  const visible = ready && anchorInView;

  // Find the button on screen, relative to this overlay.
  useEffect(() => {
    if (!visible) return;
    anchorRef.current?.measureInWindow((x, y, width, height) => {
      rootRef.current?.measureInWindow((rootX, rootY) => {
        setAnchor({ x: x - rootX, y: y - rootY, width, height });
      });
    });
  }, [anchorRef, visible]);

  const retire = () => {
    setDismissed(true);
    void rememberCoachmarkDismissed(FIRST_TRANSACTION_TIP_STORAGE_KEY);
    // The device flag already keeps the tip away if this never arrives.
    callApi('onboarding.dismissFirstTransactionTip').catch(() => {});
  };

  const skip = retire;

  // Using the control counts as acting on the tip, so it retires too.
  const start = () => {
    retire();
    router.push('/transactions/new');
  };

  // Android's back button is this platform's Escape key.
  useEffect(() => {
    if (!visible) return;
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      skip();
      return true;
    });
    return () => subscription.remove();
  }, [visible, skip]);

  if (!visible) return null;

  return (
    <View ref={rootRef} collapsable={false} pointerEvents="box-none" style={StyleSheet.absoluteFill}>
      {anchor ? (
        <>
          <Animated.View entering={FadeIn.duration(durations.slow)} style={StyleSheet.absoluteFill}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={copy.skip}
              onPress={skip}
              style={[StyleSheet.absoluteFill, { backgroundColor: SCRIM }]}
            />
          </Animated.View>

          <Halo rect={anchor} />
          {/* A lit copy of the header button, exactly over the dimmed one. */}
          <IconButton
            accessibilityLabel={messages.common.addTransaction}
            variant="action"
            size={anchor.width}
            icon={(props) => <Plus {...props} />}
            onPress={start}
            style={{ position: 'absolute', left: anchor.x, top: anchor.y }}
          />

          <Animated.View
            entering={FadeInDown.duration(durations.slow)}
            accessibilityViewIsModal
            style={{
              position: 'absolute',
              left: SCREEN_GUTTER,
              right: SCREEN_GUTTER,
              top: anchor.y + anchor.height + 16,
              padding: 20,
              borderRadius: radius.xl,
              borderWidth: 1,
              borderColor: colors.line,
              backgroundColor: colors.surface1,
              boxShadow: shadows.xl,
            }}>
            {/* Caret pointing up at the button. */}
            <View
              style={{
                position: 'absolute',
                top: -7,
                left: anchor.x + anchor.width / 2 - SCREEN_GUTTER - 7,
                width: 12,
                height: 12,
                borderTopLeftRadius: radius.xs,
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

            <Text
              accessibilityRole="header"
              font="display"
              size="2xl"
              style={{ marginTop: 12, lineHeight: 30 }}>
              {copy.title}
            </Text>
            <Text size="sm" color="ink3" style={{ marginTop: 8, lineHeight: 21 }}>
              {copy.body}
            </Text>

            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', paddingTop: 16 }}>
              <Button variant="outline" onPress={skip} style={{ height: 36 }}>
                <Text font="sansMedium" size="sm" color="ink2">
                  {copy.skip}
                </Text>
              </Button>
            </View>
          </Animated.View>
        </>
      ) : null}
    </View>
  );
}

/** The plum ring pulsing out from the spotlighted control (`animate-coach-halo`). */
function Halo({ rect }: { rect: Rect }) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withRepeat(withTiming(1, { duration: 2400, easing: Easing.linear }), -1);
  }, [progress]);

  const maxScale = (rect.width + HALO_SPREAD * 2) / rect.width;
  const animated = useAnimatedStyle(() => {
    // The ring spreads and fades over the first 70% of the cycle, then rests.
    const elapsed = Math.min(progress.value / 0.7, 1);
    const spread = 1 - (1 - elapsed) * (1 - elapsed);
    return {
      opacity: 0.55 * (1 - spread),
      transform: [{ scale: 1 + (maxScale - 1) * spread }],
    };
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        {
          position: 'absolute',
          left: rect.x,
          top: rect.y,
          width: rect.width,
          height: rect.height,
          borderRadius: rect.width / 2,
          backgroundColor: palette.plum500,
        },
        animated,
      ]}
    />
  );
}
