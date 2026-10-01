import { WalletCards } from 'lucide-react-native';
import { useState } from 'react';

import { useRefreshData } from '@/api/hooks';
import { ManageCardsModal } from '@/components/cards/manage-cards-modal';
import { Button, IconButton } from '@/components/ui/button';
import type { CreditCardAccount } from '@/lib/cards/cards-data';
import { useI18n } from '@/lib/i18n/provider';

type ManageCardsButtonProps = {
  cards: CreditCardAccount[];
  /** Round icon-only trigger for the app bar. */
  iconOnly?: boolean;
};

export function ManageCardsButton({ cards: pageCards, iconOnly = false }: ManageCardsButtonProps) {
  const { messages } = useI18n();
  const refresh = useRefreshData();
  // While the modal is open it works on its own copy, kept current by the
  // card actions' results; each opening starts again from the page's cards.
  const [cards, setCards] = useState(pageCards);
  const [isOpen, setIsOpen] = useState(false);

  const open = () => {
    setCards(pageCards);
    setIsOpen(true);
  };

  const handleCardsChange = (nextCards: CreditCardAccount[]) => {
    setCards(nextCards);
    void refresh();
  };

  return (
    <>
      {iconOnly ? (
        <IconButton
          accessibilityLabel={messages.cardsPage.manageCards}
          variant="action"
          icon={(props) => <WalletCards {...props} />}
          onPress={open}
        />
      ) : (
        <Button
          variant="outline"
          icon={(props) => <WalletCards {...props} />}
          label={messages.cardsPage.manageCards}
          onPress={open}
        />
      )}
      <ManageCardsModal
        cards={cards}
        open={isOpen}
        onOpenChange={setIsOpen}
        onCardsChange={handleCardsChange}
      />
    </>
  );
}
