// Synced from my-money-v2 (src/lib/dashboard/dashboard-data.ts). Do not edit here: change it
// in the web repo and run `npm run sync:web`.
import { activeGoals } from "@/lib/goals/goals-data";

export const kpis = [
  {
    label: "Total balance",
    value: "$24,562",
    fraction: ".89",
    delta: "+2.4% this month",
    tone: "positive",
    surface: "glass",
  },
  {
    label: "Income · May",
    value: "$8,450",
    fraction: ".00",
    delta: "+$350 vs last mo",
    tone: "positive",
    surface: "solid",
  },
  {
    label: "Spending · May",
    value: "$5,280",
    fraction: ".42",
    delta: "+8% vs last mo",
    tone: "negative",
    surface: "solid",
  },
  {
    label: "Saved · May",
    value: "$680",
    fraction: ".00",
    delta: "3 active goals · on pace",
    tone: "neutral",
    surface: "solid",
  },
] as const;

export const cashFlowData = [
  { month: "Dec", income: 7200, spending: 5060 },
  { month: "Jan", income: 7680, spending: 4920 },
  { month: "Feb", income: 8020, spending: 5340 },
  { month: "Mar", income: 8240, spending: 4860 },
  { month: "Apr", income: 8100, spending: 5180 },
  { month: "May", income: 8450, spending: 5280 },
] as const;

export const goals = activeGoals.map((goal) => ({
  date: goal.targetDate,
  name: goal.name,
  progress: goal.progress,
  saved: `$${goal.saved.toFixed(2)}`,
  target: `$${goal.target.toFixed(2)}`,
}));

export const balanceOverview = {
  total: "$24,562",
  fraction: ".89",
  weekDelta: "↑ $240 this week",
  monthDelta: "+2.4% this month",
  cardNote: "Plum card · $1,162",
  accounts: [
    { label: "Checking", value: "$8,140", delta: "+$310 wk", color: "plum" },
    { label: "Savings", value: "$15,260", delta: "+$660 mo", color: "sage" },
  ],
  flow: {
    month: "May",
    rows: [
      { label: "Income in", value: "+$3,650", color: "sage", positive: true },
      { label: "Spending out", value: "−$2,129", color: "coral" },
      { label: "Into goals", value: "−$660", color: "plum" },
    ],
    bar: [
      { color: "coral", amount: 2129 },
      { color: "plum", amount: 660 },
      { color: "sage", amount: 861 },
    ],
    leftToSaveLabel: "Left to save",
    leftToSave: "+$861",
  },
} as const;

export const balanceTrend = [
  { month: "Sep", balance: 21100 },
  { month: "Oct", balance: 21460 },
  { month: "Nov", balance: 21320 },
  { month: "Dec", balance: 22010 },
  { month: "Jan", balance: 22580 },
  { month: "Feb", balance: 22910 },
  { month: "Mar", balance: 23240 },
  { month: "Apr", balance: 23880 },
  { month: "May", balance: 24562 },
] as const;

export const upcomingItems = [
  {
    id: "up-verizon",
    day: "22",
    month: "May",
    name: "Internet · Verizon",
    detail: "Bill · auto-pay",
    amount: -74,
  },
  {
    id: "up-gym",
    day: "23",
    month: "May",
    name: "Gym membership",
    detail: "Subscription",
    amount: -38,
  },
  {
    id: "up-dividend",
    day: "25",
    month: "May",
    name: "Dividend · VTI",
    detail: "Income · brokerage",
    amount: 42,
  },
  {
    id: "up-tax-refund",
    day: "29",
    month: "May",
    name: "Tax refund",
    detail: "Income · IRS",
    amount: 1180,
  },
  {
    id: "up-rent",
    day: "01",
    month: "Jun",
    name: "Rent",
    detail: "Bill · checking",
    amount: -1800,
  },
] as const;

export const recentTransactions = [
  {
    id: "tx-whole-foods",
    name: "Whole Foods Market",
    category: "Groceries",
    type: "Expense",
    date: "May 21",
    amount: -84.2,
  },
  {
    id: "tx-salary-may",
    name: "Salary · May",
    category: "Acme Corp",
    type: "Income",
    date: "May 20",
    amount: 3200,
  },
  {
    id: "tx-spotify",
    name: "Spotify",
    category: "Subscriptions",
    type: "Expense",
    date: "May 19",
    amount: -10.99,
  },
  {
    id: "tx-blue-bottle",
    name: "Blue Bottle",
    category: "Coffee",
    type: "Expense",
    date: "May 18",
    amount: -6.5,
  },
  {
    id: "tx-delta",
    name: "Delta Airlines",
    category: "Travel",
    type: "Expense",
    date: "May 16",
    amount: -310,
  },
  {
    id: "tx-trader-joes",
    name: "Trader Joe's",
    category: "Groceries",
    type: "Expense",
    date: "May 15",
    amount: -52.3,
  },
] as const;
