// Synced from my-money-v2 (src/lib/transactions/import-export.ts). Do not edit here: change it
// in the web repo and run `npm run sync:web`.
import type { AppLocale } from "@/lib/i18n/config";
import {
  dateInputValue,
  type CreateTransactionInput,
  type RecurrenceFrequency,
  type TransactionFormType,
} from "@/lib/transactions/transaction-utils";

export const maxImportRows = 2000;

export const transactionFileFormats = ["csv", "xlsx", "ofx"] as const;
export type TransactionFileFormat = (typeof transactionFileFormats)[number];

/** Formats written as spreadsheets; OFX gets its own text writer. */
export type SpreadsheetFileFormat = Exclude<TransactionFileFormat, "ofx">;

/**
 * Column contract for import and export files. Export writes these columns
 * and import reads them, so an exported file can be re-imported as-is.
 * Both en-US and pt-BR headers and values are accepted on import.
 *
 * `account` holds the bank account name, `credit_card` the card name, and
 * `payment_method` the balance the money moved through ("checking",
 * "savings", "cash", "credit card", …).
 */
export const transactionFileColumns = [
  "type",
  "name",
  "description",
  "amount",
  "date",
  "fiscal_month",
  "account",
  "credit_card",
  "payment_method",
  "primary_category",
  "other_categories",
  "status",
  "due_date",
  "payment_date",
  "installments",
  "recurrence_frequency",
  "recurring_start_date",
  "recurring_end_date",
] as const;

export type TransactionFileColumn = (typeof transactionFileColumns)[number];
export type TransactionFileRow = Record<TransactionFileColumn, string | number>;

/** Localized header labels; downloads use the user's locale. */
export const transactionFileColumnLabels: Record<
  AppLocale,
  Record<TransactionFileColumn, string>
> = {
  "en-US": Object.fromEntries(
    transactionFileColumns.map((column) => [column, column]),
  ) as Record<TransactionFileColumn, string>,
  "pt-BR": {
    type: "tipo",
    name: "nome",
    description: "descrição",
    amount: "valor",
    date: "data",
    fiscal_month: "mês_de_competência",
    account: "conta",
    credit_card: "cartão_de_crédito",
    payment_method: "forma_de_pagamento",
    primary_category: "categoria_principal",
    other_categories: "outras_categorias",
    status: "status",
    due_date: "data_de_vencimento",
    payment_date: "data_de_pagamento",
    installments: "parcelas",
    recurrence_frequency: "recorrência",
    recurring_start_date: "início_da_recorrência",
    recurring_end_date: "fim_da_recorrência",
  },
};

export function transactionFileHeaders(locale: AppLocale) {
  return transactionFileColumns.map(
    (column) => transactionFileColumnLabels[locale][column],
  );
}

export const exampleFileName: Record<AppLocale, string> = {
  "en-US": "my-money-import-example",
  "pt-BR": "my-money-exemplo-importacao",
};

export const exportFileName: Record<AppLocale, string> = {
  "en-US": "my-money-transactions",
  "pt-BR": "my-money-transacoes",
};

/* -------------------------------------------------------------------------- */
/* Localized value vocabularies                                                */
/* -------------------------------------------------------------------------- */

const typeLabels: Record<AppLocale, Record<TransactionFormType, string>> = {
  "en-US": { expense: "expense", income: "income" },
  "pt-BR": { expense: "despesa", income: "receita" },
};

export function recurrenceLabel(
  frequency: RecurrenceFrequency,
  locale: AppLocale,
) {
  return frequencyLabels[locale][frequency];
}

const frequencyLabels: Record<
  AppLocale,
  Record<RecurrenceFrequency, string>
> = {
  "en-US": {
    none: "none",
    daily: "daily",
    weekly: "weekly",
    monthly: "monthly",
    yearly: "yearly",
    custom: "custom",
  },
  "pt-BR": {
    none: "não recorrente",
    daily: "diária",
    weekly: "semanal",
    monthly: "mensal",
    yearly: "anual",
    custom: "personalizada",
  },
};

const statusLabels: Record<AppLocale, Record<string, string>> = {
  "en-US": { Paid: "Paid", Unpaid: "Unpaid", Upcoming: "Upcoming" },
  "pt-BR": { Paid: "Pago", Unpaid: "Em aberto", Upcoming: "Próximo" },
};

