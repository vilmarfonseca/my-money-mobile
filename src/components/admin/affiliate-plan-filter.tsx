import { SegmentedControl } from '@/components/ui/segmented-control';
import type { AffiliatePlanFilter as PlanFilter } from '@/lib/admin/affiliates-queries';
import { useI18n } from '@/lib/i18n/provider';

/**
 * Narrows the affiliates dashboard's conversions to the plan the invitee
 * bought. The web keeps it in the `?plan=` param; here it is screen state.
 */
export function AffiliatePlanFilter({
  onChange,
  value,
}: {
  onChange: (value: PlanFilter) => void;
  value: PlanFilter;
}) {
  const { messages } = useI18n();
  const t = messages.admin.affiliates.planFilter;

  const options: ReadonlyArray<{ label: string; value: PlanFilter }> = [
    { label: t.all, value: 'all' },
    { label: messages.billing.tierNames.plus, value: 'plus' },
    { label: messages.billing.tierNames.premium, value: 'premium' },
  ];

  return (
    <SegmentedControl
      size="lg"
      accessibilityLabel={t.label}
      options={options}
      value={value}
      onValueChange={onChange}
    />
  );
}
