import { Check, ChevronDown } from 'lucide-react-native';
import { useState, type ReactNode } from 'react';
import { Pressable, View, type StyleProp, type ViewStyle } from 'react-native';

import { INPUT_HEIGHT } from '@/components/ui/input';
import { Sheet } from '@/components/ui/sheet';
import { Text } from '@/components/ui/text';
import { useTheme } from '@/theme/theme-provider';
import { radius } from '@/theme/tokens';

export type SelectOption<T extends string = string> = {
  label: string;
  value: T;
  /** Secondary line under the label in the option list. */
  description?: string;
  /** Leading node in the option row (icon, colour dot). */
  leading?: ReactNode;
  disabled?: boolean;
};

type SelectProps<T extends string> = {
  value: T | null | undefined;
  onValueChange: (value: T) => void;
  options: ReadonlyArray<SelectOption<T>>;
  placeholder?: string;
  /** Heading of the option sheet; defaults to the placeholder. */
  title?: string;
  disabled?: boolean;
  accessibilityLabel?: string;
  /** Custom rendering of the selected value inside the field. */
  renderValue?: (option: SelectOption<T>) => ReactNode;
  style?: StyleProp<ViewStyle>;
};

/**
 * Field that opens its options in a bottom sheet: the native stand-in for
 * the web app's `<Select>` (and for any single-choice popover).
 */
export function Select<T extends string = string>({
  accessibilityLabel,
  disabled,
  onValueChange,
  options,
  placeholder,
  renderValue,
  style,
  title,
  value,
}: SelectProps<T>) {
  const { colors } = useTheme();
  const [open, setOpen] = useState(false);
  const selected = options.find((option) => option.value === value);

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? placeholder}
        disabled={disabled}
        onPress={() => setOpen(true)}
        style={[
          {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            height: INPUT_HEIGHT,
            paddingHorizontal: 14,
            borderRadius: radius.sm,
            borderWidth: 1,
            borderColor: colors.lineStrong,
            backgroundColor: colors.control,
            opacity: disabled ? 0.5 : 1,
          },
          style,
        ]}>
        <View style={{ flex: 1 }}>
          {selected ? (
            (renderValue?.(selected) ?? (
              <Text size="base" numberOfLines={1}>
                {selected.label}
              </Text>
            ))
          ) : (
            <Text size="base" color="ink3" numberOfLines={1}>
              {placeholder}
            </Text>
          )}
        </View>
        <ChevronDown size={16} color={colors.ink3} />
      </Pressable>

      <Sheet open={open} onOpenChange={setOpen} title={title ?? placeholder}>
        <OptionList
          options={options}
          selected={value ? [value] : []}
          onSelect={(next) => {
            onValueChange(next);
            setOpen(false);
          }}
        />
      </Sheet>
    </>
  );
}

/** Rows of choices with a check on the selected ones; used inside sheets. */
export function OptionList<T extends string = string>({
  onSelect,
  options,
  selected,
}: {
  onSelect: (value: T) => void;
  options: ReadonlyArray<SelectOption<T>>;
  selected: ReadonlyArray<T>;
}) {
  const { colors } = useTheme();

  return (
    <View>
      {options.map((option, index) => {
        const active = selected.includes(option.value);
        return (
          <Pressable
            key={option.value}
            accessibilityRole="button"
            accessibilityState={{ selected: active, disabled: Boolean(option.disabled) }}
            disabled={option.disabled}
            onPress={() => onSelect(option.value)}
            style={({ pressed }) => ({
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
              minHeight: 48,
              paddingVertical: 10,
              borderTopWidth: index === 0 ? 0 : 1,
              borderTopColor: colors.line,
              opacity: option.disabled ? 0.45 : pressed ? 0.7 : 1,
            })}>
            {option.leading}
            <View style={{ flex: 1 }}>
              <Text size="base" font={active ? 'sansMedium' : 'sans'}>
                {option.label}
              </Text>
              {option.description ? (
                <Text size="xs" color="ink3">
                  {option.description}
                </Text>
              ) : null}
            </View>
            {active ? <Check size={18} color={colors.accentSoftFg} /> : null}
          </Pressable>
        );
      })}
    </View>
  );
}
