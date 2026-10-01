import { Check, ReceiptText } from 'lucide-react-native';
import { useState } from 'react';
import { View } from 'react-native';

import { useApiAction, useApiQuery } from '@/api/hooks';
import { Button } from '@/components/ui/button';
import { DateInput } from '@/components/ui/date-input';
import { FormField } from '@/components/ui/form-field';
import { Modal } from '@/components/ui/modal';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { Select } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Text } from '@/components/ui/text';
import { toast } from '@/components/ui/toast';
import { formatCapitalizedDate } from '@/lib/i18n/format';
import { useI18n } from '@/lib/i18n/provider';
import { dateInputValue } from '@/lib/transactions/transaction-utils';
import { useTheme } from '@/theme/theme-provider';
import { radius } from '@/theme/tokens';

type CardBillModalProps = {
  cardId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/**
 * Details of a card's open statement bill, with the manual "mark as paid"
 * flow: the user flips the status to Paid, picks the paying account and the
 * payment date, and the bill settles (deducting that account's balance).
 */
export function CardBillModal({ cardId, onOpenChange, open }: CardBillModalProps) {
  const { formatCurrency, locale, messages } = useI18n();
  const { colors } = useTheme();
  const context = useApiQuery('cards.billContext', [cardId], { enabled: open });
  const payBill = useApiAction('cards.payBill');
  const [status, setStatus] = useState<'Unpaid' | 'Paid'>('Unpaid');
  // Null until the user picks one: the bill's preferred account applies.
  const [pickedAccountId, setPickedAccountId] = useState<string | null>(null);
  const [paymentDate, setPaymentDate] = useState(() => dateInputValue(new Date()));

  // Re-opening resets the form to a fresh bill view (render-phase reset).
  const [wasOpen, setWasOpen] = useState(false);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setStatus('Unpaid');
      setPickedAccountId(null);
      setPaymentDate(dateInputValue(new Date()));
    }
  }

  // Every opening shows the bill as it is now, never a cached one.
  const data = context.isFetching ? undefined : context.data;
  const bill = data?.ok ? data.bill : null;
  const accounts = data?.ok ? data.accounts : [];
  const failure = context.isFetching
    ? null
    : data && !data.ok
      ? data.message
      : (context.error?.message ?? null);

  const accountId =
    pickedAccountId ??
    bill?.autoDebitAccountId ??
    accounts.find((account) => account.isPrimary)?.id ??
    accounts[0]?.id ??
    '';

  const dueLabel = bill
    ? formatCapitalizedDate(new Date(`${bill.dueDate}T12:00:00`), locale, {
        day: 'numeric',
        month: 'short',
      })
    : '';
  const autoDebitAccountName = bill?.autoDebitAccountId
    ? accounts.find((account) => account.id === bill.autoDebitAccountId)?.name
    : undefined;
  const canSubmit =
    Boolean(bill) &&
    status === 'Paid' &&
    accountId.length > 0 &&
    /^\d{4}-\d{2}-\d{2}$/.test(paymentDate) &&
    !payBill.pending;

  const handleSubmit = async () => {
    if (!bill || !canSubmit) return;

    try {
      const result = await payBill.run({ cardId: bill.cardId, accountId, paymentDate });
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success(messages.cardsPage.billPaid);
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : String(error));
    }
  };

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={messages.cardsPage.billDetail}
      footer={
        <>
          <Button
            variant="outline"
            size="lg"
            style={{ flex: 1 }}
            label={messages.common.cancel}
            onPress={() => onOpenChange(false)}
          />
          <Button
            size="lg"
            style={{ flex: 1 }}
            icon={(props) => <Check {...props} />}
            label={messages.cardsPage.markAsPaid}
            disabled={!canSubmit}
            loading={payBill.pending}
            onPress={handleSubmit}
          />
        </>
      }>
      {failure ? (
        <View style={{ alignItems: 'center', gap: 12, paddingVertical: 24 }}>
          <Text size="sm" color="ink3" align="center">
            {failure}
          </Text>
          <Button
            variant="outline"
            label={locale === 'pt-BR' ? 'Tentar de novo' : 'Try again'}
            onPress={() => void context.refetch()}
          />
        </View>
      ) : !data ? (
        <View style={{ gap: 20 }}>
          <Skeleton height={76} rounded={radius.lg} />
          <Skeleton height={36} rounded={radius.pill} />
        </View>
      ) : !bill ? (
        <Text size="sm" color="ink3" align="center" style={{ paddingVertical: 24 }}>
          {messages.cardsPage.noBalanceDue}
        </Text>
      ) : (
        <View style={{ gap: 20 }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
              padding: 16,
              borderRadius: radius.lg,
              borderWidth: 1,
              borderColor: colors.line,
              backgroundColor: colors.surface1,
            }}>
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: radius.lg,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: colors.accentSoft,
              }}>
              <ReceiptText size={20} color={colors.accentSoftFg} />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text font="sansMedium" size="sm" numberOfLines={1}>
                {messages.cardsPage.billTitle(bill.cardName)}
              </Text>
              {bill.last4 ? (
                <Text font="mono" size="xs" color="ink3" style={{ marginTop: 2 }}>
                  {`···· ${bill.last4}`}
                </Text>
              ) : null}
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text font="monoMedium" size="lg">
                {formatCurrency(bill.amount)}
              </Text>
              <View
                style={{
                  marginTop: 4,
                  height: 24,
                  paddingHorizontal: 10,
                  borderRadius: radius.pill,
                  justifyContent: 'center',
                  backgroundColor: bill.overdue ? colors.negativeSoft : colors.surface2,
                }}>
                <Text
                  font={bill.overdue ? 'sansSemiBold' : 'sansMedium'}
                  size="xs"
                  color={bill.overdue ? 'negativeFg' : 'ink2'}>
                  {bill.overdue ? messages.cardsPage.billOverdue : messages.cardsPage.due(dueLabel)}
                </Text>
              </View>
            </View>
          </View>

          {bill.autoDebit && autoDebitAccountName ? (
            <Text size="xs" color="ink3">
              {messages.cardsPage.billAutoDebitNote(autoDebitAccountName)}
            </Text>
          ) : null}

          <FormField label={messages.transactions.status}>
            <SegmentedControl
              accessibilityLabel={messages.transactions.status}
              options={[
                { value: 'Unpaid', label: messages.transactions.statuses.Unpaid },
                { value: 'Paid', label: messages.transactions.statuses.Paid },
              ]}
              value={status}
              onValueChange={setStatus}
            />
          </FormField>

          {status === 'Paid' ? (
            <View style={{ gap: 16 }}>
              <FormField label={messages.cardsPage.autoDebitAccount}>
                <Select
                  accessibilityLabel={messages.cardsPage.autoDebitAccount}
                  placeholder={messages.cardsPage.chooseAccount}
                  value={accountId}
                  onValueChange={setPickedAccountId}
                  options={accounts.map((account) => ({ value: account.id, label: account.name }))}
                  style={{ backgroundColor: colors.surface1 }}
                />
              </FormField>
              <FormField label={messages.transactions.paymentDate}>
                <DateInput
                  accessibilityLabel={messages.transactions.paymentDate}
                  value={paymentDate}
                  onChange={setPaymentDate}
                  style={{ backgroundColor: colors.surface1 }}
                />
              </FormField>
            </View>
          ) : null}
        </View>
      )}
    </Modal>
  );
}
