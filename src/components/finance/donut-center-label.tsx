import {
  Children,
  cloneElement,
  Fragment,
  isValidElement,
  useState,
  type ReactNode,
} from 'react';
import { StyleSheet, View } from 'react-native';

import { Text, type TextProps } from '@/components/ui/text';

/**
 * Value + caption centred in a donut's hole.
 *
 * The figure is sized to the text it holds rather than to a fixed step, so a
 * six-digit total and a two-digit percentage both sit inside the ring: the
 * hole's width is known (a share of the chart box), and the type scales down
 * once the string is long enough to need it. Render it as a sibling of the
 * chart inside the chart's square; it measures that square itself.
 */

/**
 * Width of one glyph in the display face, as a share of its size. Measured
 * across currency strings in that face (0.47–0.50 per character), rounded up
 * so the estimate never runs wider than the text actually does.
 */
const GLYPH_WIDTH = 0.5;
/**
 * Keep the text off the ring: only this much of the hole's width is usable.
 * The line sits on the centre, where the circle is at its widest, so it can
 * run close to the full diameter without touching the stroke.
 */
const SAFE_WIDTH = 0.94;
/** The web sizes are in rem. */
const REM = 16;

const clamp = (min: number, value: number, max: number) => Math.min(max, Math.max(min, value));

/**
 * React Native text does not inherit a size from its parent, so the computed
 * size is handed to every `Text` nested in the figure (the muted cents, a "%"
 * sign); the face defaults to the display one.
 */
function sizeFigure(children: ReactNode, size: number): ReactNode {
  return Children.map(children, (child) => {
    if (!isValidElement<TextProps>(child)) return child;
    if (child.type === Fragment) return sizeFigure(child.props.children, size);
    if (child.type !== Text) return child;
    return cloneElement(child, { font: child.props.font ?? 'display', size, tight: true });
  });
}

export function DonutCenterLabel({
  caption,
  children,
  fit,
  holePercent = 70,
  maxRem = 4,
  minRem = 0.75,
}: {
  caption: ReactNode;
  /** The figure: strings and nested `Text` nodes, sized by this component. */
  children: ReactNode;
  /** The rendered text, used to pick the size — e.g. "R$ 45.053,82". */
  fit: string;
  /** Donut hole diameter as a percentage of the chart box. */
  holePercent?: number;
  /** Upper bound so short values do not balloon. */
  maxRem?: number;
  /** Lower bound so very long values stay legible. */
  minRem?: number;
}) {
  // Width of the chart box: what the web reads through container query units.
  const [box, setBox] = useState(0);
  const available = (holePercent / 100) * SAFE_WIDTH * box;
  const valueSize = clamp(
    minRem * REM,
    available / Math.max(fit.length, 1) / GLYPH_WIDTH,
    maxRem * REM,
  );
  const captionSize = clamp(0.5 * REM, box * 0.035, 0.75 * REM);

  return (
    <View
      onLayout={(event) => setBox(event.nativeEvent.layout.width)}
      style={[StyleSheet.absoluteFill, styles.center]}>
      {box > 0 ? (
        <>
          <Text font="display" size={valueSize} tight numberOfLines={1}>
            {sizeFigure(children, valueSize)}
          </Text>
          <Text
            font="sansMedium"
            size={captionSize}
            color="ink3"
            uppercase
            tracking={captionSize * 0.1}
            numberOfLines={1}
            style={{ marginTop: 2 }}>
            {caption}
          </Text>
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' },
});
