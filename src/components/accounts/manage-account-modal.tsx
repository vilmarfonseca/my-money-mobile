import { AlertTriangle, Check, Trash2 } from 'lucide-react-native';
import { useState } from 'react';
import { View } from 'react-native';

import { useApiAction } from '@/api/hooks';
import { PrimaryAccountRow } from '@/components/accounts/primary-account-row';
import {
  emptySavingsDraft,
  interestModeForLabel,
  isSavingsRateValid,
  savingsRateValue,
  SavingsFields,
  type SavingsDraft,
} from '@/components/accounts/savings-fields';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ColorPickerButton } from '@/components/ui/color-picker-button';
import { CurrencyInput, currencyDigitsToAmount } from '@/components/ui/currency-input';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { Sheet } from '@/components/ui/sheet';
import { Text } from '@/components/ui/text';
import { toast } from '@/components/ui/toast';
import { bankToneHexes, type Bank } from '@/lib/accounts/accounts-data';
import { hexToRgb } from '@/lib/colors';
import { useI18n } from '@/lib/i18n/provider';
import { useTheme } from '@/theme/theme-provider';
import { radius } from '@/theme/tokens';

function toDigits(balance: number | undefined) {
  return balance === undefined ? '' : String(Math.round(balance * 100));
}

type ManageAccountModalProps = {
  bank: Bank | null;
  onOpenChange: (open: boolean) => void;
  open: boolean;
};

