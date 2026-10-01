import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { CardNoData } from '@/components/card-no-data';
import { CardBillModal } from '@/components/cards/card-bill-modal';
import { SectionHeader, SectionLink } from '@/components/dashboard/section-header';
import { Card } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import type { DashboardUpcomingItem } from '@/lib/dashboard/dashboard-queries';
import { useI18n } from '@/lib/i18n/provider';
import { useTheme } from '@/theme/theme-provider';
import { radius } from '@/theme/tokens';

type FormatCurrency = ReturnType<typeof useI18n>['formatCurrency'];

export function UpcomingCard({ upcomingItems }: { upcomingItems: DashboardUpcomingItem[] }) {
  const { formatCurrency, messages } = useI18n();
  const { colors } = useTheme();
  const router = useRouter();
  const hasItems = upcomingItems.length > 0;
  const [billCardId, setBillCardId] = useState<string | null>(null);

  return (
    <View>
      <SectionHeader
        title={messages.calendar.upcoming}
        action={
          // With nothing scheduled the calendar link is the only thing to do
          // here, so it takes the filled treatment.
          <SectionLink
            filled={!hasItems}
            label={messages.dashboard.seeCalendar}
            onPress={() => router.navigate('/calendar')}
          />
        }
      />

      <Card>
        {hasItems ? (
          upcomingItems.map((item, index) => {
            const first = index === 0;
            const last = index === upcomingItems.length - 1;
            const row = (
              <>
                <View style={{ width: 36, alignItems: 'center' }}>
                  <Text font="display" size="2xl" tight>
                    {item.day}
                  </Text>
                  <Text
                    font="sansMedium"
                    size="xs"
                    color="ink3"
                    uppercase
                    tracking={1.2}
                    numberOfLines={1}
                    style={{ marginTop: 4 }}>
                    {item.month}
                  </Text>
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <View
                    style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
                    <Text
                      font="sansMedium"
                      size="base"
                      numberOfLines={1}
                      style={{ flexShrink: 1, lineHeight: 20 }}>
                      {item.name}
                    </Text>
                    {item.overdue ? (
                      <View
                        style={{
                          height: 20,
                          justifyContent: 'center',
                          paddingHorizontal: 8,
                          borderRadius: radius.pill,
                          backgroundColor: colors.negativeSoft,
                        }}>
                        <Text font="sansSemiBold" size="xs" color="negativeFg">
                          {messages.cardsPage.billOverdue}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                  <Text size="xs" color="ink3" numberOfLines={1} style={{ marginTop: 4 }}>
                    {item.detail}
                  </Text>
                </View>
                <Text font="monoMedium" size="sm" color={item.amount > 0 ? 'positiveFg' : 'ink1'}>
                  {formatSignedAmount(item.amount, formatCurrency)}
                </Text>
              </>
            );
            const rowStyle = {
              flexDirection: 'row',
              alignItems: 'center',
              gap: 16,
              paddingTop: first ? 0 : 12,
              paddingBottom: last ? 0 : 12,
              borderBottomWidth: last ? 0 : 1,
              borderBottomColor: colors.line,
            } as const;

            // Card-bill items open the pay-bill modal; the rest are read-only.
            return item.billCardId ? (
              <Pressable
                key={item.id}
                accessibilityRole="button"
                onPress={() => setBillCardId(item.billCardId ?? null)}
                style={({ pressed }) => [rowStyle, { opacity: pressed ? 0.7 : 1 }]}>
                {row}
              </Pressable>
            ) : (
              <View key={item.id} style={rowStyle}>
                {row}
              </View>
            );
          })
        ) : (
          <CardNoData body={messages.dashboard.emptyUpcoming} />
        )}
      </Card>

      {billCardId ? (
        <CardBillModal
          cardId={billCardId}
          open
          onOpenChange={(open) => {
            if (!open) setBillCardId(null);
          }}
        />
      ) : null}
    </View>
  );
}

function formatSignedAmount(value: number, formatCurrency: FormatCurrency) {
  const formatted = formatCurrency(Math.abs(value));

  return value > 0 ? `+${formatted}` : `-${formatted}`;
}