/**
 * Balance types for the payment_method column. Canonical keys follow the
 * account `type` enum, with "credit" shown as "credit card".
 */
const balanceLabels: Record<AppLocale, Record<string, string>> = {
  "en-US": {
    checking: "checking",
    savings: "savings",
    brokerage: "brokerage",
    cash: "cash",
    loan: "loan",
    other: "other",
    credit: "credit card",
  },
  "pt-BR": {
    checking: "conta corrente",
    savings: "poupança",
    brokerage: "corretora",
    cash: "dinheiro",
    loan: "empréstimo",
    other: "outra",
    credit: "cartão de crédito",
  },
};

/** Legacy payment-method spellings from earlier file versions. */
const legacyMethodLabels: Record<AppLocale, Record<string, string>> = {
  "en-US": {
    Manual: "Manual",
    "Automatic (Bank Account)": "Automatic (Bank Account)",
    "Automatic (Credit Card)": "Automatic (Credit Card)",
    Deposit: "Deposit",
  },
  "pt-BR": {
    Manual: "Manual",
    "Automatic (Bank Account)": "Automático (conta bancária)",
    "Automatic (Credit Card)": "Automático (cartão de crédito)",
    Deposit: "Depósito",
  },
};

/** Extra header spellings accepted on import, mapped to canonical columns. */
const extraHeaderAliases: Record<string, TransactionFileColumn> = {
  categoria: "primary_category",
  cartao: "credit_card",
  metodo_de_pagamento: "payment_method",
  forma_de_pagamento: "payment_method",
  frequencia_de_recorrencia: "recurrence_frequency",
  data_inicial_da_recorrencia: "recurring_start_date",
  data_final_da_recorrencia: "recurring_end_date",
  vencimento: "due_date",
  competencia: "fiscal_month",
  mes_de_competencia: "fiscal_month",
  mes_fiscal: "fiscal_month",
  fiscal_month: "fiscal_month",
};

function buildLookup(
  labelsByLocale: Record<AppLocale, Record<string, string>>,
  extras: Record<string, string> = {},
) {
  const lookup = new Map<string, string>();
  for (const labels of Object.values(labelsByLocale)) {
    for (const [canonical, label] of Object.entries(labels)) {
      lookup.set(normalizeToken(label), canonical);
    }
  }
  for (const [alias, canonical] of Object.entries(extras)) {
    lookup.set(normalizeToken(alias), canonical);
  }
  return lookup;
}

const headerLookup = (() => {
  const lookup = new Map<string, TransactionFileColumn>();
  for (const labels of Object.values(transactionFileColumnLabels)) {
    for (const [column, label] of Object.entries(labels)) {
      lookup.set(normalizeToken(label), column as TransactionFileColumn);
    }
  }
  for (const [alias, column] of Object.entries(extraHeaderAliases)) {
    lookup.set(normalizeToken(alias), column);
  }
  return lookup;
})();

const typeLookup = buildLookup(typeLabels, {
  gasto: "expense",
  renda: "income",
});
const frequencyLookup = buildLookup(frequencyLabels, {
  "not recurring": "none",
  nenhuma: "none",
  nao: "none",
  no: "none",
  annual: "yearly",
});
const statusLookup = buildLookup(statusLabels, {
  "nao pago": "Unpaid",
  pendente: "Unpaid",
  "a vencer": "Upcoming",
});
const balanceLookup = buildLookup(balanceLabels, {
  credit: "credit",
  cartao: "credit",
  "conta-corrente": "checking",
  poupanca: "savings",
  cofrinho: "savings",
});
const legacyMethodLookup = buildLookup(legacyMethodLabels, {
  "debito automatico": "Automatic (Bank Account)",
});

/** Localized month name (index 1-12) for writing the fiscal_month column. */
function localizedMonthName(monthIndex: number, locale: AppLocale) {
  return new Intl.DateTimeFormat(locale, { month: "long" }).format(
    new Date(2020, monthIndex - 1, 1),
  );
}

