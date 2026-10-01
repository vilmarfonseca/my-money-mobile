import { useEffect, useState } from 'react';

/**
 * How long a coachmark waits before it interrupts. The dashboard should be the
 * first thing the user reads; the tip only steps in once they have had a look
 * and have not started anything themselves.
 */
export const COACHMARK_DELAY_MS = 10_000;

/** True once `active` has stayed true for `delayMs`. Resets when it goes false. */
export function useCoachmarkDelay(active: boolean, delayMs: number = COACHMARK_DELAY_MS): boolean {
  const [elapsed, setElapsed] = useState(false);
  // Restart the countdown when the trigger flips, during render rather than in
  // an effect, so a re-armed tip never flashes with the previous run's timer.
  const [armedFor, setArmedFor] = useState(active);
  if (armedFor !== active) {
    setArmedFor(active);
    setElapsed(false);
  }

  useEffect(() => {
    if (!active) return;
    const timer = setTimeout(() => setElapsed(true), delayMs);
    return () => clearTimeout(timer);
  }, [active, delayMs]);

  return active && elapsed;
}
