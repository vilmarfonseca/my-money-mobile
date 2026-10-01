import { View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { useI18n } from '@/lib/i18n/provider';

/** An admin page's data failed to load: the reason, and a way to try again. */
export function AdminLoadError({ message, onRetry }: { message: string; onRetry: () => void }) {
  const { locale } = useI18n();

  return (
    <Card>
      <View style={{ alignItems: 'center', gap: 12, paddingVertical: 16 }}>
        <Text size="sm" color="ink3" align="center">
          {message}
        </Text>
        <Button
          variant="outline"
          label={locale === 'pt-BR' ? 'Tentar de novo' : 'Try again'}
          onPress={onRetry}
        />
      </View>
    </Card>
  );
}
