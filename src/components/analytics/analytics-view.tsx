import { SlidersHorizontal } from 'lucide-react-native';
import { useState, type ReactNode } from 'react';
import { View } from 'react-native';

import { ANALYTICS_WIDGETS, AnalyticsCardChip } from '@/components/analytics/analytics-widgets';
import { CustomizeAnalyticsModal } from '@/components/analytics/customize-analytics-modal';
import { PageHeader } from '@/components/page-header';
import { IconButton } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton, SkeletonCard } from '@/components/ui/skeleton';
import { Text } from '@/components/ui/text';
import {
  ANALYTICS_CATALOG,
  ANALYTICS_SECTION_IDS,
  type AnalyticsCardId,
} from '@/lib/analytics/analytics-catalog';
import type { AnalyticsPageData } from '@/lib/analytics/analytics-queries';
import { useI18n } from '@/lib/i18n/provider';
import { radius } from '@/theme/tokens';

/**
 * The page app bar with the period control under it. `onCustomize` is left
 * out while the page is still loading: there is no selection to edit yet.
 */
export function AnalyticsPageHeader({
  onCustomize,
  periodFilter,
}: {
  onCustomize?: () => void;
  periodFilter: ReactNode;
}) {
  const { messages } = useI18n();
  return (
    <PageHeader
      title={messages.nav.analytics}
      description={messages.analytics.description}
      mobileAction={
        <IconButton
          accessibilityLabel={messages.analytics.customize}
          variant="action"
          icon={(props) => <SlidersHorizontal {...props} />}
          disabled={!onCustomize}
          onPress={onCustomize}
        />
      }
      actions={periodFilter}
    />
  );
}

/**
 * Body of the Analytics page: header with range filter + customize, pinned
 * KPI strip, and the visible card sections. Card data arrives fully computed
 * from the server; this component only handles the customize modal.
 */
export function AnalyticsView({
  data,
  onApplySelection,
  periodFilter,
  selected,
}: {
  data: AnalyticsPageData;
  /** The user picked a new card set in the customize modal. */
  onApplySelection: (ids: AnalyticsCardId[]) => void;
  /** The page's `<PeriodFilter>`; its state lives in the screen. */
  periodFilter: ReactNode;
  selected: AnalyticsCardId[];
}) {
  const { messages, formatCurrency } = useI18n();
  const m = messages.analytics;
  const [isCustomizeOpen, setIsCustomizeOpen] = useState(false);

  const selectedSet = new Set(selected);
  const kpis = buildKpis(data, m, formatCurrency);

  return (
    <>
      <AnalyticsPageHeader
        periodFilter={periodFilter}
        onCustomize={() => setIsCustomizeOpen(true)}
      />

      {/* KPI strip — always pinned above the customizable sections. */}
      <View style={{ gap: 10 }}>
        {[kpis.slice(0, 2), kpis.slice(2)].map((row, index) => (
          <View key={index} style={{ flexDirection: 'row', gap: 10 }}>
            {row.map((kpi) => (
              <Card key={kpi.label} rounded={radius.md} style={{ flex: 1 }}>
                <Text font="sansSemiBold" size={10.5} color="ink3" uppercase tracking={0.5}>
                  {kpi.label}
                </Text>
                <Text
                  font="display"
                  size={27}
                  tight
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.6}
                  style={{ marginTop: 6 }}>
                  {kpi.value}
                </Text>
                {kpi.delta ? (
                  <Text
                    size={11}
                    color={
                      kpi.tone === 'pos' ? 'positiveFg' : kpi.tone === 'neg' ? 'negativeFg' : 'ink3'
                    }
                    style={{ marginTop: 6 }}>
                    {kpi.delta}
                  </Text>
                ) : null}
              </Card>
            ))}
          </View>
        ))}
      </View>

      {ANALYTICS_SECTION_IDS.map((sectionId) => {
        const cards = ANALYTICS_CATALOG.filter(
          (card) => card.section === sectionId && selectedSet.has(card.id),
        );
        if (!cards.length) return null;
        return (
          <View key={sectionId}>
            <Text
              accessibilityRole="header"
              font="display"
              size="3xl"
              tracking={-0.75}
              style={{ marginTop: 28, marginBottom: 14 }}>
              {m.sections[sectionId]}
            </Text>
            <View style={{ gap: 14 }}>
              {cards.map((card) => {
                const Widget = ANALYTICS_WIDGETS[card.id];
                const text = m.cards[card.id];
                return (
                  <Card key={card.id} rounded={radius.md}>
                    <Text font="mono" size={10} color="ink3" uppercase tracking={1.4}>
                      {text.eyebrow}
                    </Text>
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'flex-start',
                        justifyContent: 'space-between',
                        gap: 14,
                        marginTop: 4,
                      }}>
                      <Text
                        accessibilityRole="header"
                        font="display"
                        size="2xl"
                        tracking={-0.6}
                        style={{ flex: 1, lineHeight: 30 }}>
                        {text.title}
                      </Text>
                      <AnalyticsCardChip id={card.id} data={data} />
                    </View>
                    <Text size="xs" color="ink3" style={{ marginTop: 8, lineHeight: 19.5 }}>
                      {text.description}
                    </Text>
                    {card.id === 'sankey' ? (
                      <Text font="mono" size={11} color="ink3" style={{ marginTop: 8 }}>
                        {m.sankeyCaption(
                          data.rangeLabel,
                          formatCurrency(Math.round(data.sankey.totalIn)),
                          data.sankey.targetCount,
                        )}
                      </Text>
                    ) : null}
                    <View style={{ marginTop: 16 }}>
                      <Widget data={data} />
                    </View>
                  </Card>
                );
              })}
            </View>
          </View>
        );
      })}

      <CustomizeAnalyticsModal
        open={isCustomizeOpen}
        onOpenChange={setIsCustomizeOpen}
        selected={selected}
        onApply={onApplySelection}
      />
    </>
  );
}

