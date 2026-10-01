// Synced from my-money-v2 (src/lib/colors.ts). Do not edit here: change it
// in the web repo and run `npm run sync:web`.
/** Shared hex color math for feature palettes (card faces, allocation bars). */

export function hexToRgb(hex: string) {
  let value = hex.replace("#", "");
  if (value.length === 3)
    value = value
      .split("")
      .map((char) => char + char)
      .join("");
  return {
    r: parseInt(value.slice(0, 2), 16),
    g: parseInt(value.slice(2, 4), 16),
    b: parseInt(value.slice(4, 6), 16),
  };
}

function channelToHex(value: number) {
  return Math.max(0, Math.min(255, Math.round(value)))
    .toString(16)
    .padStart(2, "0");
}

/** Mix a hex color toward black (negative) or white (positive) by `amount`. */
export function shadeHex(hex: string, amount: number) {
  const { r, g, b } = hexToRgb(hex);
  const target = amount < 0 ? 0 : 255;
  const mix = Math.abs(amount);
  return `#${channelToHex(r + (target - r) * mix)}${channelToHex(
    g + (target - g) * mix,
  )}${channelToHex(b + (target - b) * mix)}`;
}
