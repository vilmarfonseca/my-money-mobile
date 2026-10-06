import Svg, { Circle, Path, Rect } from 'react-native-svg';

import type { AppLocale } from '@/lib/i18n/config';

/**
 * SVG flags for the language switcher. Emoji flags are unreliable (the iOS
 * simulator has no emoji font and renders "?"), so they are drawn here, the
 * same as on the web.
 */
export function FlagIcon({ locale, width = 20 }: { locale: AppLocale; width?: number }) {
  const height = (width * 14) / 20;
  return locale === 'pt-BR' ? (
    <BrazilFlag width={width} height={height} />
  ) : (
    <UnitedStatesFlag width={width} height={height} />
  );
}

type FlagSize = { width: number; height: number };

function UnitedStatesFlag({ width, height }: FlagSize) {
  return (
    <Svg width={width} height={height} viewBox="0 0 20 14" fill="none">
      <Rect width="20" height="14" rx="2" fill="#f4f4f4" />
      {[2, 6, 10].map((y) => (
        <Rect key={y} y={y} width="20" height="2" fill="#d64550" />
      ))}
      <Rect width="20" height="2" rx="1" fill="#d64550" />
      <Rect y="12" width="20" height="2" rx="1" fill="#d64550" />
      <Path d="M0 2a2 2 0 0 1 2-2h7v7H0V2Z" fill="#3c4d8f" />
    </Svg>
  );
}

function BrazilFlag({ width, height }: FlagSize) {
  return (
    <Svg width={width} height={height} viewBox="0 0 20 14" fill="none">
      <Rect width="20" height="14" rx="2" fill="#2f9e44" />
      <Path d="M10 2.2 17.4 7 10 11.8 2.6 7 10 2.2Z" fill="#f5c518" />
      <Circle cx="10" cy="7" r="2.6" fill="#3c4d8f" />
      <Path d="M7.5 6.6c1.9-.3 3.6.2 4.9 1.3" stroke="#f4f4f4" strokeWidth={0.7} fill="none" />
    </Svg>
  );
}
