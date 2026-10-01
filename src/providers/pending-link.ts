/**
 * A deep link that arrived while nobody was signed in (a household invite
 * opened from an email, say). The router sends the visitor to sign-in; this
 * remembers where they were going so the shell can take them there after.
 */
let pending: { at: number; path: string } | null = null;

/** Long enough to sign in, short enough that a link handled long ago is not replayed. */
const MAX_AGE_MS = 10 * 60 * 1000;

/** Links worth resuming after sign-in. Everything else lands on the dashboard. */
const RESUMABLE = /^\/invite\/[^/?#]+$/;

export function rememberPendingLink(path: string) {
  try {
    const { pathname } = new URL(path, 'mymoney://app');
    if (RESUMABLE.test(pathname)) pending = { at: Date.now(), path: pathname };
  } catch {
    // Not a URL we understand: nothing to resume.
  }
}

/** Reads the remembered link and clears it. */
export function consumePendingLink(): string | null {
  const link = pending;
  pending = null;
  return link && Date.now() - link.at < MAX_AGE_MS ? link.path : null;
}
