// Synced from my-money-v2 (src/lib/db/current-user.ts). Do not edit here: change it
// in the web repo and run `npm run sync:web`.
/**
 * The signed-in user's finance profile. Memoised per server render with React
 * `cache`, so the layout, page, and every query helper share one Clerk session
 * read and one `users` lookup instead of repeating both per call site.
 */
export declare const getCurrentFinanceUser: () => Promise<{
    id: string;
    email: string;
    name: string | null;
    phone: string | null;
    currency: string;
    locale: string;
    themePreference: string;
    preferences: Record<string, boolean>;
    monthlyIncomeTarget: number | null;
    savingsGoalRate: number | null;
    activeHouseholdId: string | null;
    createdAt: Date;
}>;
