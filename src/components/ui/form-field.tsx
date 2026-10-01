import type { ReactNode } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';

import { Text } from '@/components/ui/text';
import { useI18n } from '@/lib/i18n/provider';

/** Uppercase eyebrow above a form control, with an optional "Optional" hint. */
export function FieldLabel({
  children,
  info,
  optional = false,
}: {
  children: ReactNode;
  /** Node beside the label text (an info button). */
  info?: ReactNode;
  optional?: boolean;
}) {
  const { messages } = useI18n();

  return (
    <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 1 }}>
        <Text font="sansSemiBold" size="xs" color="ink3" uppercase tracking={1.2}>
          {children}
        </Text>
        {info}
      </View>
      {optional ? (
        <Text size="sm" color="ink4">
          {messages.common.optional}
        </Text>
      ) : null}
    </View>
  );
}

/** Labelled form control: eyebrow label, the control, and an optional note. */
export function FormField({
  children,
  error,
  hint,
  info,
  label,
  optional = false,
  style,
}: {
  children: ReactNode;
  /** Validation message under the control. */
  error?: string | null;
  /** Helper text under the control. */
  hint?: string;
  info?: ReactNode;
  label: string;
  optional?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[{ gap: 10 }, style]}>
      <FieldLabel optional={optional} info={info}>
        {label}
      </FieldLabel>
      {children}
      {error ? (
        <Text size="xs" color="negativeFg">
          {error}
        </Text>
      ) : hint ? (
        <Text size="xs" color="ink3">
          {hint}
        </Text>
      ) : null}
    </View>
  );
}
