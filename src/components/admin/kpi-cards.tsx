import { View } from 'react-native';

import { Card } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { radius } from '@/theme/tokens';

export type AdminKpiCard = {
  label: string;
  value: number | string;
  note: string;
  /** Glass for the headline number of a row, solid for the supporting ones. */
  surface: 'glass' | 'solid';
  /** Flags a number that needs attention (an overdue balance). */
  tone?: 'default' | 'negative';
};

/** Stack of headline numbers shared by the admin pages. */
export function AdminKpiCards({ cards }: { cards: readonly AdminKpiCard[] }) {
  return (
    <View style={{ gap: 16, marginBottom: 20 }}>
      {cards.map((card) => (
        <Card key={card.label} variant={card.surface} padding={24} rounded={radius.xl}>
          <Text font="sansMedium" size="xs" color="ink3" uppercase tracking={1.2}>
            {card.label}
          </Text>
          <Text
            font="display"
            size="4xl"
            tight
            color={card.tone === 'negative' ? 'negativeFg' : 'ink1'}
            style={{ marginTop: 8, fontVariant: ['tabular-nums'] }}>
            {card.value}
          </Text>
          <Text size="xs" color="ink3" style={{ marginTop: 10, fontVariant: ['tabular-nums'] }}>
            {card.note}
          </Text>
        </Card>
      ))}
    </View>
  );
}
