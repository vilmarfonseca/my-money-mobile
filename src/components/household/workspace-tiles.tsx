import { LinearGradient } from 'expo-linear-gradient';
import { House, User } from 'lucide-react-native';
import type { ReactNode } from 'react';

import { Text } from '@/components/ui/text';
import { palette, radius } from '@/theme/tokens';

const householdGradient = [palette.sage500, palette.sage700] as const;
const personalGradient = [palette.plum400, palette.coral400] as const;

function Tile({
  children,
  colors,
  rounded,
  size,
}: {
  children: ReactNode;
  colors: readonly [string, string];
  rounded: number;
  size: number;
}) {
  return (
    <LinearGradient
      colors={colors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{
        width: size,
        height: size,
        borderRadius: rounded,
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      {children}
    </LinearGradient>
  );
}

/** Green tile with a house: a shared workspace. */
export function HouseholdTile({ rounded = radius.xl, size = 44 }: { rounded?: number; size?: number }) {
  return (
    <Tile colors={householdGradient} rounded={rounded} size={size}>
      <House size={size / 2} color={palette.white} />
    </Tile>
  );
}

/** Plum-to-coral tile with a person: the user's private workspace. */
export function PersonalTile({ rounded = radius.xl, size = 44 }: { rounded?: number; size?: number }) {
  return (
    <Tile colors={personalGradient} rounded={rounded} size={size}>
      <User size={size / 2} color={palette.white} />
    </Tile>
  );
}

/** A member's initial on the personal gradient. */
export function MemberAvatar({ name }: { name: string }) {
  const initial = name.trim()[0]?.toUpperCase() ?? '?';
  return (
    <Tile colors={personalGradient} rounded={radius.xl} size={44}>
      <Text font="sansSemiBold" size="sm" color={palette.white}>
        {initial}
      </Text>
    </Tile>
  );
}
