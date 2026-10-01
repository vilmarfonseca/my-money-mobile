import { Inbox } from 'lucide-react-native';
import { View, type StyleProp, type ViewStyle } from 'react-native';

import { Text } from '@/components/ui/text';
import { useI18n } from '@/lib/i18n/provider';
import { useTheme } from '@/theme/theme-provider';
import { radius } from '@/theme/tokens';

/** Dashed "No data" zero state for a card whose records do not exist yet. */
export function CardNoData({ body, style }: { body: string; style?: StyleProp<ViewStyle> }) {
  const { messages } = useI18n();
  const { colors } = useTheme();

  return (
    <View
      style={[
        {
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
          paddingHorizontal: 24,
          paddingVertical: 40,
          borderRadius: radius.lg,
          borderWidth: 1,
          borderStyle: 'dashed',
          borderColor: colors.lineStrong,
        },
        style,
      ]}>
      <Inbox size={20} color={colors.ink4} style={{ marginBottom: 4 }} />
      <Text font="display" size="xl" tight color="ink2">
        {messages.common.noData}
      </Text>
      <Text size="sm" color="ink3" align="center">
        {body}
      </Text>
    </View>
  );
}
