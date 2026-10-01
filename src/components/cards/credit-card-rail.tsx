import { LinearGradient } from 'expo-linear-gradient';
import { Check } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, {
  Defs,
  LinearGradient as SvgLinearGradient,
  Path,
  RadialGradient,
  Rect,
  Stop,
} from 'react-native-svg';

import { CardNetworkMark } from '@/components/cards/card-brand-marks';
import { Text } from '@/components/ui/text';
import {
  cardColorPalettes,
  cardCustomSurface,
  type CardPaletteId,
  type CreditCardAccount,
} from '@/lib/cards/cards-data';
import { isHexColor } from '@/lib/categories/category-appearance';
import { shadeHex } from '@/lib/colors';
import { radius, shadows, themes } from '@/theme/tokens';

/** `aspect-card`: the ISO card proportion. */
export const CARD_ASPECT = 1.586;

/** Card size inside the phone rail (`max-sm:h-36 max-sm:w-58`). */
const RAIL_CARD_WIDTH = 232;
const RAIL_CARD_HEIGHT = 144;
const RAIL_GAP = 12;

type CreditCardRailProps = {
  cards: CreditCardAccount[];
  /** Tapping a card adds it to, or removes it from, the selection. */
  onSelectionChange: (cardIds: string[]) => void;
  selectedCardIds: string[];
};

/** The snap carousel of card faces; tapping cards scopes the page to them. */
export function CreditCardRail({ cards, onSelectionChange, selectedCardIds }: CreditCardRailProps) {
  const hasSelection = selectedCardIds.length > 0;

  const toggleCard = (cardId: string) => {
    onSelectionChange(
      selectedCardIds.includes(cardId)
        ? selectedCardIds.filter((id) => id !== cardId)
        : [...selectedCardIds, cardId],
    );
  };

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      decelerationRate="fast"
      snapToInterval={RAIL_CARD_WIDTH + RAIL_GAP}
      snapToAlignment="start"
      // The rail reaches 8px into the page gutter, like the web's `-mx-2 px-2`.
      style={{ marginHorizontal: -8, marginBottom: 20 }}
      contentContainerStyle={{
        gap: RAIL_GAP,
        paddingHorizontal: 8,
        paddingTop: 14,
        paddingBottom: 16,
      }}>
      {cards.map((card) => (
        <CreditCardFace
          key={card.id}
          card={card}
          selected={selectedCardIds.includes(card.id)}
          muted={hasSelection && !selectedCardIds.includes(card.id)}
          onPress={() => toggleCard(card.id)}
        />
      ))}
    </ScrollView>
  );
}

