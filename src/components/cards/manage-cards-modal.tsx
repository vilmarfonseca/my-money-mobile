import { Check, ChevronDown, ChevronUp, Plus, Trash2 } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';

import { callApi, type ApiResult } from '@/api/client';
import { useApiQuery } from '@/api/hooks';
import {
  CARD_ASPECT,
  CardSurfaceFill,
  CreditCardFace,
  getCardSurface,
} from '@/components/cards/credit-card-rail';
import { Button, IconButton } from '@/components/ui/button';
import { ColorPickerButton } from '@/components/ui/color-picker-button';
import { currencyDigitsToAmount, CurrencyInput } from '@/components/ui/currency-input';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { Select } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Text } from '@/components/ui/text';
import type { CreditCardFormInput } from '@/lib/cards/cards-actions';
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
import { useTheme } from '@/theme/theme-provider';
import { radius, shadows } from '@/theme/tokens';

type ManageCardsModalProps = {
  cards: CreditCardAccount[];
  onCardsChange: (cards: CreditCardAccount[]) => void;
  onOpenChange: (open: boolean) => void;
  open: boolean;
};

type CardActionResult = ApiResult<'cards.update'>;

const DEFAULT_COLOR = '#7c3aed';

const networkOptions = (Object.keys(cardNetworkLabels) as CardNetwork[]).map((value) => ({
  value,
  label: cardNetworkLabels[value],
}));

