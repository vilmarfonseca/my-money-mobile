import { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';
import Animated, { FadeInUp, FadeOutUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/components/ui/text';
import { useTheme } from '@/theme/theme-provider';
import { radius, shadows } from '@/theme/tokens';

type ToastKind = 'success' | 'error' | 'message';
type ToastOptions = { description?: string };
type ToastItem = { description?: string; id: number; kind: ToastKind; text: string };

const listeners = new Set<(item: ToastItem | null) => void>();
let current: ToastItem | null = null;
let nextId = 1;
let timer: ReturnType<typeof setTimeout> | null = null;

function show(kind: ToastKind, text: string, options?: ToastOptions) {
  if (timer) clearTimeout(timer);
  current = { description: options?.description, id: nextId++, kind, text };
  listeners.forEach((listener) => listener(current));
  timer = setTimeout(dismiss, kind === 'error' ? 5000 : 3200);
}

function dismiss() {
  if (timer) clearTimeout(timer);
  timer = null;
  current = null;
  listeners.forEach((listener) => listener(null));
}

/** Same call shape as the web app's `sonner`: `toast.success(...)`. */
export const toast = {
  success: (text: string, options?: ToastOptions) => show('success', text, options),
  error: (text: string, options?: ToastOptions) => show('error', text, options),
  message: (text: string, options?: ToastOptions) => show('message', text, options),
  dismiss,
};

/**
 * Renders the current toast. Mounted once at the root, and again inside every
 * `Modal` and `Sheet`: a native modal sits above the root view, so a toast
 * raised while one is open would otherwise appear behind it.
 */
export function ToastViewport() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [item, setItem] = useState<ToastItem | null>(current);

  useEffect(() => {
    listeners.add(setItem);
    return () => {
      listeners.delete(setItem);
    };
  }, []);

  if (!item) return null;

  const accent =
    item.kind === 'success' ? colors.positive : item.kind === 'error' ? colors.negative : colors.ink3;

  return (
    <View
      pointerEvents="box-none"
      style={{ position: 'absolute', top: insets.top + 8, left: 16, right: 16, zIndex: 1000 }}>
      <Animated.View key={item.id} entering={FadeInUp.duration(220)} exiting={FadeOutUp.duration(160)}>
        <Pressable
          accessibilityRole="alert"
          onPress={dismiss}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
            paddingHorizontal: 16,
            paddingVertical: 12,
            borderRadius: radius.md,
            borderWidth: 1,
            borderColor: colors.line,
            backgroundColor: colors.surface1,
            boxShadow: shadows.lg,
          }}>
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: accent }} />
          <View style={{ flex: 1 }}>
            <Text size="sm" font="sansMedium">
              {item.text}
            </Text>
            {item.description ? (
              <Text size="xs" color="ink3">
                {item.description}
              </Text>
            ) : null}
          </View>
        </Pressable>
      </Animated.View>
    </View>
  );
}