export function CreditCardFace({
  card,
  muted,
  onPress,
  selected,
  style,
}: {
  card: CreditCardAccount;
  muted?: boolean;
  onPress?: () => void;
  selected?: boolean;
  /** Size override; defaults to the rail card. */
  style?: StyleProp<ViewStyle>;
}) {
  const surface = getCardSurface(card.palette, card.color);
  const textShadow = {
    textShadowColor: 'rgba(0, 0, 0, 0.16)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  };

  const face = (
    <View style={{ flex: 1, borderRadius: radius.sm, overflow: 'hidden' }}>
      <CardSurfaceFill surface={surface} decorated />

      <View style={{ flex: 1, padding: 16 }}>
        <Text
          font="display"
          size="base"
          tight
          color={surface.text}
          numberOfLines={1}
          style={[{ paddingRight: 40 }, textShadow]}>
          {card.nickname || card.issuer}
        </Text>

        <View
          style={{
            marginTop: 'auto',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 8,
          }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Text
              font="monoMedium"
              size="sm"
              tight
              tracking={0.35}
              color={surface.text}
              style={[{ marginTop: 4 }, textShadow]}>
              ****
            </Text>
            <Text
              font="monoMedium"
              size="sm"
              tight
              tracking={0.35}
              color={surface.text}
              style={textShadow}>
              {card.last4}
            </Text>
          </View>
          <CardNetworkMark network={card.network} color={surface.text} width={44} height={24} />
        </View>
      </View>

      {selected ? (
        <>
          {/* Inset ring: an outside one would be clipped by the scroll rail. */}
          <View
            pointerEvents="none"
            style={[
              StyleSheet.absoluteFill,
              { borderRadius: radius.sm, borderWidth: 2, borderColor: 'rgba(255, 255, 255, 0.8)' },
            ]}
          />
          <View
            style={{
              position: 'absolute',
              top: 8,
              right: 8,
              width: 20,
              height: 20,
              borderRadius: 10,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#ffffff',
              boxShadow: shadows.md,
            }}>
            {/* The badge is white in both themes, so the tick is always dark ink. */}
            <Check size={12} color={themes.light.ink1} strokeWidth={2.5} />
          </View>
        </>
      ) : null}
    </View>
  );

  const frame: StyleProp<ViewStyle> = [
    {
      width: RAIL_CARD_WIDTH,
      height: RAIL_CARD_HEIGHT,
      borderRadius: radius.sm,
      boxShadow: shadows.lg,
      opacity: muted ? 0.6 : 1,
    },
    style,
  ];

  if (!onPress) return <View style={frame}>{face}</View>;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${card.nickname || card.issuer} ${card.last4}`}
      accessibilityState={{ selected: Boolean(selected) }}
      onPress={onPress}
      style={({ pressed }) => [frame, pressed && { transform: [{ scale: 0.985 }] }]}>
      {face}
    </Pressable>
  );
}

/** A soft highlight: the web's `radial-gradient(circle at x% y%, color, transparent stop%)`. */
type Glow = { color: string; opacity: number; stop: number; x: number; y: number };

export type CardSurface = {
  /** Stops of the 135deg base gradient. */
  colors: readonly [string, string, string];
  /** Positions of the stops along the gradient line; the last may pass 1. */
  stops: readonly [number, number, number];
  glows: Glow[];
  /** Readable text colour on this surface. */
  text: string;
};

/**
 * The look of a card face for a palette or a custom colour: the native form
 * of the web's `getCardSurfaceStyle` (same colours, stops and highlights).
 */
export function getCardSurface(paletteId: CardPaletteId, color?: string | null): CardSurface {
  const palette = cardColorPalettes[paletteId];

  // A custom hex colour overrides the legacy palette (design cardGradient).
  if (isHexColor(color)) {
    return {
      colors: [shadeHex(color, -0.4), color, shadeHex(color, 0.42)],
      stops: [0, 0.55, 1.25],
      glows: [{ x: 0.86, y: 0.06, color: '#ffffff', opacity: 0.22, stop: 0.34 }],
      text: cardCustomSurface(color).text,
    };
  }

  if (paletteId === 'silver') {
    return {
      colors: ['#7e8a8f', '#eef1ee', '#a9b1b5'],
      stops: [0, 0.48, 1],
      glows: [{ x: 0.18, y: 0.22, color: '#ffffff', opacity: 0.95, stop: 0.28 }],
      text: palette.text,
    };
  }

  if (paletteId === 'black') {
    return {
      colors: ['#020203', '#17141f', '#3c3548'],
      stops: [0, 0.62, 1],
      glows: [{ x: 0.78, y: 0.18, color: '#ffffff', opacity: 0.14, stop: 0.32 }],
      text: palette.text,
    };
  }

  return {
    colors: [palette.primary, palette.secondary, palette.accent],
    stops: [0, 0.58, 1.25],
    glows: [
      { x: 0.82, y: 0.18, color: palette.accent, opacity: 1, stop: 0.28 },
      { x: 0.12, y: 0.92, color: '#ffffff', opacity: 0.2, stop: 0.24 },
    ],
    text: palette.text,
  };
}

/**
 * End points of a CSS `linear-gradient(<angle>deg, ...)` in a box, as the
 * 0..1 fractions `expo-linear-gradient` takes. CSS sizes the gradient line so
 * its ends meet the box corners; `reach` stretches it past the far end for
 * gradients whose last stop sits beyond 100%.
 */
function cssGradientPoints(angle: number, width: number, height: number, reach = 1) {
  const radians = (angle * Math.PI) / 180;
  const dx = Math.sin(radians);
  const dy = -Math.cos(radians);
  const half = (Math.abs(width * dx) + Math.abs(height * dy)) / 2;
  const start = { x: width / 2 - dx * half, y: height / 2 - dy * half };
  const end = { x: start.x + dx * half * 2 * reach, y: start.y + dy * half * 2 * reach };
  return { start, end };
}

/** Radius of a CSS `circle at x y` gradient: the distance to the farthest corner. */
function farthestCorner(x: number, y: number, width: number, height: number) {
  return Math.hypot(Math.max(x, width - x), Math.max(y, height - y));
}

/** The 1px diagonal hairlines every 5px that give the faces their grain. */
function grainPath(width: number, height: number) {
  const lean = height * Math.tan((15 * Math.PI) / 180);
  const step = 5 / Math.cos((15 * Math.PI) / 180);
  let d = '';
  for (let x = 0; x < width + lean; x += step) {
    d += `M${x.toFixed(1)} 0L${(x - lean).toFixed(1)} ${height}`;
  }
  return d;
}

/**
 * Paints a card surface behind its parent's content: base gradient,
 * highlights and grain. `decorated` adds the card face's extra sheen and
 * shading; the small swatches in the manage list go without.
 */
export function CardSurfaceFill({
  decorated = false,
  surface,
}: {
  decorated?: boolean;
  surface: CardSurface;
}) {
  // The highlights are sized in px, so they wait for the first layout.
  const [size, setSize] = useState<{ width: number; height: number } | null>(null);
  const width = size?.width ?? CARD_ASPECT;
  const height = size?.height ?? 1;
  const reach = surface.stops[2];
  const base = cssGradientPoints(135, width, height, reach);
  const sheen = cssGradientPoints(115, width, height);

  return (
    <View
      pointerEvents="none"
      style={StyleSheet.absoluteFill}
      onLayout={(event) => {
        const { height: nextHeight, width: nextWidth } = event.nativeEvent.layout;
        if (nextWidth > 0 && nextHeight > 0 && (nextWidth !== size?.width || nextHeight !== size?.height)) {
          setSize({ width: nextWidth, height: nextHeight });
        }
      }}>
      <LinearGradient
        colors={surface.colors}
        locations={[0, surface.stops[1] / reach, 1]}
        start={{ x: base.start.x / width, y: base.start.y / height }}
        end={{ x: base.end.x / width, y: base.end.y / height }}
        style={StyleSheet.absoluteFill}
      />
      {size ? (
        <Svg width={size.width} height={size.height} style={StyleSheet.absoluteFill}>
          <Defs>
            {surface.glows.map((glow, index) => (
              <RadialGradient
                key={index}
                id={`glow-${index}`}
                gradientUnits="userSpaceOnUse"
                cx={glow.x * size.width}
                cy={glow.y * size.height}
                fx={glow.x * size.width}
                fy={glow.y * size.height}
                r={farthestCorner(
                  glow.x * size.width,
                  glow.y * size.height,
                  size.width,
                  size.height,
                )}>
                <Stop offset={0} stopColor={glow.color} stopOpacity={glow.opacity} />
                <Stop offset={glow.stop} stopColor={glow.color} stopOpacity={0} />
              </RadialGradient>
            ))}
            {decorated ? (
              <>
                {/* The blurred white and dark discs in two corners of the face. */}
                <RadialGradient
                  id="corner-light"
                  gradientUnits="userSpaceOnUse"
                  cx={size.width - 32}
                  cy={32}
                  fx={size.width - 32}
                  fy={32}
                  r={120}>
                  <Stop offset={0} stopColor="#ffffff" stopOpacity={0.15} />
                  <Stop offset={0.45} stopColor="#ffffff" stopOpacity={0.1} />
                  <Stop offset={1} stopColor="#ffffff" stopOpacity={0} />
                </RadialGradient>
                <RadialGradient
                  id="corner-shade"
                  gradientUnits="userSpaceOnUse"
                  cx={96}
                  cy={size.height - 24}
                  fx={96}
                  fy={size.height - 24}
                  r={112}>
                  <Stop offset={0} stopColor="#000000" stopOpacity={0.1} />
                  <Stop offset={0.45} stopColor="#000000" stopOpacity={0.07} />
                  <Stop offset={1} stopColor="#000000" stopOpacity={0} />
                </RadialGradient>
                <SvgLinearGradient
                  id="sheen"
                  gradientUnits="userSpaceOnUse"
                  x1={sheen.start.x}
                  y1={sheen.start.y}
                  x2={sheen.end.x}
                  y2={sheen.end.y}>
                  <Stop offset={0} stopColor="#ffffff" stopOpacity={0} />
                  <Stop offset={0.42} stopColor="#ffffff" stopOpacity={0.05} />
                  <Stop offset={0.58} stopColor="#ffffff" stopOpacity={0} />
                </SvgLinearGradient>
              </>
            ) : null}
          </Defs>

          {surface.glows.map((_, index) => (
            <Rect
              key={index}
              width={size.width}
              height={size.height}
              fill={`url(#glow-${index})`}
            />
          ))}
          <Path
            d={grainPath(size.width, size.height)}
            stroke="#ffffff"
            strokeOpacity={0.08}
            strokeWidth={1}
          />
          {decorated ? (
            <>
              <Rect width={size.width} height={size.height} fill="#000000" fillOpacity={0.05} />
              <Rect width={size.width} height={1} fill="#ffffff" fillOpacity={0.5} />
              <Rect width={size.width} height={size.height} fill="url(#corner-light)" />
              <Rect width={size.width} height={size.height} fill="url(#corner-shade)" />
              <Rect width={size.width} height={size.height} fill="url(#sheen)" />
            </>
          ) : null}
        </Svg>
      ) : null}
    </View>
  );
}
