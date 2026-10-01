import { useState } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Line } from 'react-native-svg';

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
  const [length, setLength] = useState(0);

  if (!dashed) {
    return (
      <View
        style={[
          vertical
            ? { width: 1, alignSelf: 'stretch', backgroundColor: colors.line }
            : { height: 1, alignSelf: 'stretch', backgroundColor: colors.line },
          style,
        ]}
      />
    );
  }

  // Drawn as a stroke: a one-sided dashed border does not render on iOS.
  return (
    <View
      onLayout={(event) =>
        setLength(vertical ? event.nativeEvent.layout.height : event.nativeEvent.layout.width)
      }
      style={[vertical ? { width: 1, alignSelf: 'stretch' } : { height: 1, alignSelf: 'stretch' }, style]}>
      {length > 0 ? (
        <Svg width={vertical ? 1 : length} height={vertical ? length : 1}>
          <Line
            x1={vertical ? 0.5 : 0}
            y1={vertical ? 0 : 0.5}
            x2={vertical ? 0.5 : length}
            y2={vertical ? length : 0.5}
            stroke={colors.lineStrong}
            strokeWidth={1}
            strokeDasharray="4 4"
          />
        </Svg>
      ) : null}
    </View>
  );
}
