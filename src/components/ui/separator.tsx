import { View, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme } from '@/theme/theme-provider';

/** Hairline divider (`border-t border-line`); `dashed` for `border-dashed`. */
export function Separator({
  dashed,
  style,
  vertical,
}: {
  dashed?: boolean;
  style?: StyleProp<ViewStyle>;
  vertical?: boolean;
}) {
  const { colors } = useTheme();
  return (
    <View
      style={[
        vertical
          ? { width: 1, alignSelf: 'stretch', backgroundColor: dashed ? undefined : colors.line }
          : { height: 1, alignSelf: 'stretch', backgroundColor: dashed ? undefined : colors.line },
        dashed && {
          borderColor: colors.lineStrong,
          borderStyle: 'dashed',
          ...(vertical ? { borderLeftWidth: 1 } : { borderTopWidth: 1 }),
        },
        style,
      ]}
    />
  );
}
