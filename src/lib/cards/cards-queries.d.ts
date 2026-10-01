// Synced from my-money-v2 (src/lib/cards/cards-queries.ts). Do not edit here: change it
// in the web repo and run `npm run sync:web`.
import { type ScopeContext } from "@/lib/db/current-scope";
import { type AppLocale } from "@/lib/i18n/config";
import { type DateRangeParams } from "@/lib/date-range";
import { type CardBill } from "@/lib/cards/card-bills";
import { type CardTransaction, type CreditCardAccount } from "@/lib/cards/cards-data";
export type CardsPageData = {
    cards: CreditCardAccount[];
    /** Open (unpaid) statement bills, one per card with outstanding debt. */
    bills: CardBill[];
    locale: AppLocale;
    periodLabel: string;
    transactions: CardTransaction[];
    /** Trailing 6 months of activity — the trend stays filter-independent. */
    trendTransactions: CardTransaction[];
};
export type CardPeriod = "month" | "quarter" | "ytd" | "custom";
export declare function getCardsPageData(period?: CardPeriod, customRange?: DateRangeParams): Promise<CardsPageData>;
export declare function getCreditCards(ctx: ScopeContext, locale?: AppLocale): Promise<CreditCardAccount[]>;
/** Per-request memo of `getCardsPageData` shared by the streamed cards. */
export declare const loadCardsPage: (period: CardPeriod, from: string | undefined, to: string | undefined) => Promise<CardsPageData>;
