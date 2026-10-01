import { useState } from 'react';
import { View } from 'react-native';

import { PageHeader, PageHeaderAddLink } from '@/components/page-header';
import { typeLabels, viewOptions } from '@/lib/calendar/calendar-style';
import {
  addDays,
  addMonths,
  addYears,
  dateKey,
  formatTitle,
  getWeekDays,
  groupItemsByDate,
  isSameMonth,
  itemDate,
  parseDate,
  sortItems,
  startOfWeek,
} from '@/lib/calendar/calendar-utils';
import type { CalendarView, DueItem, DueType } from '@/lib/calendar/types';
import { useI18n } from '@/lib/i18n/provider';

import { CalendarNav } from './calendar-nav';
import { useDueTypeLabels } from './calendar-strings';
import { DueListView } from './due-list-view';
import { MonthView } from './month-view';
import { SummaryCards } from './summary-cards';
import { TypeFilters } from './type-filters';
import { ViewSwitcher } from './view-switcher';
import { WeekView } from './week-view';
import { YearView } from './year-view';

type CalendarClientProps = {
  dueItems: DueItem[];
  referenceDate: string;
};

export function CalendarClient({ dueItems, referenceDate }: CalendarClientProps) {
  const { locale, messages } = useI18n();
  const labels = useDueTypeLabels();
  const today = parseDate(referenceDate);
  const [view, setView] = useState<CalendarView>('month');
  const [currentDate, setCurrentDate] = useState(today);
  const [selectedDate, setSelectedDate] = useState(today);
  const [activeType, setActiveType] = useState<DueType | 'all'>('all');
  const [query, setQuery] = useState('');

  const filteredItems = filterDueItems(dueItems, activeType, query, labels);
  const itemsByDate = groupItemsByDate(filteredItems);
  const selectedItems = itemsByDate[dateKey(selectedDate)] ?? [];
  const visibleItems = getVisibleItems({ currentDate, filteredItems, view });

  const sortedVisibleItems = sortItems(visibleItems);
  const outgoing = visibleItems
    .filter((item) => item.amount < 0)
    .reduce((sum, item) => sum + Math.abs(item.amount), 0);
  const incoming = visibleItems
    .filter((item) => item.amount > 0)
    .reduce((sum, item) => sum + item.amount, 0);
  const nextDue = sortItems(
    filteredItems.filter((item) => itemDate(item) >= currentDate && item.amount < 0),
  )[0];

  const handleShift = (direction: -1 | 1) => {
    const nextDate = getShiftedDate(currentDate, view, direction);

    setCurrentDate(nextDate);
    setSelectedDate(nextDate);
  };

  const selectDate = (date: Date) => {
    setCurrentDate(date);
    setSelectedDate(date);
  };

  const nav = (
    <CalendarNav
      title={formatTitle(view, currentDate, locale, messages.calendar.upcomingFrom)}
      onPrevious={() => handleShift(-1)}
      onNext={() => handleShift(1)}
      onToday={() => selectDate(today)}
    />
  );

  return (
    <View>
      <PageHeader
        title={messages.calendar.title}
        description={messages.calendar.description}
        mobileAction={
          <PageHeaderAddLink href="/transactions/new" ariaLabel={messages.common.addTransaction} />
        }
        actions={
          <ViewSwitcher
            options={viewOptions.map((option) => ({
              label: messages.calendar[option.value],
              value: option.value,
            }))}
            value={view}
            onValueChange={setView}
            accessibilityLabel={messages.calendar.view}
          />
        }
      />
      <TypeFilters
        activeType={activeType}
        onTypeChange={setActiveType}
        query={query}
        onQueryChange={setQuery}
      />
      <SummaryCards
        visibleItemsCount={visibleItems.length}
        outgoing={outgoing}
        incoming={incoming}
        nextDue={nextDue}
      />

      {/* The month view hosts the nav inside its card (design). */}
      {view !== 'month' ? <View style={{ marginBottom: 16 }}>{nav}</View> : null}

      {view === 'year' && (
        <YearView
          currentDate={currentDate}
          itemsByDate={itemsByDate}
          onOpenMonth={(date) => {
            selectDate(date);
            setView('month');
          }}
        />
      )}

      {view === 'month' && (
        <MonthView
          currentDate={currentDate}
          selectedDate={selectedDate}
          today={today}
          itemsByDate={itemsByDate}
          selectedItems={selectedItems}
          onSelectDate={selectDate}
          mobileNav={nav}
        />
      )}

      {view === 'week' && (
        <WeekView
          currentDate={currentDate}
          selectedDate={selectedDate}
          today={today}
          itemsByDate={itemsByDate}
          selectedItems={selectedItems}
          onSelectDate={selectDate}
        />
      )}

      {view === 'due' && <DueListView items={sortedVisibleItems} currentDate={currentDate} />}
    </View>
  );
}

function filterDueItems(
  items: DueItem[],
  activeType: DueType | 'all',
  query: string,
  labels: Record<DueType, string>,
) {
  const normalizedQuery = query.trim().toLowerCase();

  return items.filter((item) => {
    const matchesType = activeType === 'all' || item.type === activeType;
    // The web matches the English type name only; the chips show the
    // localized one, so that is searchable here too.
    const matchesQuery =
      normalizedQuery.length === 0 ||
      [item.title, item.account, item.note, typeLabels[item.type], labels[item.type]]
        .join(' ')
        .toLowerCase()
        .includes(normalizedQuery);

    return matchesType && matchesQuery;
  });
}

function getVisibleItems({
  currentDate,
  filteredItems,
  view,
}: {
  currentDate: Date;
  filteredItems: DueItem[];
  view: CalendarView;
}) {
  if (view === 'year') {
    return filteredItems.filter(
      (item) => itemDate(item).getFullYear() === currentDate.getFullYear(),
    );
  }

  if (view === 'week') {
    const days = getWeekDays(currentDate).map(dateKey);
    return filteredItems.filter((item) => days.includes(item.date));
  }

  if (view === 'due') {
    const start = startOfWeek(currentDate);
    const end = addDays(start, 45);
    return filteredItems.filter((item) => {
      const date = itemDate(item);
      return date >= start && date <= end;
    });
  }

  return filteredItems.filter((item) => isSameMonth(itemDate(item), currentDate));
}

function getShiftedDate(date: Date, view: CalendarView, direction: -1 | 1) {
  if (view === 'year') {
    return addYears(date, direction);
  }

  if (view === 'month' || view === 'due') {
    return addMonths(date, direction);
  }

  return addDays(date, direction * 7);
}
