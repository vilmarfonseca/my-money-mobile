import { type Href, useRouter } from 'expo-router';
import { Check, CreditCard, List, Plus, Repeat2, Trash2 } from 'lucide-react-native';
import { useState } from 'react';
import { Keyboard, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ApiError } from '@/api/client';
import { useApiAction } from '@/api/hooks';
import { useEntitlements } from '@/components/billing/entitlements-provider';
import {
  CategoryEditorModal,
  type CategorySavedResult,
} from '@/components/transactions/category-editor-modal';
import {
  DateField,
  FieldInfo,
  InstallmentsField,
  MonthPicker,
  PillPicker,
  RecurrenceIntervalField,
  SectionDivider,
  TypeSelector,
  type PillColors,
} from '@/components/transactions/transaction-form-fields';
import { Button, IconButton } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CurrencyInput, currencyDigitsToAmount } from '@/components/ui/currency-input';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { ModalSheetHeader } from '@/components/ui/modal';
import { Screen } from '@/components/ui/screen';
import { Sheet } from '@/components/ui/sheet';
import { Switch } from '@/components/ui/switch';
import { Text } from '@/components/ui/text';
import { toast } from '@/components/ui/toast';
import { localizeAccountName } from '@/lib/accounts/account-display-name';
import { isHexColor } from '@/lib/categories/category-appearance';
import type { AppLocale } from '@/lib/i18n/config';
import { formatCapitalizedDate } from '@/lib/i18n/format';
import { useI18n } from '@/lib/i18n/provider';
import type { TransactionEditValues } from '@/lib/transactions/transaction-edit-actions';
import {
  cleanLabel,
  isRecurrenceInterval,
  recurrenceFrequencies,
  type CategoryAppearance,
  type CreateTransactionInput,
  type RecurrenceFrequency,
  type TransactionFormOptions,
  type TransactionFormType,
} from '@/lib/transactions/transaction-utils';
import { useTheme } from '@/theme/theme-provider';
import { durations, radius } from '@/theme/tokens';
import { categoryPillColors } from '@/theme/tones';

type NewTransactionFormProps = {
  options: TransactionFormOptions;
  defaultType?: TransactionFormType;
  lockType?: boolean;
  onCancel?: () => void;
  onSuccess?: () => void;
  /**
   * Set by the route: the form then closes its screen when it is done,
   * going back to the page it was opened from, or here if there is none.
   */
  redirectTo?: string;
  /** Kept for parity with the web; the app bar always has a close button. */
  showCloseButton?: boolean;
  /** `page`: the /transactions/new route. `modal`: inside the edit modal. */
  variant?: 'modal' | 'page';
  /** When set, the form edits this transaction instead of creating one. */
  transactionId?: string;
  initialValues?: TransactionEditValues;
};

/**
 * The whole add/edit transaction screen: app bar, scrolling section cards and
 * the pinned action bar. It fills its container, which is either the
 * full-screen modal route or the edit modal.
 */
