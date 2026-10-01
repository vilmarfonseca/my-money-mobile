import type { LucideIcon } from 'lucide-react-native';
import { View, type StyleProp, type ViewStyle } from 'react-native';

import { Text } from '@/components/ui/text';
import {
  categoryIconSet,
  isHexColor,
  readableTextColor,
} from '@/lib/categories/category-appearance';
import { useTheme } from '@/theme/theme-provider';
import { radius } from '@/theme/tokens';
import type { ToneColors } from '@/theme/tones';

/**
 * The leading icon badge of a transaction row. A custom category colour
 * becomes the badge background; a custom icon (lucide name or emoji) replaces
 * the per-category default.
 */
export function CategoryIconBadge({
  color,
  fallbackIcon: FallbackIcon,
  icon,
  size = 40,
  style,
  tone,
}: {
  /** Stored category colour; hex values become the badge background. */
  color?: string | null;
  /** Icon used when the category has no custom icon. */
  fallbackIcon: LucideIcon;
  /** Stored category icon: curated lucide name or literal emoji. */
  icon?: string | null;
  size?: number;
  style?: StyleProp<ViewStyle>;
  /** Colours applied when the category has no custom hex colour. */
  tone?: ToneColors;
}) {
  const { colors } = useTheme();
  const CustomIcon = icon ? categoryIconSet[icon] : undefined;
  const isEmoji = Boolean(icon) && !CustomIcon;
  const palette: ToneColors = isHexColor(color)
    ? { bg: color, border: color, fg: readableTextColor(color) }
    : (tone ?? { bg: colors.surface2, border: colors.line, fg: colors.ink2 });
  const Icon = CustomIcon ?? FallbackIcon;

  return (
    <View
      style={[
        {
          width: size,
          height: size,
          borderRadius: radius.md,
          borderWidth: 1,
          borderColor: palette.border,
          backgroundColor: palette.bg,
          alignItems: 'center',
          justifyContent: 'center',
        },
        style,
      ]}>
      {isEmoji ? (
        <Text size="lg" tight>
          {icon}
        </Text>
      ) : (
        <Icon size={16} color={palette.fg} strokeWidth={2} />
      )}
    </View>
  );
}

/** Small bordered pill used in transaction rows (category, type, status). */
export function TablePill({
  label,
  size = 'sm',
  tone,
}: {
  label: string;
  /** `sm` is the row pill (20px); `md` the table pill (24px). */
  size?: 'sm' | 'md';
  tone: ToneColors;
}) {
  return (
    <View
      style={{
        alignSelf: 'flex-start',
        height: size === 'sm' ? 20 : 24,
        paddingHorizontal: size === 'sm' ? 8 : 10,
        borderRadius: radius.pill,
        borderWidth: 1,
        borderColor: tone.border,
        backgroundColor: tone.bg,
        justifyContent: 'center',
      }}>
      <Text font="sansSemiBold" size={size === 'sm' ? '2xs' : 'xs'} color={tone.fg} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}
