// Synced from my-money-v2 (src/lib/db/current-scope.ts). Do not edit here: change it
// in the web repo and run `npm run sync:web`.
import { type SQL } from "drizzle-orm";
import type { AnyPgColumn } from "drizzle-orm/pg-core";
import { getCurrentFinanceUser } from "@/lib/db/current-user";
export type FinanceUser = Awaited<ReturnType<typeof getCurrentFinanceUser>>;
export type WorkspaceScope = {
    kind: "personal";
} | {
    kind: "household";
    householdId: string;
    householdName: string;
    role: "owner" | "member";
};
export type ScopeContext = {
    user: FinanceUser;
    scope: WorkspaceScope;
};
/**
 * Resolves the signed-in user plus their active workspace. Membership is the
 * only thing trusted for household access, so a stale `activeHouseholdId`
 * (removed member, deleted household) self-heals back to the personal scope.
 */
export declare const getCurrentScope: () => Promise<ScopeContext>;
/** A personal-scope context for flows that must ignore the active workspace
 * (onboarding always creates and counts personal data). */
export declare function personalScope(user: FinanceUser): ScopeContext;
type ScopedColumns = {
    userId: AnyPgColumn;
    householdId: AnyPgColumn;
};
/** WHERE clause selecting rows that belong to the active workspace. */
export declare function scopeFilter(ctx: ScopeContext, cols: ScopedColumns): SQL;
/** Ownership columns for inserts into the active workspace. For household
 * rows `userId` records the author. */
export declare function scopeValues(ctx: ScopeContext): {
    userId: string;
    householdId: string | null;
};
export {};
