import { Plus, X } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

import { CurrencyInput } from '@/components/ui/currency-input';
import { FieldLabel, FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { Text } from '@/components/ui/text';
import type { InterestMode, SavingsLabel } from '@/lib/accounts/accounts-data';
import { useI18n } from '@/lib/i18n/provider';
import { useTheme } from '@/theme/theme-provider';
import { radius } from '@/theme/tokens';

/**
 * In pt-BR the savings kind picks the rate's meaning — a poupança earns a flat
 * monthly percentage, a cofrinho earns a share of the CDI — so there is one
 * control, not two. Other locales have no such split and quote a plain APY.
 */
export function interestModeForLabel(label: SavingsLabel, isPtBR: boolean): InterestMode {
  if (!isPtBR) return 'apy';
  return label === 'cofrinho' ? 'cdi' : 'monthly';
}

/** One savings account as the forms hold it while being edited. */
export type SavingsDraft = {
  label: SavingsLabel;
  rate: string;
  balanceDigits: string;
};

export const emptySavingsDraft: SavingsDraft = {
  label: 'poupanca',
  rate: '',
  balanceDigits: '',
};

export function isSavingsRateValid(draft: SavingsDraft) {
  if (draft.rate.trim() === '') return true;
  const parsed = Number(draft.rate.replace(',', '.'));
  return Number.isFinite(parsed) && parsed >= 0 && parsed <= 200;
}

export function savingsRateValue(draft: SavingsDraft) {
  return draft.rate.trim() === '' ? 0 : Number(draft.rate.replace(',', '.'));
}

/**
 * The savings half of the account forms: a bank can hold several savings
 * accounts (a poupança plus one cofrinho per plan, say), so each entry carries
 * its own kind, rate, and balance.
 */
export function SavingsFields({
  drafts,
  lockedCount = 0,
  onChange,
}: {
  drafts: SavingsDraft[];
  /** Entries below this index already exist and cannot be removed here. */
  lockedCount?: number;
  onChange: (drafts: SavingsDraft[]) => void;
}) {
  const { locale, messages } = useI18n();
  const { colors } = useTheme();
  const t = messages.accountsPage;
  const isPtBR = locale === 'pt-BR';

  const setAt = (index: number, patch: Partial<SavingsDraft>) => {
    onChange(drafts.map((draft, position) => (position === index ? { ...draft, ...patch } : draft)));
  };
  const removeAt = (index: number) => {
    onChange(drafts.filter((_, position) => position !== index));
  };

  return (
    <View style={{ gap: 16 }}>
      {drafts.map((draft, index) => {
        const mode = interestModeForLabel(draft.label, isPtBR);
        const rateSuffix =
          mode === 'cdi' ? t.cdiPercent : mode === 'monthly' ? t.monthlyPercent : t.apyPercent;
        const kindName = isPtBR && draft.label === 'cofrinho' ? t.cofrinho : t.savings;
        const balanceLabel = drafts.length > 1 ? `${kindName} ${index + 1}` : kindName;
        const rateValid = isSavingsRateValid(draft);
        const removable = index >= lockedCount;

        return (
          <View
            key={index}
            style={[
              { gap: 16 },
              // Entries only need separating once there is more than one.
              index > 0 && { borderTopWidth: 1, borderTopColor: colors.line, paddingTop: 16 },
            ]}>
            {isPtBR ? (
              <View style={{ gap: 8 }}>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 12,
                    minHeight: 28,
                  }}>
                  <FieldLabel>{t.savingsNameLabel}</FieldLabel>
                  {removable ? (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={t.removeSavings}
                      hitSlop={8}
                      onPress={() => removeAt(index)}
                      style={({ pressed }) => ({
                        width: 28,
                        height: 28,
                        borderRadius: 14,
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: pressed ? colors.negativeSoft : 'transparent',
                      })}>
                      {({ pressed }) => (
                        <X size={16} color={pressed ? colors.negativeFg : colors.ink3} />
                      )}
                    </Pressable>
                  ) : null}
                </View>
                <SegmentedControl<SavingsLabel>
                  size="lg"
                  accessibilityLabel={t.savingsNameLabel}
                  options={[
                    { label: t.interestModePoupanca, value: 'poupanca' },
                    { label: t.cofrinho, value: 'cofrinho' },
                  ]}
                  value={draft.label}
                  onValueChange={(value) => setAt(index, { label: value })}
                />
              </View>
            ) : null}

            <FormField label={t.interestSection} error={rateValid ? null : t.invalidRate}>
              <Input
                mono
                value={draft.rate}
                onChangeText={(text) => setAt(index, { rate: text })}
                keyboardType="decimal-pad"
                placeholder="0"
                invalid={!rateValid}
                accessibilityLabel={`${t.interestSection} (${rateSuffix})`}
                // The suffix carries the unit, so the field itself holds a
                // bare number — "0,5" reads as "0,5% do CDI".
                trailing={
                  <Text size="sm" color="ink3">
                    {rateSuffix}
                  </Text>
                }
              />
            </FormField>

            <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 8 }}>
              <FormField label={balanceLabel} style={{ flex: 1 }}>
                <CurrencyInput
                    accessibilityLabel={balanceLabel}
                  value={draft.balanceDigits}
                  onValueChange={(value) => setAt(index, { balanceDigits: value })}
                />
              </FormField>
              {/* Locales without the kind picker have no header to hang the
                  remove control on, so it sits beside the balance instead. */}
              {!isPtBR && removable ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t.removeSavings}
                  onPress={() => removeAt(index)}
                  style={({ pressed }) => ({
                    width: 44,
                    height: 44,
                    borderRadius: radius.sm,
                    borderWidth: 1,
                    borderColor: colors.controlBorder,
                    backgroundColor: pressed ? colors.controlHover : colors.control,
                    alignItems: 'center',
                    justifyContent: 'center',
                  })}>
                  {({ pressed }) => <X size={16} color={pressed ? colors.negativeFg : colors.ink3} />}
                </Pressable>
              ) : null}
            </View>
          </View>
        );
      })}

      <Pressable
        accessibilityRole="button"
        onPress={() => onChange([...drafts, { ...emptySavingsDraft }])}
        style={({ pressed }) => ({
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
          height: 40,
          borderRadius: radius.sm,
          borderWidth: 1,
          borderStyle: 'dashed',
          borderColor: pressed ? colors.accent : colors.lineStrong,
          backgroundColor: pressed ? colors.accentSoft : 'transparent',
        })}>
        {({ pressed }) => (
          <>
            <Plus size={16} color={pressed ? colors.accentSoftFg : colors.ink2} />
            <Text font="sansMedium" size="sm" color={pressed ? 'accentSoftFg' : 'ink2'}>
              {t.addSavings}
            </Text>
          </>
        )}
      </Pressable>
    </View>
  );
}
