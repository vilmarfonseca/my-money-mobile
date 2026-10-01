import { RotateCcw } from 'lucide-react-native';

import { Button } from '@/components/ui/button';

/**
 * Header action that clears a scope selection. The web version deletes query
 * params; here the selection is screen state, so the screen passes the reset.
 */
export function ClearSelectionButton({ label, onClear }: { label: string; onClear: () => void }) {
  return (
    <Button
      variant="outline"
      label={label}
      icon={(props) => <RotateCcw {...props} />}
      onPress={onClear}
    />
  );
}
