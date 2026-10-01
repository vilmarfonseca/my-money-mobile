// Synced from my-money-v2 (src/lib/analytics/analytics-preview-data.ts). Do not edit here: change it
// in the web repo and run `npm run sync:web`.
import type {
  AnalyticsPageData,
  SankeyFlow,
  SankeyNode,
} from "@/lib/analytics/analytics-queries";

/**
 * Illustrative dataset for the customize-modal previews. Tiles always show a
 * fully populated example of each chart (mirroring the design mocks) instead
 * of the user's live numbers, so every preview reads well even when the
 * selected period has little or no data.
 */

const MONTHS = [
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
];

const SOURCES: SankeyNode[] = [
  { id: "src-0", label: "Salary", amount: 5200, color: "#7c3aed" },
  { id: "src-1", label: "Freelance", amount: 1400, color: "#d23864" },
  { id: "src-2", label: "Dividends", amount: 250, color: "#d49234" },
];

const TARGETS: SankeyNode[] = [
  { id: "cat-0", label: "Bills", amount: 1420, color: "#d49234" },
  { id: "cat-1", label: "Food", amount: 720, color: "#d23864" },
  { id: "cat-2", label: "Transport", amount: 310, color: "#5d8a6e" },
  { id: "cat-3", label: "Subscriptions", amount: 180, color: "#b89dff" },
  { id: "cat-4", label: "Discretionary", amount: 1720, color: "#2e2641" },
  { id: "saved", label: "__saved__", amount: 2500, color: "#5fa377" },
];

const totalFlow = TARGETS.reduce((a, t) => a + t.amount, 0);
const FLOWS: SankeyFlow[] = SOURCES.flatMap((s) =>
  TARGETS.map((t) => ({
    source: s.id,
    target: t.id,
    amount: (s.amount * t.amount) / totalFlow,
  })),
);

const NET_WORTH = [
  34100, 34700, 35600, 36100, 37000, 37850, 38350, 39550, 40100, 41050, 41800,
  42500,
];

const SAVE_RATES = [29, 31, 27, 33, 30, 35, 26, 36, 32, 37, 33, 34];

