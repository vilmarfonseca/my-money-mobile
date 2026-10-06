import { CreditCard } from 'lucide-react-native';
import { useImperativeHandle, useRef, useState, type Ref } from 'react';
import { TextInput, View } from 'react-native';

import { useApiAction, useApiQuery } from '@/api/hooks';
import { CARD_ASPECT, CreditCardFace, getCardSurface } from '@/components/cards/credit-card-rail';
import {
  nearestColorOption,
  obAttempt,
  ObAddAnotherButton,
  ObAddedRow,
  ObEmptyNote,
  ObListStatus,
  ObRemoveButton,
  useObDraftErrors,
  type OnboardingStepCommit,
  type OnboardingStepHandle,
} from '@/components/onboarding/onboarding-ui';
import { ColorPickerButton } from '@/components/ui/color-picker-button';
import { CurrencyInput, currencyDigitsToAmount } from '@/components/ui/currency-input';
import { FieldLabel, FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Text } from '@/components/ui/text';
import { toast } from '@/components/ui/toast';
import {
  cardColorPalettes,
  cardNetworkLabels,
  cardNetworkProfiles,
  closingOffsetOptions,
  createCardFromForm,
  dueDayOptions,
  type CardNetwork,
  type CardPaletteId,
  type CreditCardAccount,
} from '@/lib/cards/cards-data';
import { useI18n } from '@/lib/i18n/provider';

const paletteOptions = Object.values(cardColorPalettes).map((palette) => ({
  value: palette.id,
  hex: palette.secondary,
}));

/** The limit the form starts with; on its own it is not a card in progress. */
const DEFAULT_LIMIT_DIGITS = '400000';

export type OnboardingCardSummary = {
  id: string;
  nickname: string;
  last4: string;
  palette: CardPaletteId;
  limit: number;
};

type OnboardingStepCardsProps = {
  cards: OnboardingCardSummary[];
  onCardsChange: (cards: OnboardingCardSummary[]) => void;
  /** Lets Continue save the open form (see `OnboardingStepHandle`). */
  ref?: Ref<OnboardingStepHandle>;
};

