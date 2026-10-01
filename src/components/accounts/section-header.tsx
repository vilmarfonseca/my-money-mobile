import { View } from 'react-native';

import { Text } from '@/components/ui/text';
import { useTheme } from '@/theme/theme-provider';
import { radius } from '@/theme/tokens';

/**
 * A section title floating above its card, with the web's phone "pill" on the
 * right (the allocation total, the scope label).
 */
export function SectionHeader({ pill, title }: { pill?: string; title: string }) {
  const { colors } = useTheme();

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16,
        marginBottom: 12,
        paddingHorizontal: 6,
      }}>
      <Text accessibilityRole="header" font="display" size="2xl" tight style={{ flexShrink: 1 }}>
        {title}
      </Text>
      {pill ? (
        <View
          style={{
            flexShrink: 1,
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: radius.pill,
            borderWidth: 1,
            borderColor: colors.lineStrong,
            backgroundColor: colors.surface1,
          }}>
          <Text font="sansMedium" size="xs" color="accentSoftFg" numberOfLines={2}>
            {pill}
          </Text>
        </View>
      ) : null}
    </View>
  );
}
