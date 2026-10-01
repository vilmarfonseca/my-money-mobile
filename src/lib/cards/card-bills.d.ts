// Synced from my-money-v2 (src/lib/cards/card-bills.ts). Do not edit here: change it
// in the web repo and run `npm run sync:web`.
import { type ScopeContext } from "@/lib/db/current-scope";
import { type AppLocale } from "@/lib/i18n/config";
/**
 * Card bills are virtual until they are paid: a bill is the card's current
 * outstanding balance, shown against the card's next due date, and it tracks
 * every new charge live. Paying a bill (by hand, or automatically for cards
 * with débito automático) writes a settlement row — an `expense` on the paying
 * bank account with `billCreditCardId` set, filed under the workspace's
 * "credit card" category — which deducts the account and zeroes the card's
 * derived debt. Nothing else is materialized.
 */
/** Localized name of the auto-created category card bill payments file under. */
export declare const cardBillCategoryNames: Record<AppLocale, string>;
/**
 * The expense category that card bill payments post to. Created the first
 * time a card is added (or a bill settles, as a safety net for older cards);
 * subsequent calls return the existing row without touching its appearance.
 */
export declare function ensureCardBillCategory(ctx: ScopeContext, locale: AppLocale): Promise<string>;
export type CardBill = {
    cardId: string;
    cardName: string;
    last4: string | null;
    /** Current outstanding balance on the card — updates as charges post. */
    amount: number;
    /** Due date of the cycle this bill belongs to (yyyy-mm-dd). */
    dueDate: string;
    /** True from the due day onward while the bill is unpaid. */
    overdue: boolean;
    autoDebit: boolean;
    autoDebitAccountId: string | null;
};
/**
 * One open (unpaid) bill per card that has a due day and outstanding debt.
 * The bill sits on the last passed due date while unpaid there (overdue),
 * otherwise on the next upcoming due date.
 */
export declare function getOpenCardBills(ctx: ScopeContext): Promise<CardBill[]>;
/**
 * Settles every overdue bill on cards with débito automático enabled. Runs
 * lazily from the main page loaders (there is no cron), so payment happens the
 * first time the app is opened after a due date passes; the settlement is
 * dated on the due date itself so reports stay correct.
 */
export declare function settleDueAutoDebitBills(ctx: ScopeContext): Promise<void>;
type SettleCardBillInput = {
    accountId: string;
    amount: number;
    cardId: string;
    cardName: string;
    cycleDueDate: string;
    locale: AppLocale;
    paymentDate: string;
    paymentMethod: "Automatic (Bank Account)" | "Manual";
};
/**
 * Writes one bill settlement: an `expense` row on the paying bank account
 * (negative amount, deducted from the stored balance) tagged with
 * `billCreditCardId` so the card's derived debt drops to zero. The row files
 * under the workspace's "credit card" category, so the payment is trackable on
 * the expenses page, dashboard, and calendar like any other transaction.
 * Idempotent per (card, cycle due date).
 */
export declare function settleCardBill(ctx: ScopeContext, input: SettleCardBillInput): Promise<boolean>;
export {};
