import { TriangleAlert } from 'lucide-react-native';
import { View } from 'react-native';

import { Card } from '@/components/ui/card';
import { ColorPickerButton } from '@/components/ui/color-picker-button';
import { CurrencyInput, currencyDigitsToAmount } from '@/components/ui/currency-input';
import { DateInput } from '@/components/ui/date-input';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import type { CreateGoalInput } from '@/lib/goals/goals-actions';
import { useI18n } from '@/lib/i18n/provider';
import { dateInputValue } from '@/lib/transactions/transaction-utils';
import { useTheme } from '@/theme/theme-provider';
import { radius } from '@/theme/tokens';

export type GoalTone = CreateGoalInput['tone'];

export const goalToneOptions: ReadonlyArray<{ value: GoalTone; hex: string }> = [
  { value: 'plum', hex: '#7c3aed' },
  { value: 'coral', hex: '#f04e7a' },
  { value: 'sage', hex: '#5fa377' },
  { value: 'amber', hex: '#d49234' },
];

export type GoalFormValues = {
  name: string;
  targetDigits: string;
  /** ISO yyyy-mm-dd or "". */
  targetDate: string;
  monthlyDigits: string;
  savedDigits: string;
  color: string;
};

export type GoalFormErrors = {
  saved?: string;
  monthly?: string;
  targetDate?: string;
  /** Non-blocking: the monthly pace won't reach the target by the date. */
  paceWarning?: string;
};

type GoalMessages = ReturnType<typeof useI18n>['messages']['goals'];

/**
 * Cross-field sanity checks shared by the add and edit dialogs. Everything
 * except `paceWarning` blocks submission; the server re-validates the same
 * rules in `assertValidGoalInput`.
 */
export function goalFormErrors(values: GoalFormValues, messages: GoalMessages): GoalFormErrors {
  const target = currencyDigitsToAmount(values.targetDigits);
  const saved = currencyDigitsToAmount(values.savedDigits);
  const monthly = currencyDigitsToAmount(values.monthlyDigits);
  const today = dateInputValue(new Date());
  const errors: GoalFormErrors = {};

  if (target > 0 && saved > target) {
    errors.saved = messages.validationExceedsTarget;
  }
  if (target > 0 && monthly > target) {
    errors.monthly = messages.validationExceedsTarget;
  }
  if (values.targetDate && values.targetDate <= today) {
    errors.targetDate = messages.validationPastDate;
  }

  if (
    !errors.saved &&
    !errors.monthly &&
    !errors.targetDate &&
    values.targetDate &&
    target > 0 &&
    monthly > 0 &&
    saved < target
  ) {
    const months = monthsUntil(values.targetDate);
    if (saved + monthly * months < target) {
      errors.paceWarning = messages.validationPaceShort;
    }
  }

  return errors;
}

export function goalFormHasBlockingErrors(errors: GoalFormErrors) {
  return Boolean(errors.saved || errors.monthly || errors.targetDate);
}

/** Whole months from today until the given ISO date (never negative). */
function monthsUntil(iso: string) {
  const now = new Date();
  const date = new Date(`${iso}T00:00:00`);
  const months =
    (date.getFullYear() - now.getFullYear()) * 12 + (date.getMonth() - now.getMonth());
  return Math.max(0, months);
}

/**
 * The goals table stores a tone enum, not a hex: snap a picked colour to the
 * closest option. Same maths as the web's `nearestColorOption` (which lives
 * in its onboarding UI module).
 */
export function nearestColorOption<T extends string>(
  hex: string,
  options: ReadonlyArray<{ value: T; hex: string }>,
): T {
  const rgb = hexToRgb(hex);
  let best = options[0].value;
  let bestDistance = Number.POSITIVE_INFINITY;
  for (const option of options) {
    const candidate = hexToRgb(option.hex);
    const distance =
      (rgb.r - candidate.r) ** 2 + (rgb.g - candidate.g) ** 2 + (rgb.b - candidate.b) ** 2;
    if (distance < bestDistance) {
      bestDistance = distance;
      best = option.value;
    }
  }
  return best;
}

function hexToRgb(hex: string) {
  const value = hex.replace('#', '');
  const full =
    value.length === 3
      ? value
          .split('')
          .map((channel) => channel + channel)
          .join('')
      : value;
  const channel = (start: number) => {
    const parsed = parseInt(full.slice(start, start + 2), 16);
    return Number.isFinite(parsed) ? parsed : 0;
  };
  return { r: channel(0), g: channel(2), b: channel(4) };
}

/**
 * The add and edit goal dialogs share this exact field layout: name, target,
 * date, monthly, already-saved, then colour (one column on a phone).
 */
export function GoalFormFields({
  errors,
  onChange,
  values,
}: {
  errors: GoalFormErrors;
  onChange: (partial: Partial<GoalFormValues>) => void;
  values: GoalFormValues;
}) {
  const { messages } = useI18n();
  const { colors } = useTheme();

  return (
    <Card variant="solid" rounded={radius.xl} style={{ gap: 16 }}>
      <FormField label={messages.goals.goalNameLabel}>
        <Input
          value={values.name}
          onChangeText={(name) => onChange({ name })}
          maxLength={60}
          accessibilityLabel={messages.goals.goalNameLabel}
        />
      </FormField>

      <FormField label={messages.goals.targetAmount}>
        <CurrencyInput
          value={values.targetDigits}
          onValueChange={(digits) => onChange({ targetDigits: digits })}
          accessibilityLabel={messages.goals.targetAmount}
        />
      </FormField>

      <FormField label={messages.goals.targetDateLabel} optional error={errors.targetDate}>
        <DateInput
          accessibilityLabel={`${messages.transactions.chooseDate}: ${messages.goals.targetDateLabel}`}
          value={values.targetDate}
          onChange={(iso) => onChange({ targetDate: iso })}
        />
      </FormField>

      <FormField label={messages.goals.monthlySaving} optional error={errors.monthly}>
        <CurrencyInput
          value={values.monthlyDigits}
          onValueChange={(digits) => onChange({ monthlyDigits: digits })}
          invalid={Boolean(errors.monthly)}
          accessibilityLabel={messages.goals.monthlySaving}
        />
      </FormField>

      <FormField label={messages.goals.alreadySaved} optional error={errors.saved}>
        <CurrencyInput
          value={values.savedDigits}
          onValueChange={(digits) => onChange({ savedDigits: digits })}
          invalid={Boolean(errors.saved)}
          accessibilityLabel={messages.goals.alreadySaved}
        />
      </FormField>

      <FormField label={messages.goals.colorLabel}>
        <ColorPickerButton color={values.color} onChange={(hex) => onChange({ color: hex })} />
      </FormField>

      {errors.paceWarning ? (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'flex-start',
            gap: 8,
            paddingHorizontal: 12,
            paddingVertical: 10,
            borderRadius: radius.md,
            backgroundColor: colors.warningSoft,
          }}>
          <TriangleAlert size={14} color={colors.warning} style={{ marginTop: 2 }} />
          <Text size="xs" color="warning" style={{ flex: 1, lineHeight: 19 }}>
            {errors.paceWarning}
          </Text>
        </View>
      ) : null}
    </Card>
  );
}
