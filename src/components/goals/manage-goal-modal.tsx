import { Check, Trash2, TriangleAlert } from 'lucide-react-native';
import { useState } from 'react';
import { View } from 'react-native';

import { useApiAction } from '@/api/hooks';
import {
  GoalFormFields,
  goalFormErrors,
  goalFormHasBlockingErrors,
  goalToneOptions,
  nearestColorOption,
  type GoalFormValues,
} from '@/components/goals/goal-form';
import { Button } from '@/components/ui/button';
import { amountToCurrencyDigits, currencyDigitsToAmount } from '@/components/ui/currency-input';
import { Modal } from '@/components/ui/modal';
import { Sheet } from '@/components/ui/sheet';
import { Text } from '@/components/ui/text';
import { toast } from '@/components/ui/toast';
import type { Goal } from '@/lib/goals/goals-data';
import { useI18n } from '@/lib/i18n/provider';
import { useTheme } from '@/theme/theme-provider';
import { radius } from '@/theme/tokens';

type ManageGoalModalProps = {
  goal: Goal | null;
  onOpenChange: (open: boolean) => void;
  open: boolean;
};

/**
 * Edit sheet behind each goal row's gear button — the goals sibling of
 * `ManageAccountModal`: delete (behind a confirmation) above cancel + save.
 */
export function ManageGoalModal({ goal, onOpenChange, open }: ManageGoalModalProps) {
  const { messages } = useI18n();
  const { colors } = useTheme();
  const updateGoal = useApiAction('goals.update');
  const deleteGoal = useApiAction('goals.delete');
  const [values, setValues] = useState<GoalFormValues>({
    name: '',
    targetDigits: '',
    targetDate: '',
    monthlyDigits: '',
    savedDigits: '',
    color: goalToneOptions[0].hex,
  });
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const isPending = updateGoal.pending;
  const isDeleting = deleteGoal.pending;

  // Re-seed the form each time the modal opens for a (possibly different)
  // goal, adjusting state during render instead of in an effect.
  const [openKey, setOpenKey] = useState<string | null>(null);
  const renderKey = open && goal?.id ? `open:${goal.id}` : null;
  if (openKey !== renderKey) {
    setOpenKey(renderKey);
    if (open && goal) {
      setValues({
        name: goal.name,
        targetDigits: amountToCurrencyDigits(goal.target),
        targetDate: goal.targetDateIso ?? '',
        monthlyDigits: amountToCurrencyDigits(goal.monthlyContribution),
        savedDigits: amountToCurrencyDigits(goal.saved),
        color:
          goalToneOptions.find((option) => option.value === goal.tone)?.hex ??
          goalToneOptions[0].hex,
      });
      setConfirmingDelete(false);
    }
  }

  if (!goal?.id) return null;
  const goalId = goal.id;

  const errors = goalFormErrors(values, messages.goals);
  const canSubmit =
    values.name.trim().length > 0 &&
    currencyDigitsToAmount(values.targetDigits) > 0 &&
    !goalFormHasBlockingErrors(errors) &&
    !isPending;

  const submit = async () => {
    if (!canSubmit) return;

    try {
      const result = await updateGoal.run(goalId, {
        name: values.name,
        tone: nearestColorOption(values.color, goalToneOptions),
        target: currencyDigitsToAmount(values.targetDigits),
        saved: currencyDigitsToAmount(values.savedDigits),
        monthlyContribution: currencyDigitsToAmount(values.monthlyDigits),
        targetDate: values.targetDate || null,
      });

      if (result.ok) {
        toast.success(messages.goals.goalUpdated);
        onOpenChange(false);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : String(error));
    }
  };

  const remove = async () => {
    try {
      const result = await deleteGoal.run(goalId);
      if (result.ok) {
        toast.success(messages.goals.goalDeleted);
        setConfirmingDelete(false);
        onOpenChange(false);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : String(error));
    }
  };

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={messages.goals.editGoal}
      description={messages.goals.editGoalDescription}
      // Three labelled buttons do not fit one phone row: delete sits above.
      footerNote={
        <Button
          variant="ghost"
          size="lg"
          style={{ alignSelf: 'flex-start', paddingHorizontal: 8 }}
          disabled={isPending}
          onPress={() => setConfirmingDelete(true)}>
          <Trash2 size={16} color={colors.negativeFg} />
          <Text font="sansMedium" size="sm" color="negativeFg">
            {messages.goals.deleteGoal}
          </Text>
        </Button>
      }
      footer={
        <>
          <Button
            variant="outline"
            size="lg"
            style={{ flex: 1 }}
            label={messages.common.cancel}
            disabled={isPending}
            onPress={() => onOpenChange(false)}
          />
          <Button
            size="lg"
            style={{ flex: 1 }}
            icon={(props) => <Check {...props} />}
            label={isPending ? `${messages.goals.savingGoal}…` : messages.common.save}
            loading={isPending}
            disabled={!canSubmit}
            onPress={submit}
          />
        </>
      }>
      <GoalFormFields
        values={values}
        errors={errors}
        onChange={(partial) => setValues((prev) => ({ ...prev, ...partial }))}
      />

      <Sheet
        open={confirmingDelete}
        onOpenChange={(next) => {
          if (!isDeleting) setConfirmingDelete(next);
        }}
        title={messages.goals.deleteGoal}
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
              label={isDeleting ? `${messages.goals.deletingGoal}…` : messages.goals.deleteGoal}
              loading={isDeleting}
              onPress={remove}
            />
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
            // `border-negative/30`: the theme's negative is a 6-digit hex.
            borderColor: `${colors.negative}4d`,
            backgroundColor: colors.negativeSoft,
          }}>
          <TriangleAlert size={20} color={colors.negativeFg} style={{ marginTop: 2 }} />
          <Text size="sm" color="negativeFg" style={{ flex: 1, lineHeight: 22 }}>
            {messages.goals.deleteGoalWarning(goal.name)}
          </Text>
        </View>
      </Sheet>
    </Modal>
  );
}
