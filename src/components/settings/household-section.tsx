import { Crown, Lock, LogOut, Plus, Trash2, UserRoundPlus, X } from 'lucide-react-native';
import { useState, type ReactNode } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';

import { callApi } from '@/api/client';
import { useRefreshData } from '@/api/hooks';
import { HouseholdTile, MemberAvatar } from '@/components/household/workspace-tiles';
import { attempt, type ActionResult } from '@/components/settings/action-result';
import { SectionHeading } from '@/components/settings/section-heading';
import { useSyncedState } from '@/components/settings/use-synced-state';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { FieldLabel } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { Sheet } from '@/components/ui/sheet';
import { Text } from '@/components/ui/text';
import { toast } from '@/components/ui/toast';
import type { HouseholdSettingsData } from '@/lib/household/household-queries';
import { useI18n } from '@/lib/i18n/provider';
import { useTheme } from '@/theme/theme-provider';
import { radius } from '@/theme/tokens';

function Badge({ children, tone }: { children: ReactNode; tone: 'owner' | 'member' | 'pending' }) {
  const { colors } = useTheme();
  const palette = {
    owner: { bg: colors.accentSoft, fg: colors.accentSoftFg },
    member: { bg: colors.control, fg: colors.ink2 },
    pending: { bg: colors.warmSoft, fg: colors.warmSoftFg },
  }[tone];

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: radius.pill,
        backgroundColor: palette.bg,
      }}>
      {tone === 'owner' ? <Crown size={12} color={palette.fg} /> : null}
      <Text font="sansSemiBold" size="2xs" color={palette.fg} uppercase tracking={0.5}>
        {children}
      </Text>
    </View>
  );
}

/** Round "x" at the end of a member or invitation row. */
function RowRemoveButton({
  label,
  onPress,
  pending,
}: {
  label: string;
  onPress: () => void;
  pending: boolean;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={pending}
      hitSlop={6}
      onPress={onPress}
      style={({ pressed }) => ({
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: pressed ? colors.controlHover : 'transparent',
      })}>
      {pending ? (
        <ActivityIndicator size="small" color={colors.ink3} />
      ) : (
        <X size={16} color={colors.ink3} />
      )}
    </Pressable>
  );
}

/** What the confirmation sheet is asking about (the web uses `window.confirm`). */
type Confirmation = {
  action: () => Promise<ActionResult>;
  body: string;
  key: string;
  label: string;
};

/**
 * Household management card for the Settings page. Owner: rename, invite,
 * revoke, remove, delete. Member: view members, leave. No household yet:
 * create form (premium) or upsell.
 */
