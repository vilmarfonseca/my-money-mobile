import { View } from 'react-native';

import { QuickTipCard } from '@/components/quick-tip-card';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton, SkeletonCard } from '@/components/ui/skeleton';
import { Text } from '@/components/ui/text';
import type { GoalsPageData } from '@/lib/goals/goals-queries';
import { useI18n } from '@/lib/i18n/provider';
import { palette } from '@/theme/tokens';

/** The what-if nudge under the savings overview. */
export function GoalsTipSection({
  activeGoals,
  completedGoals,
  whatIfScenario,
}: Pick<GoalsPageData, 'activeGoals' | 'completedGoals' | 'whatIfScenario'>) {
  const { formatCurrency, messages } = useI18n();
  const hasGoals = activeGoals.length > 0 || completedGoals.length > 0;

  // No tips on an empty goals page — the empty-state coachmark owns it.
  if (!hasGoals || (whatIfScenario && whatIfScenario.initialExtraContribution === 0)) {
    return null;
  }

  return (
    <QuickTipCard
      eyebrow={messages.common.quickTip}
      primaryAction={{ label: messages.balancePage.tryIt }}
      secondaryAction={{ label: messages.common.notNow }}>
      {whatIfScenario ? (
        <>
          {messages.goals.whatIfTipPrefix}
          <Text font="displayItalic" size="xl" color={palette.coral600}>
            {whatIfScenario.goalName}
            {' '}
          </Text>
          {messages.goals.whatIfTipMiddle}
          {formatCurrency(whatIfScenario.initialExtraContribution)}
          {/* The suffix brings its own leading space, which HTML would collapse. */}
          {messages.goals.monthlySuffix}, {messages.goals.whatIfTipSuffix.trimStart()}
        </>
      ) : (
        messages.goals.addGoalNudge
      )}
    </QuickTipCard>
  );
}

/** Placeholder for the whole page while the first load is in flight. */
export function GoalsSkeleton() {
  return (
    <View style={{ gap: 16 }}>
      <SkeletonCard lines={5} />
      <Skeleton height={24} width="60%" style={{ marginTop: 4, marginLeft: 6 }} />
      <SkeletonCard lines={4} />
      <Skeleton height={24} width="30%" style={{ marginTop: 4, marginLeft: 6 }} />
      <SkeletonCard lines={5} />
      <Skeleton height={24} width="40%" style={{ marginTop: 4, marginLeft: 6 }} />
      <SkeletonCard lines={4} />
    </View>
  );
}

/** The page could not load: say why and offer another try. */
export function GoalsLoadError({ message, onRetry }: { message: string; onRetry: () => void }) {
  const { locale } = useI18n();
  const pt = locale === 'pt-BR';

  return (
    <Card style={{ gap: 12 }}>
      <Text font="display" size="2xl" tight>
        {pt ? 'Não foi possível carregar seus objetivos' : 'Could not load your goals'}
      </Text>
      <Text size="sm" color="ink3">
        {message}
      </Text>
      <Button
        style={{ alignSelf: 'flex-start' }}
        label={pt ? 'Tentar de novo' : 'Try again'}
        onPress={onRetry}
      />
    </Card>
  );
}
