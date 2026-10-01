// Synced from my-money-v2 (src/lib/referrals/referral-commission.ts). Do not edit here: change it
// in the web repo and run `npm run sync:web`.
import type { BillingInterval } from "@/lib/billing/plans";

/**
 * Pure rules for the affiliate commission: what a conversion pays the
 * inviter, and when that payment is due.
 */

/**
 * Share of the invitee's first payment owed to the inviter, in basis points:
 * half of the first month on a monthly plan, 12.5% of the year on an annual
 * one.
 */
export const COMMISSION_RATE_BPS: Record<BillingInterval, number> = {
  month: 5000,
  year: 1250,
};

/** Days after the conversion by which the commission must be paid. */
export const COMMISSION_DUE_DAYS = 30;

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Commission for a conversion, in the same minor units (cents) as the amount
 * the invitee paid.
 */
export function commissionFor(
  amountPaid: number,
  interval: BillingInterval,
): number {
  return Math.round((amountPaid * COMMISSION_RATE_BPS[interval]) / 10_000);
}

/** The day a conversion's commission falls due. */
export function commissionDueAt(convertedAt: Date): Date {
  return new Date(convertedAt.getTime() + COMMISSION_DUE_DAYS * DAY_MS);
}
