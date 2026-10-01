import Svg, { Circle, Path } from 'react-native-svg';

export type GoalsSavedSlice = {
  key: string;
  label: string;
  color: string;
  value: number;
};

type GoalsSavedDonutProps = {
  chartData: GoalsSavedSlice[];
  /** Colour of the bare ring drawn when every slice is zero. */
  emptyColor: string;
  innerRadius: number;
  outerRadius: number;
  size: number;
};

/**
 * The goals hero ring. Slices start at three o'clock and run counter-clockwise
 * with no gap between them, as the web's recharts pie lays them out.
 */
export function GoalsSavedDonut({
  chartData,
  emptyColor,
  innerRadius,
  outerRadius,
  size,
}: GoalsSavedDonutProps) {
  const center = size / 2;
  const slices = chartData.filter((item) => item.value > 0);
  const total = slices.reduce((sum, item) => sum + item.value, 0);

  const point = (radius: number, degrees: number) => {
    const radians = (degrees * Math.PI) / 180;
    // SVG's y axis points down, so counter-clockwise subtracts the sine.
    return `${center + radius * Math.cos(radians)} ${center - radius * Math.sin(radians)}`;
  };

  const ring = (color: string, key: string) => (
    <Circle
      key={key}
      cx={center}
      cy={center}
      r={(innerRadius + outerRadius) / 2}
      fill="none"
      stroke={color}
      strokeWidth={outerRadius - innerRadius}
    />
  );

  const arcs: Array<{ item: GoalsSavedSlice; start: number; sweep: number }> = [];
  let cursor = 0;
  for (const item of slices) {
    const sweep = (item.value / total) * 360;
    arcs.push({ item, start: cursor, sweep });
    cursor += sweep;
  }

  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {total <= 0
        ? ring(emptyColor, 'empty')
        : arcs.map(({ item, start, sweep }) => {
            // An arc cannot close on itself: a lone slice is a full ring.
            if (sweep >= 359.99) return ring(item.color, item.key);

            const end = start + sweep;
            const large = sweep > 180 ? 1 : 0;
            return (
              <Path
                key={item.key}
                fill={item.color}
                d={[
                  `M ${point(outerRadius, start)}`,
                  `A ${outerRadius} ${outerRadius} 0 ${large} 0 ${point(outerRadius, end)}`,
                  `L ${point(innerRadius, end)}`,
                  `A ${innerRadius} ${innerRadius} 0 ${large} 1 ${point(innerRadius, start)}`,
                  'Z',
                ].join(' ')}
              />
            );
          })}
    </Svg>
  );
}
