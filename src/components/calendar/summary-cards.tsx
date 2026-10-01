import { View } from 'react-native';

import { Card } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { formatAmount, formatDay, itemDate } from '@/lib/calendar/calendar-utils';
import type { DueItem } from '@/lib/calendar/types';
import { useI18n } from '@/lib/i18n/provider';
import { radius, type ColorToken } from '@/theme/tokens';

import { TypeIconTile } from './type-icon';

export function SummaryCards({
  visibleItemsCount,
  outgoing,
  incoming,
  nextDue,
}: {
  visibleItemsCount: number;
  outgoing: number;
  incoming: number;
  nextDue?: DueItem;
}) {
  const { formatCurrency, locale, messages } = useI18n();

  return (
    // The design's compact stat trio over a full-width next payment.
    <View style={{ gap: 10, marginBottom: 16 }}>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <Stat label={messages.calendar.dueInView} value={`${visibleItemsCount}`} />
        <Stat
          label={messages.calendar.outgoing}
          value={formatCurrency(outgoing)}
          color="warmSoftFg"
        />
        <Stat
          label={messages.calendar.incoming}
          value={formatCurrency(incoming)}
          color="positiveFg"
        />
      </View>

      <Card padding={16}>
        <StatLabel>{messages.calendar.nextPayment}</StatLabel>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 12 }}>
          {nextDue ? (
            <>
              <TypeIconTile type={nextDue.type} size={42} rounded={radius.sm} />
              <View style={{ flex: 1 }}>
                <Text font="display" size="lg" tight numberOfLines={1}>
                  {nextDue.title}
                </Text>
                <Text font="mono" size="xs" color="ink3" numberOfLines={1} style={{ marginTop: 4 }}>
                  {formatDay(itemDate(nextDue), locale)} ·{' '}
                  {formatAmount(nextDue.amount, formatCurrency)}
                </Text>
              </View>
              <Text font="monoSemiBold" size="sm" color="warmSoftFg">
                {formatAmount(nextDue.amount, formatCurrency)}
              </Text>
            </>
          ) : (
            <Text font="display" size="lg" tight>
              {messages.calendar.allClear}
            </Text>
          )}
        </View>
      </Card>
    </View>
  );
}

function StatLabel({ children }: { children: string }) {
  return (
    <Text font="sansMedium" size="2xs" color="ink3" uppercase tracking={1}>
      {children}
    </Text>
  );
}

function Stat({ color, label, value }: { color?: ColorToken; label: string; value: string }) {
  return (
    <Card padding={14} style={{ flex: 1 }}>
      <StatLabel>{label}</StatLabel>
      {/* Shrinks to fit: a full amount is wider than a third of the screen. */}
      <Text
        font="display"
        size="2xl"
        tight
        color={color}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.5}
        style={{ marginTop: 8 }}>
        {value}
      </Text>
    </Card>
  );
}
