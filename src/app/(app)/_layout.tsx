import { type Href, Stack, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { View } from 'react-native';

import { useApiQuery } from '@/api/hooks';
import { PaymentIssueDialog } from '@/components/billing/payment-issue-dialog';
import { BootScreen } from '@/components/boot-screen';
import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { Text } from '@/components/ui/text';
import { I18nProvider, useI18n } from '@/lib/i18n/provider';
import { AppDataProvider } from '@/providers/app-data-provider';
import { useSession } from '@/providers/auth-provider';
import { consumePendingLink } from '@/providers/pending-link';
import { useTheme } from '@/theme/theme-provider';

/**
 * The signed-in shell. It loads what the web layout loads (plan, onboarding
 * state, workspaces, display preferences) before showing anything, then
 * applies the same gates:
 *
 *  - a plan trial that ended unpaid locks the account to the plan picker;
 *  - an account that has not finished onboarding is sent there, unless it is
 *    working inside a household it was invited to.
 */
export default function AppLayout() {
  const { colors, setPreference } = useTheme();
  const router = useRouter();
  const bootstrap = useApiQuery('app.bootstrap', []);
  const data = bootstrap.data;

  // The saved theme wins over whatever this device last used.
  const savedTheme = data?.displayPreferences.theme;
  useEffect(() => {
    if (savedTheme) setPreference(savedTheme);
  }, [savedTheme, setPreference]);

  // A link opened while signed out (a household invite) resumes here, once.
  const ready = Boolean(data) && !data?.entitlements.lockedOut;
  useEffect(() => {
    if (!ready) return;
    const pending = consumePendingLink();
    if (pending) router.push(pending as Href);
  }, [ready, router]);

  if (!data) {
    return bootstrap.isError ? (
      <BootstrapError message={bootstrap.error.message} onRetry={() => bootstrap.refetch()} />
    ) : (
      <BootScreen />
    );
  }

  const locked = data.entitlements.lockedOut;
  const needsOnboarding = !data.onboarding.completed && data.scope.kind !== 'household';

  return (
    <I18nProvider
      locale={data.displayPreferences.locale}
      currency={data.displayPreferences.currency}>
      <AppDataProvider value={data}>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.canvas },
          }}>
          <Stack.Screen name="index" />
          <Stack.Protected guard={!locked && !needsOnboarding}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen
              name="transactions/new"
              options={{ presentation: 'fullScreenModal', animation: 'slide_from_bottom' }}
            />
          </Stack.Protected>
          <Stack.Protected guard={!locked && needsOnboarding}>
            <Stack.Screen name="onboard" options={{ animation: 'fade' }} />
          </Stack.Protected>
          <Stack.Protected guard={!locked}>
            <Stack.Screen name="invite/[token]" />
          </Stack.Protected>
          <Stack.Screen name="subscribe" />
        </Stack>
        <PaymentIssueDialog />
      </AppDataProvider>
    </I18nProvider>
  );
}

/** The shell could not load: say so, and offer the two ways out. */
function BootstrapError({ message, onRetry }: { message: string; onRetry: () => void }) {
  const { locale } = useI18n();
  const { signOut } = useSession();
  const pt = locale === 'pt-BR';

  return (
    <Screen scroll={false} contentStyle={{ flex: 1, justifyContent: 'center', padding: 24 }}>
      <View style={{ gap: 12 }}>
        <Text font="display" size="3xl" tight>
          {pt ? 'Não foi possível carregar' : 'Could not load your account'}
        </Text>
        <Text size="sm" color="ink3">
          {message}
        </Text>
        <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
          <Button label={pt ? 'Tentar de novo' : 'Try again'} onPress={onRetry} />
          <Button variant="outline" label={pt ? 'Sair' : 'Log out'} onPress={() => signOut()} />
        </View>
      </View>
    </Screen>
  );
}
