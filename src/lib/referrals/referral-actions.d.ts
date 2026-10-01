// Synced from my-money-v2 (src/lib/referrals/referral-actions.ts). Do not edit here: change it
// in the web repo and run `npm run sync:web`.
import { type RecordReferralResult } from "@/lib/referrals/referral-queries";
/**
 * Attach a friend's code to the signed-in account. Used by the post-sign-up
 * hop, both for a code carried in the invite link and for one typed by hand.
 */
export declare function applyReferralCode(code: string): Promise<RecordReferralResult>;
