import {
  Bike,
  Coffee,
  Fuel,
  Hotel,
  Laptop,
  Plane,
  ReceiptText,
  ShoppingBag,
  Sparkles,
  Utensils,
  type LucideIcon,
} from 'lucide-react-native';
import { View } from 'react-native';

import { DataTable } from '@/components/data-table';
import { CategoryIconBadge, TablePill } from '@/components/transactions/category-icon';
import { useEditTransactionModal } from '@/components/transactions/edit-transaction-modal';
import { Text } from '@/components/ui/text';
import {
  cardNetworkLabels,
  type CardTransaction,
  type CreditCardAccount,
} from '@/lib/cards/cards-data';
import { type ExpenseCategory, getExpenseCategoryStyle } from '@/lib/expenses/expense-categories';
import { localizeExpenseCategory } from '@/lib/i18n/labels';
import { useI18n } from '@/lib/i18n/provider';
import { useTheme } from '@/theme/theme-provider';
import { categoryPillColors } from '@/theme/tones';

type CardTransactionsTableProps = {
  cards: CreditCardAccount[];
  transactions: CardTransaction[];
};

const transactionIcons: Partial<Record<ExpenseCategory, LucideIcon>> = {
  Groceries: ShoppingBag,
  'Eating out': Utensils,
  Coffee,
  Transport: Bike,
  Gas: Fuel,
  Subscriptions: Sparkles,
  Shopping: ShoppingBag,
  Phone: Laptop,
  Travel: Plane,
  Flights: Plane,
  Hotels: Hotel,
};

export function CardTransactionsTable({ cards, transactions }: CardTransactionsTableProps) {
  const { formatCurrency, messages } = useI18n();
  const { modal: editModal, openEdit } = useEditTransactionModal();
  const formatSpendingAmount = (value: number) => `-${formatCurrency(Math.abs(value))}`;
  const cardById = new Map(cards.map((card) => [card.id, card]));

  return (
    <>
      {editModal}
      <DataTable
        title={messages.cardsPage.recentTransactions}
        data={transactions}
        onRowClick={(transaction) => openEdit(transaction.id)}
        getRowKey={(transaction) => transaction.id}
        searchPlaceholder={messages.cardsPage.searchActivity}
        searchPredicate={(transaction, query) => {
          const card = cardById.get(transaction.cardId);

          return [
            transaction.merchant,
            transaction.detail,
            transaction.category,
            transaction.date,
            card?.nickname,
            card?.last4,
            card ? cardNetworkLabels[card.network] : null,
          ]
            .filter(Boolean)
            .join(' ')
            .toLowerCase()
            .includes(query);
        }}
        filters={[]}
        periodLabel={messages.cardsPage.activityPeriod}
        emptyMessage={messages.cardsPage.noTransactions}
        totalLabel={messages.common.total}
        totalValue={(items) => (
          <Text font="display" size="2xl" tight color="negativeFg">
            {formatSpendingAmount(items.reduce((sum, transaction) => sum + transaction.amount, 0))}
          </Text>
        )}
        initialSort={{ sortValue: (transaction) => transaction.occurredAt, direction: 'desc' }}
        showFilters={false}
        showPeriodFilter={false}
        renderMobileCard={(transaction) => (
          <TransactionMobileCard
            card={cardById.get(transaction.cardId)}
            transaction={transaction}
          />
        )}
        mobileListStyle="rows"
      />
    </>
  );
}

function TransactionMobileCard({
  card,
  transaction,
}: {
  card?: CreditCardAccount;
  transaction: CardTransaction;
}) {
  const { formatCurrency, locale, messages } = useI18n();
  const { colors, scheme } = useTheme();
  const tone = categoryPillColors({
    color: transaction.categoryColor,
    colors,
    fallbackClassName: getExpenseCategoryStyle(transaction.category).chipClassName,
    scheme,
    type: 'expense',
  });

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingHorizontal: 8,
        paddingVertical: 12,
      }}>
      <CategoryIconBadge
        icon={transaction.categoryIcon}
        color={transaction.categoryColor}
        fallbackIcon={transactionIcons[transaction.category] ?? ReceiptText}
        tone={tone}
      />
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text font="sansMedium" size="sm" numberOfLines={1}>
          {transaction.merchant}
        </Text>
        <View style={{ alignItems: 'flex-start', gap: 8, marginTop: 4 }}>
          <TablePill label={localizeExpenseCategory(transaction.category, locale)} tone={tone} />
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text font="mono" size="xs" color="ink3" numberOfLines={1} style={{ flexShrink: 1 }}>
              {card ? `${card.nickname} ${card.last4}` : messages.cardsPage.unknownCard}
            </Text>
            <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: colors.ink4 }} />
            <Text font="mono" size="xs" color="ink3" numberOfLines={1}>
              {transaction.date}
            </Text>
          </View>
        </View>
      </View>
      <Text font="monoSemiBold" size="sm" color="negativeFg">
        {`-${formatCurrency(Math.abs(transaction.amount))}`}
      </Text>
    </View>
  );
}
