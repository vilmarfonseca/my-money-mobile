import {
  ArrowDown,
  ArrowUp,
  ChevronDown,
  Info,
  Lock,
  Minus,
  Plus,
  X,
  type LucideIcon,
} from 'lucide-react-native';
import { useState, type ReactNode } from 'react';
import { Pressable, ScrollView, TextInput, useWindowDimensions, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { DateInput } from '@/components/ui/date-input';
import { FieldLabel, FormField } from '@/components/ui/form-field';
import { Input, INPUT_HEIGHT } from '@/components/ui/input';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { OptionList } from '@/components/ui/select';
import { Sheet } from '@/components/ui/sheet';
import { Text } from '@/components/ui/text';
import type { AppLocale } from '@/lib/i18n/config';
import { formatMonthLong } from '@/lib/i18n/format';
import { useI18n } from '@/lib/i18n/provider';
import {
  cleanLabel,
  monthIndexes,
  RECURRENCE_INTERVAL_MAX,
  RECURRENCE_INTERVAL_MIN,
  type TransactionFormType,
} from '@/lib/transactions/transaction-utils';
import { useTheme } from '@/theme/theme-provider';
import { fonts, radius } from '@/theme/tokens';

/** Background and text colour of a selected-value chip. */
export type PillColors = { bg: string; fg: string };

/** Expense/Income toggle, or a locked pill when the type cannot change. */
export function TypeSelector({
  locked,
  onValueChange,
  value,
}: {
  locked: boolean;
  onValueChange: (value: TransactionFormType) => void;
  value: TransactionFormType;
}) {
  const { messages } = useI18n();
  const { colors } = useTheme();

  if (locked) {
    return (
      <View
        style={{
          alignSelf: 'flex-start',
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          height: 44,
          paddingHorizontal: 20,
          borderRadius: radius.pill,
          borderWidth: 1,
          borderColor: colors.line,
          backgroundColor: colors.control,
        }}>
        <Lock size={16} color={colors.ink3} />
        <Text font="sansMedium" size="sm">
          {value === 'income' ? messages.common.income : messages.common.expense}
        </Text>
      </View>
    );
  }

  return (
    <SegmentedControl<TransactionFormType>
      size="xl"
      accessibilityLabel={messages.transactions.transactionType}
      options={[
        {
          value: 'expense',
          label: messages.common.expense,
          icon: (props) => <ArrowUp {...props} />,
        },
        {
          value: 'income',
          label: messages.common.income,
          icon: (props) => <ArrowDown {...props} />,
        },
      ]}
      value={value}
      onValueChange={onValueChange}
    />
  );
}

/** Plum uppercase card eyebrow with an icon, shared by every section card. */
export function SectionDivider({ icon: Icon, title }: { icon?: LucideIcon; title: string }) {
  const { colors } = useTheme();

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      {Icon ? <Icon size={14} color={colors.accentSoftFg} /> : null}
      <Text font="sansSemiBold" size="2xs" color="accentSoftFg" uppercase tracking={1}>
        {title}
      </Text>
    </View>
  );
}

/** Info button beside a field label; the web's hover tooltip, as a sheet. */
export function FieldInfo({ body, title }: { body: string; title: string }) {
  const { colors } = useTheme();
  const [open, setOpen] = useState(false);

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={title}
        hitSlop={12}
        onPress={() => setOpen(true)}>
        <Info size={14} color={colors.ink3} />
      </Pressable>
      <Sheet open={open} onOpenChange={setOpen} title={title}>
        <Text size="sm" color="ink2" style={{ lineHeight: 22 }}>
          {body}
        </Text>
      </Sheet>
    </>
  );
}

export function DateField({
  disabled = false,
  label,
  onChange,
  optional = false,
  value,
}: {
  disabled?: boolean;
  label: string;
  onChange: (value: string) => void;
  optional?: boolean;
  value: string;
}) {
  return (
    <FormField label={label} optional={optional}>
      <DateInput accessibilityLabel={label} disabled={disabled} value={value} onChange={onChange} />
    </FormField>
  );
}

