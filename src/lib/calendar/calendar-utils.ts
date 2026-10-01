// Synced from my-money-v2 (src/lib/calendar/calendar-utils.ts). Do not edit here: change it
// in the web repo and run `npm run sync:web`.
import type { AppLocale } from "@/lib/i18n/config";
import { formatCapitalizedDate } from "@/lib/i18n/format";
import type { CalendarView, DueItem } from "./types";

export function parseDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function dateKey(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export function addMonths(date: Date, months: number) {
  const next = new Date(date);
  next.setMonth(next.getMonth() + months);
  return next;
}

export function addYears(date: Date, years: number) {
  const next = new Date(date);
  next.setFullYear(next.getFullYear() + years);
  return next;
}

export function startOfWeek(date: Date) {
  return addDays(date, -date.getDay());
}

export function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function isSameDay(a: Date, b: Date) {
  return dateKey(a) === dateKey(b);
}

export function isSameMonth(a: Date, b: Date) {
  return a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear();
}

export function getMonthGrid(date: Date) {
  const start = startOfWeek(startOfMonth(date));
  return Array.from({ length: 42 }, (_, index) => addDays(start, index));
}

export function getWeekDays(date: Date) {
  const start = startOfWeek(date);
  return Array.from({ length: 7 }, (_, index) => addDays(start, index));
}

export function formatDay(date: Date, locale: AppLocale) {
  return formatCapitalizedDate(date, locale, {
    day: "numeric",
    month: "long",
  });
}

export function formatLongDay(date: Date, locale: AppLocale) {
  return formatCapitalizedDate(date, locale, {
    day: "numeric",
    month: "long",
    weekday: "short",
  });
}

export function formatTitle(
  view: CalendarView,
  date: Date,
  locale: AppLocale,
  upcomingFrom: (date: string) => string,
) {
  if (view === "year") {
    return `${date.getFullYear()}`;
  }

  if (view === "week") {
    const days = getWeekDays(date);
    const first = days[0];
    const last = days[6];
    return `${formatDay(first, locale)} - ${formatDay(last, locale)}, ${last.getFullYear()}`;
  }

  if (view === "due") {
    return upcomingFrom(formatDay(date, locale));
  }

  return formatCapitalizedDate(date, locale, {
    month: "long",
    year: "numeric",
  });
}

type CurrencyFormatter = (value: number) => string;

export function formatAmount(
  amount: number,
  formatCurrency: CurrencyFormatter,
) {
  const value = formatCurrency(Math.abs(amount));

  return amount > 0 ? `+${value}` : `-${value}`;
}

export function itemDate(item: DueItem) {
  return parseDate(item.date);
}

export function sortItems(items: DueItem[]) {
  return [...items].sort((a, b) => {
    const byDate = itemDate(a).getTime() - itemDate(b).getTime();
    return byDate || a.time.localeCompare(b.time);
  });
}

export function groupItemsByDate(items: DueItem[]) {
  return sortItems(items).reduce<Record<string, DueItem[]>>((groups, item) => {
    groups[item.date] = groups[item.date] ?? [];
    groups[item.date].push(item);
    return groups;
  }, {});
}
