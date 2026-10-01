// Synced from my-money-v2 (src/lib/income/income-data.ts). Do not edit here: change it
// in the web repo and run `npm run sync:web`.
export const incomeTrendData = [
  { month: "Dec", income: 3100, recurring: 2900 },
  { month: "Jan", income: 3200, recurring: 3000 },
  { month: "Feb", income: 3200, recurring: 3000 },
  { month: "Mar", income: 3450, recurring: 3200 },
  { month: "Apr", income: 3300, recurring: 3200 },
  { month: "May", income: 3650, recurring: 3200 },
] as const;

export const incomeKpis = [
  {
    label: "Avg / month",
    value: "$3,317",
    fraction: ".00",
    delta: "last 6 months",
    tone: "neutral",
  },
  {
    label: "Recurring",
    value: "$3,200",
    fraction: ".00",
    delta: "88% of May income",
    tone: "neutral",
  },
  {
    label: "Variable",
    value: "$450",
    fraction: ".00",
    delta: "+$130 vs. April",
    tone: "positive",
  },
  {
    label: "Next payout",
    value: "$1,600",
    fraction: ".00",
    delta: "Fri, May 16 · Salary",
    tone: "neutral",
  },
] as const;

export const incomeSources = [
  {
    id: "src-salary",
    name: "Salary",
    institution: "Acme Corp",
    category: "Payroll",
    cadence: "1st & 15th · direct deposit",
    lastPaid: "May 16",
    amount: 3200,
    status: "Recurring",
  },
  {
    id: "src-freelance",
    name: "Side project",
    institution: "Freelance",
    category: "Client work",
    cadence: "Stripe · paid per invoice",
    lastPaid: "May 5",
    amount: 380,
    status: "Variable",
  },
  {
    id: "src-reimbursement",
    name: "Reimbursement",
    institution: "Travel",
    category: "Reimbursement",
    cadence: "Acme Corp · one-off",
    lastPaid: "May 1",
    amount: 70,
    status: "One-off",
  },
] as const;

export const payoutCalendarDays = [
  {
    day: 1,
    sourceName: "Salary",
    type: "Recurring",
    amount: 1600,
    state: "cleared",
  },
  {
    day: 5,
    sourceName: "Side project",
    type: "Variable",
    amount: 380,
    state: "cleared",
  },
  {
    day: 16,
    sourceName: "Salary",
    type: "Recurring",
    amount: 1600,
    state: "scheduled",
  },
] as const;
