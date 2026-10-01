import { View } from 'react-native';

import { usePullToRefresh, useScreenQuery } from '@/api/hooks';
import { useEntitlements } from '@/components/billing/entitlements-provider';
import { UpgradeGate } from '@/components/billing/upgrade-gate';
import { CalendarClient } from '@/components/calendar/calendar-client';
import { useCalendarStrings } from '@/components/calendar/calendar-strings';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Screen } from '@/components/ui/screen';
import { Skeleton, SkeletonCard } from '@/components/ui/skeleton';
import { Text } from '@/components/ui/text';
import { useI18n } from '@/lib/i18n/provider';
import { radius } from '@/theme/tokens';

export default function CalendarScreen() {
  const { features } = useEntitlements();

  // The calendar is plan-gated. The data lives in its own component so the
  // query is never mounted (nor refetched on focus) without the feature.
  if (!features.calendarPage) {
    return (
      <Screen contentStyle={{ flexGrow: 1 }}>
        <UpgradeGate feature="calendarPage" />
      </Screen>
    );
  }

  return <CalendarPage />;
}

function CalendarPage() {
  const query = useScreenQuery('calendar.page', []);
  const { onRefresh, refreshing } = usePullToRefresh(query);

  return (
    <Screen onRefresh={onRefresh} refreshing={refreshing}>
      {query.data ? (
        <CalendarClient dueItems={query.data.items} referenceDate={query.data.referenceDate} />
      ) : query.isError ? (
        <CalendarLoadError onRetry={() => void query.refetch()} retrying={query.isFetching} />
      ) : (
        <CalendarPageSkeleton />
      )}
    </Screen>
  );
}

function CalendarLoadError({ onRetry, retrying }: { onRetry: () => void; retrying: boolean }) {
  const { messages } = useI18n();
  const strings = useCalendarStrings();

  return (
    <View>
      <PageHeader title={messages.calendar.title} description={messages.calendar.description} />
      <Card style={{ alignItems: 'center', gap: 16 }}>
        <Text size="sm" color="ink2" align="center">
          {strings.loadFailed}
        </Text>
        <Button label={strings.retry} variant="outline" loading={retrying} onPress={onRetry} />
      </Card>
    </View>
  );
}

function CalendarPageSkeleton() {
  const { messages } = useI18n();

  return (
    <View>
      <PageHeader
        title={messages.calendar.title}
        description={messages.calendar.description}
        actions={<Skeleton height={42} rounded={radius.pill} />}
      />
      <View style={{ gap: 16 }}>
        <Skeleton height={36} rounded={radius.pill} />
        <View style={{ flexDirection: 'row', gap: 10 }}>
          {Array.from({ length: 3 }, (_, index) => (
            <Skeleton key={index} height={76} rounded={radius.xl} style={{ flex: 1 }} />
          ))}
        </View>
        <Card padding={14}>
          <View style={{ gap: 4 }}>
            {Array.from({ length: 5 }, (_, row) => (
              <View key={row} style={{ flexDirection: 'row', gap: 4 }}>
                {Array.from({ length: 7 }, (_, column) => (
                  <Skeleton
                    key={column}
                    height="auto"
                    width="auto"
                    style={{ flex: 1, aspectRatio: 1 }}
                  />
                ))}
              </View>
            ))}
          </View>
        </Card>
        <SkeletonCard lines={6} />
      </View>
    </View>
  );
}
