import { View } from 'react-native';

import { Card } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import type { getCardsScope } from '@/lib/cards/cards-data';
import { useI18n } from '@/lib/i18n/provider';
import { radius, type ColorToken } from '@/theme/tokens';

type CardsKpiRowProps = {
  isCardSelected: boolean;
  summary: ReturnType<typeof getCardsScope>['summary'];
};

type Kpi = {
  delta: string;
  label: string;
  tone?: 'muted' | 'negative' | 'positive';
  value: number;
  variant?: 'glass';
};

const deltaColors: Record<NonNullable<Kpi['tone']>, ColorToken> = {
  muted: 'ink3',
  negative: 'negativeFg',
  positive: 'positiveFg',
};

export function CardsKpiRow({ isCardSelected, summary }: CardsKpiRowProps) {
  const { formatCurrency, messages } = useI18n();
  const kpis: Kpi[] = [
    {
      // How much of the scoped cards' limit is currently taken up by
      // outstanding debt: filter-independent, unlike the period charges above.
      label: isCardSelected
        ? messages.cardsPage.cardUtilizedLimit
        : messages.cardsPage.combinedUtilizedLimit,
      value: summary.currentBalance,
      delta: `${summary.utilization}% ${messages.cardsPage.utilization.toLowerCase()}`,
      variant: 'glass',
    },
    {
      label: isCardSelected ? messages.cardsPage.cardLimit : messages.cardsPage.combinedLimit,
      value: summary.creditLimit,
      delta: messages.cardsPage.creditAvailable(formatCurrency(summary.availableCredit)),
      tone: 'positive',
    },
    {
      label: messages.cardsPage.nextDue,
      value: summary.nextDue?.statementBalance ?? 0,
      delta: summary.nextDue
        ? `${summary.nextDue.nickname} - ${summary.nextDue.dueDate}`
        : messages.cardsPage.noBalanceDue,
      tone: 'negative',
    },
    {
      label: messages.cardsPage.rewardsMonth,
      value: summary.rewardsThisMonth,
      delta: messages.cardsPage.blendedRewards,
      tone: 'muted',
    },
  ];
  // Two tiles per row (`grid-cols-2`); tiles in a row share the taller height.
  const rows = [kpis.slice(0, 2), kpis.slice(2)];

  return (
    <View style={{ gap: 10, marginBottom: 20 }}>
      {rows.map((row, index) => (
        <View key={index} style={{ flexDirection: 'row', gap: 10 }}>
          {row.map((kpi) => (
            <Card
              key={kpi.label}
              variant={kpi.variant ?? 'solid'}
              padding={16}
              rounded={radius.xl}
              style={{ flex: 1 }}>
              <Text font="sansMedium" size="2xs" color="ink3" uppercase tracking={1}>
                {kpi.label}
              </Text>
              <Text
                font="display"
                size="2xl"
                tight
                numberOfLines={1}
                adjustsFontSizeToFit
                style={{ marginTop: 8 }}>
                {formatCurrency(kpi.value)}
              </Text>
              <Text size="xs" color={deltaColors[kpi.tone ?? 'muted']} style={{ marginTop: 12 }}>
                {kpi.delta}
              </Text>
            </Card>
          ))}
        </View>
      ))}
    </View>
  );
}
