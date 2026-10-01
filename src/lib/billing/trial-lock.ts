// Synced from my-money-v2 (src/lib/billing/trial-lock.ts). Do not edit here: change it
// in the web repo and run `npm run sync:web`.
import { ACCESS_STATUSES, TRIAL_LAPSE_BEHAVIOR } from "@/lib/billing/plans";

export type TrialLockRow = {
  status: string | null;
  trialKind: "checkout" | "gift" | null;
  trialEndsAt: Date | null;
  firstPaidAt: Date | null;
};

/**
 * Whether an account is shut out of the app because the 7 free days it
 * started a paid plan with are over and nothing was ever paid. Referral
 * gift days never lock (they lapse to Starter), a live subscription of any
 * kind never locks, and the first payment lifts the lock for good.
 */
export function isTrialLockedOut(
  row: TrialLockRow,
  now: Date = new Date(),
): boolean {
  if (TRIAL_LAPSE_BEHAVIOR !== "lock") return false;
  if (row.trialKind !== "checkout") return false;
  if (row.firstPaidAt) return false;
  if (!row.trialEndsAt || row.trialEndsAt.getTime() > now.getTime())
    return false;
  return !(row.status && ACCESS_STATUSES.has(row.status));
}
