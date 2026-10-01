import { Redirect, useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';

import { usePullToRefresh, useScreenQuery } from '@/api/hooks';
import { AffiliateConversionsTable } from '@/components/admin/affiliate-conversions-table';
import { AdminKpiCards } from '@/components/admin/kpi-cards';
import { AdminLoadError } from '@/components/admin/load-error';
import { PageHeader } from '@/components/page-header';
import { Screen } from '@/components/ui/screen';
import { SkeletonCard } from '@/components/ui/skeleton';
import { formatCommissionTotals } from '@/lib/admin/commission-totals';
import { useI18n } from '@/lib/i18n/provider';
import { useBootstrap } from '@/providers/app-data-provider';

/**
 * Admin-only: one affiliate's payment ledger. Lists every paid conversion
 * with its commission and due date, and records which ones were paid.
 * Non-admins are sent home; an unknown affiliate shows the API's 404.
 */
export default function AdminAffiliateRoute() {
  const { isAdmin } = useBootstrap();
  if (!isAdmin) return <Redirect href="/dashboard" />;
  return <AdminAffiliateScreen />;
}

function AdminAffiliateScreen() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const { locale, messages } = useI18n();
  const t = messages.admin.affiliates.detail;
  const query = useScreenQuery('admin.affiliateDetail', [userId]);
  const { onRefresh, refreshing } = usePullToRefresh(query);
  const detail = query.data?.detail;

  return (
    <Screen onRefresh={onRefresh} refreshing={refreshing}>
      <PageHeader
        backHref="/admin/affiliates"
        titlePrefix={t.titlePrefix}
        title={detail ? (detail.affiliate.name ?? detail.affiliate.email) : ''}
        description={t.description}
      />
      {query.data && detail ? (
        <>
          <AdminKpiCards
            cards={[
              {
                label: t.kpis.commissionOwed,
                value: formatCommissionTotals(detail.totals.commissionOwed, locale),
                note: t.kpis.allTime,
                surface: 'glass',
              },
              {
                label: t.kpis.commissionPaid,
                value: formatCommissionTotals(detail.totals.commissionPaid, locale),
                note: t.kpis.allTime,
                surface: 'solid',
              },
              {
                label: t.kpis.commission,
                value: formatCommissionTotals(detail.totals.commission, locale),
                note: t.kpis.allTime,
                surface: 'solid',
              },
            ]}
          />
          {/* The route stays mounted between affiliates: start each ledger's
              search, filter and page afresh. */}
          <AffiliateConversionsTable
            key={detail.affiliate.userId}
            affiliateUserId={detail.affiliate.userId}
            asOf={query.data.asOf}
            conversions={detail.conversions}
          />
        </>
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
