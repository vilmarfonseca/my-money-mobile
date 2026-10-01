import { type Href, useRouter } from 'expo-router';
import { View } from 'react-native';

import { DataTable } from '@/components/data-table';
import { Text } from '@/components/ui/text';
import type { AffiliateRow } from '@/lib/admin/affiliates-queries';
import { formatCommissionTotals, hasCommission } from '@/lib/admin/commission-totals';
import type { PaidPlanTier } from '@/lib/billing/plans';
import { useI18n } from '@/lib/i18n/provider';

/**
 * Admin list of inviters: paid conversions in the period, the commission
 * those conversions earned, and the balance still to pay. Each affiliate
 * opens their payment ledger.
 */
export function AffiliatesTable({
  asOf,
  rows,
}: {
  /** The moment the data was loaded, to tell an overdue balance apart. */
  asOf: string;
  rows: AffiliateRow[];
}) {
  const { locale, messages } = useI18n();
  const router = useRouter();
  const t = messages.admin.affiliates.table;
  const tierNames = messages.billing.tierNames;

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString(locale, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  // Monthly first, yearly second: the two pay a different commission.
  const split = (row: AffiliateRow, tier: PaidPlanTier) =>
    `${row.paidByPlan[tier].month} · ${row.paidByPlan[tier].year}`;
  const isOverdue = (row: AffiliateRow) => row.nextDueAt !== null && row.nextDueAt < asOf;

  return (
    <DataTable
      title={t.title}
      data={rows}
      getRowKey={(row) => row.userId}
      initialPageSize={10}
      initialSort={{ sortValue: (row) => row.paid, direction: 'desc' }}
      searchPlaceholder={t.search}
      searchPredicate={(row, query) =>
        [row.name ?? '', row.email, row.code].some((value) => value.toLowerCase().includes(query))
      }
      filters={[
        { label: t.all, value: 'all', predicate: () => true },
        { label: t.withPaid, value: 'paid', predicate: (row) => row.paid > 0 },
        { label: t.withoutPaid, value: 'unpaid', predicate: (row) => row.paid === 0 },
        { label: t.withOwed, value: 'owed', predicate: (row) => hasCommission(row.commissionOwed) },
      ]}
      periodLabel=""
      showPeriodFilter={false}
      emptyMessage={t.empty}
      totalLabel={t.total}
      totalValue={(items) => items.reduce((sum, row) => sum + row.paid, 0)}
      mobileListStyle="rows"
      onRowClick={(row) => router.push(`/admin/affiliates/${row.userId}` as Href)}
      renderMobileCard={(row) => (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            paddingHorizontal: 8,
            paddingVertical: 12,
          }}>
          <View style={{ flex: 1, minWidth: 72 }}>
            <Text font="sansMedium" size="sm" numberOfLines={1}>
              {row.name ?? row.email}
            </Text>
            <Text font="mono" size="xs" color="ink3" numberOfLines={1}>
              {row.code}
            </Text>
          </View>
          <View style={{ flexShrink: 1, alignItems: 'flex-end' }}>
            <Text
              font="sansSemiBold"
              size="sm"
              align="right"
              style={{ fontVariant: ['tabular-nums'] }}>
              {row.paid} {t.paid.toLowerCase()} · {formatCommissionTotals(row.commission, locale)}
            </Text>
            <Text size="xs" color="ink3" align="right" style={{ fontVariant: ['tabular-nums'] }}>
              {tierNames.plus} {split(row, 'plus')} · {tierNames.premium} {split(row, 'premium')}
            </Text>
            <Text
              size="xs"
              color={isOverdue(row) ? 'negativeFg' : 'ink3'}
              align="right"
              style={{ fontVariant: ['tabular-nums'] }}>
              {t.commissionOwed} {formatCommissionTotals(row.commissionOwed, locale)}
              {row.nextDueAt ? ` · ${formatDate(row.nextDueAt)}` : null}
            </Text>
          </View>
        </View>
      )}
    />
  );
}
