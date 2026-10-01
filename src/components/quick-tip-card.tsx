import { type Href, useRouter } from 'expo-router';
import { useState, type ReactNode } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { FadeOutUp, LinearTransition } from 'react-native-reanimated';

import { useEntitlements } from '@/components/billing/entitlements-provider';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Eyebrow, Text } from '@/components/ui/text';
import { useI18n } from '@/lib/i18n/provider';

type QuickTipAction = {
  label: string;
  href?: Href;
  onClick?: () => void;
};

/**
 * Dismissible "quick tip" card in the serif voice. Smart tips are a Plus
 * feature, so the card renders nothing on Starter. Compose the body from
 * nested `Text` nodes; it inherits the display face.
 */
export function QuickTipCard({
  children,
  eyebrow,
  primaryAction,
  secondaryAction,
  style,
}: {
  children: ReactNode;
  eyebrow?: string;
  primaryAction?: QuickTipAction;
  secondaryAction?: QuickTipAction;
  style?: StyleProp<ViewStyle>;
}) {
  const { messages } = useI18n();
  const { features } = useEntitlements();
  const router = useRouter();
  const [dismissed, setDismissed] = useState(false);
  const secondary = secondaryAction ?? { label: messages.common.later };

  if (!features.smartTips || dismissed) return null;

  return (
    <Animated.View exiting={FadeOutUp.duration(260)} layout={LinearTransition} style={style}>
      <Card style={{ gap: 16, marginBottom: 24 }}>
        <View style={{ gap: 4 }}>
          <Eyebrow>{eyebrow ?? messages.common.quickTip}</Eyebrow>
          <Text font="display" size="xl" style={{ lineHeight: 27 }}>
            {children}
          </Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {primaryAction ? (
            <Button
              label={primaryAction.label}
              onPress={() => {
                primaryAction.onClick?.();
                if (primaryAction.href) router.push(primaryAction.href);
              }}
            />
          ) : null}
          <Button
            variant="outline"
            label={secondary.label}
            onPress={() => {
              secondary.onClick?.();
              setDismissed(true);
            }}
          />
        </View>
      </Card>
    </Animated.View>
  );
}
