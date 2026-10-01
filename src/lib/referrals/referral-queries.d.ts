// Synced from my-money-v2 (src/lib/referrals/referral-queries.ts). Do not edit here: change it
// in the web repo and run `npm run sync:web`.
/**
 * The user's referral code, minted on first need from their Clerk username
 * (falling back to the email's local part). Codes are permanent once set:
 * a link already shared with a friend must keep working.
 */
export declare function ensureReferralCode(user: {
    id: string;
    email: string;
}): Promise<string>;
/** The account behind a code, or null when the code is unknown. */
export declare function findInviterByCode(rawCode: string): Promise<{
    id: string;
    code: string;
    name: string | null;
} | null>;
export type RecordReferralResult = {
    ok: true;
    code: string;
} | {
    ok: false;
    reason: "unknown_code" | "self_referral" | "already_referred" | "already_paid";
};
/**
 * Attach a referral to the signed-in (new) account. Refuses codes that do not
 * exist, the user's own code, a second referral for the same account, and
 * accounts that already bought a paid plan: the free month is for newcomers.
 */
export declare function recordReferral(rawCode: string): Promise<RecordReferralResult>;
/** The unsettled referral that should make this user's next checkout free. */
export declare function getPendingReferralForInvitee(inviteeUserId: string): Promise<{
    id: string;
    inviterUserId: string;
    code: string;
}>;
export type ReferralSummary = {
    code: string;
    link: string;
    /** Friends who signed up with the code but have not gone paid yet. */
    pendingCount: number;
    /** Friends whose paid plan already earned both sides a free month. */
    rewardedCount: number;
    /** Free days this user received, from invites sent and from being invited. */
    freeDaysEarned: number;
    /** Set when this account was itself invited with someone's code. */
    invitedWith: {
        code: string;
        status: "pending" | "rewarded";
    } | null;
};
/** Everything the Settings referral card shows. Deduped per request. */
export declare const getReferralSummary: () => Promise<ReferralSummary>;