export function ManageAccountModal({ bank, onOpenChange, open }: ManageAccountModalProps) {
  const { locale, messages } = useI18n();
  const { colors } = useTheme();
  const isPtBR = locale === 'pt-BR';
  const updateAccount = useApiAction('accounts.update');
  const deleteAccount = useApiAction('accounts.delete');
  const isPending = updateAccount.pending;
  const isDeleting = deleteAccount.pending;
  const [bankName, setBankName] = useState('');
  const [nickname, setNickname] = useState('');
  const [color, setColor] = useState(bankToneHexes.plum);
  const [isPrimary, setIsPrimary] = useState(false);
  const [checkingDigits, setCheckingDigits] = useState('');
  const [savingsDrafts, setSavingsDrafts] = useState<SavingsDraft[]>([{ ...emptySavingsDraft }]);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  // Re-seed the form each time the modal opens for a (possibly different)
  // bank, adjusting state during render instead of in an effect.
  const [openKey, setOpenKey] = useState<string | null>(null);
  const renderKey = open && bank ? `open:${bank.id}` : null;
  if (openKey !== renderKey) {
    setOpenKey(renderKey);
    if (open && bank) {
      setBankName(bank.name);
      setNickname(bank.nickname ?? '');
      setColor(bank.color ?? bankToneHexes[bank.tone]);
      setIsPrimary(bank.isPrimary);
      setCheckingDigits(toDigits(bank.checking?.balance));
      // One entry per existing savings account, plus a blank one to fill in
      // when the bank has none yet.
      setSavingsDrafts(
        bank.savingsAccounts.length > 0
          ? bank.savingsAccounts.map((account) => ({
              label: account.savingsLabel ?? 'poupanca',
              rate: account.apy === null ? '' : String(account.apy),
              balanceDigits: toDigits(account.balance),
            }))
          : [{ ...emptySavingsDraft }],
      );
      setConfirmingDelete(false);
    }
  }

  if (!bank) return null;

  // `border-negative/30`
  const warning = hexToRgb(colors.negative);

  // Entries past the ones already on file are new accounts for this bank; a
  // checking balance on a bank without one adds that account too.
  const existingSavings = bank.savingsAccounts.length;
  const addedSavings = savingsDrafts
    .slice(existingSavings)
    .filter((draft) => draft.balanceDigits.trim() !== '');
  const addsChecking = !bank.checking && checkingDigits.trim() !== '';
  const ratesValid = savingsDrafts
    .filter((draft, index) => index < existingSavings || draft.balanceDigits.trim() !== '')
    .every(isSavingsRateValid);
  const canSubmit = ratesValid && bankName.trim().length > 0 && !isPending;

  const submit = async () => {
    if (!canSubmit) return;

    const balances = [
      bank.checking
        ? { accountId: bank.checking.id, balance: currencyDigitsToAmount(checkingDigits) }
        : null,
      ...bank.savingsAccounts.map((account, index) => ({
        accountId: account.id,
        balance: currencyDigitsToAmount(savingsDrafts[index]?.balanceDigits ?? ''),
      })),
    ].filter((entry) => entry !== null);

    try {
      const result = await updateAccount.run({
        accountIds: bank.accounts.map((account) => account.id),
        name: bankName,
        nickname,
        tone: color,
        isPrimary,
        balances,
        savings: bank.savingsAccounts.map((account, index) => {
          const draft = savingsDrafts[index];
          return {
            accountId: account.id,
            label: isPtBR ? draft.label : account.savingsLabel,
            mode: interestModeForLabel(draft.label, isPtBR),
            rate: savingsRateValue(draft),
          };
        }),
        addChecking: addsChecking ? { balance: currencyDigitsToAmount(checkingDigits) } : undefined,
        addSavings:
          addedSavings.length > 0
            ? addedSavings.map((draft) => ({
                balance: currencyDigitsToAmount(draft.balanceDigits),
                label: isPtBR ? draft.label : null,
                mode: interestModeForLabel(draft.label, isPtBR),
                rate: savingsRateValue(draft),
              }))
            : undefined,
      });

      if (result.ok) {
        toast.success(messages.accountsPage.accountUpdated);
        onOpenChange(false);
      } else {
        toast.error(result.message);
      }
    } catch {
      // The request itself failed (offline, server error).
      toast.error(messages.accountsPage.updateFailed);
    }
  };

  const remove = async () => {
    try {
      const result = await deleteAccount.run({
        accountIds: bank.accounts.map((account) => account.id),
      });
      if (result.ok) {
        toast.success(messages.accountsPage.accountDeleted);
        setConfirmingDelete(false);
        onOpenChange(false);
      } else {
        toast.error(result.message);
      }
    } catch {
      toast.error(messages.accountsPage.deleteFailed);
    }
  };

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={messages.accountsPage.manageTitle}
      description={messages.accountsPage.manageDescription}
      footer={
        <>
          <Button
            variant="outline"
            size="lg"
            label={messages.common.cancel}
            disabled={isPending}
            onPress={() => onOpenChange(false)}
          />
          <Button
            size="lg"
            style={{ flex: 1 }}
            icon={(props) => <Check {...props} />}
            label={
              isPending
                ? `${messages.accountsPage.savingChanges}…`
                : messages.accountsPage.saveChanges
            }
            loading={isPending}
            disabled={!canSubmit}
            onPress={submit}
          />
        </>
      }>
      <Card variant="solid" rounded={radius.xl} style={{ gap: 16 }}>
        <FormField label={messages.accountsPage.bank}>
          <Input
            accessibilityLabel={messages.accountsPage.bank}
            value={bankName}
            onChangeText={setBankName}
            maxLength={40}
          />
        </FormField>

        <FormField label={messages.accountsPage.nicknameLabel}>
          <Input
            accessibilityLabel={messages.accountsPage.nicknameLabel}
            value={nickname}
            onChangeText={setNickname}
            maxLength={40}
          />
        </FormField>

        {/* A workspace always has exactly one primary account, so the flag can
            only be handed over, never switched off: on the primary account the
            control is locked, and on any other it promotes this one. */}
        <PrimaryAccountRow
          checked={isPrimary}
          disabled={bank.isPrimary || isPending}
          hint={
            bank.isPrimary
              ? messages.accountsPage.primaryAccountLocked
              : messages.accountsPage.primaryAccountPromote
          }
          onCheckedChange={setIsPrimary}
        />

        <FormField label={messages.accountsPage.accountColor}>
          <ColorPickerButton color={color} onChange={setColor} />
        </FormField>

        <FormField label={messages.accountsPage.checking}>
          <CurrencyInput
            accessibilityLabel={messages.accountsPage.checking}
            value={checkingDigits}
            onValueChange={setCheckingDigits}
          />
        </FormField>

        <SavingsFields
          drafts={savingsDrafts}
          lockedCount={existingSavings}
          onChange={setSavingsDrafts}
        />
      </Card>

      {/* The web footer holds delete, cancel and save side by side; a phone's
          action bar only fits two, so delete sits under the form instead. */}
      <Button
        variant="ghost"
        size="lg"
        disabled={isPending}
        icon={({ size }) => <Trash2 size={size} color={colors.negativeFg} />}
        onPress={() => setConfirmingDelete(true)}>
        <Text font="sansMedium" size="sm" color="negativeFg">
          {messages.accountsPage.deleteAccount}
        </Text>
      </Button>

      <Sheet
        open={confirmingDelete}
        onOpenChange={(next) => {
          if (!isDeleting) setConfirmingDelete(next);
        }}
        title={messages.accountsPage.deleteAccountTitle}
        footer={
          <>
            <Button
              variant="outline"
              size="lg"
              label={messages.common.cancel}
              disabled={isDeleting}
              onPress={() => setConfirmingDelete(false)}
            />
            <Button
              size="lg"
              style={{ flex: 1, backgroundColor: colors.negative }}
              icon={({ size }) => <Trash2 size={size} color="#ffffff" />}
              loading={isDeleting}
              onPress={remove}>
              <Text font="sansMedium" size="sm" color="#ffffff" numberOfLines={1}>
                {isDeleting
                  ? `${messages.accountsPage.deleting}…`
                  : messages.accountsPage.deleteAccountConfirm}
              </Text>
            </Button>
          </>
        }>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'flex-start',
            gap: 12,
            padding: 16,
            borderRadius: radius.xl,
            borderWidth: 1,
            borderColor: `rgba(${warning.r}, ${warning.g}, ${warning.b}, 0.3)`,
            backgroundColor: colors.negativeSoft,
          }}>
          <AlertTriangle size={20} color={colors.negativeFg} style={{ marginTop: 2 }} />
          <Text size="sm" color="negativeFg" style={{ flex: 1, lineHeight: 22 }}>
            {messages.accountsPage.deleteAccountWarning(bank.name)}
          </Text>
        </View>
      </Sheet>
    </Modal>
  );
}
