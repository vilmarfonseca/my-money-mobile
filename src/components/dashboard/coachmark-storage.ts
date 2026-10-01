import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Device-side memory of a retired coachmark, alongside the preference flag on
 * the account (the native counterpart of the web's
 * `src/lib/onboarding/coachmark-storage.ts`, same key).
 *
 * The flag alone is not enough: the dashboard keeps showing the data it last
 * loaded until the next fetch lands, and a request that never reached the
 * server would bring the tip back. Checking this first keeps a spent tip spent.
 */
export const FIRST_TRANSACTION_TIP_STORAGE_KEY = 'my-money.first-transaction-tip-dismissed';

export async function wasCoachmarkDismissed(key: string): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(key)) === '1';
  } catch {
    // Storage unavailable: fall back to the account flag.
    return false;
  }
}

export async function rememberCoachmarkDismissed(key: string): Promise<void> {
  try {
    await AsyncStorage.setItem(key, '1');
  } catch {
    // Nothing to do: the account flag is still written by the API call.
  }
}