/** Month names (long + short, both locales) mapped to their index 1-12. */
const monthNameLookup = (() => {
  const lookup = new Map<string, number>();
  for (const locale of ["en-US", "pt-BR"] as const) {
    for (let month = 1; month <= 12; month += 1) {
      const date = new Date(2020, month - 1, 1);
      for (const style of ["long", "short"] as const) {
        const name = new Intl.DateTimeFormat(locale, {
          month: style,
        }).format(date);
        lookup.set(normalizeToken(name.replace(/\./g, "")), month);
      }
    }
  }
  return lookup;
})();

/**
 * Resolves a fiscal_month cell (localized month name, a number 1-12, or a
 * `yyyy-mm` prefix) to a month index. Falls back to the month of `dateFallback`
 * so a file without the column still gets a sensible fiscal month.
 */
function parseFiscalMonthIndex(value: unknown, dateFallback: string): number {
  const text = textCell(value);
  if (text) {
    const iso = /^(\d{4})-(\d{2})/.exec(text);
    if (iso) {
      const month = Number(iso[2]);
      if (month >= 1 && month <= 12) return month;
    }
    const numeric = Number(text);
    if (Number.isInteger(numeric) && numeric >= 1 && numeric <= 12) {
      return numeric;
    }
    const byName = monthNameLookup.get(normalizeToken(text.replace(/\./g, "")));
    if (byName) return byName;
  }

  const fromDate = Number(dateFallback.slice(5, 7));
  return fromDate >= 1 && fromDate <= 12 ? fromDate : new Date().getMonth() + 1;
}

/* -------------------------------------------------------------------------- */
/* Example file                                                                */
/* -------------------------------------------------------------------------- */

type LocalizedText = Record<AppLocale, string>;

type ExampleSeed = {
  type: TransactionFormType;
  name: LocalizedText;
  description: LocalizedText;
  amount: number;
  /** Day offsets from today. */
  dateOffset: number;
  primaryCategory: LocalizedText;
  otherCategories: LocalizedText[];
  /** Canonical balance key from `balanceLabels`. */
  balance: string;
  status: string;
  dueDateOffset?: number;
  paymentDateOffset?: number;
  installments: number;
  recurrenceFrequency: RecurrenceFrequency;
  recurringStartOffset?: number;
  recurringEndOffset?: number;
};

/**
 * One row per option the importer supports: both types, all three statuses,
 * several balance types (checking, savings, cash, credit card), all
 * recurrence frequencies (with start and end dates), installments, extra
 * categories, and free-text descriptions. The account and credit_card
 * columns stay empty because names are user-specific; filling one targets
 * that exact account or card.
 */
