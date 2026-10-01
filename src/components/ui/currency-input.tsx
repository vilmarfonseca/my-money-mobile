import { Input, type InputProps } from '@/components/ui/input';
import { useI18n } from '@/lib/i18n/provider';

type CurrencyInputProps = Omit<InputProps, 'keyboardType' | 'onChangeText' | 'value'> & {
  /** Raw cents digits: "12345" is 123.45. */
  value: string;
  onValueChange: (digits: string) => void;
};

/**
 * Masked money field. The value is the string of digits typed so far; they
 * fill in from the right, cents first, and are shown in the user's currency
 * and locale ("R$ 1.234,50").
 */
export function CurrencyInput({ onValueChange, placeholder, value, ...props }: CurrencyInputProps) {
  const { currency, locale } = useI18n();
  const display = value ? formatCurrencyDigits(value, locale, currency) : '';

  return (
    <Input
      mono
      keyboardType="number-pad"
      placeholder={placeholder ?? formatCurrencyDigits('', locale, currency)}
      value={display}
      // Keep the caret at the end: digits are appended and removed there.
      selection={{ start: display.length, end: display.length }}
      onChangeText={(text) => onValueChange(text.replace(/\D/g, '').replace(/^0+/, '').slice(0, 13))}
      {...props}
    />
  );
}

export function currencyDigitsToAmount(digits: string) {
  const amount = Number(digits || '0') / 100;
  return Number.isFinite(amount) ? amount : 0;
}

/** The inverse: an amount as the digits the field would hold for it. */
export function amountToCurrencyDigits(amount: number) {
  const cents = Math.round(Math.abs(amount) * 100);
  return cents > 0 ? String(cents) : '';
}

function formatCurrencyDigits(digits: string, locale: string, currency: string) {
  const amount = Number(digits || '0') / 100;

  return new Intl.NumberFormat(locale, {
    currency,
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
    style: 'currency',
  }).format(Number.isFinite(amount) ? amount : 0);
}
