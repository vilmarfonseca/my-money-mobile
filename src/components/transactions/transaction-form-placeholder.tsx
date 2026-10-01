import { View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ModalSheetHeader } from '@/components/ui/modal';
import { Screen } from '@/components/ui/screen';
import { Skeleton, SkeletonCard } from '@/components/ui/skeleton';
import { Text } from '@/components/ui/text';
import { useI18n } from '@/lib/i18n/provider';
import { radius } from '@/theme/tokens';

/**
 * What the transaction form's screen shows before the form can render: its
 * app bar over skeleton cards while the options load, or the error with a
 * retry button when they could not be loaded.
 */
export function TransactionFormPlaceholder({
  error,
  onClose,
  onRetry,
  title,
}: {
  /** The load failed with this message. */
  error?: string | null;
  onClose: () => void;
  onRetry?: () => void;
  title: string;
}) {
  const { locale } = useI18n();

  return (
    <Screen scroll={false}>
      <ModalSheetHeader title={title} onClose={onClose} />
      <View style={{ gap: 12, paddingHorizontal: 16 }}>
        {error ? (
          <Card variant="solid" rounded={radius.md} padding={16} style={{ gap: 12 }}>
            <Text size="sm" color="ink2">
              {error}
            </Text>
            {onRetry ? (
              <Button
                style={{ alignSelf: 'flex-start' }}
                label={locale === 'pt-BR' ? 'Tentar de novo' : 'Try again'}
                onPress={onRetry}
              />
            ) : null}
          </Card>
        ) : (
          <>
            <Skeleton height={48} rounded={radius.pill} />
            <SkeletonCard lines={6} height={28} />
            <SkeletonCard lines={3} height={28} />
          </>
        )}
      </View>
    </Screen>
  );
}
