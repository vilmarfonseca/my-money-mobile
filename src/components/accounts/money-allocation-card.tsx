import { View } from 'react-native';

import { SectionHeader } from '@/components/accounts/section-header';
import { Card } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import type { MoneyAllocationSegment } from '@/lib/accounts/accounts-data';
import { useI18n } from '@/lib/i18n/provider';
import { radius } from '@/theme/tokens';

type MoneyAllocationCardProps = {
  segments: MoneyAllocationSegment[];
  total: number;
};

export function MoneyAllocationCard({ segments, total }: MoneyAllocationCardProps) {
  const { formatCurrency, messages } = useI18n();

  // The legend is a two-column grid.
  const legendRows: MoneyAllocationSegment[][] = [];
  for (let index = 0; index < segments.length; index += 2) {
    legendRows.push(segments.slice(index, index + 2));
  }

  return (
    // The section header floats above its own card.
    <View style={{ marginBottom: 24 }}>
      <SectionHeader
        title={messages.accountsPage.whereYourMoneySits}
        pill={messages.accountsPage.totalAmount(formatCurrency(total))}
      />

      <Card>
        <View
          style={{
            flexDirection: 'row',
            gap: 2,
            height: 12,
            overflow: 'hidden',
            borderRadius: radius.pill,
          }}>
          {segments.map((segment) => (
            <View
              key={segment.id}
              accessibilityLabel={`${segment.label} · ${formatCurrency(segment.amount)}`}
              style={{
                backgroundColor: segment.color,
                flexGrow: total > 0 ? (segment.amount / total) * 100 : 0,
                flexShrink: 1,
                flexBasis: 0,
              }}
            />
          ))}
        </View>

        {legendRows.length > 0 ? (
          <View style={{ gap: 10, marginTop: 16 }}>
            {legendRows.map((row) => (
              <View key={row[0].id} style={{ flexDirection: 'row', gap: 16 }}>
                {row.map((segment) => (
                  <View
                    key={segment.id}
                    style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <View
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: segment.color,
                      }}
                    />
                    <Text size="xs" color="ink2" numberOfLines={1} style={{ flex: 1 }}>
                      {segment.label}
                    </Text>
                    <Text font="monoMedium" size="xs">
                      {formatCurrency(segment.amount)}
                    </Text>
                  </View>
                ))}
                {row.length === 1 ? <View style={{ flex: 1 }} /> : null}
              </View>
            ))}
          </View>
        ) : null}
      </Card>
    </View>
  );
}
