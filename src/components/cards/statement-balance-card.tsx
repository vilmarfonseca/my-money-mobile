import { useState, type ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import Svg, { Line } from 'react-native-svg';

import { CardBillModal } from '@/components/cards/card-bill-modal';
import { Card } from '@/components/ui/card';
import { ProgressBar } from '@/components/ui/progress-bar';
import { Text } from '@/components/ui/text';
import type { CardBill } from '@/lib/cards/card-bills';
import { nextDueDate, type getCardsScope } from '@/lib/cards/cards-data';
import { hexToRgb } from '@/lib/colors';
import { formatCapitalizedDate } from '@/lib/i18n/format';
import { useI18n } from '@/lib/i18n/provider';
import { useTheme } from '@/theme/theme-provider';
import { radius } from '@/theme/tokens';

type StatementBalanceCardProps = {
  /** Open statement bills for every card (unscoped). */
  bills: CardBill[];
  scope: ReturnType<typeof getCardsScope>;
  scopeLabel: string;
};

export function StatementBalanceCard({ bills, scope, scopeLabel }: StatementBalanceCardProps) {
  const { formatCurrency, locale, messages, splitCurrencyParts } = useI18n();
  const { colors } = useTheme();
  const [billOpen, setBillOpen] = useState(false);
  const { summary } = scope;
  const statement = splitCurrencyParts(summary.periodCharges);
  // The bill chip tracks the scoped cards: an overdue bill wins (red badge
  // from the due day), otherwise the next one due. Tapping opens the bill.
  const scopedCardIds = new Set(scope.cards.map((card) => card.id));
  const scopedBills = bills
    .filter((bill) => scopedCardIds.has(bill.cardId))
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  const activeBill = scopedBills.find((bill) => bill.overdue) ?? scopedBills[0] ?? null;
  const dateLabel = (date: Date) =>
    formatCapitalizedDate(date, locale, { day: 'numeric', month: 'short' });
  const activeBillDueLabel = activeBill
    ? dateLabel(new Date(`${activeBill.dueDate}T12:00:00`))
    : null;
  // All-cards view: the next due date across every scoped card, i.e. the
  // earliest open bill, or the earliest upcoming cycle when nothing is owed yet.
  const earliestCycle = scope.cards
    .map((card) => nextDueDate(card.dueDay))
    .filter((date): date is Date => date !== null)
    .sort((a, b) => a.getTime() - b.getTime())[0];
  const nextDueLabel = activeBillDueLabel ?? (earliestCycle ? dateLabel(earliestCycle) : null);
  const openBill = activeBill ? () => setBillOpen(true) : undefined;

  return (
    <Card padding={24} style={{ marginBottom: 20 }}>
      <View>
        <Text font="sansMedium" size="xs" color="ink3" uppercase tracking={1.2}>
          {messages.cardsPage.periodCharges(scopeLabel)}
        </Text>
        <Text
          font="display"
          size="5xl"
          tight
          numberOfLines={1}
          adjustsFontSizeToFit
          style={{ marginTop: 12 }}>
          {statement.whole}
          <Text font="display" size="3xl" tight color="ink3">
            {statement.decimal}
            {statement.cents}
          </Text>
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 16 }}>
          {scope.selectedCard ? (
            // A single card shows its own due date (red overdue state and the
            // bill amount when a bill is open).
            activeBill ? (
              <DuePill ring={activeBill.overdue} dot={activeBill.overdue} onPress={openBill}>
                {activeBill.overdue
                  ? messages.cardsPage.billOverdue
                  : messages.cardsPage.due(activeBillDueLabel ?? '')}
                <Text font="monoSemiBold" size="xs" color="negativeFg">
                  {`  ${formatCurrency(activeBill.amount)}`}
                </Text>
              </DuePill>
            ) : (
              <DuePill>{messages.cardsPage.due(scope.selectedCard.dueDate)}</DuePill>
            )
          ) : nextDueLabel ? (
            // Every card (or several): the soonest due date among them.
            <DuePill
              ring={Boolean(activeBill?.overdue)}
              dot={Boolean(activeBill?.overdue)}
              onPress={openBill}>
              {messages.cardsPage.nextDue}
              <Text font="monoSemiBold" size="xs" color="negativeFg">
                {`  ${nextDueLabel}`}
              </Text>
            </DuePill>
          ) : (
            <DuePill>{messages.cardsPage.noDueDate}</DuePill>
          )}
          <View
            style={{
              height: 28,
              paddingHorizontal: 12,
              borderRadius: radius.pill,
              justifyContent: 'center',
              backgroundColor: colors.accentSoft,
            }}>
            <Text font="sansSemiBold" size="xs" color="accentSoftFg" numberOfLines={1}>
              {scope.selectedCard
                ? messages.cardsPage.autopay[scope.selectedCard.autopay]
                : messages.cardsPage.mixedAutopay}
            </Text>
          </View>
        </View>
      </View>

      <View style={{ marginTop: 24 }}>
        <DashedRule color={colors.lineStrong} />
        <Text
          font="sansMedium"
          size="xs"
          color="ink3"
          uppercase
          tracking={1.2}
          style={{ marginTop: 16 }}>
          {messages.cardsPage.availableCredit}
        </Text>
        <Text font="display" size="2xl" tight style={{ marginTop: 8 }}>
          {formatCurrency(summary.availableCredit)}
        </Text>
        <Text size="xs" color="ink3" style={{ marginTop: 8 }}>
          {messages.cardsPage.usedOfLimit(summary.utilization, formatCurrency(summary.creditLimit))}
        </Text>
      </View>

      <View style={{ marginTop: 28 }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
            marginBottom: 8,
          }}>
          <Text font="sansMedium" size="xs" color="ink3" uppercase tracking={1.2}>
            {messages.cardsPage.utilization}
          </Text>
          <Text font="mono" size="xs" color="ink2" numberOfLines={1} style={{ flexShrink: 1 }}>
            {messages.cardsPage.usedAmount(formatCurrency(summary.currentBalance))}
          </Text>
        </View>
        <ProgressBar
          height={12}
          value={Math.min(summary.utilization, 100) / 100}
          style={{ backgroundColor: colors.surface2 }}
        />
        {/* The Mobile Cards design shows these as small pills. */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 }}>
          <InfoPill>
            {scope.selectedCard?.closingDateLabel
              ? messages.cardsPage.closes(scope.selectedCard.closingDateLabel)
              : (scope.selectedCard?.statementPeriod ?? messages.cardsPage.allStatements)}
          </InfoPill>
          <InfoPill>
            {`${summary.utilization}% ${messages.cardsPage.utilization.toLowerCase()}`}
          </InfoPill>
        </View>
      </View>

      {activeBill ? (
        <CardBillModal cardId={activeBill.cardId} open={billOpen} onOpenChange={setBillOpen} />
      ) : null}
    </Card>
  );
}

