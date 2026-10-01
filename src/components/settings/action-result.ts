export type ActionResult = { ok: true } | { ok: false; message: string };

export function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

/**
 * Runs an action so a request that never got an answer reads like any other
 * failed action: the callers revert and toast in one place.
 */
export async function attempt(call: () => Promise<ActionResult>): Promise<ActionResult> {
  try {
    return await call();
  } catch (error) {
    return { ok: false, message: errorMessage(error) };
  }
}

/** `border-negative/30`: a theme colour at reduced opacity. */
export function withAlpha(color: string, alpha: number) {
  const hex = /^#([0-9a-f]{6})$/i.exec(color)?.[1];
  if (!hex) return color;
  const value = parseInt(hex, 16);
  return `rgba(${(value >> 16) & 255}, ${(value >> 8) & 255}, ${value & 255}, ${alpha})`;
}
