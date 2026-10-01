// Synced from my-money-v2 (src/lib/accounts/accounts-data.ts). Do not edit here: change it
// in the web repo and run `npm run sync:web`.
import { shadeHex } from "@/lib/colors";
import type { AppLocale } from "@/lib/i18n/config";
import { formatMonthShort } from "@/lib/i18n/format";

export type BankAccountType = "checking" | "savings";

export type InterestMode = "apy" | "monthly" | "cdi";

export type SavingsLabel = "poupanca" | "cofrinho";

export type BankAccount = {
  id: string;
  name: string;
  type: BankAccountType;
  balance: number;
  /** Interest rate; its meaning depends on `interestMode`. */
  apy: number | null;
  interestMode: InterestMode;
  savingsLabel: SavingsLabel | null;
  /** Short display label, e.g. "Sterling Checking". */
  label: string;
  /** ISO timestamp of when the account was added — its balance only exists from here onward. */
  createdAt: string;
};

export type BankTone = "plum" | "coral" | "ink" | "sage";

export type Bank = {
  /** Stable slug used for URL selection, derived from the institution. */
  id: string;
  name: string;
  nickname: string | null;
  tone: BankTone;
  /** User-picked hex icon color; overrides the tone styles when set. */
  color: string | null;
  /** Default destination for income deposits. */
  isPrimary: boolean;
  accounts: BankAccount[];
  checking: BankAccount | null;
  /** Every savings account at this bank, in display order. */
  savingsAccounts: BankAccount[];
  /** First savings account — the one single-value summaries speak for. */
  savings: BankAccount | null;
};

export type AccountActivityKind = "income" | "expense" | "transfer";

export type AccountActivity = {
  id: string;
  accountId: string;
  transferAccountId: string | null;
  kind: AccountActivityKind;
  isInterest: boolean;
  merchant: string;
  detail: string;
  /** Source account label; transfers render as "Internal" in the table. */
  accountLabel: string;
  category: string | null;
  categoryColor: string | null;
  categoryIcon: string | null;
  occurredAt: string;
  date: string;
  /** Signed amount from the source account's perspective. */
  amount: number;
};

export type BalanceTrendPoint = {
  month: string;
  /** Closing balance for the month; named for the shared trend card's prop. */
  spending: number;
};

export type MoneyAllocationSegment = {
  id: string;
  label: string;
  amount: number;
  color: string;
};

const bankTones: BankTone[] = ["plum", "coral", "ink", "sage"];

export function bankToneAt(index: number): BankTone {
  return bankTones[index % bankTones.length];
}

export function isBankTone(value: string | null): value is BankTone {
  return bankTones.includes(value as BankTone);
}

/** Custom bank icon colors are stored in the same `tone` column as a hex. */
export function isHexColor(value: string | null): value is string {
  return typeof value === "string" && /^#[0-9a-fA-F]{6}$/.test(value);
}

/** Base hex per tone — seeds the color picker for banks without a custom color. */
export const bankToneHexes: Record<BankTone, string> = {
  plum: "#7c3aed",
  coral: "#f04e7a",
  ink: "#1a1424",
  sage: "#5fa377",
};

/** Reference CDI used to project pt-BR "% of CDI" rates onto an annual yield. */
export const CDI_ANNUAL_RATE = 10.65;

/** Normalizes any interest mode to an effective annual percentage. */
export function effectiveAnnualRate(mode: InterestMode, rate: number | null) {
  if (rate === null) return 0;
  if (mode === "monthly") return ((1 + rate / 100) ** 12 - 1) * 100;
  if (mode === "cdi") return (rate / 100) * CDI_ANNUAL_RATE;
  return rate;
}

