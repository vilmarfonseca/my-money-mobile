// Synced from my-money-v2 (src/lib/i18n/config.ts). Do not edit here: change it
// in the web repo and run `npm run sync:web`.
export const supportedLocales = ["pt-BR", "en-US"] as const;

export type AppLocale = (typeof supportedLocales)[number];

export const defaultLocale: AppLocale = "pt-BR";

export const localeCookieName = "mymoney_locale";

const localeAliases: Record<string, AppLocale> = {
  en: "en-US",
  "en-us": "en-US",
  "pt-br": "pt-BR",
  pt: "pt-BR",
};

export function normalizeLocale(value: string | null | undefined): AppLocale {
  if (!value) {
    return defaultLocale;
  }

  return localeAliases[value.toLowerCase()] ?? defaultLocale;
}

export function localeToLanguageTag(locale: AppLocale) {
  return locale;
}

/** The currency a locale transacts in: pt-BR → reais, en-US → dollars. */
const localeCurrencies: Record<AppLocale, string> = {
  "en-US": "USD",
  "pt-BR": "BRL",
};

export function localeCurrency(locale: AppLocale): string {
  return localeCurrencies[locale] ?? "USD";
}
