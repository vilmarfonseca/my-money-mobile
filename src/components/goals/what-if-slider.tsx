import { useState } from 'react';
import { View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

import { useTheme } from '@/theme/theme-provider';
import { shadows } from '@/theme/tokens';

const THUMB = 24;
const TRACK = 8;
/** Touch target height around the 8px track. */
const HEIGHT = 36;

/**
 * Range slider from 0 to `max` in `step` increments: the native counterpart
 * of the web simulator's `<input type="range">`. Drag the thumb or tap the
 * track; vertical drags are left to the page's scroll view.
 */
export function WhatIfSlider({
  accessibilityLabel,
  accessibilityValueText,
  max,
  onChange,
  step,
  value,
}: {
  accessibilityLabel: string;
  /** Spoken value, e.g. the formatted amount. */
  accessibilityValueText?: string;
  max: number;
  onChange: (value: number) => void;
  step: number;
  value: number;
}) {
  const { colors } = useTheme();
  const [width, setWidth] = useState(0);
  const increment = step > 0 ? step : 1;
  const ratio = max > 0 ? Math.min(Math.max(value / max, 0), 1) : 0;

  const snap = (next: number) =>
    Math.min(Math.max(Math.round(next / increment) * increment, 0), max);

  // The thumb's centre travels between the two track ends, half a thumb in.
  const setFromX = (x: number) => {
    const travel = width - THUMB;
    if (travel <= 0 || max <= 0) return;
    const position = Math.min(Math.max((x - THUMB / 2) / travel, 0), 1);
    onChange(snap(position * max));
  };

  // Callbacks run on the JS thread: each move sets React state anyway.
  const pan = Gesture.Pan()
    .runOnJS(true)
    .activeOffsetX([-4, 4])
    .failOffsetY([-12, 12])
    .onStart((event) => setFromX(event.x))
    .onUpdate((event) => setFromX(event.x));
  const tap = Gesture.Tap()
    .runOnJS(true)
    .onEnd((event, success) => {
      if (success) setFromX(event.x);
    });

  return (
    <GestureDetector gesture={Gesture.Race(pan, tap)}>
      <View
        accessible
        accessibilityRole="adjustable"
        accessibilityLabel={accessibilityLabel}
        accessibilityValue={{ min: 0, max, now: value, text: accessibilityValueText }}
        accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
        onAccessibilityAction={(event) => {
          if (event.nativeEvent.actionName === 'increment') onChange(snap(value + increment));
          if (event.nativeEvent.actionName === 'decrement') onChange(snap(value - increment));
        }}
        collapsable={false}
        onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
        style={{ height: HEIGHT, justifyContent: 'center', paddingHorizontal: THUMB / 2 }}>
        <View
          style={{
            // Runs under the thumb at both ends, so the track spans the row.
            marginHorizontal: -THUMB / 2,
            height: TRACK,
            borderRadius: TRACK / 2,
            backgroundColor: colors.surface2,
            borderWidth: 1,
            borderColor: colors.lineStrong,
          }}
        />
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: (HEIGHT - TRACK) / 2,
            left: 0,
            width: THUMB / 2 + ratio * Math.max(width - THUMB, 0),
            height: TRACK,
            borderRadius: TRACK / 2,
            backgroundColor: colors.accent,
          }}
        />
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: (HEIGHT - THUMB) / 2,
            left: ratio * Math.max(width - THUMB, 0),
            width: THUMB,
            height: THUMB,
            borderRadius: THUMB / 2,
            borderWidth: 3,
            borderColor: colors.surface1,
            backgroundColor: colors.accent,
            boxShadow: shadows.md,
          }}
        />
      </View>
    </GestureDetector>
  );
}