const exampleSeeds: ExampleSeed[] = [
  {
    type: "expense",
    name: {
      "en-US": "Whole Foods Market",
      "pt-BR": "Supermercado Pão Dourado",
    },
    description: { "en-US": "Weekly groceries", "pt-BR": "Compras da semana" },
    amount: 82.45,
    dateOffset: -3,
    primaryCategory: { "en-US": "Groceries", "pt-BR": "Mercado" },
    otherCategories: [
      { "en-US": "Household", "pt-BR": "Casa" },
      { "en-US": "Food", "pt-BR": "Alimentação" },
    ],
    balance: "checking",
    status: "Paid",
    dueDateOffset: -3,
    paymentDateOffset: -3,
    installments: 1,
    recurrenceFrequency: "none",
  },
  {
    type: "expense",
    name: {
      "en-US": "Streaming subscription",
      "pt-BR": "Assinatura de streaming",
    },
    description: { "en-US": "Family plan", "pt-BR": "Plano família" },
    amount: 15.99,
    dateOffset: -1,
    primaryCategory: { "en-US": "Entertainment", "pt-BR": "Entretenimento" },
    otherCategories: [],
    balance: "credit",
    status: "Upcoming",
    dueDateOffset: 12,
    installments: 1,
    recurrenceFrequency: "monthly",
    recurringStartOffset: -60,
  },
  {
    type: "expense",
    name: { "en-US": "New laptop", "pt-BR": "Notebook novo" },
    description: {
      "en-US": "Paid in 12 installments",
      "pt-BR": "Pago em 12 parcelas",
    },
    amount: 2400,
    dateOffset: -10,
    primaryCategory: { "en-US": "Shopping", "pt-BR": "Compras" },
    otherCategories: [{ "en-US": "Work", "pt-BR": "Trabalho" }],
    balance: "credit",
    status: "Paid",
    dueDateOffset: -10,
    paymentDateOffset: -10,
    installments: 12,
    recurrenceFrequency: "none",
  },
  {
    type: "expense",
    name: { "en-US": "Commute parking", "pt-BR": "Estacionamento" },
    description: {
      "en-US": "Garage next to the office",
      "pt-BR": "Garagem ao lado do escritório",
    },
    amount: 8.5,
    dateOffset: -1,
    primaryCategory: { "en-US": "Transport", "pt-BR": "Transporte" },
    otherCategories: [],
    balance: "cash",
    status: "Paid",
    dueDateOffset: -1,
    paymentDateOffset: -1,
    installments: 1,
    recurrenceFrequency: "daily",
    recurringStartOffset: -14,
  },
  {
    type: "expense",
    name: { "en-US": "House cleaning", "pt-BR": "Faxina" },
    description: { "en-US": "Every Friday", "pt-BR": "Toda sexta-feira" },
    amount: 120,
    dateOffset: 2,
    primaryCategory: { "en-US": "Home services", "pt-BR": "Serviços de casa" },
    otherCategories: [],
    balance: "checking",
    status: "Unpaid",
    dueDateOffset: 2,
    installments: 1,
    recurrenceFrequency: "weekly",
    recurringStartOffset: -30,
  },
  {
    type: "expense",
    name: { "en-US": "Car insurance", "pt-BR": "Seguro do carro" },
    description: {
      "en-US": "Policy renews every July",
      "pt-BR": "Apólice renova todo julho",
    },
    amount: 980,
    dateOffset: 20,
    primaryCategory: { "en-US": "Insurance", "pt-BR": "Seguros" },
    otherCategories: [{ "en-US": "Car", "pt-BR": "Carro" }],
    balance: "savings",
    status: "Upcoming",
    dueDateOffset: 20,
    installments: 1,
    recurrenceFrequency: "yearly",
    recurringStartOffset: -345,
    recurringEndOffset: 750,
  },
  {
    type: "income",
    name: { "en-US": "Acme payroll", "pt-BR": "Folha de pagamento Acme" },
    description: { "en-US": "Monthly salary", "pt-BR": "Salário mensal" },
    amount: 4200,
    dateOffset: -2,
    primaryCategory: { "en-US": "Salary", "pt-BR": "Salário" },
    otherCategories: [],
    balance: "checking",
    status: "",
    installments: 1,
    recurrenceFrequency: "monthly",
    recurringStartOffset: -180,
  },
  {
    type: "income",
    name: { "en-US": "Freelance project", "pt-BR": "Projeto freelance" },
    description: {
      "en-US": "One-off logo design",
      "pt-BR": "Criação de logo pontual",
    },
    amount: 650,
    dateOffset: -6,
    primaryCategory: { "en-US": "Freelance", "pt-BR": "Freelance" },
    otherCategories: [],
    balance: "",
    status: "",
    installments: 1,
    recurrenceFrequency: "none",
  },
];

/** Rows keyed by the locale's header labels, with localized option values. */
export function buildExampleRows(locale: AppLocale, today = new Date()) {
  const labels = transactionFileColumnLabels[locale];
  const day = (offset: number | undefined) => {
    if (offset === undefined) return "";
    const date = new Date(today);
    date.setDate(date.getDate() + offset);
    return dateInputValue(date);
  };

  const monthNameOf = (dateStr: string) => {
    const month = Number(dateStr.slice(5, 7));
    return month >= 1 && month <= 12 ? localizedMonthName(month, locale) : "";
  };

  return exampleSeeds.map((seed) => ({
    [labels.type]: typeLabels[locale][seed.type],
    [labels.name]: seed.name[locale],
    [labels.description]: seed.description[locale],
    [labels.amount]: seed.amount,
    [labels.date]: day(seed.dateOffset),
    [labels.fiscal_month]: monthNameOf(day(seed.dateOffset)),
    [labels.account]: "",
    [labels.credit_card]: "",
    [labels.payment_method]: seed.balance
      ? balanceLabels[locale][seed.balance]
      : "",
    [labels.primary_category]: seed.primaryCategory[locale],
    [labels.other_categories]: seed.otherCategories
      .map((category) => category[locale])
      .join("; "),
    [labels.status]: seed.status ? statusLabels[locale][seed.status] : "",
    [labels.due_date]: day(seed.dueDateOffset),
    [labels.payment_date]: day(seed.paymentDateOffset),
    [labels.installments]: seed.installments,
    [labels.recurrence_frequency]:
      frequencyLabels[locale][seed.recurrenceFrequency],
    [labels.recurring_start_date]: day(seed.recurringStartOffset),
    [labels.recurring_end_date]: day(seed.recurringEndOffset),
  }));
}

