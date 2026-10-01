// Synced from my-money-v2 (src/lib/cards/cards-data.ts). Do not edit here: change it
// in the web repo and run `npm run sync:web`.
import { hexToRgb, shadeHex } from "@/lib/colors";
import type { ExpenseCategory } from "@/lib/expenses/expense-categories";
import type { TransactionExtraCategory } from "@/lib/expenses/expenses-queries";
import type { AppLocale } from "@/lib/i18n/config";
import { formatMonthShort } from "@/lib/i18n/format";

export type CardNetwork = "visa" | "mastercard" | "amex" | "discover";
export type CardTone = "plum" | "coral" | "ink" | "sage";
export type CardPaletteId = "violet" | "rose" | "mint" | "silver" | "black";

export type CardColorPalette = {
  id: CardPaletteId;
  name: string;
  primary: string;
  secondary: string;
  accent: string;
  text: string;
};

export type CreditCardAccount = {
  id: string;
  nickname: string;
  issuer: string;
  network: CardNetwork;
  last4: string;
  holder: string;
  expires: string;
  tone: CardTone;
  palette: CardPaletteId;
  /** Custom hex color — overrides the legacy palette when set. */
  color: string | null;
  statementBalance: number;
  currentBalance: number;
  creditLimit: number;
  minimumPayment: number;
  /** Localized label for the next payment due date ("Not scheduled" unset). */
  dueDate: string;
  /** Day of the month the payment is due (1-31) — what the forms bind to. */
  dueDay: number | null;
  /** How many days before the due day the statement closes (1-15). */
  closingOffsetDays: number | null;
  /** Localized label for the closing date of the cycle now running. */
  closingDateLabel: string | null;
  statementPeriod: string;
  apr: string;
  rewardsRate: string;
  rewardsThisMonth: number;
  autopay: "Full balance" | "Minimum" | "Off";
  /** Débito automático: the bill settles itself on the due date. */
  autoDebit: boolean;
  /** Bank account the automatic payment is taken from. */
  autoDebitAccountId: string | null;
};

export type CardTransaction = {
  id: string;
  cardId: string;
  merchant: string;
  detail: string;
  category: ExpenseCategory;
  categoryColor?: string | null;
  categoryIcon?: string | null;
  /** Extra categories beyond the primary one, in the order they were added. */
  otherCategories?: TransactionExtraCategory[];
  occurredAt: string;
  date: string;
  amount: number;
  rewardAmount: number;
};

export type CardTrendPoint = {
  month: string;
  /** First day of the month (YYYY-MM-DD) — lets trend bars set the filter. */
  monthStart: string;
  spending: number;
};

export type CardCategoryBreakdown = {
  id: string;
  name: ExpenseCategory;
  amount: number;
  percent: number;
  tone: "plum" | "coral" | "amber" | "sage" | "ink";
};

export const cardNetworkLabels: Record<CardNetwork, string> = {
  visa: "Visa",
  mastercard: "Mastercard",
  amex: "American Express",
  discover: "Discover",
};

export const cardNetworkAssets: Record<CardNetwork, string> = {
  visa: "/card-brands/visa.svg",
  mastercard: "/card-brands/mastercard.svg",
  amex: "/card-brands/amex-mark.svg",
  discover: "/card-brands/discover.svg",
};

export const cardNetworkMarkAssets: Record<CardNetwork, string> = {
  visa: "/card-brands/visa-mark.svg",
  mastercard: "/card-brands/mastercard-mark.svg",
  amex: "/card-brands/amex-mark.svg",
  discover: "/card-brands/discover-mark.svg",
};

export const cardChipAsset = "/card-brands/credit-card-chip.svg";

