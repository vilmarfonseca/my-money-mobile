import { typeLabels } from '@/lib/calendar/calendar-style';
import type { DueType } from '@/lib/calendar/types';
import { useI18n } from '@/lib/i18n/provider';

/** Display order of the due types (the web iterates `typeLabels`). */
export const dueTypes = Object.keys(typeLabels) as DueType[];

/** Localized names of the due types (the web's `localizedTypeLabels`). */
export function useDueTypeLabels(): Record<DueType, string> {
  const { messages } = useI18n();
  return {
    bill: messages.calendar.bills,
    credit: messages.common.cards,
    income: messages.common.income,
    loan: messages.calendar.loans,
    subscription: messages.calendar.subscriptions,
    tax: messages.calendar.tax,
  };
}

/**
 * Copy the web calendar hardcodes in English (it has no `messages` entry).
 * Kept in one place so it can move to the web repo's `messages.ts` as is.
 */
export function useCalendarStrings() {
  const { locale } = useI18n();
  const pt = locale === 'pt-BR';

  return {
    selected: pt ? 'Selecionado' : 'Selected',
    daySummary: (count: number, net: string) =>
      pt
        ? `${count} evento${count === 1 ? '' : 's'} · ${net} líquido`
        : `${count} event${count === 1 ? '' : 's'} · ${net} net`,
    runway: pt ? 'Horizonte de 45 dias' : '45-day runway',
    startingFrom: (date: string) => (pt ? `A partir de ${date}` : `Starting ${date}`),
    dueItems: (count: number) =>
      pt
        ? `${count} vencimento${count === 1 ? '' : 's'}`
        : `${count} due item${count === 1 ? '' : 's'}`,
    monthDue: (count: number) =>
      pt ? `${count} vencimento${count === 1 ? '' : 's'}` : `${count} due`,
    calendarMix: pt ? 'Composição do calendário' : 'Calendar mix',
    suggestedAction: pt ? 'Ação sugerida' : 'Suggested action',
    suggestedActionBody: pt
      ? 'Revise todos os itens sem pagamento automático pelo menos três dias antes do vencimento.'
      : 'Review all non-autopay items at least three days before due.',
    reviewQueue: pt ? 'Fila de revisão' : 'Review queue',
    loadFailed: pt ? 'Não foi possível carregar o calendário.' : 'Could not load the calendar.',
    retry: pt ? 'Tentar novamente' : 'Try again',
  };
}
