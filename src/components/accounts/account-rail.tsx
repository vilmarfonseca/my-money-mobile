import { LinearGradient } from 'expo-linear-gradient';
import { ArrowUpDown, Check, Landmark, Settings } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { DashedLine } from '@/components/accounts/dashed-line';
import { ManageAccountModal } from '@/components/accounts/manage-account-modal';
import { TransferModal } from '@/components/accounts/transfer-modal';
import { IconButton } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { Text } from '@/components/ui/text';
import { interestRateLabel, type Bank, type BankTone } from '@/lib/accounts/accounts-data';
import { useI18n } from '@/lib/i18n/provider';
import { useTheme } from '@/theme/theme-provider';
import { palette, radius, shadows, type ThemeColors } from '@/theme/tokens';

/** `bg-linear-to-br` stops of the bank tile, per tone. */
function bankTileGradient(tone: BankTone, colors: ThemeColors): [string, string] {
  switch (tone) {
    case 'coral':
      return [palette.coral400, palette.coral600];
    case 'ink':
      return [colors.ink2, colors.ink1];
    case 'sage':
      return [palette.sage500, palette.sage700];
    default:
      return [palette.plum500, palette.plum800];
  }
}

type AccountRailProps = {
  banks: Bank[];
  /** Interest posted this month, keyed by account id (for savings rows). */
  interestByAccount: Record<string, number>;
  onToggleBank: (bankId: string) => void;
  selectedBankIds: string[];
};

export function AccountRail({
  banks,
  interestByAccount,
  onToggleBank,
  selectedBankIds,
}: AccountRailProps) {
  const { messages } = useI18n();
  // The id stays set while a modal slides out, so its content does not vanish
  // mid-animation; `open` is tracked on its own.
  const [transferFromAccountId, setTransferFromAccountId] = useState<string | null>(null);
  const [transferOpen, setTransferOpen] = useState(false);
  const [manageBankId, setManageBankId] = useState<string | null>(null);
  const [manageOpen, setManageOpen] = useState(false);
  const manageBank = banks.find((bank) => bank.id === manageBankId) ?? null;
  const hasSelection = selectedBankIds.length > 0;
  const allAccounts = banks.flatMap((bank) => bank.accounts);

  return (
    <View style={{ marginBottom: 24 }}>
      <Text
        accessibilityRole="header"
        font="display"
        size="2xl"
        tight
        style={{ marginBottom: 12, paddingHorizontal: 6 }}>
        {messages.accountsPage.yourAccounts}
      </Text>
      <View style={{ gap: 14 }}>
        {banks.map((bank) => (
          <BankRow
            key={bank.id}
            bank={bank}
            interestByAccount={interestByAccount}
            muted={hasSelection && !selectedBankIds.includes(bank.id)}
            onManage={() => {
              setManageBankId(bank.id);
              setManageOpen(true);
            }}
            onToggle={() => onToggleBank(bank.id)}
            onTransfer={() => {
              const fromId = bank.checking?.id ?? bank.savings?.id ?? null;
              if (!fromId) return;
              setTransferFromAccountId(fromId);
              setTransferOpen(true);
            }}
            selected={selectedBankIds.includes(bank.id)}
          />
        ))}
      </View>

      <TransferModal
        accounts={allAccounts}
        initialFromAccountId={transferFromAccountId}
        open={transferOpen}
        onOpenChange={setTransferOpen}
      />

      <ManageAccountModal
        bank={manageBank}
        open={manageOpen && manageBank !== null}
        onOpenChange={setManageOpen}
      />
    </View>
  );
}

