import {
  Banknote,
  CreditCard,
  FileText,
  Landmark,
  ReceiptText,
  Repeat,
  type LucideIcon,
} from 'lucide-react-native';
import { View } from 'react-native';

import type { DueType } from '@/lib/calendar/types';
import { useTheme } from '@/theme/theme-provider';

import { dueTypeColors } from './type-colors';

const icons: Record<DueType, LucideIcon> = {
  bill: ReceiptText,
  credit: CreditCard,
  income: Banknote,
  loan: Landmark,
  subscription: Repeat,
  tax: FileText,
};

export function TypeIcon({ color, type }: { color: string; type: DueType }) {
  const Icon = icons[type];
  return <Icon size={16} color={color} />;
}

/** The type's icon on its soft tile (`grid place-items-center` + `typeStyles.soft`). */
export function TypeIconTile({
  rounded,
  size,
  type,
}: {
  rounded: number;
  size: number;
  type: DueType;
}) {
  const { colors } = useTheme();
  const soft = dueTypeColors(type, colors).soft;

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: rounded,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: soft.bg,
      }}>
      <TypeIcon type={type} color={soft.fg} />
    </View>
  );
}
