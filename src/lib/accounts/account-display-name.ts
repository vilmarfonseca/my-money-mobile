// Synced from my-money-v2 (src/lib/accounts/account-display-name.ts). Do not edit here: change it
// in the web repo and run `npm run sync:web`.
import type { SavingsLabel } from "@/lib/accounts/accounts-data";
import type { AppLocale } from "@/lib/i18n/config";
import { getMessages } from "@/lib/i18n/messages";

/**
 * Default account rows are stored with an English name — "Nubank Checking",
 * "Nubank Savings", "Nubank Savings 2" — whatever language the user set up
 * the bank in, because the stored name is the value transactions resolve
 * against. This turns that stored name into the user's language for display;
 * a name the user typed themselves (no default suffix) is returned as is.
 */
const defaultSuffix = /^(?:(.*?)\s+)?(Checking|Savings)(?:\s+(\d+))?$/i;

export function localizeAccountName(
  name: string,
  locale: AppLocale,
  savingsLabel: SavingsLabel | null = null,
): string {
  const match = defaultSuffix.exec(name.trim());
  if (!match) return name;

  const [, base, kind, index] = match;
  const messages = getMessages(locale);
  const typeLabel =
    kind.toLowerCase() === "checking"
      ? messages.dashboard.accountTypes.checking
      : locale === "pt-BR" && savingsLabel === "cofrinho"
        ? messages.accountsPage.cofrinho
        : messages.dashboard.accountTypes.savings;
  const localized = base ? `${base} ${typeLabel}` : typeLabel;

  return index ? `${localized} ${index}` : localized;
}
