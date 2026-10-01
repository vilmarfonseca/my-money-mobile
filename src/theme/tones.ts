import { palette, type ColorScheme, type ThemeColors } from '@/theme/tokens';

/*
 * The modules synced from the web app describe colour the way the web paints
 * it: Tailwind class strings ("border-sky-200 bg-sky-50 text-sky-900"), CSS
 * variables ("var(--color-coral-400)") and tone names ("plum", "sage"). This
 * file turns each of those into actual colours for the current theme.
 */

export type ToneColors = { bg: string; border: string; fg: string };

/** Tailwind's default palette, for the families and shades the web app uses. */
const tailwind: Record<string, Record<string, string>> = {
  slate: { 50: '#f8fafc', 100: '#f1f5f9', 200: '#e2e8f0', 300: '#cbd5e1', 900: '#0f172a', 950: '#020617' },
  stone: { 50: '#fafaf9', 100: '#f5f5f4', 200: '#e7e5e4', 300: '#d6d3d1', 900: '#1c1917', 950: '#0c0a09' },
  red: { 50: '#fef2f2', 100: '#fee2e2', 200: '#fecaca', 300: '#fca5a5', 900: '#7f1d1d', 950: '#450a0a' },
  orange: { 50: '#fff7ed', 100: '#ffedd5', 200: '#fed7aa', 300: '#fdba74', 900: '#7c2d12', 950: '#431407' },
  amber: { 50: '#fffbeb', 100: '#fef3c7', 200: '#fde68a', 300: '#fcd34d', 500: '#d49234', 900: '#78350f', 950: '#451a03' },
  yellow: { 50: '#fefce8', 100: '#fef9c3', 200: '#fef08a', 300: '#fde047', 900: '#713f12', 950: '#422006' },
  lime: { 50: '#f7fee7', 100: '#ecfccb', 200: '#d9f99d', 300: '#bef264', 900: '#365314', 950: '#1a2e05' },
  green: { 50: '#f0fdf4', 100: '#dcfce7', 200: '#bbf7d0', 300: '#86efac', 900: '#14532d', 950: '#052e16' },
  emerald: { 50: '#ecfdf5', 100: '#d1fae5', 200: '#a7f3d0', 300: '#6ee7b7', 900: '#064e3b', 950: '#022c22' },
  teal: { 50: '#f0fdfa', 100: '#ccfbf1', 200: '#99f6e4', 300: '#5eead4', 900: '#134e4a', 950: '#042f2e' },
  cyan: { 50: '#ecfeff', 100: '#cffafe', 200: '#a5f3fc', 300: '#67e8f9', 900: '#164e63', 950: '#083344' },
  sky: { 50: '#f0f9ff', 100: '#e0f2fe', 200: '#bae6fd', 300: '#7dd3fc', 900: '#0c4a6e', 950: '#082f49' },
  blue: { 50: '#eff6ff', 100: '#dbeafe', 200: '#bfdbfe', 300: '#93c5fd', 900: '#1e3a8a', 950: '#172554' },
  indigo: { 50: '#eef2ff', 100: '#e0e7ff', 200: '#c7d2fe', 300: '#a5b4fc', 900: '#312e81', 950: '#1e1b4b' },
  violet: { 50: '#f5f3ff', 100: '#ede9fe', 200: '#ddd6fe', 300: '#c4b5fd', 900: '#4c1d95', 950: '#2e1065' },
  purple: { 50: '#faf5ff', 100: '#f3e8ff', 200: '#e9d5ff', 300: '#d8b4fe', 900: '#581c87', 950: '#3b0764' },
  fuchsia: { 50: '#fdf4ff', 100: '#fae8ff', 200: '#f5d0fe', 300: '#f0abfc', 900: '#701a75', 950: '#4a044e' },
  pink: { 50: '#fdf2f8', 100: '#fce7f3', 200: '#fbcfe8', 300: '#f9a8d4', 900: '#831843', 950: '#500724' },
  rose: { 50: '#fff1f2', 100: '#ffe4e6', 200: '#fecdd3', 300: '#fda4af', 900: '#881337', 950: '#4c0519' },
  plum: {
    50: palette.plum50, 100: palette.plum100, 200: palette.plum200, 300: palette.plum300,
    400: palette.plum400, 500: palette.plum500, 600: palette.plum600, 700: palette.plum700,
    800: palette.plum800, 900: palette.plum900,
  },
  coral: {
    50: palette.coral50, 100: palette.coral100, 200: palette.coral200, 300: palette.coral300,
    400: palette.coral400, 500: palette.coral500, 600: palette.coral600,
  },
  sage: { 300: palette.sage300, 500: palette.sage500, 700: palette.sage700 },
  clay: { 300: palette.clay300, 500: palette.clay500, 700: palette.clay700 },
};

