// Synced from my-money-v2 (src/lib/balance/balance-utils.ts). Do not edit here: change it
// in the web repo and run `npm run sync:web`.
import type { BalancePeriodData } from "@/lib/balance/balance-data";

export function computeWaterfall(data: BalancePeriodData) {
  const total = data.income;
  const left = total - data.spending - data.goals;
  const positiveLeft = Math.max(left, 0);
  const totalForPct = Math.max(
    total,
    data.spending + data.goals + positiveLeft,
    1,
  );

  return {
    left,
    pSpend: Math.max((data.spending / totalForPct) * 100, 0),
    pGoals: Math.max((data.goals / totalForPct) * 100, 0),
    pLeft: Math.max((positiveLeft / totalForPct) * 100, 0),
  };
}

export type SurplusSummary = {
  count: number;
  totalBanked: number;
  avg: number;
  high: number;
  low: number;
  highIndex: number;
  lowIndex: number;
  rates: number[];
  onTarget: number;
  half: number;
  trendPct: number;
  trendUp: boolean;
  /** Tallest value the chart scales to, with headroom above the peak bar. */
  maxValue: number;
  chartMin: number;
  chartMax: number;
  chartRange: number;
  zeroPct: number;
};

export function computeSurplusSummary(data: BalancePeriodData): SurplusSummary {
  const { streak, bars, target } = data;
  const count = streak.length;
  const average = (values: number[]) =>
    values.length > 0
      ? values.reduce((sum, value) => sum + value, 0) / values.length
      : 0;

  const totalBanked = streak.reduce((sum, value) => sum + value, 0);
  const avg = count > 0 ? totalBanked / count : 0;

  let highIndex = 0;
  let lowIndex = 0;
  streak.forEach((value, index) => {
    if (value > streak[highIndex]) highIndex = index;
    if (value < streak[lowIndex]) lowIndex = index;
  });

  const rates = streak.map((value, index) =>
    bars[index].income > 0 ? (value / bars[index].income) * 100 : 0,
  );
  const onTarget = rates.filter((rate) => rate >= target).length;

  const half = Math.max(1, Math.floor(count / 2));
  const recentAvg = average(streak.slice(Math.max(count - half, 0)));
  const priorAvg = average(streak.slice(0, Math.max(count - half, 0)));
  const trendPct =
    priorAvg === 0 ? 0 : ((recentAvg - priorAvg) / priorAvg) * 100;
  const rawHigh = Math.max(...streak, 0);
  const rawLow = Math.min(...streak, 0);
  const rawRange = Math.max(rawHigh - rawLow, 1);
  const padding = rawRange * 0.12;
  const chartMax = rawHigh > 0 ? rawHigh + padding : 0;
  const chartMin = rawLow < 0 ? rawLow - padding : 0;
  const chartRange = Math.max(chartMax - chartMin, 1);
  const zeroPct = ((0 - chartMin) / chartRange) * 100;

  return {
    count,
    totalBanked,
    avg,
    high: streak[highIndex],
    low: streak[lowIndex],
    highIndex,
    lowIndex,
    rates,
    onTarget,
    half,
    trendPct,
    trendUp: trendPct >= 0,
    maxValue: chartMax,
    chartMin,
    chartMax,
    chartRange,
    zeroPct,
  };
}
