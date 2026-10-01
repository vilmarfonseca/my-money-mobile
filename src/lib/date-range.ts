// Synced from my-money-v2 (src/lib/date-range.ts). Do not edit here: change it
// in the web repo and run `npm run sync:web`.
import type { AppLocale } from "@/lib/i18n/config";
import { getMessages } from "@/lib/i18n/messages";
import { formatCapitalizedDate } from "@/lib/i18n/format";

export type DateRangeParams = {
  from?: string;
  to?: string;
};

export type ParsedDateRange = {
  from: Date | null;
  to: Date | null;
};

const dateParamPattern = /^(\d{4})-(\d{2})-(\d{2})$/;

export function parseDateParam(value?: string | null): Date | null {
  if (!value) return null;

  const match = value.match(dateParamPattern);
  if (!match) return null;

  const [, year, month, day] = match;
  const date = new Date(Number(year), Number(month) - 1, Number(day));

  if (
    date.getFullYear() !== Number(year) ||
    date.getMonth() !== Number(month) - 1 ||
    date.getDate() !== Number(day)
  ) {
    return null;
  }

  return date;
}

export function parseDateRangeParams({
  from,
  to,
}: DateRangeParams): ParsedDateRange {
  const start = parseDateParam(from);
  const end = parseDateParam(to);

  if (start && end && start > end) {
    return { from: end, to: start };
  }

  return { from: start, to: end };
}

export function formatDateParam(date: Date): string {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

export function formatDateRangeLabel(
  from: Date | null,
  to: Date | null,
  locale: AppLocale = "en-US",
) {
  const messages = getMessages(locale);

  if (!from && !to) return messages.periods.allHistory;

  const formatDate = (date: Date) =>
    formatCapitalizedDate(date, locale, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

  if (from && to) return `${formatDate(from)} - ${formatDate(to)}`;
  if (from) return messages.periods.from(formatDate(from));
  if (to) return messages.periods.until(formatDate(to));
  return messages.periods.allHistory;
}
