import type { LucideIcon } from 'lucide-react-native';
import {
  Bike,
  BookOpen,
  CarFront,
  Coffee,
  Dumbbell,
  Film,
  Fuel,
  Gift,
  Home,
  Hotel,
  House,
  Landmark,
  Laptop,
  Pill,
  Plane,
  ReceiptText,
  School,
  Shirt,
  ShoppingBag,
  Sparkles,
  Stethoscope,
  Ticket,
  Utensils,
  Zap,
} from 'lucide-react-native';
import { View } from 'react-native';

import { DataTable, type DataTableFilter } from '@/components/data-table';
import { CategoryIconBadge, TablePill } from '@/components/transactions/category-icon';
import { useEditTransactionModal } from '@/components/transactions/edit-transaction-modal';
import { Text } from '@/components/ui/text';
import {
  type ExpenseCategory,
  getExpenseCategoryStyle,
} from '@/lib/expenses/expense-categories';
import type { ExpenseTransaction } from '@/lib/expenses/expenses-queries';
import { localizeExpenseCategory } from '@/lib/i18n/labels';
import { useI18n } from '@/lib/i18n/provider';
import { useTheme } from '@/theme/theme-provider';
import { categoryPillColors, classNameColors, tableTone } from '@/theme/tones';

type Transaction = ExpenseTransaction;

const transactionIcons: Partial<Record<ExpenseCategory, LucideIcon>> = {
  Groceries: ShoppingBag,
  'Eating out': Utensils,
  Coffee,
  Transport: Bike,
  Gas: Fuel,
  Parking: CarFront,
  Rent: Home,
  Mortgage: House,
  Utilities: Zap,
  Internet: Laptop,
  Phone: ReceiptText,
  Subscriptions: Sparkles,
  Entertainment: Film,
  Shopping: ShoppingBag,
  Clothing: Shirt,
  Home,
  Health: Stethoscope,
  Pharmacy: Pill,
  Fitness: Dumbbell,
  Insurance: Landmark,
  Education: BookOpen,
  Childcare: School,
  Pets: ReceiptText,
  Travel: Plane,
  Flights: Plane,
  Hotels: Hotel,
  Gifts: Gift,
  Taxes: Landmark,
  Fees: Ticket,
  Other: ReceiptText,
};

type TransactionsTableProps = {
  transactions: Transaction[];
};

export function TransactionsTable({ transactions }: TransactionsTableProps) {
  const { formatCurrency, locale, messages } = useI18n();
  const { modal: editModal, openEdit } = useEditTransactionModal();
  const formatSpendingAmount = (value: number) => `-${formatCurrency(Math.abs(value))}`;

  // Chips come from the categories the rows actually use, not from the
  // built-in English list: workspaces name their own categories (and pt-BR
  // ones never matched those constants), which left most of them without a
  // chip.
  const seen = new Set<string>();
  for (const transaction of transactions) {
    if (transaction.category) seen.add(transaction.category);
  }
  // Alphabetical by the label the user reads, so the row stays stable no
  // matter how the list happens to be sorted.
  const used = [
    messages.common.all,
    ...[...seen].sort((a, b) =>
      localizeExpenseCategory(a, locale).localeCompare(localizeExpenseCategory(b, locale), locale),
    ),
  ];
  const filters: Array<DataTableFilter<Transaction>> = used.map((category) => ({
    label:
      category === messages.common.all ? category : localizeExpenseCategory(category, locale),
    value: category,
    predicate:
      category === messages.common.all
        ? () => true
        : (transaction) => transaction.category === category,
  }));

  return (
    <>
      {editModal}
      <DataTable
        title={messages.expenses.allTransactions}
        data={transactions}
        onRowClick={(transaction) => openEdit(transaction.id)}
        getRowKey={(transaction) => transaction.id}
        searchPlaceholder={messages.expenses.search}
        searchPredicate={(transaction, query) =>
          [
            transaction.merchant,
            transaction.detail,
            transaction.category,
            transaction.card,
            transaction.date,
          ]
            .join(' ')
            .toLowerCase()
            .includes(query)
        }
        filters={filters}
        periodLabel={messages.expenses.transactionPeriod}
        emptyMessage={messages.expenses.noTransactions}
        totalLabel={messages.common.total}
        totalValue={(items) => (
          <Text font="display" size="2xl" tight color="negativeFg">
            {formatSpendingAmount(items.reduce((sum, transaction) => sum + transaction.amount, 0))}
          </Text>
        )}
        renderMobileCard={(transaction) => <TransactionMobileCard transaction={transaction} />}
        mobileListStyle="rows"
      />
    </>
  );
}

function CategoryIcon({ transaction }: { transaction: Transaction }) {
  const { colors, scheme } = useTheme();
  const fallback: LucideIcon =
    transactionIcons[transaction.category as ExpenseCategory] ?? ReceiptText;

  return (
    <CategoryIconBadge
      icon={transaction.categoryIcon}
      color={transaction.categoryColor}
      fallbackIcon={fallback}
      // The pastel category chips are illegible on the dark canvas, so dark
      // mode uses the expense tone (the web's `darkTableToneStyles.expense`).
      tone={
        scheme === 'dark'
          ? tableTone('expense', colors)
          : classNameColors(getExpenseCategoryStyle(transaction.category).chipClassName, colors)
      }
    />
  );
}

function TransactionMobileCard({ transaction }: { transaction: Transaction }) {
  const { formatCurrency, locale } = useI18n();
  const { colors, scheme } = useTheme();
  const formatSpendingAmount = (value: number) => `-${formatCurrency(Math.abs(value))}`;

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingHorizontal: 8,
        paddingVertical: 12,
      }}>
      <CategoryIcon transaction={transaction} />
      <View style={{ flex: 1 }}>
        <Text font="sansMedium" size="sm" numberOfLines={1}>
          {transaction.merchant}
        </Text>
        <View style={{ alignItems: 'flex-start', gap: 8, marginTop: 4 }}>
          <TablePill
            label={localizeExpenseCategory(transaction.category, locale)}
            tone={categoryPillColors({
              color: transaction.categoryColor,
              colors,
              fallbackClassName: getExpenseCategoryStyle(transaction.category).chipClassName,
              scheme,
              type: 'expense',
            })}
          />
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text font="mono" size="xs" color="ink3" numberOfLines={1} style={{ flexShrink: 1 }}>
              {transaction.card}
            </Text>
            <View
              style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: colors.ink4 }}
            />
            <Text font="mono" size="xs" color="ink3" numberOfLines={1}>
              {transaction.date}
            </Text>
          </View>
        </View>
      </View>
      <Text font="monoSemiBold" size="sm" color="negativeFg">
        {formatSpendingAmount(transaction.amount)}
      </Text>
    </View>
  );
}
