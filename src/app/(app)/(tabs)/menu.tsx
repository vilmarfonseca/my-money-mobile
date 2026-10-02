import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { type Href, useRouter } from 'expo-router';
import {
  BarChart3,
  BookOpen,
  Calendar,
  ChevronRight,
  CircleHelp,
  CreditCard,
  Home,
  Landmark,
  LogOut,
  Plus,
  Scale,
  Settings,
  ShieldCheck,
  ShoppingCart,
  Target,
  TrendingUp,
  X,
  type LucideIcon,
} from 'lucide-react-native';
import { useState, type ReactNode } from 'react';
import { Pressable, View } from 'react-native';

import { openWebPage } from '@/api/web-handoff';
import { useEntitlements } from '@/components/billing/entitlements-provider';
import { WorkspaceSwitcher } from '@/components/household/workspace-switcher';
import { SupportModal } from '@/components/support-modal';
import { ImportExportButton } from '@/components/transactions/import-export-button';
import { Button, IconButton } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { Text } from '@/components/ui/text';
import { useI18n } from '@/lib/i18n/provider';
import { useBootstrap } from '@/providers/app-data-provider';
import { useSession } from '@/providers/auth-provider';
import { useTheme } from '@/theme/theme-provider';
import { gradients, radius } from '@/theme/tokens';

function MenuRow({
  first,
  icon: Icon,
  label,
  onPress,
}: {
  first?: boolean;
  icon: LucideIcon;
  label: string;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderTopWidth: first ? 0 : 1,
        borderTopColor: colors.line,
        backgroundColor: pressed ? colors.controlHover : 'transparent',
      })}>
      <Icon size={20} color={colors.ink2} />
      <Text font="sansMedium" size="sm" style={{ flex: 1 }}>
        {label}
      </Text>
      <ChevronRight size={16} color={colors.ink4} />
    </Pressable>
  );
}

function MenuGroup({ children, label }: { children: ReactNode; label: string }) {
  const { colors } = useTheme();
  return (
    <View>
      <Text
        font="sansSemiBold"
        size="2xs"
        color="ink3"
        uppercase
        tracking={0.6}
        style={{ marginBottom: 10, marginLeft: 2 }}>
        {label}
      </Text>
      <View
        style={{
          marginBottom: 20,
          overflow: 'hidden',
          borderRadius: radius.md,
          borderWidth: 1,
          borderColor: colors.line,
          backgroundColor: colors.surface1,
        }}>
        {children}
      </View>
    </View>
  );
}

/**
 * The two actions share a row while both labels fit; a locale with longer
 * copy stacks them full width instead of truncating.
 */
const menuActionStyle = { flexGrow: 1, flexShrink: 0 } as const;

