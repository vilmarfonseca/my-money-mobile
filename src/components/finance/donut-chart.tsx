import Svg, { Circle, Path } from 'react-native-svg';

import { useTheme } from '@/theme/theme-provider';
import { resolveColor } from '@/theme/tones';

export type DonutSlice = { amount: number; color: string; id: string };

/** The ring is drawn in a 100-unit box and scaled to whatever square holds it. */
const BOX = 100;
const CENTER = BOX / 2;
/** Gap between slices, in degrees (recharts' `paddingAngle`). */
const PADDING_ANGLE = 1;

/** "72%" of the largest radius that fits the box. */
function toRadius(value: string) {
  const share = Number.parseFloat(value);
  return (Number.isFinite(share) ? share / 100 : 1) * CENTER;
}

/** Angles run counter-clockwise from three o'clock, as recharts lays out a pie. */
function point(radius: number, angle: number) {
  const radians = (-angle * Math.PI) / 180;
  const x = CENTER + radius * Math.cos(radians);
  const y = CENTER + radius * Math.sin(radians);
  return `${x.toFixed(3)} ${y.toFixed(3)}`;
}

function sectorPath(inner: number, outer: number, start: number, end: number) {
  const large = end - start > 180 ? 1 : 0;
  return [
    `M ${point(outer, start)}`,
    `A ${outer} ${outer} 0 ${large} 0 ${point(outer, end)}`,
    `L ${point(inner, end)}`,
    `A ${inner} ${inner} 0 ${large} 1 ${point(inner, start)}`,
    'Z',
  ].join(' ');
}

/**
 * The ring shared by the category and allocation donut cards. It fills its
 * parent, which must be a square (`aspectRatio: 1`).
 */
export function DonutChart({
  data,
  innerRadius,
  outerRadius,
}: {
  data: DonutSlice[];
  /** Hole radius as a percentage of the box's half width, e.g. "70%". */
  innerRadius: string;
  outerRadius: string;
}) {
  const { colors } = useTheme();
  const inner = toRadius(innerRadius);
  const outer = toRadius(outerRadius);
  const slices = data.filter((slice) => slice.amount > 0);
  const total = slices.reduce((sum, slice) => sum + slice.amount, 0);
  // Every slice is followed by one gap, so the gaps come out of the circle.
  const sweep = 360 - slices.length * PADDING_ANGLE;

  const sectors: Array<{ color: string; id: string; path: string }> = [];
  let cursor = 0;
  for (const slice of slices) {
    const angle = (slice.amount / total) * sweep;
    sectors.push({
      color: resolveColor(slice.color, colors),
      id: slice.id,
      path: sectorPath(inner, outer, cursor, cursor + angle),
    });
    cursor += angle + PADDING_ANGLE;
  }

  return (
    <Svg width="100%" height="100%" viewBox={`0 0 ${BOX} ${BOX}`}>
      {slices.length === 1 ? (
        // An arc cannot close on itself, so a lone slice is a stroked circle.
        <Circle
          cx={CENTER}
          cy={CENTER}
          r={(inner + outer) / 2}
          fill="none"
          stroke={resolveColor(slices[0].color, colors)}
          strokeWidth={outer - inner}
        />
      ) : (
        sectors.map((sector) => <Path key={sector.id} d={sector.path} fill={sector.color} />)
      )}
    </Svg>
  );
}
