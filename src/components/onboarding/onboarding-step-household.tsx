import { LinearGradient } from 'expo-linear-gradient';
import { Check, House, UserRound, UserRoundPlus, type LucideIcon } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { useApiAction } from '@/api/hooks';
import { obAttempt } from '@/components/onboarding/onboarding-ui';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { toast } from '@/components/ui/toast';
import { useI18n } from '@/lib/i18n/provider';
import { useTheme } from '@/theme/theme-provider';
import { palette, radius } from '@/theme/tokens';

export type OnboardingHouseholdSummary = {
  name: string;
  invitedEmail: string | null;
};

type Choice = 'solo' | 'household';

/**
 * Optional onboarding step (premium): keep it solo or create a household and
 * invite the first member, all in one screen. The created household is NOT
 * activated so the rest of onboarding keeps building personal data.
 */
export function OnboardingStepHousehold({
  household,
  onHouseholdChange,
}: {
  household: OnboardingHouseholdSummary | null;
  onHouseholdChange: (value: OnboardingHouseholdSummary) => void;
}) {
  const { messages } = useI18n();
  const { colors } = useTheme();
  const t = messages.onboarding;
  const h = messages.household;

  const createHousehold = useApiAction('household.create');
  const inviteMember = useApiAction('household.invite');

  const [choice, setChoice] = useState<Choice>(household ? 'household' : 'solo');
  const [name, setName] = useState(household?.name ?? '');
  const [inviteEmail, setInviteEmail] = useState('');

  const created = household !== null;

  const create = async () => {
    if (!name.trim() || createHousehold.pending) return;
    const result = await obAttempt(() => createHousehold.run(name, { activate: false }));
    if (!result) return;
    if (result.ok) {
      onHouseholdChange({ name: name.trim(), invitedEmail: null });
      toast.success(t.householdCreated);
    } else {
      toast.error(result.message);
    }
  };

  const invite = async () => {
    const email = inviteEmail.trim().toLowerCase();
    if (!email || inviteMember.pending) return;
    const result = await obAttempt(() => inviteMember.run(email));
    if (!result) return;
    if (result.ok && household) {
      onHouseholdChange({ ...household, invitedEmail: email });
      toast.success(h.inviteSent(email));
    } else if (!result.ok) {
      toast.error(result.message);
    }
  };

  const choiceCard = (key: Choice, Icon: LucideIcon, title: string, description: string) => {
    const selected = choice === key;
    const disabled = created && key === 'solo';
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={title}
        accessibilityState={{ selected, disabled }}
        disabled={disabled}
        onPress={() => setChoice(key)}
        style={({ pressed }) => ({
          gap: 10,
          padding: 16,
          borderRadius: radius.xl,
          borderWidth: 1,
          borderColor: selected ? colors.accent : colors.line,
          backgroundColor: selected
            ? colors.accentTint
            : pressed
              ? colors.controlHover
              : 'transparent',
          boxShadow: selected ? `0 0 0 3px ${colors.accentSoft}` : undefined,
          opacity: disabled ? 0.5 : 1,
        })}>
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: selected ? colors.accent : colors.control,
          }}>
          <Icon size={20} color={selected ? colors.accentFg : colors.ink2} />
        </View>
        <Text font="sansSemiBold" size="sm">
          {title}
        </Text>
        <Text size="xs" color="ink3" style={{ lineHeight: 19 }}>
          {description}
        </Text>
      </Pressable>
    );
  };

  return (
    <View style={{ gap: 20 }}>
      <View style={{ gap: 14 }}>
        {choiceCard('solo', UserRound, t.householdSoloTitle, t.householdSoloDesc)}
        {choiceCard('household', House, t.householdCreateTitle, t.householdCreateDesc)}
      </View>

      {choice === 'household' ? (
        <View
          style={{
            gap: 16,
            padding: 16,
            borderRadius: radius.xl,
            borderWidth: 1,
            borderColor: colors.line,
            backgroundColor: colors.surface2,
          }}>
          {!household ? (
            <View style={{ gap: 10 }}>
              <Input
                accessibilityLabel={h.createHousehold}
                value={name}
                onChangeText={setName}
                placeholder={h.namePlaceholder}
                returnKeyType="done"
                onSubmitEditing={create}
                containerStyle={{ backgroundColor: colors.surface1 }}
              />
              <Button
                size="lg"
                label={h.createHousehold}
                icon={(props) => <House {...props} />}
                loading={createHousehold.pending}
                disabled={!name.trim()}
                onPress={create}
                style={{ alignSelf: 'flex-start', backgroundColor: palette.plum500 }}
              />
            </View>
          ) : (
            <>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <LinearGradient
                  colors={[palette.sage500, palette.sage700]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 22,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                  <House size={20} color={palette.white} />
                </LinearGradient>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text font="sansSemiBold" size="sm" numberOfLines={1}>
                    {household.name}
                  </Text>
                  <Text size="xs" color="ink3">
                    {t.householdCreated}
                  </Text>
                </View>
                <View
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: 12,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: palette.sage500,
                  }}>
                  <Check size={14} color={palette.white} />
                </View>
              </View>

              <Text size="xs" color="ink3" style={{ lineHeight: 19 }}>
                {t.householdInviteHint}
              </Text>

              {household.invitedEmail ? (
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 10,
                    paddingHorizontal: 14,
                    paddingVertical: 12,
                    borderRadius: radius.lg,
                    borderWidth: 1,
                    borderColor: colors.line,
                    backgroundColor: colors.surface1,
                  }}>
                  <UserRoundPlus size={16} color={colors.ink3} />
                  <Text size="sm" numberOfLines={1} style={{ flex: 1, minWidth: 0 }}>
                    {household.invitedEmail}
                  </Text>
                  <View
                    style={{
                      paddingHorizontal: 10,
                      paddingVertical: 4,
                      borderRadius: radius.pill,
                      backgroundColor: colors.warmSoft,
                    }}>
                    <Text font="sansSemiBold" size="2xs" color="warmSoftFg" uppercase tracking={0.6}>
                      {h.pendingBadge}
                    </Text>
                  </View>
                </View>
              ) : (
                <View style={{ gap: 10 }}>
                  <Input
                    accessibilityLabel={h.sendInvite}
                    value={inviteEmail}
                    onChangeText={setInviteEmail}
                    placeholder={h.invitePlaceholder}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    returnKeyType="send"
                    onSubmitEditing={invite}
                    containerStyle={{ backgroundColor: colors.surface1 }}
                  />
                  <Button
                    size="lg"
                    variant="outline"
                    label={h.sendInvite}
                    icon={(props) => <UserRoundPlus {...props} />}
                    loading={inviteMember.pending}
                    disabled={!inviteEmail.trim()}
                    onPress={invite}
                    style={{ alignSelf: 'flex-start' }}
                  />
                </View>
              )}
            </>
          )}
        </View>
      ) : null}
    </View>
  );
}
