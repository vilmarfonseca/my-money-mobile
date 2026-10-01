import { X } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

import { Card } from '@/components/ui/card';
import { Chip, chipColors, type ChipTone } from '@/components/ui/chip';
import { Separator } from '@/components/ui/separator';
import { Text } from '@/components/ui/text';
import type {
  ExpenseCategoryBreakdown,
  ExpenseOverview,
  SelectedExpenseCategory,
} from '@/lib/expenses/expenses-queries';
import { localizeExpenseCategory } from '@/lib/i18n/labels';
import { useI18n } from '@/lib/i18n/provider';
import { useTheme } from '@/theme/theme-provider';
import { radius } from '@/theme/tokens';
import { resolveColor } from '@/theme/tones';

type SpendingOverviewCardProps = {
  overview: ExpenseOverview;
  categories: ExpenseCategoryBreakdown[];
  selected?: SelectedExpenseCategory | null;
  /** Sets the page's category filter (the web's `?category=`); null clears it. */
  onSelectCategory: (name: string | null) => void;
  /** Dims the card while the page reloads for a new filter. */
  pending?: boolean;
};

function HeroChip({ label, tone }: { label: string; tone: ChipTone | 'control' }) {
  const { colors } = useTheme();
  // `bg-control text-ink-2`: the one hero chip that is not a status tone.
  const palette =
    tone === 'control' ? { bg: colors.control, fg: colors.ink2 } : chipColors(tone, colors);

  return (
    <Chip color={{ bg: palette.bg, fg: palette.fg }} style={{ flexShrink: 1 }}>
      <Text
        font="sansSemiBold"
        size="xs"
        color={palette.fg}
        numberOfLines={1}
        style={{ flexShrink: 1 }}>
        {label}
      </Text>
    </Chip>
  );
}

/**
 * Hero spending card ("legenda viva" design): the stacked bar and its legend
 * pills are the category filter. Pressing one scopes the whole page to that
 * category, pressing it again (or the clear pill) resets it.
 */
