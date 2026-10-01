import { Check, Mail, Send } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { callApi } from '@/api/client';
import { Button, IconButton } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { Eyebrow, Text } from '@/components/ui/text';
import { toast } from '@/components/ui/toast';
import { useI18n } from '@/lib/i18n/provider';
import { supportReasons, type SupportReason } from '@/lib/support/support-options';
import { useTheme } from '@/theme/theme-provider';
import { radius } from '@/theme/tokens';

const MESSAGE_MAX = 1000;

type SupportModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/** The toast has one line of text: a sonner `description` goes on a second. */
function withDescription(title: string, description?: string) {
  return description ? `${title}\n${description}` : title;
}

export function SupportModal({ open, onOpenChange }: SupportModalProps) {
  const { messages } = useI18n();
  const { colors } = useTheme();
  const [isPending, setIsPending] = useState(false);
  const [supportReason, setSupportReason] = useState<SupportReason>('assistance');
  const [supportMessage, setSupportMessage] = useState('');
  const canSubmit = supportMessage.trim().length >= 10 && !isPending;

  const submitSupportRequest = async () => {
    if (!canSubmit) return;

    setIsPending(true);
    try {
      // Sending a message changes nothing on screen, so no data refresh.
      const result = await callApi('support.send', {
        message: supportMessage,
        reason: supportReason,
      });

      if (!result.ok) {
        toast.error(withDescription(messages.support.messageNotSent, result.message));
        return;
      }

      toast.success(withDescription(messages.support.messageSent, messages.support.received));
      setSupportMessage('');
      setSupportReason('assistance');
      onOpenChange(false);
    } catch (error) {
      toast.error(
        withDescription(
          messages.support.messageNotSent,
          error instanceof Error ? error.message : undefined,
        ),
      );
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={messages.support.title}
      description={messages.support.description}
      headerAction={
        <IconButton
          variant="action"
          accessibilityLabel={messages.support.send}
          icon={(props) => <Check {...props} />}
          disabled={!canSubmit}
          onPress={submitSupportRequest}
        />
      }
      footer={
        <>
          <Button
            variant="outline"
            size="xl"
            style={{ flexBasis: '33%' }}
            label={messages.support.cancel}
            disabled={isPending}
            onPress={() => onOpenChange(false)}
          />
          <Button
            size="xl"
            style={{ flex: 1 }}
            icon={(props) => <Send {...props} />}
            label={isPending ? messages.support.sending : messages.support.send}
            loading={isPending}
            disabled={!canSubmit}
            onPress={submitSupportRequest}
          />
        </>
      }>
      <View accessibilityRole="radiogroup" accessibilityLabel={messages.support.reason} style={{ gap: 10 }}>
        <Eyebrow size="2xs" style={{ marginBottom: 4 }}>
          {messages.support.reason}
        </Eyebrow>
        {supportReasons.map((reason) => {
          const Icon = reason.icon;
          const selected = supportReason === reason.value;

          return (
            <Pressable
              key={reason.value}
              accessibilityRole="radio"
              accessibilityState={{ checked: selected, disabled: isPending }}
              disabled={isPending}
              onPress={() => setSupportReason(reason.value)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 14,
                padding: 16,
                borderRadius: radius['2xl'],
                borderWidth: 1,
                borderColor: selected ? colors.accent : colors.line,
                backgroundColor: selected ? colors.accentTint : colors.surface1,
                // The web's `ring-3 ring-ds-accent/10` around the chosen card.
                boxShadow: selected ? `0 0 0 3px ${colors.accentSoft}` : undefined,
              }}>
              <View
                style={{
                  width: 36,
                  height: 36,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: radius.lg,
                  backgroundColor: selected ? colors.accentSoft : colors.surface2,
                }}>
                <Icon size={18} color={selected ? colors.accentSoftFg : colors.ink2} />
              </View>
              <View style={{ flex: 1 }}>
                <Text font="sansMedium" size="sm">
                  {messages.support[reason.value]}
                </Text>
                <Text size="xs" color="ink3" style={{ marginTop: 2 }}>
                  {messages.support[`${reason.value}Sub`]}
                </Text>
              </View>
              <View
                style={{
                  width: 22,
                  height: 22,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 11,
                  borderWidth: 2,
                  borderColor: selected ? colors.accent : colors.lineStrong,
                }}>
                {selected ? (
                  <View
                    style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: colors.accent }}
                  />
                ) : null}
              </View>
            </Pressable>
          );
        })}
      </View>

      <View style={{ gap: 8 }}>
        <Eyebrow size="2xs">{messages.support.message}</Eyebrow>
        <Input
          multiline
          accessibilityLabel={messages.support.message}
          editable={!isPending}
          maxLength={MESSAGE_MAX}
          placeholder={messages.support.placeholder}
          value={supportMessage}
          onChangeText={setSupportMessage}
          containerStyle={{
            minHeight: 128,
            paddingVertical: 12,
            borderRadius: radius.xl,
            backgroundColor: colors.surface1,
          }}
          style={{ minHeight: 102, fontSize: 14, lineHeight: 24 }}
        />
        <Text font="mono" size="2xs" color="ink4" align="right">
          {messages.support.charCount(supportMessage.length, MESSAGE_MAX)}
        </Text>
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: -4 }}>
        <Mail size={14} color={colors.positiveFg} />
        <Text size="xs" color="ink3" style={{ flex: 1 }}>
          {messages.support.replyNote}
        </Text>
      </View>
    </Modal>
  );
}
