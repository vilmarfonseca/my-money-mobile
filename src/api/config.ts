import Constants from 'expo-constants';

/**
 * Development only: run against the web app's seeded sample user without a
 * Clerk session. The server must opt in too (`MOBILE_API_SAMPLE_USER=1`), and
 * neither side honours the flag in a production build.
 */
export const devSampleUser = __DEV__ && process.env.EXPO_PUBLIC_DEV_SAMPLE_USER === '1';

/**
 * Where the web app (and with it the API) lives. In development, with nothing
 * configured, it is assumed to run on port 3000 of the machine serving the
 * bundle, which is right for simulators and for a phone on the same network.
 */
function resolveWebUrl(): string {
  const configured = process.env.EXPO_PUBLIC_API_URL?.trim();
  if (configured) return configured.replace(/\/+$/, '');

  if (__DEV__) {
    const host = Constants.expoConfig?.hostUri?.split(':')[0];
    if (host) return `http://${host}:3000`;
  }
  return 'http://localhost:3000';
}

export const webUrl = resolveWebUrl();