/**
 * Example transactions for the OFX template, localized like the CSV example.
 * OFX only carries the statement fields, so the seeds' categories, statuses,
 * and recurrence stay behind — the same fields a real bank OFX would omit.
 */
export function buildExampleOfxRows(locale: AppLocale, today = new Date()) {
  return exampleSeeds.map((seed) => {
    const date = new Date(today);
    date.setDate(date.getDate() + seed.dateOffset);
    return {
      type: seed.type,
      name: seed.name[locale],
      description: seed.description[locale],
      amount: seed.amount,
      date: dateInputValue(date),
    };
  });
}

/* -------------------------------------------------------------------------- */
/* Export localization                                                         */
/* -------------------------------------------------------------------------- */

/**
 * Turns canonical export rows from the server into rows keyed by the
 * locale's header labels with localized option values, ready to write.
 */
/** Columns whose values are calendar dates; always written as yyyy-mm-dd. */
const dateColumns = new Set<TransactionFileColumn>([
  "date",
  "due_date",
  "payment_date",
  "recurring_start_date",
  "recurring_end_date",
]);

/** Normalizes any date representation to yyyy-mm-dd for file output. */
export function fileDateValue(value: string | number | Date): string {
  if (value instanceof Date) return dateInputValue(value);
  const text = String(value).trim();
  // Keep only the date part of ISO timestamps ("2026-07-01T00:00:00Z").
  return /^\d{4}-\d{2}-\d{2}/.test(text) ? text.slice(0, 10) : text;
}

export function localizeExportRows(
  rows: TransactionFileRow[],
  locale: AppLocale,
) {
  const labels = transactionFileColumnLabels[locale];

  return rows.map((row) => {
    const localized: Record<string, string | number> = {};

    for (const column of transactionFileColumns) {
      const value = row[column];
      localized[labels[column]] = dateColumns.has(column)
        ? fileDateValue(value)
        : typeof value === "string"
          ? localizeValue(column, value, locale)
          : value;
    }

    return localized;
  });
}

function localizeValue(
  column: TransactionFileColumn,
  value: string,
  locale: AppLocale,
) {
  if (!value) return value;

  switch (column) {
    case "type":
      return typeLabels[locale][value as TransactionFormType] ?? value;
    case "fiscal_month": {
      const index = Number(value);
      return index >= 1 && index <= 12
        ? localizedMonthName(index, locale)
        : value;
    }
    case "payment_method":
      return balanceLabels[locale][value] ?? value;
    case "status":
      return statusLabels[locale][value] ?? value;
    case "recurrence_frequency":
      return frequencyLabels[locale][value as RecurrenceFrequency] ?? value;
    default:
      return value;
  }
}

/* -------------------------------------------------------------------------- */
/* Import parsing                                                              */
/* -------------------------------------------------------------------------- */

/**
 * Maps raw sheet rows (from CSV or XLSX, en-US or pt-BR headers and values)
 * to transaction inputs. Values are only normalized here; the server action
 * validates each row on insert.
 */