function BankRow({
  bank,
  interestByAccount,
  muted,
  onManage,
  onToggle,
  onTransfer,
  selected,
}: {
  bank: Bank;
  interestByAccount: Record<string, number>;
  muted: boolean;
  onManage: () => void;
  onToggle: () => void;
  onTransfer: () => void;
  selected: boolean;
}) {
  const { formatCurrency, formatSignedCurrency, locale, messages, splitCurrencyParts } = useI18n();
  const { colors } = useTheme();
  const savingsName =
    locale === 'pt-BR' && bank.savings?.savingsLabel === 'cofrinho'
      ? messages.accountsPage.cofrinho
      : messages.accountsPage.savings;
  const savingsColumnName =
    bank.savingsAccounts.length > 1 ? `${savingsName} ×${bank.savingsAccounts.length}` : savingsName;
  // A handful of savings accounts each get their own tile; past that they
  // collapse back into one merged figure.
  const SAVINGS_COLUMN_LIMIT = 3;
  const splitSavings =
    bank.savingsAccounts.length > 0 && bank.savingsAccounts.length <= SAVINGS_COLUMN_LIMIT;
  const savingsColumns = splitSavings
    ? bank.savingsAccounts.map((account) => ({
        id: account.id,
        amount: account.balance,
        // Kind first, so a poupança and a cofrinho are told apart at a glance.
        name:
          locale === 'pt-BR' && account.savingsLabel === 'cofrinho'
            ? messages.accountsPage.cofrinho
            : messages.accountsPage.savings,
        rate: interestRateLabel(account, locale),
        interest: interestByAccount[account.id] ?? 0,
      }))
    : [];
  // Rates only fit while a single savings tile has the label to itself.
  const showColumnRates = savingsColumns.length === 1;
  const subtitle = bank.checking
    ? `${messages.accountsPage.checking} · ${savingsName}`
    : messages.accountsPage.savingsOnly;
  // With more than one savings account the merged tile speaks for all of them:
  // a combined balance and interest, and a rate only while they agree on one.
  const savingsTotal = bank.savingsAccounts.reduce((sum, account) => sum + account.balance, 0);
  const savingsRate =
    bank.savingsAccounts.length === 1 && bank.savings
      ? interestRateLabel(bank.savings, locale)
      : null;
  const savingsInterest = bank.savingsAccounts.reduce(
    (sum, account) => sum + (interestByAccount[account.id] ?? 0),
    0,
  );
  const total = bank.accounts.reduce((sum, account) => sum + account.balance, 0);
  const { whole, decimal, cents } = splitCurrencyParts(total);

  const interestNote = (interest: number) =>
    interest > 0 ? messages.accountsPage.interestEarned(formatSignedCurrency(interest)) : null;

  // Phones stack the accounts two per row, each as a soft tile.
  const tiles: BankColumnProps[] = [];
  if (bank.checking) {
    tiles.push({
      id: bank.checking.id,
      amount: formatCurrency(bank.checking.balance),
      dotColor: palette.plum500,
      label: messages.accountsPage.checking,
    });
  }
  if (splitSavings) {
    for (const column of savingsColumns) {
      tiles.push({
        id: column.id,
        amount: formatCurrency(column.amount),
        dotColor: palette.sage500,
        label: column.rate && showColumnRates ? `${column.name} · ${column.rate}` : column.name,
        note: interestNote(column.interest),
      });
    }
  } else if (bank.savings) {
    // Past the tile limit the savings read as one line: their combined
    // balance, with the count so the total is not mistaken for one account.
    tiles.push({
      id: 'savings',
      amount: formatCurrency(savingsTotal),
      dotColor: palette.sage500,
      label: savingsRate ? `${savingsColumnName} · ${savingsRate}` : savingsColumnName,
      note: interestNote(savingsInterest),
    });
  }
  const tileRows: BankColumnProps[][] = [];
  for (let index = 0; index < tiles.length; index += 2) {
    tileRows.push(tiles.slice(index, index + 2));
  }

  const tileStyle = {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    overflow: 'hidden' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  };

  return (
    // The transfer and manage buttons are nested pressables: they take their
    // own touches, everything else on the card toggles the bank.
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onToggle}
      style={({ pressed }) => ({
        // The selection ring: a 2px ink border, with the padding making up
        // for the extra pixel so the content does not shift.
        padding: selected ? 19 : 20,
        borderRadius: radius.xl,
        borderWidth: selected ? 2 : 1,
        borderColor: selected ? colors.ink1 : colors.line,
        backgroundColor: colors.surface1,
        boxShadow: shadows.sm,
        opacity: muted ? 0.6 : pressed ? 0.9 : 1,
        gap: 24,
      })}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          // Room for the two round buttons pinned to the corner.
          paddingRight: 96,
          paddingTop: 4,
        }}>
        <View style={{ borderRadius: radius.md, boxShadow: shadows.md }}>
          {bank.color ? (
            // A custom hex icon color replaces the tone gradient.
            <View style={[tileStyle, { backgroundColor: bank.color }]}>
              <Landmark size={20} color="#ffffff" />
            </View>
          ) : (
            <LinearGradient
              colors={bankTileGradient(bank.tone, colors)}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={tileStyle}>
              <Landmark size={20} color="#ffffff" />
            </LinearGradient>
          )}
        </View>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text font="display" size="lg" numberOfLines={1} style={{ flexShrink: 1 }}>
              {bank.nickname ? `${bank.name} · ${bank.nickname}` : bank.name}
            </Text>
            {bank.isPrimary ? (
              <Chip
                tone="accent"
                label={messages.accountsPage.primaryBadge}
                style={{ alignSelf: 'center', height: 20, paddingHorizontal: 8 }}
              />
            ) : null}
          </View>
          <Text size="xs" color="ink3" style={{ marginTop: 4 }}>
            {subtitle}
          </Text>
        </View>
      </View>

      <View style={{ gap: 8 }}>
        {tileRows.map((row) => (
          <View key={row[0].id} style={{ flexDirection: 'row', gap: 10 }}>
            {row.map((tile) => (
              <BankColumn key={tile.id} {...tile} />
            ))}
            {/* Keeps a lone tile at half width, as in the web grid. */}
            {row.length === 1 ? <View style={{ flex: 1 }} /> : null}
          </View>
        ))}

        {/* The design's dashed baseline total row. */}
        <View style={{ marginTop: tileRows.length > 0 ? 4 : 0 }}>
          <DashedLine />
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'baseline',
              justifyContent: 'space-between',
              gap: 12,
              paddingTop: 14,
            }}>
            <Text font="sansMedium" size="2xs" color="ink3" uppercase tracking={1}>
              {messages.common.total}
            </Text>
            <Text font="display" size="2xl" tight numberOfLines={1}>
              {whole}
              <Text font="display" size="sm" color="ink3">
                {decimal}
                {cents}
              </Text>
            </Text>
          </View>
        </View>
      </View>

      <View style={{ position: 'absolute', top: 16, right: 16, flexDirection: 'row', gap: 8 }}>
        <IconButton
          variant="outline"
          size={36}
          accessibilityLabel={messages.accountsPage.transferFrom(bank.name)}
          icon={({ color }) => <ArrowUpDown size={16} color={color} />}
          onPress={onTransfer}
        />
        <IconButton
          variant="outline"
          size={36}
          accessibilityLabel={messages.accountsPage.manageAccount(bank.name)}
          icon={({ color }) => <Settings size={16} color={color} />}
          onPress={onManage}
        />
      </View>

      {selected ? (
        <View
          style={{
            position: 'absolute',
            top: -8,
            right: -8,
            width: 24,
            height: 24,
            borderRadius: 12,
            borderWidth: 2,
            borderColor: colors.canvas,
            backgroundColor: colors.ink1,
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: shadows.md,
          }}>
          <Check size={14} color={colors.canvas} />
        </View>
      ) : null}
    </Pressable>
  );
}

type BankColumnProps = {
  id: string;
  amount: string;
  dotColor: string;
  label: string;
  note?: string | null;
};

/** One account as a soft tile (Mobile Accounts design). */
function BankColumn({ amount, dotColor, label, note }: BankColumnProps) {
  const { colors } = useTheme();

  return (
    <View
      style={{
        flex: 1,
        padding: 12,
        borderRadius: radius.md,
        backgroundColor: colors.surface2,
      }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: dotColor }} />
        <Text
          font="sansMedium"
          size="2xs"
          color="ink3"
          uppercase
          tracking={1}
          numberOfLines={1}
          style={{ flex: 1 }}>
          {label}
        </Text>
      </View>
      <Text
        font="display"
        size="xl"
        tight
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.7}
        style={{ marginTop: 8 }}>
        {amount}
      </Text>
      {note ? (
        <Text size="xs" color="positiveFg" style={{ marginTop: 6 }}>
          {note}
        </Text>
      ) : null}
    </View>
  );
}