/** Single-select month picker (values 1-12), rendered with localized names. */
export function MonthPicker({
  info,
  label,
  locale,
  onChange,
  placeholder,
  value,
}: {
  info?: ReactNode;
  label: string;
  locale: AppLocale;
  onChange: (month: number) => void;
  placeholder: string;
  value: number;
}) {
  const monthNames = monthIndexes.map((index) =>
    formatMonthLong(new Date(2020, index - 1, 1), locale),
  );
  const selectedName = value >= 1 && value <= 12 ? monthNames[value - 1] : '';

  return (
    <PillPicker
      label={label}
      info={info}
      options={monthNames}
      selected={selectedName ? [selectedName] : []}
      onChange={(selected) => {
        const index = monthNames.indexOf(selected[0] ?? '');
        if (index >= 0) onChange(index + 1);
      }}
      placeholder={placeholder}
      plainSingleValue
      allowCreate={false}
    />
  );
}

/**
 * Field that shows its selection as chips and opens a searchable option
 * sheet (the web's popover). With `allowCreate`, text that matches no option
 * can be added as a new one.
 */
export function PillPicker({
  allowCreate = true,
  chipColors,
  chipTitle,
  getOptionLabel,
  info,
  label,
  multiple = false,
  onChange,
  onChipPress,
  optional = false,
  options,
  placeholder,
  plainSingleValue = false,
  selected,
}: {
  allowCreate?: boolean;
  /** Colours per selected chip (a status tone, the category's custom colour). */
  chipColors?: (value: string) => PillColors | undefined;
  /** What pressing a chip does, for screen readers. */
  chipTitle?: string;
  getOptionLabel?: (option: string) => string;
  /** Info node rendered beside the field label. */
  info?: ReactNode;
  label: string;
  multiple?: boolean;
  onChange: (selected: string[]) => void;
  /** Makes selected chips pressable (e.g. to open the category editor). */
  onChipPress?: (value: string) => void;
  optional?: boolean;
  options: string[];
  placeholder: string;
  plainSingleValue?: boolean;
  selected: string[];
}) {
  const { messages } = useI18n();
  const { colors } = useTheme();
  const { height } = useWindowDimensions();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const selectedKeys = new Set(selected.map((item) => item.toLowerCase()));
  const normalizedQuery = query.trim().toLowerCase();
  const labelOf = (option: string) => getOptionLabel?.(option) ?? option;
  const matches = options.filter(
    (option) =>
      option.toLowerCase().includes(normalizedQuery) ||
      labelOf(option).toLowerCase().includes(normalizedQuery),
  );
  const canCreate =
    allowCreate &&
    cleanLabel(query).length > 0 &&
    !options.some((option) => option.toLowerCase() === normalizedQuery);

  const updateOpen = (next: boolean) => {
    if (!next) setQuery('');
    setOpen(next);
  };

  const selectValue = (value: string) => {
    const cleanValue = cleanLabel(value);
    if (!cleanValue) return;
    if (
      !allowCreate &&
      !options.some((option) => option.toLowerCase() === cleanValue.toLowerCase())
    ) {
      return;
    }

    if (!multiple) {
      onChange([cleanValue]);
      updateOpen(false);
      return;
    }

    if (selectedKeys.has(cleanValue.toLowerCase())) {
      onChange(selected.filter((item) => item.toLowerCase() !== cleanValue.toLowerCase()));
    } else {
      onChange([...selected, cleanValue]);
    }
    setQuery('');
  };

  const removeValue = (value: string) => {
    onChange(selected.filter((item) => item !== value));
  };

  return (
    <View style={{ gap: 10 }}>
      <FieldLabel optional={optional} info={info}>
        {label}
      </FieldLabel>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        onPress={() => updateOpen(true)}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          minHeight: INPUT_HEIGHT,
          paddingHorizontal: 14,
          borderRadius: radius.sm,
          borderWidth: 1,
          borderColor: colors.lineStrong,
          backgroundColor: colors.control,
        }}>
        <View
          style={{
            flex: 1,
            flexDirection: 'row',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: 6,
            paddingVertical: 6,
          }}>
          {selected.length > 0 ? (
            selected.map((item) =>
              plainSingleValue ? (
                <Text key={item} size="base" numberOfLines={1} style={{ flexShrink: 1 }}>
                  {labelOf(item)}
                </Text>
              ) : (
                <ValueChip
                  key={item}
                  colors={chipColors?.(item)}
                  label={labelOf(item)}
                  title={chipTitle}
                  onPress={onChipPress ? () => onChipPress(item) : undefined}
                />
              ),
            )
          ) : (
            <Text size="base" color="ink3" numberOfLines={1} style={{ flexShrink: 1 }}>
              {placeholder}
            </Text>
          )}
        </View>
        <ChevronDown size={20} color={colors.ink3} />
      </Pressable>

      <Sheet
        open={open}
        onOpenChange={updateOpen}
        title={label}
        scroll={false}
        footer={
          // A multi-select stays open while options are toggled.
          multiple ? (
            <Button
              style={{ flex: 1 }}
              size="lg"
              label={messages.common.apply}
              onPress={() => updateOpen(false)}
            />
          ) : undefined
        }>
        {/* No autofocus: the keyboard would cover the options on open. */}
        <Input
          autoCorrect={false}
          placeholder={placeholder}
          returnKeyType="done"
          value={query}
          onChangeText={setQuery}
          // Without free text, the return key takes the top match rather
          // than the raw query, which `selectValue` would reject.
          onSubmitEditing={() =>
            selectValue((allowCreate ? query || matches[0] : matches[0]) ?? '')
          }
        />
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          // Short enough to stay on screen above the keyboard.
          style={{ marginTop: 8, maxHeight: Math.min(288, height * 0.3) }}>
          <OptionList
            options={matches.map((option) => ({ label: labelOf(option), value: option }))}
            selected={matches.filter((option) => selectedKeys.has(option.toLowerCase()))}
            onSelect={selectValue}
          />
          {canCreate ? (
            <Pressable
              accessibilityRole="button"
              onPress={() => selectValue(query)}
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
                minHeight: 48,
                paddingVertical: 10,
                borderTopWidth: matches.length > 0 ? 1 : 0,
                borderTopColor: colors.line,
                opacity: pressed ? 0.7 : 1,
              })}>
              <Plus size={16} color={colors.accent} />
              <Text font="sansMedium" size="base" numberOfLines={1} style={{ flex: 1 }}>
                {messages.transactions.createOption(cleanLabel(query))}
              </Text>
            </Pressable>
          ) : null}
        </ScrollView>
      </Sheet>

      {multiple && selected.length > 0 ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {selected.map((item) => (
            <Pressable
              key={item}
              accessibilityRole="button"
              accessibilityLabel={item}
              hitSlop={6}
              onPress={() => removeValue(item)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
                maxWidth: '100%',
                height: 28,
                paddingHorizontal: 10,
                borderRadius: radius.pill,
                borderWidth: 1,
                borderColor: colors.controlBorder,
                backgroundColor: colors.control,
              }}>
              <Text
                font="sansSemiBold"
                size="xs"
                color="ink2"
                numberOfLines={1}
                style={{ flexShrink: 1 }}>
                {item}
              </Text>
              <X size={14} color={colors.ink2} />
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}

/** Selected value inside a picker field: a soft pill with a leading dot. */
function ValueChip({
  colors: custom,
  label,
  onPress,
  title,
}: {
  colors?: PillColors;
  label: string;
  onPress?: () => void;
  title?: string;
}) {
  const { colors } = useTheme();
  const tone = custom ?? { bg: colors.accentSoft, fg: colors.accentSoftFg };
  const content = (
    <>
      <View
        style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: tone.fg, opacity: 0.7 }}
      />
      <Text font="sansMedium" size="sm" color={tone.fg} numberOfLines={1} style={{ flexShrink: 1 }}>
        {label}
      </Text>
    </>
  );
  const style = {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    maxWidth: '100%',
    height: 28,
    paddingHorizontal: 12,
    borderRadius: radius.pill,
    backgroundColor: tone.bg,
  } as const;

  if (onPress) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={title ? `${title}: ${label}` : label}
        hitSlop={6}
        onPress={onPress}
        style={({ pressed }) => [style, { opacity: pressed ? 0.75 : 1 }]}>
        {content}
      </Pressable>
    );
  }

  return <View style={style}>{content}</View>;
}

