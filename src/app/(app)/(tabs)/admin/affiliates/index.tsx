import { keepPreviousData } from '@tanstack/react-query';
import { Redirect } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { usePullToRefresh, useScreenQuery } from '@/api/hooks';
import { AffiliatePlanFilter } from '@/components/admin/affiliate-plan-filter';
import { AffiliatesKpis } from '@/components/admin/affiliates-kpis';
import { AffiliatesTable } from '@/components/admin/affiliates-table';
import { AdminLoadError } from '@/components/admin/load-error';
import { PageHeader } from '@/components/page-header';
import { PeriodFilter, usePeriodSelection } from '@/components/period-filter';
import { Screen } from '@/components/ui/screen';
import { SkeletonCard } from '@/components/ui/skeleton';
import type { AffiliatePlanFilter as PlanFilter } from '@/lib/admin/affiliates-queries';
import { useI18n } from '@/lib/i18n/provider';
import { useBootstrap } from '@/providers/app-data-provider';

/**
 * Admin-only: referral performance per inviter, filtered by the same period
 * control as the finance pages and by the plan the invitee bought, with the
 * commission each affiliate earned and what is still to be paid.
 * Non-admins get a 404 on the web; here they are sent home, and the API
 * rejects them either way.
 */
export default function AdminAffiliatesRoute() {
  const { isAdmin } = useBootstrap();
  if (!isAdmin) return <Redirect href="/dashboard" />;
  return <AdminAffiliatesScreen />;
}

function AdminAffiliatesScreen() {
  const { messages } = useI18n();
  const t = messages.admin.affiliates;
  const period = usePeriodSelection();
  const [plan, setPlan] = useState<PlanFilter>('all');
  // The numbers on screen stay (dimmed) while a new filter loads, as the
  // web page does during its transition.
  const query = useScreenQuery('admin.affiliates', [{ ...period.query, plan }], {
    placeholderData: keepPreviousData,
  });
  const { onRefresh, refreshing } = usePullToRefresh(query);
  const data = query.data;

  return (
    <Screen onRefresh={onRefresh} refreshing={refreshing}>
      <PageHeader
        titlePrefix={t.titlePrefix}
        title={t.title}
        description={t.description}
        actions={
          <View style={{ gap: 12 }}>
            <AffiliatePlanFilter value={plan} onChange={setPlan} />
            <PeriodFilter
              ariaLabel={t.period}
              selection={period.selection}
              onChange={period.onChange}
            />
          </View>
        }
      />
      {data ? (
        <View style={{ opacity: query.isPlaceholderData ? 0.7 : 1 }}>
          <AffiliatesKpis asOf={data.asOf} plan={data.plan} totals={data.totals} />
          <AffiliatesTable asOf={data.asOf} rows={data.rows} />
        </View>
      ) : query.isError ? (
        <AdminLoadError message={query.error.message} onRetry={() => query.refetch()} />
      ) : (
        <View style={{ gap: 16 }}>
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard lines={6} />
        </View>
      )}
    </Screen>
  );
}
