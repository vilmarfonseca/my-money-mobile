import { Plus } from 'lucide-react-native';
import { useState } from 'react';

import { AddAccountModal } from '@/components/accounts/add-account-modal';
import { IconButton } from '@/components/ui/button';
import { useI18n } from '@/lib/i18n/provider';

/** "Add account" header action: the dark round "+" of the app bar. */
export function AddAccountButton({
  isFirstAccount = false,
}: {
  /** Workspace has no accounts yet, so this one is primary by definition. */
  isFirstAccount?: boolean;
}) {
  const { messages } = useI18n();
  const [open, setOpen] = useState(false);

  return (
    <>
      <IconButton
        variant="action"
        accessibilityLabel={messages.accountsPage.addAccount}
        icon={(props) => <Plus {...props} />}
        onPress={() => setOpen(true)}
      />

      <AddAccountModal isFirstAccount={isFirstAccount} open={open} onOpenChange={setOpen} />
    </>
  );
}