export function OnboardingStepCards({ cards, onCardsChange, ref }: OnboardingStepCardsProps) {
  const { messages, formatCurrency } = useI18n();
  const t = messages.onboarding;
  const c = messages.cardsPage;

  const createCard = useApiAction('cards.create');
  const deleteCard = useApiAction('cards.delete');
  const isPending = createCard.pending || deleteCard.pending;

  const [nickname, setNickname] = useState('');
  const [last4, setLast4] = useState('');
  const [network, setNetwork] = useState<CardNetwork>('visa');
  const [limitDigits, setLimitDigits] = useState(DEFAULT_LIMIT_DIGITS);
  const [color, setColor] = useState('#7c3aed');
  const [dueDay, setDueDay] = useState('');
  const [closingOffsetDays, setClosingOffsetDays] = useState('');
  const [autoDebit, setAutoDebit] = useState(false);
  const [autoDebitAccountId, setAutoDebitAccountId] = useState('');
  const { hideErrors, reveal, showErrors } = useObDraftErrors();
  const last4Ref = useRef<TextInput>(null);
  const limitRef = useRef<TextInput>(null);
  const debitAccountRef = useRef<View>(null);

  // Accounts created in the banks step load lazily once auto debit is on.
  const bankAccounts = useApiQuery('cards.bankAccountOptions', [], { enabled: autoDebit });

  const profile = cardNetworkProfiles[network];
  const digits = last4.replace(/\D/g, '').slice(0, 4);
  const limitAmount = currencyDigitsToAmount(limitDigits);
  const palette = nearestColorOption(color, paletteOptions);
  const missingLast4 = digits.length !== 4;
  const missingLimit = limitAmount <= 0;
  const missingDebitAccount = autoDebit && autoDebitAccountId.length === 0;
  const formValid = !missingLast4 && !missingLimit && !missingDebitAccount;
  // Anything typed beyond the defaults is a card in progress, which Continue
  // will save. Picking a network or color alone is not.
  const hasDraft =
    nickname.trim().length > 0 ||
    last4 !== '' ||
    limitDigits !== DEFAULT_LIMIT_DIGITS ||
    dueDay !== '' ||
    closingOffsetDays !== '' ||
    autoDebit;

  /** Flags the missing fields and brings the first one into view. */
  const flagMissing = () =>
    reveal(missingLast4 ? last4Ref : missingLimit ? limitRef : debitAccountRef);

  const previewCard: CreditCardAccount = {
    ...createCardFromForm({
      number: digits || '0000',
      holder: '',
      expires: '',
      limit: limitAmount,
      network,
      nickname,
      palette,
    }),
    id: 'preview',
  };

  /** Creates the card in the form; false when the server refused it. */
  const save = async (): Promise<boolean> => {
    const result = await obAttempt(() =>
      createCard.run({
        dueDay: dueDay || null,
        closingOffsetDays: closingOffsetDays || null,
        autoDebit,
        autoDebitAccountId: autoDebitAccountId || null,
        expires: '',
        holder: '',
        last4: digits,
        limit: String(limitAmount),
        network,
        nickname,
        palette,
      }),
    );
    if (!result) return false;
    if (!result.ok) {
      toast.error(result.message);
      return false;
    }

    toast.success(t.cardAdded);
    const created = result.cards.find(
      (card) => !cards.some((existing) => existing.id === card.id) && card.last4 === digits,
    );
    onCardsChange([
      ...cards,
      {
        id: created?.id ?? `local-${Date.now()}`,
        nickname: nickname.trim() || profile.defaultNickname,
        last4: digits,
        palette,
        limit: limitAmount,
      },
    ]);
    setNickname('');
    setLast4('');
    setLimitDigits(DEFAULT_LIMIT_DIGITS);
    setDueDay('');
    setClosingOffsetDays('');
    setAutoDebit(false);
    setAutoDebitAccountId('');
    hideErrors();
    return true;
  };

  const submit = () => {
    if (isPending) return;
    if (!formValid) {
      flagMissing();
      return;
    }
    void save();
  };

  // Continue saves a filled-in card instead of dropping it; an untouched
  // form just moves on, since cards are optional.
  useImperativeHandle(ref, () => ({
    commit: async (): Promise<OnboardingStepCommit> => {
      if (!hasDraft) return 'empty';
      if (!formValid) {
        flagMissing();
        return 'invalid';
      }
      return (await save()) ? 'saved' : 'failed';
    },
  }));

  const removeCard = async (index: number) => {
    const card = cards[index];
    const result = await obAttempt(() => deleteCard.run(card.id));
    if (!result) return;
    if (!result.ok) {
      toast.error(result.message);
      return;
    }
    onCardsChange(cards.filter((_, i) => i !== index));
  };

  return (
    <View>
      {/* The preview leads on phones (`flex-col-reverse`). */}
      <View style={{ gap: 10 }}>
        <FieldLabel>{t.preview}</FieldLabel>
        <CreditCardFace
          card={previewCard}
          style={{ width: '66%', height: undefined, aspectRatio: CARD_ASPECT }}
        />
      </View>

      <View style={{ gap: 16, marginTop: 20 }}>
        <FormField label={c.nickname}>
          <Input value={nickname} onChangeText={setNickname} placeholder={t.cardNamePlaceholder} />
        </FormField>
        <FormField label={c.network}>
          <Select<CardNetwork>
            accessibilityLabel={c.network}
            title={c.network}
            value={network}
            onValueChange={setNetwork}
            options={(Object.keys(cardNetworkLabels) as CardNetwork[]).map((value) => ({
              label: cardNetworkLabels[value],
              value,
            }))}
          />
        </FormField>
        <FormField label={c.lastFourDigits}>
          <Input
            ref={last4Ref}
            mono
            accessibilityLabel={c.lastFourDigits}
            maxLength={4}
            keyboardType="number-pad"
            value={last4}
            onChangeText={(text) => setLast4(text.replace(/\D/g, '').slice(0, 4))}
            placeholder="4821"
            invalid={showErrors && missingLast4}
          />
        </FormField>
        <FormField label={c.creditLimit}>
          <CurrencyInput
            ref={limitRef}
            accessibilityLabel={c.creditLimit}
            value={limitDigits}
            onValueChange={setLimitDigits}
            invalid={showErrors && missingLimit}
          />
        </FormField>
        <FormField label={c.dueDay} hint={c.dueDayHint}>
          <Select
            accessibilityLabel={c.dueDay}
            title={c.dueDay}
            value={dueDay}
            onValueChange={setDueDay}
            options={[
              { label: c.cycleNotSet, value: '' },
              ...dueDayOptions.map((day) => ({ label: c.dueDayOption(day), value: String(day) })),
            ]}
          />
        </FormField>
        <FormField label={c.closingOffset} hint={c.closingOffsetHint}>
          <Select
            accessibilityLabel={c.closingOffset}
            title={c.closingOffset}
            value={closingOffsetDays}
            onValueChange={setClosingOffsetDays}
            options={[
              { label: c.cycleNotSet, value: '' },
              ...closingOffsetOptions.map((days) => ({
                label: c.closingOffsetOption(days),
                value: String(days),
              })),
            ]}
          />
        </FormField>

        <View style={{ gap: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Switch
              accessibilityLabel={c.autoDebit}
              checked={autoDebit}
              onCheckedChange={(checked) => {
                setAutoDebit(checked);
                if (!checked) setAutoDebitAccountId('');
              }}
            />
            <Text font="sansMedium" size="sm" style={{ flex: 1 }}>
              {c.autoDebit}
            </Text>
          </View>
          <Text size="xs" color="ink3">
            {c.autoDebitHint}
          </Text>
          {autoDebit ? (
            <View ref={debitAccountRef}>
              <Select
                accessibilityLabel={c.autoDebitAccount}
                title={c.autoDebitAccount}
                placeholder={c.chooseAccount}
                value={autoDebitAccountId}
                onValueChange={setAutoDebitAccountId}
                invalid={showErrors && missingDebitAccount}
                options={(bankAccounts.data ?? []).map((account) => ({
                  label: account.name,
                  value: account.id,
                }))}
              />
            </View>
          ) : null}
        </View>

        <View style={{ gap: 10 }}>
          <FieldLabel>{c.cardColor}</FieldLabel>
          <ColorPickerButton color={color} onChange={setColor} />
        </View>
      </View>

      <ObAddAnotherButton
        label={t.addAnotherCard}
        disabled={!formValid || isPending}
        pending={createCard.pending}
        onPress={submit}
      />

      {showErrors && !formValid ? (
        <ObListStatus tone="error">{t.draftIncomplete}</ObListStatus>
      ) : hasDraft ? (
        formValid ? (
          <ObListStatus tone="info">{t.continueSavesCard}</ObListStatus>
        ) : null
      ) : cards.length > 0 ? (
        <ObListStatus tone="success">{t.cardReady}</ObListStatus>
      ) : null}

      <View style={{ marginTop: 20 }}>
        <FieldLabel>{t.yourCards}</FieldLabel>
        <View style={{ gap: 10, marginTop: 10 }}>
          {cards.map((card, index) => {
            const surface = getCardSurface(card.palette);
            return (
              <ObAddedRow
                key={card.id}
                icon={CreditCard}
                iconColor={surface.text}
                gradient={surface.colors}
                name={card.nickname}
                meta={`•• ${card.last4} · ${formatCurrency(card.limit)} ${c.limitSuffix}`}
                actions={
                  <ObRemoveButton
                    disabled={isPending}
                    label={t.remove}
                    onPress={() => removeCard(index)}
                  />
                }
              />
            );
          })}
        </View>
        {cards.length === 0 ? <ObEmptyNote>{t.cardsEmpty}</ObEmptyNote> : null}
      </View>
    </View>
  );
}
