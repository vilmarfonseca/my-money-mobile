import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, use, useEffect, useState, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';

import { themes, type ColorScheme, type ThemeColors } from '@/theme/tokens';

export type ThemePreference = 'light' | 'dark' | 'system';

type ThemeContextValue = {
  colors: ThemeColors;
  /** The scheme actually on screen. */
  scheme: ColorScheme;
  /** What the user chose in Settings. */
  preference: ThemePreference;
  setPreference: (preference: ThemePreference) => void;
};

const STORAGE_KEY = 'mymoney-theme';

const ThemeContext = createContext<ThemeContextValue>({
  colors: themes.light,
  scheme: 'light',
  preference: 'light',
  setPreference: () => {},
});

function isPreference(value: unknown): value is ThemePreference {
  return value === 'light' || value === 'dark' || value === 'system';
}

/**
 * Same rules as the web app: only an explicit "system" choice follows the OS,
 * and no stored choice is light. The choice is kept on the device so the first
 * frame is already right; once the account loads, its saved preference wins
 * (see `ThemePreferenceSync`).
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const system = useColorScheme();
  const [preference, setPreferenceState] = useState<ThemePreference>('light');

  useEffect(() => {
    let cancelled = false;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((stored) => {
        if (!cancelled && isPreference(stored)) setPreferenceState(stored);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const setPreference = (next: ThemePreference) => {
    setPreferenceState(next);
    AsyncStorage.setItem(STORAGE_KEY, next).catch(() => {});
  };

  const scheme: ColorScheme =
    preference === 'system' ? (system === 'dark' ? 'dark' : 'light') : preference;

  return (
    <ThemeContext value={{ colors: themes[scheme], scheme, preference, setPreference }}>
      {children}
    </ThemeContext>
  );
}

export function useTheme() {
  return use(ThemeContext);
}
