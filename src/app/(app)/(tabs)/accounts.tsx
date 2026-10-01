import { useState } from 'react';
import { View } from 'react-native';

import { usePullToRefresh, useScreenQuery } from '@/api/hooks';
import { AccountRail } from '@/components/accounts/account-rail';
import { AccountsKpiRow } from '@/components/accounts/accounts-kpi-row';
import { AccountsTransactionsTable } from '@/components/accounts/accounts-transactions-table';
import { AddAccountButton } from '@/components/accounts/add-account-button';
import { AllocationDonutCard } from '@/components/accounts/allocation-donut-card';
import { ClearSelectionButton } from '@/components/accounts/clear-selection-button';
import { MoneyAllocationCard } from '@/components/accounts/money-allocation-card';
import { useEntitlements } from '@/components/billing/entitlements-provider';
import { PeriodTrendCard } from '@/components/finance/period-trend-card';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Screen } from '@/components/ui/screen';
import { Skeleton, SkeletonCard } from '@/components/ui/skeleton';
import { Text } from '@/components/ui/text';
import {
  getAccountsScope,
  type AccountActivity,
  type BalanceTrendPoint,
} from '@/lib/accounts/accounts-data';
import type { AccountsPageData } from '@/lib/accounts/accounts-queries';
import type { AppLocale } from '@/lib/i18n/config';
import type { Messages } from '@/lib/i18n/messages';
import { useI18n } from '@/lib/i18n/provider';
import { useTheme } from '@/theme/theme-provider';
import { radius } from '@/theme/tokens';

export default function AccountsRoute() {
  const { locale, messages } = useI18n();
  const { colors } = useTheme();
  const entitlements = useEntitlements();
  const query = useScreenQuery('accounts.page', []);
  const { onRefresh, refreshing } = usePullToRefresh(query);
  // The web keeps the picked banks in `?accounts=`; here it is screen state.
  const [selection, setSelection] = useState<string[]>([]);
  const data = query.data;

  // Ids of banks that no longer exist (deleted, renamed) drop out of scope.
  const selectedBankIds = data
    ? selection.filter((id) => data.banks.some((bank) => bank.id === id))
    : [];
  const scopeLabel = !data
    ? null
    : selectedBankIds.length === 0
      ? messages.accountsPage.allAccounts
      : selectedBankIds.length === 1
        ? (data.banks.find((bank) => bank.id === selectedBankIds[0])?.name ?? '')
        : messages.accountsPage.banksSelected(selectedBankIds.length);

  // Starter never shows the add-account action; plus shows it only while under
  // its account cap; premium (unlimited cap) always shows it.
  const canAddAccount =
    Boolean(data) &&
    entitlements.tier !== 'starter' &&
    (data?.banks.length ?? 0) < entitlements.limits.accounts;

  const toggleBank = (bankId: string) => {
    setSelection(
      selectedBankIds.includes(bankId)
        ? selectedBankIds.filter((id) => id !== bankId)
        : [...selectedBankIds, bankId],
    );
  };

  return (
    <Screen onRefresh={onRefresh} refreshing={refreshing}>
      <PageHeader
        title={messages.accountsPage.title}
        description={messages.accountsPage.description}
        mobileSubtitle={
          scopeLabel !== null ? (
            <>
              <View
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: colors.positiveFg,
                }}
              />
              <Text size="xs" color="ink3" numberOfLines={1} style={{ flexShrink: 1 }}>
                {messages.accountsPage.scopeSummary(scopeLabel)}
              </Text>
            </>
          ) : undefined
        }
        mobileAction={
          canAddAccount ? (
            // The first account in a workspace is always the primary one.
            <AddAccountButton isFirstAccount={data?.banks.length === 0} />
          ) : undefined
        }
        actions={
          selectedBankIds.length > 0 ? (
            <ClearSelectionButton
              label={messages.accountsPage.reset}
              onClear={() => setSelection([])}
            />
          ) : undefined
        }
      />

      {data ? (
        <AccountsContent
          data={data}
          onToggleBank={toggleBank}
          scopeLabel={scopeLabel ?? ''}
          selectedBankIds={selectedBankIds}
        />
      ) : query.isError ? (
        <Card style={{ alignItems: 'center', gap: 12 }}>
          <Text size="sm" color="ink2" align="center">
            {locale === 'pt-BR'
              ? 'Não foi possível carregar suas contas.'
              : "Couldn't load your accounts."}
          </Text>
          <Button
            variant="outline"
            label={locale === 'pt-BR' ? 'Tentar novamente' : 'Try again'}
            onPress={() => void query.refetch()}
          />
        </Card>
      ) : (
        <AccountsSkeleton />
      )}
    </Screen>
  );
}

