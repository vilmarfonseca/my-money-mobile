import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';
import { View } from 'react-native';

import { useApiQuery } from '@/api/hooks';
import { useEntitlements } from '@/components/billing/entitlements-provider';
import { OnboardingFlow, useOnboardingFrameStyle } from '@/components/onboarding/onboarding-flow';
import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { Skeleton } from '@/components/ui/skeleton';
import { Text } from '@/components/ui/text';
import { localeCurrency } from '@/lib/i18n/config';
import { I18nProvider, useI18n } from '@/lib/i18n/provider';
import { useBootstrap } from '@/providers/app-data-provider';
import { useSession } from '@/providers/auth-provider';
import { useTheme } from '@/theme/theme-provider';
import { radius, shadows } from '@/theme/tokens';

/**
 * The onboarding route's content: loads the saved progress, then hands it to
 * the flow, which owns it from there (every step writes real rows as it goes,
 * so later refetches of the saved progress are not fed back in).
 */
export function OnboardingScreen() {
  const { locale } = useI18n();
  const { onboarding } = useBootstrap();
  const { features } = useEntitlements();
  // Never served from a previous visit's cache: the flow seeds its state from
  // the first answer it gets.
  const resume = useApiQuery('onboarding.resume', [], { gcTime: 0 });
  const data = resume.data;

  return (
    // A brand-new user's stored currency defaults to USD; during onboarding we
    // transact in the currency of their language (pt-BR: reais, en-US: dollar)
    // and the server persists that choice when they finish.
    <I18nProvider locale={locale} currency={localeCurrency(locale)}>
      {data ? (
        <OnboardingFlow
          hasBankAccounts={onboarding.hasBankAccounts}
          firstName={data.firstName}
          resume={data.resume}
          canCreateHousehold={data.canCreateHousehold}
          canImportCsv={features.csvImportExport}
          initialHousehold={data.initialHousehold}
        />
      ) : resume.isError ? (
        <OnboardingLoadError message={resume.error.message} onRetry={() => resume.refetch()} />
      ) : (
        <OnboardingSkeleton />
      )}
    </I18nProvider>
  );
}

function Frame({ children }: { children: ReactNode }) {
  const { colors } = useTheme();
  const frame = useOnboardingFrameStyle();

  return (
    <Screen scroll={false} contentStyle={frame}>
      <View
        style={{
          flex: 1,
          overflow: 'hidden',
          borderRadius: radius.xl,
          borderWidth: 1,
          borderColor: colors.line,
          backgroundColor: colors.surface1,
          boxShadow: shadows.xl,
        }}>
        {children}
      </View>
    </Screen>
  );
}

function OnboardingSkeleton() {
  return (
    <Frame>
      <LinearGradient colors={['#1d1428', '#2a1e3d']} style={{ height: 84 }} />
      <View style={{ gap: 14, paddingHorizontal: 20, paddingTop: 28 }}>
        <Skeleton width={120} height={28} rounded={radius.pill} />
        <Skeleton width="80%" height={40} />
        <Skeleton height={14} />
        <Skeleton width="70%" height={14} />
        <View style={{ gap: 16, marginTop: 12 }}>
          <Skeleton height={44} />
          <Skeleton height={44} />
          <Skeleton height={44} />
          <Skeleton height={64} rounded={radius.xl} />
        </View>
      </View>
    </Frame>
  );
}

/** The saved progress could not load: say so, and offer the two ways out. */
function OnboardingLoadError({ message, onRetry }: { message: string; onRetry: () => void }) {
  const { locale, messages } = useI18n();
  const { signOut } = useSession();
  const pt = locale === 'pt-BR';

  return (
    <Frame>
      <View style={{ flex: 1, justifyContent: 'center', gap: 12, padding: 24 }}>
        <Text font="display" size="3xl" tight>
          {pt ? 'Não foi possível carregar' : 'Could not load your setup'}
        </Text>
        <Text size="sm" color="ink3">
          {message}
        </Text>
        <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
          <Button label={pt ? 'Tentar de novo' : 'Try again'} onPress={onRetry} />
          <Button variant="outline" label={messages.nav.signOut} onPress={() => signOut()} />
        </View>
      </View>
    </Frame>
  );
}
