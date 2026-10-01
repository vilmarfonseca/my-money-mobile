import {
  ArrowUpDown,
  Coffee,
  DollarSign,
  Home,
  Laptop,
  ReceiptText,
  ShoppingBag,
  Utensils,
  Zap,
  type LucideIcon,
} from 'lucide-react-native';
import { useState } from 'react';
import { View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { DataTable, type DataTableFilter } from '@/components/data-table';
import { DateRangePicker } from '@/components/date-range-picker';
import { CategoryIconBadge } from '@/components/transactions/category-icon';
import { useEditTransactionModal } from '@/components/transactions/edit-transaction-modal';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { Text } from '@/components/ui/text';
import { displayAmount, type AccountActivity } from '@/lib/accounts/accounts-data';
import { parseDateRangeParams } from '@/lib/date-range';
import { getExpenseCategoryStyle } from '@/lib/expenses/expense-categories';
import { useI18n } from '@/lib/i18n/provider';
import { useTheme } from '@/theme/theme-provider';
import { radius } from '@/theme/tokens';
import { classNameColors, tableTone } from '@/theme/tones';

type TablePeriod = 'month' | 'quarter' | 'ytd' | 'custom';

const expenseIcons: Record<string, LucideIcon> = {
  Groceries: ShoppingBag,
  Shopping: ShoppingBag,
  'Eating out': Utensils,
  Coffee,
  Rent: Home,
  Mortgage: Home,
  Home,
  Utilities: Zap,
  Internet: Laptop,
};

type AccountsTransactionsTableProps = {
  accountIds: string[];
  activities: AccountActivity[];
};

export function AccountsTransactionsTable({
  accountIds,
  activities,
}: AccountsTransactionsTableProps) {
  const { messages } = useI18n();
  const { modal: editModal, openEdit } = useEditTransactionModal();
  const [period, setPeriod] = useState<TablePeriod>('month');
  const [range, setRange] = useState<{ from?: string; to?: string }>({});
  const scopeIds = new Set(accountIds);
  const periodData = filterByPeriod(activities, period, range);

  const amountFor = (activity: AccountActivity) => displayAmount(activity, scopeIds);

  const filters: Array<DataTableFilter<AccountActivity>> = [
    {
      label: messages.common.all,
      value: 'all',
      predicate: () => true,
    },
    {
      label: messages.common.income,
      value: 'income',
      predicate: (activity) => activity.kind === 'income' && !activity.isInterest,
    },
    {
      label: messages.common.spending,
      value: 'spending',
      predicate: (activity) => activity.kind === 'expense',
    },
    {
      label: messages.accountsPage.transfers,
      value: 'transfers',
      predicate: (activity) => activity.kind === 'transfer',
    },
    {
      label: messages.accountsPage.interest,
      value: 'interest',
      predicate: (activity) => activity.isInterest,
    },
  ];

  const periodOptions: ReadonlyArray<{ label: string; value: TablePeriod }> = [
    { label: messages.common.month, value: 'month' },
    { label: messages.common.quarter, value: 'quarter' },
    { label: messages.common.ytd, value: 'ytd' },
    { label: messages.common.custom, value: 'custom' },
  ];

  return (
    <>
      {editModal}
      <DataTable
        title={messages.accountsPage.allTransactions}
        data={periodData}
        onRowClick={(activity) => {
          // Transfers have no edit form; only ledger income/expenses open it.
          if (activity.kind !== 'transfer') openEdit(activity.id);
        }}
        getRowKey={(activity) => activity.id}
        initialSort={{ sortValue: (activity) => activity.occurredAt, direction: 'desc' }}
        searchPlaceholder={messages.accountsPage.searchTransactions}
        searchPredicate={(activity, query) =>
          [
            activity.merchant,
            activity.detail,
            activity.accountLabel,
            activity.category ?? '',
            activity.date,
          ]
            .join(' ')
            .toLowerCase()
            .includes(query)
        }
        filters={filters}
        periodLabel={messages.accountsPage.transactionPeriod}
        emptyMessage={messages.accountsPage.noTransactions}
        totalLabel={messages.common.netTotal}
        totalValue={(items) => (
          <AmountCell
            display
            amount={items.reduce((sum, activity) => sum + amountFor(activity), 0)}
          />
        )}
        headerControls={
          <View style={{ gap: 12 }}>
            <SegmentedControl
              size="md"
              accessibilityLabel={messages.accountsPage.transactionPeriod}
              options={periodOptions}
              value={period}
              onValueChange={setPeriod}
            />
            {period === 'custom' ? (
              <Animated.View entering={FadeIn.duration(220)} exiting={FadeOut.duration(160)}>
                <DateRangePicker from={range.from} to={range.to} onApply={setRange} />
              </Animated.View>
            ) : null}
          </View>
        }
        renderMobileCard={(activity) => (
          <ActivityMobileCard activity={activity} amount={amountFor(activity)} />
        )}
        mobileListStyle="rows"
      />
    </>
  );
}

/**
 * Windows anchored to the most recent activity, so seeded historical data
 * behaves the same as live data would.
 */
function filterByPeriod(
  activities: AccountActivity[],
  period: TablePeriod,
  range: { from?: string; to?: string },
) {
  if (activities.length === 0) return activities;

  if (period === 'custom') {
    const { from, to } = parseDateRangeParams(range);
    if (!from && !to) return activities;
    const start = from?.getTime() ?? -Infinity;
    const end = to
      ? new Date(to.getFullYear(), to.getMonth(), to.getDate() + 1).getTime()
      : Infinity;

    return activities.filter((activity) => {
      const at = new Date(activity.occurredAt).getTime();
      return at >= start && at < end;
    });
  }

  let ref = new Date(activities[0].occurredAt);
  for (const activity of activities) {
    const at = new Date(activity.occurredAt);
    if (at > ref) ref = at;
  }

  const start =
    period === 'month'
      ? new Date(ref.getFullYear(), ref.getMonth(), 1)
      : period === 'quarter'
        ? new Date(ref.getFullYear(), Math.floor(ref.getMonth() / 3) * 3, 1)
        : new Date(ref.getFullYear(), 0, 1);

  return activities.filter((activity) => new Date(activity.occurredAt) >= start);
}

function ActivityIcon({ activity }: { activity: AccountActivity }) {
  const { colors, scheme } = useTheme();

  if (activity.kind === 'transfer') {
    return <CategoryIconBadge fallbackIcon={ArrowUpDown} tone={tableTone('accent', colors)} />;
  }

  if (activity.kind === 'income') {
    return <CategoryIconBadge fallbackIcon={DollarSign} tone={tableTone('income', colors)} />;
  }

  return (
    <CategoryIconBadge
      icon={activity.categoryIcon}
      color={activity.categoryColor}
      fallbackIcon={expenseIcons[activity.category ?? ''] ?? ReceiptText}
      // The pastel category chips are illegible on the dark canvas, where the
      // web swaps them for the expense tone.
      tone={
        scheme === 'dark'
          ? tableTone('expense', colors)
          : classNameColors(
              getExpenseCategoryStyle(activity.category ?? 'Other').chipClassName,
              colors,
            )
      }
    />
  );
}

function AmountCell({ amount, display = false }: { amount: number; display?: boolean }) {
  const { formatSignedCurrency } = useI18n();
  const color = amount >= 0 ? 'positiveFg' : 'ink1';

  // The list's total row sets its figure in the display face.
  return display ? (
    <Text font="display" size="2xl" tight color={color}>
      {formatSignedCurrency(amount)}
    </Text>
  ) : (
    <Text font="monoSemiBold" size="sm" color={color}>
      {formatSignedCurrency(amount)}
    </Text>
  );
}

function ActivityMobileCard({ activity, amount }: { activity: AccountActivity; amount: number }) {
  const { colors } = useTheme();
  // Transfers carry the route in `detail`; the design pins the short label
  // in the pill and the route on the second line.
  const pill = activity.kind === 'transfer' ? activity.accountLabel : activity.detail;
  const sub = activity.kind === 'transfer' ? activity.detail : activity.accountLabel;

  return (
    // Mobile Accounts row: icon, merchant, detail pill + date, account line.
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingHorizontal: 8,
        paddingVertical: 12,
      }}>
      <ActivityIcon activity={activity} />
      <View style={{ flex: 1 }}>
        <Text font="sansMedium" size="sm" numberOfLines={1}>
          {activity.merchant}
        </Text>
        <View style={{ alignItems: 'flex-start', gap: 4, marginTop: 4 }}>
          <View
            style={{
              maxWidth: 160,
              height: 20,
              paddingHorizontal: 8,
              borderRadius: radius.pill,
              backgroundColor: colors.surface2,
              justifyContent: 'center',
            }}>
            <Text font="sansSemiBold" size="2xs" color="ink2" numberOfLines={1}>
              {pill}
            </Text>
          </View>
          <View style={{ alignSelf: 'stretch', gap: 8 }}>
            <Text font="mono" size="xs" color="ink3" numberOfLines={1}>
              {activity.date}
            </Text>
            <Text font="mono" size="xs" color="ink3" numberOfLines={1}>
              {sub}
            </Text>
          </View>
        </View>
      </View>
      <AmountCell amount={amount} />
    </View>
  );
}
