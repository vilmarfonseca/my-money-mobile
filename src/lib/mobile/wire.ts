// Synced from my-money-v2 (src/lib/mobile/wire.ts). Do not edit here: change it
// in the web repo and run `npm run sync:web`.
/**
 * Wire format of the mobile API. Results are plain JSON, except for the two
 * kinds of value the web app passes from server to client that JSON cannot
 * carry: `Date` (JSON turns it into a string and it never comes back) and
 * non-finite numbers (`Infinity` is the "unlimited" plan limit, and JSON
 * turns it into `null`). Both travel as a tagged object and are revived on the
 * other side, so the native app sees the same shapes the web components do.
 *
 * This file has no imports on purpose: the native app carries a copy of it.
 */

const DATE_TAG = "$date";
const NUMBER_TAG = "$number";

export function encodeWire(value: unknown): unknown {
  if (value instanceof Date) {
    return { [DATE_TAG]: value.toISOString() };
  }
  if (typeof value === "number" && !Number.isFinite(value)) {
    return { [NUMBER_TAG]: String(value) };
  }
  if (Array.isArray(value)) {
    return value.map(encodeWire);
  }
  if (value !== null && typeof value === "object") {
    const encoded: Record<string, unknown> = {};
    for (const [key, entry] of Object.entries(value)) {
      if (entry !== undefined) encoded[key] = encodeWire(entry);
    }
    return encoded;
  }
  return value;
}

export function decodeWire(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(decodeWire);
  }
  if (value !== null && typeof value === "object") {
    const record = value as Record<string, unknown>;
    const keys = Object.keys(record);
    if (keys.length === 1) {
      const tagged = record[keys[0]];
      if (keys[0] === DATE_TAG && typeof tagged === "string") {
        return new Date(tagged);
      }
      if (keys[0] === NUMBER_TAG && typeof tagged === "string") {
        return Number(tagged);
      }
    }
    const decoded: Record<string, unknown> = {};
    for (const key of keys) {
      decoded[key] = decodeWire(record[key]);
    }
    return decoded;
  }
  return value;
}
