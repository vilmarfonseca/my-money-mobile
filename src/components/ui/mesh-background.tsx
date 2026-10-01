import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';

import { useTheme } from '@/theme/theme-provider';
import { mesh } from '@/theme/tokens';

/**
 * The app's page background: four soft radial washes over the canvas colour,
 * pinned to the viewport (it does not scroll with the content). Mirrors the
 * web app's `--mesh` gradient, pixel sizes included.
 */
export function MeshBackground() {
  const { colors, scheme } = useTheme();
  const { width, height } = useWindowDimensions();
  const washes = mesh[scheme];

  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: colors.canvas }]}>
      <Svg width={width} height={height}>
        <Defs>
          {washes.map((wash, index) => (
            <RadialGradient
              key={index}
              id={`mesh-${index}`}
              cx={wash.x * width}
              cy={wash.y * height}
              rx={wash.rx}
              ry={wash.ry}
              fx={wash.x * width}
              fy={wash.y * height}
              gradientUnits="userSpaceOnUse">
              <Stop offset={0} stopColor={wash.color} stopOpacity={wash.opacity} />
              <Stop offset={wash.fade} stopColor={wash.color} stopOpacity={0} />
            </RadialGradient>
          ))}
        </Defs>
        {washes.map((_, index) => (
          <Rect key={index} x={0} y={0} width={width} height={height} fill={`url(#mesh-${index})`} />
        ))}
      </Svg>
    </View>
  );
}
