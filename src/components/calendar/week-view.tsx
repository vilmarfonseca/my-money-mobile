import { Pressable, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { Card } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import {
  dateKey,
  formatLongDay,
  getWeekDays,
  isSameDay,
  sortItems,
} from '@/lib/calendar/calendar-utils';
import type { DueItem } from '@/lib/calendar/types';
import { formatWeekdayShort } from '@/lib/i18n/format';
import { useI18n } from '@/lib/i18n/provider';
import { useTheme } from '@/theme/theme-provider';
import { radius, shadows } from '@/theme/tokens';

import { DayDetail } from './day-detail';
import { dueTypeColors, withAlpha } from './type-colors';

export function WeekView({
  currentDate,
  selectedDate,
  today,
  itemsByDate,
  selectedItems,
  onSelectDate,
}: {
  currentDate: Date;
  selectedDate: Date;
  today: Date;
  itemsByDate: Record<string, DueItem[]>;
  selectedItems: DueItem[];
  onSelectDate: (date: Date) => void;
}) {
  const { locale, messages } = useI18n();
  const { colors } = useTheme();
  const days = getWeekDays(currentDate);
  const isSelectedInWeek = days.some((day) => isSameDay(day, selectedDate));

  return (
    <Card>
      {/* One column on phones: the seven days stack. */}
      <View style={{ gap: 12 }}>
        {days.map((day) => {
          const items = itemsByDate[dateKey(day)] ?? [];
          const isToday = isSameDay(day, today);
          const isSelected = isSameDay(day, selectedDate);

          return (
            <Pressable
              key={dateKey(day)}
              accessibilityRole="button"
              accessibilityLabel={formatLongDay(day, locale)}
              accessibilityState={{ selected: isSelected }}
              onPress={() => onSelectDate(day)}
              style={{
                padding: 12,
                borderRadius: radius.lg,
                borderWidth: 1,
                borderColor: isToday ? colors.accentSoft : colors.line,
                backgroundColor: isToday
                  ? colors.accentSoft
                  : isSelected
                    ? withAlpha(colors.accentSoft, 0.5)
                    : colors.control,
              }}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 16,
                }}>
                <View>
                  <Text font="sansMedium" size="xs" color="ink3" uppercase tracking={1.2}>
                    {formatWeekdayShort(day, locale)}
                  </Text>
                  <Text font="display" size="3xl" tight style={{ marginTop: 4 }}>
                    {day.getDate()}
                  </Text>
                </View>
                {isToday ? (
                  <View
                    style={{
                      paddingHorizontal: 10,
                      paddingVertical: 4,
                      borderRadius: radius.pill,
                      backgroundColor: colors.action,
                    }}>
                    <Text font="sansMedium" size="xs" color="actionForeground">
                      {messages.calendar.today}
                    </Text>
                  </View>
                ) : null}
              </View>

              <View style={{ gap: 8 }}>
                {items.length > 0 ? (
                  sortItems(items).map((item) => (
                    <View
                      key={item.id}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 8,
                        padding: 12,
                        borderRadius: radius.lg,
                        borderWidth: 1,
                        borderColor: colors.line,
                        backgroundColor: colors.surface1,
                        boxShadow: shadows.sm,
                      }}>
                      <View
                        style={{
                          width: 10,
                          height: 10,
                          borderRadius: 5,
                          backgroundColor: dueTypeColors(item.type, colors).dot,
                        }}
                      />
                      <Text font="sansMedium" size="xs" numberOfLines={1} style={{ flex: 1 }}>
                        {item.title}
                      </Text>
                    </View>
                  ))
                ) : (
                  <View
                    style={{
                      padding: 12,
                      borderRadius: radius.lg,
                      borderWidth: 1,
                      borderStyle: 'dashed',
                      borderColor: colors.line,
                    }}>
                    <Text size="sm" color="ink3">
                      {messages.calendar.noDueDates}
                    </Text>
                  </View>
                )}
              </View>
            </Pressable>
          );
        })}
      </View>

      {isSelectedInWeek ? (
        <Animated.View entering={FadeInDown.duration(280)} style={{ marginTop: 16 }}>
          <DayDetail selectedDate={selectedDate} selectedItems={selectedItems} />
        </Animated.View>
      ) : null}
    </Card>
  );
}
