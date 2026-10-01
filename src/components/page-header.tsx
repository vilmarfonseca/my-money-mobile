import { type Href, useRouter } from 'expo-router';
import { ChevronLeft, Plus } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';

import { IconButton } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { useI18n } from '@/lib/i18n/provider';
import type { ColorToken } from '@/theme/tokens';

type PageHeaderProps = {
  /** Controls stacked under the bar (period filter, buttons). */
  actions?: ReactNode;
  /** Where the back button goes. The web sends every page back to the dashboard. */
  backHref?: Href;
  /** Right control of the bar. */
  mobileAction?: ReactNode;
  /** Line under the title (plain text or a row of nodes). */
  mobileSubtitle?: ReactNode;
  /** Fallback for the subtitle. */
  description?: string;
  title: string;
  /** Colour of the italic title (the web's `emClassName`); defaults to ink. */
  emColor?: ColorToken;
  /** Upright text before the italic title ("Spending · Groceries"). */
  titlePrefix?: string;
  style?: StyleProp<ViewStyle>;
};

/**
 * The page app bar: round back button, italic serif title with an optional
 * subtitle, and an action on the right, with page controls stacked below.
 */
export function PageHeader({
  actions,
  backHref = '/dashboard',
  description,
  emColor = 'ink1',
  mobileAction,
  mobileSubtitle,
  style,
  title,
  titlePrefix,
}: PageHeaderProps) {
  const { messages } = useI18n();
  const router = useRouter();
  const subtitle = mobileSubtitle ?? description;

  return (
    <View style={[{ gap: 12, marginTop: 12, marginBottom: 16 }, style]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <IconButton
          accessibilityLabel={messages.nav.back}
          icon={(props) => <ChevronLeft {...props} />}
          onPress={() => router.navigate(backHref)}
        />
        <View style={{ flex: 1 }}>
          <Text font="display" size="3xl" tight numberOfLines={1}>
            {titlePrefix ? `${titlePrefix} ` : ''}
            <Text font="displayItalic" size="3xl" tight color={emColor}>
              {title}
            </Text>
          </Text>
          {typeof subtitle === 'string' ? (
            <Text size="xs" color="ink3" numberOfLines={1} style={{ marginTop: 4 }}>
              {subtitle}
            </Text>
          ) : subtitle ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
              {subtitle}
            </View>
          ) : null}
        </View>
        {mobileAction}
      </View>
      {actions}
    </View>
  );
}

/** Dark round "+" in the app bar that opens a route (usually a new transaction). */
export function PageHeaderAddLink({ ariaLabel, href }: { ariaLabel: string; href: Href }) {
  const router = useRouter();
  return (
    <IconButton
      accessibilityLabel={ariaLabel}
      variant="action"
      icon={(props) => <Plus {...props} />}
      onPress={() => router.push(href)}
    />
  );
}
