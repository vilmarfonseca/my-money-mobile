/**
 * Design tokens, ported from the web app's `src/styles/globals.css` (which in
 * turn maps `designs/design/colors_and_type.css`). Names match the Tailwind
 * utilities the web components use: `bg-surface-1` is `colors.surface1`,
 * `text-ink-3` is `colors.ink3`, `rounded-xl` is `radius.xl`.
 */

/** Static palette: identical in both themes. */
export const palette = {
  plum50: '#f5f0ff',
  plum100: '#ebe1ff',
  plum200: '#d6c2ff',
  plum300: '#b89dff',
  plum400: '#9774f0',
  plum500: '#7c3aed',
  plum600: '#6d28d9',
  plum700: '#5b21b6',
  plum800: '#3f1879',
  plum900: '#25104d',

  coral50: '#fff1f4',
  coral100: '#ffe1e8',
  coral200: '#ffc4d2',
  coral300: '#ff9bb8',
  coral400: '#ff7a9e',
  coral500: '#f04e7a',
  coral600: '#d23864',

  sage300: '#a8d4ba',
  sage500: '#5fa377',
  sage700: '#3a7a52',

  clay300: '#f4a8a8',
  clay500: '#d04848',
  clay700: '#a02e2e',

  amber500: '#d49234',

  white: '#ffffff',
  black: '#000000',
} as const;

const light = {
  canvas: '#faf7f2',
  surface1: '#ffffff',
  surface2: '#f3eee6',
  surface3: '#e9e2d6',

  ink1: '#1a1424',
  ink2: '#4a4458',
  ink3: '#7a7488',
  ink4: '#b8b1c0',

  line: 'rgba(20, 10, 40, 0.08)',
  lineStrong: 'rgba(20, 10, 40, 0.14)',

  accent: '#7c3aed',
  accentHover: '#6d28d9',
  accentFg: '#ffffff',
  accentSoft: '#ebe1ff',
  accentSoftHover: '#e0d0ff',
  accentSoftFg: '#5b21b6',
  accentTint: '#f5f0ff',

  warm: '#ff7a9e',
  warmSoft: '#ffe1e8',
  warmSoftFg: '#d23864',

  positive: '#5fa377',
  positiveSoft: '#e3f1e7',
  positiveFg: '#3a7a52',

  negative: '#d04848',
  negativeSoft: '#fbe8e8',
  negativeFg: '#a02e2e',

  warning: '#d49234',
  warningSoft: 'rgba(212, 146, 52, 0.15)',
  warningFg: '#8a5a18',

  scrim: 'rgba(20, 10, 40, 0.22)',

  glassBg: 'rgba(255, 255, 255, 0.55)',
  glassBorder: 'rgba(255, 255, 255, 0.7)',
  /** Fixed chrome: the tab bar and sheet footers. */
  bar: 'rgba(255, 255, 255, 0.94)',

  control: 'rgba(255, 255, 255, 0.5)',
  controlHover: 'rgba(255, 255, 255, 0.75)',
  controlBorder: 'rgba(20, 10, 40, 0.14)',
  action: '#1a1424',
  actionHover: '#2c2236',
  actionForeground: '#ffffff',
};

export type ThemeColors = typeof light;
export type ColorToken = keyof ThemeColors;

const dark: ThemeColors = {
  canvas: '#15101e',
  surface1: '#1d1729',
  surface2: '#251e35',
  surface3: '#2e2641',

  ink1: '#f4ede2',
  ink2: '#c4bdb2',
  ink3: '#8a8392',
  ink4: '#5a5468',

  line: 'rgba(255, 255, 255, 0.08)',
  lineStrong: 'rgba(255, 255, 255, 0.14)',

  accent: '#5b21b6',
  accentHover: '#4c1d95',
  accentFg: '#ffffff',
  accentSoft: 'rgba(184, 157, 255, 0.15)',
  accentSoftHover: 'rgba(184, 157, 255, 0.22)',
  accentSoftFg: '#d6c2ff',
  accentTint: 'rgba(184, 157, 255, 0.08)',

  warm: '#ff9bb8',
  warmSoft: 'rgba(255, 155, 184, 0.12)',
  warmSoftFg: '#ffc4d2',

  positive: '#a8d4ba',
  positiveSoft: 'rgba(168, 212, 186, 0.12)',
  positiveFg: '#a8d4ba',

  negative: '#f4a8a8',
  negativeSoft: 'rgba(244, 168, 168, 0.12)',
  negativeFg: '#f4a8a8',

  warning: '#d49234',
  warningSoft: 'rgba(212, 146, 52, 0.16)',
  warningFg: '#f2c27b',

  scrim: 'rgba(0, 0, 0, 0.55)',

  glassBg: 'rgba(10, 6, 18, 0.4)',
  glassBorder: 'rgba(255, 255, 255, 0.08)',
  bar: 'rgba(20, 14, 30, 0.96)',

  control: 'rgba(255, 255, 255, 0.06)',
  controlHover: 'rgba(255, 255, 255, 0.1)',
  controlBorder: 'rgba(255, 255, 255, 0.14)',
  action: '#5b21b6',
  actionHover: '#4c1d95',
  actionForeground: '#ffffff',
};

