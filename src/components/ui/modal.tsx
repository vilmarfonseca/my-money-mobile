import { ChevronDown } from 'lucide-react-native';
import type { ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Modal as RNModal,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';

import { IconButton } from '@/components/ui/button';
import { MeshBackground } from '@/components/ui/mesh-background';
import { Text } from '@/components/ui/text';
import { ToastViewport } from '@/components/ui/toast';
import { useI18n } from '@/lib/i18n/provider';
import { useTheme } from '@/theme/theme-provider';

type ModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Serif title; its last word is set in accent italics, as on the web. */
  title: string;
  /** Muted paragraph under the header. */
  description?: string;
  children?: ReactNode;
  /** Right slot of the app bar, usually the round dark submit button. */
  headerAction?: ReactNode;
  /** Buttons for the pinned action bar at the bottom. */
  footer?: ReactNode;
  /** Small line above the footer buttons (the form's running summary). */
  footerNote?: ReactNode;
  /** Set false when the content brings its own scroll view or list. */
  scroll?: boolean;
};

/**
 * Full-screen sheet: what every web `Modal` becomes on a phone. It slides up
 * over the page with the mesh background, an app-bar header (round chevron to
 * close, centred serif title, action slot) and an optional fixed action bar.
 */
export function Modal({
  children,
  description,
  footer,
  footerNote,
  headerAction,
  onOpenChange,
  open,
  scroll = true,
  title,
}: ModalProps) {
  return (
    <RNModal
      visible={open}
      animationType="slide"
      presentationStyle="fullScreen"
      statusBarTranslucent
      onRequestClose={() => onOpenChange(false)}>
      {/* A native modal is its own window: insets have to be measured again. */}
      <SafeAreaProvider>
        <ModalBody
          title={title}
          description={description}
          footer={footer}
          footerNote={footerNote}
          headerAction={headerAction}
          scroll={scroll}
          onClose={() => onOpenChange(false)}>
          {children}
        </ModalBody>
      </SafeAreaProvider>
    </RNModal>
  );
}

function ModalBody({
  children,
  description,
  footer,
  footerNote,
  headerAction,
  onClose,
  scroll,
  title,
}: Omit<ModalProps, 'open' | 'onOpenChange'> & { onClose: () => void }) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  return (
    <View style={styles.root}>
      <MeshBackground />
      <KeyboardAvoidingView
        style={styles.root}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ModalSheetHeader
          title={title}
          action={headerAction}
          onClose={onClose}
          topInset={insets.top}
        />
        {scroll ? (
          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24, gap: 16 }}>
            {description ? (
              <Text size="sm" color="ink3">
                {description}
              </Text>
            ) : null}
            {children}
          </ScrollView>
        ) : (
          <View style={styles.root}>{children}</View>
        )}
        {footer || footerNote ? (
          <View
            style={{
              gap: 10,
              paddingHorizontal: 16,
              paddingTop: 12,
              paddingBottom: Math.max(insets.bottom, 12),
              borderTopWidth: 1,
              borderTopColor: colors.line,
              backgroundColor: colors.bar,
            }}>
            {footerNote}
            {footer ? <View style={{ flexDirection: 'row', gap: 10 }}>{footer}</View> : null}
          </View>
        ) : null}
      </KeyboardAvoidingView>
      <ToastViewport />
    </View>
  );
}

/** App bar of a full-screen sheet. Also used by full-screen form routes. */
export function ModalSheetHeader({
  action,
  onClose,
  title,
  topInset = 0,
}: {
  action?: ReactNode;
  onClose: () => void;
  title: string;
  topInset?: number;
}) {
  const { messages } = useI18n();
  const words = title.split(' ');
  const emphasis = words.pop();
  const head = words.join(' ');

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingHorizontal: 16,
        paddingTop: Math.max(topInset, 14),
        paddingBottom: 12,
      }}>
      <IconButton
        accessibilityLabel={messages.common.closeModal}
        icon={(props) => <ChevronDown {...props} />}
        onPress={onClose}
      />
      <Text font="display" size="2xl" tight align="center" numberOfLines={1} style={{ flex: 1 }}>
        {head ? `${head} ` : ''}
        <Text font="displayItalic" size="2xl" tight color="accentSoftFg">
          {emphasis}
        </Text>
      </Text>
      {action ?? <View style={{ width: 40 }} />}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
