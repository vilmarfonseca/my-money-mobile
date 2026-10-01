import { View } from 'react-native';

import { useApiAction } from '@/api/hooks';
import { ObSelectable } from '@/components/onboarding/onboarding-ui';
import { Text } from '@/components/ui/text';
import { useI18n } from '@/lib/i18n/provider';
import { useTheme } from '@/theme/theme-provider';
import { palette, shadows, themes } from '@/theme/tokens';

export type OnboardingLookChoice = 'light' | 'dark';

/**
 * Light or dark. The selected card is whatever is on screen, so it follows the
 * saved preference until the user picks one here.
 */
export function OnboardingStepLook() {
  const { messages } = useI18n();
  const { scheme, setPreference } = useTheme();
  const saveDefault = useApiAction('settings.saveDefault');
  const t = messages.onboarding;

  const select = (value: OnboardingLookChoice) => {
    // Apply immediately for instant feedback, persist in the background.
    setPreference(value);
    saveDefault.run({ key: 'theme', value }).catch(() => {});
  };

  return (
    <View style={{ gap: 12 }}>
      <ThemeCard
        look="light"
        title={t.lightTitle}
        description={t.lightDesc}
        selected={scheme === 'light'}
        onSelect={() => select('light')}
      />
      <ThemeCard
        look="dark"
        title={t.darkTitle}
        description={t.darkDesc}
        selected={scheme === 'dark'}
        onSelect={() => select('dark')}
      />
    </View>
  );
}

/** Colours of the miniature app drawn on each card. */
const previews = {
  light: {
    canvas: themes.light.canvas,
    edge: 'rgba(0, 0, 0, 0.05)',
    rail: palette.white,
    railEdge: 'rgba(0, 0, 0, 0.06)',
    accent: palette.plum500,
    line: '#e3ddd2',
    card: palette.white,
  },
  dark: {
    canvas: themes.dark.canvas,
    edge: 'rgba(255, 255, 255, 0.1)',
    rail: themes.dark.surface1,
    railEdge: 'rgba(255, 255, 255, 0.06)',
    accent: palette.plum300,
    line: themes.dark.surface3,
    card: '#211a30',
  },
} as const;

function ThemeCard({
  description,
  look,
  onSelect,
  selected,
  title,
}: {
  description: string;
  look: OnboardingLookChoice;
  onSelect: () => void;
  selected: boolean;
  title: string;
}) {
  const preview = previews[look];

  return (
    <ObSelectable label={title} selected={selected} onSelect={onSelect}>
      <View
        style={{
          height: 80,
          marginBottom: 12,
          flexDirection: 'row',
          overflow: 'hidden',
          borderRadius: 16,
          borderWidth: 1,
          borderColor: preview.edge,
          backgroundColor: preview.canvas,
        }}>
        <View
          style={{
            width: 24,
            backgroundColor: preview.rail,
            borderRightWidth: 1,
            borderRightColor: preview.railEdge,
          }}
        />
        <View style={{ flex: 1, gap: 6, padding: 10 }}>
          <View style={{ height: 6, width: '50%', borderRadius: 3, backgroundColor: preview.accent }} />
          <View style={{ height: 6, width: '80%', borderRadius: 3, backgroundColor: preview.line }} />
          <View
            style={{
              flex: 1,
              marginTop: 2,
              borderRadius: 8,
              backgroundColor: preview.card,
              boxShadow: look === 'light' ? shadows.sm : undefined,
            }}
          />
        </View>
      </View>
      <Text font="sansMedium" size="sm">
        {title}
      </Text>
      <Text size="xs" color="ink3" style={{ lineHeight: 19 }}>
        {description}
      </Text>
    </ObSelectable>
  );
}
