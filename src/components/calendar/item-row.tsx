import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { CardBillModal } from '@/components/cards/card-bill-modal';
import { Text } from '@/components/ui/text';
import { formatAmount } from '@/lib/calendar/calendar-utils';
import type { DueItem } from '@/lib/calendar/types';
import { useI18n } from '@/lib/i18n/provider';
import { useTheme } from '@/theme/theme-provider';
import { radius } from '@/theme/tokens';

import { StatusBadge } from './status-badge';
import { TypeIconTile } from './type-icon';

export function ItemRow({ first, item }: { first?: boolean; item: DueItem }) {
  const { formatCurrency } = useI18n();
  const { colors } = useTheme();
  const [billOpen, setBillOpen] = useState(false);
  const isBill = Boolean(item.billCardId);

  return (
    <>
      {/* Only virtual card bills are pressable: they open the pay-bill modal. */}
      <Pressable
        accessibilityRole={isBill ? 'button' : undefined}
        disabled={!isBill}
        onPress={() => setBillOpen(true)}
        style={({ pressed }) => ({
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          paddingVertical: 12,
          borderTopWidth: first ? 0 : 1,
          borderTopColor: colors.line,
          opacity: pressed ? 0.7 : 1,
        })}>
        <TypeIconTile type={item.type} size={40} rounded={radius.md} />
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
            <Text font="sansMedium" size="sm" numberOfLines={1} style={{ flexShrink: 1 }}>
              {item.title}
            </Text>
            <StatusBadge status={item.status} />
          </View>
          <Text font="mono" size="xs" color="ink3" numberOfLines={1} style={{ marginTop: 4 }}>
            {item.time} · {item.account} · {item.note}
          </Text>
        </View>
        <Text font="monoMedium" size="sm" color={item.amount > 0 ? 'positiveFg' : 'ink1'}>
          {formatAmount(item.amount, formatCurrency)}
        </Text>
      </Pressable>
      {item.billCardId ? (
        <CardBillModal cardId={item.billCardId} open={billOpen} onOpenChange={setBillOpen} />
      ) : null}
    </>
  );
}
