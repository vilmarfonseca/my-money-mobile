// Synced from my-money-v2 (src/lib/account/account-actions.ts). Do not edit here: change it
// in the web repo and run `npm run sync:web`.
type DeleteAccountResult = {
    ok: true;
} | {
    ok: false;
    message: string;
};
/**
 * Deletes the signed-in user's whole account: the Stripe customer (which
 * cancels any subscription), every row the user owns (accounts, cards,
 * transactions, goals and — if they created one — their household, all by
 * cascade), and finally the Clerk identity. The reason they gave is emailed
 * to the support inbox first so churn is never silent, and the admin inbox
 * hears about the deletion once it has actually happened.
 *
 * Offered at the bottom of Settings, on any plan.
 */
export declare function deleteOwnAccount(input: {
    reason: string;
    details: string;
}): Promise<DeleteAccountResult>;
export {};
