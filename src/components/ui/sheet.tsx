import { useEffect, useState, type ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Modal as RNModal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/components/ui/text';
import { ToastViewport } from '@/components/ui/toast';
import { useTheme } from '@/theme/theme-provider';
import { durations, radius, shadows } from '@/theme/tokens';

type SheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  children?: ReactNode;
  /** Pinned under the content (action buttons). */
  footer?: ReactNode;
  /** Wrap the content in a scroll view (default) or lay it out as-is. */
  scroll?: boolean;
};

/**
 * Bottom sheet: a panel that slides up over a dimmed page and takes only the
 * height its content needs (up to ~85% of the screen). Used for pickers,
 * option lists, confirmations and popovers. For a full form, use `Modal`.
 */
export function Sheet({
  children,
  description,
  footer,
  onOpenChange,
  open,
  scroll = true,
  title,
}: SheetProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  // The native modal stays mounted until the slide-out has finished.
  const [mounted, setMounted] = useState(open);
  const progress = useSharedValue(0);

  if (open && !mounted) setMounted(true);

  useEffect(() => {
    if (open) {
      progress.value = withTiming(1, { duration: durations.base + 60 });
    } else {
      progress.value = withTiming(0, { duration: durations.base }, (finished) => {
        if (finished) runOnJS(setMounted)(false);
      });
    }
  }, [open, progress]);

  const scrim = useAnimatedStyle(() => ({ opacity: progress.value }));
  const panel = useAnimatedStyle(() => ({
    transform: [{ translateY: (1 - progress.value) * height }],
  }));

  if (!mounted) return null;

  const close = () => onOpenChange(false);

  return (
    <RNModal transparent statusBarTranslucent visible animationType="none" onRequestClose={close}>
      <KeyboardAvoidingView
        style={styles.root}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: colors.scrim }, scrim]}>
          <Pressable accessibilityLabel="Close" style={StyleSheet.absoluteFill} onPress={close} />
        </Animated.View>
        <Animated.View
          style={[
            {
              maxHeight: height * 0.85,
              paddingBottom: Math.max(insets.bottom, 16),
              borderTopLeftRadius: radius.xl,
              borderTopRightRadius: radius.xl,
              borderWidth: 1,
              borderBottomWidth: 0,
              borderColor: colors.line,
              backgroundColor: colors.surface1,
              boxShadow: shadows.xl,
            },
            panel,
          ]}>
          <View style={{ alignItems: 'center', paddingTop: 10, paddingBottom: 6 }}>
            <View
              style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: colors.lineStrong }}
            />
          </View>
          {title || description ? (
            <View style={{ paddingHorizontal: 20, paddingTop: 6, paddingBottom: 12, gap: 6 }}>
              {title ? (
                <Text font="display" size="2xl" tight>
                  {title}
                </Text>
              ) : null}
              {description ? (
                <Text size="sm" color="ink3">
                  {description}
                </Text>
              ) : null}
            </View>
          ) : null}
          {scroll ? (
            <ScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 8 }}>
              {children}
            </ScrollView>
          ) : (
            <View style={{ paddingHorizontal: 20, flexShrink: 1 }}>{children}</View>
          )}
          {footer ? (
            <View style={{ flexDirection: 'row', gap: 10, paddingHorizontal: 20, paddingTop: 12 }}>
              {footer}
            </View>
          ) : null}
        </Animated.View>
        <ToastViewport />
      </KeyboardAvoidingView>
    </RNModal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end' },
});
