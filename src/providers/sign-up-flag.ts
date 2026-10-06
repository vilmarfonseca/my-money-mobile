import type { AppLocale } from '@/lib/i18n/config';

/**
 * Set when this app launch created the account, so the first signed-in
 * screen can ask for a friend's invite code once (the web app's post-sign-up
 * "welcome" hop). In memory on purpose: it must not survive a restart.
 */
let justSignedUp = false;

/** The language picked on the sign-in screen before signing up, if any. */
let signUpLocale: AppLocale | null = null;

export function markJustSignedUp(locale: AppLocale | null = null) {
  justSignedUp = true;
  signUpLocale = locale;
}

/** Reads the flag and clears it: the welcome step shows at most once. */
export function consumeJustSignedUp(): boolean {
  const value = justSignedUp;
  justSignedUp = false;
  return value;
}

/**
 * Reads the language picked before signing up and clears it. The new account
 * adopts it, as a web sign-up adopts the visitor's language cookie.
 */
export function consumeSignUpLocale(): AppLocale | null {
  const value = signUpLocale;
  signUpLocale = null;
  return value;
}
