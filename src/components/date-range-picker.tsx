import { CalendarDays, ChevronDown } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Calendar, type DateRangeValue } from '@/components/ui/calendar';
import { Sheet } from '@/components/ui/sheet';
import { Text } from '@/components/ui/text';
import { formatDateParam, formatDateRangeLabel, parseDateRangeParams } from '@/lib/date-range';
import { useI18n } from '@/lib/i18n/provider';
import { useTheme } from '@/theme/theme-provider';
import { radius } from '@/theme/tokens';

/** Pill that shows the custom range and opens a calendar sheet to change it. */
export function DateRangePicker({
  from,
  onApply,
  to,
}: {
  from?: string;
  to?: string;
  onApply: (range: { from?: string; to?: string }) => void;
}) {
  const { locale, messages } = useI18n();
  const { colors } = useTheme();
  const parsed = parseDateRangeParams({ from, to });
  const [open, setOpen] = useState(false);
  const [range, setRange] = useState<DateRangeValue>({});

  const updateOpen = (next: boolean) => {
    if (next) setRange({ from: parsed.from ?? undefined, to: parsed.to ?? undefined });
    setOpen(next);
  };

  return (
    <>
      <Pressable
        accessibilityRole="button"
        onPress={() => updateOpen(true)}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          height: 40,
          paddingHorizontal: 16,
          borderRadius: radius.pill,
          borderWidth: 1,
          borderColor: colors.controlBorder,
          backgroundColor: colors.control,
        }}>
        <CalendarDays size={16} color={colors.ink3} />
        <Text size="sm" color="ink2" numberOfLines={1} style={{ flex: 1 }}>
          {formatDateRangeLabel(parsed.from, parsed.to, locale)}
        </Text>
        <ChevronDown size={16} color={colors.ink3} />
      </Pressable>

      <Sheet
        open={open}
        onOpenChange={updateOpen}
        title={messages.periods.customRange}
        description={messages.periods.selectRange}
        footer={
          <>
            <Button
              variant="outline"
              label={messages.common.clear}
              onPress={() => {
                onApply({});
                setOpen(false);
              }}
            />
            <Button
              style={{ flex: 1 }}
              label={messages.common.apply}
              disabled={!range.from || !range.to}
              onPress={() => {
                onApply({
                  from: range.from ? formatDateParam(range.from) : undefined,
                  to: range.to ? formatDateParam(range.to) : undefined,
                });
                setOpen(false);
              }}
            />
          </>
        }>
        <Calendar mode="range" selected={range} onSelect={setRange} />
        <View style={{ paddingTop: 12 }}>
          <Text size="xs" color="ink3">
            {formatDateRangeLabel(range.from ?? null, range.to ?? null, locale)}
          </Text>
        </View>
      </Sheet>
    </>
  );
}
