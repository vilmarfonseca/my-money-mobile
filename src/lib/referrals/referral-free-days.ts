// Synced from my-money-v2 (src/lib/referrals/referral-free-days.ts). Do not edit here: change it
// in the web repo and run `npm run sync:web`.
import { REFERRAL_FREE_DAYS } from "@/lib/referrals/referral-code";

const DAY_SECONDS = 24 * 60 * 60;

/**
 * When a subscription's referral free days should end, in Unix seconds: the
 * free days go on top of whatever the subscription already covers.
 *
 * That is the later of its trial end and the end of the period it has paid
 * for. Stripe keeps `trial_end` on a subscription after the trial is over, so
 * a friend who just paid for a month (or a year) at the end of their 7 free
 * days has a `trial_end` in the past: counting from it would start the free
 * days today and bill them again in 30 days, on top of the period they just
 * paid for. A subscription already inside earlier free days has both dates
 * equal, and each new grant pushes them further.
 */
export function freeDaysEnd({
  trialEnd,
  periodEnd,
  now,
}: {
  trialEnd: number | null | undefined;
  periodEnd: number | null | undefined;
  now: number;
}): number {
  const covered = Math.max(trialEnd ?? 0, periodEnd ?? 0, now);
  return covered + REFERRAL_FREE_DAYS * DAY_SECONDS;
}
