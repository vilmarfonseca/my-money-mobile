// Synced from my-money-v2 (src/lib/goals/goals-data.ts). Do not edit here: change it
// in the web repo and run `npm run sync:web`.
export type GoalTone = "plum" | "coral" | "sage" | "amber";

export type GoalIcon = "reserve" | "travel" | "laptop";

export type GoalPaceTone = "positive" | "warm" | "neutral";

export type Goal = {
  /** Database id; absent on the static sample data used by seeds/mocks. */
  id?: string;
  /** Raw yyyy-mm-dd target date for editing; `targetDate` is display-only. */
  targetDateIso?: string | null;
  name: string;
  icon: GoalIcon;
  tone: GoalTone;
  saved: number;
  target: number;
  targetDate: string;
  monthlyContribution: number;
  progress: number;
  pace: string;
  paceTone: GoalPaceTone;
  status?: string;
  detail: string;
  nextStep: string;
};

export type GoalActivity = {
  title: string;
  goal: string;
  meta: string;
  amount: string;
  tone: GoalTone | "ink";
  kind: "added" | "milestone" | "created" | "completed";
};

export type CompletedGoal = {
  name: string;
  note: string;
  amount: number;
  completedDate: string;
  tone: GoalTone | "amber";
  icon: "gift" | "home" | "run" | "travel";
};

export const goalOverview = {
  monthlySavings: 680,
  savingsRate: "18.6%",
  autoTransfer: "1st & 15th",
  totalSaved: 5280,
  combinedTarget: 10700,
  nextMilestone: "Aug",
  finishNote: "four months",
} as const;

export const monthlySavingsTrend = [
  { month: "Dec", saved: 480 },
  { month: "Jan", saved: 560 },
  { month: "Feb", saved: 500 },
  { month: "Mar", saved: 620 },
  { month: "Apr", saved: 650 },
  { month: "May", saved: 680 },
] as const;

export const goalsHealthMetrics = [
  {
    label: "Savings rate",
    value: "18.6%",
    detail: "+ 2.1% vs March",
  },
  {
    label: "All goals done by",
    value: "Mar '27",
    detail: "if pace holds",
  },
  {
    label: "6-mo average",
    value: "$570",
    suffix: "/mo",
    detail: "trending up",
  },
  {
    label: "Streak",
    value: "7 mo",
    detail: "no missed transfers",
  },
] as const;

export const activeGoals: Goal[] = [
  {
    name: "Emergency fund",
    icon: "reserve",
    tone: "plum",
    saved: 3200,
    target: 5000,
    targetDate: "Sep 2026",
    monthlyContribution: 200,
    progress: 64,
    pace: "4 months ahead of pace",
    paceTone: "positive",
    detail: "9 months remaining",
    nextStep: "$1,800 to go",
  },
  {
    name: "Tokyo trip",
    icon: "travel",
    tone: "coral",
    saved: 1240,
    target: 3500,
    targetDate: "Mar 2027",
    monthlyContribution: 230,
    progress: 35,
    pace: "2 months behind pace",
    paceTone: "warm",
    status: "Slightly behind",
    detail: "10 months remaining",
    nextStep: "$2,260 to go",
  },
  {
    name: "New laptop",
    icon: "laptop",
    tone: "sage",
    saved: 840,
    target: 2200,
    targetDate: "Aug 2026",
    monthlyContribution: 250,
    progress: 38,
    pace: "On pace · finishes in 4 months",
    paceTone: "neutral",
    detail: "Next: $250 on May 15",
    nextStep: "$1,360 to go",
  },
];

export const completedGoals: CompletedGoal[] = [
  {
    name: "Holiday gifts",
    note: "Saved over 3 months",
    amount: 420,
    completedDate: "Dec 22, 2025",
    tone: "coral",
    icon: "gift",
  },
  {
    name: "Marathon entry",
    note: "Saved over 2 months",
    amount: 180,
    completedDate: "Oct 4, 2025",
    tone: "sage",
    icon: "run",
  },
  {
    name: "Home office",
    note: "Saved over 5 months",
    amount: 1250,
    completedDate: "Aug 19, 2025",
    tone: "plum",
    icon: "home",
  },
  {
    name: "Berlin weekend",
    note: "Saved over 4 months",
    amount: 1790,
    completedDate: "Apr 11, 2025",
    tone: "amber",
    icon: "travel",
  },
];

export const whatIfScenario = {
  goalName: "Tokyo trip",
  remaining: 2260,
  currentMonthlyContribution: 230,
  initialExtraContribution: 60,
  maxExtraContribution: 250,
  step: 10,
  startMonthIndex: 4,
  startYear: 2026,
} as const;

export const goalActivities: GoalActivity[] = [
  {
    title: "Added $200 to",
    goal: "Emergency fund",
    meta: "Auto-transfer · May 1",
    amount: "+$200",
    tone: "plum",
    kind: "added",
  },
  {
    title: "Hit halfway on",
    goal: "New laptop",
    meta: "Apr 28 · 38% complete",
    amount: "$840 / $2,200",
    tone: "sage",
    kind: "milestone",
  },
  {
    title: "Created",
    goal: "Tokyo trip",
    meta: "Mar 14 · target $3,500 by Mar 2027",
    amount: "New",
    tone: "coral",
    kind: "created",
  },
  {
    title: "Completed",
    goal: "Holiday gifts",
    meta: "Dec 22, 2025 · archived",
    amount: "$420",
    tone: "ink",
    kind: "completed",
  },
  {
    title: "Created",
    goal: "Emergency fund",
    meta: "May 1 · target $5,000 by Sep 2026",
    amount: "New",
    tone: "plum",
    kind: "created",
  },
];
