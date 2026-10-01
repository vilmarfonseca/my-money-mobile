import { useState, type ReactNode } from 'react';
import { TextInput, View, type StyleProp, type TextInputProps, type ViewStyle } from 'react-native';

import { useTheme } from '@/theme/theme-provider';
import { fonts, radius } from '@/theme/tokens';

export type InputProps = TextInputProps & {
  /** Rendered inside the field, before the text (icons, prefixes). */
  leading?: ReactNode;
  /** Rendered inside the field, after the text. */
  trailing?: ReactNode;
  invalid?: boolean;
  /** Use the monospaced face (amounts, dates, codes). */
  mono?: boolean;
  containerStyle?: StyleProp<ViewStyle>;
};

/** Form field height on phones (`formInputClassName`: `max-md:h-11`). */
export const INPUT_HEIGHT = 44;

/**
 * Text field with the app's form styling. `multiline` grows from a 96px
 * minimum, like the web textarea.
 */
export function Input({
  containerStyle,
  editable = true,
  invalid,
  leading,
  mono,
  multiline,
  onBlur,
  onFocus,
  style,
  trailing,
  ...props
}: InputProps) {
  const { colors } = useTheme();
  const [focused, setFocused] = useState(false);

  return (
    <View
      style={[
        {
          flexDirection: 'row',
          alignItems: multiline ? 'flex-start' : 'center',
          gap: 8,
          minHeight: multiline ? 96 : INPUT_HEIGHT,
          paddingHorizontal: 14,
          paddingVertical: multiline ? 10 : 0,
          borderRadius: radius.sm,
          borderWidth: 1,
          borderColor: invalid ? colors.negative : focused ? colors.accent : colors.lineStrong,
          backgroundColor: colors.control,
          opacity: editable ? 1 : 0.5,
        },
        containerStyle,
      ]}>
      {leading}
      <TextInput
        editable={editable}
        multiline={multiline}
        placeholderTextColor={colors.ink3}
        selectionColor={colors.accent}
        textAlignVertical={multiline ? 'top' : 'center'}
        {...props}
        onFocus={(event) => {
          setFocused(true);
          onFocus?.(event);
        }}
        onBlur={(event) => {
          setFocused(false);
          onBlur?.(event);
        }}
        style={[
          {
            flex: 1,
            minHeight: multiline ? 76 : INPUT_HEIGHT - 2,
            padding: 0,
            color: colors.ink1,
            fontFamily: mono ? fonts.mono : fonts.sans,
            fontSize: 16,
          },
          style,
        ]}
      />
      {trailing}
    </View>
  );
}
