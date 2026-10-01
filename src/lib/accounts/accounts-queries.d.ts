// Synced from my-money-v2 (src/lib/accounts/accounts-queries.ts). Do not edit here: change it
// in the web repo and run `npm run sync:web`.
import { type AccountActivity, type Bank } from "@/lib/accounts/accounts-data";
import { type ScopeContext } from "@/lib/db/current-scope";
import { type AppLocale } from "@/lib/i18n/config";
export type AccountsPageData = {
    banks: Bank[];
    activities: AccountActivity[];
    locale: AppLocale;
};
export declare function getAccountsPageData(): Promise<AccountsPageData>;
export declare function getBanks(ctx: ScopeContext, locale: AppLocale): Promise<Bank[]>;
export declare function getAccountActivities(ctx: ScopeContext, banks: Bank[], locale: AppLocale): Promise<AccountActivity[]>;
/** Per-request memo of `getAccountsPageData` shared by the streamed cards. */
export declare const loadAccountsPage: () => Promise<AccountsPageData>;
