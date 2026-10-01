import { focusManager, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect, useState, type ReactNode } from 'react';
import { AppState } from 'react-native';

import { ApiError } from '@/api/client';

export function QueryProvider({ children }: { children: ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Fresh enough that switching tabs back and forth does not refetch
            // every time, short enough that a returning screen is current.
            staleTime: 15_000,
            retry: (failureCount, error) =>
              // Only a request that never got an answer is worth repeating.
              error instanceof ApiError && error.status === 0 && failureCount < 2,
          },
        },
      }),
  );

  // Coming back to the app refreshes what is on screen, as a browser tab
  // regaining focus would.
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      focusManager.setFocused(state === 'active');
    });
    return () => subscription.remove();
  }, []);

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
