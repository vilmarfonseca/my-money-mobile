import { View } from 'react-native';

import { Card } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import type { IncomeKpi } from '@/lib/income/income-queries';
import { radius } from '@/theme/tokens';

const deltaColors = {
  positive: 'positiveFg',
  neutral: 'ink3',
} as const;

type IncomeKpiCardsProps = {
  kpis: IncomeKpi[];
};

export function IncomeKpiCards({ kpis }: IncomeKpiCardsProps) {
  const rows: IncomeKpi[][] = [];
  for (let index = 0; index < kpis.length; index += 2) {
    rows.push(kpis.slice(index, index + 2));
  }

  return (
    // Mobile Income: a tight 2x2 KPI grid sits between the filter and hero.
    <View style={{ gap: 8, marginBottom: 16 }}>
      {rows.map((row) => (
        <View key={row[0].label} style={{ flexDirection: 'row', gap: 8 }}>
          {row.map((kpi) => (
            <Card
              key={kpi.label}
              variant="solid"
              rounded={radius.xl}
              padding={16}
              style={{ flex: 1 }}>
              <Text font="sansMedium" size="2xs" color="ink3" uppercase tracking={1}>
                {kpi.label}
              </Text>
              <Text font="display" size="2xl" tight style={{ marginTop: 8 }}>
                {kpi.value}
                <Text font="display" size="base" color="ink3">
                  {kpi.fraction}
                </Text>
              </Text>
              <Text size="2xs" color={deltaColors[kpi.tone]} style={{ marginTop: 6 }}>
                {kpi.delta}
              </Text>
            </Card>
          ))}
          {/* Keeps an odd last card at half width, as the grid does. */}
          {row.length === 1 ? <View style={{ flex: 1 }} /> : null}
        </View>
      ))}
    </View>
  );
}