export const cardColorPalettes: Record<CardPaletteId, CardColorPalette> = {
  violet: {
    id: "violet",
    name: "Violet",
    primary: "#15104d",
    secondary: "#7c3aed",
    accent: "#f04eec",
    text: "#fff7ff",
  },
  rose: {
    id: "rose",
    name: "Rose",
    primary: "#6f1f3f",
    secondary: "#d23864",
    accent: "#ff7a9e",
    text: "#fff8fb",
  },
  mint: {
    id: "mint",
    name: "Mint",
    primary: "#24533b",
    secondary: "#5fa377",
    accent: "#cde8d6",
    text: "#f5fff8",
  },
  silver: {
    id: "silver",
    name: "Silver",
    primary: "#9aa2a6",
    secondary: "#eef1ee",
    accent: "#6f7b80",
    text: "#3f474b",
  },
  black: {
    id: "black",
    name: "Black",
    primary: "#050507",
    secondary: "#18151f",
    accent: "#4a4458",
    text: "#f4ede2",
  },
};

export const cardNetworkProfiles: Record<
  CardNetwork,
  {
    defaultIssuer: string;
    defaultNickname: string;
    defaultRewards: string;
    defaultApr: string;
    tone: CardTone;
  }
> = {
  visa: {
    defaultIssuer: "Chase",
    defaultNickname: "Plum",
    defaultRewards: "2.5% groceries",
    defaultApr: "19.24%",
    tone: "plum",
  },
  mastercard: {
    defaultIssuer: "Capital One",
    defaultNickname: "Coral",
    defaultRewards: "2% dining",
    defaultApr: "21.49%",
    tone: "coral",
  },
  amex: {
    defaultIssuer: "American Express",
    defaultNickname: "Blue",
    defaultRewards: "3x travel",
    defaultApr: "20.99%",
    tone: "sage",
  },
  discover: {
    defaultIssuer: "Discover",
    defaultNickname: "Charcoal",
    defaultRewards: "5% rotating",
    defaultApr: "18.74%",
    tone: "ink",
  },
};

export const sampleCards: CreditCardAccount[] = [
  {
    id: "plum-4821",
    nickname: "Plum",
    issuer: "Chase",
    network: "visa",
    last4: "4821",
    holder: "Alex Moreno",
    expires: "08 / 28",
    tone: "plum",
    palette: "violet",
    color: null,
    statementBalance: 842.5,
    currentBalance: 917.42,
    creditLimit: 4000,
    minimumPayment: 35,
    dueDate: "Jun 17",
    dueDay: 17,
    closingOffsetDays: 7,
    closingDateLabel: "Jun 10",
    statementPeriod: "May 18 - Jun 17",
    apr: "19.24%",
    rewardsRate: "2.5% groceries",
    rewardsThisMonth: 21.15,
    autopay: "Full balance",
    autoDebit: false,
    autoDebitAccountId: null,
  },
  {
    id: "coral-1937",
    nickname: "Coral",
    issuer: "Capital One",
    network: "mastercard",
    last4: "1937",
    holder: "Alex Moreno",
    expires: "11 / 27",
    tone: "coral",
    palette: "rose",
    color: null,
    statementBalance: 312.1,
    currentBalance: 384.8,
    creditLimit: 2500,
    minimumPayment: 25,
    dueDate: "Jul 03",
    dueDay: 3,
    closingOffsetDays: 5,
    closingDateLabel: "Jun 28",
    statementPeriod: "May 29 - Jun 28",
    apr: "21.49%",
    rewardsRate: "2% dining",
    rewardsThisMonth: 7.48,
    autopay: "Minimum",
    autoDebit: false,
    autoDebitAccountId: null,
  },
  {
    id: "blue-7309",
    nickname: "Blue",
    issuer: "American Express",
    network: "amex",
    last4: "7309",
    holder: "Alex Moreno",
    expires: "05 / 29",
    tone: "sage",
    palette: "mint",
    color: null,
    statementBalance: 429.28,
    currentBalance: 486.03,
    creditLimit: 5000,
    minimumPayment: 40,
    dueDate: "Jul 10",
    dueDay: 10,
    closingOffsetDays: 10,
    closingDateLabel: "Jun 30",
    statementPeriod: "Jun 01 - Jun 30",
    apr: "20.99%",
    rewardsRate: "3x travel",
    rewardsThisMonth: 14.74,
    autopay: "Full balance",
    autoDebit: false,
    autoDebitAccountId: null,
  },
  {
    id: "charcoal-6502",
    nickname: "Charcoal",
    issuer: "Discover",
    network: "discover",
    last4: "6502",
    holder: "Alex Moreno",
    expires: "02 / 29",
    tone: "ink",
    palette: "black",
    color: null,
    statementBalance: 0,
    currentBalance: 66.35,
    creditLimit: 2000,
    minimumPayment: 0,
    dueDate: "Jul 22",
    dueDay: 22,
    closingOffsetDays: 15,
    closingDateLabel: "Jul 04",
    statementPeriod: "Jun 05 - Jul 04",
    apr: "18.74%",
    rewardsRate: "5% rotating",
    rewardsThisMonth: 3.32,
    autopay: "Off",
    autoDebit: false,
    autoDebitAccountId: null,
  },
];

