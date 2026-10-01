import Svg, { Path, Rect } from 'react-native-svg';

import { useTheme } from '@/theme/theme-provider';
import { palette } from '@/theme/tokens';

const LETTER =
  'M315-10L315-10Q311-10 306-13Q301-16 299-26L299-26L148-639Q147-646 142-645.5Q137-645 137-638L137-638L117-86Q116-58 126-43.5Q136-29 161-25L161-25L174-23Q187-22 187-11L187-11Q187 0 172 0L172 0L29 0Q14 0 14-11L14-11Q14-22 27-23L27-23L40-25Q66-29 75.5-43.5Q85-58 86-86L86-86L106-654Q107-675 100-682Q93-689 70-693L70-693L47-697Q34-700 34-709L34-709Q34-720 49-720L49-720L169-720Q200-720 207-690L207-690L328-191Q330-184 334.5-184Q339-184 340-191L340-191L466-695Q472-720 498-720L498-720L616-720Q631-720 631-709L631-709Q631-700 618-697L618-697L595-693Q574-689 567-682Q560-675 561-654L561-654L581-66Q582-45 588-38Q594-31 615-27L615-27L638-23Q651-20 651-11L651-11Q651 0 636 0L636 0L455 0Q440 0 440-11L440-11Q440-20 453-23L453-23L476-27Q497-31 504-38Q511-45 510-66L510-66L493-638Q493-645 488.5-645.5Q484-646 482-640L482-640L330-26Q328-16 323.5-13Q319-10 315-10Z';

/** The MyMoney glyph: a serif M struck through by two coral bars. */
export function LogoMark({ color, size = 64 }: { color?: string; size?: number }) {
  const { colors } = useTheme();
  return (
    <Svg width={size} height={size} viewBox="-167.5 -860 1000 1000">
      <Path d={LETTER} fill={color ?? colors.ink1} />
      <Rect x={-86} y={-480} width={837} height={80} rx={40} fill={palette.coral500} />
      <Rect x={-86} y={-320} width={837} height={80} rx={40} fill={palette.coral500} />
    </Svg>
  );
}
