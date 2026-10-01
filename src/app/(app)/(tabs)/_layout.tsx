import { Tabs } from 'expo-router/js-tabs';

import { AppTabBar } from '@/components/shell/app-tab-bar';
import { useTheme } from '@/theme/theme-provider';

/**
 * Every page of the signed-in app lives in this navigator so the bottom bar
 * stays put across all of them; `AppTabBar` decides which get a button.
 * Screens are kept mounted, so returning to one is instant.
 */
export default function TabsLayout() {
  const { colors } = useTheme();

  return (
    <Tabs
      backBehavior="history"
      tabBar={() => <AppTabBar />}
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: colors.canvas },
      }}
    />
  );
}
