import { ChevronLeft, ChevronRight, Search } from 'lucide-react-native';
import { useState, type ReactNode } from 'react';
import { Pressable, ScrollView, View } from 'react-native';

import { IconButton } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { Text } from '@/components/ui/text';
import { useI18n } from '@/lib/i18n/provider';
import { useTheme } from '@/theme/theme-provider';
import { radius } from '@/theme/tokens';

type SortValue = number | string;

export type DataTableFilter<T> = {
  label: string;
  value: string;
  predicate: (item: T) => boolean;
};

type DataTableProps<T> = {
  title: string;
  data: readonly T[];
  getRowKey: (item: T) => string;
  /** One list entry. With `mobileListStyle="rows"` it sits inside a shared card. */
  renderMobileCard: (item: T) => ReactNode;
  /** "cards": each item its own card. "rows": divided rows in one glass card. */
  mobileListStyle?: 'cards' | 'rows';
  /** Order of the list; the web's `initialSort` column, as a value accessor. */
  initialSort?: { sortValue: (item: T) => SortValue; direction: 'asc' | 'desc' };
  searchPlaceholder: string;
  searchPredicate: (item: T, query: string) => boolean;
  filters: Array<DataTableFilter<T>>;
  periodLabel?: string;
  periodFilters?: readonly string[];
  /**
   * An item's date. When given, a Month/Quarter/Year control filters to the
   * trailing 1/3/12 months counted from the most recent item.
   */
  periodValue?: (item: T) => Date;
  emptyMessage: string;
  /** Shown instead of the list when the source data itself is empty. */
  emptyState?: ReactNode;
  /** Extra controls above the search field. */
  headerControls?: ReactNode;
  onRowClick?: (item: T) => void;
  totalLabel: string;
  /** A node, or a function computing the total from the rows currently shown. */
  totalValue: ReactNode | ((items: readonly T[]) => ReactNode);
  initialPageSize?: number;
  showFilters?: boolean;
  showPagination?: boolean;
  showPeriodFilter?: boolean;
  showSearch?: boolean;
  showTotal?: boolean;
};

/** Trailing-month window for each period option, by position. */
const periodMonths = [1, 3, 12];

function getPageItems(current: number, total: number, maxFlat = 5): Array<number | 'ellipsis'> {
  if (total <= maxFlat) return Array.from({ length: total }, (_, index) => index + 1);
  const items: Array<number | 'ellipsis'> = [1];
  const left = Math.max(2, current - 1);
  const right = Math.min(total - 1, current + 1);
  if (left > 2) items.push('ellipsis');
  for (let page = left; page <= right; page++) items.push(page);
  if (right < total - 1) items.push('ellipsis');
  items.push(total);
  return items;
}

/**
 * The phone presentation of the web app's `DataTable`: a titled list with
 * search, filter chips, an optional trailing-period control, a total row and
 * pagination. There are no columns here; each item renders as a card or row.
 */
