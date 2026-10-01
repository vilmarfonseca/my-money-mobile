import { useState } from 'react';
import { View } from 'react-native';

import { callApi } from '@/api/client';
import { useRefreshData } from '@/api/hooks';
import { DataTable } from '@/components/data-table';
import { Button } from '@/components/ui/button';
import { Chip, type ChipTone } from '@/components/ui/chip';
import { Text } from '@/components/ui/text';
import { toast } from '@/components/ui/toast';
import type { CommissionActionResult } from '@/lib/admin/affiliate-actions';
import type { AffiliateConversion } from '@/lib/admin/affiliates-queries';
import {
  emptyCommissionTotals,
  formatCommissionAmount,
  formatCommissionTotals,
} from '@/lib/admin/commission-totals';
import { isBillingCurrency } from '@/lib/billing/plans';
import { useI18n } from '@/lib/i18n/provider';

type Status = 'paid' | 'overdue' | 'open';

const statusTone: Record<Status, ChipTone> = {
  paid: 'positive',
  overdue: 'negative',
  open: 'warning',
};

/**
 * One affiliate's payment ledger: every paid conversion with its commission,
 * due date and whether it was paid, plus the controls to record a payment.
 */
export function AffiliateConversionsTable({
  affiliateUserId,
  asOf,
  conversions,
}: {
  affiliateUserId: string;
  /** The moment the data was loaded, to tell an overdue commission apart. */
  asOf: string;
  conversions: AffiliateConversion[];
}) {
  const { locale, messages } = useI18n();
  const t = messages.admin.affiliates.detail.table;
  const tierNames = messages.billing.tierNames;
  const refresh = useRefreshData();
  const [isPending, setPending] = useState(false);

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString(locale, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  const statusOf = (row: AffiliateConversion): Status =>
    row.paidAt ? 'paid' : row.dueAt < asOf ? 'overdue' : 'open';
  const isPayable = (row: AffiliateConversion) => !row.paidAt && (row.commissionAmount ?? 0) > 0;
  const commission = (row: AffiliateConversion) =>
    row.commissionAmount !== null && row.commissionCurrency
      ? formatCommissionAmount(row.commissionAmount, row.commissionCurrency, locale)
      : t.unknown;
  const plan = (row: AffiliateConversion) =>
    [
      row.tier ? tierNames[row.tier] : t.unknown,
      row.interval ? t.interval[row.interval] : null,
    ]
      .filter(Boolean)
      .join(' · ');

  // The ledger is reloaded whatever the outcome, so it never shows a payment
  // the server did not record.
  const run = async (action: () => Promise<CommissionActionResult>) => {
    setPending(true);
    try {
      const result = await action().catch(() => ({ ok: false }));
      if (!result.ok) toast.error(t.saveError);
      await refresh();
    } finally {
      setPending(false);
    }
  };

  const statusLabel = (row: AffiliateConversion) => {
    const status = statusOf(row);
    if (status === 'paid' && row.paidAt) return t.statusPaid(formatDate(row.paidAt));
    return status === 'overdue' ? t.statusOverdue : t.statusOpen;
  };
  const toggle = (row: AffiliateConversion) =>
    row.paidAt ? (
      <Button
        size="sm"
        variant="ghost"
        label={t.undo}
        disabled={isPending}
        onPress={() => run(() => callApi('admin.setCommissionPaid', row.referralId, false))}
      />
    ) : isPayable(row) ? (
      <Button
        size="sm"
        variant="outline"
        label={t.markPaid}
        disabled={isPending}
        onPress={() => run(() => callApi('admin.setCommissionPaid', row.referralId, true))}
      />
    ) : null;

  return (
    <DataTable
      title={t.title}
      data={conversions}
      getRowKey={(row) => row.referralId}
      initialPageSize={10}
      initialSort={{ sortValue: (row) => new Date(row.convertedAt).getTime(), direction: 'desc' }}
      searchPlaceholder={t.search}
      searchPredicate={(row, query) =>
        [row.inviteeName ?? '', row.inviteeEmail].some((value) =>
          value.toLowerCase().includes(query),
        )
      }
      filters={[
        { label: t.all, value: 'all', predicate: () => true },
        { label: t.open, value: 'open', predicate: (row) => statusOf(row) !== 'paid' },
        { label: t.overdue, value: 'overdue', predicate: (row) => statusOf(row) === 'overdue' },
        { label: t.paid, value: 'paid', predicate: (row) => statusOf(row) === 'paid' },
      ]}
      periodLabel=""
      showPeriodFilter={false}
      emptyMessage={t.empty}
      headerControls={
        <Button
          variant="default"
          label={t.markAll}
          disabled={isPending || !conversions.some(isPayable)}
          onPress={() => run(() => callApi('admin.markAffiliateCommissionsPaid', affiliateUserId))}
        />
      }
      totalLabel={t.total}
      totalValue={(items) => {
        const totals = emptyCommissionTotals();
        for (const row of items) {
          if (isBillingCurrency(row.commissionCurrency)) {
            totals[row.commissionCurrency] += row.commissionAmount ?? 0;
          }
        }
        return formatCommissionTotals(totals, locale);
      }}
      mobileListStyle="rows"
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
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text font="sansMedium" size="sm" numberOfLines={1}>
              {row.inviteeName ?? row.inviteeEmail}
            </Text>
            <Text size="xs" color="ink3" numberOfLines={1}>
              {plan(row)} · {formatDate(row.convertedAt)}
            </Text>
            <Chip
              size="sm"
              tone={statusTone[statusOf(row)]}
              label={statusLabel(row)}
              style={{ marginTop: 6 }}
            />
          </View>
          <View style={{ alignItems: 'flex-end', gap: 6 }}>
            <Text font="sansSemiBold" size="sm" style={{ fontVariant: ['tabular-nums'] }}>
              {commission(row)}
            </Text>
            <Text size="xs" color="ink3" style={{ fontVariant: ['tabular-nums'] }}>
              {t.dueAt} {formatDate(row.dueAt)}
            </Text>
            {toggle(row)}
          </View>
        </View>
      )}
    />
  );
}
