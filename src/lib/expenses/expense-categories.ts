// Synced from my-money-v2 (src/lib/expenses/expense-categories.ts). Do not edit here: change it
// in the web repo and run `npm run sync:web`.
export const expenseCategories = [
  "Groceries",
  "Eating out",
  "Coffee",
  "Transport",
  "Gas",
  "Parking",
  "Rent",
  "Mortgage",
  "Utilities",
  "Internet",
  "Phone",
  "Subscriptions",
  "Entertainment",
  "Shopping",
  "Clothing",
  "Home",
  "Health",
  "Pharmacy",
  "Fitness",
  "Insurance",
  "Education",
  "Childcare",
  "Pets",
  "Travel",
  "Flights",
  "Hotels",
  "Gifts",
  "Taxes",
  "Fees",
  "Other",
] as const;

export type ExpenseCategory = (typeof expenseCategories)[number];

type ExpenseCategoryStyle = {
  chipClassName: string;
};

export const expenseCategoryStyles: Record<
  ExpenseCategory,
  ExpenseCategoryStyle
> = {
  Groceries: {
    chipClassName: "border-sky-200 bg-sky-50 text-sky-900",
  },
  "Eating out": {
    chipClassName: "border-orange-200 bg-orange-50 text-orange-900",
  },
  Coffee: {
    chipClassName: "border-amber-200 bg-amber-50 text-amber-900",
  },
  Transport: {
    chipClassName: "border-emerald-200 bg-emerald-50 text-emerald-900",
  },
  Gas: {
    chipClassName: "border-lime-200 bg-lime-50 text-lime-900",
  },
  Parking: {
    chipClassName: "border-teal-200 bg-teal-50 text-teal-900",
  },
  Rent: {
    chipClassName: "border-plum-200 bg-plum-50 text-plum-900",
  },
  Mortgage: {
    chipClassName: "border-stone-200 bg-stone-50 text-stone-900",
  },
  Utilities: {
    chipClassName: "border-cyan-200 bg-cyan-50 text-cyan-900",
  },
  Internet: {
    chipClassName: "border-blue-200 bg-blue-50 text-blue-900",
  },
  Phone: {
    chipClassName: "border-indigo-200 bg-indigo-50 text-indigo-900",
  },
  Subscriptions: {
    chipClassName: "border-violet-200 bg-violet-50 text-violet-900",
  },
  Entertainment: {
    chipClassName: "border-fuchsia-200 bg-fuchsia-50 text-fuchsia-900",
  },
  Shopping: {
    chipClassName: "border-coral-200 bg-coral-50 text-coral-600",
  },
  Clothing: {
    chipClassName: "border-rose-200 bg-rose-50 text-rose-900",
  },
  Home: {
    chipClassName: "border-yellow-200 bg-yellow-50 text-yellow-900",
  },
  Health: {
    chipClassName: "border-red-200 bg-red-50 text-red-900",
  },
  Pharmacy: {
    chipClassName: "border-pink-200 bg-pink-50 text-pink-900",
  },
  Fitness: {
    chipClassName: "border-green-200 bg-green-50 text-green-900",
  },
  Insurance: {
    chipClassName: "border-slate-200 bg-slate-50 text-slate-900",
  },
  Education: {
    chipClassName: "border-purple-200 bg-purple-50 text-purple-900",
  },
  Childcare: {
    chipClassName: "border-red-300 bg-red-100 text-red-950",
  },
  Pets: {
    chipClassName: "border-amber-300 bg-amber-100 text-amber-950",
  },
  Travel: {
    chipClassName: "border-indigo-300 bg-indigo-100 text-indigo-950",
  },
  Flights: {
    chipClassName: "border-sky-300 bg-sky-100 text-sky-950",
  },
  Hotels: {
    chipClassName: "border-violet-300 bg-violet-100 text-violet-950",
  },
  Gifts: {
    chipClassName: "border-rose-300 bg-rose-100 text-rose-950",
  },
  Taxes: {
    chipClassName: "border-zinc-300 bg-zinc-100 text-zinc-950",
  },
  Fees: {
    chipClassName: "border-neutral-300 bg-neutral-100 text-neutral-950",
  },
  Other: {
    chipClassName: "border-line-strong bg-white text-black",
  },
};

export function getExpenseCategoryStyle(category: string) {
  return (
    expenseCategoryStyles[category as ExpenseCategory] ??
    expenseCategoryStyles.Other
  );
}

/**
 * Category names that hold credit-card bill payments, across the locales the
 * app ships. Workspaces name their own categories, so there is no structural
 * flag for this — the breakdown card uses it to read "By card" instead of
 * "By merchant", since the merchants inside are card names.
 */
const creditCardCategoryNames = new Set([
  "credit card",
  "credit cards",
  "cartao de credito",
  "cartoes de credito",
]);

export function isCreditCardCategory(name: string) {
  const normalized = name
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .trim()
    .toLowerCase();
  return creditCardCategoryNames.has(normalized);
}