export const sampleCardTransactions: CardTransaction[] = [
  {
    id: "tx-card-1",
    cardId: "plum-4821",
    merchant: "Whole Foods Market",
    detail: "Groceries - 2.5% back",
    category: "Groceries",
    occurredAt: "2026-06-17T14:22:00",
    date: "Jun 17",
    amount: 84.2,
    rewardAmount: 2.11,
  },
  {
    id: "tx-card-2",
    cardId: "plum-4821",
    merchant: "Delta Airlines",
    detail: "Travel",
    category: "Travel",
    occurredAt: "2026-06-15T11:42:00",
    date: "Jun 15",
    amount: 310,
    rewardAmount: 6.2,
  },
  {
    id: "tx-card-3",
    cardId: "coral-1937",
    merchant: "Blue Bottle",
    detail: "Coffee",
    category: "Coffee",
    occurredAt: "2026-06-13T08:14:00",
    date: "Jun 13",
    amount: 6.5,
    rewardAmount: 0.13,
  },
  {
    id: "tx-card-4",
    cardId: "plum-4821",
    merchant: "Trader Joe's",
    detail: "Groceries - 2.5% back",
    category: "Groceries",
    occurredAt: "2026-06-10T18:04:00",
    date: "Jun 10",
    amount: 52.3,
    rewardAmount: 1.31,
  },
  {
    id: "tx-card-5",
    cardId: "charcoal-6502",
    merchant: "Citi Bike",
    detail: "Transport",
    category: "Transport",
    occurredAt: "2026-06-08T17:08:00",
    date: "Jun 8",
    amount: 24,
    rewardAmount: 1.2,
  },
  {
    id: "tx-card-6",
    cardId: "blue-7309",
    merchant: "Marriott Marquis",
    detail: "Hotels",
    category: "Hotels",
    occurredAt: "2026-06-04T16:12:00",
    date: "Jun 4",
    amount: 286.45,
    rewardAmount: 8.59,
  },
  {
    id: "tx-card-7",
    cardId: "coral-1937",
    merchant: "Spotify",
    detail: "Subscriptions",
    category: "Subscriptions",
    occurredAt: "2026-06-01T06:03:00",
    date: "Jun 1",
    amount: 12.99,
    rewardAmount: 0.26,
  },
  {
    id: "tx-card-8",
    cardId: "blue-7309",
    merchant: "United Airlines",
    detail: "Flights",
    category: "Flights",
    occurredAt: "2026-05-22T10:31:00",
    date: "May 22",
    amount: 412.8,
    rewardAmount: 12.38,
  },
  {
    id: "tx-card-9",
    cardId: "coral-1937",
    merchant: "Super Duper Burgers",
    detail: "Eating out",
    category: "Eating out",
    occurredAt: "2026-05-18T20:22:00",
    date: "May 18",
    amount: 38.5,
    rewardAmount: 0.77,
  },
  {
    id: "tx-card-10",
    cardId: "plum-4821",
    merchant: "Apple",
    detail: "Phone",
    category: "Phone",
    occurredAt: "2026-04-28T09:12:00",
    date: "Apr 28",
    amount: 99,
    rewardAmount: 0.99,
  },
  {
    id: "tx-card-11",
    cardId: "charcoal-6502",
    merchant: "Target",
    detail: "Shopping",
    category: "Shopping",
    occurredAt: "2026-03-23T15:04:00",
    date: "Mar 23",
    amount: 42.35,
    rewardAmount: 0.85,
  },
  {
    id: "tx-card-12",
    cardId: "plum-4821",
    merchant: "Chevron",
    detail: "Gas",
    category: "Gas",
    occurredAt: "2026-02-20T13:47:00",
    date: "Feb 20",
    amount: 64.55,
    rewardAmount: 0.65,
  },
  {
    id: "tx-card-13",
    cardId: "blue-7309",
    merchant: "Airbnb",
    detail: "Travel",
    category: "Travel",
    occurredAt: "2026-01-18T19:05:00",
    date: "Jan 18",
    amount: 198,
    rewardAmount: 5.94,
  },
];

