import AsyncStorage from '@react-native-async-storage/async-storage';
import { getLocales } from 'expo-localization';
import { createContext, use, useEffect, useState, type ReactNode } from 'react';

import {
  localeCurrency,
  normalizeLocale,
  supportedLocales,
  type AppLocale,
} from '@/lib/i18n/config';
import { I18nProvider } from '@/lib/i18n/provider';

const STORAGE_KEY = 'mymoney-locale';

/** The device's language, when the app speaks it. */
const deviceLocale = normalizeLocale(
  getLocales()[0]?.languageTag?.startsWith('pt') ? 'pt-BR' : 'en-US',
);

type SignedOutLocaleValue = {
  locale: AppLocale;
  /** Picked with the switcher (kept on the device); null follows the device. */
  chosen: AppLocale | null;
  setLocale: (locale: AppLocale) => void;
};

const SignedOutLocaleContext = createContext<SignedOutLocaleValue>({
  locale: deviceLocale,
  chosen: null,
  setLocale: () => {},
});

/**
 * Language of the signed-out screens: the one picked with the switcher, else
 * the device's. Once signed in, the account's saved language takes over (the
 * shell sets its own `I18nProvider`).
 */
export function SignedOutLocaleProvider({ children }: { children: ReactNode }) {
  const [chosen, setChosen] = useState<AppLocale | null>(null);

  useEffect(() => {
    let cancelled = false;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((stored) => {
        const saved = supportedLocales.find((locale) => locale === stored);
        if (!cancelled && saved) setChosen(saved);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const setLocale = (next: AppLocale) => {
    setChosen(next);
    AsyncStorage.setItem(STORAGE_KEY, next).catch(() => {});
  };

  const locale = chosen ?? deviceLocale;

  return (
    <SignedOutLocaleContext value={{ locale, chosen, setLocale }}>
      <I18nProvider locale={locale} currency={localeCurrency(locale)}>
        {children}
      </I18nProvider>
    </SignedOutLocaleContext>
  );
}

export function useSignedOutLocale() {
  return use(SignedOutLocaleContext);
}
