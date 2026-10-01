import { Search } from 'lucide-react-native';
import { Pressable, ScrollView, View } from 'react-native';

import { Input } from '@/components/ui/input';
import { SCREEN_GUTTER } from '@/components/ui/screen';
import { Text } from '@/components/ui/text';
import type { DueType } from '@/lib/calendar/types';
import { useI18n } from '@/lib/i18n/provider';
import { useTheme } from '@/theme/theme-provider';
import { radius } from '@/theme/tokens';

import { dueTypes, useDueTypeLabels } from './calendar-strings';
import { dueTypeColors } from './type-colors';

export function TypeFilters({
  activeType,
  onTypeChange,
  query,
  onQueryChange,
}: {
  activeType: DueType | 'all';
  onTypeChange: (type: DueType | 'all') => void;
  query: string;
  onQueryChange: (query: string) => void;
}) {
  const { messages } = useI18n();
  const { colors } = useTheme();
  const labels = useDueTypeLabels();
  const idle = { bg: colors.control, border: colors.controlBorder, fg: colors.ink2 };

  return (
    // Chips in one scrolling row with the search under it (Mobile Calendar design).
    <View style={{ gap: 12, marginBottom: 16 }}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        // Bleeds to the screen edges so chips scroll under the page gutter.
        style={{ marginHorizontal: -SCREEN_GUTTER }}
        contentContainerStyle={{ gap: 8, paddingHorizontal: SCREEN_GUTTER }}>
        <FilterChip
          label={messages.calendar.allTypes}
          selected={activeType === 'all'}
          tone={
            activeType === 'all'
              ? { bg: colors.action, border: 'transparent', fg: colors.actionForeground }
              : idle
          }
          onPress={() => onTypeChange('all')}
        />
        {dueTypes.map((type) => {
          const typeColors = dueTypeColors(type, colors);
          return (
            <FilterChip
              key={type}
              dot={typeColors.dot}
              label={labels[type]}
              selected={activeType === type}
              tone={activeType === type ? typeColors.chip : idle}
              onPress={() => onTypeChange(type)}
            />
          );
        })}
      </ScrollView>

      <Input
        value={query}
        onChangeText={onQueryChange}
        placeholder={messages.calendar.searchDueDates}
        accessibilityLabel={messages.calendar.searchDueDates}
        autoCapitalize="none"
        autoCorrect={false}
        clearButtonMode="while-editing"
        returnKeyType="search"
        leading={<Search size={16} color={colors.ink2} />}
        containerStyle={{ borderRadius: radius.xl, backgroundColor: colors.surface1 }}
        style={{ fontSize: 14 }}
      />
    </View>
  );
}

function FilterChip({
  dot,
  label,
  onPress,
  selected,
  tone,
}: {
  dot?: string;
  label: string;
  onPress: () => void;
  selected: boolean;
  tone: { bg: string; border: string; fg: string };
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        height: 36,
        paddingHorizontal: 12,
        borderRadius: radius.pill,
        borderWidth: 1,
        borderColor: tone.border,
        backgroundColor: tone.bg,
      }}>
      {dot ? (
        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: dot }} />
      ) : null}
      <Text font="sansMedium" size="xs" color={tone.fg}>
        {label}
      </Text>
    </Pressable>
  );
}
