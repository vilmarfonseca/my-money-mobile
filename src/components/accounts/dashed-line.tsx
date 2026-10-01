import type { StyleProp, ViewStyle } from 'react-native';
import Svg, { Line } from 'react-native-svg';

import { useTheme } from '@/theme/theme-provider';

/**
 * `border-t border-dashed border-line-strong`. Drawn as an SVG stroke because
 * a dashed border on a single side of a view is not reliable across platforms.
 */
export function DashedLine({ style }: { style?: StyleProp<ViewStyle> }) {
  const { colors } = useTheme();

  return (
    <Svg width="100%" height={1} style={style}>
      <Line
        x1="0"
        y1="0.5"
        x2="100%"
        y2="0.5"
        stroke={colors.lineStrong}
        strokeWidth={1}
        strokeDasharray="4 3"
      />
    </Svg>
  );
}
