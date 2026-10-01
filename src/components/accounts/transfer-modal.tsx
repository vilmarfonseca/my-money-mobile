import { ArrowUpDown, Check, ChevronDown } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { useApiAction } from '@/api/hooks';
import { Button } from '@/components/ui/button';
import { CurrencyInput, currencyDigitsToAmount } from '@/components/ui/currency-input';
import { Modal } from '@/components/ui/modal';
import { Sheet } from '@/components/ui/sheet';
import { Text } from '@/components/ui/text';
import { toast } from '@/components/ui/toast';
import { interestRateLabel, type BankAccount } from '@/lib/accounts/accounts-data';
import type { AppLocale } from '@/lib/i18n/config';
import { useI18n } from '@/lib/i18n/provider';
import { useTheme } from '@/theme/theme-provider';
import { fonts, radius, shadows } from '@/theme/tokens';

const quickAmounts = [500, 1000, 3000];

type TransferModalProps = {
  accounts: BankAccount[];
  initialFromAccountId: string | null;
  onOpenChange: (open: boolean) => void;
  open: boolean;
};

export function TransferModal({
  accounts,
  initialFromAccountId,
  onOpenChange,
  open,
}: TransferModalProps) {
  const { formatCurrency, messages } = useI18n();
  const { colors } = useTheme();
  const transfer = useApiAction('accounts.transfer');
  const isPending = transfer.pending;
  const [fromId, setFromId] = useState<string | null>(initialFromAccountId);
  const [toId, setToId] = useState<string | null>(null);
  const [digits, setDigits] = useState('');

  // Reset the form each time the modal opens for a (possibly different) bank,
  // adjusting state during render instead of in an effect.
  const [openKey, setOpenKey] = useState<string | null>(null);
  const renderKey = open ? `open:${initialFromAccountId ?? ''}` : null;
  if (openKey !== renderKey) {
    setOpenKey(renderKey);
    if (open) {
      setFromId(initialFromAccountId);
      setToId(null);
      setDigits('');
    }
  }

  const from = accounts.find((account) => account.id === fromId) ?? null;
  const to = accounts.find((account) => account.id === toId) ?? null;
  const amount = currencyDigitsToAmount(digits);
  const canSubmit =
    Boolean(from && to && from.id !== to.id) &&
    amount > 0 &&
    amount <= (from?.balance ?? 0) &&
    !isPending;

  const swap = () => {
    setFromId(toId);
    setToId(fromId);
  };

  const submit = async () => {
    if (!from || !to || !canSubmit) return;

    try {
      const result = await transfer.run({
        fromAccountId: from.id,
        toAccountId: to.id,
        amount,
      });

      if (result.ok) {
        toast.success(
          messages.accountsPage.transferSuccess(formatCurrency(amount), from.label, to.label),
        );
        onOpenChange(false);
      } else {
        toast.error(result.message);
      }
    } catch {
      // The request itself failed (offline, server error).
      toast.error(messages.accountsPage.transferFailed);
    }
  };

  const quickAmountStyle = (disabled: boolean, pressed: boolean) => ({
    flex: 1,
    height: 36,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.controlBorder,
    backgroundColor: pressed ? colors.controlHover : colors.control,
    opacity: disabled ? 0.45 : 1,
  });

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={messages.accountsPage.transferTitle}
      footer={
        <Button
          size="lg"
          style={{ flex: 1 }}
          label={
            isPending
              ? `${messages.accountsPage.transferring}…`
              : messages.accountsPage.confirmTransfer
          }
          loading={isPending}
          disabled={!canSubmit}
          onPress={submit}
        />
      }>
      <View style={{ gap: 8 }}>
        <AccountSelect
          accounts={accounts}
          disabledId={null}
          label={messages.accountsPage.fromAccount}
          onSelect={(id) => {
            setFromId(id);
            if (id === toId) setToId(null);
          }}
          selected={from}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={messages.accountsPage.swapAccounts}
          hitSlop={6}
          onPress={swap}
          style={({ pressed }) => ({
            position: 'absolute',
            top: '50%',
            left: '50%',
            zIndex: 10,
            width: 36,
            height: 36,
            marginTop: -18,
            marginLeft: -18,
            borderRadius: 18,
            borderWidth: 2,
            borderColor: colors.surface1,
            backgroundColor: pressed ? colors.actionHover : colors.action,
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: shadows.md,
          })}>
          <ArrowUpDown size={16} color={colors.actionForeground} />
        </Pressable>
        <AccountSelect
          accounts={accounts}
          disabledId={fromId}
          label={messages.accountsPage.toAccount}
          onSelect={setToId}
          selected={to}
        />
      </View>

      <View
        style={{
          paddingHorizontal: 16,
          paddingVertical: 8,
          borderRadius: radius.xl,
          borderWidth: 1,
          borderColor: colors.controlBorder,
          backgroundColor: colors.control,
        }}>
        <CurrencyInput
          accessibilityLabel={messages.common.amount}
          mono={false}
          value={digits}
          onValueChange={setDigits}
          returnKeyType="done"
          onSubmitEditing={submit}
          containerStyle={{
            height: 48,
            minHeight: 48,
            paddingHorizontal: 0,
            borderWidth: 0,
            borderRadius: 0,
            backgroundColor: 'transparent',
          }}
          style={{ fontFamily: fonts.display, fontSize: 30, letterSpacing: 0.75 }}
        />
      </View>

      <View style={{ flexDirection: 'row', gap: 8 }}>
        {quickAmounts.map((value) => {
          const disabled = !from || value > from.balance;
          return (
            <Pressable
              key={value}
              accessibilityRole="button"
              accessibilityState={{ disabled }}
              disabled={disabled}
              onPress={() => setDigits(String(value * 100))}
              style={({ pressed }) => quickAmountStyle(disabled, pressed)}>
              <Text font="sansSemiBold" size="xs" color="ink2" numberOfLines={1}>
                {formatCurrency(value)}
              </Text>
            </Pressable>
          );
        })}
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ disabled: !from }}
          disabled={!from}
          onPress={() => setDigits(String(Math.round((from?.balance ?? 0) * 100)))}
          style={({ pressed }) => quickAmountStyle(!from, pressed)}>
          <Text font="sansSemiBold" size="xs" color="ink2" numberOfLines={1}>
            {messages.accountsPage.max}
          </Text>
        </Pressable>
      </View>

      {from ? (
        <Text size="xs" color="ink3" style={{ marginTop: -8 }}>
          {messages.accountsPage.available(formatCurrency(from.balance))}
        </Text>
      ) : null}
    </Modal>
  );
}

