import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, View, type ViewStyle } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { IconButton } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Chip } from '@/components/ui/chip';
import { Text } from '@/components/ui/text';
import { formatWeekdays } from '@/lib/i18n/format';
import { useI18n } from '@/lib/i18n/provider';
import type { PayoutCalendarData } from '@/lib/income/income-queries';
import { useTheme } from '@/theme/theme-provider';
import { radius, shadows } from '@/theme/tokens';

type PayoutCalendarCardProps = {
  calendar: PayoutCalendarData;
};

const COLUMNS = 7;

export function PayoutCalendarCard({ calendar }: PayoutCalendarCardProps) {
  const { formatCurrency, locale, messages } = useI18n();
  const { colors } = useTheme();
  const localizedWeekdays = formatWeekdays(locale);
  // Monday first, one letter each (the phone form of the web's 3 letters).
  const weekdays = [...localizedWeekdays.slice(1), localizedWeekdays[0]].map((day) =>
    day.slice(0, 1),
  );
  const [monthIndex, setMonthIndex] = useState(calendar.initialMonthIndex);
  const [selectedDay, setSelectedDay] = useState(calendar.initialSelectedDay);
  const month = calendar.months[monthIndex] ?? calendar.months[0];
  const selectedPayouts = month.payouts.filter((payout) => payout.day === selectedDay);
  const hasSelectedPayouts = selectedPayouts.length > 0;
  // `max-w-10` while the detail panel is open, `max-w-12` otherwise.
  const cellMaxWidth = hasSelectedPayouts ? 40 : 48;

  const cells: Array<number | null> = [
    ...Array.from({ length: month.startOffset }, () => null),
    ...Array.from({ length: month.days }, (_, index) => index + 1),
  ];
  while (cells.length % COLUMNS !== 0) cells.push(null);
  const weeks = Array.from({ length: cells.length / COLUMNS }, (_, index) =>
    cells.slice(index * COLUMNS, (index + 1) * COLUMNS),
  );

  const selectMonth = (nextIndex: number) => {
    setMonthIndex(nextIndex);
    setSelectedDay(1);
  };

  return (
    // The section header floats above its own card.
    <View>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 12,
          marginTop: 4,
          marginBottom: 12,
          paddingHorizontal: 6,
        }}>
        <Text font="display" size="2xl" tight style={{ flex: 1 }}>
          {messages.income.payoutCalendar} · {month.label}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <IconButton
            accessibilityLabel={messages.calendar.previousRange}
            variant="outline"
            size={28}
            disabled={monthIndex === 0}
            icon={(props) => <ChevronLeft {...props} size={16} />}
            onPress={() => selectMonth(monthIndex - 1)}
          />
          <IconButton
            accessibilityLabel={messages.calendar.nextRange}
            variant="outline"
            size={28}
            disabled={monthIndex === calendar.months.length - 1}
            icon={(props) => <ChevronRight {...props} size={16} />}
            onPress={() => selectMonth(monthIndex + 1)}
          />
        </View>
      </View>

      <Card>
        <View style={{ gap: 6 }}>
          <View style={{ flexDirection: 'row', gap: 6 }}>
            {weekdays.map((weekday, index) => (
              <Text
                key={index}
                font="sansMedium"
                size="xs"
                color="ink3"
                align="center"
                style={{ flex: 1, paddingBottom: 4 }}>
                {weekday}
              </Text>
            ))}
          </View>
          {weeks.map((week, weekIndex) => (
            <View key={weekIndex} style={{ flexDirection: 'row', gap: 6 }}>
              {week.map((day, dayIndex) => {
                if (day === null) return <View key={`empty-${dayIndex}`} style={{ flex: 1 }} />;

                const payouts = month.payouts.filter((item) => item.day === day);
                const isSelected = day === selectedDay;
                const isToday =
                  monthIndex === calendar.initialMonthIndex &&
                  day === calendar.initialSelectedDay;
                const state = payouts[0]?.state;
                const tone: ViewStyle =
                  state === 'scheduled'
                    ? {
                        borderStyle: 'dashed',
                        borderColor: colors.accent,
                        backgroundColor: colors.accentSoft,
                      }
                    : {
                        borderColor: isToday || isSelected ? colors.accent : colors.line,
                        backgroundColor:
                          state === 'cleared' ? colors.positiveSoft : colors.control,
                      };

                return (
                  <View key={day} style={{ flex: 1, alignItems: 'center' }}>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`${month.label} ${day}`}
                      accessibilityState={{ selected: isSelected }}
                      onPress={() => setSelectedDay(day)}
                      style={({ pressed }) => [
                        {
                          width: '100%',
                          maxWidth: cellMaxWidth,
                          aspectRatio: 1,
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: radius.md,
                          borderWidth: 1,
                          opacity: pressed ? 0.7 : 1,
                        },
                        tone,
                        isSelected && { boxShadow: shadows.sm },
                      ]}>
                      <Text font="mono" size="sm" color={isToday || isSelected ? 'ink1' : 'ink2'}>
                        {day}
                      </Text>
                      {payouts.length > 0 ? (
                        <View
                          style={{
                            position: 'absolute',
                            bottom: 4,
                            width: 6,
                            height: 6,
                            borderRadius: 3,
                            backgroundColor:
                              state === 'cleared' ? colors.positive : colors.accent,
                          }}
                        />
                      ) : null}
                    </Pressable>
                  </View>
                );
              })}
            </View>
          ))}
        </View>

        {hasSelectedPayouts ? (
          <Animated.View
            entering={FadeIn.duration(280)}
            exiting={FadeOut.duration(160)}
            style={{ marginTop: 16 }}>
            <Card variant="control" padding={16}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                  marginBottom: 12,
                }}>
                <Text
                  font="sansMedium"
                  size="xs"
                  color="ink3"
                  uppercase
                  tracking={1.2}
                  style={{ flexShrink: 1 }}>
                  {month.label} {selectedDay}
                </Text>
                <PayoutState state={selectedPayouts[0].state} />
              </View>
              <View style={{ gap: 12 }}>
                {selectedPayouts.map((payout, index) => (
                  <View
                    key={`${payout.day}-${payout.sourceName}-${index}`}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 12,
                    }}>
                    <View style={{ flex: 1 }}>
                      <Text font="sansMedium" size="base" style={{ lineHeight: 20 }}>
                        {payout.sourceName}
                      </Text>
                      <Text size="xs" color="ink3" style={{ marginTop: 4 }}>
                        {payout.type}
                      </Text>
                    </View>
                    <Text font="monoSemiBold" size="base" color="positiveFg">
                      +{formatCurrency(payout.amount)}
                    </Text>
                  </View>
                ))}
              </View>
            </Card>
          </Animated.View>
        ) : null}

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16, marginTop: 16 }}>
          <LegendItem label={messages.income.cleared} swatch={{ backgroundColor: colors.positive }} />
          <LegendItem
            label={messages.income.scheduled}
            swatch={{
              backgroundColor: colors.accentSoft,
              borderWidth: 1,
              borderStyle: 'dashed',
              borderColor: colors.accent,
            }}
          />
        </View>
      </Card>
    </View>
  );
}

function PayoutState({ state }: { state: 'cleared' | 'scheduled' }) {
  const { messages } = useI18n();
  const { colors } = useTheme();
  const cleared = state === 'cleared';

  return (
    <Chip
      color={
        cleared
          ? { bg: colors.positiveSoft, fg: colors.positiveFg }
          : { bg: colors.accentSoft, fg: colors.accentSoftFg }
      }
      style={{ height: 24, paddingHorizontal: 10 }}>
      <Text
        font="sansSemiBold"
        size="xs"
        color={cleared ? 'positiveFg' : 'accentSoftFg'}
        numberOfLines={1}>
        {cleared ? messages.income.cleared : messages.income.scheduled}
      </Text>
    </Chip>
  );
}

function LegendItem({ label, swatch }: { label: string; swatch: ViewStyle }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      <View style={[{ width: 10, height: 10, borderRadius: 5 }, swatch]} />
      <Text size="xs" color="ink2">
        {label}
      </Text>
    </View>
  );
}
