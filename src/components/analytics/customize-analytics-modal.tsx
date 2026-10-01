import { Check } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { callApi } from '@/api/client';
import { ANALYTICS_WIDGETS } from '@/components/analytics/analytics-widgets';
import { Button, IconButton } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { Text } from '@/components/ui/text';
import { toast } from '@/components/ui/toast';
import {
  ANALYTICS_CATALOG,
  ANALYTICS_SECTION_IDS,
  DEFAULT_ANALYTICS_CARDS,
  type AnalyticsCardId,
} from '@/lib/analytics/analytics-catalog';
import { buildAnalyticsPreviewData } from '@/lib/analytics/analytics-preview-data';
import { useI18n } from '@/lib/i18n/provider';
import { useTheme } from '@/theme/theme-provider';
import { palette, radius } from '@/theme/tokens';

/**
 * The "Customize" picker: every catalog card as a multi-select tile with a
 * live preview rendered by the same widget component as the real card, in the
 * standard full-screen modal sheet.
 */
export function CustomizeAnalyticsModal({
  open,
  onOpenChange,
  selected,
  onApply,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selected: AnalyticsCardId[];
  onApply: (ids: AnalyticsCardId[]) => void;
}) {
  const { messages } = useI18n();
  const { colors, scheme } = useTheme();
  const m = messages.analytics;
  // Previews always render an illustrative example dataset, not live data.
  const [previewData] = useState(buildAnalyticsPreviewData);
  const [isPending, setIsPending] = useState(false);
  const [draft, setDraft] = useState<Set<AnalyticsCardId>>(new Set(selected));

  // Re-seed the draft from the applied selection every time the modal opens
  // (derived-state-during-render pattern, so no effect is needed).
  const [prevOpen, setPrevOpen] = useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) setDraft(new Set(selected));
  }

  const toggle = (id: AnalyticsCardId) => {
    setDraft((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const apply = async () => {
    const ids = ANALYTICS_CATALOG.filter((card) => draft.has(card.id)).map((card) => card.id);
    onApply(ids);
    onOpenChange(false);
    setIsPending(true);
    try {
      const result = await callApi('analytics.saveCardSelection', ids);
      if (!result.ok) toast.error(m.saveFailed);
      // A page refresh that was in flight during the save answers with the
      // old selection; applying again keeps what was just saved on screen.
      else onApply(ids);
    } catch {
      toast.error(m.saveFailed);
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Modal
      title={m.customizeTitle}
      open={open}
      onOpenChange={onOpenChange}
      headerAction={
        <IconButton
          accessibilityLabel={m.done}
          variant="action"
          icon={(props) => <Check {...props} />}
          disabled={isPending}
          onPress={apply}
        />
      }
      footer={
        <>
          <Button
            variant="outline"
            size="xl"
            label={m.resetToDefaults}
            onPress={() => setDraft(new Set(DEFAULT_ANALYTICS_CARDS))}
          />
          <Button
            size="xl"
            label={m.done}
            disabled={isPending}
            onPress={apply}
            style={{ flex: 1 }}
          />
        </>
      }>
      <View style={{ gap: 20, paddingBottom: 8 }}>
        {ANALYTICS_SECTION_IDS.map((sectionId) => (
          <View key={sectionId}>
            <Text
              font="mono"
              size={10}
              color="ink3"
              uppercase
              tracking={1}
              style={{ marginBottom: 10 }}>
              {m.sections[sectionId]}
            </Text>
            <View style={{ gap: 12 }}>
              {ANALYTICS_CATALOG.filter((card) => card.section === sectionId).map((card) => {
                const Widget = ANALYTICS_WIDGETS[card.id];
                const on = draft.has(card.id);
                return (
                  <Pressable
                    key={card.id}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: on }}
                    accessibilityLabel={m.cards[card.id].title}
                    onPress={() => toggle(card.id)}
                    style={{
                      borderRadius: radius.md,
                      // `ring-3 ring-plum-100` around the selected tile.
                      boxShadow: on
                        ? `0 0 0 3px ${scheme === 'dark' ? palette.plum800 : palette.plum100}`
                        : undefined,
                    }}>
                    <View
                      style={{
                        overflow: 'hidden',
                        borderRadius: radius.md,
                        borderWidth: 1.5,
                        borderColor: on ? palette.plum500 : colors.line,
                      }}>
                      <View
                        style={{
                          minHeight: 128,
                          justifyContent: 'center',
                          paddingHorizontal: 16,
                          paddingVertical: 14,
                          backgroundColor: colors.surface2,
                          pointerEvents: 'none',
                        }}>
                        <Widget data={previewData} preview />
                      </View>
                      <View
                        style={{
                          gap: 2,
                          paddingHorizontal: 16,
                          paddingVertical: 12,
                          backgroundColor: colors.surface1,
                        }}>
                        <Text font="mono" size={9.5} color="ink3" uppercase tracking={0.95}>
                          {m.cards[card.id].eyebrow}
                        </Text>
                        <Text font="display" size="lg" style={{ lineHeight: 22 }}>
                          {m.cards[card.id].title}
                        </Text>
                      </View>
                      <View
                        style={{
                          position: 'absolute',
                          top: 10,
                          right: 10,
                          width: 24,
                          height: 24,
                          borderRadius: 12,
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderWidth: 1.5,
                          borderColor: on ? palette.plum500 : colors.lineStrong,
                          backgroundColor: on ? palette.plum500 : colors.surface1,
                        }}>
                        {on ? <Check size={14} strokeWidth={2.6} color={palette.white} /> : null}
                      </View>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ))}
      </View>
    </Modal>
  );
}
