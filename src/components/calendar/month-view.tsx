import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';

import { Card } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import {
  dateKey,
  formatLongDay,
  getMonthGrid,
  isSameDay,
  isSameMonth,
} from '@/lib/calendar/calendar-utils';
import type { DueItem } from '@/lib/calendar/types';
import { formatWeekdays } from '@/lib/i18n/format';
import { useI18n } from '@/lib/i18n/provider';
import { useTheme } from '@/theme/theme-provider';
import { radius } from '@/theme/tokens';

import { CalendarLegend } from './calendar-legend';
import { SelectedDayCard } from './selected-day-card';
import { dueTypeColors } from './type-colors';

const GAP = 4;

export function MonthView({
  currentDate,
  selectedDate,
  today,
  itemsByDate,
  selectedItems,
  onSelectDate,
  mobileNav,
}: {
  currentDate: Date;
  selectedDate: Date;
  today: Date;
  itemsByDate: Record<string, DueItem[]>;
  selectedItems: DueItem[];
  onSelectDate: (date: Date) => void;
  /** Range navigation, hosted inside the card on phones (design `.calnav`). */
  mobileNav?: ReactNode;
}) {
  const { locale } = useI18n();
  const { colors } = useTheme();
  const days = getMonthGrid(currentDate);
  const weekdays = formatWeekdays(locale);
  // The grid is always six weeks; a week wholly outside the month collapses.
  const weeks = Array.from({ length: 6 }, (_, index) => days.slice(index * 7, index * 7 + 7)).filter(
    (week) => week.some((day) => isSameMonth(day, currentDate)),
  );

  return (
    <View style={{ gap: 16 }}>
      <Card padding={14}>
        {mobileNav ? <View style={{ paddingBottom: 12 }}>{mobileNav}</View> : null}
        <View style={{ flexDirection: 'row', gap: GAP }}>
          {weekdays.map((day) => (
            <Text
              key={day}
              font="sansMedium"
              size="2xs"
              color="ink4"
              uppercase
              tracking={1}
              align="center"
              numberOfLines={1}
              style={{ flex: 1, paddingVertical: 4 }}>
              {day}
            </Text>
          ))}
        </View>

        <View style={{ gap: GAP, marginTop: 4 }}>
          {weeks.map((week) => (
            <View key={dateKey(week[0])} style={{ flexDirection: 'row', gap: GAP }}>
              {week.map((day) => {
                const key = dateKey(day);

                if (!isSameMonth(day, currentDate)) {
                  return <View key={key} style={{ flex: 1 }} />;
                }

                const items = itemsByDate[key] ?? [];
                const isSelected = isSameDay(day, selectedDate);
                const isToday = isSameDay(day, today);

                return (
                  <Pressable
                    key={key}
                    accessibilityRole="button"
                    accessibilityLabel={formatLongDay(day, locale)}
                    accessibilityState={{ selected: isSelected }}
                    onPress={() => onSelectDate(day)}
                    // Bare centered cells: only the selected day gets the plum fill.
                    style={{
                      flex: 1,
                      aspectRatio: 1,
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: radius.sm,
                      backgroundColor: isSelected ? colors.accentSoft : 'transparent',
                    }}>
                    <View
                      // Today is marked with a ring on the numeral, not a filled cell.
                      style={
                        isToday && !isSelected
                          ? {
                              width: 26,
                              height: 26,
                              borderRadius: 13,
                              borderWidth: 1,
                              borderColor: colors.accent,
                              alignItems: 'center',
                              justifyContent: 'center',
                            }
                          : undefined
                      }>
                      <Text
                        font={isSelected ? 'sansSemiBold' : 'sans'}
                        size="sm"
                        color={isSelected ? 'accentSoftFg' : 'ink1'}
                        style={{ fontVariant: ['tabular-nums'] }}>
                        {day.getDate()}
                      </Text>
                    </View>
                    {/* The squares are too small for event pills: one dot per day. */}
                    {items.length > 0 ? (
                      <View
                        style={{
                          position: 'absolute',
                          left: 0,
                          right: 0,
                          bottom: 4,
                          alignItems: 'center',
                        }}>
                        <View
                          style={{
                            width: 6,
                            height: 6,
                            borderRadius: 3,
                            backgroundColor: dueTypeColors(items[0].type, colors).dot,
                          }}
                        />
                      </View>
                    ) : null}
                  </Pressable>
                );
              })}
            </View>
          ))}
        </View>

        <CalendarLegend />
      </Card>

      <SelectedDayCard selectedDate={selectedDate} selectedItems={selectedItems} />
    </View>
  );
}