function accountDisplayName(account: BankAccount, locale: AppLocale) {
  const rate = interestRateLabel(account, locale);
  return rate ? `${account.label} · ${rate}` : account.label;
}

function AccountSelect({
  accounts,
  disabledId,
  label,
  onSelect,
  selected,
}: {
  accounts: BankAccount[];
  disabledId: string | null;
  label: string;
  onSelect: (id: string) => void;
  selected: BankAccount | null;
}) {
  const { formatCurrency, locale, messages } = useI18n();
  const { colors } = useTheme();
  const [open, setOpen] = useState(false);

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${
          selected ? accountDisplayName(selected, locale) : messages.accountsPage.chooseAccount
        }`}
        onPress={() => setOpen(true)}
        style={({ pressed }) => ({
          paddingHorizontal: 16,
          paddingVertical: 12,
          borderRadius: radius.xl,
          borderWidth: 1,
          borderColor: colors.controlBorder,
          backgroundColor: pressed ? colors.controlHover : colors.control,
        })}>
        <Text font="sansMedium" size="xs" color="ink3" uppercase tracking={1.2}>
          {label}
        </Text>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            marginTop: 6,
          }}>
          <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text font="sansMedium" size="base" numberOfLines={1} style={{ flexShrink: 1 }}>
              {selected ? accountDisplayName(selected, locale) : messages.accountsPage.chooseAccount}
            </Text>
            <ChevronDown size={16} color={colors.ink3} />
          </View>
          {selected ? (
            <Text font="mono" size="sm" color="ink3">
              {formatCurrency(selected.balance)}
            </Text>
          ) : null}
        </View>
      </Pressable>

      {/* The web popover: a list of every account with its balance. */}
      <Sheet open={open} onOpenChange={setOpen} title={label}>
        <View style={{ gap: 4 }}>
          {accounts.map((account) => {
            const isSelected = account.id === selected?.id;
            const disabled = account.id === disabledId;

            return (
              <Pressable
                key={account.id}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected, disabled }}
                disabled={disabled}
                onPress={() => {
                  onSelect(account.id);
                  setOpen(false);
                }}
                style={({ pressed }) => ({
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                  minHeight: 44,
                  paddingHorizontal: 10,
                  paddingVertical: 8,
                  borderRadius: radius.md,
                  backgroundColor: isSelected
                    ? colors.accentSoft
                    : pressed
                      ? colors.controlHover
                      : 'transparent',
                  opacity: disabled ? 0.4 : 1,
                })}>
                <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  {isSelected ? <Check size={16} color={colors.accentSoftFg} /> : null}
                  <Text
                    font="sansMedium"
                    size="sm"
                    color={isSelected ? 'accentSoftFg' : 'ink1'}
                    numberOfLines={1}
                    style={{ flexShrink: 1 }}>
                    {accountDisplayName(account, locale)}
                  </Text>
                </View>
                <Text font="mono" size="xs" color="ink3">
                  {formatCurrency(account.balance)}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </Sheet>
    </>
  );
}
