import { Clock3 } from 'lucide-react-native';
import { useState } from 'react';
import { View } from 'react-native';

import { GoalsNoData } from '@/components/goals/goals-no-data';
import { WhatIfSlider } from '@/components/goals/what-if-slider';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CurrencyInput, currencyDigitsToAmount } from '@/components/ui/currency-input';
import { FieldLabel } from '@/components/ui/form-field';
import { Modal } from '@/components/ui/modal';
import { Text } from '@/components/ui/text';
import type { WhatIfScenario } from '@/lib/goals/goals-queries';
import { getGoalProjection } from '@/lib/goals/goals-utils';
import { useI18n } from '@/lib/i18n/provider';
import { useTheme } from '@/theme/theme-provider';
import { palette, radius } from '@/theme/tokens';

export function WhatIfSimulator({ scenario }: { scenario: WhatIfScenario | null }) {
  const { messages } = useI18n();

  return (
    <View>
      {/* The section header floats above its own card. */}
      <Text font="display" size="2xl" tight style={{ paddingHorizontal: 6, paddingBottom: 12 }}>
        {messages.goals.whatIf}
      </Text>
      <Card>
        {scenario ? (
          // Start over from the suggested amount when the scenario changes
          // (another goal became the candidate, or its numbers were edited).
          <Simulator
            key={`${scenario.goalName}:${scenario.remaining}:${scenario.currentMonthlyContribution}:${scenario.maxExtraContribution}`}
            scenario={scenario}
          />
        ) : (
          <GoalsNoData />
        )}
      </Card>
    </View>
  );
}

function Simulator({ scenario }: { scenario: WhatIfScenario }) {
  const { formatCurrency, locale, messages } = useI18n();
  const { colors } = useTheme();
  const [extraContribution, setExtraContribution] = useState<number>(
    scenario.initialExtraContribution,
  );
  const [isCustomOpen, setIsCustomOpen] = useState(false);
  const [customAmountDigits, setCustomAmountDigits] = useState('');

  const projection = getGoalProjection({
    currentMonthlyContribution: scenario.currentMonthlyContribution,
    extraContribution,
    remaining: scenario.remaining,
    startMonthIndex: scenario.startMonthIndex,
    startYear: scenario.startYear,
    locale,
  });

  const setMonthlyIncrease = (value: number) => {
    setExtraContribution(Math.min(Math.max(value, 0), scenario.maxExtraContribution));
  };

  const openCustomAmount = () => {
    setCustomAmountDigits('');
    setIsCustomOpen(true);
  };

  const applyCustomAmount = () => {
    setMonthlyIncrease(currencyDigitsToAmount(customAmountDigits));
    setIsCustomOpen(false);
  };

  return (
    <>
      <Text
        font="sansSemiBold"
        size="2xs"
        color="ink3"
        uppercase
        tracking={0.5}
        style={{ marginBottom: 16 }}>
        {messages.goals.whatIfDescription}
      </Text>

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          gap: 16,
          marginBottom: 8,
        }}>
        <Text size="sm" color="ink2" style={{ flex: 1 }}>
          {messages.goals.addToGoal(scenario.goalName)}
        </Text>
        <Text font="display" size="4xl" tight color="accentSoftFg">
          +{formatCurrency(extraContribution)}
          <Text font="display" size="sm" color="ink3">
            {messages.goals.monthlySuffix}
          </Text>
        </Text>
      </View>

      <WhatIfSlider
        accessibilityLabel={messages.goals.extraMonthlySavings(scenario.goalName)}
        accessibilityValueText={formatCurrency(extraContribution)}
        max={scenario.maxExtraContribution}
        step={scenario.step}
        value={extraContribution}
        onChange={setMonthlyIncrease}
      />
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
        <Text font="mono" size="xs" color="ink3">
          {formatCurrency(0)}
        </Text>
        <Text font="mono" size="xs" color="ink3">
          {formatCurrency(scenario.maxExtraContribution)}
        </Text>
      </View>

      {/* The projection, as the design's soft boxed callout. */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'flex-start',
          gap: 12,
          marginTop: 16,
          padding: 16,
          borderRadius: radius.md,
          backgroundColor: colors.surface2,
        }}>
        <View
          style={{
            width: 32,
            height: 32,
            borderRadius: 16,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: colors.accentSoft,
          }}>
          <Clock3 size={16} color={colors.accentSoftFg} />
        </View>
        <Text font="display" size="base" style={{ flex: 1, lineHeight: 22 }}>
          {extraContribution === 0 ? (
            <>
              {messages.goals.currentPaceProjection(scenario.goalName)}{' '}
              <Text font="displayItalic" size="base" color={palette.coral600}>
                {projection.baseline}
              </Text>
              .
            </>
          ) : (
            <>
              {messages.goals.acceleratedProjection(scenario.goalName)}{' '}
              <Text font="displayItalic" size="base" color={palette.coral600}>
                {projection.adjusted}
              </Text>{' '}
              {messages.goals.insteadOf} {projection.baseline},{' '}
              <Text font="sansSemiBold" size="base">
                {messages.goals.monthsSooner(projection.monthsSooner)}
              </Text>
              .
            </>
          )}
        </Text>
      </View>

      <View style={{ flexDirection: 'row', gap: 8, marginTop: 16 }}>
        <Button
          variant="outline"
          size="lg"
          style={{ flex: 1 }}
          label={messages.goals.customValue}
          onPress={openCustomAmount}
        />
        {/* As on the web, confirming has no action behind it yet. */}
        <Button size="lg" style={{ flex: 1 }} label={messages.goals.confirmChange} />
      </View>

      <Modal
        open={isCustomOpen}
        onOpenChange={setIsCustomOpen}
        title={messages.goals.customValue}
        description={messages.goals.customValueDescription}
        footer={
          <>
            <Button
              variant="outline"
              size="lg"
              style={{ flex: 1 }}
              label={messages.common.cancel}
              onPress={() => setIsCustomOpen(false)}
            />
            <Button
              size="lg"
              style={{ flex: 1 }}
              label={messages.goals.apply}
              onPress={applyCustomAmount}
            />
          </>
        }>
        <View style={{ gap: 8 }}>
          <FieldLabel>{messages.goals.monthlyIncrease}</FieldLabel>
          <CurrencyInput
            autoFocus
            accessibilityLabel={messages.goals.monthlyIncrease}
            returnKeyType="done"
            onSubmitEditing={applyCustomAmount}
            onValueChange={setCustomAmountDigits}
            value={customAmountDigits}
          />
        </View>
      </Modal>
    </>
  );
}
