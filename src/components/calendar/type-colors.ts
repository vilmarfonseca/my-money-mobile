import { typeStyles } from '@/lib/calendar/calendar-style';
import type { DueType } from '@/lib/calendar/types';
import { resolveColor } from '@/theme/tones';
import type { ThemeColors } from '@/theme/tokens';

/** Applies a Tailwind opacity modifier (`bg-warning/10`) to a concrete colour. */
export function withAlpha(color: string, alpha: number): string {
  const hex = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(color);
  if (hex) {
    const value =
      hex[1].length === 3
        ? hex[1]
            .split('')
            .map((channel) => channel + channel)
            .join('')
        : hex[1];
    const r = parseInt(value.slice(0, 2), 16);
    const g = parseInt(value.slice(2, 4), 16);
    const b = parseInt(value.slice(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  const rgb = /^rgba?\(([^)]+)\)$/.exec(color);
  if (rgb) {
    const [r, g, b, a = '1'] = rgb[1].split(',').map((part) => part.trim());
    return `rgba(${r}, ${g}, ${b}, ${Number(a) * alpha})`;
  }
  return color;
}

type Tone = { bg: string; border: string; fg: string };

/**
 * Colours of one of `typeStyles`' class strings. `classNameColors` does not
 * understand the `/30` opacity modifiers these use, hence the local parser.
 */
function classColors(className: string, colors: ThemeColors): Tone {
  const tone: Tone = { bg: 'transparent', border: 'transparent', fg: colors.ink1 };
  for (const token of className.split(/\s+/)) {
    const match = /^(bg|border|text)-([a-z0-9-]+)(?:\/(\d+))?$/.exec(token);
    if (!match) continue;
    const resolved = resolveColor(match[2], colors);
    // `resolveColor` hands back its input when it does not know the name.
    if (resolved === match[2]) continue;
    const color = match[3] ? withAlpha(resolved, Number(match[3]) / 100) : resolved;
    if (match[1] === 'bg') tone.bg = color;
    else if (match[1] === 'border') tone.border = color;
    else tone.fg = color;
  }
  return tone;
}

/** The web's `typeStyles[type]` (chip, dot and soft tile) as theme colours. */
export function dueTypeColors(type: DueType, colors: ThemeColors) {
  const style = typeStyles[type];
  return {
    chip: classColors(style.chip, colors),
    dot: classColors(style.dot, colors).bg,
    soft: classColors(style.soft, colors),
  };
}
