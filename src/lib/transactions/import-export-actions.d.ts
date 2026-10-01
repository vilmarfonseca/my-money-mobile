// Synced from my-money-v2 (src/lib/transactions/import-export-actions.ts). Do not edit here: change it
// in the web repo and run `npm run sync:web`.
import { type TransactionFileRow } from "@/lib/transactions/import-export";
import { type CreateTransactionInput } from "@/lib/transactions/transaction-utils";
/** One row to import, tagged with its original file line for error reporting. */
export type ImportRowInput = {
    input: CreateTransactionInput;
    row: number;
};
export type ImportTransactionsResult = {
    ok: true;
    imported: number;
    createdAccounts: number;
    errors: {
        row: number;
        message: string;
    }[];
} | {
    ok: false;
    message: string;
};
export declare function importTransactions(rows: ImportRowInput[], options?: {
    allowZeroAmount?: boolean;
}): Promise<ImportTransactionsResult>;
/** Counts shown in the export tab's "What's included" summary. */
export type ExportSummary = {
    accounts: number;
    cards: number;
    transactions: number;
};
export declare function getExportSummary(): Promise<ExportSummary>;
export declare function getTransactionsForExport(): Promise<TransactionFileRow[]>;