const categoryTones: CardCategoryBreakdown["tone"][] = [
  "coral",
  "amber",
  "plum",
  "sage",
  "ink",
];

/* --------------------------- statement cycle ------------------------------ */

/**
 * A card's cycle is stored as a repeating day of the month plus how many days
 * earlier the statement closes, so nothing has to be re-entered every month.
 * Concrete dates are derived from a reference day whenever we need to show one.
 */
export const DUE_DAY_MIN = 1;
export const DUE_DAY_MAX = 31;
export const CLOSING_OFFSET_MIN = 1;
export const CLOSING_OFFSET_MAX = 15;

export const dueDayOptions = Array.from(
  { length: DUE_DAY_MAX - DUE_DAY_MIN + 1 },
  (_, index) => DUE_DAY_MIN + index,
);

export const closingOffsetOptions = Array.from(
  { length: CLOSING_OFFSET_MAX - CLOSING_OFFSET_MIN + 1 },
  (_, index) => CLOSING_OFFSET_MIN + index,
);

export function isDueDay(value: number): boolean {
  return Number.isInteger(value) && value >= DUE_DAY_MIN && value <= DUE_DAY_MAX;
}

export function isClosingOffset(value: number): boolean {
  return (
    Number.isInteger(value) &&
    value >= CLOSING_OFFSET_MIN &&
    value <= CLOSING_OFFSET_MAX
  );
}

/**
 * The next time the bill falls due, on or after `ref`. Days past the end of a
 * short month land on its last day (a 31st due date is Feb 28/29).
 */
export function nextDueDate(
  dueDay: number | null,
  ref: Date = new Date(),
): Date | null {
  if (dueDay == null || !isDueDay(dueDay)) return null;

  const year = ref.getUTCFullYear();
  const month = ref.getUTCMonth();
  const thisMonth = clampToMonth(year, month, dueDay);
  if (thisMonth.getUTCDate() >= ref.getUTCDate()) return thisMonth;
  return clampToMonth(year, month + 1, dueDay);
}

/**
 * The most recent time the bill fell due, on or before `ref`. Null when the
 * card has no due day. Counterpart of `nextDueDate` for overdue checks.
 */
export function previousDueDate(
  dueDay: number | null,
  ref: Date = new Date(),
): Date | null {
  if (dueDay == null || !isDueDay(dueDay)) return null;

  const year = ref.getUTCFullYear();
  const month = ref.getUTCMonth();
  const thisMonth = clampToMonth(year, month, dueDay);
  if (thisMonth.getUTCDate() <= ref.getUTCDate()) return thisMonth;
  return clampToMonth(year, month - 1, dueDay);
}