export function rowsToImportInputs(
  rawRows: Record<string, unknown>[],
): CreateTransactionInput[] {
  return rawRows.map((raw) => {
    const row = new Map<string, unknown>();
    for (const [key, value] of Object.entries(raw)) {
      const column = headerLookup.get(normalizeToken(key));
      if (column) row.set(column, value);
    }

    const cell = (column: TransactionFileColumn) => row.get(column);
    const date = dateCell(cell("date"));
    const fiscalMonth = parseFiscalMonthIndex(cell("fiscal_month"), date);
    const installments = Math.round(parseAmountCell(cell("installments")));
    const status = textCell(cell("status"));

    const bankAccountName = textCell(cell("account"));
    const creditCardName = textCell(cell("credit_card"));
    const rawMethod = textCell(cell("payment_method"));
    const balanceType = balanceLookup.get(normalizeToken(rawMethod));
    const isCreditCard = Boolean(creditCardName) || balanceType === "credit";

    // The balance type (or a named credit card) implies the app's internal
    // payment method; legacy spellings and account names pass through so
    // older files keep importing.
    const paymentMethod =
      balanceType || !rawMethod
        ? isCreditCard
          ? "Automatic (Credit Card)"
          : "Manual"
        : mapToken(legacyMethodLookup, rawMethod);

    return {
      type: mapToken(typeLookup, textCell(cell("type"))) as TransactionFormType,
      name: textCell(cell("name")),
      description: textCell(cell("description")),
      amount: parseAmountCell(cell("amount")),
      date,
      fiscalMonth,
      accountName: creditCardName || bankAccountName,
      balanceType,
      primaryCategory: textCell(cell("primary_category")),
      otherCategories: textCell(cell("other_categories"))
        .split(/[;|]/)
        .map((label) => label.trim())
        .filter(Boolean),
      paymentMethod,
      // Unknown statuses pass through untouched; the column is free text.
      status: mapToken(statusLookup, status),
      dueDate: dateCell(cell("due_date")),
      paymentDate: dateCell(cell("payment_date")),
      installments:
        Number.isFinite(installments) && installments > 0 ? installments : 1,
      recurrenceFrequency: (mapToken(
        frequencyLookup,
        textCell(cell("recurrence_frequency")),
      ).toLowerCase() || "none") as RecurrenceFrequency,
      recurringStartDate: dateCell(cell("recurring_start_date")) || date,
      recurringEndDate: dateCell(cell("recurring_end_date")),
    };
  });
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/** A parsed row that needs the user's attention before importing. */
export type ImportRowIssue = {
  /** 0-based position in the parsed list. */
  index: number;
  /** File line number (header is line 1, so data starts at line 2). */
  row: number;
  name: string;
  date: string;
};

/** A repeating charge the file itself did not declare as recurring. */
export type RecurringSeries = {
  name: string;
  frequency: RecurrenceFrequency;
  /** How many rows in the file belong to the series. */
  count: number;
};

export type ImportAnalysis = {
  inputs: CreateTransactionInput[];
  /** Rows with no usable amount — blank, unparseable, or exactly zero. */
  missingAmountRows: ImportRowIssue[];
  /** Rows with a missing or invalid date. */
  missingDateRows: ImportRowIssue[];
  /** Repeating charges detected across the file, in descending size. */
  recurringSeries: RecurringSeries[];
};

/**
 * Flags rows that need a decision before import — missing amounts and missing
 * dates, both of which the user fills in (or skips) in the UI — and marks
 * repeating charges as recurring. Everything else is validated server-side.
 */
export function analyzeImportRows(
  inputs: CreateTransactionInput[],
): ImportAnalysis {
  const missingAmountRows: ImportRowIssue[] = [];
  const missingDateRows: ImportRowIssue[] = [];
  const { inputs: withRecurrence, series } = detectRecurringSeries(inputs);

  withRecurrence.forEach((input, index) => {
    const issue: ImportRowIssue = {
      index,
      row: index + 2,
      name: input.name || `#${index + 2}`,
      date: input.date,
    };

    const amount = Number(input.amount);
    if (!Number.isFinite(amount) || amount === 0) {
      missingAmountRows.push(issue);
    }
    if (!ISO_DATE.test(input.date)) {
      missingDateRows.push(issue);
    }
  });

  return {
    inputs: withRecurrence,
    missingAmountRows,
    missingDateRows,
    recurringSeries: series,
  };
}

/* -------------------------------------------------------------------------- */
/* Recurrence detection                                                        */
/* -------------------------------------------------------------------------- */

/** A series needs this many dated rows before it counts as recurring. */
const RECURRENCE_MIN_ROWS = 3;

/** Day spacing that reads as each frequency, with room for short months. */
const FREQUENCY_WINDOWS: Array<{
  frequency: Exclude<RecurrenceFrequency, "none">;
  min: number;
  max: number;
}> = [
  { frequency: "daily", min: 1, max: 1 },
  { frequency: "weekly", min: 6, max: 8 },
  { frequency: "monthly", min: 27, max: 32 },
  { frequency: "yearly", min: 350, max: 380 },
];

function frequencyForGap(days: number) {
  return FREQUENCY_WINDOWS.find(
    (window) => days >= window.min && days <= window.max,
  )?.frequency;
}

const MS_DAY = 24 * 60 * 60 * 1000;

/**
 * Marks rows that repeat on a regular cadence as recurring. Statements rarely
 * carry a recurrence column, so a rent or subscription line would otherwise
 * import as a pile of unrelated one-offs: rows sharing a merchant and type are
 * grouped, and a group whose dates are evenly spaced takes that frequency.
 *
 * Rows that already declare a frequency are left exactly as the file had them.
 */
export function detectRecurringSeries(inputs: CreateTransactionInput[]): {
  inputs: CreateTransactionInput[];
  series: RecurringSeries[];
} {
  const groups = new Map<string, number[]>();

  inputs.forEach((input, index) => {
    if (input.recurrenceFrequency && input.recurrenceFrequency !== "none") {
      return;
    }
    if (!ISO_DATE.test(input.date) || !input.name) return;
    const key = `${input.type}|${normalizeToken(input.name)}`;
    const list = groups.get(key) ?? [];
    list.push(index);
    groups.set(key, list);
  });

  const next = [...inputs];
  const series: RecurringSeries[] = [];

  for (const indexes of groups.values()) {
    if (indexes.length < RECURRENCE_MIN_ROWS) continue;

    const ordered = [...indexes].sort((a, b) =>
      next[a].date < next[b].date ? -1 : 1,
    );
    const days = ordered.map(
      (index) => new Date(`${next[index].date}T00:00:00`).getTime() / MS_DAY,
    );
    const gaps = days
      .slice(1)
      .map((day, position) => Math.round(day - days[position]));
    // Every gap has to read as the same cadence — one stray month is enough
    // for this to be a coincidence rather than a standing charge.
    const frequency = frequencyForGap(gaps[0]);
    if (!frequency || gaps.some((gap) => frequencyForGap(gap) !== frequency)) {
      continue;
    }

    const start = next[ordered[0]].date;
    for (const index of ordered) {
      next[index] = {
        ...next[index],
        recurrenceFrequency: frequency,
        recurringStartDate: start,
      };
    }
    series.push({
      name: next[ordered[0]].name,
      frequency,
      count: ordered.length,
    });
  }

  return { inputs: next, series: series.sort((a, b) => b.count - a.count) };
}

/** Parses "1,234.56", "1.234,56", "R$ 45,90", or a plain number. */
export function parseAmountCell(value: unknown): number {
  if (typeof value === "number") return value;

  const text = String(value ?? "")
    .trim()
    .replace(/[^\d.,-]/g, "");
  if (!text) return NaN;

  const usesCommaDecimal = text.lastIndexOf(",") > text.lastIndexOf(".");
  const normalized = usesCommaDecimal
    ? text.replace(/\./g, "").replace(/,/g, ".")
    : text.replace(/,/g, "");

  return Number(normalized);
}

/** Lowercases, strips accents, and collapses separators for matching. */
function normalizeToken(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[\s_-]+/g, " ")
    .trim();
}

function mapToken(lookup: Map<string, string>, value: string) {
  return lookup.get(normalizeToken(value)) ?? value;
}

function textCell(value: unknown): string {
  if (value == null) return "";
  if (value instanceof Date) return dateInputValue(value);
  return String(value).trim();
}

function dateCell(value: unknown): string {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    // CSV date strings parse as UTC midnight while XLSX serials parse as
    // local midnight; read the representation that sits at midnight so the
    // calendar date never shifts with the user's timezone.
    if (value.getUTCHours() === 0 && value.getUTCMinutes() === 0) {
      return [
        value.getUTCFullYear(),
        String(value.getUTCMonth() + 1).padStart(2, "0"),
        String(value.getUTCDate()).padStart(2, "0"),
      ].join("-");
    }
    return dateInputValue(value);
  }

  const text = String(value ?? "").trim();
  // Accept ISO timestamps ("2026-07-01T00:00:00") by keeping the date part.
  return /^\d{4}-\d{2}-\d{2}T/.test(text) ? text.slice(0, 10) : text;
}
