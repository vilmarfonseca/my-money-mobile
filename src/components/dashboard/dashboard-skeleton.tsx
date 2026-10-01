import { View } from 'react-native';

import { Card } from '@/components/ui/card';
import { Skeleton, SkeletonCard } from '@/components/ui/skeleton';

/** Placeholder for everything under the header while `dashboard.page` loads. */
export function DashboardSkeleton() {
  return (
    <View accessibilityRole="progressbar">
      <Card style={{ marginBottom: 16 }}>
        <Skeleton width="55%" height={12} />
        <Skeleton width="70%" height={48} style={{ marginTop: 12 }} />
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 16 }}>
          <Skeleton width={140} height={28} rounded={14} />
          <Skeleton width={110} height={28} rounded={14} />
        </View>
        <Skeleton height={96} style={{ marginTop: 16 }} />
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 16 }}>
          <Skeleton height={76} style={{ flex: 1 }} />
          <Skeleton height={76} style={{ flex: 1 }} />
          <Skeleton height={76} style={{ flex: 1 }} />
        </View>
      </Card>
      <View style={{ gap: 20 }}>
        <SkeletonCard lines={5} height={18} />
        <SkeletonCard lines={4} />
        <SkeletonCard lines={5} />
        <SkeletonCard lines={8} height={20} />
      </View>
    </View>
  );
}