export function NewTransactionForm({
  defaultType = 'expense',
  initialValues,
  lockType = false,
  onCancel,
  onSuccess,
  options,
  redirectTo,
  transactionId,
  variant = 'modal',
}: NewTransactionFormProps) {
  const { locale, messages } = useI18n();
  const { colors, scheme } = useTheme();
  const { features } = useEntitlements();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const create = useApiAction('transactions.create');
  const update = useApiAction('transactions.update');
  const remove = useApiAction('transactions.delete');
  const isEditing = Boolean(transactionId);
  const initialType = initialValues?.type ?? defaultType;
  const isPending = create.pending || update.pending;
  const isDeleting = remove.pending;
  // Set once the transaction is gone and the screen is on its way out.
  const [closing, setClosing] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [type, setType] = useState<TransactionFormType>(initialType);
  const [name, setName] = useState(initialValues?.name ?? '');
  const [description, setDescription] = useState(initialValues?.description ?? '');
  const [amountDigits, setAmountDigits] = useState(() =>
    initialValues && initialValues.amount > 0
      ? String(Math.round(initialValues.amount * 100))
      : '',
  );
  const [date, setDate] = useState(initialValues?.date || options.today);
  const [fiscalMonth, setFiscalMonth] = useState<number>(
    initialValues?.fiscalMonth ?? monthOfDate(initialValues?.date || options.today),
  );
  // Until the user picks a fiscal month, it tracks the transaction date's
  // month. Editing starts "touched" so a saved override is never overwritten.
  const [fiscalMonthTouched, setFiscalMonthTouched] = useState(isEditing);
  const [recurrenceFrequency, setRecurrenceFrequency] = useState<RecurrenceFrequency>(
    initialValues?.recurrenceFrequency ?? 'none',
  );
  const [recurrenceIntervalDays, setRecurrenceIntervalDays] = useState(
    initialValues?.recurrenceIntervalDays ?? 15,
  );
  const [recurringStartDate, setRecurringStartDate] = useState(
    initialValues?.recurringStartDate || options.today,
  );
  const [recurringEndDate, setRecurringEndDate] = useState(initialValues?.recurringEndDate ?? '');
  const [primaryCategory, setPrimaryCategory] = useState(
    initialValues?.primaryCategory || (options.categories[initialType][0] ?? ''),
  );
  const [otherCategories, setOtherCategories] = useState<string[]>(
    initialValues?.otherCategories ?? [],
  );
  // New expenses start on the primary checking account, falling back to
  // whatever the workspace does have (another checking account, or a card).
  const defaultPaymentMethod =
    options.bankAccounts.find((account) => account.isPrimary && account.type === 'checking')
      ?.name ??
    options.paymentMethods[0] ??
    '';
  const [paymentMethod, setPaymentMethod] = useState(
    initialValues?.paymentMethod || defaultPaymentMethod,
  );
  const [status, setStatus] = useState(initialValues?.status || 'Unpaid');
  const [dueDate, setDueDate] = useState(initialValues?.dueDate || options.today);
  const [paymentDate, setPaymentDate] = useState(initialValues?.paymentDate || options.today);
  const [installments, setInstallments] = useState(initialValues?.installments ?? 1);
  const bankAccountNames = options.bankAccounts.map((account) => account.name);
  const defaultDepositAccount =
    options.bankAccounts.find((account) => account.isPrimary)?.name ?? bankAccountNames[0] ?? '';
  const [depositAccount, setDepositAccount] = useState(
    initialValues?.accountName || defaultDepositAccount,
  );
  // The editor stays mounted while it slides out, so the category it was
  // opened for is kept apart from whether it is open.
  const [categoryEditor, setCategoryEditor] = useState({ name: '', open: false });
  // Appearance changes saved from the editor, applied on top of the server
  // options until the data refreshes.
  const [categoryOverrides, setCategoryOverrides] = useState<Record<string, CategoryAppearance>>(
    {},
  );

  const categoryAppearance = (category: string): CategoryAppearance | undefined =>
    categoryOverrides[`${type}:${category.toLowerCase()}`] ??
    options.categoryMeta?.[type]?.[category.toLowerCase()];

  /** A custom hex colour tints the chip; otherwise it keeps the accent tone. */
  const categoryChipColors = (category: string): PillColors | undefined => {
    const color = categoryAppearance(category)?.color;
    if (!isHexColor(color)) return undefined;
    return categoryPillColors({ color, colors, fallbackClassName: '', scheme, type: 'accent' });
  };

  const statusChipColors = (value: string): PillColors | undefined =>
    value === 'Paid'
      ? { bg: colors.positiveSoft, fg: colors.positiveFg }
      : value === 'Unpaid'
        ? { bg: colors.warningSoft, fg: colors.warningFg }
        : value === 'Upcoming'
          ? { bg: colors.accentSoft, fg: colors.accentSoftFg }
          : undefined;

  const handleCategorySaved = (result: CategorySavedResult) => {
    setCategoryOverrides((current) => ({
      ...current,
      [`${type}:${result.name.toLowerCase()}`]: { color: result.color, icon: result.icon },
    }));
    if (result.previousName !== result.name) {
      if (primaryCategory.toLowerCase() === result.previousName.toLowerCase()) {
        setPrimaryCategory(result.name);
      }
      setOtherCategories((current) =>
        current.map((item) =>
          item.toLowerCase() === result.previousName.toLowerCase() ? result.name : item,
        ),
      );
    }
  };

  const categories = options.categories[type];
  const isExpense = type === 'expense';
  // Credit cards appear in the method list by name; label them with their
  // last-4 so they read as cards next to the bank accounts.
  const cardByName = new Map(options.creditCards.map((card) => [card.name.toLowerCase(), card]));
  // Bank accounts read by their bank rather than their stored name, which is
  // usually a generic "Conta Corrente".
  const accountByName = new Map(
    options.bankAccounts.map((account) => [account.name.toLowerCase(), account]),
  );
  /**
   * Labels each account in `optionNames` by its bank, with `typeSuffix` in
   * parentheses to spell out which balance the money moves through. A bank
   * with two accounts in the same list falls back to their own names, which
   * already tell them apart. The count is per list, so a picker showing one
   * account per bank stays short.
   */
  const accountLabeller = (optionNames: string[], typeSuffix?: string) => {
    const perBank = new Map<string, number>();
    for (const option of optionNames) {
      const bank = accountByName.get(option.toLowerCase())?.bank;
      if (bank) perBank.set(bank, (perBank.get(bank) ?? 0) + 1);
    }

    return (option: string) => {
      const account = accountByName.get(option.toLowerCase());
      if (!account) return localizeAccountName(option, locale);
      if (account.bank !== account.name && (perBank.get(account.bank) ?? 0) > 1)
        return `${account.bank} · ${account.label}`;
      return typeSuffix ? `${account.bank} (${typeSuffix})` : account.bank;
    };
  };
  // Every payment-method account is a checking account, so the suffix is fixed.
  const methodAccountLabel = accountLabeller(
    options.paymentMethods,
    messages.dashboard.accountTypes.checking,
  );
  const depositAccountLabel = accountLabeller(bankAccountNames);
  const paymentMethodLabel = (option: string) => {
    const mapped =
      messages.transactions.paymentMethods[
        option as keyof typeof messages.transactions.paymentMethods
      ];
    if (mapped) return mapped;
    const card = cardByName.get(option.toLowerCase());
    if (card) return card.last4 ? `${option} ···· ${card.last4}` : option;
    return methodAccountLabel(option);
  };
  const isRecurring = recurrenceFrequency !== 'none';
  const isAutomaticPayment = paymentMethod.startsWith('Automatic');
  const isPaymentDateCalculated = isAutomaticPayment || isRecurring;
  const calculatedPaymentDate = isRecurring ? recurringStartDate : date;
  const dueDateValue = isAutomaticPayment ? calculatedPaymentDate : dueDate;
  const paymentDateValue = isPaymentDateCalculated ? calculatedPaymentDate : paymentDate;
  const amount = currencyDigitsToAmount(amountDigits);
  const canSubmit =
    cleanLabel(name).length > 0 &&
    amount > 0 &&
    cleanLabel(primaryCategory).length > 0 &&
    (recurrenceFrequency !== 'custom' || isRecurrenceInterval(recurrenceIntervalDays));
  const busy = isPending || isDeleting || closing;

  const summary = [
    primaryCategory || (type === 'income' ? messages.common.income : messages.common.expense),
    isRecurring
      ? messages.transactions.repeats(
          recurrenceFrequency === 'custom'
            ? messages.transactions.everyNDays(recurrenceIntervalDays)
            : messages.transactions.frequency[recurrenceFrequency],
        )
      : null,
    isExpense
      ? messages.transactions.dueSummary(shortDate(dueDateValue, locale, messages.common.noDate))
      : shortDate(date, locale, messages.common.noDate),
  ]
    .filter(Boolean)
    .join(' · ');
  const isPage = variant === 'page';
  const title = `${isEditing ? messages.transactions.editTitle : messages.transactions.newTitle} ${messages.common.transaction}`;
  const submitLabel = isEditing ? messages.transactions.saveChanges : messages.transactions.create;

  const handleTypeChange = (nextType: TransactionFormType) => {
    if (lockType) return;

    setType(nextType);
    setPrimaryCategory(options.categories[nextType][0] ?? '');
    setOtherCategories([]);
  };

  const handleDateChange = (nextDate: string) => {
    setDate(nextDate);
    if (!fiscalMonthTouched) {
      setFiscalMonth(monthOfDate(nextDate) || fiscalMonth);
    }
    if (isExpense && isAutomaticPayment && !isRecurring) {
      setStatus(computeStatus(nextDate, options.today));
    }
  };

  const handleFiscalMonthChange = (month: number) => {
    setFiscalMonth(month);
    setFiscalMonthTouched(true);
  };

  const handleRecurringChange = (checked: boolean) => {
    const nextFrequency = checked ? 'monthly' : 'none';
    const nextCalculatedDate = checked ? recurringStartDate : date;
    setRecurrenceFrequency(nextFrequency);

    if (checked) {
      setRecurringStartDate((current) => current || options.today);
    }

    if (isExpense && isAutomaticPayment) {
      setStatus(computeStatus(nextCalculatedDate, options.today));
    }
  };

  const handleFrequencyChange = (frequency: RecurrenceFrequency) => {
    setRecurrenceFrequency(frequency);
    if (isExpense && isAutomaticPayment) {
      setStatus(computeStatus(recurringStartDate, options.today));
    }
  };

  const handleRecurringStartDateChange = (nextDate: string) => {
    setRecurringStartDate(nextDate);
    if (isExpense && isAutomaticPayment) {
      setStatus(computeStatus(nextDate, options.today));
    }
  };

  const handlePaymentMethodChange = (selected: string[]) => {
    const nextPaymentMethod = selected[0] ?? defaultPaymentMethod;
    setPaymentMethod(nextPaymentMethod);

    if (nextPaymentMethod.startsWith('Automatic')) {
      setStatus(computeStatus(calculatedPaymentDate, options.today));
      return;
    }

    if (nextPaymentMethod === 'Manual') {
      setStatus('Unpaid');
    }
  };

  /** Closes the route this form is the page of; a no-op inside a modal. */
  const leave = () => {
    if (!redirectTo) return;
    if (router.canGoBack()) router.back();
    else router.replace(redirectTo as Href);
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
      return;
    }

    leave();
  };

  const handleDelete = async () => {
    if (!transactionId || busy) return;

    let result: Awaited<ReturnType<typeof remove.run>>;
    try {
      result = await remove.run(transactionId);
    } catch (error) {
      toast.error(withDetail(messages.transactions.deleteError, errorMessage(error)));
      return;
    }

    if (!result.ok) {
      toast.error(withDetail(messages.transactions.deleteError, result.message));
      return;
    }

    toast.success(withDetail(messages.transactions.deleted, name));
    setClosing(true);
    setConfirmingDelete(false);
    // The confirmation sheet is a native modal of its own: it has to be gone
    // before the screen underneath it is dismissed.
    setTimeout(() => {
      onSuccess?.();
      leave();
    }, durations.base + 120);
  };

  const handleSubmit = async () => {
    if (!canSubmit || busy) return;
    Keyboard.dismiss();

    const input: CreateTransactionInput = {
      name,
      description,
      amount,
      date,
      fiscalMonth,
      type,
      recurrenceFrequency,
      recurringStartDate,
      recurringEndDate,
      primaryCategory,
      otherCategories,
      paymentMethod,
      status,
      recurrenceIntervalDays,
      dueDate: dueDateValue,
      paymentDate: paymentDateValue,
      installments,
      // Income posts to the chosen deposit account. Expenses keep their
      // account unless the user picked a new payment method; the method
      // then drives account resolution.
      accountName:
        type === 'income'
          ? bankAccountNames.includes(depositAccount)
            ? depositAccount
            : undefined
          : isEditing && paymentMethod === initialValues?.paymentMethod
            ? initialValues?.accountName
            : undefined,
    };

    let result: Awaited<ReturnType<typeof create.run>>;
    try {
      result = transactionId ? await update.run(transactionId, input) : await create.run(input);
    } catch (error) {
      toast.error(withDetail(messages.transactions.savedError, errorMessage(error)));
      return;
    }

    if (!result.ok) {
      toast.error(withDetail(messages.transactions.savedError, result.message));
      return;
    }

    toast.success(
      withDetail(
        isEditing ? messages.transactions.updated : messages.transactions.created,
        `${type === 'income' ? messages.common.income : messages.common.expense} · ${primaryCategory}`,
      ),
    );
    onSuccess?.();
    leave();
  };

  // Each form section is its own solid card: tighter on the page, as the
  // web's phone layout has it.
  const sectionCard = {
    padding: isPage ? 16 : 20,
    rounded: isPage ? radius.md : radius.lg,
    style: { gap: isPage ? 20 : 16 },
  } as const;
  const showSecondaryRow = features.fiscalMonth || (!isExpense && bankAccountNames.length > 0);

  const footer = (
    <View
      style={{
        gap: 8,
        paddingHorizontal: 16,
        paddingTop: 10,
        paddingBottom: Math.max(insets.bottom, 12),
        borderTopWidth: 1,
        borderTopColor: colors.line,
        backgroundColor: colors.bar,
      }}>
      {/* Editing swaps the summary hint for the destructive action. */}
      {isEditing ? (
        <Button
          block
          variant="destructive"
          size="lg"
          icon={(props) => <Trash2 {...props} />}
          label={isDeleting ? messages.transactions.deleting : messages.transactions.delete}
          disabled={busy}
          onPress={() => setConfirmingDelete(true)}
        />
      ) : (
        <Text size="xs" color="ink3" align="center" numberOfLines={1}>
          {summary}
        </Text>
      )}
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <Button
          variant="outline"
          size="xl"
          style={{ flex: 1 }}
          label={messages.common.cancel}
          onPress={handleCancel}
        />
        <Button
          size="xl"
          style={{ flex: 2 }}
          icon={!isEditing ? (props) => <Plus {...props} /> : undefined}
          label={
            isPending
              ? messages.transactions.saving
              : isEditing
                ? messages.transactions.saveChanges
                : typedCreateLabel(messages, isExpense)
          }
          disabled={!canSubmit || busy}
          onPress={() => void handleSubmit()}
        />
      </View>
    </View>
  );

  return (
    <>
      <Screen scroll={false} footer={footer}>
        <ModalSheetHeader
          title={title}
          onClose={handleCancel}
          action={
            <IconButton
              variant="action"
              accessibilityLabel={submitLabel}
              icon={(props) => <Check {...props} />}
              disabled={!canSubmit || busy}
              onPress={() => void handleSubmit()}
            />
          }
        />
        <ScrollView
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ gap: 12, paddingHorizontal: 16, paddingBottom: 24 }}>
          <TypeSelector value={type} locked={lockType} onValueChange={handleTypeChange} />

          <Card variant="solid" {...sectionCard}>
            {!isPage ? <SectionDivider icon={List} title={messages.transactions.details} /> : null}
            <FormField label={messages.transactions.name}>
              <Input
                placeholder={
                  isExpense
                    ? messages.transactions.transactionNamePlaceholder
                    : messages.transactions.acmePayroll
                }
                value={name}
                onChangeText={setName}
              />
            </FormField>

            <View style={{ gap: 16 }}>
              <FormField label={messages.common.amount}>
                <CurrencyInput value={amountDigits} onValueChange={setAmountDigits} />
              </FormField>

              <DateField
                label={messages.transactions.date}
                value={date}
                onChange={handleDateChange}
              />
            </View>

            {showSecondaryRow ? (
              <View style={{ gap: 16 }}>
                {features.fiscalMonth ? (
                  <MonthPicker
                    label={messages.transactions.fiscalMonth}
                    info={
                      <FieldInfo
                        title={messages.transactions.fiscalMonthInfoTitle}
                        body={messages.transactions.fiscalMonthInfoBody}
                      />
                    }
                    value={fiscalMonth}
                    onChange={handleFiscalMonthChange}
                    placeholder={messages.transactions.chooseFiscalMonth}
                    locale={locale}
                  />
                ) : null}
                {!isExpense && bankAccountNames.length > 0 ? (
                  <PillPicker
                    label={messages.transactions.depositAccount}
                    options={bankAccountNames}
                    selected={depositAccount ? [depositAccount] : []}
                    onChange={(selected) => setDepositAccount(selected[0] ?? defaultDepositAccount)}
                    placeholder={messages.transactions.chooseAccount}
                    getOptionLabel={depositAccountLabel}
                    plainSingleValue
                    allowCreate={false}
                  />
                ) : null}
              </View>
            ) : null}

            <View style={{ gap: 16 }}>
              <PillPicker
                label={messages.transactions.primaryCategory}
                options={categories}
                selected={primaryCategory ? [primaryCategory] : []}
                onChange={(selected) => setPrimaryCategory(selected[0] ?? '')}
                placeholder={messages.transactions.chooseCategory}
                chipColors={categoryChipColors}
                onChipPress={(value) => setCategoryEditor({ name: value, open: true })}
                chipTitle={messages.transactions.editCategory}
              />
              <PillPicker
                label={messages.transactions.otherCategories}
                optional
                options={categories}
                selected={otherCategories}
                onChange={setOtherCategories}
                placeholder={messages.transactions.addCategories}
                chipColors={categoryChipColors}
                multiple
              />
            </View>

            <FormField label={messages.transactions.description} optional>
              <Input
                multiline
                placeholder={messages.transactions.anythingWorthRemembering}
                value={description}
                onChangeText={setDescription}
              />
            </FormField>
          </Card>

          <Card variant="solid" {...sectionCard}>
            <SectionDivider icon={Repeat2} title={messages.transactions.recurring} />
            <View style={{ gap: 20 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <Switch
                  accessibilityLabel={messages.transactions.recurring}
                  checked={isRecurring}
                  onCheckedChange={handleRecurringChange}
                />
                <Pressable
                  accessible={false}
                  hitSlop={8}
                  onPress={() => handleRecurringChange(!isRecurring)}>
                  <Text font="sansMedium" size="base">
                    {messages.transactions.recurring}
                  </Text>
                </Pressable>
              </View>
              <View
                style={{
                  flexDirection: 'row',
                  flexWrap: 'wrap',
                  gap: 8,
                  opacity: isRecurring ? 1 : 0.45,
                }}>
                {recurrenceFrequencies
                  .filter((frequency) => frequency !== 'none')
                  .map((frequency) => {
                    const active = recurrenceFrequency === frequency;
                    return (
                      <Pressable
                        key={frequency}
                        accessibilityRole="button"
                        accessibilityState={{ selected: active, disabled: !isRecurring }}
                        disabled={!isRecurring}
                        onPress={() => handleFrequencyChange(frequency)}
                        style={{
                          height: 40,
                          paddingHorizontal: 20,
                          justifyContent: 'center',
                          borderRadius: radius.pill,
                          borderWidth: 1,
                          borderColor: active ? 'transparent' : colors.lineStrong,
                          backgroundColor: active ? colors.action : colors.surface1,
                        }}>
                        <Text
                          font="sansMedium"
                          size="sm"
                          color={active ? 'actionForeground' : 'ink1'}>
                          {messages.transactions.frequency[frequency]}
                        </Text>
                      </Pressable>
                    );
                  })}
                {recurrenceFrequency === 'custom' ? (
                  // Sits in the same wrapping row as the chips so the
                  // interval field lines up with them.
                  <RecurrenceIntervalField
                    value={recurrenceIntervalDays}
                    onChange={setRecurrenceIntervalDays}
                  />
                ) : null}
              </View>
            </View>

            {isRecurring ? (
              <View style={{ gap: 16 }}>
                <DateField
                  label={messages.transactions.recurringStartDate}
                  value={recurringStartDate}
                  onChange={handleRecurringStartDateChange}
                />
                <DateField
                  label={messages.transactions.recurringEndDate}
                  value={recurringEndDate}
                  onChange={setRecurringEndDate}
                  optional
                />
              </View>
            ) : null}
          </Card>

          {isExpense ? (
            <Card variant="solid" {...sectionCard}>
              <SectionDivider icon={CreditCard} title={messages.transactions.payment} />
              <View style={{ gap: 16 }}>
                <PillPicker
                  label={messages.transactions.method}
                  // The method has to be an account or card the workspace
                  // owns, so free-text entries are not offered here.
                  allowCreate={false}
                  options={options.paymentMethods}
                  selected={paymentMethod ? [paymentMethod] : []}
                  onChange={handlePaymentMethodChange}
                  placeholder={messages.transactions.choosePaymentMethod}
                  getOptionLabel={paymentMethodLabel}
                  plainSingleValue
                />
                <PillPicker
                  label={messages.transactions.status}
                  options={options.statuses}
                  selected={status ? [status] : []}
                  onChange={(selected) => setStatus(selected[0] ?? '')}
                  placeholder={messages.transactions.chooseStatus}
                  chipColors={statusChipColors}
                  getOptionLabel={(option) =>
                    messages.transactions.statuses[
                      option as keyof typeof messages.transactions.statuses
                    ] ?? option
                  }
                />
                <DateField
                  label={messages.transactions.dueDate}
                  value={dueDateValue}
                  onChange={setDueDate}
                  disabled={isAutomaticPayment}
                />
                <InstallmentsField value={installments} onChange={setInstallments} />
                {status === 'Paid' ? (
                  <DateField
                    label={messages.transactions.paymentDate}
                    value={paymentDateValue}
                    onChange={setPaymentDate}
                    disabled={isPaymentDateCalculated}
                  />
                ) : null}
              </View>
            </Card>
          ) : null}
        </ScrollView>
      </Screen>

      <CategoryEditorModal
        open={categoryEditor.open}
        onOpenChange={(open) => setCategoryEditor((current) => ({ ...current, open }))}
        kind={type}
        name={categoryEditor.name}
        appearance={categoryAppearance(categoryEditor.name)}
        onSaved={handleCategorySaved}
      />

      {/* Deleting is irreversible, so it takes a second, explicit confirmation. */}
      <Sheet
        open={confirmingDelete}
        onOpenChange={(open) => {
          if (!open && !isDeleting) setConfirmingDelete(false);
        }}
        title={messages.transactions.deleteTitle}
        description={messages.transactions.deleteConfirm}
        footer={
          <>
            <Button
              variant="outline"
              size="lg"
              style={{ flex: 1 }}
              label={messages.common.cancel}
              disabled={isDeleting}
              onPress={() => setConfirmingDelete(false)}
            />
            <Button
              variant="destructive"
              size="lg"
              style={{ flex: 1 }}
              icon={(props) => <Trash2 {...props} />}
              label={isDeleting ? messages.transactions.deleting : messages.transactions.delete}
              loading={isDeleting}
              onPress={() => void handleDelete()}
            />
          </>
        }>
        <Text font="sansMedium" size="sm" numberOfLines={1}>
          {name || messages.transactions.name}
        </Text>
      </Sheet>
    </>
  );
}

/** Title with the action's own message under it, as the web toasts read. */
function withDetail(title: string, detail?: string) {
  return detail ? `${title}\n${detail}` : title;
}

function errorMessage(error: unknown) {
  return error instanceof ApiError || error instanceof Error ? error.message : String(error);
}

function parseDateValue(value: string) {
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(year, month - 1, day);

  return Number.isNaN(date.getTime()) ? undefined : date;
}

/** Month (1-12) of a `yyyy-mm-dd` string, or 0 when it can't be parsed. */
function monthOfDate(value: string) {
  const month = Number(value.slice(5, 7));
  return month >= 1 && month <= 12 ? month : 0;
}

function shortDate(value: string, locale: AppLocale, fallback: string) {
  const date = parseDateValue(value);

  if (!date) return fallback;

  return formatCapitalizedDate(date, locale, {
    month: 'short',
    day: 'numeric',
  });
}

function computeStatus(paymentDate: string, today: string) {
  return paymentDate > today ? 'Upcoming' : 'Paid';
}

function typedCreateLabel(messages: ReturnType<typeof useI18n>['messages'], isExpense: boolean) {
  return isExpense ? messages.transactions.addExpense : messages.income.addIncome;
}
