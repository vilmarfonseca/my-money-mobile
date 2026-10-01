import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, type RefObject } from 'react';
import { View, type LayoutChangeEvent, type ScrollView, type ScrollViewProps } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { usePullToRefresh, useScreenQuery } from '@/api/hooks';
import { PageHeader } from '@/components/page-header';
import { SettingsPanels } from '@/components/settings/settings-panels';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Screen } from '@/components/ui/screen';
import { Skeleton, SkeletonCard } from '@/components/ui/skeleton';
import { Text } from '@/components/ui/text';
import { useI18n } from '@/lib/i18n/provider';

/** Brings the household card to the top of the page, under the status bar. */
function scrollToSection(scroll: RefObject<ScrollView | null>, y: number, topInset: number) {
  scroll.current?.scrollTo({ y: Math.max(0, y - topInset - 12), animated: true });
}

/**
 * Settings: profile, plan, referrals, calendar sync, household, preferences
 * and defaults. `?section=household` (the web's `/settings#household`) opens
 * the page scrolled to the household card.
 */
export default function SettingsScreen() {
  const { locale, messages } = useI18n();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { section } = useLocalSearchParams<{ section?: string }>();
  const settings = useScreenQuery('settings.get', []);
  const household = useScreenQuery('household.settings', []);
  const calendar = useScreenQuery('integrations.calendar', []);
  const referrals = useScreenQuery('referrals.summary', []);
  const { onRefresh, refreshing } = usePullToRefresh(settings, household, calendar, referrals);

  const scroll = useRef<ScrollView>(null);
  const householdY = useRef<number | null>(null);

  // The tab stays mounted, so the anchor can arrive after the page is laid
  // out (handled here) or before its data has loaded (handled on layout).
  useEffect(() => {
    if (section !== 'household' || householdY.current === null) return;
    scrollToSection(scroll, householdY.current, insets.top);
    router.setParams({ section: undefined });
  }, [section, insets.top, router]);

  const onHouseholdLayout = (event: LayoutChangeEvent) => {
    const y = event.nativeEvent.layout.y;
    const first = householdY.current === null;
    householdY.current = y;
    if (first && section === 'household') {
      // One frame later: the scroll view has to know its new content height.
      requestAnimationFrame(() => scrollToSection(scroll, y, insets.top));
      router.setParams({ section: undefined });
    }
  };

  const failed = [settings, household, calendar, referrals].find((query) => query.isError);
  const ready = settings.data && household.data && calendar.data && referrals.data;
  // `Screen` forwards these to its scroll view; a ref is a plain prop there.
  const scrollProps = { ref: scroll } as ScrollViewProps;

  return (
    <Screen onRefresh={onRefresh} refreshing={refreshing} scrollProps={scrollProps}>
      {ready ? (
        <SettingsPanels
          initialSettings={settings.data}
          household={household.data}
          calendarIntegration={calendar.data}
          referrals={referrals.data}
          onHouseholdLayout={onHouseholdLayout}
        />
      ) : (
        <>
          <PageHeader
            titlePrefix={messages.settings.headerTitlePrefix}
            title={messages.settings.headerTitleEmphasis}
            description={messages.settings.headerDescription}
          />
          {failed ? (
            <Card variant="solid" style={{ gap: 12, alignItems: 'flex-start' }}>
              <Text size="sm" color="ink3">
                {failed.error?.message}
              </Text>
              <Button
                variant="outline"
                label={locale === 'pt-BR' ? 'Tentar de novo' : 'Try again'}
                loading={refreshing}
                onPress={onRefresh}
              />
            </Card>
          ) : (
            <View style={{ gap: 28 }}>
              {Array.from({ length: 3 }, (_, index) => (
                <View key={index} style={{ gap: 12 }}>
                  <View style={{ gap: 8, paddingHorizontal: 6 }}>
                    <Skeleton width={72} height={10} />
                    <Skeleton width="55%" height={24} />
                  </View>
                  <SkeletonCard lines={4} height={40} />
                </View>
              ))}
            </View>
          )}
        </>
      )}
    </Screen>
  );
}
