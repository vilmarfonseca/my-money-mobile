import { CalendarDays } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, type StyleProp, type ViewStyle } from 'react-native';

import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Sheet } from '@/components/ui/sheet';
import { formatDateParam, parseDateParam } from '@/lib/date-range';
import type { AppLocale } from '@/lib/i18n/config';
import { useI18n } from '@/lib/i18n/provider';
import { useTheme } from '@/theme/theme-provider';

type DatePartsOrder = 'dmy' | 'mdy';

const orderFor = (locale: AppLocale): DatePartsOrder => (locale === 'pt-BR' ? 'dmy' : 'mdy');

export function dateInputPlaceholder(locale: AppLocale) {
  return locale === 'pt-BR' ? 'dd/mm/aaaa' : 'mm/dd/yyyy';
}

/** "2026-07-08" to "08/07/2026" (dmy) or "07/08/2026" (mdy). */
function isoToDisplay(iso: string, order: DatePartsOrder) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) return '';
  const [, year, month, day] = match;
  return order === 'dmy' ? `${day}/${month}/${year}` : `${month}/${day}/${year}`;
}

function groupDigits(digits: string) {
  return [digits.slice(0, 2), digits.slice(2, 4), digits.slice(4, 8)].filter(Boolean);
}

/** Complete 8-digit entry to an ISO date, or "" when partial or invalid. */
function digitsToIso(digits: string, order: DatePartsOrder) {
  if (digits.length !== 8) return '';
  const [first, second, year] = [digits.slice(0, 2), digits.slice(2, 4), digits.slice(4, 8)];
  const [day, month] = order === 'dmy' ? [first, second] : [second, first];
  const date = new Date(Number(year), Number(month) - 1, Number(day));
  const valid =
    date.getFullYear() === Number(year) &&
    date.getMonth() === Number(month) - 1 &&
    date.getDate() === Number(day);
  return valid ? `${year}-${month}-${day}` : '';
}

/**
 * Date field: typed in the app locale's format (dd/mm/yyyy or mm/dd/yyyy) or
 * picked from the calendar sheet behind the trailing icon. The bound value is
 * always an ISO date ("yyyy-mm-dd"), or "" while incomplete.
 */
export function DateInput({
  accessibilityLabel,
  disabled,
  onChange,
  style,
  value,
}: {
  accessibilityLabel?: string;
  disabled?: boolean;
  onChange: (iso: string) => void;
  style?: StyleProp<ViewStyle>;
  value: string;
}) {
  const { locale } = useI18n();
  const { colors } = useTheme();
  const order = orderFor(locale);
  const [text, setText] = useState(() => isoToDisplay(value, order));
  const [lastValue, setLastValue] = useState(value);
  const [pickerOpen, setPickerOpen] = useState(false);

  // Adopt outside changes (the calendar, a form reset) without clobbering
  // typing in progress when the parent echoes back what was just emitted.
  if (value !== lastValue) {
    setLastValue(value);
    if (value !== digitsToIso(text.replace(/\D/g, ''), order)) {
      setText(isoToDisplay(value, order));
    }
  }

  return (
    <>
      <Input
        mono
        accessibilityLabel={accessibilityLabel}
        editable={!disabled}
        keyboardType="number-pad"
        placeholder={dateInputPlaceholder(locale)}
        value={text}
        containerStyle={style}
        onChangeText={(next) => {
          const digits = next.replace(/\D/g, '').slice(0, 8);
          setText(groupDigits(digits).join('/'));
          const iso = digitsToIso(digits, order);
          setLastValue(iso);
          onChange(iso);
        }}
        trailing={
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={accessibilityLabel}
            disabled={disabled}
            hitSlop={10}
            onPress={() => setPickerOpen(true)}>
            <CalendarDays size={18} color={colors.ink3} />
          </Pressable>
        }
      />
      <Sheet open={pickerOpen} onOpenChange={setPickerOpen}>
        <Calendar
          mode="single"
          selected={parseDateParam(value) ?? undefined}
          onSelect={(date) => {
            onChange(formatDateParam(date));
            setPickerOpen(false);
          }}
        />
      </Sheet>
    </>
  );
}
