import { type Href, useRouter } from 'expo-router';
import {
  Check,
  ChevronDown,
  MoreVertical,
  Plus,
  Settings2,
  UserRoundPlus,
} from 'lucide-react-native';
import { useState, type ReactNode } from 'react';
import { Pressable, View } from 'react-native';

import { useApiAction } from '@/api/hooks';
import { HouseholdTile, PersonalTile } from '@/components/household/workspace-tiles';
import { Sheet } from '@/components/ui/sheet';
import { Text } from '@/components/ui/text';
import { toast } from '@/components/ui/toast';
import type { WorkspaceOptionsData } from '@/lib/household/household-queries';
import { useI18n } from '@/lib/i18n/provider';
import { useTheme } from '@/theme/theme-provider';
import { radius } from '@/theme/tokens';

/** The web's `/settings#household`: Settings scrolls to its household card. */
const householdSettingsHref = '/settings?section=household' as Href;

/** Bottom-sheet body: every workspace with its balance, plus household shortcuts. */
function SwitcherBody({
  onSelect,
  onSettingsNavigate,
  pending,
  workspaces,
}: {
  onSelect: (householdId: string | null) => void;
  onSettingsNavigate: () => void;
  pending: boolean;
  workspaces: WorkspaceOptionsData;
}) {
  const { messages, formatCurrency } = useI18n();
  const { colors } = useTheme();
  const { options, activeHouseholdId, canCreateHousehold } = workspaces;
  const households = options.filter((option) => option.kind === 'household');
  const ownsHousehold = households.some(
    (option) => option.kind === 'household' && option.role === 'owner',
  );

  const settingsLink = (
    icon: (props: { color: string; size: number }) => ReactNode,
    label: string,
    accent = false,
  ) => {
    const fg = accent ? colors.accentFg : colors.ink1;
    return (
      <Pressable
        accessibilityRole="link"
        onPress={onSettingsNavigate}
        style={({ pressed }) => ({
          flex: 1,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          paddingVertical: 8,
          borderRadius: radius.pill,
          backgroundColor: accent
            ? pressed
              ? colors.accentHover
              : colors.accent
            : pressed
              ? colors.controlHover
              : colors.control,
        })}>
        {icon({ color: fg, size: 18 })}
        <Text font="sansSemiBold" size="sm" color={fg}>
          {label}
        </Text>
      </Pressable>
    );
  };

  return (
    <View style={{ gap: 16 }}>
      <View style={{ gap: 10 }}>
        {options.map((option) => {
          const isActive =
            option.kind === 'household'
              ? option.householdId === activeHouseholdId
              : activeHouseholdId === null;
          const isOwnerRow = option.kind === 'household' && option.role === 'owner';

          return (
            <View
              key={option.kind === 'household' ? option.householdId : 'you'}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                paddingVertical: 8,
                paddingHorizontal: 16,
                borderRadius: radius['2xl'],
                borderWidth: 1,
                borderColor: isActive ? colors.accent : colors.line,
                backgroundColor: isActive ? colors.accentTint : 'transparent',
              }}>
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ selected: isActive, disabled: pending }}
                disabled={pending}
                onPress={() => onSelect(option.kind === 'household' ? option.householdId : null)}
                style={{
                  flex: 1,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                  opacity: pending ? 0.6 : 1,
                }}>
                {option.kind === 'household' ? <HouseholdTile /> : <PersonalTile />}
                <View style={{ flex: 1 }}>
                  <Text font="sansSemiBold" size="sm" numberOfLines={1}>
                    {option.kind === 'household' ? option.name : messages.household.personal}
                  </Text>
                  <Text size="xs" color="ink3" numberOfLines={1}>
                    {option.kind === 'household'
                      ? messages.household.sharedMembers(option.memberCount)
                      : messages.household.personalSub}
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text font="mono" size="sm">
                    {formatCurrency(option.balance)}
                  </Text>
                  <Text size="2xs" color="ink3">
                    {messages.household.balanceLabel}
                  </Text>
                </View>
              </Pressable>
              {isActive ? (
                <View
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: 12,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: colors.accent,
                  }}>
                  <Check size={14} color={colors.accentFg} />
                </View>
              ) : null}
              {isOwnerRow ? (
                <Pressable
                  accessibilityRole="link"
                  accessibilityLabel={messages.household.manage}
                  hitSlop={6}
                  onPress={onSettingsNavigate}
                  style={({ pressed }) => ({
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: pressed ? colors.controlHover : 'transparent',
                  })}>
                  <MoreVertical size={18} color={colors.ink3} />
                </Pressable>
              ) : null}
            </View>
          );
        })}
      </View>

      {households.length > 0 ? (
        ownsHousehold ? (
          <View style={{ flexDirection: 'row', gap: 10 }}>
            {settingsLink(
              (props) => <UserRoundPlus {...props} />,
              messages.household.invite,
              true,
            )}
            {settingsLink((props) => <Settings2 {...props} />, messages.household.manage)}
          </View>
        ) : null
      ) : canCreateHousehold ? (
        <View style={{ gap: 12 }}>
          <Text size="sm" color="ink3" style={{ paddingHorizontal: 4, lineHeight: 22 }}>
            {messages.household.createPrompt}
          </Text>
          <View style={{ flexDirection: 'row' }}>
            {settingsLink((props) => <Plus {...props} />, messages.household.createHousehold, true)}
          </View>
        </View>
      ) : null}
    </View>
  );
}

