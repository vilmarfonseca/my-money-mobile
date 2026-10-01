// Synced from my-money-v2 (src/lib/cards/cards-actions.ts). Do not edit here: change it
// in the web repo and run `npm run sync:web`.
import { type CardNetwork, type CardPaletteId, type CreditCardAccount } from "@/lib/cards/cards-data";
export type CreditCardFormInput = {
    /** Custom hex color for the card face (overrides the legacy palette). */
    color?: string | null;
    /** Day of the month the payment falls due (1-31); repeats every month. */
    dueDay?: number | string | null;
    /** How many days before the due day the statement closes (1-15). */
    closingOffsetDays?: number | string | null;
    /** Débito automático: settle the bill automatically on its due date. */
    autoDebit?: boolean;
    /** Bank account the automatic payment comes from (required when on). */
    autoDebitAccountId?: string | null;
    expires: string;
    holder: string;
    last4: string;
    limit: string;
    network: CardNetwork;
    nickname: string;
    palette: CardPaletteId;
};
type CreditCardActionResult = {
    ok: true;
    cards: CreditCardAccount[];
} | {
    ok: false;
    message: string;
};
export declare function createCreditCard(input: CreditCardFormInput): Promise<CreditCardActionResult>;
export declare function updateCreditCard(cardId: string, input: CreditCardFormInput): Promise<CreditCardActionResult>;
export declare function updateCreditCardPalette(cardId: string, palette: CardPaletteId): Promise<CreditCardActionResult>;
export declare function deleteCreditCard(cardId: string): Promise<CreditCardActionResult>;
export declare function reorderCreditCards(cardIds: string[]): Promise<CreditCardActionResult>;
export {};
