// Synced from my-money-v2 (src/lib/referrals/referral-code.ts). Do not edit here: change it
// in the web repo and run `npm run sync:web`.
/**
 * Pure helpers for referral codes. A code is the user's username, lower-cased
 * and stripped to a URL-safe alphabet, with a numeric suffix only when another
 * account already owns that exact code.
 */

/** Free days each side of a settled referral receives. */
export const REFERRAL_FREE_DAYS = 30;

const CODE_ALPHABET = /[^a-z0-9._-]/g;
const MAX_CODE_LENGTH = 32;
const MIN_CODE_LENGTH = 3;

/**
 * Canonical form of a code as typed or pasted by a user: trimmed, lower-cased,
 * with a leading "@" tolerated. Returns null when nothing usable is left.
 */
export function normalizeReferralCode(input: string): string | null {
  const cleaned = input
    .trim()
    .replace(/^@/, "")
    .toLowerCase()
    .replace(CODE_ALPHABET, "")
    .slice(0, MAX_CODE_LENGTH);
  return cleaned.length >= MIN_CODE_LENGTH ? cleaned : null;
}

/**
 * The base a new user's code is minted from: their username, else the local
 * part of their email, else a fixed fallback (the suffix loop makes it unique).
 */
export function referralCodeBase({
  username,
  email,
}: {
  username?: string | null;
  email: string;
}): string {
  const fromUsername = username ? normalizeReferralCode(username) : null;
  if (fromUsername) return fromUsername;
  const local = email.split("@")[0] ?? "";
  return normalizeReferralCode(local) ?? "friend";
}

/**
 * Candidate codes in the order they should be tried: the base itself, then
 * base2, base3, … The suffix never pushes the code past the length cap.
 */
export function referralCodeCandidate(base: string, attempt: number): string {
  if (attempt <= 0) return base;
  const suffix = String(attempt + 1);
  return `${base.slice(0, MAX_CODE_LENGTH - suffix.length)}${suffix}`;
}

/**
 * Absolute invite link, the thing users actually share: the app URL with the
 * code at the end. `/r/<code>` redirects to sign-up with the code applied.
 */
export function referralLink(appUrl: string, code: string): string {
  return new URL(`/r/${encodeURIComponent(code)}`, appUrl).toString();
}

/** Whole days from now until `end`, never negative. */
export function daysUntil(end: Date | string, now: Date = new Date()): number {
  const endMs = typeof end === "string" ? new Date(end).getTime() : end.getTime();
  return Math.max(0, Math.ceil((endMs - now.getTime()) / 86_400_000));
}