export function InstallmentsField({
  onChange,
  value,
}: {
  onChange: (value: number) => void;
  value: number;
}) {
  const { messages } = useI18n();
  const { colors } = useTheme();
  const updateValue = (delta: number) => {
    onChange(Math.max(1, Math.min(240, value + delta)));
  };

  const stepper = (delta: number, label: string, Icon: LucideIcon, disabled: boolean) => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={() => updateValue(delta)}
      style={({ pressed }) => ({
        width: INPUT_HEIGHT,
        height: INPUT_HEIGHT,
        alignItems: 'center',
        justifyContent: 'center',
        opacity: pressed ? 0.6 : 1,
      })}>
      <Icon size={16} color={disabled ? colors.ink4 : delta < 0 ? colors.ink2 : colors.ink1} />
    </Pressable>
  );

  return (
    <View style={{ gap: 10 }}>
      <FieldLabel>{messages.transactions.installments}</FieldLabel>
      <View
        style={{
          alignSelf: 'flex-start',
          flexDirection: 'row',
          alignItems: 'center',
          height: INPUT_HEIGHT,
          borderRadius: radius.pill,
          borderWidth: 1,
          borderColor: colors.lineStrong,
          backgroundColor: colors.control,
        }}>
        {stepper(-1, messages.transactions.decreaseInstallments, Minus, value <= 1)}
        <Text font="mono" size="base" align="center" style={{ minWidth: 48 }}>
          {value}
        </Text>
        {stepper(1, messages.transactions.increaseInstallments, Plus, value >= 240)}
      </View>
      <Text size="sm" color="ink3">
        {messages.transactions.installmentsCount(value)}
      </Text>
    </View>
  );
}

