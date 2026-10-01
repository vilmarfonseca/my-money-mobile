// Synced from my-money-v2 (src/lib/balance/balance-data.ts). Do not edit here: change it
// in the web repo and run `npm run sync:web`.
import type { SegmentedControlOption } from "@/components/ui/segmented-control";

export type BalancePeriod = "week" | "month" | "quarter" | "year";

export type BalanceBar = {
  label: string;
  income: number;
  spending: number;
  filterFrom?: string;
  filterTo?: string;
  current?: boolean;
  partial?: boolean;
};

export type BalanceMeta = {
  label: string;
  value: string;
  sub: string;
};

export type TipSegment = {
  text: string;
  emphasis?: boolean;
};

export type BalanceTableRow = {
  period: string;
  sub: string;
  income: number;
  spending: number;
  goals: number;
  left: number;
  rate: number;
  current?: boolean;
};

export type BalanceFoot = {
  label: string;
  income: number;
  spending: number;
  goals: number;
  left: number;
  rate: string;
};

export type BalancePeriodData = {
  unitLong: string;
  unitShort: string;
  target: number;
  eyebrow: string;
  amount: number;
  rate: number;
  chips: { delta: string; context: string };
  meta1: BalanceMeta;
  meta2: BalanceMeta;
  income: number;
  spending: number;
  goals: number;
  wfPeriod: string;
  bars: BalanceBar[];
  streak: number[];
  tip: { eyebrow: string; copy: TipSegment[] };
  tableTitle: string;
  tableHeading: string;
  tableCount: string;
  rows: BalanceTableRow[];
  foot: BalanceFoot;
};

export const balancePeriodOptions: ReadonlyArray<
  SegmentedControlOption<BalancePeriod>
> = [
  { label: "Week", value: "week" },
  { label: "Month", value: "month" },
  { label: "Quarter", value: "quarter" },
  { label: "Year", value: "year" },
];

