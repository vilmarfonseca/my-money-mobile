import { useState, type Dispatch, type SetStateAction } from 'react';

/**
 * `useState` seeded from loaded data that follows that data again whenever it
 * changes. The web gets the same effect for free (a full page load reseeds
 * the form); here the screen stays mounted while its queries refresh, so an
 * optimistic toggle must give way to the saved value once it arrives.
 * `key` identifies the loaded value when it is not a primitive.
 */
export function useSyncedState<T>(
  value: T,
  key: unknown = value,
): [T, Dispatch<SetStateAction<T>>] {
  const [state, setState] = useState(value);
  const [seenKey, setSeenKey] = useState(key);

  if (!Object.is(seenKey, key)) {
    setSeenKey(key);
    setState(value);
  }

  return [state, setState];
}
