import { View } from 'react-native';

import { DashedLine } from '@/components/accounts/dashed-line';
import { SectionHeader } from '@/components/accounts/section-header';
import { DonutCenterLabel } from '@/components/finance/donut-center-label';
import { DonutChart } from '@/components/finance/donut-chart';
import { Card } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import type { AccountsScope } from '@/lib/accounts/accounts-data';
import { useI18n } from '@/lib/i18n/provider';
import { useTheme } from '@/theme/theme-provider';
import { resolveColor } from '@/theme/tones';

type AllocationDonutCardProps = {
  allocation: AccountsScope['allocation'];
  periodLabel: string;
};

const savingsColor = 'var(--color-sage-500)';
const checkingColor = 'var(--color-plum-500)';

export function AllocationDonutCard({ allocation, periodLabel }: AllocationDonutCardProps) {
  const { formatCurrency, messages } = useI18n();
  const { colors } = useTheme();
  const total = allocation.checkingTotal + allocation.savingsTotal;
  const chartData =
    total > 0
      ? [
          { id: 'savings', amount: allocation.savingsTotal, color: savingsColor },
          { id: 'checking', amount: allocation.checkingTotal, color: checkingColor },
        ]
      : [{ id: 'empty', amount: 1, color: 'var(--ink-3)' }];
  const legend = [
    {
      id: 'savings',
      name: messages.accountsPage.savings,
      color: savingsColor,
      percent: allocation.percentSaved,
    },
    {
      id: 'checking',
      name: messages.accountsPage.checking,
      color: checkingColor,
      percent: total > 0 ? 100 - allocation.percentSaved : 0,
    },
  ];

  return (
    // The section header floats above its own card, with the scope as its pill.
    <View style={{ marginBottom: 24 }}>
      <SectionHeader title={messages.accountsPage.allocation} pill={periodLabel} />

      <Card>
        {/* A modest thick ring over full-width legend rows, so the account
            names read in full instead of truncating beside it. */}
        <View style={{ gap: 16 }}>
          <View style={{ width: 128, aspectRatio: 1, alignSelf: 'center' }}>
            <DonutChart data={chartData} innerRadius="76%" outerRadius="96%" />
            <DonutCenterLabel
              caption={messages.accountsPage.saved}
              fit={`${allocation.percentSaved}%`}
              // The value sits above the centre line, where the hole is
              // narrower than its diameter — budget it less than the full hole.
              holePercent={64}>
              {allocation.percentSaved}
              <Text color="ink3">%</Text>
            </DonutCenterLabel>
          </View>

          <View style={{ gap: 10 }}>
            {legend.map((item) => (
              <View
                key={item.id}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 16,
                }}>
                <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <View
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: resolveColor(item.color, colors),
                    }}
                  />
                  <Text size="sm" color="ink2" numberOfLines={1} style={{ flexShrink: 1 }}>
                    {item.name}
                  </Text>
                </View>
                <Text font="monoMedium" size="xs" color="ink3">
                  {item.percent.toFixed(1)}%
                </Text>
              </View>
            ))}
          </View>
        </View>

        <DashedLine style={{ marginTop: 20 }} />
        <Text size="sm" color="ink3" style={{ paddingTop: 16 }}>
          {messages.accountsPage.savings}:{' '}
          <Text font="sansSemiBold" size="sm">
            {formatCurrency(allocation.savingsTotal)}
          </Text>
        </Text>
      </Card>
    </View>
  );
}
