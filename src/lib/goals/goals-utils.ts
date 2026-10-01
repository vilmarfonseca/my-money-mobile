// Synced from my-money-v2 (src/lib/goals/goals-utils.ts). Do not edit here: change it
// in the web repo and run `npm run sync:web`.
import type { AppLocale } from "@/lib/i18n/config";
import { formatCapitalizedDate } from "@/lib/i18n/format";

export function getGoalProjection({
  currentMonthlyContribution,
  extraContribution,
  remaining,
  startMonthIndex,
  startYear,
  locale,
}: {
  currentMonthlyContribution: number;
  extraContribution: number;
  remaining: number;
  startMonthIndex: number;
  startYear: number;
  locale: AppLocale;
}) {
  const baseMonthsNeeded = Math.ceil(remaining / currentMonthlyContribution);
  const adjustedMonthsNeeded = Math.ceil(
    remaining / (currentMonthlyContribution + extraContribution),
  );

  return {
    baseline: getFinishDate({
      monthsNeeded: baseMonthsNeeded,
      startMonthIndex,
      startYear,
      locale,
    }),
    adjusted: getFinishDate({
      monthsNeeded: adjustedMonthsNeeded,
      startMonthIndex,
      startYear,
      locale,
    }),
    monthsSooner: baseMonthsNeeded - adjustedMonthsNeeded,
  };
}

function getFinishDate({
  monthsNeeded,
  startMonthIndex,
  startYear,
  locale,
}: {
  monthsNeeded: number;
  startMonthIndex: number;
  startYear: number;
  locale: AppLocale;
}) {
  const totalMonthIndex = startMonthIndex + monthsNeeded;
  const year = startYear + Math.floor(totalMonthIndex / 12);
  const month = totalMonthIndex % 12;

  return formatCapitalizedDate(new Date(year, month, 1), locale, {
    month: "long",
    year: "numeric",
  });
}