export const themes = { light, dark } as const;
export type ColorScheme = keyof typeof themes;

/** Mesh background: the four radial washes over the canvas, per theme. */
export const mesh = {
  light: [
    { color: '#f0d9ff', opacity: 1, rx: 800, ry: 600, x: 0.12, y: 0.1, fade: 0.6 },
    { color: '#ffd4e1', opacity: 1, rx: 700, ry: 500, x: 0.92, y: 0.18, fade: 0.55 },
    { color: '#e8e0ff', opacity: 1, rx: 900, ry: 700, x: 0.7, y: 0.95, fade: 0.6 },
    { color: '#fff0d9', opacity: 1, rx: 600, ry: 500, x: 0.05, y: 0.85, fade: 0.55 },
  ],
  dark: [
    { color: '#7c3aed', opacity: 0.35, rx: 800, ry: 600, x: 0.12, y: 0.1, fade: 0.6 },
    { color: '#f04e7a', opacity: 0.25, rx: 700, ry: 500, x: 0.92, y: 0.18, fade: 0.55 },
    { color: '#4a2699', opacity: 0.45, rx: 900, ry: 700, x: 0.7, y: 0.95, fade: 0.6 },
    { color: '#d49234', opacity: 0.12, rx: 600, ry: 500, x: 0.05, y: 0.85, fade: 0.55 },
  ],
} as const;

/**
 * Font families as registered in the root layout. React Native picks a face
 * by family name alone, so each weight is its own family.
 */
export const fonts = {
  sans: 'Geist-Regular',
  sansMedium: 'Geist-Medium',
  sansSemiBold: 'Geist-SemiBold',
  mono: 'GeistMono-Regular',
  monoMedium: 'GeistMono-Medium',
  monoSemiBold: 'GeistMono-SemiBold',
  display: 'InstrumentSerif-Regular',
  displayItalic: 'InstrumentSerif-Italic',
} as const;
export type FontToken = keyof typeof fonts;

/** Tailwind's type scale plus the web app's `text-2xs`. */
export const fontSizes = {
  '2xs': 10,
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 30,
  '4xl': 36,
  '5xl': 48,
  '6xl': 60,
} as const;
export type FontSizeToken = keyof typeof fontSizes;

export const lineHeights: Record<FontSizeToken, number> = {
  '2xs': 14,
  xs: 16,
  sm: 20,
  base: 24,
  lg: 28,
  xl: 28,
  '2xl': 32,
  '3xl': 36,
  '4xl': 40,
  '5xl': 48,
  '6xl': 60,
};

/** `rounded-*`: the base card radius is 20px. */
export const radius = {
  xs: 4,
  bar: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 28,
  '2xl': 36,
  pill: 999,
} as const;

/** Tailwind spacing steps (1 = 4px). */
export const space = (step: number) => step * 4;

export const shadows = {
  sm: '0 1px 2px rgba(20, 10, 40, 0.06)',
  md: '0 4px 12px -2px rgba(20, 10, 40, 0.08)',
  lg: '0 12px 32px -8px rgba(20, 10, 40, 0.14)',
  xl: '0 28px 60px -16px rgba(20, 10, 40, 0.22)',
  card: '0 18px 40px -16px rgba(45, 20, 80, 0.22), 0 4px 12px -4px rgba(45, 20, 80, 0.08)',
  glass: '0 12px 32px -12px rgba(45, 20, 80, 0.18)',
  glassDark: '0 16px 40px -12px rgba(0, 0, 0, 0.5)',
  avatar: '0 6px 20px -6px #7c3aed',
} as const;

export const durations = { fast: 120, base: 220, slow: 400 } as const;

/** Credit card faces and the brand gradients (`bar-gradient`, `avatar-gradient`). */
export const gradients = {
  bar: ['#7c3aed', '#ff7a9e'],
  avatar: ['#7c3aed', '#ff7a9e'],
  cardPlum: ['#4a1d8a', '#7c3aed', '#b89dff'],
  cardCoral: ['#6f1f3f', '#d23864', '#ff9bb8'],
  cardInk: ['#15101e', '#2e2641', '#4a4458'],
} as const;
