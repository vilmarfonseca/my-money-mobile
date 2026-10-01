import { useLocalSearchParams, useRouter } from 'expo-router';
import { View } from 'react-native';

import { usePullToRefresh, useScreenQuery } from '@/api/hooks';
import { AcceptInviteButton } from '@/components/household/accept-invite-button';
import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { Skeleton } from '@/components/ui/skeleton';
import { Text } from '@/components/ui/text';
import { useI18n } from '@/lib/i18n/provider';
import { useTheme } from '@/theme/theme-provider';
import { shadows } from '@/theme/tokens';

/** Landing page of a household invite link: says who invited you and lets you join. */
export default function InviteScreen() {
  const { locale, messages } = useI18n();
  const { colors } = useTheme();
  const router = useRouter();
  const { token } = useLocalSearchParams<{ token: string }>();
  const query = useScreenQuery('household.invitePreview', [token]);
  const { onRefresh, refreshing } = usePullToRefresh(query);
  const preview = query.data;

  const errorCopy = !preview
    ? null
    : preview.state === 'invalid'
      ? messages.household.inviteInvalid
      : preview.state === 'expired'
        ? messages.household.inviteExpired
        : preview.state === 'revoked'
          ? messages.household.inviteRevoked
          : preview.state === 'accepted'
            ? messages.household.inviteAlreadyAccepted
            : preview.state === 'wrongEmail'
              ? messages.household.inviteWrongEmail(preview.email)
              : null;

  return (
    <Screen
      onRefresh={onRefresh}
      refreshing={refreshing}
      contentStyle={{ flexGrow: 1, justifyContent: 'center', paddingVertical: 40 }}>
      <View
        style={{
          alignItems: 'center',
          padding: 32,
          borderRadius: 24,
          borderWidth: 1,
          borderColor: colors.line,
          backgroundColor: colors.surface1,
          boxShadow: shadows.lg,
        }}>
        <Text font="sansSemiBold" size="xs" color="ink3" uppercase tracking={1.2} align="center">
          {messages.household.eyebrow}
        </Text>
        <Text font="displayItalic" size="3xl" align="center" style={{ marginTop: 8 }}>
          {messages.household.invitePageTitle}
        </Text>

        {!preview ? (
          query.isError ? (
            <>
              <Text size="sm" color="ink3" align="center" style={{ marginTop: 16 }}>
                {query.error.message}
              </Text>
              <Button
                variant="outline"
                label={locale === 'pt-BR' ? 'Tentar de novo' : 'Try again'}
                loading={query.isFetching}
                onPress={() => query.refetch()}
                style={{ marginTop: 24, paddingHorizontal: 24 }}
              />
            </>
          ) : (
            <View style={{ alignItems: 'center', alignSelf: 'stretch', gap: 8, marginTop: 20 }}>
              <Skeleton height={14} />
              <Skeleton height={14} width="70%" />
              <Skeleton height={40} width={160} rounded={20} style={{ marginTop: 16 }} />
            </View>
          )
        ) : preview.state === 'ready' ? (
          <>
            <Text size="sm" color="ink3" align="center" style={{ marginTop: 16, lineHeight: 21 }}>
              {messages.household.joinPrompt(preview.inviterName, preview.householdName)}
            </Text>
            <AcceptInviteButton
              token={preview.token}
              label={messages.household.acceptInvite}
              pendingLabel={messages.household.accepting}
            />
          </>
        ) : (
          <>
            <Text size="sm" color="ink3" align="center" style={{ marginTop: 16, lineHeight: 21 }}>
              {errorCopy}
            </Text>
            <Button
              label={messages.household.goToDashboard}
              onPress={() => router.replace('/dashboard')}
              style={{ marginTop: 24, paddingHorizontal: 24 }}
            />
          </>
        )}
      </View>
    </Screen>
  );
}
