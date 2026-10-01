// Synced from my-money-v2 (src/lib/transactions/transaction-utils.ts). Do not edit here: change it
// in the web repo and run `npm run sync:web`.
export const transactionTypes = ["income", "expense"] as const;
export type TransactionFormType = (typeof transactionTypes)[number];

export const recurrenceFrequencies = [
  "none",
  "daily",
  "weekly",
  "monthly",
  "yearly",
  "custom",
] as const;
export type RecurrenceFrequency = (typeof recurrenceFrequencies)[number];

/** Bounds for the "every N days" custom recurrence interval. */
export const RECURRENCE_INTERVAL_MIN = 1;
export const RECURRENCE_INTERVAL_MAX = 730;

export function isRecurrenceInterval(value: number): boolean {
  return (
    Number.isInteger(value) &&
    value >= RECURRENCE_INTERVAL_MIN &&
    value <= RECURRENCE_INTERVAL_MAX
  );
}

/**
 * Legacy payment-method values. The form no longer offers them — it lists the
 * workspace's checking accounts and credit cards by name (see
 * `getTransactionFormOptions`) — but stored rows, imports, and the bill
 * settlements written by `card-bills` still carry these, so they stay
 * resolvable and translatable.
 */
export const paymentMethodOptions = [
  "Manual",
  "Automatic (Bank Account)",
] as const;

export const statusOptions = ["Paid", "Unpaid", "Upcoming"] as const;

export type TransactionFormAccount = {
  /** Stored account name — the value a transaction is matched against. */
  name: string;
  /** Bank the account belongs to — how it reads in a picker. */
  bank: string;
  /** Stored name in the user's language (default rows are stored in English). */
  label: string;
  /** Account type token ("checking", "savings", …). */
  type: string;
  /** Default destination for income deposits. */
  isPrimary: boolean;
};

export type TransactionFormCreditCard = {
  name: string;
  last4: string | null;
};

export type CategoryAppearance = {
  /** Hex color ("#7c3aed") or legacy tone token; null when not customized. */
  color: string | null;
  /** Curated lucide icon name or literal emoji; null when not customized. */
  icon: string | null;
};

export type TransactionFormOptions = {
  today: string;
  categories: Record<TransactionFormType, string[]>;
  /** Custom appearance per category, keyed by lowercased category name. */
  categoryMeta: Record<TransactionFormType, Record<string, CategoryAppearance>>;
  paymentMethods: string[];
  statuses: string[];
  /** Non-credit accounts income can be deposited into. */
  bankAccounts: TransactionFormAccount[];
  /** Credit cards selectable as an expense's payment method (by name). */
  creditCards: TransactionFormCreditCard[];
};

export type CreateTransactionInput = {
  name: string;
  description: string;
  amount: number;
  date: string;
  /** Accounting month the transaction belongs to, as a month index 1-12. The
   * stored year is derived from `date`, so a June bill dated in July still
   * counts toward June. */
  fiscalMonth: number;
  /** Exact account name to post to; falls back to payment-method matching. */
  accountName?: string;
  /** Preferred account type ("checking", "savings", "credit", …) when no name is given. */
  balanceType?: string;
  type: TransactionFormType;
  recurrenceFrequency: RecurrenceFrequency;
  /** "Every N days" interval; only read when the frequency is `custom`. */
  recurrenceIntervalDays?: number;
  recurringStartDate: string;
  recurringEndDate: string;
  primaryCategory: string;
  otherCategories: string[];
  paymentMethod: string;
  status: string;
  dueDate: string;
  paymentDate: string;
  installments: number;
};

export function dateInputValue(date: Date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

/** Month indexes 1-12, for building the fiscal-month select. */
export const monthIndexes = Array.from({ length: 12 }, (_, i) => i + 1);

export function isFiscalMonthIndex(value: number): boolean {
  return Number.isInteger(value) && value >= 1 && value <= 12;
}

/** Month (1-12) of a `yyyy-mm-dd` date string, or the current month if invalid. */
export function fiscalMonthIndexFromDate(value: string): number {
  const month = Number(value.slice(5, 7));
  return isFiscalMonthIndex(month) ? month : new Date().getMonth() + 1;
}

/**
 * Resolves a fiscal-month index (1-12) into the first day of that month as a
 * `yyyy-mm-dd` string. The year comes from `referenceDate` (the transaction
 * date), choosing the occurrence within six months so a fiscal month set just
 * across a year boundary (e.g. December on a January transaction) lands on the
 * nearest actual month.
 */
export function resolveFiscalMonthDate(
  monthIndex: number,
  referenceDate: string,
): string {
  const refYear = Number(referenceDate.slice(0, 4));
  const refMonth0 = Number(referenceDate.slice(5, 7)) - 1;
  const target0 = monthIndex - 1;

  let year = Number.isFinite(refYear) ? refYear : new Date().getFullYear();
  const diff = target0 - refMonth0;
  if (diff > 6) year -= 1;
  else if (diff < -6) year += 1;

  return `${year}-${String(monthIndex).padStart(2, "0")}-01`;
}

export function isTransactionFormType(
  value: string | undefined,
): value is TransactionFormType {
  return transactionTypes.includes(value as TransactionFormType);
}

export function isRecurrenceFrequency(
  value: string,
): value is RecurrenceFrequency {
  return recurrenceFrequencies.includes(value as RecurrenceFrequency);
}

/**
 * Longest accepted free-text label. The columns behind these are unbounded
 * `text`, so without a cap a single CSV import can write hundreds of megabytes.
 */
export const MAX_LABEL_LENGTH = 200;

export function cleanLabel(value: string) {
  return value.trim().replace(/\s+/g, " ").slice(0, MAX_LABEL_LENGTH);
}

export function uniqueLabels(values: Iterable<string>) {
  const seen = new Set<string>();
  const labels: string[] = [];

  for (const value of values) {
    const label = cleanLabel(value);
    const key = label.toLowerCase();

    if (label && !seen.has(key)) {
      seen.add(key);
      labels.push(label);
    }
  }

  return labels;
}
