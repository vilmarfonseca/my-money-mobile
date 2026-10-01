import { useHostedAuth } from '@clerk/expo/hosted-auth';
import { ShieldCheck } from 'lucide-react-native';
import { useState } from 'react';
import { View } from 'react-native';

import { LogoMark } from '@/components/brand/logo-mark';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { Screen } from '@/components/ui/screen';
import { Text } from '@/components/ui/text';
import { toast } from '@/components/ui/toast';
import { useI18n } from '@/lib/i18n/provider';
import { markJustSignedUp } from '@/providers/sign-up-flag';
import { useTheme } from '@/theme/theme-provider';

/**
 * Signed-out landing. Sign-in and sign-up run in Clerk's hosted pages, in an
 * in-app browser session: every method enabled for the web app (password,
 * email code, Google, Apple) works here without being rebuilt, and the
 * session comes back to the app when the browser closes.
 */
export default function SignInScreen() {
  const { messages } = useI18n();
  const { colors } = useTheme();
  const { startHostedAuth } = useHostedAuth();
  const [pending, setPending] = useState<'sign-in' | 'sign-up' | null>(null);
  const hero = messages.landing.hero;

  const start = async (mode: 'sign-in' | 'sign-up') => {
    setPending(mode);
    try {
      const { createdSessionId } = await startHostedAuth({ mode });
      // Root layout swaps to the signed-in app as soon as the session lands.
      if (createdSessionId && mode === 'sign-up') markJustSignedUp();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : String(error));
    } finally {
      setPending(null);
    }
  };

  return (
    <Screen
      scroll={false}
      contentStyle={{ flex: 1, justifyContent: 'space-between', padding: 24, paddingBottom: 40 }}>
      <View style={{ flex: 1, justifyContent: 'center', gap: 20 }}>
        <LogoMark size={72} />
        <Chip tone="accent" style={{ marginTop: 8 }}>
          <ShieldCheck size={14} color={colors.accentSoftFg} />
          <Text font="sansMedium" size="xs" color="accentSoftFg">
            {hero.pillBadge}
          </Text>
        </Chip>
        <Text font="display" size="5xl" tight>
          {hero.titleLead}{' '}
          <Text font="displayItalic" size="5xl" tight color="accentSoftFg">
            {hero.titleEmphasis}
          </Text>
        </Text>
        <Text size="base" color="ink2">
          {hero.lede}
        </Text>
      </View>

      <View style={{ gap: 12 }}>
        <Button
          size="xl"
          block
          label={hero.primaryCta}
          loading={pending === 'sign-up'}
          disabled={pending !== null}
          onPress={() => start('sign-up')}
        />
        <Button
          size="xl"
          block
          variant="outline"
          label={messages.landing.nav.logIn}
          loading={pending === 'sign-in'}
          disabled={pending !== null}
          onPress={() => start('sign-in')}
        />
      </View>
    </Screen>
  );
}
