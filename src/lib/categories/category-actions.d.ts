// Synced from my-money-v2 (src/lib/categories/category-actions.ts). Do not edit here: change it
// in the web repo and run `npm run sync:web`.
import { type TransactionFormType } from "@/lib/transactions/transaction-utils";
export type UpdateCategoryInput = {
    kind: TransactionFormType;
    /** Current category name (may not be persisted yet for default lists). */
    name: string;
    newName?: string;
    /** Hex color like "#7c3aed"; null clears the custom color. */
    color?: string | null;
    /** Curated lucide icon name or a literal emoji; null clears it. */
    icon?: string | null;
};
export type UpdateCategoryResult = {
    ok: true;
    name: string;
} | {
    ok: false;
    message: string;
};
/**
 * Renames a category and/or sets its custom color and icon. Categories from
 * the built-in default lists are persisted on first customization.
 */
export declare function updateCategory(input: UpdateCategoryInput): Promise<UpdateCategoryResult>;
