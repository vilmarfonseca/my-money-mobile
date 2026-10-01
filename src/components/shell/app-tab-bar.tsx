import { type Href, usePathname, useRouter } from 'expo-router';
import { CreditCard, Home, Landmark, Menu, ShoppingCart, Target, type LucideIcon } from 'lucide-react-native';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/components/ui/text';
import { useI18n } from '@/lib/i18n/provider';
import { useTheme } from '@/theme/theme-provider';
import { shadows } from '@/theme/tokens';

/**
 * The app's bottom bar: five pages plus the menu. Pages reached from the
 * menu (income, balance, calendar, analytics, settings) keep the bar on
 * screen with nothing highlighted, as in the web app.
 */
export function AppTabBar() {
  const { messages } = useI18n();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const router = useRouter();

  const tabs: Array<{ href: Href; icon: LucideIcon; label: string; path: string }> = [
    { label: messages.nav.home, path: '/dashboard', href: '/dashboard', icon: Home },
    { label: messages.common.spending, path: '/expenses', href: '/expenses', icon: ShoppingCart },
    { label: messages.common.cards, path: '/cards', href: '/cards', icon: CreditCard },
    { label: messages.common.accounts, path: '/accounts', href: '/accounts', icon: Landmark },
    { label: messages.common.goals, path: '/goals', href: '/goals', icon: Target },
    { label: messages.nav.menu, path: '/menu', href: '/menu', icon: Menu },
  ];

  return (
    <View
      accessibilityRole="tablist"
      accessibilityLabel={messages.nav.menu}
      style={{
        flexDirection: 'row',
        paddingHorizontal: 8,
        paddingTop: 12,
        paddingBottom: Math.max(insets.bottom, 12),
        borderTopWidth: 1,
        borderTopColor: colors.line,
        backgroundColor: colors.bar,
        boxShadow: shadows.xl,
      }}>
      {tabs.map((tab) => {
        const active = pathname === tab.path;
        const color = active ? colors.accentSoftFg : colors.ink3;
        const Icon = tab.icon;
        return (
          <Pressable
            key={tab.path}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            accessibilityLabel={tab.label}
            onPress={() => {
              if (!active) router.navigate(tab.href);
            }}
            style={{ flex: 1, alignItems: 'center', gap: 4, paddingTop: 6 }}>
            {active ? (
              <View
                style={{
                  position: 'absolute',
                  top: -12,
                  width: 24,
                  height: 2,
                  borderRadius: 1,
                  backgroundColor: colors.accentSoftFg,
                }}
              />
            ) : null}
            <Icon size={24} color={color} />
            <Text font="sansMedium" size="2xs" color={color} numberOfLines={1}>
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