/** Placeholder for the KPI strip and the first cards while the page loads. */
export function AnalyticsPageSkeleton() {
  return (
    <View style={{ gap: 14 }}>
      <View style={{ gap: 10 }}>
        {[0, 1].map((row) => (
          <View key={row} style={{ flexDirection: 'row', gap: 10 }}>
            {[0, 1].map((tile) => (
              <Card key={tile} rounded={radius.md} style={{ flex: 1, gap: 10 }}>
                <Skeleton width="70%" height={10} />
                <Skeleton width="85%" height={26} />
                <Skeleton width="55%" height={10} />
              </Card>
            ))}
          </View>
        ))}
      </View>
      <Skeleton width="45%" height={30} style={{ marginTop: 14 }} />
      <SkeletonCard lines={5} />
      <SkeletonCard lines={4} />
    </View>
  );
}

type KpiCard = {
  label: string;
  value: string;
  delta: string | null;
  tone: 'pos' | 'neg' | 'neutral';
};

function buildKpis(
  data: AnalyticsPageData,
  m: ReturnType<typeof useI18n>['messages']['analytics'],
  formatCurrency: (value: number) => string,
): KpiCard[] {
  const { kpis } = data;
  return [
    {
      label: m.kpiNetWorth,
      value: formatCurrency(kpis.netWorth.value),
      delta:
        kpis.netWorth.momPct !== null
          ? `${kpis.netWorth.momPct >= 0 ? '↑' : '↓'} ${Math.abs(kpis.netWorth.momPct)}% ${m.momSuffix}`
          : null,
      tone: kpis.netWorth.momPct === null ? 'neutral' : kpis.netWorth.momPct >= 0 ? 'pos' : 'neg',
    },
    {
      label: m.kpiSaveRate,
      value: kpis.saveRate.value !== null ? `${kpis.saveRate.value}%` : '—',
      delta:
        kpis.saveRate.value !== null
          ? kpis.saveRate.value >= kpis.saveRate.target
            ? m.aboveTarget(kpis.saveRate.target)
            : m.belowTarget(kpis.saveRate.target)
          : null,
      tone:
        kpis.saveRate.value !== null && kpis.saveRate.value >= kpis.saveRate.target ? 'pos' : 'neg',
    },
    {
      label: m.kpiAvgIncome,
      value: formatCurrency(kpis.avgMonthlyIncome.value),
      delta:
        kpis.avgMonthlyIncome.delta !== null
          ? `${kpis.avgMonthlyIncome.delta >= 0 ? '↑' : '↓'} ${formatCurrency(Math.abs(Math.round(kpis.avgMonthlyIncome.delta)))} ${m.vsPriorPeriod}`
          : null,
      tone:
        kpis.avgMonthlyIncome.delta === null
          ? 'neutral'
          : kpis.avgMonthlyIncome.delta >= 0
            ? 'pos'
            : 'neg',
    },
    {
      label: m.kpiAvgSpend,
      value: formatCurrency(kpis.avgMonthlySpend.value),
      delta:
        kpis.avgMonthlySpend.deltaPct !== null
          ? `${kpis.avgMonthlySpend.deltaPct >= 0 ? '↑' : '↓'} ${Math.abs(kpis.avgMonthlySpend.deltaPct)}% ${m.vsPriorPeriod}`
          : null,
      tone:
        kpis.avgMonthlySpend.deltaPct === null
          ? 'neutral'
          : kpis.avgMonthlySpend.deltaPct > 0
            ? 'neg'
            : 'pos',
    },
  ];
}
