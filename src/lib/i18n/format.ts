// Synced from my-money-v2 (src/lib/i18n/format.ts). Do not edit here: change it
// in the web repo and run `npm run sync:web`.
import type { AppLocale } from "@/lib/i18n/config";
import { getMessages } from "@/lib/i18n/messages";

type CurrencyOptions = {
  currency?: string;
};

/**
 * Every money value in the app is shown with cents — no display ever rounds to
 * a whole unit, however small the space (axis ticks and chart labels included).
 */
export function formatCurrency(
  value: number,
  locale: AppLocale,
  { currency = "USD" }: CurrencyOptions = {},
) {
  return new Intl.NumberFormat(locale, {
    currency,
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
    style: "currency",
  }).format(value);
}

export function formatSignedCurrency(
  value: number,
  locale: AppLocale,
  currency = "USD",
) {
  const formatted = formatCurrency(Math.abs(value), locale, { currency });

  return `${value >= 0 ? "+" : "-"}${formatted}`;
}

export function splitCurrencyParts(
  value: number,
  locale: AppLocale,
  currency = "USD",
) {
  const parts = new Intl.NumberFormat(locale, {
    currency,
    minimumFractionDigits: 2,
    style: "currency",
  }).formatToParts(value);
  const decimalIndex = parts.findIndex((part) => part.type === "decimal");

  if (decimalIndex === -1) {
    return {
      whole: formatCurrency(value, locale, { currency }),
      decimal: "",
      cents: "00",
    };
  }

  return {
    whole: parts
      .slice(0, decimalIndex)
      .map((part) => part.value)
      .join(""),
    decimal: parts[decimalIndex]?.value ?? ".",
    cents: parts
      .slice(decimalIndex + 1)
      .map((part) => part.value)
      .join(""),
  };
}

export function formatMonthShort(date: Date, locale: AppLocale) {
  return formatCapitalizedDate(date, locale, { month: "short" });
}

export function formatMonthLong(date: Date, locale: AppLocale) {
  return formatCapitalizedDate(date, locale, { month: "long" });
}

export function formatDateShort(date: Date, locale: AppLocale) {
  return formatCapitalizedDate(date, locale, {
    day: "numeric",
    month: "short",
  });
}

export function formatMonthYear(date: Date, locale: AppLocale) {
  return formatCapitalizedDate(date, locale, {
    month: "short",
    year: "numeric",
  });
}

export function formatWeekdayShort(date: Date, locale: AppLocale) {
  return formatCapitalizedDate(date, locale, { weekday: "short" });
}

export function formatWeekdays(
  locale: AppLocale,
  width: "short" | "narrow" = "short",
) {
  const sunday = new Date(2023, 0, 1);
  return Array.from({ length: 7 }, (_, index) =>
    formatCapitalizedDate(
      new Date(
        sunday.getFullYear(),
        sunday.getMonth(),
        sunday.getDate() + index,
      ),
      locale,
      { weekday: width },
    ),
  );
}

export function formatCapitalizedDate(
  date: Date,
  locale: AppLocale,
  options: Intl.DateTimeFormatOptions,
) {
  return new Intl.DateTimeFormat(locale, options)
    .formatToParts(date)
    .map((part) =>
      part.type === "month" || part.type === "weekday"
        ? capitalizeFirst(part.value, locale)
        : part.value,
    )
    .join("");
}

function capitalizeFirst(value: string, locale: AppLocale) {
  const [first = "", ...rest] = Array.from(value);
  return `${first.toLocaleUpperCase(locale)}${rest.join("")}`;
}

export function formatRelativeDay(date: Date, ref: Date, locale: AppLocale) {
  const messages = getMessages(locale);
  const sameDay = (left: Date, right: Date) =>
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate();

  const yesterday = new Date(ref);
  yesterday.setDate(ref.getDate() - 1);

  if (sameDay(date, ref)) return messages.periods.today;
  if (sameDay(date, yesterday)) return messages.periods.yesterday;

  return formatDateShort(date, locale);
}
