import { useState, type ReactNode } from 'react';
import { Pressable, ScrollView, View } from 'react-native';

import { useApiAction } from '@/api/hooks';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ColorPickerButton } from '@/components/ui/color-picker-button';
import { FieldLabel } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { Text } from '@/components/ui/text';
import { toast } from '@/components/ui/toast';
import {
  categoryEmojiSuggestions,
  categoryIconNames,
  categoryIconSet,
  isHexColor,
  isLucideIconName,
  readableTextColor,
} from '@/lib/categories/category-appearance';
import { useI18n } from '@/lib/i18n/provider';
import {
  cleanLabel,
  type CategoryAppearance,
  type TransactionFormType,
} from '@/lib/transactions/transaction-utils';
import { useTheme } from '@/theme/theme-provider';
import { palette, radius } from '@/theme/tokens';

export type CategorySavedResult = {
  previousName: string;
  name: string;
  color: string | null;
  icon: string | null;
};

type CategoryEditorModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  kind: TransactionFormType;
  name: string;
  appearance?: CategoryAppearance;
  onSaved: (result: CategorySavedResult) => void;
};

type IconTab = 'icons' | 'emoji';

/**
 * Edits one category: rename, pick a color, and choose a lucide icon or an
 * emoji. Opens from the category pill in the transaction form.
 */