/** UTC-noon Date for the viewer's local calendar day, matching due-cycle math. */
export function todayCycleRef(now: Date = new Date()): Date {
  return new Date(
    Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), 12),
  );
}

/** `yyyy-mm-dd` key of a due-cycle date built by the helpers above. */
export function cycleDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** Closing date of the cycle that `nextDueDate` pays for. */
export function nextClosingDate(
  dueDay: number | null,
  closingOffsetDays: number | null,
  ref: Date = new Date(),
): Date | null {
  const due = nextDueDate(dueDay, ref);
  if (!due || closingOffsetDays == null || !isClosingOffset(closingOffsetDays)) {
    return null;
  }
  return new Date(
    Date.UTC(
      due.getUTCFullYear(),
      due.getUTCMonth(),
      due.getUTCDate() - closingOffsetDays,
      12,
    ),
  );
}

function clampToMonth(year: number, month: number, day: number): Date {
  const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  return new Date(Date.UTC(year, month, Math.min(day, lastDay), 12));
}

export function detectCardNetwork(value: string): CardNetwork | null {
  const digits = value.replace(/\D/g, "");

  if (/^3[47]/.test(digits)) return "amex";
  if (/^6(?:011|5|4[4-9])/.test(digits)) return "discover";
  if (/^5[1-5]/.test(digits) || /^2[2-7]/.test(digits)) return "mastercard";
  if (/^4/.test(digits)) return "visa";

  return null;
}

export function createCardFromForm(input: {
  number: string;
  holder: string;
  expires: string;
  limit: number;
  network: CardNetwork;
  palette?: CardPaletteId;
  color?: string | null;
  nickname?: string;
  /** Repeating statement cycle, when known. */
  dueDay?: number | null;
  closingOffsetDays?: number | null;
}): CreditCardAccount {
  const digits = input.number.replace(/\D/g, "");
  const profile = cardNetworkProfiles[input.network];
  const last4 = digits.slice(-4).padStart(4, "0");
  const nickname = input.nickname?.trim() || profile.defaultNickname;

  return {
    id: `${input.network}-${last4}-${Date.now()}`,
    nickname,
    issuer: profile.defaultIssuer,
    network: input.network,
    last4,
    holder: input.holder.trim() || "Card holder",
    expires: input.expires.trim() || "12 / 29",
    tone: profile.tone,
    palette: input.palette ?? paletteFromTone(profile.tone),
    color: input.color ?? null,
    statementBalance: 0,
    currentBalance: 0,
    creditLimit: input.limit,
    minimumPayment: 0,
    dueDate: "Not scheduled",
    dueDay: input.dueDay ?? null,
    closingOffsetDays: input.closingOffsetDays ?? null,
    closingDateLabel: null,
    statementPeriod: "New card",
    apr: profile.defaultApr,
    rewardsRate: profile.defaultRewards,
    rewardsThisMonth: 0,
    autopay: "Off",
    autoDebit: false,
    autoDebitAccountId: null,
  };
}

/* ------------------------- custom hex card colors ------------------------- */

