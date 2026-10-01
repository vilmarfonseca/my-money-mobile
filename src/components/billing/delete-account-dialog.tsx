import { Trash2 } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { callApi } from '@/api/client';
import { withAlpha } from '@/components/settings/action-result';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { Select } from '@/components/ui/select';
import { Text } from '@/components/ui/text';
import { DELETION_REASONS, type DeletionReason } from '@/lib/account/deletion-reasons';
import type { Messages } from '@/lib/i18n/messages';
import { useSession } from '@/providers/auth-provider';
import { useTheme } from '@/theme/theme-provider';
import { palette, radius } from '@/theme/tokens';

/**
 * "Delete my account" from Settings: leaving asks why (a select plus free
 * text) before it wipes the account, on any tier. Messages arrive as a prop,
 * as on the web, so the dialog can also be used from the plan picker.
 */
export function DeleteAccountDialog({
  messages,
}: {
  messages: Messages['billing']['deleteAccount'];
}) {
  const { colors } = useTheme();
  const { signOut } = useSession();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<DeletionReason | ''>('');
  const [details, setDetails] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!reason) return;
    setPending(true);
    setError(null);
    try {
      // `callApi`, not `useApiAction`: the account is gone on success, so
      // there is nothing left to refresh.
      const result = await callApi('account.delete', { reason, details });
      if (!result.ok) {
        setError(result.message);
        setPending(false);
        return;
      }
    } catch {
      setError(messages.error);
      setPending(false);
      return;
    }
    // The identity is gone; ending the session sends the app back to sign-in.
    // The call can reject on an already-dead session, which changes nothing.
    try {
      await signOut();
    } catch {
      // Nothing to recover: the account no longer exists either way.
    }
    setPending(false);
    setOpen(false);
  };

  return (
    <>
      <Pressable
        accessibilityRole="button"
        onPress={() => setOpen(true)}
        style={({ pressed }) => ({
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          height: 44,
          paddingHorizontal: 16,
          borderRadius: radius.pill,
          borderWidth: 1,
          borderColor: withAlpha(colors.negative, 0.3),
          backgroundColor: colors.negativeSoft,
          opacity: pressed ? 0.8 : 1,
        })}>
        <Trash2 size={16} color={colors.negativeFg} />
        <Text font="sansMedium" size="sm" color="negativeFg">
          {messages.button}
        </Text>
      </Pressable>

      <Modal
        open={open}
        onOpenChange={(next) => {
          if (!pending) setOpen(next);
        }}
        title={messages.title}
        description={messages.body}
        footer={
          <>
            <Button
              variant="outline"
              label={messages.cancel}
              disabled={pending}
              onPress={() => setOpen(false)}
              style={{ flex: 1 }}
            />
            <Button
              loading={pending}
              disabled={!reason}
              onPress={submit}
              style={{ flex: 1, backgroundColor: colors.negative }}>
              <Text font="sansMedium" size="sm" color={palette.white} numberOfLines={1}>
                {pending ? messages.working : messages.confirm}
              </Text>
            </Button>
          </>
        }>
        <View
          style={{
            paddingHorizontal: 14,
            paddingVertical: 10,
            borderRadius: radius.md,
            backgroundColor: colors.warmSoft,
          }}>
          <Text size="sm" color="warmSoftFg" style={{ lineHeight: 21 }}>
            {messages.householdWarning}
          </Text>
        </View>

        <View style={{ gap: 6 }}>
          <Text font="sansMedium" size="sm">
            {messages.reasonLabel}
          </Text>
          <Select<DeletionReason>
            value={reason || null}
            onValueChange={setReason}
            placeholder={messages.reasonPlaceholder}
            title={messages.reasonLabel}
            disabled={pending}
            options={DELETION_REASONS.map((value) => ({
              label: messages.reasons[value],
              value,
            }))}
          />
        </View>

        <View style={{ gap: 6 }}>
          <Text font="sansMedium" size="sm">
            {messages.detailsLabel}{' '}
            <Text size="sm" color="ink3">
              {messages.optional}
            </Text>
          </Text>
          <Input
            multiline
            numberOfLines={4}
            maxLength={2000}
            value={details}
            editable={!pending}
            onChangeText={setDetails}
            placeholder={messages.detailsPlaceholder}
          />
        </View>

        {error ? (
          <Text accessibilityRole="alert" size="sm" color="negativeFg">
            {error}
          </Text>
        ) : null}
      </Modal>
    </>
  );
}
