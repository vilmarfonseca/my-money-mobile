import type { ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
  type ScrollViewProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MeshBackground } from '@/components/ui/mesh-background';
import { useTheme } from '@/theme/theme-provider';

type ScreenProps = {
  children: ReactNode;
  /** Pull-to-refresh; pass both to enable it. */
  onRefresh?: () => void;
  refreshing?: boolean;
  /** Set false for screens that manage their own scrolling (lists, pagers). */
  scroll?: boolean;
  /** Fixed content below the scroll area (action bars). */
  footer?: ReactNode;
  contentStyle?: StyleProp<ViewStyle>;
  /** Extra space under the content, on top of the safe area. */
  bottomInset?: number;
  scrollProps?: Omit<ScrollViewProps, 'children'>;
};

/** Horizontal page gutter (`px-4` on phones in the web app). */
export const SCREEN_GUTTER = 16;

/**
 * Page frame: mesh background, status-bar inset, and a scroll view with the
 * page gutter. Every route renders its content inside one.
 */
export function Screen({
  bottomInset = 24,
  children,
  contentStyle,
  footer,
  onRefresh,
  refreshing = false,
  scroll = true,
  scrollProps,
}: ScreenProps) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  return (
    <View style={styles.root}>
      <MeshBackground />
      <KeyboardAvoidingView
        style={styles.root}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {scroll ? (
          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            {...scrollProps}
            contentContainerStyle={[
              {
                paddingTop: insets.top,
                paddingHorizontal: SCREEN_GUTTER,
                paddingBottom: bottomInset,
              },
              contentStyle,
            ]}
            refreshControl={
              onRefresh ? (
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  tintColor={colors.ink3}
                  progressViewOffset={insets.top}
                />
              ) : undefined
            }>
            {children}
          </ScrollView>
        ) : (
          <View style={[styles.root, { paddingTop: insets.top }, contentStyle]}>{children}</View>
        )}
        {footer}
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
