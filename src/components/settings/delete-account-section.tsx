import { TriangleAlert } from 'lucide-react-native';
import { View } from 'react-native';

import { DeleteAccountDialog } from '@/components/billing/delete-account-dialog';
import { withAlpha } from '@/components/settings/action-result';
import { Card } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { useI18n } from '@/lib/i18n/provider';
import { useTheme } from '@/theme/theme-provider';
import { radius } from '@/theme/tokens';

/**
 * Settings → bottom of the page: the one irreversible action, kept apart from
 * everything else in its own red-tinted card so it cannot be hit by accident
 * while managing billing or preferences.
 */
export function DeleteAccountSection() {
  const { messages } = useI18n();
  const { colors } = useTheme();
  const t = messages.billing.deleteAccount;

  return (
    <Card
      variant="solid"
      rounded={radius.xl}
      style={{ gap: 20, borderColor: withAlpha(colors.negative, 0.3) }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 16 }}>
        <View
          style={{
            width: 44,
            height: 44,
            borderRadius: 22,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: colors.negativeSoft,
          }}>
          <TriangleAlert size={20} color={colors.negativeFg} />
        </View>
        <View style={{ flex: 1 }}>
          <Text font="sansMedium" size="xs" color="negativeFg" uppercase tracking={1.2}>
            {t.section.eyebrow}
          </Text>
          <Text font="display" size="2xl" tight style={{ marginTop: 4 }}>
            {t.section.title}
          </Text>
          <Text size="sm" color="ink3" style={{ marginTop: 8, lineHeight: 21 }}>
            {t.section.description}
          </Text>
        </View>
      </View>
      <DeleteAccountDialog messages={t} />
    </Card>
  );
}