export function CategoryEditorModal({
  appearance,
  kind,
  name,
  onOpenChange,
  onSaved,
  open,
}: CategoryEditorModalProps) {
  const { messages } = useI18n();
  const { colors } = useTheme();
  const updateCategory = useApiAction('categories.update');
  const isPending = updateCategory.pending;
  const [newName, setNewName] = useState(name);
  const [color, setColor] = useState<string | null>(
    isHexColor(appearance?.color) ? appearance.color : null,
  );
  const [icon, setIcon] = useState<string | null>(appearance?.icon ?? null);
  const [tab, setTab] = useState<IconTab>(icon && !isLucideIconName(icon) ? 'emoji' : 'icons');
  const [emojiInput, setEmojiInput] = useState(icon && !isLucideIconName(icon) ? icon : '');

  // Re-seed local state whenever the modal opens for a different category.
  const [seedKey, setSeedKey] = useState<string | null>(null);
  const renderKey = open ? `${kind}:${name}` : null;
  if (seedKey !== renderKey) {
    setSeedKey(renderKey);
    if (open) {
      const seededIcon = appearance?.icon ?? null;
      setNewName(name);
      setColor(isHexColor(appearance?.color) ? appearance.color : null);
      setIcon(seededIcon);
      setTab(seededIcon && !isLucideIconName(seededIcon) ? 'emoji' : 'icons');
      setEmojiInput(seededIcon && !isLucideIconName(seededIcon) ? seededIcon : '');
    }
  }

  const canSubmit = cleanLabel(newName).length > 0 && !isPending;

  const selectEmoji = (value: string) => {
    const trimmed = value.trim();
    setEmojiInput(trimmed);
    setIcon(trimmed || null);
  };

  const submit = async () => {
    if (!canSubmit) return;

    let result: Awaited<ReturnType<typeof updateCategory.run>>;
    try {
      result = await updateCategory.run({
        kind,
        name,
        newName: cleanLabel(newName),
        color,
        icon,
      });
    } catch (error) {
      toast.error(
        `${messages.transactions.categoryUpdateFailed}\n${error instanceof Error ? error.message : String(error)}`,
      );
      return;
    }

    if (!result.ok) {
      toast.error(`${messages.transactions.categoryUpdateFailed}\n${result.message}`);
      return;
    }

    toast.success(messages.transactions.categoryUpdated);
    onSaved({ previousName: name, name: result.name, color, icon });
    onOpenChange(false);
  };

  const PreviewIcon = icon ? categoryIconSet[icon] : undefined;
  const previewTone = isHexColor(color)
    ? { bg: color, border: color, fg: readableTextColor(color) }
    : { bg: colors.surface1, border: colors.line, fg: colors.ink1 };

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={messages.transactions.editCategory}
      description={messages.transactions.editCategoryHint}
      footer={
        <>
          <Button
            variant="outline"
            size="lg"
            style={{ flex: 1 }}
            label={messages.common.cancel}
            onPress={() => onOpenChange(false)}
          />
          <Button
            size="lg"
            style={{ flex: 1 }}
            label={
              isPending ? `${messages.transactions.saving}…` : messages.transactions.saveChanges
            }
            disabled={!canSubmit}
            onPress={() => void submit()}
          />
        </>
      }>
      <View style={{ gap: 20 }}>
        <View style={{ gap: 8 }}>
          <FieldLabel>{messages.transactions.categoryName}</FieldLabel>
          <Input
            accessibilityLabel={messages.transactions.categoryName}
            maxLength={40}
            value={newName}
            onChangeText={setNewName}
          />
        </View>

        <View style={{ gap: 8 }}>
          <FieldLabel>{messages.transactions.categoryColor}</FieldLabel>
          {/* Untouched, the field shows the brand plum but nothing is stored. */}
          <ColorPickerButton color={color ?? palette.plum500} onChange={setColor} />
        </View>

        <View style={{ gap: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={{ flex: 1 }}>
              <FieldLabel>{messages.transactions.categoryIcon}</FieldLabel>
            </View>
            <SegmentedControl<IconTab>
              accessibilityLabel={messages.transactions.categoryIcon}
              style={{ width: 176 }}
              options={[
                { label: messages.transactions.iconsTab, value: 'icons' },
                { label: messages.transactions.emojiTab, value: 'emoji' },
              ]}
              value={tab}
              onValueChange={setTab}
            />
          </View>

          {tab === 'icons' ? (
            <TileGrid maxHeight={192}>
              <Tile
                label={messages.transactions.noIcon}
                selected={icon === null}
                onPress={() => setIcon(null)}>
                {(tint) => (
                  <Text size="xs" color={icon === null ? tint : 'ink3'}>
                    —
                  </Text>
                )}
              </Tile>
              {categoryIconNames.map((iconName) => {
                const Icon = categoryIconSet[iconName];

                return (
                  <Tile
                    key={iconName}
                    label={iconName}
                    selected={icon === iconName}
                    onPress={() => setIcon(iconName)}>
                    {(tint) => <Icon size={16} color={tint} />}
                  </Tile>
                );
              })}
            </TileGrid>
          ) : (
            <View style={{ gap: 12 }}>
              <Input
                accessibilityLabel={messages.transactions.emojiTab}
                maxLength={8}
                placeholder={messages.transactions.emojiPlaceholder}
                value={emojiInput}
                onChangeText={selectEmoji}
                style={{ fontSize: 18 }}
              />
              <TileGrid maxHeight={160}>
                {categoryEmojiSuggestions.map((emoji) => (
                  <Tile
                    key={emoji}
                    label={emoji}
                    selected={icon === emoji}
                    onPress={() => selectEmoji(emoji)}>
                    {() => (
                      <Text size="lg" tight>
                        {emoji}
                      </Text>
                    )}
                  </Tile>
                ))}
              </TileGrid>
            </View>
          )}
        </View>

        <Card
          variant="control"
          rounded={radius.xl}
          padding={0}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
            paddingHorizontal: 16,
            paddingVertical: 12,
          }}>
          <View
            style={{
              width: 40,
              height: 40,
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: radius.md,
              borderWidth: 1,
              borderColor: previewTone.border,
              backgroundColor: previewTone.bg,
            }}>
            {icon && !isLucideIconName(icon) ? (
              <Text size="lg" tight>
                {icon}
              </Text>
            ) : PreviewIcon ? (
              <PreviewIcon size={16} color={previewTone.fg} />
            ) : (
              <Text size="xs" color={isHexColor(color) ? previewTone.fg : 'ink3'}>
                Aa
              </Text>
            )}
          </View>
          <Text font="sansMedium" size="sm" numberOfLines={1} style={{ flex: 1 }}>
            {cleanLabel(newName) || name}
          </Text>
        </Card>
      </View>
    </Modal>
  );
}

/** Wrapping grid of 40px tiles that scrolls on its own past `maxHeight`. */
function TileGrid({ children, maxHeight }: { children: ReactNode; maxHeight: number }) {
  return (
    <ScrollView
      nestedScrollEnabled
      keyboardShouldPersistTaps="handled"
      style={{ maxHeight }}
      contentContainerStyle={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
      {children}
    </ScrollView>
  );
}

function Tile({
  children,
  label,
  onPress,
  selected,
}: {
  /** Receives the colour the tile's content should be drawn in. */
  children: (tint: string) => ReactNode;
  label: string;
  onPress: () => void;
  selected: boolean;
}) {
  const { colors } = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => ({
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: radius.lg,
        borderWidth: 1,
        borderColor: selected ? 'transparent' : colors.line,
        backgroundColor: selected ? colors.action : 'transparent',
        opacity: pressed ? 0.7 : 1,
      })}>
      {children(selected ? colors.actionForeground : colors.ink2)}
    </Pressable>
  );
}