function relativeLuminance(hex: string) {
  const { r, g, b } = hexToRgb(hex);
  const [lr, lg, lb] = [r, g, b].map((channel) => {
    const v = channel / 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * lr + 0.7152 * lg + 0.0722 * lb;
}

/** Card face gradient + readable text color for a custom hex (design formula). */
export function cardCustomSurface(hex: string) {
  return {
    gradient: `linear-gradient(135deg, ${shadeHex(hex, -0.4)} 0%, ${hex} 55%, ${shadeHex(hex, 0.42)} 125%)`,
    text: relativeLuminance(hex) > 0.58 ? "#241f30" : "#ffffff",
  };
}

function paletteFromTone(tone: CardTone): CardPaletteId {
  if (tone === "plum") return "violet";
  if (tone === "coral") return "rose";
  if (tone === "sage") return "mint";

  return "black";
}

export function getCardsScope(
  cards: CreditCardAccount[],
  transactions: CardTransaction[],
  selectedCardIds: string[],
  locale: AppLocale = "en-US",
  /** Filter-independent activity for the 6-month trend (defaults to `transactions`). */
  trendTransactions?: CardTransaction[],
) {
  const scopedCards =
    selectedCardIds.length > 0
      ? cards.filter((card) => selectedCardIds.includes(card.id))
      : cards;
  const cardIds = new Set(scopedCards.map((card) => card.id));
  const scopedTrendTransactions = (trendTransactions ?? transactions).filter(
    (transaction) => cardIds.has(transaction.cardId),
  );
  const scopedTransactions = transactions
    .filter((transaction) => cardIds.has(transaction.cardId))
    .sort(
      (a, b) =>
        new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime(),
    );
  // What the scoped cards were actually charged inside the active period
  // filter — not a stored statement figure.
  const periodCharges = scopedTransactions.reduce(
    (total, transaction) => total + transaction.amount,
    0,
  );
  const currentBalance = sum(scopedCards, "currentBalance");
  const creditLimit = sum(scopedCards, "creditLimit");
  const rewardsThisMonth = sum(scopedCards, "rewardsThisMonth");
  const dueCards = scopedCards.filter((card) => card.statementBalance > 0);
  const nextDue =
    dueCards.length > 0
      ? dueCards.reduce((highest, card) =>
          card.statementBalance > highest.statementBalance ? card : highest,
        )
      : scopedCards[0];

  return {
    cards: scopedCards,
    transactions: scopedTransactions,
    selectedCard:
      selectedCardIds.length === 1 ? (scopedCards[0] ?? null) : null,
    summary: {
      periodCharges,
      currentBalance,
      creditLimit,
      rewardsThisMonth,
      utilization:
        creditLimit > 0 ? Math.round((currentBalance / creditLimit) * 100) : 0,
      availableCredit: Math.max(creditLimit - currentBalance, 0),
      minimumPayment: sum(scopedCards, "minimumPayment"),
      nextDue,
    },
    trend: getSixMonthTrend(scopedTrendTransactions, locale),
    categories: getCategoryBreakdown(scopedTransactions),
  };
}

function getSixMonthTrend(
  transactions: CardTransaction[],
  locale: AppLocale,
): CardTrendPoint[] {
  const ref =
    transactions.length > 0
      ? transactions.reduce(
          (latest, transaction) => {
            const occurredAt = new Date(transaction.occurredAt);
            return occurredAt > latest ? occurredAt : latest;
          },
          new Date(transactions[0]?.occurredAt ?? Date.now()),
        )
      : new Date();

  const months = Array.from({ length: 6 }, (_, index) => {
    const date = new Date(ref.getFullYear(), ref.getMonth() - 5 + index, 1);
    return {
      key: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`,
      label: formatMonthShort(date, locale),
    };
  });

  return months.map(({ key, label }) => ({
    month: label,
    monthStart: `${key}-01`,
    spending: transactions
      .filter((transaction) => transaction.occurredAt.startsWith(key))
      .reduce((total, transaction) => total + transaction.amount, 0),
  }));
}

function getCategoryBreakdown(
  transactions: CardTransaction[],
): CardCategoryBreakdown[] {
  const byCategory = new Map<ExpenseCategory, number>();

  for (const transaction of transactions) {
    byCategory.set(
      transaction.category,
      (byCategory.get(transaction.category) ?? 0) + transaction.amount,
    );
  }

  const total = [...byCategory.values()].reduce(
    (sum, amount) => sum + amount,
    0,
  );

  return [...byCategory.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, amount], index) => ({
      id: name,
      name,
      amount,
      percent: total > 0 ? Math.round((amount / total) * 100) : 0,
      tone: categoryTones[index] ?? "ink",
    }));
}

function sum(cards: CreditCardAccount[], key: keyof CreditCardAccount) {
  return cards.reduce((total, card) => total + Number(card[key] ?? 0), 0);
}
