import { PeriodFilter, type PeriodSelection } from '@/components/period-filter';
import { useI18n } from '@/lib/i18n/provider';

/**
 * Page-level spending filter. The web keeps the choice in the `?period=`
 * param; here the screen owns it (`usePeriodSelection`).
 */
export function ExpensePeriodFilter({
  onChange,
  selection,
}: {
  onChange: (selection: PeriodSelection) => void;
  selection: PeriodSelection;
}) {
  const { messages } = useI18n();
  return (
    <PeriodFilter ariaLabel={messages.expenses.period} selection={selection} onChange={onChange} />
  );
}
