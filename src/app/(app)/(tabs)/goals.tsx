import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { View } from 'react-native';

import { usePullToRefresh, useScreenQuery } from '@/api/hooks';
import { ActiveGoals } from '@/components/goals/active-goals';
import { ActivityTimeline } from '@/components/goals/activity-timeline';
import {
  AddGoalButton,
  AddGoalCoachmark,
  type AddGoalAnchor,
} from '@/components/goals/add-goal-button';
import { AddGoalModal } from '@/components/goals/add-goal-modal';
import { CompletedGoalsTable } from '@/components/goals/completed-goals-table';
import { GoalsLoadError, GoalsSkeleton, GoalsTipSection } from '@/components/goals/goals-sections';
import { SavingsOverview } from '@/components/goals/savings-overview';
import { WhatIfSimulator } from '@/components/goals/what-if-simulator';
import { PageHeader } from '@/components/page-header';
import { Screen } from '@/components/ui/screen';
import { useI18n } from '@/lib/i18n/provider';

export default function GoalsScreen() {
  const { messages } = useI18n();
  const query = useScreenQuery('goals.page', []);
  const { onRefresh, refreshing } = usePullToRefresh(query);
  const [addOpen, setAddOpen] = useState(false);
  const [coachDismissed, setCoachDismissed] = useState(false);
  const [anchor, setAnchor] = useState<AddGoalAnchor | null>(null);

  const data = query.data;
  const hasGoals = data ? data.activeGoals.length > 0 || data.completedGoals.length > 0 : true;
  // The add-goal coachmark is derived from the goal count alone: it owns the
  // empty page until it is skipped or the new-goal sheet opens.
  const coaching = !hasGoals && !coachDismissed && !addOpen;

  // Tabs stay mounted, so a skipped coachmark would never come back; the web
  // shows it again on every visit to an empty goals page.
  useFocusEffect(useCallback(() => () => setCoachDismissed(false), []));

  const openAddGoal = () => {
    setCoachDismissed(true);
    setAddOpen(true);
  };

  return (
    <Screen
      onRefresh={onRefresh}
      refreshing={refreshing}
      footer={
        coaching && anchor ? (
          <AddGoalCoachmark
            anchor={anchor}
            onAdd={openAddGoal}
            onSkip={() => setCoachDismissed(true)}
          />
        ) : null
      }>
      <PageHeader
        title={messages.goals.title}
        description={messages.goals.headerDescription}
        mobileAction={<AddGoalButton iconOnly onAnchor={setAnchor} onPress={openAddGoal} />}
      />

      {data ? (
        <>
          <SavingsOverview
            activeGoals={data.activeGoals}
            monthlySavingsTrend={data.monthlySavingsTrend}
            overview={data.overview}
          />
          <GoalsTipSection
            activeGoals={data.activeGoals}
            completedGoals={data.completedGoals}
            whatIfScenario={data.whatIfScenario}
          />
          <ActiveGoals goals={data.activeGoals} onAddGoal={openAddGoal} />
          <View style={{ gap: 16, marginTop: 16 }}>
            <WhatIfSimulator scenario={data.whatIfScenario} />
            <ActivityTimeline activities={data.activities} />
          </View>
          <CompletedGoalsTable goals={data.completedGoals} />
        </>
      ) : query.error ? (
        <GoalsLoadError message={query.error.message} onRetry={() => void query.refetch()} />
      ) : (
        <GoalsSkeleton />
      )}

      <AddGoalModal open={addOpen} onOpenChange={setAddOpen} />
    </Screen>
  );
}
