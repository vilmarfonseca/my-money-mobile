import { AdminKpiCards, type AdminKpiCard } from '@/components/admin/kpi-cards';
import type { AffiliatesPage } from '@/lib/admin/affiliates-queries';
import { formatCommissionTotals, hasCommission } from '@/lib/admin/commission-totals';
import { PAID_PLAN_TIERS } from '@/lib/billing/plans';
import { useI18n } from '@/lib/i18n/provider';

/**
 * Headline numbers for the admin affiliates page: conversions (split by plan
 * and by monthly or yearly billing), sign-ups and active affiliates, then the
 * money: commission earned in the period, how much of it was paid, and the
 * balance still open.
 */
export function AffiliatesKpis({
  asOf,
  plan,
  totals,
}: {
  /** The moment the data was loaded, to tell an overdue balance apart. */
  asOf: string;
  plan: AffiliatesPage['plan'];
  totals: AffiliatesPage['totals'];
}) {
  const { locale, messages } = useI18n();
  const t = messages.admin.affiliates.kpis;
  const tierNames = messages.billing.tierNames;

  // Monthly and yearly conversions pay a different commission, so the mix is
  // always spelled out: for every plan, or for the one the filter selected.
  const paidNote = (plan === 'all' ? PAID_PLAN_TIERS : [plan])
    .map((tier) =>
      t.planMix(tierNames[tier], totals.paidByPlan[tier].month, totals.paidByPlan[tier].year),
    )
    .join(' · ');

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString(locale, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  const overdue = totals.nextDueAt !== null && totals.nextDueAt < asOf;
  const owedNote =
    totals.nextDueAt === null || !hasCommission(totals.commissionOwed)
      ? t.owedNone
      : overdue
        ? t.owedOverdue(formatDate(totals.nextDueAt))
        : t.owedNextDue(formatDate(totals.nextDueAt));

  const cards: AdminKpiCard[] = [
    { label: t.paid, value: totals.paid, note: paidNote, surface: 'glass' },
    { label: t.signedUp, value: totals.signedUp, note: t.inPeriod, surface: 'solid' },
    { label: t.affiliates, value: totals.affiliates, note: t.inPeriod, surface: 'solid' },
    {
      label: t.commission,
      value: formatCommissionTotals(totals.commission, locale),
      note: t.commissionNote,
      surface: 'glass',
    },
    {
      label: t.commissionPaid,
      value: formatCommissionTotals(totals.commissionPaid, locale),
      note: t.commissionPaidNote,
      surface: 'solid',
    },
    {
      label: t.commissionOwed,
      value: formatCommissionTotals(totals.commissionOwed, locale),
      note: owedNote,
      surface: 'solid',
      tone: overdue ? 'negative' : 'default',
    },
  ];

  return <AdminKpiCards cards={cards} />;
}
