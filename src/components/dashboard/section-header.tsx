import { ChevronRight } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { useTheme } from '@/theme/theme-provider';

/**
 * Heading of a dashboard section. On phones it sits outside the card, with the
 * section's action on the right (Mobile Dashboard design).
 */
export function SectionHeader({ action, title }: { action?: ReactNode; title: string }) {
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
      <Text font="display" size="2xl" tight style={{ flexShrink: 1 }} numberOfLines={1}>
        {title}
      </Text>
      {action}
    </View>
  );
}

/**
 * The compact pill that opens the section's page. `filled` is the treatment
 * for a section with nothing in it, where the link is the only thing to do.
 */
export function SectionLink({
  filled,
  label,
  onPress,
}: {
  filled?: boolean;
  label: string;
  onPress: () => void;
}) {
  const { colors } = useTheme();

  if (filled) {
    return (
      <Button
        size="sm"
        label={label}
        iconRight={(props) => <ChevronRight {...props} />}
        onPress={onPress}
        style={{ gap: 4 }}
      />
    );
  }

  return (
    <Button
      size="sm"
      variant="outline"
      accessibilityLabel={label}
      onPress={onPress}
      style={{ gap: 4, backgroundColor: colors.surface1, borderColor: colors.lineStrong }}>
      <Text font="sansMedium" size="xs" color="accentSoftFg" numberOfLines={1}>
        {label}
      </Text>
      <ChevronRight size={14} color={colors.accentSoftFg} />
    </Button>
  );
}
