import { useRouter } from 'expo-router';
import { Pressable, View } from 'react-native';

import { BalanceSparkline } from '@/components/dashboard/balance-sparkline';
import { Card } from '@/components/ui/card';
import { Chip } from '@/components/ui/chip';
import { Separator } from '@/components/ui/separator';
import { Text } from '@/components/ui/text';
import type {
  DashboardBalanceOverview,
  DashboardBalanceTrendPoint,
} from '@/lib/dashboard/dashboard-queries';
import { useI18n } from '@/lib/i18n/provider';
import { useTheme } from '@/theme/theme-provider';
import { palette, radius, type ColorToken } from '@/theme/tokens';

type DotColor = 'plum' | 'sage' | 'coral';

const dotColors: Record<DotColor, string> = {
  plum: palette.plum500,
  sage: palette.sage500,
  coral: palette.coral500,
};

/**
 * The dashboard hero. On phones its two halves are separate cards: the total
 * balance with its trend and account tiles, then this month's cash flow.
 */
export function BalanceOverviewCard({
  balanceOverview,
  balanceTrend,
}: {
  balanceOverview: DashboardBalanceOverview;
  balanceTrend: DashboardBalanceTrendPoint[];
}) {
  const { messages } = useI18n();
  const { colors } = useTheme();
  const router = useRouter();
  const { total, fraction, accounts, currentMonthBalance, flow } = balanceOverview;
  const barTotal = flow.bar.reduce((sum, segment) => sum + segment.amount, 0);
  const accountSummaries: Array<{
    delta: string;
    dot: string;
    label: string;
    value: string;
    valueColor: ColorToken;
  }> = [
    ...accounts.map((account) => ({
      delta: account.delta,
      dot: dotColors[account.color],
      label: account.label,
      value: account.value,
      valueColor: 'ink1' as const,
    })),
    {
      delta: currentMonthBalance.delta,
      dot: currentMonthBalance.positive ? palette.sage500 : palette.coral500,
      label: currentMonthBalance.label,
      value: currentMonthBalance.value,
      valueColor: currentMonthBalance.positive ? 'positiveFg' : 'negativeFg',
    },
  ];

  return (
    <>
      <Card style={{ marginBottom: 16 }}>
        <Text font="sansMedium" size="xs" color="ink3" uppercase tracking={1.2}>
          {messages.dashboard.totalBalance}
        </Text>

        <Text
          font="display"
          size="5xl"
          tight
          numberOfLines={1}
          adjustsFontSizeToFit
          style={{ marginTop: 12, fontVariant: ['tabular-nums'] }}>
          {total}
          <Text font="display" size="2xl" color="ink3">
            {fraction}
          </Text>
        </Text>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 16 }}>
          <Chip tone="positive" label={balanceOverview.weekDelta} />
          <Chip tone="accent" label={balanceOverview.monthDelta} />
          <Chip tone="outline" label={balanceOverview.cardNote} style={{ borderColor: colors.line }} />
        </View>

        <BalanceSparkline data={balanceTrend} style={{ marginTop: 16 }} />

        <View style={{ flexDirection: 'row', gap: 8, marginTop: 16 }}>
          {accountSummaries.map((account) => (
            <Pressable
              key={account.label}
              accessibilityRole="link"
              accessibilityLabel={`${account.label}: ${account.value}`}
              onPress={() => router.navigate('/accounts')}
              style={({ pressed }) => ({
                flex: 1,
                minWidth: 0,
                padding: 12,
                borderRadius: radius.sm,
                backgroundColor: colors.surface2,
                opacity: pressed ? 0.7 : 1,
              })}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <View
                  style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: account.dot }}
                />
                <Text
                  font="sansMedium"
                  size="2xs"
                  color="ink3"
                  uppercase
                  tracking={0.25}
                  numberOfLines={1}
                  style={{ flex: 1 }}>
                  {account.label}
                </Text>
              </View>
              <Text
                font="display"
                size="xl"
                tight
                color={account.valueColor}
                numberOfLines={1}
                style={{ marginTop: 6, fontVariant: ['tabular-nums'] }}>
                {account.value}
              </Text>
              <Text font="mono" size="2xs" color="ink3" numberOfLines={1} style={{ marginTop: 4 }}>
                {account.delta}
              </Text>
            </Pressable>
          ))}
        </View>
      </Card>

      <Card style={{ gap: 14, marginBottom: 16 }}>
        <Text font="sansMedium" size="xs" color="ink3" uppercase tracking={1.2}>
          {messages.dashboard.thisMonthFlow(flow.month)}
        </Text>

        {flow.rows.map((row) => (
          <View
            key={row.label}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
            }}>
            <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 5,
                  backgroundColor: dotColors[row.color],
                }}
              />
              <Text size="base" color="ink2" numberOfLines={1} style={{ flexShrink: 1 }}>
                {row.label}
              </Text>
            </View>
            <Text font="monoMedium" size="base" color={row.positive ? 'positiveFg' : 'ink1'}>
              {row.value}
            </Text>
          </View>
        ))}

        <View
          style={{
            flexDirection: 'row',
            height: 12,
            borderRadius: 6,
            overflow: 'hidden',
            backgroundColor: colors.surface2,
          }}>
          {flow.bar.map((segment) => (
            <View
              key={segment.color}
              style={{
                width: `${barTotal > 0 ? (segment.amount / barTotal) * 100 : 0}%`,
                backgroundColor: dotColors[segment.color],
              }}
            />
          ))}
        </View>

        <View>
          <Separator dashed />
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'baseline',
              justifyContent: 'space-between',
              gap: 16,
              paddingTop: 12,
            }}>
            <Text
              font="sansMedium"
              size="xs"
              color="ink2"
              uppercase
              tracking={1.2}
              style={{ flexShrink: 1 }}>
              {flow.leftToSaveLabel}
            </Text>
            <Text
              font="display"
              size="2xl"
              tight
              color="positiveFg"
              style={{ fontVariant: ['tabular-nums'] }}>
              {flow.leftToSave}
            </Text>
          </View>
        </View>
      </Card>
    </>
  );
}
