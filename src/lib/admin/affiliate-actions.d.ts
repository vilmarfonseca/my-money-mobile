// Synced from my-money-v2 (src/lib/admin/affiliate-actions.ts). Do not edit here: change it
// in the web repo and run `npm run sync:web`.
export type CommissionActionResult = {
    ok: boolean;
};
/**
 * Record that one conversion's commission was paid to the affiliate, or undo
 * that. Admin-only; the page refreshes itself afterwards.
 */
export declare function setCommissionPaid(referralId: string, paid: boolean): Promise<CommissionActionResult>;
/**
 * Record one payment covering every commission an affiliate is still owed.
 */
export declare function markAffiliateCommissionsPaid(inviterUserId: string): Promise<CommissionActionResult>;
