// Synced from my-money-v2 (src/lib/income/source-categories.ts). Do not edit here: change it
// in the web repo and run `npm run sync:web`.
export const incomeSourceCategories = [
  "Payroll",
  "Client work",
  "Reimbursement",
  "Bonus",
  "Commission",
  "Dividends",
  "Interest",
  "Rental income",
  "Royalties",
  "Marketplace",
  "Refund",
  "Gift",
  "Benefits",
  "Pension",
  "Other",
] as const;

export type IncomeSourceCategory = (typeof incomeSourceCategories)[number];

type IncomeSourceCategoryStyle = {
  chipClassName: string;
};

export const incomeSourceCategoryStyles: Record<
  IncomeSourceCategory,
  IncomeSourceCategoryStyle
> = {
  Payroll: {
    chipClassName: "border-emerald-200 bg-emerald-50 text-emerald-900",
  },
  "Client work": {
    chipClassName: "border-sky-200 bg-sky-50 text-sky-900",
  },
  Reimbursement: {
    chipClassName: "border-violet-200 bg-violet-50 text-violet-900",
  },
  Bonus: {
    chipClassName: "border-amber-200 bg-amber-50 text-amber-900",
  },
  Commission: {
    chipClassName: "border-orange-200 bg-orange-50 text-orange-900",
  },
  Dividends: {
    chipClassName: "border-lime-200 bg-lime-50 text-lime-900",
  },
  Interest: {
    chipClassName: "border-teal-200 bg-teal-50 text-teal-900",
  },
  "Rental income": {
    chipClassName: "border-plum-200 bg-plum-50 text-plum-900",
  },
  Royalties: {
    chipClassName: "border-fuchsia-200 bg-fuchsia-50 text-fuchsia-900",
  },
  Marketplace: {
    chipClassName: "border-coral-200 bg-coral-50 text-coral-600",
  },
  Refund: {
    chipClassName: "border-cyan-200 bg-cyan-50 text-cyan-900",
  },
  Gift: {
    chipClassName: "border-rose-200 bg-rose-50 text-rose-900",
  },
  Benefits: {
    chipClassName: "border-indigo-200 bg-indigo-50 text-indigo-900",
  },
  Pension: {
    chipClassName: "border-slate-200 bg-slate-50 text-slate-900",
  },
  Other: {
    chipClassName: "border-line-strong bg-white text-black",
  },
};

export function getIncomeSourceCategoryStyle(category: string) {
  return (
    incomeSourceCategoryStyles[category as IncomeSourceCategory] ??
    incomeSourceCategoryStyles.Other
  );
}
