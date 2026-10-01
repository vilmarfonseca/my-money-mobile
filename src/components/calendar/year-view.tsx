import { Pressable, View } from 'react-native';

import { Card } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { dateKey } from '@/lib/calendar/calendar-utils';
import type { DueItem } from '@/lib/calendar/types';
import { formatMonthLong, formatMonthYear, formatWeekdays } from '@/lib/i18n/format';
import { useI18n } from '@/lib/i18n/provider';
import { useTheme } from '@/theme/theme-provider';
import { radius, shadows } from '@/theme/tokens';

import { useCalendarStrings } from './calendar-strings';
import { dueTypeColors, withAlpha } from './type-colors';

const GAP = 4;

export function YearView({
  currentDate,
  itemsByDate,
  onOpenMonth,
}: {
  currentDate: Date;
  itemsByDate: Record<string, DueItem[]>;
  onOpenMonth: (date: Date) => void;
}) {
  const { locale } = useI18n();
  const { colors } = useTheme();
  const strings = useCalendarStrings();
  const year = currentDate.getFullYear();
  const weekdays = formatWeekdays(locale, 'narrow');

  return (
    <Card>
      {/* One column on phones: the twelve months stack. */}
      <View style={{ gap: 16 }}>
        {Array.from({ length: 12 }, (_, monthIndex) => {
          const monthDate = new Date(year, monthIndex, 1);
          const startWeekday = monthDate.getDay();
          const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
          const days = Array.from(
            { length: daysInMonth },
            (_, index) => new Date(year, monthIndex, index + 1),
          );
          const monthItems = days.flatMap((day) => itemsByDate[dateKey(day)] ?? []);
          // Leading blanks, the days, then blanks to square off the last week.
          const cells: Array<Date | null> = [
            ...Array.from({ length: startWeekday }, () => null),
            ...days,
          ];
          while (cells.length % 7 !== 0) cells.push(null);
          const weeks = Array.from({ length: cells.length / 7 }, (_, index) =>
            cells.slice(index * 7, index * 7 + 7),
          );

          return (
            <Pressable
              key={monthIndex}
              accessibilityRole="button"
              accessibilityLabel={formatMonthYear(monthDate, locale)}
              onPress={() => onOpenMonth(monthDate)}
              style={({ pressed }) => ({
                padding: 16,
                borderRadius: radius.xl,
                borderWidth: 1,
                borderColor: colors.line,
                backgroundColor: colors.surface1,
                boxShadow: shadows.sm,
                opacity: pressed ? 0.85 : 1,
              })}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'baseline',
                  justifyContent: 'space-between',
                  marginBottom: 12,
                }}>
                <Text font="display" size="2xl" tight>
                  {formatMonthLong(monthDate, locale)}
                </Text>
                <Text font="mono" size="xs" color="ink3">
                  {strings.monthDue(monthItems.length)}
                </Text>
              </View>

              <View style={{ gap: GAP }}>
                <View style={{ flexDirection: 'row', gap: GAP }}>
                  {weekdays.map((day, index) => (
                    <Text
                      key={index}
                      font="mono"
                      size="xs"
                      color="ink3"
                      align="center"
                      style={{ flex: 1 }}>
                      {day}
                    </Text>
                  ))}
                </View>
                {weeks.map((week, weekIndex) => (
                  <View key={weekIndex} style={{ flexDirection: 'row', gap: GAP }}>
                    {week.map((day, dayIndex) => {
                      if (!day) return <View key={dayIndex} style={{ flex: 1 }} />;

                      const items = itemsByDate[dateKey(day)] ?? [];
                      const hasItems = items.length > 0;

                      return (
                        <View
                          key={dayIndex}
                          style={{
                            flex: 1,
                            aspectRatio: 1,
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: radius.sm,
                            borderWidth: 1,
                            borderColor: hasItems ? colors.line : 'transparent',
                            backgroundColor: hasItems
                              ? withAlpha(colors.accentSoft, 0.25)
                              : 'transparent',
                          }}>
                          <Text font="mono" size="xs" color={hasItems ? 'ink1' : 'ink3'}>
                            {day.getDate()}
                          </Text>
                          {hasItems ? (
                            <View style={{ flexDirection: 'row', gap: 2, marginTop: 2 }}>
                              {items.slice(0, 3).map((item) => (
                                <View
                                  key={item.id}
                                  style={{
                                    width: 4,
                                    height: 4,
                                    borderRadius: 2,
                                    backgroundColor: dueTypeColors(item.type, colors).dot,
                                  }}
                                />
                              ))}
                            </View>
                          ) : null}
                        </View>
                      );
                    })}
                  </View>
                ))}
              </View>
            </Pressable>
          );
        })}
      </View>
    </Card>
  );
}