export function SpendingOverviewCard({
  overview,
  categories,
  selected = null,
  onSelectCategory,
  pending = false,
}: SpendingOverviewCardProps) {
  const { formatCurrency, locale, messages, splitCurrencyParts } = useI18n();
  const { colors } = useTheme();

  const setCategory = (name: string | null) =>
    onSelectCategory(name && name !== selected?.name ? name : null);

  const heroTotal = selected ? selected.amount : overview.total;
  const { whole, decimal, cents } = splitCurrencyParts(heroTotal);
  const count = selected ? selected.count : overview.transactionCount;
  const countLabel = `${count} ${
    count === 1 ? messages.common.transaction : messages.common.transactions
  }`;
  const note = selected
    ? selected.largest
      ? messages.expenses.largestEntry(
          selected.largest.merchant,
          formatCurrency(selected.largest.amount),
        )
      : null
    : overview.note;

  return (
    <Card padding={24} style={{ marginBottom: 20, opacity: pending ? 0.7 : 1 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        {selected ? (
          <View
            style={{
              width: 10,
              height: 10,
              borderRadius: 5,
              backgroundColor: resolveColor(selected.chartColor, colors),
            }}
          />
        ) : null}
        <Text
          font="sansMedium"
          size="xs"
          color="ink3"
          uppercase
          tracking={1.2}
          numberOfLines={1}
          style={{ flexShrink: 1 }}>
          {selected
            ? `${localizeExpenseCategory(selected.name, locale)} · ${overview.periodLabel}`
            : messages.expenses.overviewLabel(overview.periodLabel)}
        </Text>
      </View>

      <Text
        font="display"
        size="6xl"
        tight
        numberOfLines={1}
        adjustsFontSizeToFit
        style={{ marginTop: 12 }}>
        {whole}
        <Text font="display" size="3xl" color="ink3">
          {decimal}
          {cents}
        </Text>
      </Text>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 16 }}>
        {selected ? (
          <>
            <HeroChip label={selected.delta} tone={selected.deltaUp ? 'warm' : 'positive'} />
            <HeroChip label={countLabel} tone="control" />
            <HeroChip
              label={messages.expenses.shareOfSpend(`${selected.percent.toFixed(1)}%`)}
              tone="accent"
            />
          </>
        ) : (
          <>
            <HeroChip label={overview.delta} tone="warm" />
            <HeroChip label={countLabel} tone="control" />
            <HeroChip
              label={messages.expenses.budgetLeft(formatCurrency(overview.budgetLeft))}
              tone="positive"
            />
          </>
        )}
      </View>

      {/* A dashed-divider row inside the hero card. */}
      <Separator dashed style={{ marginTop: 24 }} />
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          gap: 16,
          paddingTop: 16,
        }}>
        <View>
          <Text font="sansMedium" size="xs" color="ink3" uppercase tracking={1.2}>
            {selected ? messages.expenses.avgPerEntry : messages.expenses.dailyAverage}
          </Text>
          <Text font="display" size="3xl" tight style={{ marginTop: 8 }}>
            {formatCurrency(selected ? selected.avgPerTransaction : overview.dailyAverage)}
          </Text>
        </View>
        {note ? (
          <Text size="xs" color="ink3" align="right" style={{ flex: 1, marginBottom: 2 }}>
            {note}
          </Text>
        ) : null}
      </View>

      <View style={{ marginTop: 24 }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            marginBottom: 10,
          }}>
          <Text font="sansMedium" size="xs" color="ink3" uppercase tracking={1.2}>
            {messages.expenses.composition}
          </Text>
          {selected ? (
            <Pressable
              accessibilityRole="button"
              hitSlop={8}
              onPress={() => setCategory(null)}
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
                height: 28,
                paddingHorizontal: 12,
                borderRadius: radius.pill,
                borderWidth: 1,
                borderColor: colors.lineStrong,
                backgroundColor: colors.surface1,
                opacity: pressed ? 0.7 : 1,
              })}>
              <Text font="sansMedium" size="xs" color="ink2">
                {messages.expenses.allCategories}
              </Text>
              <X size={12} color={colors.ink2} />
            </Pressable>
          ) : null}
        </View>

        <View
          style={{
            flexDirection: 'row',
            height: 12,
            borderRadius: 6,
            overflow: 'hidden',
            backgroundColor: colors.surface2,
          }}>
          {categories.map((category) => {
            const isOn = selected?.name === category.name;
            const name = localizeExpenseCategory(category.name, locale);
            return (
              <Pressable
                key={category.id}
                accessibilityRole="button"
                accessibilityLabel={name}
                accessibilityState={{ selected: isOn }}
                hitSlop={{ top: 12, bottom: 12 }}
                onPress={() => setCategory(category.name)}
                style={{
                  width: `${category.percent}%`,
                  backgroundColor: resolveColor(category.chartColor, colors),
                  opacity: selected && !isOn ? 0.2 : 1,
                }}
              />
            );
          })}
        </View>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
          {categories.map((category) => {
            const isOn = selected?.name === category.name;
            return (
              <Pressable
                key={category.id}
                accessibilityRole="button"
                accessibilityState={{ selected: isOn }}
                onPress={() => setCategory(category.name)}
                style={({ pressed }) => ({
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 8,
                  maxWidth: '100%',
                  height: 32,
                  paddingHorizontal: 12,
                  borderRadius: radius.pill,
                  borderWidth: 1,
                  borderColor: isOn ? 'transparent' : colors.line,
                  backgroundColor: isOn ? colors.action : colors.surface1,
                  opacity: pressed ? 0.7 : selected && !isOn ? 0.45 : 1,
                })}>
                <View
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: 5,
                    backgroundColor: resolveColor(category.chartColor, colors),
                  }}
                />
                <Text
                  font="sansMedium"
                  size="xs"
                  color={isOn ? 'actionForeground' : 'ink1'}
                  numberOfLines={1}
                  style={{ flexShrink: 1, maxWidth: 160 }}>
                  {localizeExpenseCategory(category.name, locale)}
                </Text>
                <Text
                  font="mono"
                  size="xs"
                  color={isOn ? 'actionForeground' : 'ink3'}
                  style={{ opacity: isOn ? 0.6 : 1 }}>
                  {formatCurrency(category.amount)}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </Card>
  );
}
