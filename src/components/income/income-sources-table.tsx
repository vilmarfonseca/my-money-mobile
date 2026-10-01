import type { LucideIcon } from 'lucide-react-native';
import {
  BadgeDollarSign,
  Banknote,
  BriefcaseBusiness,
  CircleDollarSign,
  Coins,
  Gift,
  HandCoins,
  Landmark,
  ReceiptText,
  Sparkles,
  Store,
  WalletCards,
} from 'lucide-react-native';
import { View } from 'react-native';

import { DataTable, type DataTableFilter } from '@/components/data-table';
import { CategoryIconBadge, TablePill } from '@/components/transactions/category-icon';
import { useEditTransactionModal } from '@/components/transactions/edit-transaction-modal';
import { Text } from '@/components/ui/text';
import { localizeIncomeCategory } from '@/lib/i18n/labels';
import { useI18n } from '@/lib/i18n/provider';
import type { IncomeSourceRow } from '@/lib/income/income-queries';
import {
  type IncomeSourceCategory,
  getIncomeSourceCategoryStyle,
} from '@/lib/income/source-categories';
import { useTheme } from '@/theme/theme-provider';
import { categoryPillColors, classNameColors, tableTone } from '@/theme/tones';

type IncomeSource = IncomeSourceRow;
type SourceType = IncomeSource['status'];

/** `statusStyles` on the web: the table tone each source type paints with. */
const statusTones: Record<SourceType, 'accent' | 'income' | 'expense'> = {
  Recurring: 'income',
  Variable: 'expense',
  'One-off': 'accent',
};

const sourceIcons: Partial<Record<IncomeSourceCategory, LucideIcon>> = {
  Payroll: BriefcaseBusiness,
  'Client work': Sparkles,
  Reimbursement: ReceiptText,
  Bonus: BadgeDollarSign,
  Commission: HandCoins,
  Dividends: Coins,
  Interest: CircleDollarSign,
  'Rental income': Landmark,
  Royalties: WalletCards,
  Marketplace: Store,
  Refund: Banknote,
  Gift,
  Benefits: HandCoins,
  Pension: Landmark,
  Other: ReceiptText,
};

type IncomeSourcesTableProps = {
  sources: IncomeSource[];
};

export function IncomeSourcesTable({ sources }: IncomeSourcesTableProps) {
  const { formatCurrency, messages } = useI18n();
  const { modal: editModal, openEdit } = useEditTransactionModal();
  const total = sources.reduce((sum, source) => sum + source.amount, 0);
  const statusLabel = (status: SourceType) => messages.income.statuses[status];
  const sourceTypeFilters: Array<DataTableFilter<IncomeSource>> = [
    { label: messages.common.all, value: 'All', predicate: () => true },
    {
      label: messages.income.statuses.Recurring,
      value: 'Recurring',
      predicate: (source) => source.status === 'Recurring',
    },
    {
      label: messages.income.statuses.Variable,
      value: 'Variable',
      predicate: (source) => source.status === 'Variable',
    },
    {
      label: messages.income.statuses['One-off'],
      value: 'One-off',
      predicate: (source) => source.status === 'One-off',
    },
  ];

  return (
    <>
      <DataTable
        title={messages.income.sources}
        data={sources}
        getRowKey={(source) => source.id}
        onRowClick={(source) => {
          if (source.latestTransactionId) openEdit(source.latestTransactionId);
        }}
        searchPlaceholder={messages.income.search}
        searchPredicate={(source, query) =>
          [
            source.name,
            source.institution,
            source.cadence,
            source.category,
            source.status,
            source.lastPaid,
          ]
            .join(' ')
            .toLowerCase()
            .includes(query)
        }
        filters={sourceTypeFilters}
        periodLabel={messages.income.title}
        emptyMessage={messages.income.noSources}
        totalLabel={messages.income.sourceTotal}
        totalValue={formatSignedAmount(total, formatCurrency)}
        renderMobileCard={(source) => (
          <SourceMobileCard source={source} statusLabel={statusLabel} />
        )}
        mobileListStyle="rows"
      />
      {editModal}
    </>
  );
}

function SourceMobileCard({
  source,
  statusLabel,
}: {
  source: IncomeSource;
  statusLabel: (status: SourceType) => string;
}) {
  const { formatCurrency, locale } = useI18n();
  const { colors, scheme } = useTheme();

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingHorizontal: 8,
        paddingVertical: 12,
      }}>
      <SourceIcon source={source} />
      <View style={{ flex: 1 }}>
        <Text font="sansMedium" size="sm" numberOfLines={1}>
          {source.name}
        </Text>
        <View style={{ alignItems: 'flex-start', gap: 8, marginTop: 4 }}>
          <View
            style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              alignItems: 'center',
              columnGap: 8,
              rowGap: 4,
            }}>
            <TablePill
              label={statusLabel(source.status)}
              tone={tableTone(statusTones[source.status], colors)}
            />
            <TablePill
              label={localizeIncomeCategory(source.category, locale)}
              tone={categoryPillColors({
                color: source.categoryColor,
                colors,
                fallbackClassName: getIncomeSourceCategoryStyle(source.category).chipClassName,
                scheme,
                type: statusTones[source.status],
              })}
            />
          </View>
          <Text font="mono" size="xs" color="ink3" numberOfLines={1}>
            {source.lastPaid}
          </Text>
        </View>
      </View>
      <Text font="monoSemiBold" size="sm" color="positiveFg">
        {formatSignedAmount(source.amount, formatCurrency)}
      </Text>
    </View>
  );
}

function SourceIcon({ source }: { source: IncomeSource }) {
  const { colors, scheme } = useTheme();
  const fallback: LucideIcon = sourceIcons[source.category as IncomeSourceCategory] ?? ReceiptText;

  return (
    <CategoryIconBadge
      icon={source.categoryIcon}
      color={source.categoryColor}
      fallbackIcon={fallback}
      // The pastel category chips are illegible on the dark canvas: there the
      // badge takes the source type's tone, as the web's `dark:` classes do.
      tone={
        scheme === 'dark'
          ? tableTone(statusTones[source.status], colors)
          : classNameColors(getIncomeSourceCategoryStyle(source.category).chipClassName, colors)
      }
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
