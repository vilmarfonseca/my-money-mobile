import { Landmark, PiggyBank, Star } from 'lucide-react-native';
import { useImperativeHandle, useRef, useState, type Ref } from 'react';
import { TextInput, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { useApiAction } from '@/api/hooks';
import {
  emptySavingsDraft,
  interestModeForLabel,
  isSavingsRateValid,
  savingsRateValue,
  type SavingsDraft,
} from '@/components/accounts/savings-fields';
import {
  obAttempt,
  ObAddAnotherButton,
  ObAddedRow,
  ObDashedButton,
  ObEmptyNote,
  ObListStatus,
  ObMiniButton,
  ObOptionCard,
  ObRemoveButton,
  obToneGradients,
  useObDraftErrors,
  type OnboardingStepCommit,
  type OnboardingStepHandle,
} from '@/components/onboarding/onboarding-ui';
import { CurrencyInput, currencyDigitsToAmount } from '@/components/ui/currency-input';
import { FieldLabel, FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Text } from '@/components/ui/text';
import { toast } from '@/components/ui/toast';
import { bankToneAt, type BankTone, type SavingsLabel } from '@/lib/accounts/accounts-data';
import { useI18n } from '@/lib/i18n/provider';
import { useTheme } from '@/theme/theme-provider';
import { durations, radius } from '@/theme/tokens';

export type OnboardingBankSummary = {
  accountIds: string[];
  name: string;
  nickname: string;
  tone: BankTone;
  isPrimary: boolean;
  checking: number | null;
  /** One entry per savings account at the bank. */
  savings: Array<{ balance: number; label: SavingsLabel | null }>;
};

type OnboardingStepBanksProps = {
  banks: OnboardingBankSummary[];
  onBanksChange: (banks: OnboardingBankSummary[]) => void;
  /** Lets Continue save the open form (see `OnboardingStepHandle`). */
  ref?: Ref<OnboardingStepHandle>;
};

const paneIn = FadeInDown.duration(durations.base).withInitialValues({
  transform: [{ translateY: 12 }],
});

export function OnboardingStepBanks({ banks, onBanksChange, ref }: OnboardingStepBanksProps) {
  const { locale, messages, formatCurrency } = useI18n();
  const { colors } = useTheme();
  const isPtBR = locale === 'pt-BR';
  const t = messages.onboarding;

  const createBank = useApiAction('onboarding.createBank');
  const setPrimaryBank = useApiAction('onboarding.setPrimaryBank');
  const deleteBank = useApiAction('onboarding.deleteBank');
  const isPending = createBank.pending || setPrimaryBank.pending || deleteBank.pending;

  const [name, setName] = useState('');
  const [nickname, setNickname] = useState('');
  const [checkingDigits, setCheckingDigits] = useState('');
  const [savingsDrafts, setSavingsDrafts] = useState<SavingsDraft[]>([{ ...emptySavingsDraft }]);
  const [isPrimary, setIsPrimary] = useState(true);
  const { hideErrors, reveal, showErrors } = useObDraftErrors();
  const nameRef = useRef<TextInput>(null);
  const checkingRef = useRef<TextInput>(null);

  const hasChecking = checkingDigits !== '';
  // Only entries with a balance become accounts; a blank row is the form's
  // invitation to add one.
  const filledSavings = savingsDrafts.filter((draft) => draft.balanceDigits !== '');
  const rateValid = filledSavings.every(isSavingsRateValid);
  const missingName = name.trim().length === 0;
  const missingBalance = !hasChecking && filledSavings.length === 0;
  const formValid = !missingName && !missingBalance;
  // Anything typed counts as a bank in progress, which Continue will save.
  const hasDraft = !missingName || nickname.trim().length > 0 || !missingBalance;
  const isFirstBank = banks.length === 0;

  /** Flags the missing fields and brings the first one into view. */
  const flagMissing = () =>
    reveal(missingName ? nameRef : missingBalance ? checkingRef : undefined);

  const resetForm = () => {
    setName('');
    setNickname('');
    setCheckingDigits('');
    setSavingsDrafts([{ ...emptySavingsDraft }]);
    setIsPrimary(false);
    hideErrors();
  };

  /** Creates the bank in the form; false when the server refused it. */
  const save = async (): Promise<boolean> => {
    const tone = bankToneAt(banks.length);
    const makePrimary = isFirstBank || isPrimary;
    const checking = hasChecking ? currencyDigitsToAmount(checkingDigits) : null;
    const savings = filledSavings.map((draft) => ({
      balance: currencyDigitsToAmount(draft.balanceDigits),
      label: isPtBR ? draft.label : null,
      mode: interestModeForLabel(draft.label, isPtBR),
      rate: savingsRateValue(draft),
    }));

    const result = await obAttempt(() =>
      createBank.run({
        name,
        nickname,
        tone,
        isPrimary: makePrimary,
        checkingBalance: checking,
        savings,
      }),
    );
    if (!result) return false;
    if (!result.ok) {
      toast.error(result.message);
      return false;
    }

    toast.success(t.bankAdded);
    onBanksChange([
      ...banks.map((bank) => (makePrimary ? { ...bank, isPrimary: false } : bank)),
      {
        accountIds: result.ids,
        name: name.trim(),
        nickname: nickname.trim(),
        tone,
        isPrimary: makePrimary,
        checking,
        savings: savings.map((entry) => ({ balance: entry.balance, label: entry.label })),
      },
    ]);
    resetForm();
    return true;
  };

  const submit = () => {
    if (isPending) return;
    if (!formValid || !rateValid) {
      flagMissing();
      return;
    }
    void save();
  };

  // Continue saves a filled-in bank instead of leaving it behind, and this
  // step needs at least one bank before the wizard moves on.
  useImperativeHandle(ref, () => ({
    commit: async (): Promise<OnboardingStepCommit> => {
      if (!hasDraft && !isFirstBank) return 'empty';
      if (!formValid || !rateValid) {
        flagMissing();
        return 'invalid';
      }
      return (await save()) ? 'saved' : 'failed';
    },
  }));

  const makePrimary = async (index: number) => {
    const bank = banks[index];
    if (bank.isPrimary) return;
    const result = await obAttempt(() => setPrimaryBank.run(bank.accountIds));
    if (!result) return;
    if (!result.ok) {
      toast.error(result.message);
      return;
    }
    onBanksChange(banks.map((entry, i) => ({ ...entry, isPrimary: i === index })));
  };

  const removeBank = async (index: number) => {
    const bank = banks[index];
    const result = await obAttempt(() => deleteBank.run(bank.accountIds));
    if (!result) return;
    if (!result.ok) {
      toast.error(result.message);
      return;
    }
    const next = banks.filter((_, i) => i !== index);
    onBanksChange(
      next.length > 0 && !next.some((entry) => entry.isPrimary)
        ? next.map((entry, i) => (i === 0 ? { ...entry, isPrimary: true } : entry))
        : next,
    );
  };

  const savingsName = (label: SavingsLabel | null) =>
    isPtBR && label === 'cofrinho' ? t.cofrinhoTitle : messages.accountsPage.savings;

  return (
    <View>
      <View style={{ gap: 16 }}>
        <FormField label={messages.accountsPage.bank}>
          <Input
            ref={nameRef}
            value={name}
            onChangeText={setName}
            placeholder={t.bankNamePlaceholder}
            maxLength={40}
            invalid={showErrors && missingName}
          />
        </FormField>
        <FormField label={messages.accountsPage.nicknameLabel} optional>
          <Input
            value={nickname}
            onChangeText={setNickname}
            placeholder={t.nicknamePlaceholder}
            maxLength={40}
          />
        </FormField>
        <FormField label={t.checkingBalance}>
          <CurrencyInput
            ref={checkingRef}
            accessibilityLabel={t.checkingBalance}
            value={checkingDigits}
            onValueChange={setCheckingDigits}
            invalid={showErrors && missingBalance}
          />
        </FormField>

        {/* A bank can hold several savings accounts; each carries its own kind,
            rate, and balance. */}
        {savingsDrafts.map((draft, index) => {
          const setDraft = (patch: Partial<SavingsDraft>) =>
            setSavingsDrafts(
              savingsDrafts.map((entry, position) =>
                position === index ? { ...entry, ...patch } : entry,
              ),
            );
          const mode = interestModeForLabel(draft.label, isPtBR);
          const rateSuffix = !isPtBR
            ? messages.accountsPage.apyPercent
            : mode === 'cdi'
              ? messages.accountsPage.cdiPercent
              : messages.accountsPage.monthlyPercent;
          const draftRateValid = isSavingsRateValid(draft);
          const balanceLabel = `${t.savingsBalance}${savingsDrafts.length > 1 ? ` ${index + 1}` : ''}`;

          return (
            <View
              key={index}
              style={[
                { gap: 14 },
                index > 0 && { borderTopWidth: 1, borderTopColor: colors.line, paddingTop: 16 },
              ]}>
              <View style={{ gap: 10 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <View style={{ flex: 1 }}>
                    <FieldLabel optional>{balanceLabel}</FieldLabel>
                  </View>
                  {savingsDrafts.length > 1 ? (
                    <ObRemoveButton
                      label={messages.accountsPage.removeSavings}
                      onPress={() =>
                        setSavingsDrafts(savingsDrafts.filter((_, position) => position !== index))
                      }
                    />
                  ) : null}
                </View>
                <CurrencyInput
                  accessibilityLabel={balanceLabel}
                  value={draft.balanceDigits}
                  onValueChange={(value) => setDraft({ balanceDigits: value })}
                />
              </View>

              {draft.balanceDigits !== '' ? (
                <Animated.View entering={paneIn} style={{ gap: 14 }}>
                  {isPtBR ? (
                    <View style={{ gap: 10 }}>
                      <FieldLabel>{t.savingsKindLabel}</FieldLabel>
                      <View style={{ gap: 12 }}>
                        <ObOptionCard
                          title={t.savingsRegularTitle}
                          description={t.savingsRegularDesc}
                          icon={Landmark}
                          selected={draft.label === 'poupanca'}
                          onSelect={() => setDraft({ label: 'poupanca' })}
                        />
                        <ObOptionCard
                          title={t.cofrinhoTitle}
                          tag={t.lockedTag}
                          description={t.cofrinhoDesc}
                          icon={PiggyBank}
                          selected={draft.label === 'cofrinho'}
                          onSelect={() => setDraft({ label: 'cofrinho' })}
                        />
                      </View>
                    </View>
                  ) : null}

                  <FormField
                    label={messages.accountsPage.interestSection}
                    error={draftRateValid ? null : messages.accountsPage.invalidRate}>
                    <Input
                      mono
                      accessibilityLabel={messages.accountsPage.interestSection}
                      value={draft.rate}
                      onChangeText={(rate) => setDraft({ rate })}
                      keyboardType="decimal-pad"
                      placeholder="0"
                      invalid={!draftRateValid}
                      trailing={
                        <Text size="sm" color="ink3">
                          {rateSuffix}
                        </Text>
                      }
                    />
                  </FormField>
                </Animated.View>
              ) : null}
            </View>
          );
        })}

        <ObDashedButton
          height={44}
          rounded={radius.sm}
          label={messages.accountsPage.addSavings}
          onPress={() => setSavingsDrafts([...savingsDrafts, { ...emptySavingsDraft }])}
        />

        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 14,
            paddingHorizontal: 16,
            paddingVertical: 14,
            borderRadius: radius.xl,
            backgroundColor: colors.surface2,
          }}>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text font="sansMedium" size="sm">
              {t.primaryTitle}
            </Text>
            <Text size="xs" color="ink3" style={{ marginTop: 2 }}>
              {t.primaryDesc}
            </Text>
          </View>
          <Switch
            checked={isFirstBank || isPrimary}
            disabled={isFirstBank}
            accessibilityLabel={t.primaryTitle}
            onCheckedChange={setIsPrimary}
          />
        </View>
      </View>

      <ObAddAnotherButton
        label={t.addAnotherAccount}
        disabled={!formValid || !rateValid || isPending}
        pending={createBank.pending}
        onPress={submit}
      />

      {showErrors && (!formValid || !rateValid) ? (
        <ObListStatus tone="error">
          {isFirstBank ? t.acctNudge : t.acctDraftIncomplete}
        </ObListStatus>
      ) : hasDraft ? (
        formValid && rateValid ? (
          <ObListStatus tone="info">{t.continueSavesAccount}</ObListStatus>
        ) : null
      ) : !isFirstBank ? (
        <ObListStatus tone="success">{t.acctReady}</ObListStatus>
      ) : null}

      <View style={{ marginTop: 20 }}>
        <FieldLabel>{t.yourAccounts}</FieldLabel>
        <View style={{ gap: 10, marginTop: 10 }}>
          {banks.map((bank, index) => (
            <ObAddedRow
              key={bank.accountIds.join(':')}
              icon={Landmark}
              gradient={obToneGradients[bank.tone]}
              name={bank.name}
              nameNote={bank.nickname || undefined}
              tag={bank.isPrimary ? messages.accountsPage.primaryBadge : undefined}
              meta={[
                bank.checking !== null
                  ? `${messages.accountsPage.checking} ${formatCurrency(bank.checking)}`
                  : null,
                // Each savings account gets its own entry, so a poupança and a
                // cofrinho at the same bank stay legible.
                ...bank.savings.map(
                  (account) => `${savingsName(account.label)} ${formatCurrency(account.balance)}`,
                ),
              ]
                .filter(Boolean)
                .join(' · ')}
              actions={
                <>
                  <ObMiniButton
                    active={bank.isPrimary}
                    disabled={isPending}
                    label={t.setPrimary}
                    onPress={() => makePrimary(index)}
                    icon={({ color, size }) => (
                      <Star size={size} color={color} fill={bank.isPrimary ? color : 'none'} />
                    )}
                  />
                  <ObRemoveButton
                    disabled={isPending}
                    label={t.remove}
                    onPress={() => removeBank(index)}
                  />
                </>
              }
            />
          ))}
        </View>
        {banks.length === 0 ? <ObEmptyNote>{t.acctEmpty}</ObEmptyNote> : null}
      </View>
    </View>
  );
}
