import { Car, Home, Laptop, Send, ShieldCheck, Target, type LucideIcon } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { useApiAction } from '@/api/hooks';
import {
  nearestColorOption,
  obAttempt,
  ObAddedRow,
  ObDashedButton,
  ObEmptyNote,
  ObRemoveButton,
  obToneGradients,
} from '@/components/onboarding/onboarding-ui';
import { ColorPickerButton } from '@/components/ui/color-picker-button';
import { CurrencyInput, currencyDigitsToAmount } from '@/components/ui/currency-input';
import { DateInput } from '@/components/ui/date-input';
import { FieldLabel, FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { toast } from '@/components/ui/toast';
import { formatCapitalizedDate } from '@/lib/i18n/format';
import { useI18n } from '@/lib/i18n/provider';
import type { OnboardingGoalInput } from '@/lib/onboarding/onboarding-actions';
import { useTheme } from '@/theme/theme-provider';
import { radius } from '@/theme/tokens';

type GoalIcon = OnboardingGoalInput['icon'];
type GoalTone = OnboardingGoalInput['tone'];

const toneOptions: ReadonlyArray<{ value: GoalTone; hex: string }> = [
  { value: 'plum', hex: '#7c3aed' },
  { value: 'coral', hex: '#f04e7a' },
  { value: 'sage', hex: '#5fa377' },
  { value: 'amber', hex: '#d49234' },
];

type Suggestion = {
  key: 'emergency' | 'trip' | 'laptop' | 'home' | 'car';
  icon: LucideIcon;
  goalIcon: GoalIcon;
  amountDigits: string;
};

const suggestions: Suggestion[] = [
  { key: 'emergency', icon: ShieldCheck, goalIcon: 'reserve', amountDigits: '500000' },
  { key: 'trip', icon: Send, goalIcon: 'travel', amountDigits: '350000' },
  { key: 'laptop', icon: Laptop, goalIcon: 'laptop', amountDigits: '220000' },
  { key: 'home', icon: Home, goalIcon: 'reserve', amountDigits: '2000000' },
  { key: 'car', icon: Car, goalIcon: 'travel', amountDigits: '1200000' },
];

export type OnboardingGoalSummary = {
  id: string;
  name: string;
  tone: GoalTone;
  target: number;
  targetDate: string | null;
};

type OnboardingStepGoalsProps = {
  goals: OnboardingGoalSummary[];
  onGoalsChange: (goals: OnboardingGoalSummary[]) => void;
};

export function OnboardingStepGoals({ goals, onGoalsChange }: OnboardingStepGoalsProps) {
  const { locale, messages, formatCurrency } = useI18n();
  const { colors } = useTheme();
  const t = messages.onboarding;

  const createGoal = useApiAction('onboarding.createGoal');
  const deleteGoal = useApiAction('onboarding.deleteGoal');
  const isPending = createGoal.pending || deleteGoal.pending;

  const [name, setName] = useState('');
  const [targetDigits, setTargetDigits] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [color, setColor] = useState('#7c3aed');
  const [icon, setIcon] = useState<GoalIcon>('reserve');

  const canSubmit = name.trim().length > 0 && currencyDigitsToAmount(targetDigits) > 0 && !isPending;

  const applySuggestion = (suggestion: Suggestion) => {
    setName(t.suggestions[suggestion.key]);
    setTargetDigits(suggestion.amountDigits);
    setIcon(suggestion.goalIcon);
  };

  const submit = async () => {
    if (!canSubmit) return;
    const tone = nearestColorOption(color, toneOptions);
    const target = currencyDigitsToAmount(targetDigits);

    const result = await obAttempt(() =>
      createGoal.run({
        name,
        icon,
        tone,
        target,
        saved: 0,
        monthlyContribution: 0,
        targetDate: targetDate || null,
      }),
    );
    if (!result) return;
    if (!result.ok) {
      toast.error(result.message);
      return;
    }

    toast.success(t.goalAdded);
    onGoalsChange([
      ...goals,
      { id: result.ids[0], name: name.trim(), tone, target, targetDate: targetDate || null },
    ]);
    setName('');
    setTargetDigits('');
    setTargetDate('');
    setIcon('reserve');
  };

  const removeGoal = async (index: number) => {
    const goal = goals[index];
    const result = await obAttempt(() => deleteGoal.run(goal.id));
    if (!result) return;
    if (!result.ok) {
      toast.error(result.message);
      return;
    }
    onGoalsChange(goals.filter((_, i) => i !== index));
  };

  const formatDueDate = (iso: string) =>
    formatCapitalizedDate(new Date(`${iso}T00:00:00`), locale, {
      month: 'short',
      year: 'numeric',
    });

  return (
    <View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {suggestions.map((suggestion) => {
          const Icon = suggestion.icon;
          return (
            <Pressable
              key={suggestion.key}
              accessibilityRole="button"
              onPress={() => applySuggestion(suggestion)}
              style={({ pressed }) => ({
                height: 36,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
                paddingHorizontal: 14,
                borderRadius: radius.pill,
                borderWidth: 1,
                borderColor: pressed ? 'transparent' : colors.controlBorder,
                backgroundColor: pressed ? colors.accentSoft : colors.control,
              })}>
              <Icon size={14} color={colors.ink1} />
              <Text font="sansMedium" size="xs">
                {t.suggestions[suggestion.key]}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View
        style={{
          gap: 16,
          marginTop: 16,
          padding: 18,
          borderRadius: radius.xl,
          borderWidth: 1,
          borderStyle: 'dashed',
          borderColor: colors.lineStrong,
          backgroundColor: colors.control,
        }}>
        <FormField label={t.goalName}>
          <Input
            value={name}
            onChangeText={setName}
            placeholder={t.goalNamePlaceholder}
            maxLength={60}
            containerStyle={{ backgroundColor: colors.surface1 }}
          />
        </FormField>
        <FormField label={t.goalTarget}>
          <CurrencyInput
            accessibilityLabel={t.goalTarget}
            value={targetDigits}
            onValueChange={setTargetDigits}
            containerStyle={{ backgroundColor: colors.surface1 }}
          />
        </FormField>
        <FormField label={t.goalTargetDate} optional>
          <DateInput
            accessibilityLabel={`${messages.transactions.chooseDate}: ${t.goalTargetDate}`}
            value={targetDate}
            onChange={setTargetDate}
            style={{ backgroundColor: colors.surface1 }}
          />
        </FormField>
        <View style={{ gap: 10 }}>
          <FieldLabel>{t.colorLabel}</FieldLabel>
          <ColorPickerButton color={color} onChange={setColor} />
        </View>
      </View>

      <View style={{ marginTop: 14 }}>
        <ObDashedButton
          label={t.addGoal}
          loading={createGoal.pending}
          disabled={!canSubmit}
          onPress={submit}
        />
      </View>

      <View style={{ marginTop: 20 }}>
        <FieldLabel>{t.yourGoals}</FieldLabel>
        <View style={{ gap: 10, marginTop: 10 }}>
          {goals.map((goal, index) => (
            <ObAddedRow
              key={goal.id}
              icon={Target}
              gradient={obToneGradients[goal.tone]}
              name={goal.name}
              meta={[
                formatCurrency(goal.target),
                goal.targetDate ? t.goalBy(formatDueDate(goal.targetDate)) : null,
              ]
                .filter(Boolean)
                .join(' · ')}
              actions={
                <ObRemoveButton
                  disabled={isPending}
                  label={t.remove}
                  onPress={() => removeGoal(index)}
                />
              }
            />
          ))}
        </View>
        {goals.length === 0 ? <ObEmptyNote>{t.goalsEmpty}</ObEmptyNote> : null}
      </View>
    </View>
  );
}
