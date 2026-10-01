import { View } from 'react-native';

import { Switch } from '@/components/ui/switch';
import { Text } from '@/components/ui/text';
import { useI18n } from '@/lib/i18n/provider';
import { useTheme } from '@/theme/theme-provider';
import { radius } from '@/theme/tokens';

/** The "Primary account" switch tile shared by the add and manage forms. */
export function PrimaryAccountRow({
  checked,
  disabled,
  hint,
  onCheckedChange,
}: {
  checked: boolean;
  disabled?: boolean;
  /** Explains what the switch does in this form's situation. */
  hint: string;
  onCheckedChange: (checked: boolean) => void;
}) {
  const { messages } = useI18n();
  const { colors } = useTheme();

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: radius.sm,
        borderWidth: 1,
        borderColor: colors.lineStrong,
        backgroundColor: colors.surface1,
      }}>
      <View style={{ flex: 1 }}>
        <Text font="sansMedium" size="sm">
          {messages.accountsPage.primaryAccount}
        </Text>
        <Text size="xs" color="ink3" style={{ marginTop: 2 }}>
          {hint}
        </Text>
      </View>
      <Switch
        checked={checked}
        disabled={disabled}
        accessibilityLabel={messages.accountsPage.primaryAccount}
        onCheckedChange={onCheckedChange}
      />
    </View>
  );
}
