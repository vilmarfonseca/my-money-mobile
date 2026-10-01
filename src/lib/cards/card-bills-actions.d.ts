// Synced from my-money-v2 (src/lib/cards/card-bills-actions.ts). Do not edit here: change it
// in the web repo and run `npm run sync:web`.
import { type CardBill } from "@/lib/cards/card-bills";
export type BankAccountOption = {
    id: string;
    name: string;
    isPrimary: boolean;
};
export type CardBillContext = {
    ok: true;
    bill: CardBill | null;
    accounts: BankAccountOption[];
} | {
    ok: false;
    message: string;
};
/** Everything the bill modal needs: the card's open bill + payable accounts. */
export declare function getCardBillContext(cardId: string): Promise<CardBillContext>;
export declare function listBankAccountOptions(): Promise<BankAccountOption[]>;
export type PayCardBillInput = {
    cardId: string;
    accountId: string;
    /** `yyyy-mm-dd` day the user actually paid the bill. */
    paymentDate: string;
};
export declare function payCardBill(input: PayCardBillInput): Promise<{
    ok: true;
} | {
    ok: false;
    message: string;
}>;