/** The red due-date chip; pressable when there is a bill to open. */
function DuePill({
  children,
  dot,
  onPress,
  ring,
}: {
  children: ReactNode;
  /** Leading status dot (an overdue bill). */
  dot?: boolean;
  onPress?: () => void;
  /** `ring-2 ring-negative-fg/30` around an overdue bill. */
  ring?: boolean;
}) {
  const { colors } = useTheme();
  const { r, g, b } = hexToRgb(colors.negativeFg);

  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : 'text'}
      disabled={!onPress}
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        height: 28,
        paddingHorizontal: 12,
        borderRadius: radius.pill,
        backgroundColor: colors.negativeSoft,
        boxShadow: ring ? `0 0 0 2px rgba(${r}, ${g}, ${b}, 0.3)` : undefined,
        opacity: pressed ? 0.8 : 1,
      })}>
      {dot ? (
        <View
          style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: colors.negativeFg }}
        />
      ) : null}
      <Text font="sansSemiBold" size="xs" color="negativeFg" numberOfLines={1}>
        {children}
      </Text>
    </Pressable>
  );
}

function InfoPill({ children }: { children: ReactNode }) {
  const { colors } = useTheme();
  return (
    <View
      style={{
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: radius.pill,
        backgroundColor: colors.surface2,
      }}>
      <Text size="xs" color="ink3">
        {children}
      </Text>
    </View>
  );
}

/** A dashed hairline (`border-t border-dashed`), which a view border cannot draw on one side. */
function DashedRule({ color }: { color: string }) {
  return (
    <Svg width="100%" height={1}>
      <Line x1="0" y1="0.5" x2="100%" y2="0.5" stroke={color} strokeWidth={1} strokeDasharray="4 3" />
    </Svg>
  );
}
