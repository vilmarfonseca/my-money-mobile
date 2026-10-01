import * as Clipboard from 'expo-clipboard';
import { Check, Copy, Gift, Share2 } from 'lucide-react-native';
import { useState } from 'react';
import { Share, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { toast } from '@/components/ui/toast';
import { useI18n } from '@/lib/i18n/provider';
import type { ReferralSummary } from '@/lib/referrals/referral-queries';
import { useTheme } from '@/theme/theme-provider';
import { radius } from '@/theme/tokens';

/**
 * Settings → Referrals: the user's invite code and link, how the reward
 * works, and a tally of friends invited and free days received.
 */
export function ReferralSection({ summary }: { summary: ReferralSummary }) {
  const { messages } = useI18n();
  const { colors } = useTheme();
  const t = messages.referrals.settings;
  const [copied, setCopied] = useState<'link' | 'code' | null>(null);

  const copy = async (what: 'link' | 'code') => {
    try {
      await Clipboard.setStringAsync(what === 'link' ? summary.link : summary.code);
      setCopied(what);
      toast.success(what === 'link' ? t.copied : t.codeCopied);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      // Clipboard unavailable: both values are visible and selectable on the
      // card, so nothing else to do.
    }
  };

  const shareLink = async () => {
    try {
      await Share.share({ message: t.shareText(summary.link) });
    } catch {
      // Dismissed share sheet.
    }
  };

  const stats = [
    { label: t.stats.pending, value: summary.pendingCount },
    { label: t.stats.rewarded, value: summary.rewardedCount },
    { label: t.stats.days, value: summary.freeDaysEarned },
  ];

  return (
    <Card variant="solid" rounded={radius.xl}>
      <Text font="sansMedium" size="xs" color="ink3" uppercase tracking={1.2}>
        {t.eyebrow}
      </Text>
      <Text font="display" size="2xl" tight style={{ marginTop: 4 }}>
        {t.title}
      </Text>
      <Text size="sm" color="ink3" style={{ marginTop: 8, lineHeight: 21 }}>
        {t.description}
      </Text>

      <View
        style={{
          marginTop: 24,
          padding: 16,
          borderRadius: radius.xl,
          borderWidth: 1,
          borderColor: colors.line,
          backgroundColor: colors.surface2,
        }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
          <View
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: colors.accentSoft,
            }}>
            <Gift size={20} color={colors.accentSoftFg} />
          </View>
          <View style={{ flex: 1 }}>
            <Text font="sansMedium" size="xs" color="ink3" uppercase tracking={1.2}>
              {t.codeLabel}
            </Text>
            <Text font="monoSemiBold" size="2xl" selectable numberOfLines={1} style={{ marginTop: 4 }}>
              {summary.code}
            </Text>
          </View>
        </View>
        <Button
          block
          size="lg"
          variant="outline"
          label={t.copyCode}
          icon={(props) => (copied === 'code' ? <Check {...props} /> : <Copy {...props} />)}
          onPress={() => copy('code')}
          style={{ marginTop: 16 }}
        />

        <Text
          font="sansMedium"
          size="xs"
          color="ink3"
          uppercase
          tracking={1.2}
          style={{ marginTop: 20 }}>
          {t.linkLabel}
        </Text>
        <View
          style={{
            justifyContent: 'center',
            height: 44,
            marginTop: 8,
            paddingHorizontal: 16,
            borderRadius: radius.pill,
            borderWidth: 1,
            borderColor: colors.controlBorder,
            backgroundColor: colors.control,
          }}>
          <Text font="mono" size="sm" selectable numberOfLines={1}>
            {summary.link}
          </Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
          <Button
            size="lg"
            label={t.copyLink}
            icon={(props) => (copied === 'link' ? <Check {...props} /> : <Copy {...props} />)}
            onPress={() => copy('link')}
            style={{ flex: 1 }}
          />
          <Button
            size="lg"
            variant="outline"
            label={t.share}
            icon={(props) => <Share2 {...props} />}
            onPress={shareLink}
            style={{ flex: 1 }}
          />
        </View>
        <Text size="xs" color="ink3" style={{ marginTop: 8 }}>
          {t.linkHint}
        </Text>
      </View>

      <View style={{ gap: 12, marginTop: 24 }}>
        {t.howItWorks.map((step, index) => (
          <View key={step} style={{ flexDirection: 'row', gap: 12 }}>
            <View
              style={{
                width: 24,
                height: 24,
                borderRadius: 12,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: colors.accentSoft,
              }}>
              <Text font="monoSemiBold" size="xs" color="accentSoftFg">
                {index + 1}
              </Text>
            </View>
            <Text size="sm" color="ink2" style={{ flex: 1, lineHeight: 23 }}>
              {step}
            </Text>
          </View>
        ))}
      </View>

      <View style={{ gap: 12, marginTop: 24 }}>
        {stats.map((stat) => (
          <View
            key={stat.label}
            style={{
              paddingHorizontal: 16,
              paddingVertical: 12,
              borderRadius: radius.lg,
              borderWidth: 1,
              borderColor: colors.line,
              backgroundColor: colors.surface2,
            }}>
            <Text size="xs" color="ink3">
              {stat.label}
            </Text>
            <Text font="monoSemiBold" size="2xl" style={{ marginTop: 4 }}>
              {stat.value}
            </Text>
          </View>
        ))}
      </View>

      <Text size="xs" color="ink3" style={{ marginTop: 16 }}>
        {summary.invitedWith
          ? `${t.invitedBy(summary.invitedWith.code)} ${
              summary.invitedWith.status === 'rewarded' ? t.invitedRewarded : t.invitedPending
            }`
          : t.unlimited}
      </Text>
    </Card>
  );
}
