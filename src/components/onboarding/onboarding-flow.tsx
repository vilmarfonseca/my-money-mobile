import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CreditCard,
  Download,
  House,
  Landmark,
  LogOut,
  Palette,
  Target,
  type LucideIcon,
} from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import Animated, {
  FadeInDown,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';

import { callApi } from '@/api/client';
import { useRefreshData } from '@/api/hooks';
import { LogoMark } from '@/components/brand/logo-mark';
import { OnboardingCelebration } from '@/components/onboarding/onboarding-celebration';
import {
  OnboardingStepBanks,
  type OnboardingBankSummary,
} from '@/components/onboarding/onboarding-step-banks';
import {
  OnboardingStepCards,
  type OnboardingCardSummary,
} from '@/components/onboarding/onboarding-step-cards';
import {
  OnboardingStepGoals,
  type OnboardingGoalSummary,
} from '@/components/onboarding/onboarding-step-goals';
import {
  OnboardingStepHousehold,
  type OnboardingHouseholdSummary,
} from '@/components/onboarding/onboarding-step-household';
import {
  OnboardingStepImport,
  type OnboardingDataChoice,
} from '@/components/onboarding/onboarding-step-import';
import { OnboardingStepLook } from '@/components/onboarding/onboarding-step-look';
import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { Text } from '@/components/ui/text';
import { toast } from '@/components/ui/toast';
import { useI18n } from '@/lib/i18n/provider';
import type { OnboardingResume } from '@/lib/onboarding/onboarding-queries';
import { useSession } from '@/providers/auth-provider';
import { useTheme } from '@/theme/theme-provider';
import { durations, palette, radius, shadows } from '@/theme/tokens';

type StepKey = 'banks' | 'household' | 'goals' | 'cards' | 'data' | 'look';
const STEP_ICONS: Record<StepKey, LucideIcon> = {
  banks: Landmark,
  household: House,
  goals: Target,
  cards: CreditCard,
  data: Download,
  look: Palette,
};
const SKIPPABLE_STEPS: StepKey[] = ['household', 'goals', 'cards', 'data'];

/** How long the completion animation plays before the app takes over. */
const CELEBRATION_MS = 2100;

type Phase = 'form' | 'done';

export type OnboardingFlowProps = {
  /** A bank account already exists (user resumed mid-flow). */
  hasBankAccounts: boolean;
  /** User's first name for the welcome toast; null when unknown. */
  firstName: string | null;
  /** Server-saved progress used to rehydrate the flow on relaunch/re-login. */
  resume: OnboardingResume;
  /** Premium gate: whether the optional household step is offered. */
  canCreateHousehold: boolean;
  /** Whether the file-import step is offered (on every tier today; kept as a gate). */
  canImportCsv: boolean;
  /** Existing household when resuming mid-flow. */
  initialHousehold: OnboardingHouseholdSummary | null;
};

/** Gutter around the wizard card (`max-sm:p-3.5`). */
const ONBOARDING_GUTTER = 14;

/** The wizard's frame: a single card filling the screen over the mesh. */
export function useOnboardingFrameStyle() {
  const insets = useSafeAreaInsets();
  return {
    paddingTop: insets.top + ONBOARDING_GUTTER,
    paddingHorizontal: ONBOARDING_GUTTER,
    paddingBottom: Math.max(insets.bottom, ONBOARDING_GUTTER),
  };
}

export function OnboardingFlow({
  canCreateHousehold,
  canImportCsv,
  firstName,
  hasBankAccounts,
  initialHousehold,
  resume,
}: OnboardingFlowProps) {
  const { messages } = useI18n();
  const { colors } = useTheme();
  const { signOut } = useSession();
  const router = useRouter();
  const refresh = useRefreshData();
  const frame = useOnboardingFrameStyle();
  const t = messages.onboarding;

  // Steps the user's tier doesn't include simply don't exist in the flow.
  const stepKeys: StepKey[] = [
    'banks',
    ...(canCreateHousehold ? (['household'] as const) : []),
    'goals',
    'cards',
    ...(canImportCsv ? (['data'] as const) : []),
    'look',
  ];
  const totalSteps = stepKeys.length;

  const [step, setStep] = useState(Math.min(resume.step, totalSteps));
  const [household, setHousehold] = useState<OnboardingHouseholdSummary | null>(initialHousehold);
  const [direction, setDirection] = useState<'forward' | 'back'>('forward');
  const [banks, setBanks] = useState<OnboardingBankSummary[]>(resume.banks);
  const [goals, setGoals] = useState<OnboardingGoalSummary[]>(resume.goals);
  const [cards, setCards] = useState<OnboardingCardSummary[]>(resume.cards);
  const [dataChoice, setDataChoice] = useState<OnboardingDataChoice>('fresh');
  const [phase, setPhase] = useState<Phase>('form');
  const [nudgeSignal, setNudgeSignal] = useState(0);
  const shake = useSharedValue(0);

  const step1Complete = hasBankAccounts || banks.length > 0;
  const finishing = phase !== 'form';

  const rejectLockedNav = () => {
    // `ob-shake`: the rail rocks when the required step is skipped over.
    shake.value = withSequence(
      withTiming(-6, { duration: 84 }),
      withTiming(6, { duration: 84 }),
      withTiming(-4, { duration: 84 }),
      withTiming(4, { duration: 84 }),
      withTiming(0, { duration: 84 }),
    );
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
    setNudgeSignal((signal) => signal + 1);
  };

  const goTo = (target: number) => {
    const next = Math.min(Math.max(target, 1), totalSteps);
    if (next === step) return;
    if (next > 1 && !step1Complete) {
      rejectLockedNav();
      return;
    }
    setDirection(next > step ? 'forward' : 'back');
    setStep(next);
    // Persist progress so a relaunch or re-login resumes on this step.
    callApi('onboarding.saveStep', next).catch(() => {});
  };

  const finish = async () => {
    // The request runs under the completion animation. The shell's data is
    // only refreshed once the check has played, because that refresh is what
    // swaps this screen for the app.
    setPhase('done');
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    const played = new Promise((resolve) => setTimeout(resolve, CELEBRATION_MS));

    try {
      const result = await callApi('onboarding.complete');
      if (!result.ok) {
        toast.error(result.message);
        setPhase('form');
        return;
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t.completeFailed);
      setPhase('form');
      return;
    }

    await played;
    toast.success(t.welcomeToast(firstName));
    await refresh();
    // The refreshed shell opens the app on its own; this covers the case
    // where it has not moved yet.
    try {
      router.replace('/dashboard');
    } catch {
      // The gate had already navigated.
    }
  };

  const handleNext = () => {
    if (step === 1 && !step1Complete) {
      rejectLockedNav();
      return;
    }
    if (step < totalSteps) {
      goTo(step + 1);
      return;
    }
    void finish();
  };

  const stepTitles: Record<StepKey, { lead: string; em: string; description: string }> = {
    banks: { lead: t.banksTitleLead, em: t.banksTitleEm, description: t.banksDescription },
    household: {
      lead: t.householdTitleLead,
      em: t.householdTitleEm,
      description: t.householdDescription,
    },
    goals: { lead: t.goalsTitleLead, em: t.goalsTitleEm, description: t.goalsDescription },
    cards: { lead: t.cardsTitleLead, em: t.cardsTitleEm, description: t.cardsDescription },
    data: { lead: t.dataTitleLead, em: t.dataTitleEm, description: t.dataDescription },
    look: { lead: t.lookTitleLead, em: t.lookTitleEm, description: t.lookDescription },
  };
  const activeKey = stepKeys[step - 1];
  const active = stepTitles[activeKey];
  const ActiveIcon = STEP_ICONS[activeKey];
  const kickLabel = t.kickTags[activeKey]
    ? `${t.stepWord} ${step} · ${t.kickTags[activeKey]}`
    : `${t.stepWord} ${step}`;
  const isLast = step === totalSteps;
  // The required step keeps Continue pressable so a press can explain itself
  // (shake + nudge) instead of doing nothing.
  const blocked = activeKey === 'banks' && !step1Complete;

  const railShake = useAnimatedStyle(() => ({ transform: [{ translateX: shake.value }] }));
  const cardState = useAnimatedStyle(() => ({
    opacity: withTiming(finishing ? 0 : 1, { duration: durations.slow }),
    transform: [
      { translateY: withTiming(finishing ? 10 : 0, { duration: durations.slow }) },
      { scale: withTiming(finishing ? 0.985 : 1, { duration: durations.slow }) },
    ],
  }));

  const paneIn =
    direction === 'forward'
      ? FadeInDown.duration(durations.base).withInitialValues({ transform: [{ translateY: 12 }] })
      : FadeInUp.duration(durations.base).withInitialValues({ transform: [{ translateY: -12 }] });

  return (
    <View style={{ flex: 1 }}>
      <Screen scroll={false} contentStyle={frame}>
        <Animated.View
          entering={FadeInDown.duration(durations.slow).withInitialValues({
            transform: [{ translateY: 16 }],
          })}
          style={{ flex: 1 }}>
          <Animated.View
            accessibilityLabel={`${t.railTitleLead} ${t.railTitleEm}`}
            pointerEvents={finishing ? 'none' : 'auto'}
            style={[
              {
                flex: 1,
                overflow: 'hidden',
                borderRadius: radius.xl,
                borderWidth: 1,
                borderColor: colors.line,
                backgroundColor: colors.surface1,
                boxShadow: shadows.xl,
              },
              cardState,
            ]}>
            {/* Rail: brand, sign out, and the step bars */}
            <Animated.View style={railShake}>
              <LinearGradient
                colors={['#1d1428', '#241a33', '#2a1e3d']}
                locations={[0, 0.6, 1]}
                style={{ gap: 12, padding: 16, overflow: 'hidden' }}>
                <RailGlow />

                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <LogoMark size={28} color={palette.white} />
                  <Text font="display" size="2xl" color={palette.white} tracking={-0.4}>
                    {messages.common.appName}
                  </Text>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={messages.nav.signOut}
                    hitSlop={8}
                    onPress={() => signOut()}
                    style={({ pressed }) => ({
                      width: 36,
                      height: 36,
                      marginLeft: 'auto',
                      marginRight: -6,
                      marginVertical: -6,
                      borderRadius: 18,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: pressed ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                    })}>
                    <LogOut size={18} color="rgba(255, 255, 255, 0.6)" />
                  </Pressable>
                </View>

                <View
                  accessibilityLabel={t.stepLabel(step, totalSteps)}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  {stepKeys.map((key, index) => {
                    const n = index + 1;
                    return (
                      <Pressable
                        key={key}
                        accessibilityRole="button"
                        accessibilityLabel={t.steps[key].title}
                        accessibilityState={{ selected: n === step }}
                        hitSlop={{ top: 14, bottom: 14 }}
                        onPress={() => goTo(n)}
                        style={{
                          flex: 1,
                          height: 6,
                          borderRadius: 3,
                          backgroundColor: n <= step ? palette.plum500 : 'rgba(255, 255, 255, 0.2)',
                        }}
                      />
                    );
                  })}
                </View>
              </LinearGradient>
            </Animated.View>

            {/* Content */}
            <ScrollView
              // Each step starts at the top.
              key={step}
              style={{ flex: 1 }}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 28, paddingBottom: 20 }}>
              <Animated.View entering={paneIn}>
                <View style={{ marginBottom: 20 }}>
                  <View
                    style={{
                      alignSelf: 'flex-start',
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 8,
                      marginBottom: 14,
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      borderRadius: radius.pill,
                      backgroundColor: colors.accentSoft,
                    }}>
                    <ActiveIcon size={14} color={colors.accentSoftFg} />
                    <Text font="sansMedium" size="xs" color="accentSoftFg" uppercase tracking={0.6}>
                      {kickLabel}
                    </Text>
                  </View>
                  <Text
                    font="display"
                    size="4xl"
                    tracking={-0.6}
                    accessibilityRole="header"
                    style={{ lineHeight: 42 }}>
                    {active.lead}{' '}
                    <Text font="displayItalic" size="4xl" color="ink2" tracking={-0.6}>
                      {active.em}
                    </Text>
                  </Text>
                  <Text size="sm" color="ink3" style={{ marginTop: 8, lineHeight: 22 }}>
                    {active.description}
                  </Text>
                </View>

                {activeKey === 'banks' ? (
                  <OnboardingStepBanks
                    banks={banks}
                    onBanksChange={setBanks}
                    nudgeSignal={nudgeSignal}
                  />
                ) : null}
                {activeKey === 'household' ? (
                  <OnboardingStepHousehold household={household} onHouseholdChange={setHousehold} />
                ) : null}
                {activeKey === 'goals' ? (
                  <OnboardingStepGoals goals={goals} onGoalsChange={setGoals} />
                ) : null}
                {activeKey === 'cards' ? (
                  <OnboardingStepCards cards={cards} onCardsChange={setCards} />
                ) : null}
                {activeKey === 'data' ? (
                  <OnboardingStepImport choice={dataChoice} onChoiceChange={setDataChoice} />
                ) : null}
                {activeKey === 'look' ? <OnboardingStepLook /> : null}
              </Animated.View>
            </ScrollView>

            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 10,
                paddingHorizontal: 20,
                paddingVertical: 16,
                borderTopWidth: 1,
                borderTopColor: colors.line,
              }}>
              <Button
                variant="outline"
                label={t.back}
                icon={(props) => <ArrowLeft {...props} />}
                disabled={step === 1 || finishing}
                accessibilityElementsHidden={step === 1}
                importantForAccessibility={step === 1 ? 'no-hide-descendants' : 'auto'}
                onPress={() => goTo(step - 1)}
                // `invisible` on the first step: it keeps its place in the row.
                style={step === 1 ? { opacity: 0 } : undefined}
              />
              <View style={{ flex: 1 }} />
              {SKIPPABLE_STEPS.includes(activeKey) ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t.skipForNow}
                  disabled={finishing}
                  hitSlop={6}
                  onPress={() => goTo(step + 1)}
                  style={({ pressed }) => ({
                    height: 40,
                    paddingHorizontal: 12,
                    justifyContent: 'center',
                    opacity: pressed ? 0.6 : 1,
                  })}>
                  <Text font="sansMedium" size="sm" color="ink3">
                    {t.skipShort}
                  </Text>
                </Pressable>
              ) : null}
              <Button
                label={isLast ? (finishing ? `${t.finishing}…` : t.finish) : t.continue}
                iconRight={(props) => (isLast ? <Check {...props} /> : <ArrowRight {...props} />)}
                disabled={finishing}
                accessibilityState={{ disabled: finishing || blocked }}
                onPress={handleNext}
                style={{
                  paddingHorizontal: 20,
                  backgroundColor: blocked || finishing ? colors.ink4 : palette.plum500,
                  opacity: blocked || finishing ? 0.6 : 1,
                }}
              />
            </View>
          </Animated.View>
        </Animated.View>
      </Screen>

      {phase === 'done' ? <OnboardingCelebration title={t.finishTitle} sub={t.finishSub} /> : null}
    </View>
  );
}

/** The plum glow in the rail's top-right corner (`ob-rail-glow`). */
function RailGlow() {
  const size = 260;
  return (
    <Svg
      width={size}
      height={size}
      pointerEvents="none"
      style={{ position: 'absolute', top: -size / 2, right: -size / 4 }}>
      <Defs>
        <RadialGradient id="ob-rail-glow" cx="50%" cy="50%" r="50%">
          <Stop offset={0} stopColor={palette.plum500} stopOpacity={0.45} />
          <Stop offset={0.62} stopColor={palette.plum500} stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Circle cx={size / 2} cy={size / 2} r={size / 2} fill="url(#ob-rail-glow)" />
    </Svg>
  );
}