/** Semantic utility suffixes (`bg-accent-soft`) and CSS variable names. */
function semantic(name: string, colors: ThemeColors): string | undefined {
  const table: Record<string, string> = {
    canvas: colors.canvas,
    'surface-1': colors.surface1,
    'surface-2': colors.surface2,
    'surface-3': colors.surface3,
    'ink-1': colors.ink1,
    'ink-2': colors.ink2,
    'ink-3': colors.ink3,
    'ink-4': colors.ink4,
    line: colors.line,
    'line-strong': colors.lineStrong,
    'ds-accent': colors.accent,
    accent: colors.accentSoft,
    'accent-soft': colors.accentSoft,
    'accent-soft-fg': colors.accentSoftFg,
    'accent-tint': colors.accentTint,
    warm: colors.warm,
    'warm-soft': colors.warmSoft,
    'warm-soft-fg': colors.warmSoftFg,
    positive: colors.positive,
    'positive-soft': colors.positiveSoft,
    'positive-fg': colors.positiveFg,
    negative: colors.negative,
    'negative-soft': colors.negativeSoft,
    'negative-fg': colors.negativeFg,
    warning: colors.warning,
    'warning-soft': colors.warningSoft,
    'warning-fg': colors.warningFg,
    control: colors.control,
    action: colors.action,
    'action-foreground': colors.actionForeground,
    primary: colors.accent,
    white: '#ffffff',
    black: '#000000',
    transparent: 'transparent',
  };
  return table[name];
}

function lookup(name: string, colors: ThemeColors): string | undefined {
  const known = semantic(name, colors);
  if (known) return known;
  const match = /^([a-z]+)-(\d{2,3})$/.exec(name);
  return match ? tailwind[match[1]]?.[match[2]] : undefined;
}

/**
 * Resolves a colour value coming from the web's data modules: a CSS variable
 * (`var(--color-coral-400)`, `var(--positive)`), a utility colour name
 * (`plum-500`, `ink-3`) or an already concrete colour, returned unchanged.
 */
export function resolveColor(value: string, colors: ThemeColors): string {
  const variable = /^var\(--(?:color-)?([a-z0-9-]+)\)$/.exec(value.trim());
  const name = variable ? variable[1] : value.trim();
  return lookup(name, colors) ?? value;
}

/**
 * Colours of a Tailwind chip class string such as
 * "border-sky-200 bg-sky-50 text-sky-900".
 */
export function classNameColors(className: string, colors: ThemeColors): ToneColors {
  const result: ToneColors = { bg: 'transparent', border: 'transparent', fg: colors.ink1 };
  for (const token of className.split(/\s+/)) {
    // The web's `dark:` variants are handled by the caller choosing a tone.
    if (token.includes(':')) continue;
    const match = /^(bg|border|text)-(.+)$/.exec(token);
    if (!match) continue;
    const color = lookup(match[2], colors);
    if (!color) continue;
    if (match[1] === 'bg') result.bg = color;
    else if (match[1] === 'border') result.border = color;
    else result.fg = color;
  }
  return result;
}

/** `tableToneStyles`: the three tones transaction tables use. */
export function tableTone(tone: 'accent' | 'income' | 'expense', colors: ThemeColors): ToneColors {
  if (tone === 'income') {
    return { bg: colors.positiveSoft, border: colors.positiveSoft, fg: colors.positiveFg };
  }
  if (tone === 'expense') {
    return { bg: colors.warmSoft, border: colors.warmSoft, fg: colors.warmSoftFg };
  }
  return { bg: colors.accentSoft, border: colors.accentSoft, fg: colors.accentSoftFg };
}

/** A category's stored tone name (`plum`, `coral`, `sage`, `amber`, `ink`). */
export function categoryTone(tone: string | null | undefined, colors: ThemeColors): ToneColors | null {
  switch (tone) {
    case 'plum':
      return tableTone('accent', colors);
    case 'coral':
      return tableTone('expense', colors);
    case 'sage':
      return tableTone('income', colors);
    case 'amber':
      return { bg: colors.warningSoft, border: colors.warningSoft, fg: colors.warningFg };
    case 'ink':
      return { bg: colors.surface2, border: colors.lineStrong, fg: colors.ink1 };
    default:
      return null;
  }
}

function hexChannels(hex: string): [number, number, number] {
  const value =
    hex.length === 4 ? `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}` : hex;
  return [
    parseInt(value.slice(1, 3), 16),
    parseInt(value.slice(3, 5), 16),
    parseInt(value.slice(5, 7), 16),
  ];
}

const HEX_COLOR = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i;

/**
 * Colours of a category pill, following the web's rules: a custom hex colour
 * tints the pill; a stored tone uses its palette; otherwise the category's
 * built-in chip classes apply in light mode and the transaction's type tone
 * in dark mode (the pastel chips are illegible on the dark canvas).
 */
export function categoryPillColors({
  color,
  colors,
  fallbackClassName,
  scheme,
  type,
}: {
  /** The category's stored colour: "#rrggbb", a tone name, or nothing. */
  color: string | null | undefined;
  colors: ThemeColors;
  /** `chipClassName` from the expense/income category styles. */
  fallbackClassName: string;
  scheme: ColorScheme;
  /** Tone used for built-in categories in dark mode. */
  type: 'accent' | 'income' | 'expense';
}): ToneColors {
  if (color && HEX_COLOR.test(color)) {
    const [r, g, b] = hexChannels(color);
    return {
      bg: `rgba(${r}, ${g}, ${b}, 0.14)`,
      border: `rgba(${r}, ${g}, ${b}, 0.35)`,
      fg: color,
    };
  }
  return (
    categoryTone(color, colors) ??
    (scheme === 'dark' ? tableTone(type, colors) : classNameColors(fallbackClassName, colors))
  );
}