export function ManageCardsModal({
  cards,
  onCardsChange,
  onOpenChange,
  open,
}: ManageCardsModalProps) {
  const { formatCurrency, locale, messages } = useI18n();
  const { colors } = useTheme();
  const [last4, setLast4] = useState('');
  const [limitDigits, setLimitDigits] = useState('300000');
  const [dueDay, setDueDay] = useState('');
  const [closingOffsetDays, setClosingOffsetDays] = useState('');
  const [nickname, setNickname] = useState('');
  const [palette, setPalette] = useState<CardPaletteId>('violet');
  const [color, setColor] = useState(DEFAULT_COLOR);
  // Until the user actually picks a color, an edited card keeps its stored
  // color (or legacy palette) so the preview matches the cards page exactly.
  const [colorTouched, setColorTouched] = useState(true);
  const [network, setNetwork] = useState<CardNetwork>('visa');
  const [autoDebit, setAutoDebit] = useState(false);
  const [autoDebitAccountId, setAutoDebitAccountId] = useState('');
  const [editingCardId, setEditingCardId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pendingCount, setPendingCount] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  // The auto-debit account select needs the workspace's bank accounts.
  const bankAccounts = useApiQuery('cards.bankAccountOptions', [], { enabled: open });
  const isPending = pendingCount > 0;
  const profile = cardNetworkProfiles[network];
  const digits = last4.replace(/\D/g, '').slice(0, 4);
  const limitAmount = currencyDigitsToAmount(limitDigits);
  const canSubmit =
    digits.length === 4 &&
    limitAmount > 0 &&
    (!autoDebit || autoDebitAccountId.length > 0) &&
    !isPending;
  const editingCard = cards.find((card) => card.id === editingCardId);
  const effectiveColor = colorTouched ? color : (editingCard?.color ?? null);
  const previewCard: CreditCardAccount = {
    ...createCardFromForm({
      number: digits || '0000',
      holder: '',
      expires: '',
      limit: limitAmount,
      network,
      nickname,
      palette,
      color: effectiveColor,
    }),
    id: 'preview',
  };

  const loadCard = (card: CreditCardAccount) => {
    setEditingCardId(card.id);
    setLast4(card.last4);
    setLimitDigits(String(Math.round(card.creditLimit * 100)));
    setDueDay(card.dueDay ? String(card.dueDay) : '');
    setClosingOffsetDays(card.closingOffsetDays ? String(card.closingOffsetDays) : '');
    setAutoDebit(card.autoDebit);
    setAutoDebitAccountId(card.autoDebitAccountId ?? '');
    setNickname(card.nickname);
    setPalette(card.palette);
    setColor(card.color ?? cardColorPalettes[card.palette].secondary);
    setColorTouched(false);
    setNetwork(card.network);
    setMessage(null);
  };

  const resetForm = () => {
    setEditingCardId(null);
    setLast4('');
    setNickname('');
    setLimitDigits('300000');
    setDueDay('');
    setClosingOffsetDays('');
    setAutoDebit(false);
    setAutoDebitAccountId('');
    setPalette('violet');
    setColor(DEFAULT_COLOR);
    setColorTouched(true);
    setNetwork('visa');
    setMessage(null);
  };

  // Opening the modal starts on the first card (design default); the form
  // falls back to "new card" mode when there is nothing to edit yet.
  const [wasOpen, setWasOpen] = useState(false);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      const first = cards[0];
      if (first) loadCard(first);
      else resetForm();
    }
  }

  const formInput = (): CreditCardFormInput => ({
    dueDay: dueDay || null,
    closingOffsetDays: closingOffsetDays || null,
    autoDebit,
    autoDebitAccountId: autoDebitAccountId || null,
    color: effectiveColor,
    expires: editingCard?.expires ?? '',
    holder: editingCard?.holder ?? '',
    last4: digits,
    limit: String(limitAmount),
    network,
    nickname,
    palette,
  });

  /** Runs a card action; expected and network failures both land in the form's message. */
  const runAction = async (
    action: () => Promise<CardActionResult>,
    onSuccess: (cards: CreditCardAccount[]) => void,
  ) => {
    setPendingCount((count) => count + 1);
    try {
      const result = await action();
      if (!result.ok) {
        setMessage(result.message);
        return;
      }
      onSuccess(result.cards);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setPendingCount((count) => count - 1);
    }
  };

  // Edits to an existing card persist on their own once the user finishes a
  // field (blur for text, change for pickers): the Save button just closes.
  // The payload is captured at queue time so a late flush can't write one
  // card's draft into another after the user switches rows.
  const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingSaveRef = useRef<{ cardId: string; input: CreditCardFormInput } | null>(null);

  const cancelAutosaveTimer = () => {
    if (autosaveTimer.current) {
      clearTimeout(autosaveTimer.current);
      autosaveTimer.current = null;
    }
  };

  const flushAutosave = () => {
    cancelAutosaveTimer();
    const pending = pendingSaveRef.current;
    pendingSaveRef.current = null;
    if (!pending) return;

    void runAction(
      () => callApi('cards.update', pending.cardId, pending.input),
      (nextCards) => {
        setMessage(null);
        onCardsChange(nextCards);
      },
    );
  };

  const queueAutosave = (overrides: Partial<CreditCardFormInput> = {}) => {
    if (!editingCardId) return;
    const input = { ...formInput(), ...overrides };
    if (input.last4.length !== 4 || Number(input.limit) <= 0) return;
    // Auto debit without an account picked yet isn't saveable; wait for it.
    if (input.autoDebit && !input.autoDebitAccountId) return;

    pendingSaveRef.current = { cardId: editingCardId, input };
    cancelAutosaveTimer();
    autosaveTimer.current = setTimeout(flushAutosave, 600);
  };

  useEffect(
    () => () => {
      if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    },
    [],
  );

  // Leaving the modal counts as "done editing": persist any pending edit.
  const close = () => {
    flushAutosave();
    onOpenChange(false);
  };

  const handleSubmit = () => {
    if (!canSubmit) return;

    // Submit saves the full form itself; drop any queued field autosave.
    pendingSaveRef.current = null;
    cancelAutosaveTimer();

    const input = formInput();
    void runAction(
      () =>
        editingCardId
          ? callApi('cards.update', editingCardId, input)
          : callApi('cards.create', input),
      (nextCards) => {
        onCardsChange(nextCards);
        onOpenChange(false);
      },
    );
  };

  const handleDeleteCard = (cardId: string) => {
    // A queued edit for a card being deleted must never fire.
    if (pendingSaveRef.current?.cardId === cardId) {
      pendingSaveRef.current = null;
      cancelAutosaveTimer();
    }
    void runAction(
      () => callApi('cards.delete', cardId),
      (nextCards) => {
        onCardsChange(nextCards);
        if (editingCardId === cardId) {
          const next = nextCards[0];
          if (next) loadCard(next);
          else resetForm();
        }
      },
    );
  };

  // The web reorders by dragging a row; here each row moves one place at a
  // time. The list reorders at once and the new order is saved behind it.
  const moveCard = (cardId: string, offset: -1 | 1) => {
    const from = cards.findIndex((card) => card.id === cardId);
    const to = from + offset;
    if (from < 0 || to < 0 || to >= cards.length) return;

    const nextCards = [...cards];
    const [card] = nextCards.splice(from, 1);
    nextCards.splice(to, 0, card);
    onCardsChange(nextCards);
    void runAction(
      () => callApi('cards.reorder', nextCards.map((item) => item.id)),
      onCardsChange,
    );
  };

  const selectRow = (card: CreditCardAccount | null) => {
    // Switching rows counts as "done editing" the previous card.
    flushAutosave();
    if (card) loadCard(card);
    else resetForm();
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  };

  const editingLabel = editingCardId
    ? messages.cardsPage.editingLabel(editingCard?.nickname || nickname || profile.defaultNickname)
    : messages.cardsPage.newCard;
  const fieldSurface = { backgroundColor: colors.surface1 };

  const editor = (
    <View>
      <Text
        font="sansSemiBold"
        size="xs"
        color="accentSoftFg"
        uppercase
        tracking={1.2}
        style={{ marginBottom: 12 }}>
        {editingLabel}
      </Text>
      <CreditCardFace
        card={previewCard}
        style={{ width: '66.6667%', height: 'auto', aspectRatio: CARD_ASPECT, marginBottom: 24 }}
      />
      <View style={{ gap: 16 }}>
        <FormField label={messages.cardsPage.nickname}>
          <Input
            value={nickname}
            onChangeText={setNickname}
            onBlur={() => queueAutosave()}
            placeholder={profile.defaultNickname}
            containerStyle={fieldSurface}
          />
        </FormField>
        <FormField label={messages.cardsPage.lastFourDigits}>
          <Input
            mono
            maxLength={4}
            keyboardType="number-pad"
            value={last4}
            onChangeText={(text) => setLast4(text.replace(/\D/g, '').slice(0, 4))}
            onBlur={() => queueAutosave()}
            placeholder="4821"
            containerStyle={fieldSurface}
          />
        </FormField>
        <FormField label={messages.cardsPage.network}>
          <Select
            accessibilityLabel={messages.cardsPage.network}
            title={messages.cardsPage.network}
            value={network}
            options={networkOptions}
            onValueChange={(next) => {
              setNetwork(next);
              queueAutosave({ network: next });
            }}
            style={fieldSurface}
          />
        </FormField>
        <FormField label={messages.cardsPage.creditLimit}>
          <CurrencyInput
            value={limitDigits}
            onValueChange={setLimitDigits}
            onBlur={() => queueAutosave()}
            containerStyle={fieldSurface}
          />
        </FormField>
        <FormField label={messages.cardsPage.cardColor}>
          <ColorPickerButton
            color={color}
            onChange={(hex) => {
              setColor(hex);
              setColorTouched(true);
              // Debounced, so trying several swatches settles into one save.
              queueAutosave({ color: hex });
            }}
          />
        </FormField>
        <CardCycleField
          label={messages.cardsPage.dueDay}
          hint={messages.cardsPage.dueDayHint}
          placeholder={messages.cardsPage.cycleNotSet}
          value={dueDay}
          onChange={(next) => {
            setDueDay(next);
            queueAutosave({ dueDay: next || null });
          }}
          options={dueDayOptions.map((day) => ({
            value: String(day),
            label: messages.cardsPage.dueDayOption(day),
          }))}
        />
        <CardCycleField
          label={messages.cardsPage.closingOffset}
          hint={messages.cardsPage.closingOffsetHint}
          placeholder={messages.cardsPage.cycleNotSet}
          value={closingOffsetDays}
          onChange={(next) => {
            setClosingOffsetDays(next);
            queueAutosave({ closingOffsetDays: next || null });
          }}
          options={closingOffsetOptions.map((days) => ({
            value: String(days),
            label: messages.cardsPage.closingOffsetOption(days),
          }))}
        />
        <View style={{ gap: 6 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Switch
              accessibilityLabel={messages.cardsPage.autoDebit}
              checked={autoDebit}
              onCheckedChange={(checked) => {
                setAutoDebit(checked);
                if (!checked) {
                  setAutoDebitAccountId('');
                  queueAutosave({ autoDebit: false, autoDebitAccountId: null });
                } else if (autoDebitAccountId) {
                  queueAutosave({ autoDebit: true, autoDebitAccountId });
                }
              }}
            />
            <Text font="sansMedium" size="base" style={{ flex: 1 }}>
              {messages.cardsPage.autoDebit}
            </Text>
          </View>
          <Text size="xs" color="ink3">
            {messages.cardsPage.autoDebitHint}
          </Text>
        </View>
        {autoDebit ? (
          <FormField label={messages.cardsPage.autoDebitAccount}>
            <Select
              accessibilityLabel={messages.cardsPage.autoDebitAccount}
              placeholder={messages.cardsPage.chooseAccount}
              value={autoDebitAccountId}
              options={(bankAccounts.data ?? []).map((account) => ({
                value: account.id,
                label: account.name,
              }))}
              onValueChange={(next) => {
                setAutoDebitAccountId(next);
                queueAutosave({ autoDebit: true, autoDebitAccountId: next });
              }}
              style={fieldSurface}
            />
          </FormField>
        ) : null}
      </View>

      {message ? (
        <View
          style={{
            marginTop: 16,
            paddingHorizontal: 12,
            paddingVertical: 8,
            borderRadius: radius.md,
            backgroundColor: colors.negativeSoft,
          }}>
          <Text size="sm" color="negativeFg">
            {message}
          </Text>
        </View>
      ) : null}
    </View>
  );

  const cardList = (
    <View style={{ gap: 10 }}>
      {cards.map((card, index) => {
        const active = editingCardId === card.id;
        return (
          <Pressable
            key={card.id}
            accessibilityRole="button"
            accessibilityLabel={messages.cardsPage.editCard(card.nickname)}
            accessibilityState={{ selected: active }}
            onPress={() => selectRow(card)}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
              paddingLeft: 6,
              paddingRight: 12,
              paddingVertical: 10,
              borderRadius: radius.md,
              borderWidth: 1,
              borderColor: active ? colors.accent : colors.line,
              backgroundColor: colors.surface1,
              boxShadow: active ? `0 0 0 2px ${colors.accentSoft}` : undefined,
            }}>
            <View>
              <IconButton
                accessibilityLabel={
                  locale === 'pt-BR'
                    ? `Mover ${card.nickname} para cima`
                    : `Move ${card.nickname} up`
                }
                variant="ghost"
                size={24}
                hitSlop={{ top: 6, bottom: 0, left: 6, right: 6 }}
                disabled={index === 0 || isPending}
                icon={({ color: iconColor }) => <ChevronUp size={16} color={iconColor} />}
                onPress={() => moveCard(card.id, -1)}
              />
              <IconButton
                accessibilityLabel={
                  locale === 'pt-BR'
                    ? `Mover ${card.nickname} para baixo`
                    : `Move ${card.nickname} down`
                }
                variant="ghost"
                size={24}
                hitSlop={{ top: 0, bottom: 6, left: 6, right: 6 }}
                disabled={index === cards.length - 1 || isPending}
                icon={({ color: iconColor }) => <ChevronDown size={16} color={iconColor} />}
                onPress={() => moveCard(card.id, 1)}
              />
            </View>
            <View style={{ width: 32, height: 32, borderRadius: 16, boxShadow: shadows.md }}>
              <View style={{ flex: 1, borderRadius: 16, overflow: 'hidden' }}>
                <CardSurfaceFill surface={getCardSurface(card.palette, card.color)} />
              </View>
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text font="sansMedium" size="sm" numberOfLines={1}>
                {card.nickname}
              </Text>
              <Text font="mono" size="xs" color="ink3" numberOfLines={1} style={{ marginTop: 2 }}>
                {`${cardNetworkLabels[card.network]} · ${formatCurrency(card.creditLimit)} ${messages.cardsPage.limitSuffix}`}
              </Text>
            </View>
            <IconButton
              accessibilityLabel={messages.cardsPage.deleteCard(card.nickname)}
              variant="ghost"
              size={32}
              disabled={isPending}
              icon={({ size }) => <Trash2 size={size + 2} color={colors.ink4} />}
              onPress={() => handleDeleteCard(card.id)}
            />
          </Pressable>
        );
      })}

      <Pressable
        accessibilityRole="button"
        accessibilityState={{ selected: editingCardId === null }}
        onPress={() => selectRow(null)}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          paddingHorizontal: 16,
          paddingVertical: 14,
          borderRadius: radius.md,
          borderWidth: 1,
          borderStyle: 'dashed',
          borderColor: editingCardId === null ? colors.accent : colors.lineStrong,
        }}>
        <Plus size={16} color={editingCardId === null ? colors.accent : colors.ink2} />
        <Text font="sansMedium" size="sm" color={editingCardId === null ? 'accent' : 'ink2'}>
          {messages.cardsPage.addCard}
        </Text>
      </Pressable>
    </View>
  );

  return (
    <Modal
      open={open}
      onOpenChange={(nextOpen) => (nextOpen ? onOpenChange(true) : close())}
      title={`${messages.cardsPage.manageTitlePrefix} ${messages.cardsPage.manageTitleEmphasis}`}
      // The form scrolls back to the editor when a card is picked from the list.
      scroll={false}
      headerAction={
        <IconButton
          accessibilityLabel={messages.cardsPage.saveCard}
          variant="action"
          disabled={!canSubmit}
          icon={(props) => <Check {...props} />}
          onPress={handleSubmit}
        />
      }
      footer={
        <>
          <Button
            variant="outline"
            size="xl"
            style={{ flex: 1 }}
            label={messages.common.cancel}
            onPress={close}
          />
          <Button
            size="xl"
            style={{ flex: 1 }}
            icon={(props) => <Check {...props} />}
            label={messages.common.save}
            disabled={!canSubmit}
            onPress={handleSubmit}
          />
        </>
      }>
      <ScrollView
        ref={scrollRef}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 24 }}>
        {/* Phones put the editor first and the card list under it. */}
        {editor}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: 28,
            marginBottom: 10,
            paddingHorizontal: 4,
          }}>
          <Text font="display" size="2xl" tight>
            {messages.cardsPage.yourCards}
          </Text>
          <View
            style={{
              paddingHorizontal: 10,
              paddingVertical: 2,
              borderRadius: radius.pill,
              backgroundColor: colors.surface2,
            }}>
            <Text font="monoSemiBold" size="xs" color="ink2">
              {cards.length}
            </Text>
          </View>
        </View>
        {cardList}
      </ScrollView>
    </Modal>
  );
}

/** Statement-cycle picker: a repeating day, or an offset in days. */
function CardCycleField({
  hint,
  label,
  onChange,
  options,
  placeholder,
  value,
}: {
  hint: string;
  label: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder: string;
  value: string;
}) {
  const { colors } = useTheme();

  return (
    <FormField label={label} hint={hint}>
      <Select
        accessibilityLabel={label}
        title={label}
        placeholder={placeholder}
        value={value}
        // The empty choice clears the field, like the web select's first option.
        options={[{ value: '', label: placeholder }, ...options]}
        onValueChange={onChange}
        style={{ backgroundColor: colors.surface1 }}
      />
    </FormField>
  );
}
