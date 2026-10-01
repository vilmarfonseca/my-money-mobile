import { Gift } from 'lucide-react-native';
import { useState } from 'react';
import { View } from 'react-native';

import { callApi } from '@/api/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Screen } from '@/components/ui/screen';
import { Text } from '@/components/ui/text';
import { useI18n } from '@/lib/i18n/provider';
import { useTheme } from '@/theme/theme-provider';

/**
 * First screen of a brand-new account: asks once, with a skip, for a
 * friend's invite code, so a code passed by word of mouth still counts.
 */
export function ReferralWelcome({ onContinue }: { onContinue: () => void }) {
  const { messages } = useI18n();
  const { colors } = useTheme();
  const t = messages.referrals.welcome;
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!code.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const result = await callApi('referrals.applyCode', code);
      if (result.ok) {
        onContinue();
        return;
      }
      setError(t.errors[result.reason]);
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : String(failure));
    }
    setBusy(false);
  };

  return (
    <Screen contentStyle={{ flexGrow: 1, justifyContent: 'center', paddingVertical: 40 }}>
      <Card variant="solid" padding={24}>
        <View
          style={{
            width: 44,
            height: 44,
            borderRadius: 22,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: colors.accentSoft,
          }}>
          <Gift size={20} color={colors.accentSoftFg} />
        </View>
        <Text font="display" size="3xl" tight style={{ marginTop: 20 }}>
          {t.title}
        </Text>
        <Text size="sm" color="ink3" style={{ marginTop: 12 }}>
          {t.description}
        </Text>
        <Input
          mono
          autoCapitalize="none"
          autoCorrect={false}
          placeholder={t.placeholder}
          value={code}
          invalid={Boolean(error)}
          onChangeText={setCode}
          onSubmitEditing={submit}
          containerStyle={{ marginTop: 24 }}
        />
        {error ? (
          <Text size="sm" color="negative" style={{ marginTop: 8 }}>
            {error}
          </Text>
        ) : null}
        <View style={{ gap: 8, marginTop: 20 }}>
          <Button
            size="lg"
            block
            label={busy ? t.applying : t.apply}
            loading={busy}
            disabled={!code.trim()}
            onPress={submit}
          />
          <Button size="lg" block variant="outline" label={t.skip} disabled={busy} onPress={onContinue} />
        </View>
      </Card>
    </Screen>
  );
}
