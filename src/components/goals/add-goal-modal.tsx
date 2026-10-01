import { Check } from 'lucide-react-native';
import { useState } from 'react';

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
import { currencyDigitsToAmount } from '@/components/ui/currency-input';
import { Modal } from '@/components/ui/modal';
import { toast } from '@/components/ui/toast';
import { useI18n } from '@/lib/i18n/provider';

type AddGoalModalProps = {
  onOpenChange: (open: boolean) => void;
  open: boolean;
};

const emptyValues: GoalFormValues = {
  name: '',
  targetDigits: '',
  targetDate: '',
  monthlyDigits: '',
  savedDigits: '',
  color: goalToneOptions[0].hex,
};

/**
 * "New goal" sheet. The picked color snaps to the nearest goal tone (the goals
 * table stores a tone enum, not a hex). The plan's goal cap is enforced by the
 * action itself, which answers with the upgrade message when it is reached.
 */
export function AddGoalModal({ onOpenChange, open }: AddGoalModalProps) {
  const { messages } = useI18n();
  const createGoal = useApiAction('goals.create');
  const [values, setValues] = useState<GoalFormValues>(emptyValues);

  // Blank the form each time the modal opens, during render rather than in an
  // effect — the same pattern the account modals use to re-seed themselves.
  const [wasOpen, setWasOpen] = useState(false);
  if (wasOpen !== open) {
    setWasOpen(open);
    if (open) setValues(emptyValues);
  }

  const isPending = createGoal.pending;
  const errors = goalFormErrors(values, messages.goals);
  const canSubmit =
    values.name.trim().length > 0 &&
    currencyDigitsToAmount(values.targetDigits) > 0 &&
    !goalFormHasBlockingErrors(errors) &&
    !isPending;

  const submit = async () => {
    if (!canSubmit) return;

    try {
      const result = await createGoal.run({
        name: values.name,
        tone: nearestColorOption(values.color, goalToneOptions),
        target: currencyDigitsToAmount(values.targetDigits),
        saved: currencyDigitsToAmount(values.savedDigits),
        monthlyContribution: currencyDigitsToAmount(values.monthlyDigits),
        targetDate: values.targetDate || null,
      });

      if (result.ok) {
        toast.success(messages.goals.goalCreated);
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
      title={messages.goals.newGoal}
      description={messages.goals.addGoalDescription}
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
            label={isPending ? `${messages.goals.creatingGoal}…` : messages.goals.createGoal}
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
    </Modal>
  );
}