export function buildAnalyticsPreviewData(): AnalyticsPageData {
  return {
    period: "month",
    rangeLabel: "",
    kpis: {
      netWorth: { value: 42_500, momPct: 3.2 },
      saveRate: { value: 34, target: 30 },
      avgMonthlyIncome: { value: 6850, delta: 410 },
      avgMonthlySpend: { value: 4521, deltaPct: 2.1 },
    },
    sankey: {
      sources: SOURCES,
      targets: TARGETS,
      flows: FLOWS,
      totalIn: 6850,
      targetCount: TARGETS.length,
      retained: 2329,
      largestInflow: { label: "Salary", amount: 5200 },
      largestOutflow: { label: "Discretionary", amount: 1720 },
      fixedPct: 34,
      savedPct: 37,
      topOutflowShareOfSpendPct: 38,
    },
    netWorthTrend: {
      points: MONTHS.map((label, i) => ({
        label,
        monthKey: label,
        value: NET_WORTH[i],
      })),
      current: 42_500,
      growthPct: 24.6,
      deltaOverRange: 8400,
      markers: [],
      markerIndexes: [6, 11],
    },
    saveRateTrend: {
      points: MONTHS.map((label, i) => ({ label, rate: SAVE_RATES[i] })),
      target: 30,
      latest: 34,
      best: 37,
      average: 32,
    },
    heatmap: {
      monthLabels: MONTHS,
      categories: [
        { name: "Bills", values: [1420, 1360, 1290, 1310, 1420, 1250, 1490, 1310, 1340, 1370, 1400, 1420] },
        { name: "Food", values: [560, 610, 720, 680, 650, 760, 880, 610, 700, 660, 690, 720] },
        { name: "Transport", values: [280, 300, 340, 290, 250, 270, 320, 360, 300, 320, 340, 310] },
        { name: "Subscriptions", values: [160, 165, 170, 175, 170, 170, 180, 175, 175, 175, 180, 180] },
        { name: "Discretionary", values: [980, 1180, 1420, 880, 820, 1010, 1980, 860, 1010, 1160, 1240, 1720] },
        { name: "Travel", values: [0, 820, 0, 0, 0, 0, 540, 0, 0, 0, 0, 280] },
      ],
    },
    balanceAhead: {
      monthEndLabel: "May",
      today: 3180,
      incoming: 2400,
      billsDue: 1220,
      estimatedVariable: 730,
      projected: 3630,
      rows: [],
    },
    compound: {
      points: [
        { label: "__now__", base: 42_500, lo: 42_500, hi: 42_500 },
        { label: "+2y", base: 58_000, lo: 54_000, hi: 62_000 },
        { label: "+4y", base: 76_000, lo: 66_000, hi: 87_000 },
        { label: "+6y", base: 96_000, lo: 80_000, hi: 116_000 },
        { label: "+8y", base: 119_000, lo: 95_000, hi: 150_000 },
        { label: "+10y", base: 145_000, lo: 112_000, hi: 190_000 },
      ],
      saveRatePct: 34,
      tenYearValue: 145_000,
    },
    runway: { months: 6.2, saved: 28_000, avgMonthlySpend: 4521 },
    goalEtas: [
      {
        name: "Emergency fund",
        saved: 28_000,
        target: 30_000,
        percent: 93,
        chip: { kind: "eta", label: "" },
      },
      {
        name: "Japan trip",
        saved: 3100,
        target: 6000,
        percent: 52,
        chip: { kind: "onTrack", label: "" },
      },
      {
        name: "New laptop",
        saved: 900,
        target: 2400,
        percent: 38,
        chip: { kind: "behind", label: "2" },
      },
    ],
    budget: [
      { name: "Bills", typical: 1500, actual: 1420, over: false, diff: 80 },
      { name: "Food", typical: 700, actual: 720, over: true, diff: 20 },
      { name: "Transport", typical: 350, actual: 310, over: false, diff: 40 },
      { name: "Discretionary", typical: 1200, actual: 1720, over: true, diff: 520 },
      { name: "Subscriptions", typical: 200, actual: 180, over: false, diff: 20 },
    ],
    recurringSplit: { fixed: 1600, variable: 2921, fixedPct: 35 },
    effectiveSaveRate: {
      points: MONTHS.map((label, i) => ({ label, rate: SAVE_RATES[i] })),
      target: 30,
      latest: 34,
      best: 37,
      average: 32,
    },
    merchants: [
      { name: "Whole Foods", amount: 420, count: 9 },
      { name: "Amazon", amount: 310, count: 12 },
      { name: "Shell", amount: 180, count: 6 },
      { name: "Uber", amount: 96, count: 8 },
      { name: "Netflix", amount: 32, count: 2 },
    ],
    unusual: [
      { merchant: "Best Buy", category: "Electronics", amount: 1240, ratio: 3.2 },
      { merchant: "Dining out", category: "Food", amount: 310, ratio: 1.8 },
      { merchant: "Rideshare", category: "Transport", amount: 96, ratio: 1.6 },
    ],
    subscriptions: [
      { merchant: "Adobe CC", monthlyAmount: 54.99, costPerDay: 1.83, frequency: "monthly" },
      { merchant: "Gym", monthlyAmount: 40, costPerDay: 1.33, frequency: "monthly" },
      { merchant: "Netflix", monthlyAmount: 15.49, costPerDay: 0.52, frequency: "monthly" },
      { merchant: "News+", monthlyAmount: 9.99, costPerDay: 0.33, frequency: "yearly" },
    ],
    benchmarks: {
      aboveTargetPct: 82,
      streak: 7,
      last12: [true, true, false, true, true, true, false, true, true, true, true, true],
      target: 30,
    },
    thisVsLast: {
      categories: [
        { name: "Bills", current: 1420, previous: 1420 },
        { name: "Food", current: 720, previous: 690 },
        { name: "Transport", current: 310, previous: 340 },
        { name: "Discretionary", current: 1720, previous: 1240 },
        { name: "Subscriptions", current: 180, previous: 175 },
        { name: "Travel", current: 260, previous: 300 },
      ],
      currentTotal: 4521,
      previousTotal: 4680,
    },
    seasonality: {
      points: MONTHS.map((label, i) => ({
        label,
        current: [4.3, 4.5, 5.1, 4.4, 4.2, 4.6, 5.9, 4.3, 4.6, 4.8, 4.9, 4.5][i] * 1000,
        previous: [4.2, 4.4, 4.9, 4.3, 4.1, 4.5, 5.6, 4.2, 4.4, 4.6, 4.7, 4.9][i] * 1000,
      })),
    },
  };
}