function getInitials(value: string) {
  const parts = value.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'MM';
  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

/** The full-screen menu behind the last tab: profile, workspace, every page. */
export default function MenuScreen() {
  const { locale, messages } = useI18n();
  const { colors } = useTheme();
  const router = useRouter();
  const { signOut, user } = useSession();
  const { isAdmin, user: account, workspaces } = useBootstrap();
  const { features } = useEntitlements();
  const [supportOpen, setSupportOpen] = useState(false);

  const displayName = user?.name ?? account.name ?? user?.email ?? account.email ?? 'My Money';
  const displayEmail = user?.email ?? account.email ?? messages.nav.signedIn;

  // Mirrors the web sidebar: pages the plan does not include are not listed.
  const pages = [
    { title: messages.common.dashboard, href: '/dashboard', icon: Home },
    { title: messages.common.income, href: '/income', icon: TrendingUp },
    { title: messages.common.spending, href: '/expenses', icon: ShoppingCart },
    features.balancePage && { title: messages.common.balance, href: '/balance', icon: Scale },
    features.calendarPage && { title: messages.nav.calendar, href: '/calendar', icon: Calendar },
    { title: messages.common.cards, href: '/cards', icon: CreditCard },
    { title: messages.common.accounts, href: '/accounts', icon: Landmark },
    { title: messages.common.goals, href: '/goals', icon: Target },
    features.analyticsPage && { title: messages.nav.analytics, href: '/analytics', icon: BarChart3 },
  ].filter((item) => item !== false) as Array<{ href: Href; icon: LucideIcon; title: string }>;

  return (
    <Screen contentStyle={{ paddingHorizontal: 20, paddingBottom: 32 }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: 16,
          marginBottom: 20,
        }}>
        <Text font="display" size="4xl" tight>
          {messages.nav.menu}
        </Text>
        <IconButton
          accessibilityLabel={messages.nav.closeMenu}
          icon={(props) => <X {...props} />}
          onPress={() => (router.canGoBack() ? router.back() : router.navigate('/dashboard'))}
          style={{ backgroundColor: colors.surface2 }}
        />
      </View>

      <Pressable
        accessibilityRole="button"
        onPress={() => router.navigate('/settings')}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 14,
          marginBottom: 20,
          padding: 16,
          borderRadius: radius.md,
          borderWidth: 1,
          borderColor: colors.line,
          backgroundColor: colors.surface1,
        }}>
        <LinearGradient
          colors={gradients.avatar}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            width: 52,
            height: 52,
            borderRadius: 16,
            overflow: 'hidden',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          {user?.imageUrl ? (
            <Image
              accessibilityLabel={messages.settings.profileImageAria}
              source={{ uri: user.imageUrl }}
              style={{ width: 52, height: 52 }}
            />
          ) : (
            <Text font="display" size="2xl" color="#ffffff">
              {getInitials(displayName)}
            </Text>
          )}
        </LinearGradient>
        <View style={{ flex: 1 }}>
          <Text font="sansSemiBold" size="base" numberOfLines={1}>
            {displayName}
          </Text>
          <Text size="xs" color="ink3" numberOfLines={1}>
            {displayEmail}
          </Text>
        </View>
        <ChevronRight size={20} color={colors.ink4} />
      </Pressable>

      {features.household ? (
        <View style={{ marginBottom: 20 }}>
          <WorkspaceSwitcher workspaces={workspaces} />
        </View>
      ) : null}

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 }}>
        <Button
          size="xl"
          shape="rounded"
          style={menuActionStyle}
          label={messages.common.addTransaction}
          icon={(props) => <Plus {...props} />}
          onPress={() => router.push('/transactions/new')}
        />
        <ImportExportButton size="xl" shape="rounded" style={menuActionStyle} />
      </View>

      <MenuGroup label={messages.common.workspace}>
        {pages.map((page, index) => (
          <MenuRow
            key={String(page.href)}
            first={index === 0}
            icon={page.icon}
            label={page.title}
            onPress={() => router.navigate(page.href)}
          />
        ))}
      </MenuGroup>

      {isAdmin ? (
        <MenuGroup label={messages.admin.navGroup}>
          <MenuRow
            first
            icon={ShieldCheck}
            label={messages.admin.affiliates.navLabel}
            onPress={() => router.navigate('/admin/affiliates')}
          />
        </MenuGroup>
      ) : null}

      <MenuGroup label={messages.common.settings}>
        <MenuRow
          first
          icon={Settings}
          label={messages.common.settings}
          onPress={() => router.navigate('/settings')}
        />
        <MenuRow
          icon={BookOpen}
          label={messages.common.documentation}
          onPress={() => openWebPage(locale === 'pt-BR' ? '/docs' : '/en/docs')}
        />
        {features.support ? (
          <MenuRow
            icon={CircleHelp}
            label={messages.common.helpSupport}
            onPress={() => setSupportOpen(true)}
          />
        ) : null}
        <MenuRow icon={LogOut} label={messages.nav.signOut} onPress={() => signOut()} />
      </MenuGroup>

      <SupportModal open={supportOpen} onOpenChange={setSupportOpen} />
    </Screen>
  );
}
