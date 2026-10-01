import { rememberPendingLink } from '@/providers/pending-link';

/**
 * Runs for every link that opens the app, before any route does. The path is
 * passed through untouched; it is only noted, so a link opened while signed
 * out can be resumed once the visitor has signed in.
 */
export function redirectSystemPath({ path }: { path: string; initial: boolean }) {
  try {
    rememberPendingLink(path);
  } catch {
    // Never throw from here: it would break app launch from a link.
  }
  return path;
}
