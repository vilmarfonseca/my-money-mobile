import { useRouter } from 'expo-router';
import { useState } from 'react';

import { ReferralWelcome } from '@/components/billing/referral-welcome';
import { OnboardingScreen } from '@/components/onboarding/onboarding-screen';
import { consumeJustSignedUp } from '@/providers/sign-up-flag';

/**
 * The one-time setup a new account goes through before the app opens. An
 * account created in this launch is first asked, once, for an invite code,
 * then picks its plan; the plan picker's free option and checkout both lead
 * back here.
 */
export default function OnboardRoute() {
  const router = useRouter();
  const [showReferral] = useState(() => consumeJustSignedUp());

  if (showReferral) {
    return <ReferralWelcome onContinue={() => router.replace('/subscribe')} />;
  }

  return <OnboardingScreen />;
}
