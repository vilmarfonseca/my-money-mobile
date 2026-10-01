import { CalendarDays } from 'lucide-react-native';
import { useState, type ReactNode } from 'react';
import { Pressable, View } from 'react-native';

import { CardBillModal } from '@/components/cards/card-bill-modal';
import { Card } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { formatAmount, formatLongDay, sortItems } from '@/lib/calendar/calendar-utils';
import type { DueItem } from '@/lib/calendar/types';
import { useI18n } from '@/lib/i18n/provider';
import { useTheme } from '@/theme/theme-provider';
import { radius, shadows } from '@/theme/tokens';

import { useDueTypeLabels } from './calendar-strings';
import { StatusBadge } from './status-badge';
import { TypeIconTile } from './type-icon';

export function DayDetail({
  selectedDate,
  selectedItems,
}: {
  selectedDate: Date;
  selectedItems: DueItem[];
}) {
  const { formatCurrency, locale, messages } = useI18n();
  const { colors } = useTheme();
  const labels = useDueTypeLabels();
  const [billCardId, setBillCardId] = useState<string | null>(null);
  const outgoing = selectedItems
    .filter((item) => item.amount < 0)
    .reduce((sum, item) => sum + Math.abs(item.amount), 0);
  const incoming = selectedItems
    .filter((item) => item.amount > 0)
    .reduce((sum, item) => sum + item.amount, 0);

  return (
    <Card variant="control" rounded={radius.xl}>
      <View style={{ gap: 12 }}>
        <View>
          <Text font="sansMedium" size="xs" color="ink3" uppercase tracking={1.2}>
            {messages.calendar.dayDetail}
          </Text>
          <Text font="display" size="4xl" tight style={{ marginTop: 8 }}>
            {formatLongDay(selectedDate, locale)}
          </Text>
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          <Pill bg={colors.positiveSoft}>
            <Text font="mono" size="xs" color="positiveFg">
              {formatAmount(incoming, formatCurrency)}
            </Text>
          </Pill>
          <Pill bg={colors.surface2}>
            <Text font="mono" size="xs" color="ink2">
              {formatAmount(-outgoing, formatCurrency)}
            </Text>
          </Pill>
        </View>
      </View>

      <View style={{ gap: 16, marginTop: 20 }}>
        {selectedItems.length > 0 ? (
          sortItems(selectedItems).map((item) => {
            const billId = item.billCardId;
            return (
              // Only virtual card bills are pressable: they open the pay-bill modal.
              <Pressable
                key={item.id}
                accessibilityRole={billId ? 'button' : undefined}
                disabled={!billId}
                onPress={() => setBillCardId(billId ?? null)}
                style={{
                  padding: 20,
                  borderRadius: radius.xl,
                  borderWidth: 1,
                  borderColor: colors.line,
                  backgroundColor: colors.surface1,
                  boxShadow: shadows.sm,
                }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <TypeIconTile type={item.type} size={44} rounded={radius.lg} />
                  <View style={{ flex: 1 }}>
                    <Text font="sansMedium" size="base">
                      {item.title}
                    </Text>
                    {item.note ? (
                      <Text size="sm" color="ink3" style={{ marginTop: 4 }}>
                        {item.note}
                      </Text>
                    ) : null}
                  </View>
                </View>
                {/* The web wraps the amount under the title when the row is this narrow. */}
                <Text
                  font="monoMedium"
                  size="lg"
                  color={item.amount > 0 ? 'positiveFg' : 'ink1'}
                  style={{ marginTop: 16 }}>
                  {formatAmount(item.amount, formatCurrency)}
                </Text>
                <View
                  style={{
                    flexDirection: 'row',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    gap: 8,
                    marginTop: 16,
                  }}>
                  <StatusBadge status={item.status} />
                  <Pill bg={colors.control} compact>
                    <Text font="mono" size="xs" color="ink3">
                      {item.account}
                    </Text>
                  </Pill>
                  <Pill bg={colors.control} compact>
                    <Text font="sansMedium" size="xs" color="ink3">
                      {labels[item.type]}
                    </Text>
                  </Pill>
                </View>
              </Pressable>
            );
          })
        ) : (
          <View
            style={{
              alignItems: 'center',
              padding: 32,
              borderRadius: radius.xl,
              borderWidth: 1,
              borderStyle: 'dashed',
              borderColor: colors.line,
            }}>
            <CalendarDays size={32} color={colors.ink3} />
            <Text size="sm" color="ink3" align="center" style={{ marginTop: 12 }}>
              {messages.calendar.noDueDates}
            </Text>
          </View>
        )}
      </View>

      {billCardId ? (
        <CardBillModal
          cardId={billCardId}
          open
          onOpenChange={(open) => {
            if (!open) setBillCardId(null);
          }}
        />
      ) : null}
    </Card>
  );
}

function Pill({
  bg,
  children,
  compact,
}: {
  bg: string;
  children: ReactNode;
  compact?: boolean;
}) {
  return (
    <View
      style={{
        paddingHorizontal: compact ? 10 : 12,
        paddingVertical: compact ? 4 : 6,
        borderRadius: radius.pill,
        backgroundColor: bg,
      }}>
      {children}
    </View>
  );
}
