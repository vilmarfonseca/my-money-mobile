import { Text as RNText, type TextProps as RNTextProps, type TextStyle } from 'react-native';

import { useTheme } from '@/theme/theme-provider';
import {
  fontSizes,
  fonts,
  lineHeights,
  type ColorToken,
  type FontSizeToken,
  type FontToken,
} from '@/theme/tokens';

export type TextProps = RNTextProps & {
  /** Face: `sans*` for body, `mono*` for numbers, `display*` for serif headings. */
  font?: FontToken;
  /** Tailwind type-scale step, or a pixel size. */
  size?: FontSizeToken | number;
  /** Theme color token, or any color string. */
  color?: ColorToken | (string & {});
  align?: TextStyle['textAlign'];
  /** Letter spacing in px (Tailwind `tracking-widest` is ~0.1em). */
  tracking?: number;
  uppercase?: boolean;
  /** `leading-none`: line height equal to the font size, for display numbers. */
  tight?: boolean;
};

/**
 * The app's only text primitive. React Native text does not inherit, so every
 * string goes through this to get the Geist face and ink colour by default.
 */
export function Text({
  font = 'sans',
  size = 'sm',
  color = 'ink1',
  align,
  tracking,
  uppercase,
  tight,
  style,
  ...props
}: TextProps) {
  const { colors } = useTheme();
  const fontSize = typeof size === 'number' ? size : fontSizes[size];
  const lineHeight = tight
    ? Math.round(fontSize * 1.08)
    : typeof size === 'number'
      ? Math.round(size * 1.4)
      : lineHeights[size];

  return (
    <RNText
      {...props}
      style={[
        {
          color: color in colors ? colors[color as ColorToken] : color,
          fontFamily: fonts[font],
          fontSize,
          lineHeight,
          textAlign: align,
          letterSpacing: tracking,
          textTransform: uppercase ? 'uppercase' : undefined,
        },
        mono(font) && { fontVariant: ['tabular-nums'] },
        style,
      ]}
    />
  );
}

function mono(font: FontToken) {
  return font === 'mono' || font === 'monoMedium' || font === 'monoSemiBold';
}

/** Section eyebrow: small uppercase label in muted ink (`h4` on the web). */
export function Eyebrow({ size = 'xs', ...props }: TextProps) {
  return (
    <Text font="sansSemiBold" size={size} color="ink3" uppercase tracking={1.2} {...props} />
  );
}