export const balanceData: Record<BalancePeriod, BalancePeriodData> = {
  week: {
    unitLong: "weeks",
    unitShort: "wk.",
    target: 20,
    eyebrow: "Left for savings · week of May 18",
    amount: 218,
    rate: 25.5,
    chips: { delta: "+ $36 vs. last week", context: "Strongest week in 6" },
    meta1: {
      label: "Month so far",
      value: "$861",
      sub: "May surplus, 5 wk in",
    },
    meta2: { label: "Streak", value: "6 wk.", sub: "Every week positive" },
    income: 855,
    spending: 472,
    goals: 165,
    wfPeriod: "· this week",
    bars: [
      { label: "Wk 16", income: 820, spending: 510 },
      { label: "Wk 17", income: 825, spending: 478 },
      { label: "Wk 18", income: 840, spending: 502 },
      { label: "Wk 19", income: 850, spending: 545 },
      { label: "Wk 20", income: 870, spending: 489 },
      {
        label: "Wk 21",
        income: 855,
        spending: 472,
        current: true,
        partial: true,
      },
    ],
    streak: [160, 182, 173, 140, 216, 218],
    tip: {
      eyebrow: "Pattern noticed",
      copy: [
        { text: "You've run a " },
        { text: "positive surplus", emphasis: true },
        { text: " every week this year — a quiet streak worth keeping." },
      ],
    },
    tableTitle: "Week-by-week",
    tableHeading: "Week",
    tableCount: "6 weeks",
    rows: [
      {
        period: "Wk 21 · May 18",
        sub: "In progress · 5 days",
        income: 855,
        spending: 472,
        goals: 165,
        left: 218,
        rate: 25.5,
        current: true,
      },
      {
        period: "Wk 20 · May 11",
        sub: "7 days",
        income: 870,
        spending: 489,
        goals: 165,
        left: 216,
        rate: 24.8,
      },
      {
        period: "Wk 19 · May 4",
        sub: "7 days",
        income: 850,
        spending: 545,
        goals: 165,
        left: 140,
        rate: 16.5,
      },
      {
        period: "Wk 18 · Apr 27",
        sub: "7 days",
        income: 840,
        spending: 502,
        goals: 165,
        left: 173,
        rate: 20.6,
      },
      {
        period: "Wk 17 · Apr 20",
        sub: "7 days",
        income: 825,
        spending: 478,
        goals: 165,
        left: 182,
        rate: 22.1,
      },
      {
        period: "Wk 16 · Apr 13",
        sub: "7 days",
        income: 820,
        spending: 510,
        goals: 150,
        left: 160,
        rate: 19.5,
      },
    ],
    foot: {
      label: "6-week total",
      income: 5060,
      spending: 2996,
      goals: 975,
      left: 1089,
      rate: "21.5% avg",
    },
  },

  month: {
    unitLong: "months",
    unitShort: "mo.",
    target: 20,
    eyebrow: "Left for savings · May 2026",
    amount: 861,
    rate: 23.6,
    chips: { delta: "+ $192 vs. April", context: "Above 20% target" },
    meta1: {
      label: "Year to date",
      value: "$4,105",
      sub: "Surplus across 5 mo.",
    },
    meta2: { label: "Streak", value: "6 mo.", sub: "Every month positive" },
    income: 3650,
    spending: 2129,
    goals: 660,
    wfPeriod: "· May",
    bars: [
      { label: "Dec", income: 3100, spending: 1978 },
      { label: "Jan", income: 3200, spending: 2019 },
      { label: "Feb", income: 3200, spending: 1962 },
      { label: "Mar", income: 3450, spending: 2055 },
      { label: "Apr", income: 3300, spending: 1971 },
      {
        label: "May",
        income: 3650,
        spending: 2129,
        current: true,
        partial: true,
      },
    ],
    streak: [621, 580, 638, 735, 669, 861],
    tip: {
      eyebrow: "Pattern noticed",
      copy: [
        { text: "Your surplus has grown " },
        { text: "three months in a row", emphasis: true },
        {
          text: " — bumping Tokyo trip by $60/mo would still leave $801 free.",
        },
      ],
    },
    tableTitle: "Month-by-month",
    tableHeading: "Month",
    tableCount: "6 months",
    rows: [
      {
        period: "May 2026",
        sub: "In progress · 24 days",
        income: 3650,
        spending: 2129,
        goals: 660,
        left: 861,
        rate: 23.6,
        current: true,
      },
      {
        period: "April 2026",
        sub: "30 days",
        income: 3300,
        spending: 1971,
        goals: 660,
        left: 669,
        rate: 20.3,
      },
      {
        period: "March 2026",
        sub: "31 days",
        income: 3450,
        spending: 2055,
        goals: 660,
        left: 735,
        rate: 21.3,
      },
      {
        period: "February 2026",
        sub: "28 days",
        income: 3200,
        spending: 1962,
        goals: 600,
        left: 638,
        rate: 19.9,
      },
      {
        period: "January 2026",
        sub: "31 days",
        income: 3200,
        spending: 2019,
        goals: 600,
        left: 581,
        rate: 18.1,
      },
      {
        period: "December 2025",
        sub: "31 days",
        income: 3100,
        spending: 1978,
        goals: 500,
        left: 622,
        rate: 20.1,
      },
    ],
    foot: {
      label: "6-month total",
      income: 19900,
      spending: 12114,
      goals: 3680,
      left: 4106,
      rate: "20.6% avg",
    },
  },

  quarter: {
    unitLong: "quarters",
    unitShort: "qtr.",
    target: 20,
    eyebrow: "Left for savings · Q2 2026",
    amount: 1530,
    rate: 22.0,
    chips: {
      delta: "− $424 vs. Q1",
      context: "Q2 still in progress · 2 of 3 mo.",
    },
    meta1: { label: "YTD", value: "$3,484", sub: "Across 5 months" },
    meta2: { label: "Streak", value: "5 qtrs.", sub: "Every quarter positive" },
    income: 6950,
    spending: 4100,
    goals: 1320,
    wfPeriod: "· Q2",
    bars: [
      { label: "Q1 25", income: 9000, spending: 5800 },
      { label: "Q2 25", income: 9200, spending: 5950 },
      { label: "Q3 25", income: 9400, spending: 6100 },
      { label: "Q4 25", income: 9500, spending: 5950 },
      { label: "Q1 26", income: 9850, spending: 6036 },
      {
        label: "Q2 26",
        income: 6950,
        spending: 4100,
        current: true,
        partial: true,
      },
    ],
    streak: [1700, 1750, 1700, 2050, 1954, 1530],
    tip: {
      eyebrow: "Heads up",
      copy: [
        { text: "Q2 is tracking " },
        { text: "22%", emphasis: true },
        {
          text: " savings rate — your highest quarter on record, with one month still to come.",
        },
      ],
    },
    tableTitle: "Quarter-by-quarter",
    tableHeading: "Quarter",
    tableCount: "6 quarters",
    rows: [
      {
        period: "Q2 2026",
        sub: "In progress · Apr–May",
        income: 6950,
        spending: 4100,
        goals: 1320,
        left: 1530,
        rate: 22.0,
        current: true,
      },
      {
        period: "Q1 2026",
        sub: "Jan–Mar",
        income: 9850,
        spending: 6036,
        goals: 1860,
        left: 1954,
        rate: 19.8,
      },
      {
        period: "Q4 2025",
        sub: "Oct–Dec",
        income: 9500,
        spending: 5950,
        goals: 1500,
        left: 2050,
        rate: 21.6,
      },
      {
        period: "Q3 2025",
        sub: "Jul–Sep",
        income: 9400,
        spending: 6100,
        goals: 1600,
        left: 1700,
        rate: 18.1,
      },
      {
        period: "Q2 2025",
        sub: "Apr–Jun",
        income: 9200,
        spending: 5950,
        goals: 1500,
        left: 1750,
        rate: 19.0,
      },
      {
        period: "Q1 2025",
        sub: "Jan–Mar",
        income: 9000,
        spending: 5800,
        goals: 1500,
        left: 1700,
        rate: 18.9,
      },
    ],
    foot: {
      label: "6-quarter total",
      income: 53900,
      spending: 33936,
      goals: 9280,
      left: 10684,
      rate: "19.8% avg",
    },
  },

  year: {
    unitLong: "years",
    unitShort: "yr.",
    target: 20,
    eyebrow: "Left for savings · 2026 YTD",
    amount: 3384,
    rate: 20.1,
    chips: {
      delta: "+ $1,210 vs. same point 2025",
      context: "On pace for ~$8,120",
    },
    meta1: { label: "Last full year", value: "$7,200", sub: "2025 surplus" },
    meta2: { label: "Streak", value: "6 yrs.", sub: "Every year positive" },
    income: 16800,
    spending: 10236,
    goals: 3180,
    wfPeriod: "· 2026",
    bars: [
      { label: "2021", income: 30000, spending: 21000 },
      { label: "2022", income: 33000, spending: 22500 },
      { label: "2023", income: 36000, spending: 23800 },
      { label: "2024", income: 38000, spending: 24500 },
      { label: "2025", income: 37100, spending: 23800 },
      {
        label: "2026",
        income: 16800,
        spending: 10236,
        current: true,
        partial: true,
      },
    ],
    streak: [5000, 6000, 7000, 8100, 7200, 3384],
    tip: {
      eyebrow: "Looking ahead",
      copy: [
        { text: "On current pace, " },
        { text: "2026 will set a new high", emphasis: true },
        { text: " for both savings rate and absolute surplus." },
      ],
    },
    tableTitle: "Year-by-year",
    tableHeading: "Year",
    tableCount: "6 years",
    rows: [
      {
        period: "2026 YTD",
        sub: "Jan–May · 5 months",
        income: 16800,
        spending: 10236,
        goals: 3180,
        left: 3384,
        rate: 20.1,
        current: true,
      },
      {
        period: "2025",
        sub: "12 months",
        income: 37100,
        spending: 23800,
        goals: 6100,
        left: 7200,
        rate: 19.4,
      },
      {
        period: "2024",
        sub: "12 months",
        income: 38000,
        spending: 24500,
        goals: 5400,
        left: 8100,
        rate: 21.3,
      },
      {
        period: "2023",
        sub: "12 months",
        income: 36000,
        spending: 23800,
        goals: 5200,
        left: 7000,
        rate: 19.4,
      },
      {
        period: "2022",
        sub: "12 months",
        income: 33000,
        spending: 22500,
        goals: 4500,
        left: 6000,
        rate: 18.2,
      },
      {
        period: "2021",
        sub: "12 months",
        income: 30000,
        spending: 21000,
        goals: 4000,
        left: 5000,
        rate: 16.7,
      },
    ],
    foot: {
      label: "6-year total",
      income: 190900,
      spending: 125836,
      goals: 28380,
      left: 36684,
      rate: "19.2% avg",
    },
  },
};
