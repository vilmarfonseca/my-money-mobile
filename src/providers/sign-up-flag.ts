/**
 * Set when this app launch created the account, so the first signed-in
 * screen can ask for a friend's invite code once (the web app's post-sign-up
 * "welcome" hop). In memory on purpose: it must not survive a restart.
 */
let justSignedUp = false;

export function markJustSignedUp() {
  justSignedUp = true;
}

/** Reads the flag and clears it: the welcome step shows at most once. */
export function consumeJustSignedUp(): boolean {
  const value = justSignedUp;
  justSignedUp = false;
  return value;
}
