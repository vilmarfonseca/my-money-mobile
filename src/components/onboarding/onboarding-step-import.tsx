import { Sparkles, Upload } from 'lucide-react-native';
import { View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { ObOptionCard } from '@/components/onboarding/onboarding-ui';
import { ImportExportButton } from '@/components/transactions/import-export-button';
import { Text } from '@/components/ui/text';
import { useI18n } from '@/lib/i18n/provider';
import { maxImportRows } from '@/lib/transactions/import-export';
import { useTheme } from '@/theme/theme-provider';
import { durations, radius } from '@/theme/tokens';

export type OnboardingDataChoice = 'fresh' | 'import';

type OnboardingStepImportProps = {
  choice: OnboardingDataChoice;
  onChoiceChange: (choice: OnboardingDataChoice) => void;
};

/**
 * Start fresh or bring a statement in. The import itself is the app's regular
 * import flow (file picker, review, import), opened from here: the rows land
 * right away instead of waiting for Finish as they do on the web.
 */
export function OnboardingStepImport({ choice, onChoiceChange }: OnboardingStepImportProps) {
  const { messages } = useI18n();
  const { colors } = useTheme();
  const t = messages.onboarding;

  return (
    <View>
      <View style={{ gap: 12 }}>
        <ObOptionCard
          title={t.startFresh}
          description={t.startFreshDescription}
          icon={Sparkles}
          selected={choice === 'fresh'}
          onSelect={() => onChoiceChange('fresh')}
        />
        <ObOptionCard
          title={t.importFile}
          description={t.importFileDescription}
          icon={Upload}
          selected={choice === 'import'}
          onSelect={() => onChoiceChange('import')}
        />
      </View>

      {choice === 'import' ? (
        <Animated.View
          entering={FadeInDown.duration(durations.base).withInitialValues({
            transform: [{ translateY: 12 }],
          })}
          style={{
            alignItems: 'center',
            marginTop: 16,
            paddingHorizontal: 24,
            paddingVertical: 28,
            borderRadius: radius.xl,
            borderWidth: 2,
            borderStyle: 'dashed',
            borderColor: colors.lineStrong,
            backgroundColor: colors.control,
          }}>
          <View
            style={{
              width: 52,
              height: 52,
              marginBottom: 14,
              borderRadius: 26,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: colors.accentSoft,
            }}>
            <Upload size={24} color={colors.accentSoftFg} />
          </View>
          <Text font="sansMedium" size="sm" align="center">
            {t.importFile}
          </Text>
          <Text size="xs" color="ink3" align="center" style={{ marginTop: 6 }}>
            {t.dropSub}
          </Text>
          <Text font="mono" size="xs" color="ink4" align="center" style={{ marginTop: 12 }}>
            {t.dropFormats(maxImportRows)}
          </Text>
          <ImportExportButton size="lg" style={{ marginTop: 16 }} />
        </Animated.View>
      ) : null}
    </View>
  );
}
