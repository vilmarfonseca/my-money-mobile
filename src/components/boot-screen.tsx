import { ActivityIndicator, View } from 'react-native';

import { LogoMark } from '@/components/brand/logo-mark';
import { MeshBackground } from '@/components/ui/mesh-background';
import { useTheme } from '@/theme/theme-provider';

/**
 * What a cold start shows until the signed-in shell is ready: the logo over
 * the mesh with a small spinner. It matches the native splash screen, so
 * opening the app reads as one continuous screen.
 */
export function BootScreen() {
  const { colors } = useTheme();
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel="MyMoney"
      style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 20 }}>
      <MeshBackground />
      <LogoMark size={64} />
      <ActivityIndicator color={colors.ink1} />
    </View>
  );
}
