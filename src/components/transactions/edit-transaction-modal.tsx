import { useRef, useState } from 'react';
import { Modal as RNModal, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { callApi } from '@/api/client';
import { NewTransactionForm } from '@/components/transactions/new-transaction-form';
import { TransactionFormPlaceholder } from '@/components/transactions/transaction-form-placeholder';
import { toast, ToastViewport } from '@/components/ui/toast';
import { useI18n } from '@/lib/i18n/provider';
import type { TransactionEditValues } from '@/lib/transactions/transaction-edit-actions';
import type { TransactionFormOptions } from '@/lib/transactions/transaction-utils';

type EditState = {
  id: string;
  options: TransactionFormOptions;
  values: TransactionEditValues;
};

/**
 * Row-press editing for any transaction list: call `openEdit(id)` from a
 * row's press handler and render `{modal}` once alongside the list. The
 * full-screen modal opens at once, loads the transaction, and saves through
 * the same form as "Add transaction".
 */
export function useEditTransactionModal() {
  const { messages } = useI18n();
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<EditState | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  // Only the latest request may fill the modal: it can be closed and
  // reopened for another row while an earlier one is still loading.
  const request = useRef(0);

  const close = () => {
    request.current += 1;
    setIsLoading(false);
    // `edit` stays so the form is still there while the modal slides out.
    setOpen(false);
  };

  const openEdit = (transactionId: string) => {
    if (isLoading) return;
    const current = (request.current += 1);
    setEdit(null);
    setOpen(true);
    setIsLoading(true);

    const fail = (message: string) => {
      toast.error(`${messages.transactions.savedError}\n${message}`);
      setOpen(false);
    };

    void callApi('transactions.editContext', transactionId)
      .then((context) => {
        if (request.current !== current) return;
        if (!context.ok) {
          fail(context.message);
          return;
        }
        setEdit({ id: transactionId, options: context.options, values: context.values });
      })
      .catch((error: unknown) => {
        if (request.current !== current) return;
        fail(error instanceof Error ? error.message : String(error));
      })
      .finally(() => {
        if (request.current === current) setIsLoading(false);
      });
  };

  const modal = (
    <RNModal
      visible={open}
      animationType="slide"
      presentationStyle="fullScreen"
      statusBarTranslucent
      onRequestClose={close}>
      {/* A native modal is its own window: insets have to be measured again. */}
      <SafeAreaProvider>
        <View style={{ flex: 1 }}>
          {edit ? (
            <NewTransactionForm
              key={edit.id}
              options={edit.options}
              transactionId={edit.id}
              initialValues={edit.values}
              onCancel={close}
              onSuccess={close}
              showCloseButton
            />
          ) : (
            <TransactionFormPlaceholder
              title={`${messages.transactions.editTitle} ${messages.common.transaction}`}
              onClose={close}
            />
          )}
          <ToastViewport />
        </View>
      </SafeAreaProvider>
    </RNModal>
  );

  return { isLoading, modal, openEdit };
}
