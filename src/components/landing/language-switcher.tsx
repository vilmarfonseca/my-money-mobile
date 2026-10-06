import * as Haptics from 'expo-haptics';
import { Pressable, View } from 'react-native';

import { FlagIcon } from '@/components/landing/flag-icons';
import { Text } from '@/components/ui/text';
import type { AppLocale } from '@/lib/i18n/config';
import { useI18n } from '@/lib/i18n/provider';
import { useSignedOutLocale } from '@/providers/signed-out-locale';
import { useTheme } from '@/theme/theme-provider';
import { radius, shadows } from '@/theme/tokens';

// Each language in its own name, as on the web's footer switcher.
const languageOptions: ReadonlyArray<{ label: string; value: AppLocale }> = [
  { label: 'English', value: 'en-US' },
  { label: 'Português', value: 'pt-BR' },
];

/** English / Português toggle for the signed-out screens, flag first. */
export function LanguageSwitcher() {
  const { locale, messages } = useI18n();
  const { colors } = useTheme();
  const { setLocale } = useSignedOutLocale();

  return (
    <View
      accessibilityRole="radiogroup"
      accessibilityLabel={messages.common.language}
      style={{
        flexDirection: 'row',
        gap: 2,
        padding: 3,
        borderRadius: radius.pill,
        borderWidth: 1,
        borderColor: colors.controlBorder,
        backgroundColor: colors.control,
      }}>
      {languageOptions.map((option) => {
          const selected = option.value === locale;
          return (
            <Pressable
              key={option.value}
              accessibilityRole="radio"
              accessibilityLabel={option.label}
              accessibilityState={{ checked: selected }}
              hitSlop={4}
              onPress={() => {
                if (selected) return;
                Haptics.selectionAsync().catch(() => {});
                setLocale(option.value);
              }}
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
                height: 34,
                paddingHorizontal: 12,
                borderRadius: radius.pill,
                backgroundColor: selected
                  ? colors.surface1
                  : pressed
                    ? colors.controlHover
                    : 'transparent',
                boxShadow: selected ? shadows.sm : undefined,
              })}>
              <FlagIcon locale={option.value} />
              <Text font="sansMedium" size="sm" color={selected ? 'ink1' : 'ink3'}>
                {option.label}
              </Text>
            </Pressable>
          );
        })}
    </View>
  );
}
