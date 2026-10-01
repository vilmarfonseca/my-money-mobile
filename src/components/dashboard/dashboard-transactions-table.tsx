import {
  ArrowDownLeft,
  ArrowUpRight,
  Coffee,
  Plane,
  ShoppingCart,
  Sparkles,
  type LucideIcon,
} from 'lucide-react-native';
import { View } from 'react-native';

import { CardNoData } from '@/components/card-no-data';
import { DataTable, type DataTableFilter } from '@/components/data-table';
import { CategoryIconBadge } from '@/components/transactions/category-icon';
import { useEditTransactionModal } from '@/components/transactions/edit-transaction-modal';
import { Text } from '@/components/ui/text';
import type { DashboardTransaction } from '@/lib/dashboard/dashboard-queries';
import { type ExpenseCategory, getExpenseCategoryStyle } from '@/lib/expenses/expense-categories';
import { localizeExpenseCategory } from '@/lib/i18n/labels';
import { useI18n } from '@/lib/i18n/provider';
import { useTheme } from '@/theme/theme-provider';
import { classNameColors, tableTone } from '@/theme/tones';

type Transaction = DashboardTransaction;
type TransactionType = Transaction['type'];

const categoryIcons: Partial<Record<ExpenseCategory, LucideIcon>> = {
  Groceries: ShoppingCart,
  Coffee,
  Travel: Plane,
  Subscriptions: Sparkles,
};

export function DashboardTransactionsTable({
  transactions,
}: {
  transactions: DashboardTransaction[];
}) {
  const { formatCurrency, messages } = useI18n();
  const { modal, openEdit } = useEditTransactionModal();
  const displayType = (type: TransactionType) =>
    type === 'Income' ? messages.common.income : messages.common.expense;
  const typeFilters: Array<DataTableFilter<Transaction>> = [
    { label: messages.common.all, value: 'All', predicate: () => true },
    {
      label: messages.common.income,
      value: 'Income',
      predicate: (transaction) => transaction.type === 'Income',
    },
    {
      label: messages.common.expenses,
      value: 'Expenses',
      predicate: (transaction) => transaction.type === 'Expense',
    },
  ];

  return (
    <>
      {modal}
      <DataTable
        title={messages.dashboard.recentTransactions}
        data={transactions.slice(0, 10)}
        onRowClick={(transaction) => openEdit(transaction.id)}
        initialPageSize={10}
        getRowKey={(transaction) => transaction.id}
        searchPlaceholder={messages.dashboard.searchTransactions}
        searchPredicate={(transaction, query) =>
          [transaction.name, transaction.category, transaction.type, transaction.date]
            .join(' ')
            .toLowerCase()
            .includes(query)
        }
        filters={typeFilters}
        periodLabel={messages.dashboard.activityPeriod}
        periodValue={(transaction) => new Date(transaction.occurredAt)}
        emptyMessage={messages.dashboard.noMatchingTransactions}
        emptyState={<CardNoData body={messages.dashboard.emptyTransactions} />}
        totalLabel={messages.common.netTotal}
        totalValue={(items) =>
          formatSignedAmount(
            items.reduce((sum, transaction) => sum + transaction.amount, 0),
            formatCurrency,
          )
        }
        renderMobileCard={(transaction) => (
          <TransactionMobileCard transaction={transaction} displayType={displayType} />
        )}
        mobileListStyle="rows"
        showFilters={false}
        showPagination={false}
        showPeriodFilter={false}
        showSearch={false}
        showTotal={false}
      />
    </>
  );
}

function TransactionMobileCard({
  displayType,
  transaction,
}: {
  displayType: (type: TransactionType) => string;
  transaction: Transaction;
}) {
  const { formatCurrency, locale } = useI18n();
  const { colors } = useTheme();

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingHorizontal: 8,
        paddingVertical: 12,
      }}>
      <TransactionIcon transaction={transaction} />
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text font="sansMedium" size="sm" numberOfLines={1}>
          {transaction.name}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
          <Text size="xs" color="ink3" numberOfLines={1} style={{ flexShrink: 1 }}>
            {localizeExpenseCategory(transaction.category, locale)}
          </Text>
          <View style={{ width: 2, height: 2, borderRadius: 1, backgroundColor: colors.ink4 }} />
          <Text font="mono" size="xs" color="ink3">
            {transaction.date}
          </Text>
        </View>
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <Text font="monoSemiBold" size="sm" color={transaction.amount > 0 ? 'positiveFg' : 'ink1'}>
          {formatSignedAmount(transaction.amount, formatCurrency)}
        </Text>
        <Text size="2xs" color="ink4" style={{ marginTop: 2 }}>
          {displayType(transaction.type)}
        </Text>
      </View>
    </View>
  );
}

function TransactionIcon({ transaction }: { transaction: Transaction }) {
  const { colors, scheme } = useTheme();
  const fallback: LucideIcon =
    categoryIcons[transaction.category as ExpenseCategory] ??
    (transaction.type === 'Income' ? ArrowUpRight : ArrowDownLeft);
  // Income rows read as sage badges in the designs; expenses keep their
  // per-category tone, except on the dark canvas where the pastel chips are
  // illegible and the type tone takes over.
  const tone =
    transaction.type === 'Income'
      ? tableTone('income', colors)
      : scheme === 'dark'
        ? tableTone('expense', colors)
        : classNameColors(getExpenseCategoryStyle(transaction.category).chipClassName, colors);

  return (
    <CategoryIconBadge
      icon={transaction.categoryIcon}
      color={transaction.categoryColor}
      fallbackIcon={fallback}
      tone={tone}
      // Mobile Dashboard design uses circular badges in this list.
      style={{ borderRadius: 20 }}
    />
  );
}

function formatSignedAmount(
  value: number,
  formatCurrency: ReturnType<typeof useI18n>['formatCurrency'],
) {
  const formatted = formatCurrency(Math.abs(value));

  return value > 0 ? `+${formatted}` : `-${formatted}`;
}
