import { Sparkles } from 'lucide-react-native';
import { View } from 'react-native';

import { Text } from '@/components/ui/text';
import { useTheme } from '@/theme/theme-provider';
import { radius } from '@/theme/tokens';

/** Section header that floats above its card, as every Settings section does on phones. */
export function SectionHeading({
  badge,
  description,
  eyebrow,
  title,
}: {
  /** Label of the pill on the right (the plan a section belongs to). */
  badge?: string;
  description: string;
  eyebrow: string;
  title: string;
}) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: 12,
        marginBottom: 12,
        paddingHorizontal: 6,
      }}>
      <View style={{ flex: 1 }}>
        <Text font="sansSemiBold" size="2xs" color="accentSoftFg" uppercase tracking={1}>
          {eyebrow}
        </Text>
        <Text font="display" size="2xl" tight style={{ marginTop: 6 }}>
          {title}
        </Text>
        <Text size="xs" color="ink3" style={{ marginTop: 6, lineHeight: 18 }}>
          {description}
        </Text>
      </View>
      {badge ? <PlanBadge label={badge} /> : null}
    </View>
  );
}

function PlanBadge({ label }: { label: string }) {
  const { colors } = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: radius.pill,
        backgroundColor: colors.accentSoft,
      }}>
      <Sparkles size={12} color={colors.accentSoftFg} />
      <Text font="sansSemiBold" size="2xs" color="accentSoftFg" uppercase tracking={0.5}>
        {label}
      </Text>
    </View>
  );
}