/** "Repeat every (days)" pill for the custom recurrence frequency. */
export function RecurrenceIntervalField({
  onChange,
  value,
}: {
  onChange: (days: number) => void;
  value: number;
}) {
  const { messages } = useI18n();
  const { colors } = useTheme();
  // What is being typed; the bound value only follows once it is a number,
  // so clearing the field to retype does not snap it back to the minimum.
  const [text, setText] = useState(String(value));

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        height: 40,
        paddingHorizontal: 16,
        borderRadius: radius.pill,
        borderWidth: 1,
        borderColor: colors.lineStrong,
        backgroundColor: colors.surface1,
      }}>
      <Text size="sm" color="ink3">
        {messages.transactions.repeatIntervalLabel}
      </Text>
      <TextInput
        accessibilityLabel={messages.transactions.repeatIntervalLabel}
        keyboardType="number-pad"
        maxLength={3}
        selectTextOnFocus
        selectionColor={colors.accent}
        value={text}
        onChangeText={(next) => {
          const digits = next.replace(/\D/g, '');
          if (!digits) {
            setText('');
            return;
          }
          const days = Math.max(
            RECURRENCE_INTERVAL_MIN,
            Math.min(RECURRENCE_INTERVAL_MAX, Number(digits)),
          );
          setText(String(days));
          onChange(days);
        }}
        onBlur={() => setText(String(value))}
        style={{
          width: 56,
          padding: 0,
          textAlign: 'center',
          color: colors.ink1,
          fontFamily: fonts.sansMedium,
          fontSize: 14,
          fontVariant: ['tabular-nums'],
        }}
      />
    </View>
  );
}
