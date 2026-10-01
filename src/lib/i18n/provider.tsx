import { createContext, use, type ReactNode } from 'react';

import type { AppLocale } from '@/lib/i18n/config';
import { defaultLocale } from '@/lib/i18n/config';
import {
  formatCurrency as formatCurrencyValue,
  formatSignedCurrency as signedCurrency,
  splitCurrencyParts as splitParts,
} from '@/lib/i18n/format';
import { getMessages, type Messages } from '@/lib/i18n/messages';

/*
 * The native counterpart of the web app's `src/lib/i18n/provider.tsx`: same
 * `useI18n()` contract, so ported components read messages and format money
 * exactly as they do on the web. This file belongs to this repo (the sync
 * script skips it).
 */

const defaultCurrency = 'USD';

type I18nContextValue = {
  currency: string;
  formatCurrency: (value: number) => string;
  formatSignedCurrency: (value: number) => string;
  locale: AppLocale;
  messages: Messages;
  splitCurrencyParts: (value: number) => {
    cents: string;
    decimal: string;
    whole: string;
  };
};

function buildValue(locale: AppLocale, currency: string): I18nContextValue {
  return {
    currency,
    locale,
    messages: getMessages(locale),
    formatCurrency: (value) => formatCurrencyValue(value, locale, { currency }),
    formatSignedCurrency: (value) => signedCurrency(value, locale, currency),
    splitCurrencyParts: (value) => splitParts(value, locale, currency),
  };
}

const I18nContext = createContext<I18nContextValue>(buildValue(defaultLocale, defaultCurrency));

export function I18nProvider({
  children,
  currency = defaultCurrency,
  locale,
}: {
  children: ReactNode;
  currency?: string;
  locale: AppLocale;
}) {
  return <I18nContext value={buildValue(locale, currency)}>{children}</I18nContext>;
}

export function useI18n() {
  return use(I18nContext);
}