export function HouseholdSection({ data }: { data: HouseholdSettingsData }) {
  const { locale, messages } = useI18n();
  const { colors } = useTheme();
  const refresh = useRefreshData();
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [name, setName] = useSyncedState(data.household?.name ?? '');
  const [inviteEmail, setInviteEmail] = useState('');
  const [showInvite, setShowInvite] = useState(false);
  // Kept after the sheet closes so its text does not vanish mid-animation.
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const t = messages.household;
  const household = data.household;
  const isOwner = household?.role === 'owner';
  // `canCreateHousehold` is the household premium entitlement (see
  // userHasPremium in household-queries). Non-premium users see the card
  // locked behind an upsell.
  const isPremium = data.canCreateHousehold;

  const run = async (
    key: string,
    action: () => Promise<ActionResult>,
    successMessage?: string,
  ) => {
    setPendingAction(key);
    const result = await attempt(action);
    if (result.ok) {
      if (successMessage) toast.success(successMessage);
      // Awaited so the card does not flash its old contents before the
      // spinner goes away.
      await refresh();
    } else if (result.message) {
      toast.error(result.message);
    }
    setPendingAction(null);
  };

  const confirm = (next: Confirmation) => {
    setConfirmation(next);
    setConfirmOpen(true);
  };

  const dangerLabel = (icon: ReactNode, label: string) => (
    <>
      {icon}
      <Text font="sansMedium" size="sm" color="negative" numberOfLines={1}>
        {label}
      </Text>
    </>
  );

  return (
    <View>
      <SectionHeading
        eyebrow={t.eyebrow}
        title={t.eyebrow}
        description={t.createPrompt}
        badge={t.premiumBadge}
      />

      <Card padding={16}>
        {!isPremium ? (
          <View
            style={{
              alignItems: 'center',
              padding: 32,
              borderRadius: radius.xl,
              borderWidth: 1,
              borderColor: colors.line,
              backgroundColor: colors.surface2,
            }}>
            <View
              style={{
                width: 48,
                height: 48,
                borderRadius: 24,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: colors.accentSoft,
              }}>
              <Lock size={20} color={colors.accentSoftFg} />
            </View>
            <Text font="sansSemiBold" size="sm" align="center" style={{ marginTop: 16 }}>
              {t.upsellTitle}
            </Text>
            <Text size="sm" color="ink3" align="center" style={{ marginTop: 4, lineHeight: 21 }}>
              {t.upsell}
            </Text>
          </View>
        ) : !household ? (
          <View style={{ gap: 12 }}>
            <View style={{ gap: 6 }}>
              <FieldLabel>{t.nameLabel}</FieldLabel>
              <Input
                value={name}
                onChangeText={setName}
                placeholder={t.namePlaceholder}
                returnKeyType="done"
                containerStyle={{ backgroundColor: colors.surface1 }}
              />
            </View>
            <Button
              block
              size="lg"
              label={t.createHousehold}
              icon={(props) => <Plus {...props} />}
              loading={pendingAction === 'create'}
              disabled={!name.trim()}
              onPress={() => run('create', () => callApi('household.create', name))}
            />
          </View>
        ) : (
          <View style={{ gap: 24 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
              <HouseholdTile size={52} rounded={radius['2xl']} />
              <View style={{ flex: 1 }}>
                <Text font="display" size="2xl" numberOfLines={1} style={{ lineHeight: 30 }}>
                  {household.name}
                </Text>
                <Text size="sm" color="ink3">
                  {isOwner ? t.youAreOwner : t.youAreMember}
                </Text>
              </View>
            </View>

            {isOwner ? (
              <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 12 }}>
                <View style={{ flex: 1, gap: 6 }}>
                  <FieldLabel>{t.nameLabel}</FieldLabel>
                  <Input
                    value={name}
                    onChangeText={setName}
                    placeholder={t.namePlaceholder}
                    returnKeyType="done"
                    containerStyle={{ backgroundColor: colors.surface1 }}
                  />
                </View>
                <Button
                  variant="outline"
                  label={t.rename}
                  loading={pendingAction === 'rename'}
                  disabled={!name.trim() || name.trim() === household.name}
                  onPress={() =>
                    run('rename', () => callApi('household.rename', name), t.renamed)
                  }
                  style={{ marginBottom: 2 }}
                />
              </View>
            ) : null}

            <View>
              <Text
                font="sansSemiBold"
                size="2xs"
                color="ink3"
                uppercase
                tracking={0.5}
                style={{ marginBottom: 10 }}>
                {t.members}
              </Text>
              <View
                style={{
                  overflow: 'hidden',
                  borderRadius: radius.xl,
                  borderWidth: 1,
                  borderColor: colors.line,
                  backgroundColor: colors.surface1,
                }}>
                {data.members.map((member, index) => {
                  const isSelf = member.userId === data.currentUserId;
                  const displayName = member.name ?? member.email;
                  return (
                    <View
                      key={member.userId}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 14,
                        paddingHorizontal: 16,
                        paddingVertical: 14,
                        borderTopWidth: index === 0 ? 0 : 1,
                        borderTopColor: colors.line,
                      }}>
                      <MemberAvatar name={displayName} />
                      <View style={{ flex: 1 }}>
                        <Text font="sansSemiBold" size="sm" numberOfLines={1}>
                          {displayName}{' '}
                          {isSelf ? (
                            <Text size="sm" color="ink3">
                              {t.you}
                            </Text>
                          ) : null}
                        </Text>
                        <Text size="xs" color="ink3" numberOfLines={1}>
                          {member.email}
                        </Text>
                      </View>
                      <Badge tone={member.role === 'owner' ? 'owner' : 'member'}>
                        {member.role === 'owner' ? t.ownerBadge : t.memberBadge}
                      </Badge>
                      {isOwner && !isSelf ? (
                        <RowRemoveButton
                          label={t.removeMember}
                          pending={pendingAction === `remove:${member.userId}`}
                          onPress={() =>
                            confirm({
                              key: `remove:${member.userId}`,
                              label: t.removeMember,
                              body: t.removeConfirm(displayName),
                              action: () => callApi('household.removeMember', member.userId),
                            })
                          }
                        />
                      ) : null}
                    </View>
                  );
                })}

                {data.pendingInvitations.map((invitation) => (
                  <View
                    key={invitation.id}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 14,
                      paddingHorizontal: 16,
                      paddingVertical: 14,
                      borderTopWidth: 1,
                      borderTopColor: colors.line,
                    }}>
                    <MemberAvatar name={invitation.email} />
                    <View style={{ flex: 1 }}>
                      <Text font="sansSemiBold" size="sm" numberOfLines={1}>
                        {invitation.email}
                      </Text>
                      <Text size="xs" color="ink3" numberOfLines={1}>
                        {t.invitedOn(
                          new Intl.DateTimeFormat(locale, { dateStyle: 'short' }).format(
                            new Date(invitation.createdAt),
                          ),
                        )}
                      </Text>
                    </View>
                    <Badge tone="pending">{t.pendingBadge}</Badge>
                    {isOwner ? (
                      <RowRemoveButton
                        label={t.revoke}
                        pending={pendingAction === `revoke:${invitation.id}`}
                        onPress={() =>
                          run(`revoke:${invitation.id}`, () =>
                            callApi('household.revokeInvitation', invitation.id),
                          )
                        }
                      />
                    ) : null}
                  </View>
                ))}

                {isOwner ? (
                  showInvite ? (
                    <View
                      style={{
                        gap: 10,
                        paddingHorizontal: 16,
                        paddingVertical: 14,
                        borderTopWidth: 1,
                        borderTopColor: colors.line,
                      }}>
                      <Input
                        autoFocus
                        autoCapitalize="none"
                        autoCorrect={false}
                        keyboardType="email-address"
                        value={inviteEmail}
                        onChangeText={setInviteEmail}
                        placeholder={t.invitePlaceholder}
                      />
                      <Button
                        block
                        label={t.sendInvite}
                        icon={(props) => <UserRoundPlus {...props} />}
                        loading={pendingAction === 'invite'}
                        disabled={!inviteEmail.trim()}
                        onPress={() => {
                          void run(
                            'invite',
                            () => callApi('household.invite', inviteEmail),
                            t.inviteSent(inviteEmail.trim().toLowerCase()),
                          );
                          setInviteEmail('');
                          setShowInvite(false);
                        }}
                      />
                    </View>
                  ) : (
                    <Pressable
                      accessibilityRole="button"
                      onPress={() => setShowInvite(true)}
                      style={({ pressed }) => ({
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 14,
                        paddingHorizontal: 16,
                        paddingVertical: 14,
                        borderTopWidth: 1,
                        borderTopColor: colors.line,
                        backgroundColor: pressed ? colors.controlHover : 'transparent',
                      })}>
                      <View
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: 22,
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderWidth: 1,
                          borderStyle: 'dashed',
                          borderColor: colors.lineStrong,
                          backgroundColor: colors.surface2,
                        }}>
                        {pendingAction === 'invite' ? (
                          <ActivityIndicator size="small" color={colors.ink3} />
                        ) : (
                          <Plus size={20} color={colors.ink3} />
                        )}
                      </View>
                      <Text font="sansSemiBold" size="sm" color="ink2">
                        {t.addAnotherMember}
                      </Text>
                    </Pressable>
                  )
                ) : null}
              </View>
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
              {isOwner ? (
                <Button
                  variant="outline"
                  loading={pendingAction === 'delete'}
                  onPress={() =>
                    confirm({
                      key: 'delete',
                      label: t.deleteHousehold,
                      body: t.deleteConfirm,
                      action: () => callApi('household.delete'),
                    })
                  }>
                  {dangerLabel(
                    pendingAction === 'delete' ? null : <Trash2 size={16} color={colors.negative} />,
                    t.deleteHousehold,
                  )}
                </Button>
              ) : (
                <Button
                  variant="outline"
                  loading={pendingAction === 'leave'}
                  onPress={() =>
                    confirm({
                      key: 'leave',
                      label: t.leaveHousehold,
                      body: t.leaveConfirm,
                      action: () => callApi('household.leave'),
                    })
                  }>
                  {dangerLabel(
                    pendingAction === 'leave' ? null : <LogOut size={16} color={colors.negative} />,
                    t.leaveHousehold,
                  )}
                </Button>
              )}
            </View>
          </View>
        )}
      </Card>

      <Sheet
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={confirmation?.label}
        description={confirmation?.body}
        footer={
          <>
            <Button
              variant="outline"
              label={messages.common.cancel}
              onPress={() => setConfirmOpen(false)}
              style={{ flex: 1 }}
            />
            <Button
              variant="destructive"
              label={confirmation?.label}
              onPress={() => {
                setConfirmOpen(false);
                if (confirmation) void run(confirmation.key, confirmation.action);
              }}
              style={{ flex: 1 }}
            />
          </>
        }
      />
    </View>
  );
}
