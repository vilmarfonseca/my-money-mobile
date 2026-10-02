import { Redirect } from 'expo-router';

import { useBootstrap } from '@/providers/app-data-provider';

/**
 * Where the signed-in app opens, and where the router falls back to whenever
 * a gate closes under the current screen (onboarding finishing, a plan
 * locking). It sends each account to the one place it can be.
 */
export default function Index() {
  const { entitlements, onboarding, scope } = useBootstrap();

  if (entitlements.lockedOut) return <Redirect href="/subscribe" />;
  if (!onboarding.completed && scope.kind !== 'household') return <Redirect href="/onboard" />;
  return <Redirect href="/dashboard" />;
}
