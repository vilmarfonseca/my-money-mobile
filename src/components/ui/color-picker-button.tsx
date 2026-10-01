import { Check, Pencil } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet } from '@/components/ui/sheet';
import { Text } from '@/components/ui/text';
import { readableTextColor } from '@/lib/categories/category-appearance';
import { useI18n } from '@/lib/i18n/provider';
import { useTheme } from '@/theme/theme-provider';
import { palette, radius, shadows } from '@/theme/tokens';

const HEX = /^#[0-9a-f]{6}$/i;

function hslToHex(h: number, s: number, l: number) {
  const a = s * Math.min(l, 1 - l);
  const channel = (n: number) => {
    const k = (n + h / 30) % 12;
    const value = l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
    return Math.round(value * 255)
      .toString(16)
      .padStart(2, '0');
  };
  return `#${channel(0)}${channel(8)}${channel(4)}`;
}

/** Twelve hues in five lightness steps, plus a row of neutrals. */
const spectrum = [0.3, 0.42, 0.54, 0.66, 0.78].map((lightness) =>
  Array.from({ length: 12 }, (_, index) => hslToHex(index * 30, 0.72, lightness)),
);
const neutrals = ['#000000', '#1a1424', '#4a4458', '#7a7488', '#b8b1c0', '#e9e2d6', '#ffffff'];
const brand = [
  palette.plum500,
  palette.plum700,
  palette.plum300,
  palette.coral500,
  palette.coral300,
  palette.sage500,
  palette.sage700,
  palette.amber500,
  palette.clay500,
];

/**
 * Colour field: swatch + hex + "Pick color", opening a sheet with brand
 * colours, a spectrum grid and a hex input (the phone counterpart of the web
 * app's sketch picker).
 */
export function ColorPickerButton({
  color,
  onChange,
}: {
  /** Current hex colour, e.g. "#7c3aed". */
  color: string;
  onChange: (hex: string) => void;
}) {
  const { messages } = useI18n();
  const { colors } = useTheme();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(color);

  const updateOpen = (next: boolean) => {
    if (next) setDraft(color);
    setOpen(next);
  };

  const pick = (hex: string) => {
    setDraft(hex);
    onChange(hex);
  };

  const swatch = (hex: string, size: number) => {
    const selected = hex.toLowerCase() === color.toLowerCase();
    return (
      <Pressable
        key={hex}
        accessibilityRole="button"
        accessibilityLabel={hex}
        accessibilityState={{ selected }}
        onPress={() => pick(hex)}
        style={{
          width: size,
          height: size,
          borderRadius: 8,
          backgroundColor: hex,
          borderWidth: 1,
          borderColor: colors.line,
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        {selected ? <Check size={14} color={readableTextColor(hex)} /> : null}
      </Pressable>
    );
  };

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={messages.cardsPage.pickColor}
        onPress={() => updateOpen(true)}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          height: 48,
          paddingHorizontal: 12,
          borderRadius: radius.sm,
          borderWidth: 1,
          borderColor: colors.lineStrong,
          backgroundColor: colors.surface1,
        }}>
        <View
          style={{
            width: 28,
            height: 28,
            borderRadius: 8,
            backgroundColor: color,
            borderWidth: 1,
            borderColor: colors.line,
            boxShadow: shadows.sm,
          }}
        />
        <Text font="monoMedium" size="sm" uppercase>
          {color}
        </Text>
        <View style={{ marginLeft: 'auto', flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Pencil size={14} color={colors.ink3} />
          <Text font="sansMedium" size="xs" color="ink3">
            {messages.cardsPage.pickColor}
          </Text>
        </View>
      </Pressable>

      <Sheet
        open={open}
        onOpenChange={updateOpen}
        title={messages.cardsPage.pickColor}
        footer={
          <Button block style={{ flex: 1 }} label={messages.common.apply} onPress={() => setOpen(false)} />
        }>
        <View style={{ gap: 14 }}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {brand.map((hex) => swatch(hex, 32))}
          </View>
          <View style={{ gap: 4 }}>
            {spectrum.map((row, index) => (
              <View key={index} style={{ flexDirection: 'row', gap: 4 }}>
                {row.map((hex) => (
                  <View key={hex} style={{ flex: 1, aspectRatio: 1 }}>
                    {swatchFill(hex, color, colors.line, pick)}
                  </View>
                ))}
              </View>
            ))}
            <View style={{ flexDirection: 'row', gap: 4, marginTop: 4 }}>
              {neutrals.map((hex) => swatch(hex, 32))}
            </View>
          </View>
          <Input
            mono
            autoCapitalize="none"
            autoCorrect={false}
            maxLength={7}
            value={draft}
            onChangeText={(text) => {
              const next = text.startsWith('#') ? text : `#${text}`;
              setDraft(next);
              if (HEX.test(next)) onChange(next.toLowerCase());
            }}
            leading={
              <View
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: 6,
                  backgroundColor: HEX.test(draft) ? draft : color,
                  borderWidth: 1,
                  borderColor: colors.line,
                }}
              />
            }
          />
        </View>
      </Sheet>
    </>
  );
}

function swatchFill(
  hex: string,
  current: string,
  border: string,
  pick: (hex: string) => void,
) {
  const selected = hex.toLowerCase() === current.toLowerCase();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={hex}
      accessibilityState={{ selected }}
      onPress={() => pick(hex)}
      style={{
        flex: 1,
        borderRadius: 6,
        backgroundColor: hex,
        borderWidth: selected ? 2 : 0,
        borderColor: selected ? readableTextColor(hex) : border,
      }}
    />
  );
}
