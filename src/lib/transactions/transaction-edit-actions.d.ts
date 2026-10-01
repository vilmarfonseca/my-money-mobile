// Synced from my-money-v2 (src/lib/transactions/transaction-edit-actions.ts). Do not edit here: change it
// in the web repo and run `npm run sync:web`.
import { type CreateTransactionInput, type TransactionFormOptions, type TransactionFormType } from "@/lib/transactions/transaction-utils";
export type TransactionEditValues = CreateTransactionInput & {
    type: TransactionFormType;
};
export type TransactionEditContext = {
    ok: true;
    options: TransactionFormOptions;
    values: TransactionEditValues;
} | {
    ok: false;
    message: string;
};
/** Everything the edit modal needs to open prefilled, in one round trip. */
export declare function getTransactionEditContext(transactionId: string): Promise<TransactionEditContext>;
type TransactionMutationResult = {
    ok: true;
} | {
    ok: false;
    message: string;
};
type UpdateTransactionResult = TransactionMutationResult;
/** Hard-deletes one transaction, scoped like every other ledger mutation. */
export declare function deleteTransaction(transactionId: string): Promise<TransactionMutationResult>;
export declare function updateTransaction(transactionId: string, input: CreateTransactionInput): Promise<UpdateTransactionResult>;
export {};
