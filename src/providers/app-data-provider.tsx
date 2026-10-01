import { createContext, use, type ReactNode } from 'react';

import type { ApiResult } from '@/api/client';
import type { Entitlements } from '@/lib/billing/entitlements';

export type Bootstrap = ApiResult<'app.bootstrap'>;

const BootstrapContext = createContext<Bootstrap | null>(null);

/** Makes the shell's data (plan, workspaces, onboarding) available below it. */
export function AppDataProvider({ children, value }: { children: ReactNode; value: Bootstrap }) {
  return <BootstrapContext value={value}>{children}</BootstrapContext>;
}

/** What the web layout loads for the signed-in shell. Only inside `(app)`. */
export function useBootstrap(): Bootstrap {
  const value = use(BootstrapContext);
  if (!value) {
    throw new Error('useBootstrap() was called outside the signed-in app.');
  }
  return value;
}

/** Same contract as the web app's `useEntitlements()`. */
export function useEntitlements(): Entitlements {
  return useBootstrap().entitlements;
}
