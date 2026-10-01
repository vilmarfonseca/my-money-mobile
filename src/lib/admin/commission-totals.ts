// Synced from my-money-v2 (src/lib/admin/commission-totals.ts). Do not edit here: change it
// in the web repo and run `npm run sync:web`.
import {
  BILLING_CURRENCIES,
  type BillingCurrency,
} from "@/lib/billing/plans";
import type { AppLocale } from "@/lib/i18n/config";
import { formatCurrency } from "@/lib/i18n/format";

/**
 * Commission money, in minor units (cents), kept apart per currency: an
 * invitee billed in dollars earns the affiliate dollars, and the two are
 * never added together.
 */
export type CommissionTotals = Record<BillingCurrency, number>;

export function emptyCommissionTotals(): CommissionTotals {
  return Object.fromEntries(
    BILLING_CURRENCIES.map((currency) => [currency, 0]),
  ) as CommissionTotals;
}

export function addCommissionTotals(
  a: CommissionTotals,
  b: CommissionTotals,
): CommissionTotals {
  return Object.fromEntries(
    BILLING_CURRENCIES.map((currency) => [currency, a[currency] + b[currency]]),
  ) as CommissionTotals;
}

export function hasCommission(totals: CommissionTotals): boolean {
  return BILLING_CURRENCIES.some((currency) => totals[currency] > 0);
}

/**
 * One sortable number for a table column. Mixed currencies are not
 * comparable, so this only orders rows sensibly, it is never displayed.
 */
export function commissionSortValue(totals: CommissionTotals): number {
  return BILLING_CURRENCIES.reduce((sum, currency) => sum + totals[currency], 0);
}

export function formatCommissionAmount(
  cents: number,
  currency: string,
  locale: AppLocale,
): string {
  return formatCurrency(cents / 100, locale, {
    currency: currency.toUpperCase(),
  });
}

/**
 * "R$ 149,50", or "R$ 149,50 + US$ 12,00" when both currencies are owed.
 * Zero everywhere shows as zero in the first currency (reais).
 */
export function formatCommissionTotals(
  totals: CommissionTotals,
  locale: AppLocale,
): string {
  const parts = BILLING_CURRENCIES.filter((currency) => totals[currency] > 0);
  const shown = parts.length > 0 ? parts : [BILLING_CURRENCIES[0]];
  return shown
    .map((currency) => formatCommissionAmount(totals[currency], currency, locale))
    .join(" + ");
}
