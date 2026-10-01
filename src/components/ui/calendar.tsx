import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { IconButton } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { formatCapitalizedDate, formatWeekdays } from '@/lib/i18n/format';
import { useI18n } from '@/lib/i18n/provider';
import { useTheme } from '@/theme/theme-provider';

export type DateRangeValue = { from?: Date; to?: Date };

type CalendarProps =
  | {
      mode: 'single';
      selected?: Date;
      onSelect: (date: Date) => void;
      /** Month shown first; defaults to the selected date or today. */
      defaultMonth?: Date;
    }
  | {
      mode: 'range';
      selected?: DateRangeValue;
      onSelect: (range: DateRangeValue) => void;
      defaultMonth?: Date;
    };

const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());

/**
 * Month grid date picker, single day or range. A range is picked with two
 * taps; a third tap starts a new one.
 */
export function Calendar(props: CalendarProps) {
  const { colors } = useTheme();
  const { locale } = useI18n();
  const anchor =
    props.defaultMonth ??
    (props.mode === 'single' ? props.selected : (props.selected?.from ?? props.selected?.to)) ??
    new Date();
  const [month, setMonth] = useState(new Date(anchor.getFullYear(), anchor.getMonth(), 1));

  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const gridStart = new Date(first.getFullYear(), first.getMonth(), 1 - first.getDay());
  const days = Array.from(
    { length: 42 },
    (_, index) => new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + index),
  );
  // Drop a trailing week that belongs entirely to the next month.
  const visibleDays = days[35].getMonth() === month.getMonth() ? days : days.slice(0, 35);
  const today = new Date();

  const press = (day: Date) => {
    if (props.mode === 'single') {
      props.onSelect(day);
      return;
    }
    const { from, to } = props.selected ?? {};
    if (!from || (from && to)) props.onSelect({ from: day, to: undefined });
    else if (day < from) props.onSelect({ from: day, to: from });
    else props.onSelect({ from, to: day });
  };

  const stateOf = (day: Date) => {
    if (props.mode === 'single') {
      return { edge: Boolean(props.selected && sameDay(day, props.selected)), within: false };
    }
    const { from, to } = props.selected ?? {};
    const edge = Boolean((from && sameDay(day, from)) || (to && sameDay(day, to)));
    const within = Boolean(from && to && day > startOfDay(from) && day < startOfDay(to));
    return { edge, within };
  };

  const shift = (delta: number) =>
    setMonth(new Date(month.getFullYear(), month.getMonth() + delta, 1));

  return (
    <View style={{ gap: 8 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <IconButton
          accessibilityLabel="Previous month"
          variant="outline"
          size={32}
          icon={(icon) => <ChevronLeft {...icon} />}
          onPress={() => shift(-1)}
        />
        <Text font="sansMedium" size="sm">
          {formatCapitalizedDate(month, locale, { month: 'long', year: 'numeric' })}
        </Text>
        <IconButton
          accessibilityLabel="Next month"
          variant="outline"
          size={32}
          icon={(icon) => <ChevronRight {...icon} />}
          onPress={() => shift(1)}
        />
      </View>

      <View style={{ flexDirection: 'row' }}>
        {formatWeekdays(locale, 'narrow').map((weekday, index) => (
          <Text key={index} size="xs" color="ink3" align="center" style={{ flex: 1 }}>
            {weekday}
          </Text>
        ))}
      </View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        {visibleDays.map((day) => {
          const outside = day.getMonth() !== month.getMonth();
          const { edge, within } = stateOf(day);
          const isToday = sameDay(day, today);
          return (
            <Pressable
              key={day.toISOString()}
              accessibilityRole="button"
              accessibilityState={{ selected: edge }}
              onPress={() => press(day)}
              style={{
                width: `${100 / 7}%`,
                height: 40,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: within ? colors.accentSoft : 'transparent',
              }}>
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: edge ? colors.action : 'transparent',
                  borderWidth: isToday && !edge ? 1 : 0,
                  borderColor: colors.lineStrong,
                }}>
                <Text
                  font="mono"
                  size="sm"
                  color={edge ? 'actionForeground' : outside ? 'ink4' : 'ink1'}>
                  {day.getDate()}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