export function DataTable<T>({
  data,
  emptyMessage,
  emptyState,
  filters,
  getRowKey,
  headerControls,
  initialPageSize = 5,
  initialSort,
  mobileListStyle = 'cards',
  onRowClick,
  periodFilters,
  periodLabel,
  periodValue,
  renderMobileCard,
  searchPlaceholder,
  searchPredicate,
  showFilters = true,
  showPagination = true,
  showPeriodFilter = true,
  showSearch = true,
  showTotal = true,
  title,
  totalLabel,
  totalValue,
}: DataTableProps<T>) {
  const { messages } = useI18n();
  const { colors } = useTheme();
  const periods = periodFilters ?? [
    messages.common.month,
    messages.common.quarter,
    messages.common.year,
  ];
  const [activeFilter, setActiveFilter] = useState(filters[0]?.value ?? '');
  // Default to the widest window so the list shows everything up front.
  const [period, setPeriod] = useState(periods[periods.length - 1] ?? '');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);

  const activeFilterItem = filters.find((filter) => filter.value === activeFilter);

  let periodData = data;
  if (periodValue && showPeriodFilter) {
    let max = -Infinity;
    for (const item of data) max = Math.max(max, periodValue(item).getTime());
    if (Number.isFinite(max)) {
      const cutoff = new Date(max);
      cutoff.setMonth(cutoff.getMonth() - (periodMonths[periods.indexOf(period)] ?? 12));
      const cutoffMs = cutoff.getTime();
      periodData = data.filter((item) => periodValue(item).getTime() >= cutoffMs);
    }
  }

  const normalizedQuery = query.trim().toLowerCase();
  const filtered = periodData.filter(
    (item) =>
      (activeFilterItem?.predicate(item) ?? true) &&
      (normalizedQuery.length === 0 || searchPredicate(item, normalizedQuery)),
  );

  const sorted = initialSort
    ? [...filtered].sort((a, b) => {
        const left = initialSort.sortValue(a);
        const right = initialSort.sortValue(b);
        const modifier = initialSort.direction === 'asc' ? 1 : -1;
        return typeof left === 'number' && typeof right === 'number'
          ? (left - right) * modifier
          : String(left).localeCompare(String(right)) * modifier;
      })
    : filtered;

  const pageSize = initialPageSize;
  const pageCount = Math.max(1, Math.ceil(sorted.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const pageStart = showPagination ? (currentPage - 1) * pageSize : 0;
  const visible = showPagination ? sorted.slice(pageStart, pageStart + pageSize) : sorted;
  const visibleStart = sorted.length === 0 ? 0 : pageStart + 1;
  const visibleEnd = Math.min(pageStart + pageSize, sorted.length);
  const renderedTotal = typeof totalValue === 'function' ? totalValue(sorted) : totalValue;
  const showEmptyState = Boolean(emptyState) && data.length === 0;

  const rows = visible.map((item, index) => {
    const body = renderMobileCard(item);
    const divider =
      mobileListStyle === 'rows' && index > 0
        ? { borderTopWidth: 1, borderTopColor: colors.line }
        : null;
    return onRowClick ? (
      <Pressable
        key={getRowKey(item)}
        accessibilityRole="button"
        onPress={() => onRowClick(item)}
        style={({ pressed }) => [divider, { opacity: pressed ? 0.7 : 1 }]}>
        {body}
      </Pressable>
    ) : (
      <View key={getRowKey(item)} style={divider}>
        {body}
      </View>
    );
  });

  const empty =
    visible.length === 0 ? (
      <View
        style={[
          { padding: 16 },
          mobileListStyle === 'cards' && {
            borderRadius: radius.lg,
            borderWidth: 1,
            borderColor: colors.line,
            backgroundColor: colors.control,
          },
        ]}>
        <Text size="sm" color="ink3" align="center">
          {emptyMessage}
        </Text>
      </View>
    ) : null;

  return (
    <View style={{ gap: 12 }}>
      <Text font="display" size="2xl" tight style={{ paddingHorizontal: 6 }}>
        {title}
      </Text>

      {showEmptyState ? (
        <Card>{emptyState}</Card>
      ) : (
        <>
          {showPeriodFilter && periodValue ? (
            <SegmentedControl
              accessibilityLabel={periodLabel}
              options={periods.map((label) => ({ label, value: label }))}
              value={period}
              onValueChange={(value) => {
                setPeriod(value);
                setPage(1);
              }}
            />
          ) : null}

          {headerControls}

          {showSearch ? (
            <Input
              accessibilityLabel={searchPlaceholder}
              autoCapitalize="none"
              autoCorrect={false}
              placeholder={searchPlaceholder}
              value={query}
              onChangeText={(text) => {
                setQuery(text);
                setPage(1);
              }}
              leading={<Search size={16} color={colors.ink2} />}
              containerStyle={{ backgroundColor: colors.surface1 }}
            />
          ) : null}

          {showFilters && filters.length > 0 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8, paddingHorizontal: 6 }}
              style={{ marginHorizontal: -6 }}>
              {filters.map((filter) => {
                const active = filter.value === activeFilter;
                return (
                  <Pressable
                    key={filter.value}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    onPress={() => {
                      setActiveFilter(filter.value);
                      setPage(1);
                    }}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 6,
                      height: 32,
                      paddingHorizontal: 12,
                      borderRadius: radius.pill,
                      borderWidth: 1,
                      borderColor: active ? 'transparent' : colors.controlBorder,
                      backgroundColor: active ? colors.action : colors.control,
                    }}>
                    <Text
                      font="sansSemiBold"
                      size="xs"
                      color={active ? 'actionForeground' : 'ink2'}>
                      {filter.label}
                    </Text>
                    <Text
                      font="mono"
                      size="xs"
                      color={active ? 'actionForeground' : 'ink3'}
                      style={{ opacity: active ? 0.75 : 1 }}>
                      {periodData.filter((item) => filter.predicate(item)).length}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          ) : null}

          {mobileListStyle === 'rows' ? (
            <Card padding={0} style={{ paddingHorizontal: 8, paddingVertical: 6 }}>
              {rows}
              {empty}
              {showTotal ? (
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'baseline',
                    justifyContent: 'space-between',
                    gap: 16,
                    paddingHorizontal: 8,
                    paddingTop: 14,
                    paddingBottom: 8,
                    borderTopWidth: 1,
                    borderTopColor: colors.line,
                  }}>
                  <Text font="sansSemiBold" size="2xs" color="ink3" uppercase tracking={0.6}>
                    {totalLabel}
                  </Text>
                  <TotalValue display>{renderedTotal}</TotalValue>
                </View>
              ) : null}
            </Card>
          ) : (
            <View style={{ gap: 12 }}>
              {rows}
              {empty}
              {showTotal ? (
                <Card
                  variant="control"
                  padding={16}
                  style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
                  <Text font="sansMedium" size="sm" color="ink3">
                    {totalLabel}
                  </Text>
                  <TotalValue>{renderedTotal}</TotalValue>
                </Card>
              ) : null}
            </View>
          )}

          {showPagination && sorted.length > pageSize ? (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingHorizontal: 6,
              }}>
              <Text font="mono" size="xs" color="ink3">
                {messages.table.visibleOf(visibleStart, visibleEnd, sorted.length)}
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <IconButton
                  accessibilityLabel={messages.table.previousPage}
                  variant="outline"
                  size={32}
                  disabled={currentPage === 1}
                  icon={(props) => <ChevronLeft {...props} />}
                  onPress={() => setPage(Math.max(1, currentPage - 1))}
                />
                {getPageItems(currentPage, pageCount).map((item, index) =>
                  item === 'ellipsis' ? (
                    <Text key={`ellipsis-${index}`} font="mono" size="xs" color="ink3" style={{ width: 20 }} align="center">
                      …
                    </Text>
                  ) : (
                    <Pressable
                      key={item}
                      accessibilityRole="button"
                      accessibilityState={{ selected: item === currentPage }}
                      onPress={() => setPage(item)}
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 16,
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderWidth: 1,
                        borderColor: item === currentPage ? 'transparent' : colors.controlBorder,
                        backgroundColor: item === currentPage ? colors.action : colors.control,
                      }}>
                      <Text
                        font="mono"
                        size="xs"
                        color={item === currentPage ? 'actionForeground' : 'ink1'}>
                        {item}
                      </Text>
                    </Pressable>
                  ),
                )}
                <IconButton
                  accessibilityLabel={messages.table.nextPage}
                  variant="outline"
                  size={32}
                  disabled={currentPage === pageCount}
                  icon={(props) => <ChevronRight {...props} />}
                  onPress={() => setPage(Math.min(pageCount, currentPage + 1))}
                />
              </View>
            </View>
          ) : null}
        </>
      )}
    </View>
  );
}

function TotalValue({ children, display }: { children: ReactNode; display?: boolean }) {
  if (typeof children !== 'string' && typeof children !== 'number') return <>{children}</>;
  return display ? (
    <Text font="display" size="2xl" tight>
      {children}
    </Text>
  ) : (
    <Text font="monoSemiBold" size="base">
      {children}
    </Text>
  );
}