/**
 * The menu's workspace row: shows which workspace (personal or a household)
 * the app is working in, and opens the switcher in a bottom sheet.
 */
export function WorkspaceSwitcher({
  onNavigate,
  workspaces,
}: {
  /** Called when a link inside the switcher navigates. */
  onNavigate?: () => void;
  workspaces: WorkspaceOptionsData;
}) {
  const { messages } = useI18n();
  const { colors } = useTheme();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const switchWorkspace = useApiAction('household.switchWorkspace');

  const { options, activeHouseholdId } = workspaces;
  const active =
    options.find(
      (option) => option.kind === 'household' && option.householdId === activeHouseholdId,
    ) ?? options[0];
  const activeName =
    active?.kind === 'household' ? active.name : messages.household.personal;

  const selectWorkspace = async (householdId: string | null) => {
    if (switchWorkspace.pending || householdId === activeHouseholdId) {
      setOpen(false);
      return;
    }
    try {
      const result = await switchWorkspace.run(householdId);
      if (result.ok) {
        setOpen(false);
        router.navigate('/dashboard');
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : String(error));
    }
  };

  const closeAndNavigate = () => {
    setOpen(false);
    onNavigate?.();
    router.navigate(householdSettingsHref);
  };

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={messages.household.switchWorkspace}
        onPress={() => setOpen(true)}
        style={({ pressed }) => ({
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          padding: 10,
          borderRadius: radius['2xl'],
          borderWidth: 1,
          borderColor: colors.line,
          backgroundColor: pressed ? colors.controlHover : colors.surface1,
        })}>
        {active?.kind === 'household' ? <HouseholdTile size={40} /> : <PersonalTile size={40} />}
        <View style={{ flex: 1 }}>
          <Text font="sansSemiBold" size="2xs" color="ink3" uppercase tracking={0.5}>
            {messages.household.workspace}
          </Text>
          <Text font="sansSemiBold" size="sm" numberOfLines={1}>
            {activeName}
          </Text>
        </View>
        <ChevronDown size={16} color={colors.ink3} style={{ marginRight: 6 }} />
      </Pressable>

      <Sheet
        open={open}
        onOpenChange={setOpen}
        title={messages.household.switchWorkspace}
        description={messages.household.switchDescription}>
        <SwitcherBody
          workspaces={workspaces}
          pending={switchWorkspace.pending}
          onSelect={selectWorkspace}
          onSettingsNavigate={closeAndNavigate}
        />
      </Sheet>
    </>
  );
}
