import { useRouter } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { useApiAction } from '@/api/hooks';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';

export function AcceptInviteButton({
  label,
  pendingLabel,
  token,
}: {
  label: string;
  pendingLabel: string;
  token: string;
}) {
  const router = useRouter();
  const accept = useApiAction('household.acceptInvitation');
  const [error, setError] = useState<string | null>(null);

  const onPress = async () => {
    setError(null);
    try {
      const result = await accept.run(token);
      if (result.ok) {
        // The web action ends in a redirect; the household is now the active
        // workspace, so the dashboard opens inside it.
        router.replace('/dashboard');
      } else {
        setError(result.message);
      }
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : String(failure));
    }
  };

  return (
    <View style={{ alignItems: 'center', marginTop: 24 }}>
      <Button
        label={accept.pending ? pendingLabel : label}
        loading={accept.pending}
        onPress={onPress}
        style={{ paddingHorizontal: 24 }}
      />
      {error ? (
        <Text accessibilityRole="alert" size="sm" color="negative" align="center" style={{ marginTop: 12 }}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}
