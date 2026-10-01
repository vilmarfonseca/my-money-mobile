import { useLocalSearchParams, useRouter } from 'expo-router';
import { View } from 'react-native';

import { useScreenQuery } from '@/api/hooks';
import { NewTransactionPageShell } from '@/components/transactions/new-transaction-page-shell';
import { TransactionFormPlaceholder } from '@/components/transactions/transaction-form-placeholder';
import { ToastViewport } from '@/components/ui/toast';
import { useI18n } from '@/lib/i18n/provider';
import {
  isTransactionFormType,
  type TransactionFormType,
} from '@/lib/transactions/transaction-utils';

/**
 * "New transaction", presented as a full-screen modal by the parent stack.
 * `?type=income|expense` preselects the type and `?lockType=1` pins it.
 */
export default function NewTransactionRoute() {
  const { lockType, type } = useLocalSearchParams<{ lockType?: string; type?: string }>();
  const { messages } = useI18n();
  const router = useRouter();
  const defaultType: TransactionFormType = isTransactionFormType(type) ? type : 'expense';
  const options = useScreenQuery('transactions.formOptions', []);

  if (!options.data) {
    return (
      <View style={{ flex: 1 }}>
        <TransactionFormPlaceholder
          title={`${messages.transactions.newTitle} ${messages.common.transaction}`}
          error={options.isError ? options.error.message : null}
          onRetry={() => void options.refetch()}
          onClose={() => {
            if (router.canGoBack()) router.back();
            else router.replace('/dashboard');
          }}
        />
        <ToastViewport />
      </View>
    );
  }

  return (
    <NewTransactionPageShell
      options={options.data}
      defaultType={defaultType}
      lockType={lockType === '1'}
    />
  );
}
