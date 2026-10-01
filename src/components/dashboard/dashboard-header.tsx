import { useRouter } from 'expo-router';
import { Plus } from 'lucide-react-native';
import type { RefObject } from 'react';
import { View } from 'react-native';

import { IconButton } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import type { DayPeriod } from '@/lib/i18n/messages';
import { useI18n } from '@/lib/i18n/provider';

function getDayPeriod(): DayPeriod {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 18) return 'afternoon';
  return 'evening';
}

/**
 * The dashboard's app bar: greeting, the user's first name in the serif voice,
 * and the round "+" that starts a new transaction.
 */
export function DashboardHeader({
  addButtonRef,
  name,
}: {
  /** Wraps the "+" so the first-step coachmark can find it on screen. */
  addButtonRef?: RefObject<View | null>;
  name: string;
}) {
  const { messages } = useI18n();
  const router = useRouter();

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginTop: 12,
        marginBottom: 16,
      }}>
      <View style={{ flex: 1 }}>
        <Text size="base" color="ink3">
          {messages.dashboard.greeting('', getDayPeriod())}
        </Text>
        <Text font="display" size="4xl" numberOfLines={1} style={{ lineHeight: 45 }}>
          {messages.dashboard.hello}{' '}
          <Text font="displayItalic" size="4xl" color="accentSoftFg" style={{ lineHeight: 45 }}>
            {name}
          </Text>
        </Text>
      </View>
      {/* Not collapsable: the coachmark measures this view. */}
      <View ref={addButtonRef} collapsable={false}>
        <IconButton
          accessibilityLabel={messages.common.addTransaction}
          variant="action"
          icon={(props) => <Plus {...props} />}
          onPress={() => router.push('/transactions/new')}
        />
      </View>
    </View>
  );
}