/** Everything below the header: the web page's streamed sections, in order. */
function AccountsContent({
  data,
  onToggleBank,
  scopeLabel,
  selectedBankIds,
}: {
  data: AccountsPageData;
  onToggleBank: (bankId: string) => void;
  scopeLabel: string;
  selectedBankIds: string[];
}) {
  const { messages } = useI18n();
  const scope = getAccountsScope(data.banks, data.activities, selectedBankIds, data.locale);
  const trendRangeLabel =
    scope.trend.length > 0
      ? `${scope.trend[0].month}-${scope.trend[scope.trend.length - 1].month}`
      : '';

  return (
    <View>
      <AccountsKpiRow
        bankCount={selectedBankIds.length > 0 ? selectedBankIds.length : data.banks.length}
        summary={scope.summary}
      />

      <MoneyAllocationCard
        segments={scope.allocation.segments}
        total={scope.summary.totalBalance}
      />

      <AccountRail
        banks={data.banks}
        interestByAccount={interestByAccount(data.activities)}
        onToggleBank={onToggleBank}
        selectedBankIds={selectedBankIds}
      />

      <PeriodTrendCard
        title={messages.accountsPage.balanceTrend}
        mobileEyebrow={messages.accountsPage.monthlyBalance}
        trend={scope.trend}
        rangeLabel={trendRangeLabel}
        footer={trendSummary(scope.trend, data.locale, messages)}
        style={{ marginBottom: 24 }}
      />

      <AllocationDonutCard allocation={scope.allocation} periodLabel={scopeLabel} />

      <AccountsTransactionsTable
        accountIds={[...scope.accountIds]}
        activities={scope.activities}
      />
    </View>
  );
}

/** Interest posted per account in the most recent month with any interest. */
function interestByAccount(activities: AccountActivity[]) {
  const latest = activities.reduce<string>(
    (max, activity) => (activity.isInterest && activity.occurredAt > max ? activity.occurredAt : max),
    '',
  );
  const monthKey = latest.slice(0, 7);
  const totals: Record<string, number> = {};

  for (const activity of activities) {
    if (!activity.isInterest || !activity.occurredAt.startsWith(monthKey)) continue;
    totals[activity.accountId] = (totals[activity.accountId] ?? 0) + activity.amount;
  }

  return totals;
}

function trendSummary(trend: BalanceTrendPoint[], locale: AppLocale, messages: Messages) {
  const latest = trend.at(-1)?.spending ?? 0;
  const previous = trend.at(-2)?.spending ?? 0;
  const latestMonth = trend.at(-1)?.month ?? (locale === 'pt-BR' ? 'Este período' : 'This period');
  const previousMonth =
    trend.at(-2)?.month ?? (locale === 'pt-BR' ? 'período anterior' : 'prior period');
  const deltaPct = previous > 0 ? ((latest - previous) / previous) * 100 : 0;

  return messages.accountsPage.trendComparison(
    latestMonth,
    `${Math.abs(deltaPct).toFixed(1)}%`,
    deltaPct >= 0 ? messages.accountsPage.trendAbove : messages.accountsPage.trendBelow,
    previousMonth,
  );
}

function AccountsSkeleton() {
  return (
    <View style={{ gap: 24 }}>
      <Skeleton height={300} rounded={radius.xl} />
      <SkeletonCard lines={4} />
      <View style={{ gap: 14 }}>
        <Skeleton height={190} rounded={radius.xl} />
        <Skeleton height={190} rounded={radius.xl} />
      </View>
      <SkeletonCard lines={5} height={20} />
      <SkeletonCard lines={6} />
    </View>
  );
}
