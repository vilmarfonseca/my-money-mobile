// Synced from my-money-v2 (src/lib/transactions/transaction-actions.ts). Do not edit here: change it
// in the web repo and run `npm run sync:web`.
import type { CreateTransactionInput } from "@/lib/transactions/transaction-utils";
type TransactionActionResult = {
    ok: true;
} | {
    ok: false;
    message: string;
};
export declare function createTransaction(input: CreateTransactionInput): Promise<TransactionActionResult>;
export {};
