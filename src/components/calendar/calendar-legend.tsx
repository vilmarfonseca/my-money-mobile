import { View } from 'react-native';

import { Text } from '@/components/ui/text';
import { useTheme } from '@/theme/theme-provider';

import { dueTypes, useDueTypeLabels } from './calendar-strings';
import { dueTypeColors } from './type-colors';

export function CalendarLegend() {
  const { colors } = useTheme();
  const labels = useDueTypeLabels();

  return (
    <View
      style={{
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 16,
        marginTop: 16,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: colors.line,
      }}>
      {dueTypes.map((type) => (
        <View key={type} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View
            style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: dueTypeColors(type, colors).dot,
            }}
          />
          <Text size="xs" color="ink2">
            {labels[type]}
          </Text>
        </View>
      ))}
    </View>
  );
}
