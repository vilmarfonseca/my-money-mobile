import { ClerkProvider, useAuth, useClerk, useUser } from '@clerk/expo';
import { tokenCache } from '@clerk/expo/token-cache';
import { useQueryClient } from '@tanstack/react-query';
import { createContext, use, useEffect, type ReactNode } from 'react';

import { setApiTokenGetter } from '@/api/client';
import { devSampleUser } from '@/api/config';

export type SessionUser = {
  email: string | null;
  imageUrl: string | null;
  name: string | null;
  username: string | null;
};

type SessionContextValue = {
  /** False until the stored session has been read back. */
  isLoaded: boolean;
  isSignedIn: boolean;
  signOut: () => Promise<void>;
  /** The identity provider's view of the user (name, avatar). */
  user: SessionUser | null;
};

const SessionContext = createContext<SessionContextValue>({
  isLoaded: false,
  isSignedIn: false,
  signOut: async () => {},
  user: null,
});

/**
 * Who is signed in. Screens read this instead of Clerk's own hooks so the
 * development sample-user mode (no Clerk at all) needs no special cases.
 */
export function useSession() {
  return use(SessionContext);
}

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY ?? '';

function ClerkSession({ children }: { children: ReactNode }) {
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();
  const clerk = useClerk();
  const queryClient = useQueryClient();

  // Every API call asks Clerk for the session token; Clerk refreshes it as
  // needed and answers from memory otherwise.
  useEffect(() => {
    setApiTokenGetter(() => getToken());
  }, [getToken]);

  const value: SessionContextValue = {
    isLoaded,
    isSignedIn: Boolean(isSignedIn),
    signOut: async () => {
      await clerk.signOut();
      // Nothing of the previous account may outlive its session.
      queryClient.clear();
    },
    user: user
      ? {
          email: user.primaryEmailAddress?.emailAddress ?? null,
          imageUrl: user.hasImage ? user.imageUrl : null,
          name: user.fullName,
          username: user.username,
        }
      : null,
  };

  return <SessionContext value={value}>{children}</SessionContext>;
}

function ClerkAuthProvider({ children }: { children: ReactNode }) {
  if (!publishableKey) {
    throw new Error(
      'EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY is not set. Copy .env.example to .env.local and fill it in.',
    );
  }

  return (
    <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
      <ClerkSession>{children}</ClerkSession>
    </ClerkProvider>
  );
}

function SampleUserAuthProvider({ children }: { children: ReactNode }) {
  return (
    <SessionContext
      value={{ isLoaded: true, isSignedIn: true, signOut: async () => {}, user: null }}>
      {children}
    </SessionContext>
  );
}

export const AuthProvider = devSampleUser ? SampleUserAuthProvider : ClerkAuthProvider;
