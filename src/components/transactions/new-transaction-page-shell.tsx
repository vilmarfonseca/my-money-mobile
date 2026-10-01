import { View } from 'react-native';

import { NewTransactionForm } from '@/components/transactions/new-transaction-form';
import { ToastViewport } from '@/components/ui/toast';
import type {
  TransactionFormOptions,
  TransactionFormType,
} from '@/lib/transactions/transaction-utils';

type NewTransactionPageShellProps = {
  options: TransactionFormOptions;
  defaultType: TransactionFormType;
  lockType: boolean;
};

export function NewTransactionPageShell({
  defaultType,
  lockType,
  options,
}: NewTransactionPageShellProps) {
  // Where the form lands when there is no page to go back to.
  const redirectTo =
    lockType && defaultType === 'income'
      ? '/income'
      : lockType && defaultType === 'expense'
        ? '/expenses'
        : '/dashboard';

  return (
    <View style={{ flex: 1 }}>
      <NewTransactionForm
        options={options}
        defaultType={defaultType}
        lockType={lockType}
        redirectTo={redirectTo}
        variant="page"
      />
      {/* The route is a native modal screen, which covers the root viewport. */}
      <ToastViewport />
    </View>
  );
}
