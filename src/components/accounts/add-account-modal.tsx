import { Check, Plus } from 'lucide-react-native';
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
import { Text } from '@/components/ui/text';
import { toast } from '@/components/ui/toast';
import { bankToneHexes } from '@/lib/accounts/accounts-data';
import { useI18n } from '@/lib/i18n/provider';
import { useTheme } from '@/theme/theme-provider';
import { radius } from '@/theme/tokens';

type AddAccountModalProps = {
  /** True when the workspace has no accounts yet: this one becomes primary. */
  isFirstAccount?: boolean;
  onOpenChange: (open: boolean) => void;
  open: boolean;
};

/**
 * Sibling of `ManageAccountModal` for a bank the workspace does not track yet.
 * The savings settings stay hidden until a savings balance is entered, so the
 * common case — a single checking account — is a three-field form.
 */
export function AddAccountModal({ isFirstAccount = false, onOpenChange, open }: AddAccountModalProps) {
  const { locale, messages } = useI18n();
  const { colors } = useTheme();
  const isPtBR = locale === 'pt-BR';
  const createAccount = useApiAction('accounts.create');
  const isPending = createAccount.pending;
  const [bankName, setBankName] = useState('');
  const [nickname, setNickname] = useState('');
  const [color, setColor] = useState(bankToneHexes.plum);
  const [isPrimary, setIsPrimary] = useState(false);
  const [checkingDigits, setCheckingDigits] = useState('');
  const [savingsDrafts, setSavingsDrafts] = useState<SavingsDraft[]>([{ ...emptySavingsDraft }]);

  // Blank the form each time the modal opens, during render rather than in an
  // effect — the same pattern the manage modal uses to re-seed itself.
  const [wasOpen, setWasOpen] = useState(false);
  if (wasOpen !== open) {
    setWasOpen(open);
    if (open) {
      setBankName('');
      setNickname('');
      setColor(bankToneHexes.plum);
      setIsPrimary(false);
      setCheckingDigits('');
      setSavingsDrafts([{ ...emptySavingsDraft }]);
    }
  }

  const hasChecking = checkingDigits.trim() !== '';
  // Only entries with a balance become accounts; a blank row is the form's
  // invitation to add one, not a savings account of zero.
  const filledSavings = savingsDrafts.filter((draft) => draft.balanceDigits.trim() !== '');
  const ratesValid = filledSavings.every(isSavingsRateValid);
  const canSubmit =
    bankName.trim().length > 0 && (hasChecking || filledSavings.length > 0) && ratesValid && !isPending;

  const submit = async () => {
    if (!canSubmit) return;

    try {
      const result = await createAccount.run({
        name: bankName,
        nickname,
        tone: color,
        isPrimary,
        checkingBalance: hasChecking ? currencyDigitsToAmount(checkingDigits) : null,
        savings: filledSavings.map((draft) => ({
          balance: currencyDigitsToAmount(draft.balanceDigits),
          label: isPtBR ? draft.label : null,
          mode: interestModeForLabel(draft.label, isPtBR),
          rate: savingsRateValue(draft),
        })),
      });

      if (result.ok) {
        toast.success(messages.accountsPage.accountCreated);
        onOpenChange(false);
      } else {
        toast.error(result.message);
      }
    } catch {
      // The request itself failed (offline, server error).
      toast.error(messages.accountsPage.createFailed);
    }
  };

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={messages.accountsPage.addTitle}
      description={messages.accountsPage.addDescription}
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
                ? `${messages.accountsPage.addingAccount}…`
                : messages.accountsPage.addAccountConfirm
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

        <FormField label={messages.accountsPage.nicknameLabel} optional>
          <Input
            accessibilityLabel={messages.accountsPage.nicknameLabel}
            value={nickname}
            onChangeText={setNickname}
            maxLength={40}
          />
        </FormField>

        {/* The very first account is the primary one by definition, so the
            control is locked on; later ones can be promoted on creation. */}
        <PrimaryAccountRow
          checked={isFirstAccount || isPrimary}
          disabled={isFirstAccount || isPending}
          hint={
            isFirstAccount
              ? messages.accountsPage.primaryAccountFirst
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

        <SavingsFields drafts={savingsDrafts} onChange={setSavingsDrafts} />

        {!hasChecking && filledSavings.length === 0 ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Plus size={14} color={colors.ink3} />
            <Text size="xs" color="ink3" style={{ flex: 1 }}>
              {messages.accountsPage.createNeedsBalance}
            </Text>
          </View>
        ) : null}
      </Card>
    </Modal>
  );
}
