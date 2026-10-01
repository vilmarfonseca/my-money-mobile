import { useState } from 'react';
import { View } from 'react-native';

import { DateRangePicker } from '@/components/date-range-picker';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { useI18n } from '@/lib/i18n/provider';
import type { FilterPeriod } from '@/lib/period-window';

/** A page's period selection: what the web keeps in `?period=&from=&to=`. */
export type PeriodSelection = {
  period: FilterPeriod;
  from?: string;
  to?: string;
};

/**
 * Screen state for the period filter. Spread `query` into the page's API
 * call and pass `selection`/`onChange` to `<PeriodFilter>`.
 */
export function usePeriodSelection(defaultPeriod: FilterPeriod = 'month') {
  const [selection, setSelection] = useState<PeriodSelection>({ period: defaultPeriod });
  const query =
    selection.period === 'custom'
      ? { period: selection.period, from: selection.from, to: selection.to }
      : { period: selection.period };
  return { onChange: setSelection, query, selection };
}

/**
 * Page-level period filter: month / quarter / YTD / custom, with a date-range
 * picker under it while "custom" is active.
 */
export function PeriodFilter({
  ariaLabel,
  onChange,
  selection,
}: {
  ariaLabel: string;
  onChange: (selection: PeriodSelection) => void;
  selection: PeriodSelection;
}) {
  const { messages } = useI18n();
  const options: ReadonlyArray<{ label: string; value: FilterPeriod }> = [
    { label: messages.common.month, value: 'month' },
    { label: messages.common.quarter, value: 'quarter' },
    { label: messages.common.ytd, value: 'ytd' },
    { label: messages.common.custom, value: 'custom' },
  ];

  return (
    <View style={{ gap: 12 }}>
      <SegmentedControl
        size="lg"
        accessibilityLabel={ariaLabel}
        options={options}
        value={selection.period}
        onValueChange={(period) =>
          onChange(
            period === 'custom'
              ? { period, from: selection.from, to: selection.to }
              : { period },
          )
        }
      />
      {selection.period === 'custom' ? (
        <DateRangePicker
          from={selection.from}
          to={selection.to}
          onApply={(range) => onChange({ period: 'custom', ...range })}
        />
      ) : null}
    </View>
  );
}
