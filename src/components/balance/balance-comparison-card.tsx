import { View } from 'react-native';

import { Card } from '@/components/ui/card';
import { Chip } from '@/components/ui/chip';
import { Text } from '@/components/ui/text';
import type { BalancePeriodData, BalanceTableRow } from '@/lib/balance/balance-data';
import { useI18n } from '@/lib/i18n/provider';
import { useTheme } from '@/theme/theme-provider';
import { radius, type ColorToken } from '@/theme/tokens';

type FormatCurrency = ReturnType<typeof useI18n>['formatCurrency'];

const whole = (formatCurrency: FormatCurrency, value: number) => formatCurrency(Math.abs(value));

const formatSigned = (formatCurrency: FormatCurrency, value: number) =>
  `${value < 0 ? '−' : '+'}${whole(formatCurrency, value)}`;

const formatNegative = (formatCurrency: FormatCurrency, value: number) =>
  `−${whole(formatCurrency, value)}`;

/** `bg-surface-1/45`: the surface colour at 45% alpha. */
const tileAlpha = '73';

export function BalanceComparisonCard({ data }: { data: BalancePeriodData }) {
  const { formatCurrency, messages } = useI18n();
  const { colors } = useTheme();

  return (
    // The section header floats above its own card.
    <View>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
          marginBottom: 12,
          paddingHorizontal: 6,
        }}>
        <Text font="display" size="3xl" tight style={{ flex: 1 }}>
          {data.tableTitle}
        </Text>
        <Chip tone="outline" label={data.tableCount} style={{ height: 24, paddingHorizontal: 10 }} />
      </View>

      {/* Phones read the table as a list of period cards: a table this wide
          either scrolls out of reach or squeezes every column. */}
      <Card padding={8} style={{ gap: 8 }}>
        {data.rows.map((row) => (
          <MobileRow key={row.period} row={row} />
        ))}
        <View
          style={{
            padding: 14,
            borderRadius: radius.lg,
            borderWidth: 1,
            borderColor: colors.lineStrong,
            backgroundColor: `${colors.surface1}${tileAlpha}`,
          }}>
          <Text font="sansSemiBold" size="2xs" color="ink3" uppercase tracking={0.5}>
            {data.foot.label}
          </Text>
          <View style={{ gap: 10, marginTop: 10 }}>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <MobileFigure
                label={messages.common.income}
                value={formatSigned(formatCurrency, data.foot.income)}
                color="positiveFg"
                display
              />
              <MobileFigure
                label={messages.common.left}
                value={formatSigned(formatCurrency, data.foot.left)}
                color={data.foot.left < 0 ? 'warmSoftFg' : undefined}
                display
              />
            </View>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <MobileFigure
                label={messages.common.spending}
                value={formatNegative(formatCurrency, data.foot.spending)}
                color="ink2"
              />
              <MobileFigure
                label={messages.common.goals}
                value={formatNegative(formatCurrency, data.foot.goals)}
                color="ink2"
              />
            </View>
          </View>
        </View>
      </Card>
    </View>
  );
}

function MobileRow({ row }: { row: BalanceTableRow }) {
  const { formatCurrency, messages } = useI18n();
  const { colors } = useTheme();
  const rateGood = row.rate >= 20;

  return (
    <View
      style={{
        padding: 14,
        borderRadius: radius.lg,
        backgroundColor: `${colors.surface1}${tileAlpha}`,
      }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          gap: 12,
        }}>
        <Text font="sansMedium" size="sm" style={{ flex: 1 }}>
          {row.period}
        </Text>
        <View
          style={{
            paddingHorizontal: 8,
            paddingVertical: 2,
            borderRadius: radius.pill,
            backgroundColor: rateGood ? colors.positiveSoft : colors.warmSoft,
          }}>
          <Text font="monoMedium" size="2xs" color={rateGood ? 'positiveFg' : 'warmSoftFg'}>
            {row.rate.toFixed(1)}%
          </Text>
        </View>
      </View>
      <View style={{ gap: 10, marginTop: 10 }}>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <MobileFigure
            label={messages.common.income}
            value={formatSigned(formatCurrency, row.income)}
            color="positiveFg"
          />
          <MobileFigure
            label={messages.common.left}
            value={formatSigned(formatCurrency, row.left)}
            color={row.left < 0 ? 'warmSoftFg' : 'ink1'}
          />
        </View>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <MobileFigure
            label={messages.common.spending}
            value={formatNegative(formatCurrency, row.spending)}
            color="ink2"
          />
          <MobileFigure
            label={messages.common.goals}
            value={formatNegative(formatCurrency, row.goals)}
            color="ink2"
          />
        </View>
      </View>
    </View>
  );
}

/** One labelled figure inside a mobile period card. */
function MobileFigure({
  color = 'ink1',
  display = false,
  label,
  value,
}: {
  color?: ColorToken;
  /** Totals read as display type, matching the desktop foot row. */
  display?: boolean;
  label: string;
  value: string;
}) {
  return (
    <View style={{ flex: 1 }}>
      <Text font="sansMedium" size="2xs" color="ink3" uppercase tracking={0.5}>
        {label}
      </Text>
      <Text
        font={display ? 'display' : 'mono'}
        size={display ? 'lg' : 'sm'}
        color={color}
        numberOfLines={1}
        style={{ marginTop: 2 }}>
        {value}
      </Text>
    </View>
  );
}
