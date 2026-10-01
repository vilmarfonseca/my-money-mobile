import { View } from 'react-native';

import { Card } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { formatAmount, formatLongDay, sortItems } from '@/lib/calendar/calendar-utils';
import type { DueItem } from '@/lib/calendar/types';
import { useI18n } from '@/lib/i18n/provider';
import { useTheme } from '@/theme/theme-provider';
import { radius } from '@/theme/tokens';

import { useCalendarStrings } from './calendar-strings';
import { TypeIconTile } from './type-icon';

export function SelectedDayCard({
  selectedDate,
  selectedItems,
}: {
  selectedDate: Date;
  selectedItems: DueItem[];
}) {
  const { formatCurrency, locale, messages } = useI18n();
  const { colors } = useTheme();
  const strings = useCalendarStrings();
  const net = selectedItems.reduce((sum, item) => sum + item.amount, 0);

  return (
    <Card>
      <Text font="sansMedium" size="xs" color="ink3" uppercase tracking={1.2}>
        {strings.selected}
      </Text>
      <Text font="displayItalic" size="3xl" tight style={{ marginTop: 6 }}>
        {formatLongDay(selectedDate, locale)}
      </Text>
      <Text font="mono" size="xs" color="ink3" style={{ marginTop: 6 }}>
        {strings.daySummary(selectedItems.length, formatAmount(net, formatCurrency))}
      </Text>

      <View style={{ marginTop: 16 }}>
        {selectedItems.length > 0 ? (
          sortItems(selectedItems).map((item, index) => (
            <View
              key={item.id}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                paddingVertical: 14,
                borderTopWidth: index === 0 ? 0 : 1,
                borderTopColor: colors.line,
              }}>
              <TypeIconTile type={item.type} size={42} rounded={radius.sm} />
              <View style={{ flex: 1 }}>
                <Text font="sansMedium" size="sm" numberOfLines={1}>
                  {item.title}
                </Text>
                <Text font="mono" size="xs" color="ink3" numberOfLines={1} style={{ marginTop: 2 }}>
                  {item.time} · {item.account}
                </Text>
              </View>
              <Text font="monoMedium" size="sm" color={item.amount > 0 ? 'positiveFg' : 'warmSoftFg'}>
                {formatAmount(item.amount, formatCurrency)}
              </Text>
            </View>
          ))
        ) : (
          <View
            style={{
              padding: 20,
              borderRadius: radius.xl,
              borderWidth: 1,
              borderStyle: 'dashed',
              borderColor: colors.line,
            }}>
            <Text size="sm" color="ink3">
              {messages.calendar.emptyDay}
            </Text>
          </View>
        )}
      </View>
    </Card>
  );
}
