import { CalendarPlus, Check, RefreshCw, Unlink } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';

import { callApi } from '@/api/client';
import { useApiAction, useRefreshData } from '@/api/hooks';
import { openWebFlow } from '@/api/web-handoff';
import { attempt, errorMessage } from '@/components/settings/action-result';
import { SectionHeading } from '@/components/settings/section-heading';
import { useSyncedState } from '@/components/settings/use-synced-state';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { toast } from '@/components/ui/toast';
import { useI18n } from '@/lib/i18n/provider';
import { SYNCABLE_TYPES, type SyncableType } from '@/lib/integrations/google-calendar/types';
import { useTheme } from '@/theme/theme-provider';
import { radius } from '@/theme/tokens';

export type CalendarIntegrationCardProps = {
  connected: boolean;
  configured: boolean;
  entitled: boolean;
  accountEmail: string | null;
  syncTypes: SyncableType[];
  lastSyncedAt: string | null;
};

export function CalendarIntegrationCard({
  accountEmail,
  configured,
  connected,
  entitled,
  lastSyncedAt,
  syncTypes: initialSyncTypes,
}: CalendarIntegrationCardProps) {
  const { locale, messages } = useI18n();
  const { colors } = useTheme();
  const copy = messages.settings.calendarSync;
  const refresh = useRefreshData();
  const updateSyncTypes = useApiAction('integrations.updateCalendarSyncTypes');
  const syncNow = useApiAction('integrations.syncCalendarNow');
  const disconnect = useApiAction('integrations.disconnectCalendar');
  const [syncTypes, setSyncTypes] = useSyncedState<SyncableType[]>(
    initialSyncTypes,
    initialSyncTypes.join(','),
  );
  const [savingType, setSavingType] = useState<SyncableType | null>(null);
  const [connecting, setConnecting] = useState(false);

  // Google's consent screen runs in the web app. The web learns the outcome
  // from a `?calendar=` flag on the way back; here the browser just closes,
  // so the connection is read again to know whether it went through.
  const handleConnect = async () => {
    // The web route answers a plan without calendar sync with this same toast
    // after a redirect; no need to open the browser to find out.
    if (!entitled) {
      toast.error(copy.toastDenied);
      return;
    }
    setConnecting(true);
    try {
      await openWebFlow('/api/integrations/google-calendar/connect');
      const view = await callApi('integrations.calendar');
      if (view.connected) {
        toast.success(copy.toastConnected, {
          description: copy.toastConnectedDescription,
        });
      }
      await refresh();
    } catch (error) {
      toast.error(copy.toastError, {
        description: errorMessage(error),
      });
    } finally {
      setConnecting(false);
    }
  };

  const toggleType = async (type: SyncableType) => {
    const next = syncTypes.includes(type)
      ? syncTypes.filter((value) => value !== type)
      : [...SYNCABLE_TYPES].filter((value) => value === type || syncTypes.includes(value));
    const previous = syncTypes;

    setSyncTypes(next);
    setSavingType(type);
    const result = await attempt(() => updateSyncTypes.run(next));
    setSavingType((current) => (current === type ? null : current));
    if (!result.ok) {
      setSyncTypes(previous);
      toast.error(copy.toastTypesNotSaved, {
        description: result.message,
      });
    }
  };

  const handleSyncNow = async () => {
    const result = await attempt(() => syncNow.run());
    if (result.ok) {
      toast.success(copy.toastSynced);
    } else {
      toast.error(copy.toastSyncFailed, {
        description: result.message,
      });
    }
  };

  const handleDisconnect = async () => {
    const result = await attempt(() => disconnect.run());
    if (result.ok) {
      toast.success(copy.toastDisconnected);
    } else {
      toast.error(copy.toastDisconnectFailed, {
        description: result.message,
      });
    }
  };

  const lastSyncedLabel = lastSyncedAt
    ? copy.lastSynced(
        new Intl.DateTimeFormat(locale, {
          dateStyle: 'medium',
          timeStyle: 'short',
        }).format(new Date(lastSyncedAt)),
      )
    : copy.neverSynced;

  return (
    <View>
      <SectionHeading
        eyebrow={copy.eyebrow}
        title={copy.title}
        description={copy.description}
        badge={copy.premium}
      />

      <Card padding={16}>
        {connected ? (
          <View style={{ gap: 24 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: colors.positiveSoft,
                }}>
                <Check size={16} color={colors.positiveFg} />
              </View>
              <View style={{ flex: 1 }}>
                <Text font="sansMedium" size="sm" numberOfLines={1}>
                  {accountEmail ? copy.connectedTo(accountEmail) : copy.toastConnected}
                </Text>
                <Text size="xs" color="ink3" style={{ marginTop: 2 }}>
                  {copy.dedicatedCalendarNote}
                </Text>
              </View>
            </View>

            <View style={{ gap: 10 }}>
              <Text font="sansMedium" size="sm" color="ink2">
                {copy.whatToSync}
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {SYNCABLE_TYPES.map((type) => {
                  const selected = syncTypes.includes(type);
                  const saving = savingType === type;
                  const fg = selected ? colors.actionForeground : colors.ink2;
                  return (
                    <Pressable
                      key={type}
                      accessibilityRole="button"
                      accessibilityState={{ selected, disabled: saving }}
                      disabled={saving}
                      onPress={() => toggleType(type)}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 6,
                        height: 36,
                        paddingHorizontal: 14,
                        borderRadius: radius.pill,
                        borderWidth: 1,
                        borderColor: selected ? 'transparent' : colors.controlBorder,
                        backgroundColor: selected ? colors.action : colors.control,
                        opacity: saving ? 0.6 : 1,
                      }}>
                      {saving ? (
                        <ActivityIndicator size="small" color={fg} />
                      ) : selected ? (
                        <Check size={14} color={fg} />
                      ) : null}
                      <Text size="sm" color={fg}>
                        {copy.types[type]}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <View
              style={{
                gap: 12,
                paddingTop: 20,
                borderTopWidth: 1,
                borderTopColor: colors.line,
              }}>
              <Text size="xs" color="ink3">
                {lastSyncedLabel}
              </Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <Button
                  variant="outline"
                  label={syncNow.pending ? copy.syncing : copy.syncNow}
                  icon={(props) => <RefreshCw {...props} />}
                  loading={syncNow.pending}
                  onPress={handleSyncNow}
                  style={{ flex: 1 }}
                />
                <Button
                  variant="destructive"
                  label={disconnect.pending ? copy.disconnecting : copy.disconnect}
                  icon={(props) => <Unlink {...props} />}
                  loading={disconnect.pending}
                  onPress={handleDisconnect}
                  style={{ flex: 1 }}
                />
              </View>
            </View>
          </View>
        ) : (
          <View style={{ gap: 16 }}>
            <Text size="xs" color="ink3" style={{ lineHeight: 18 }}>
              {copy.connectDescription}
            </Text>
            <Button
              block
              label={connecting ? copy.connecting : copy.connect}
              icon={(props) => <CalendarPlus {...props} />}
              loading={connecting}
              disabled={!configured}
              onPress={handleConnect}
            />
            {configured ? null : (
              <Text size="xs" color="ink3">
                {copy.unconfiguredNotice}
              </Text>
            )}
          </View>
        )}
      </Card>
    </View>
  );
}
