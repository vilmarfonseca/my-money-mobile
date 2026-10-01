import { TrendingUp } from 'lucide-react-native';
import { View } from 'react-native';

import { DashedLine } from '@/components/accounts/dashed-line';
import { Card } from '@/components/ui/card';
import { Chip } from '@/components/ui/chip';
import { Text } from '@/components/ui/text';
import type { AccountsScope } from '@/lib/accounts/accounts-data';
import { useI18n } from '@/lib/i18n/provider';
import { useTheme } from '@/theme/theme-provider';
import { radius } from '@/theme/tokens';

type AccountsKpiRowProps = {
  /** Banks in scope — the hero's "3 banks · 5 accounts" chip. */
  bankCount: number;
  summary: AccountsScope['summary'];
};

/** `inline-flex h-6 rounded-full px-2.5 text-xs font-medium` */
const heroChip = { height: 24, paddingHorizontal: 10 };

/**
 * Mobile Accounts hero: one card with chips, the checking/savings pair, and
 * the interest callout.
 */
export function AccountsKpiRow({ bankCount, summary }: AccountsKpiRowProps) {
  const { formatCurrency, formatSignedCurrency, messages, splitCurrencyParts } = useI18n();
  const { colors } = useTheme();
  const total = splitCurrencyParts(summary.totalBalance);
  const accountCount = summary.checkingCount + summary.savingsCount;
  const blendedApy =
    summary.blendedApy > 0
      ? messages.accountsPage.blendedApy(`${summary.blendedApy.toFixed(1)}%`)
      : null;

  return (
    <Card style={{ marginBottom: 24 }}>
      <Text font="sansSemiBold" size="2xs" color="ink3" uppercase tracking={1}>
        {messages.accountsPage.totalBalance}
      </Text>
      <Text
        font="display"
        size="5xl"
        tight
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.6}
        style={{ marginTop: 8 }}>
        {total.whole}
        <Text font="display" size="2xl" color="ink3">
          {total.decimal}
          {total.cents}
        </Text>
      </Text>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 }}>
        <Chip
          tone={summary.monthDelta >= 0 ? 'positive' : 'warm'}
          label={messages.accountsPage.deltaThisMonth(formatSignedCurrency(summary.monthDelta))}
          style={heroChip}
        />
        <Chip
          tone="accent"
          label={messages.accountsPage.banksAndAccounts(bankCount, accountCount)}
          style={heroChip}
        />
        {blendedApy ? <Chip tone="neutral" label={blendedApy} style={heroChip} /> : null}
      </View>

      <DashedLine style={{ marginTop: 16 }} />
      <View style={{ flexDirection: 'row', gap: 14, paddingTop: 16 }}>
        <HeroFigure
          label={messages.accountsPage.checking}
          value={formatCurrency(summary.checkingTotal)}
          note={messages.accountsPage.acrossAccounts(summary.checkingCount)}
        />
        <HeroFigure
          label={messages.accountsPage.savings}
          value={formatCurrency(summary.savingsTotal)}
          note={messages.accountsPage.percentOfTotal(summary.savingsPercent)}
        />
      </View>

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          marginTop: 16,
          paddingHorizontal: 14,
          paddingVertical: 12,
          borderRadius: radius.md,
          backgroundColor: colors.surface2,
        }}>
        <View
          style={{
            width: 34,
            height: 34,
            borderRadius: 17,
            backgroundColor: colors.positiveSoft,
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          <TrendingUp size={18} color={colors.positiveFg} />
        </View>
        <View style={{ flexShrink: 1 }}>
          <Text font="sansSemiBold" size="2xs" color="ink3" uppercase tracking={0.5} numberOfLines={1}>
            {messages.accountsPage.interestFor(summary.interestMonthLabel)}
          </Text>
          <Text font="display" size="lg" tight color="positiveFg" style={{ marginTop: 4 }}>
            {formatSignedCurrency(summary.interestThisMonth)}
          </Text>
        </View>
        {blendedApy ? (
          <Text size="xs" color="ink3" align="right" style={{ flex: 1, minWidth: 80 }}>
            {blendedApy}
          </Text>
        ) : null}
      </View>
    </Card>
  );
}

function HeroFigure({ label, note, value }: { label: string; note: string; value: string }) {
  return (
    <View style={{ flex: 1 }}>
      <Text font="sansSemiBold" size="2xs" color="ink3" uppercase tracking={1} numberOfLines={1}>
        {label}
      </Text>
      <Text
        font="display"
        size="2xl"
        tight
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.7}
        style={{ marginTop: 6 }}>
        {value}
      </Text>
      <Text size="xs" color="ink3" style={{ marginTop: 6 }}>
        {note}
      </Text>
    </View>
  );
}
