import {
  GeistMono_400Regular,
  GeistMono_500Medium,
  GeistMono_600SemiBold,
} from '@expo-google-fonts/geist-mono';
import { useFonts } from 'expo-font';
import { getLocales } from 'expo-localization';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { BootScreen } from '@/components/boot-screen';
import { ToastViewport } from '@/components/ui/toast';
import { localeCurrency, normalizeLocale } from '@/lib/i18n/config';
import { I18nProvider } from '@/lib/i18n/provider';
import { AuthProvider, useSession } from '@/providers/auth-provider';
import { QueryProvider } from '@/providers/query-provider';
import { ThemeProvider, useTheme } from '@/theme/theme-provider';

SplashScreen.preventAutoHideAsync();

/** Language of the signed-out screens: the device's, when the app speaks it. */
const deviceLocale = normalizeLocale(getLocales()[0]?.languageTag?.startsWith('pt') ? 'pt-BR' : 'en-US');

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    'Geist-Regular': require('@/assets/fonts/Geist-Regular.ttf'),
    'Geist-Medium': require('@/assets/fonts/Geist-Medium.ttf'),
    'Geist-SemiBold': require('@/assets/fonts/Geist-SemiBold.ttf'),
    'InstrumentSerif-Regular': require('@/assets/fonts/InstrumentSerif-Regular.ttf'),
    'InstrumentSerif-Italic': require('@/assets/fonts/InstrumentSerif-Italic.ttf'),
    'GeistMono-Regular': GeistMono_400Regular,
    'GeistMono-Medium': GeistMono_500Medium,
    'GeistMono-SemiBold': GeistMono_600SemiBold,
  });
  const fontsReady = fontsLoaded || Boolean(fontError);

  if (!fontsReady) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <QueryProvider>
            <AuthProvider>
              <I18nProvider locale={deviceLocale} currency={localeCurrency(deviceLocale)}>
                <RootNavigator />
                <ToastViewport />
              </I18nProvider>
            </AuthProvider>
          </QueryProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

function RootNavigator() {
  const { isLoaded, isSignedIn } = useSession();
  const { colors, scheme } = useTheme();

  // The boot screen below repeats the native splash, so handing over as soon
  // as there is something to draw is seamless.
  useEffect(() => {
    SplashScreen.hide();
  }, []);

  return (
    <>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      {isLoaded ? (
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.canvas },
          }}>
          <Stack.Protected guard={isSignedIn}>
            <Stack.Screen name="(app)" />
          </Stack.Protected>
          <Stack.Protected guard={!isSignedIn}>
            <Stack.Screen name="(auth)" options={{ animation: 'fade' }} />
          </Stack.Protected>
        </Stack>
      ) : (
        <BootScreen />
      )}
    </>
  );
}
