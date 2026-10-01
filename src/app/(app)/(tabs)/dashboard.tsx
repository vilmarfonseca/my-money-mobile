import type { Href } from 'expo-router';
import { useRef, useState } from 'react';
import { View } from 'react-native';

import { usePullToRefresh, useScreenQuery } from '@/api/hooks';
import { BalanceOverviewCard } from '@/components/dashboard/balance-overview-card';
import { DashboardHeader } from '@/components/dashboard/dashboard-header';
import { DashboardSkeleton } from '@/components/dashboard/dashboard-skeleton';
import { DashboardTransactionsTable } from '@/components/dashboard/dashboard-transactions-table';
import { FirstStepCoachmark } from '@/components/dashboard/first-step-coachmark';
import { GoalsCard } from '@/components/dashboard/goals-card';
import { UpcomingCard } from '@/components/dashboard/upcoming-card';
import { QuickTipCard } from '@/components/quick-tip-card';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Screen } from '@/components/ui/screen';
import { Text } from '@/components/ui/text';
import { useI18n } from '@/lib/i18n/provider';
import { useBootstrap } from '@/providers/app-data-provider';
import { useSession } from '@/providers/auth-provider';
import { palette } from '@/theme/tokens';

function firstName(name: string | null | undefined) {
  return name?.trim().split(/\s+/)[0] || null;
}

/**
 * Home: balance hero, this month's flow, the smart tip, goals, what is due
 * next and the latest transactions. One `dashboard.page` call carries what the
 * web page streams in section by section.
 */
export default function DashboardScreen() {
  const { locale } = useI18n();
  const { user } = useSession();
  const { user: account } = useBootstrap();
  const query = useScreenQuery('dashboard.page', []);
  const { onRefresh, refreshing } = usePullToRefresh(query);
  const addButtonRef = useRef<View>(null);
  const [headerInView, setHeaderInView] = useState(true);
  const data = query.data;
  const showCoachmark = data?.showFirstStepCoachmark ?? false;
  const pt = locale === 'pt-BR';

  return (
    <View style={{ flex: 1 }}>
      <Screen
        onRefresh={onRefresh}
        refreshing={refreshing}
        // Only the coachmark cares where the header is.
        scrollProps={
          showCoachmark
            ? {
                scrollEventThrottle: 16,
                onScroll: (event) => setHeaderInView(event.nativeEvent.contentOffset.y <= 4),
              }
            : undefined
        }>
        <DashboardHeader
          // Known from the session, so the greeting never waits on the page data.
          name={firstName(user?.name) ?? firstName(account.name) ?? ''}
          addButtonRef={addButtonRef}
        />

        {data ? (
          <>
            <BalanceOverviewCard
              balanceOverview={data.balanceOverview}
              balanceTrend={data.balanceTrend}
            />
            {data.tip ? (
              <QuickTipCard
                primaryAction={{ label: data.tip.actionLabel, href: data.tip.href as Href }}>
                {data.tip.prefix}
                <Text
                  font="displayItalic"
                  size="xl"
                  color={palette.coral600}
                  style={{ lineHeight: 27 }}>
                  {data.tip.emphasis}
                </Text>
                {data.tip.suffix}
              </QuickTipCard>
            ) : null}
            <View style={{ gap: 20 }}>
              <GoalsCard goals={data.goals} />
              <UpcomingCard upcomingItems={data.upcomingItems} />
              <DashboardTransactionsTable transactions={data.recentTransactions} />
            </View>
          </>
        ) : query.isError ? (
          <Card style={{ gap: 12 }}>
            <Text font="display" size="2xl" tight>
              {pt ? 'Não foi possível carregar' : 'Could not load the dashboard'}
            </Text>
            <Text size="sm" color="ink3">
              {query.error.message}
            </Text>
            <Button
              label={pt ? 'Tentar de novo' : 'Try again'}
              loading={query.isFetching}
              onPress={() => query.refetch()}
              style={{ alignSelf: 'flex-start', marginTop: 4 }}
            />
          </Card>
        ) : (
          <DashboardSkeleton />
        )}
      </Screen>

      <FirstStepCoachmark
        active={showCoachmark}
        anchorRef={addButtonRef}
        anchorInView={headerInView}
      />
    </View>
  );
}
