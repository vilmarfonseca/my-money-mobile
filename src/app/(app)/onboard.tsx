import { useState } from 'react';

import { ReferralWelcome } from '@/components/billing/referral-welcome';
import { OnboardingScreen } from '@/components/onboarding/onboarding-screen';
import { consumeJustSignedUp } from '@/providers/sign-up-flag';

/**
 * The one-time setup a new account goes through before the app opens. An
 * account created in this launch is first asked, once, for an invite code.
 */
export default function OnboardRoute() {
  const [showReferral, setShowReferral] = useState(() => consumeJustSignedUp());

  if (showReferral) {
    return <ReferralWelcome onContinue={() => setShowReferral(false)} />;
  }

  return <OnboardingScreen />;
}