/** Short rate suffix, e.g. "0.5% APY", "0,65% a.m.", "110% CDI". */
export function interestRateLabel(
  account: Pick<BankAccount, "apy" | "interestMode">,
  locale: AppLocale,
) {
  if (account.apy === null) return null;
  if (account.interestMode === "monthly") return `${account.apy}% a.m.`;
  if (account.interestMode === "cdi") return `${account.apy}% CDI`;
  return locale === "pt-BR" ? `${account.apy}% a.a.` : `${account.apy}% APY`;
}

export function slugifyBank(name: string) {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/**
 * How an activity moves money relative to a set of in-scope accounts. Transfers
 * between two in-scope accounts net to zero; a transfer leaving or entering the
 * scope counts once with the matching sign.
 */
function scopeDelta(activity: AccountActivity, accountIds: Set<string>) {
  if (activity.kind !== "transfer") {
    return accountIds.has(activity.accountId) ? activity.amount : 0;
  }

  const fromInScope = accountIds.has(activity.accountId);
  const toInScope = Boolean(
    activity.transferAccountId && accountIds.has(activity.transferAccountId),
  );

  if (fromInScope && toInScope) return 0;
  if (fromInScope) return activity.amount;
  if (toInScope) return -activity.amount;
  return 0;
}

/** Signed amount to display for an activity inside a scope. */
export function displayAmount(
  activity: AccountActivity,
  accountIds: Set<string>,
) {
  if (activity.kind !== "transfer") return activity.amount;

  const fromInScope = accountIds.has(activity.accountId);
  if (fromInScope) return activity.amount;
  return -activity.amount;
}

export function getAccountsScope(
  banks: Bank[],
  activities: AccountActivity[],
  selectedBankIds: string[],
  locale: AppLocale = "en-US",
) {
  const selectedBanks = banks.filter((bank) =>
    selectedBankIds.includes(bank.id),
  );
  const scopedBanks = selectedBanks.length > 0 ? selectedBanks : banks;
  const scopedAccounts = scopedBanks.flatMap((bank) => bank.accounts);
  const accountIds = new Set(scopedAccounts.map((account) => account.id));
  const scopedActivities = activities
    .filter(
      (activity) =>
        accountIds.has(activity.accountId) ||
        (activity.transferAccountId &&
          accountIds.has(activity.transferAccountId)),
    )
    .sort(
      (a, b) =>
        new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime(),
    );

  const ref =
    scopedActivities.length > 0
      ? new Date(scopedActivities[0].occurredAt)
      : new Date();
  const monthKey = toMonthKey(ref);

  const checkingAccounts = scopedAccounts.filter(
    (account) => account.type === "checking",
  );
  const savingsAccounts = scopedAccounts.filter(
    (account) => account.type === "savings",
  );
  const checkingTotal = sumBalances(checkingAccounts);
  const savingsTotal = sumBalances(savingsAccounts);
  const totalBalance = checkingTotal + savingsTotal;

  const monthActivities = scopedActivities.filter((activity) =>
    activity.occurredAt.startsWith(monthKey),
  );
  const monthDelta = monthActivities.reduce(
    (sum, activity) => sum + scopeDelta(activity, accountIds),
    0,
  );

  // Interest posts at month end, so a fresh month often has none yet — fall
  // back to the most recent month that actually earned interest.
  const interestMonth =
    scopedActivities.find((activity) => activity.isInterest)?.occurredAt ??
    null;
  const interestMonthKey = interestMonth?.slice(0, 7) ?? monthKey;
  const interestThisMonth = scopedActivities
    .filter(
      (activity) =>
        activity.isInterest && activity.occurredAt.startsWith(interestMonthKey),
    )
    .reduce((sum, activity) => sum + activity.amount, 0);
  const interestMonthDate = interestMonth ? new Date(interestMonth) : ref;

  const apyWeighted = savingsAccounts.reduce(
    (sum, account) =>
      sum +
      effectiveAnnualRate(account.interestMode, account.apy) * account.balance,
    0,
  );
  const blendedApy = savingsTotal > 0 ? apyWeighted / savingsTotal : 0;

  return {
    banks: scopedBanks,
    selectedBanks,
    accountIds,
    activities: scopedActivities,
    summary: {
      totalBalance,
      monthDelta,
      checkingTotal,
      checkingCount: checkingAccounts.length,
      savingsTotal,
      savingsCount: savingsAccounts.length,
      savingsPercent:
        totalBalance > 0 ? Math.round((savingsTotal / totalBalance) * 100) : 0,
      interestThisMonth,
      blendedApy,
      interestMonthLabel: formatMonthShort(interestMonthDate, locale),
    },
    trend: getBalanceTrend(
      totalBalance,
      scopedAccounts,
      scopedActivities,
      accountIds,
      ref,
      locale,
    ),
    allocation: {
      checkingTotal,
      savingsTotal,
      percentSaved:
        totalBalance > 0 ? Math.round((savingsTotal / totalBalance) * 100) : 0,
      segments: getAllocationSegments(scopedBanks),
    },
  };
}

export type AccountsScope = ReturnType<typeof getAccountsScope>;

/**
 * Segments grouped per bank so shades sit next to their base: each bank's
 * first account wears the bank's own color (custom hex or tone), and every
 * further account at that bank — typically the savings/investment ones —
 * steps progressively lighter so it still reads as that bank.
 */
function getAllocationSegments(banks: Bank[]): MoneyAllocationSegment[] {
  return banks.flatMap((bank) => {
    const base = bank.color ?? bankToneHexes[bank.tone];

    return bank.accounts
      .map((account, index) => ({
        id: account.id,
        label: account.label,
        amount: account.balance,
        color:
          index === 0
            ? base
            : shadeHex(base, Math.min(0.25 + (index - 1) * 0.18, 0.7)),
      }))
      .filter((segment) => segment.amount > 0);
  });
}

/**
 * Closing balance per month for the last six months. Accounts only store a
 * current balance, so history is unwound backwards from it: each month's close
 * is the next month's close minus the activity that happened in between.
 */
function getBalanceTrend(
  currentBalance: number,
  accounts: BankAccount[],
  activities: AccountActivity[],
  accountIds: Set<string>,
  ref: Date,
  locale: AppLocale,
): BalanceTrendPoint[] {
  const months = Array.from({ length: 6 }, (_, index) => {
    const date = new Date(ref.getFullYear(), ref.getMonth() - 5 + index, 1);
    return { date, key: toMonthKey(date), delta: 0 };
  });
  const byKey = new Map(months.map((month) => [month.key, month]));
  const lastKey = months[months.length - 1].key;

  // Anything posted after the window still has to roll off today's balance.
  let afterWindow = 0;
  for (const activity of activities) {
    const key = activity.occurredAt.slice(0, 7);
    const month = byKey.get(key);
    if (month) month.delta += scopeDelta(activity, accountIds);
    else if (key > lastKey) afterWindow += scopeDelta(activity, accountIds);
  }

  // An account's stored balance only exists once the account does: months
  // before it was added must not carry it, otherwise a brand-new account
  // back-fills the whole trend with today's balance.
  const seeds = accounts.map((account) => ({
    addedKey: toMonthKey(new Date(account.createdAt)),
    amount: account.balance,
  }));

  const points: BalanceTrendPoint[] = [];
  let closing = currentBalance - afterWindow;
  for (let index = months.length - 1; index >= 0; index--) {
    const notYetOpened = seeds.reduce(
      (sum, seed) => (seed.addedKey > months[index].key ? sum + seed.amount : sum),
      0,
    );
    points.unshift({
      month: formatMonthShort(months[index].date, locale),
      spending: closing - notYetOpened,
    });
    closing -= months[index].delta;
  }

  return points;
}

function toMonthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function sumBalances(accounts: BankAccount[]) {
  return accounts.reduce((sum, account) => sum + account.balance, 0);
}
