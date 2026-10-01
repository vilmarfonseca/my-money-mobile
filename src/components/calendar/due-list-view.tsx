import { ListChecks } from 'lucide-react-native';
import { View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import {
  formatDay,
  formatLongDay,
  groupItemsByDate,
  parseDate,
} from '@/lib/calendar/calendar-utils';
import type { DueItem } from '@/lib/calendar/types';
import { useI18n } from '@/lib/i18n/provider';
import { useTheme } from '@/theme/theme-provider';
import { radius } from '@/theme/tokens';

import { dueTypes, useCalendarStrings, useDueTypeLabels } from './calendar-strings';
import { ItemRow } from './item-row';
import { dueTypeColors } from './type-colors';

export function DueListView({ items, currentDate }: { items: DueItem[]; currentDate: Date }) {
  const { locale, messages } = useI18n();
  const { colors } = useTheme();
  const strings = useCalendarStrings();
  const groups = groupItemsByDate(items);
  const groupKeys = Object.keys(groups);

  return (
    <View style={{ gap: 16 }}>
      <Card>
        <View style={{ alignItems: 'flex-start', gap: 12, marginBottom: 20 }}>
          <View>
            <Text font="sansMedium" size="xs" color="ink3" uppercase tracking={1.2}>
              {messages.calendar.due}
            </Text>
            <Text font="display" size="4xl" tight style={{ marginTop: 8 }}>
              {strings.runway}
            </Text>
          </View>
          <View
            style={{
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: radius.pill,
              backgroundColor: colors.control,
            }}>
            <Text font="mono" size="xs" color="ink3">
              {strings.startingFrom(formatDay(currentDate, locale))}
            </Text>
          </View>
        </View>

        <View style={{ gap: 20 }}>
          {groupKeys.length > 0 ? (
            groupKeys.map((key) => (
              <View key={key}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                  <View
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: radius.lg,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: colors.action,
                    }}>
                    <Text font="display" size="2xl" tight color="actionForeground">
                      {parseDate(key).getDate()}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text font="sansMedium" size="base">
                      {formatLongDay(parseDate(key), locale)}
                    </Text>
                    <Text font="mono" size="xs" color="ink3">
                      {strings.dueItems(groups[key].length)}
                    </Text>
                  </View>
                </View>
                <View
                  style={{
                    paddingHorizontal: 16,
                    borderRadius: radius.xl,
                    borderWidth: 1,
                    borderColor: colors.line,
                    backgroundColor: colors.surface1,
                  }}>
                  {groups[key].map((item, index) => (
                    <ItemRow key={item.id} item={item} first={index === 0} />
                  ))}
                </View>
              </View>
            ))
          ) : (
            <View
              style={{
                padding: 32,
                borderRadius: radius.xl,
                borderWidth: 1,
                borderStyle: 'dashed',
                borderColor: colors.line,
              }}>
              <Text size="sm" color="ink3" align="center">
                {messages.calendar.noDueDates}
              </Text>
            </View>
          )}
        </View>
      </Card>

      <DueListSidebar items={items} />
    </View>
  );
}

/** The web's side column, stacked under the list on phones. */
function DueListSidebar({ items }: { items: DueItem[] }) {
  const { colors } = useTheme();
  const strings = useCalendarStrings();
  const labels = useDueTypeLabels();

  return (
    <View style={{ gap: 16 }}>
      <Card>
        <Text font="sansMedium" size="xs" color="ink3" uppercase tracking={1.2}>
          {strings.calendarMix}
        </Text>
        <View style={{ gap: 12, marginTop: 16 }}>
          {dueTypes.map((type) => {
            const count = items.filter((item) => item.type === type).length;

            return (
              <View
                key={type}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <View
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: dueTypeColors(type, colors).dot,
                    }}
                  />
                  <Text size="sm" color="ink2">
                    {labels[type]}
                  </Text>
                </View>
                <Text font="mono" size="sm" color="ink3">
                  {count}
                </Text>
              </View>
            );
          })}
        </View>
      </Card>

      <Card variant="solid" rounded={radius.xl} style={{ backgroundColor: colors.accentSoft }}>
        <Text font="sansMedium" size="xs" color="accentSoftFg" uppercase tracking={1.2}>
          {strings.suggestedAction}
        </Text>
        <Text font="display" size="2xl" style={{ marginTop: 12, lineHeight: 30 }}>
          {strings.suggestedActionBody}
        </Text>
        {/* No handler on the web either: the review queue does not exist yet. */}
        <Button
          label={strings.reviewQueue}
          icon={(props) => <ListChecks {...props} />}
          style={{ alignSelf: 'flex-start', marginTop: 16 }}
        />
      </Card>
    </View>
  );
}
