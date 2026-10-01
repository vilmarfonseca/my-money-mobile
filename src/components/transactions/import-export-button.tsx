import {
  ArrowDownUp,
  CalendarDays,
  Check,
  CreditCard,
  Download,
  FileSpreadsheet,
  Landmark,
  List,
  Upload,
  type LucideIcon,
} from 'lucide-react-native';
import { useState, type ReactNode } from 'react';
import { ActivityIndicator, Pressable, ScrollView, View } from 'react-native';

import { callApi } from '@/api/client';
import { useApiAction, useApiQuery } from '@/api/hooks';
import { useEntitlements } from '@/components/billing/entitlements-provider';
import {
  parseTransactionFile,
  pickTransactionFile,
  writeRowsToFile,
  writeTextToFile,
} from '@/components/transactions/transaction-file';
import { Button, IconButton, type ButtonProps } from '@/components/ui/button';
import { CurrencyInput, currencyDigitsToAmount } from '@/components/ui/currency-input';
import { DateInput } from '@/components/ui/date-input';
import { Modal } from '@/components/ui/modal';
import { SegmentedControl, type SegmentedControlOption } from '@/components/ui/segmented-control';
import { Eyebrow, Text } from '@/components/ui/text';
import { toast } from '@/components/ui/toast';
import { useI18n } from '@/lib/i18n/provider';
import {
  analyzeImportRows,
  buildExampleOfxRows,
  buildExampleRows,
  exampleFileName,
  exportFileName,
  localizeExportRows,
  maxImportRows,
  recurrenceLabel,
  transactionFileHeaders,
  type ImportAnalysis,
  type ImportRowIssue,
  type TransactionFileFormat,
} from '@/lib/transactions/import-export';
import type { ImportRowInput } from '@/lib/transactions/import-export-actions';
import { buildOfxContent, ofxCurrencyForLocale } from '@/lib/transactions/ofx';
import { useTheme } from '@/theme/theme-provider';
import { radius } from '@/theme/tokens';

type ImportExportMode = 'import' | 'export';
type ZeroAmountChoice = 'skip' | 'keep';
/** The one thing the modal is doing; everything else waits for it. */
type Busy = 'file' | 'example' | 'import' | 'export';

type ImportSummary = {
  imported: number;
  createdAccounts: number;
  errors: { row: number; message: string }[];
};

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/** Width of the amount and date fields beside a flagged row (`w-40`). */
const FILL_FIELD_WIDTH = 160;

/** The toast has one line of text: a sonner `description` goes on a second. */
function withDescription(title: string, description?: string) {
  return description ? `${title}\n${description}` : title;
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

export function ImportExportButton({
  shape,
  size,
  style,
}: Pick<ButtonProps, 'size' | 'shape' | 'style'>) {
  const { messages } = useI18n();
  // CSV import/export is a Plus+ feature; hide the entry point below that.
  const { features } = useEntitlements();
  const [open, setOpen] = useState(false);
  // Each opening is a fresh modal: nothing of the last file or summary stays.
  const [session, setSession] = useState(0);

  if (!features.csvImportExport) {
    return null;
  }

  return (
    <>
      <Button
        variant="outline"
        size={size}
        shape={shape}
        style={style}
        label={messages.importExport.buttonLabel}
        icon={(props) => <ArrowDownUp {...props} />}
        onPress={() => {
          setSession((current) => current + 1);
          setOpen(true);
        }}
      />
      <ImportExportModal key={session} open={open} onOpenChange={setOpen} />
    </>
  );
}

function ImportExportModal({
  onOpenChange,
  open,
}: {
  onOpenChange: (open: boolean) => void;
  open: boolean;
}) {
  const { locale, messages } = useI18n();
  const { colors } = useTheme();
  const [mode, setMode] = useState<ImportExportMode>('import');
  const [fileName, setFileName] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<ImportAnalysis | null>(null);
  const [zeroChoice, setZeroChoice] = useState<ZeroAmountChoice>('skip');
  const [dateFills, setDateFills] = useState<Record<number, string>>({});
  /** Currency digits keyed by row index, for rows the file left without one. */
  const [amountFills, setAmountFills] = useState<Record<number, string>>({});
  const [exportFormat, setExportFormat] = useState<TransactionFileFormat>('csv');
  const [summary, setSummary] = useState<ImportSummary | null>(null);
  const [busy, setBusy] = useState<Busy | null>(null);
  const importTransactions = useApiAction('transactions.import');

  const t = messages.importExport;
  const isImport = mode === 'import';
  const pending = busy !== null;

  // The "What's included" counts load the first time the export tab is shown
  // while the modal is open.
  const exportSummary = useApiQuery('transactions.exportSummary', [], {
    enabled: open && !isImport,
  }).data;

  const modeOptions: SegmentedControlOption<ImportExportMode>[] = [
    { label: t.importTab, value: 'import' },
    { label: t.exportTab, value: 'export' },
  ];
  const formatOptions: SegmentedControlOption<TransactionFileFormat>[] = [
    { label: 'CSV', value: 'csv' },
    { label: 'XLSX', value: 'xlsx' },
    { label: 'OFX', value: 'ofx' },
  ];
  const zeroOptions: SegmentedControlOption<ZeroAmountChoice>[] = [
    { label: t.zeroAmountSkip, value: 'skip' },
    { label: t.zeroAmountKeep, value: 'keep' },
  ];

  const missingAmountIndexes = new Set(analysis?.missingAmountRows.map((r) => r.index));
  /** A filled-in amount rescues the row whatever the skip/keep choice is. */
  const filledAmount = (index: number) => {
    const digits = amountFills[index];
    if (!digits) return null;
    const amount = currencyDigitsToAmount(digits);
    return amount > 0 ? amount : null;
  };

  // Date pickers are only worth showing for rows that would otherwise import:
  // not the ones already being dropped for having a zero amount.
  const dateRowsInScope = (analysis?.missingDateRows ?? []).filter(
    (r) =>
      !missingAmountIndexes.has(r.index) || zeroChoice === 'keep' || filledAmount(r.index) !== null,
  );

  // Final rows to send: apply the zero-amount choice and any dates the user
  // filled in, and drop rows still missing a required date.
  const importRows: ImportRowInput[] = [];
  analysis?.inputs.forEach((input, index) => {
    const amount = filledAmount(index);
    if (missingAmountIndexes.has(index) && amount === null && zeroChoice === 'skip') {
      return;
    }
    const date = dateFills[index] ?? input.date ?? '';
    if (!ISO_DATE.test(date)) return;
    importRows.push({
      input: {
        ...input,
        amount: amount ?? input.amount,
        date,
        recurringStartDate: ISO_DATE.test(input.recurringStartDate)
          ? input.recurringStartDate
          : date,
      },
      row: index + 2,
    });
  });

  const handlePickFile = async () => {
    if (pending) return;
    setBusy('file');
    try {
      const file = await pickTransactionFile();
      // Backing out of the picker keeps whatever was chosen before.
      if (!file) return;

      setSummary(null);
      setDateFills({});
      setAmountFills({});
      setZeroChoice('skip');
      setFileName(file.name);
      setAnalysis(null);

      const inputs = await parseTransactionFile(file);
      if (inputs.length === 0) {
        toast.error(t.noRows);
        return;
      }
      setAnalysis(analyzeImportRows(inputs));
    } catch {
      toast.error(t.invalidFile);
    } finally {
      setBusy(null);
    }
  };

  // The web builds its example files in the browser and downloads them; here
  // the same rows are built on the device and go out through the share sheet.
  const handleDownloadExample = async (format: 'csv' | 'ofx') => {
    if (pending) return;
    setBusy('example');
    try {
      if (format === 'ofx') {
        await writeTextToFile(
          buildOfxContent(buildExampleOfxRows(locale), { currency: ofxCurrencyForLocale(locale) }),
          `${exampleFileName[locale]}.ofx`,
        );
      } else {
        await writeRowsToFile(
          buildExampleRows(locale),
          transactionFileHeaders(locale),
          exampleFileName[locale],
          'csv',
        );
      }
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setBusy(null);
    }
  };

  const handleImport = async () => {
    if (pending || importRows.length === 0) return;
    setBusy('import');
    try {
      const result = await importTransactions.run(importRows, {
        allowZeroAmount: zeroChoice === 'keep',
      });
      if (!result.ok) {
        toast.error(withDescription(t.importFailed, result.message));
        return;
      }

      setSummary({
        imported: result.imported,
        createdAccounts: result.createdAccounts,
        errors: result.errors,
      });

      if (result.imported > 0) {
        toast.success(
          withDescription(
            t.importedCount(result.imported),
            result.createdAccounts > 0 ? t.accountsCreated(result.createdAccounts) : undefined,
          ),
        );
      }
      if (result.errors.length === 0 && result.imported > 0) {
        // A clean import has nothing left to review, so the modal gets out of
        // the way; the toast above already reports what landed. Rows that
        // failed keep it open, since the summary below lists them.
        onOpenChange(false);
      } else if (result.imported === 0) {
        toast.error(t.importFailed);
      }
    } catch (error) {
      toast.error(withDescription(t.importFailed, errorMessage(error)));
    } finally {
      setBusy(null);
    }
  };

  const handleExport = async () => {
    if (pending) return;
    setBusy('export');
    try {
      const rows = await callApi('transactions.exportRows');
      if (rows.length === 0) {
        toast.error(t.nothingToExport);
        return;
      }

      if (exportFormat === 'ofx') {
        await writeTextToFile(
          buildOfxContent(rows, { currency: ofxCurrencyForLocale(locale) }),
          `${exportFileName[locale]}.ofx`,
        );
      } else {
        await writeRowsToFile(
          localizeExportRows(rows, locale),
          transactionFileHeaders(locale),
          exportFileName[locale],
          exportFormat,
        );
      }
      toast.success(t.exported);
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setBusy(null);
    }
  };

  // Fields and toggle on a tinted review card sit on a lighter wash of it.
  const fillFieldStyle = { width: FILL_FIELD_WIDTH, backgroundColor: colors.controlHover };

  const hasReview =
    analysis !== null &&
    (analysis.missingAmountRows.length > 0 ||
      dateRowsInScope.length > 0 ||
      analysis.recurringSeries.length > 0);

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={t.title}
      description={isImport ? t.importDescription : t.exportDescription}
      headerAction={
        <IconButton
          variant="action"
          accessibilityLabel={isImport ? t.importAction : t.exportAction}
          icon={(props) => <Check {...props} />}
          disabled={pending || (isImport && importRows.length === 0)}
          onPress={isImport ? handleImport : handleExport}
        />
      }
      footer={
        <>
          <Button
            variant="outline"
            size="xl"
            style={{ flexBasis: '33%' }}
            label={messages.common.cancel}
            onPress={() => onOpenChange(false)}
          />
          {isImport ? (
            <Button
              size="xl"
              style={{ flex: 1 }}
              icon={(props) => <Download {...props} />}
              label={busy === 'import' ? `${t.importing}…` : t.importAction}
              loading={busy === 'import'}
              disabled={importRows.length === 0 || pending}
              onPress={handleImport}
            />
          ) : (
            <Button
              size="xl"
              style={{ flex: 1 }}
              icon={(props) => <Upload {...props} />}
              label={busy === 'export' ? `${t.exporting}…` : t.exportAction}
              loading={busy === 'export'}
              disabled={pending}
              onPress={handleExport}
            />
          )}
        </>
      }>
      <SegmentedControl
        accessibilityLabel={t.title}
        size="xl"
        options={modeOptions}
        value={mode}
        onValueChange={(nextMode) => {
          setMode(nextMode);
          setSummary(null);
        }}
      />

      {isImport ? (
        <View style={{ marginTop: 4 }}>
          <FileTile
            fileName={fileName}
            hint={t.dropHint(maxImportRows)}
            placeholder={t.chooseFile}
            reading={busy === 'file' && fileName !== null && analysis === null}
            disabled={pending}
            onPress={handlePickFile}
          />

          <View
            style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              alignItems: 'center',
              columnGap: 20,
              rowGap: 8,
              marginTop: 16,
            }}>
            <ExampleLink
              label={t.downloadExample}
              disabled={pending}
              onPress={() => handleDownloadExample('csv')}
            />
            <ExampleLink
              label={t.downloadExampleOfx}
              disabled={pending}
              onPress={() => handleDownloadExample('ofx')}
            />
          </View>

          {hasReview && analysis ? (
            <View style={{ gap: 12, marginTop: 20 }}>
              <Eyebrow size="2xs">{t.reviewTitle}</Eyebrow>

              {analysis.recurringSeries.length > 0 ? (
                <ReviewCard
                  tone="accent"
                  title={t.recurringTitle(analysis.recurringSeries.length)}
                  hint={t.recurringHint}>
                  <View style={{ gap: 4, marginTop: 8 }}>
                    {analysis.recurringSeries.slice(0, 4).map((series) => (
                      <Text key={`${series.name}-${series.frequency}`} size="xs" color="ink2">
                        {t.recurringSeries(
                          series.name,
                          recurrenceLabel(series.frequency, locale),
                          series.count,
                        )}
                      </Text>
                    ))}
                  </View>
                </ReviewCard>
              ) : null}

              {analysis.missingAmountRows.length > 0 ? (
                <ReviewCard
                  tone="warning"
                  title={t.zeroAmountTitle(analysis.missingAmountRows.length)}
                  hint={t.missingAmountHint}>
                  <View style={{ gap: 10, marginTop: 12 }}>
                    {analysis.missingAmountRows.map((r) => (
                      <FillRow key={r.index} issue={r}>
                        <CurrencyInput
                          accessibilityLabel={r.name}
                          containerStyle={fillFieldStyle}
                          value={amountFills[r.index] ?? ''}
                          onValueChange={(digits) =>
                            setAmountFills((prev) => ({ ...prev, [r.index]: digits }))
                          }
                        />
                      </FillRow>
                    ))}
                  </View>
                  {/* Whatever is still blank falls to this choice. */}
                  <SegmentedControl
                    accessibilityLabel={t.zeroAmountTitle(analysis.missingAmountRows.length)}
                    size="xl"
                    style={{ marginTop: 12, backgroundColor: colors.controlHover }}
                    options={zeroOptions}
                    value={zeroChoice}
                    onValueChange={setZeroChoice}
                  />
                </ReviewCard>
              ) : null}

              {dateRowsInScope.length > 0 ? (
                <ReviewCard
                  tone="warning"
                  title={t.missingDateTitle(dateRowsInScope.length)}
                  hint={t.missingDateHint}>
                  <View style={{ gap: 10, marginTop: 12 }}>
                    {dateRowsInScope.map((r) => (
                      <FillRow key={r.index} issue={r}>
                        <DateInput
                          accessibilityLabel={r.name}
                          style={fillFieldStyle}
                          value={dateFills[r.index] ?? ''}
                          onChange={(iso) => setDateFills((prev) => ({ ...prev, [r.index]: iso }))}
                        />
                      </FillRow>
                    ))}
                  </View>
                </ReviewCard>
              ) : null}

              <Text size="xs" color="ink3">
                {importRows.length === 0 ? t.nothingToImport : t.willImport(importRows.length)}
              </Text>
            </View>
          ) : null}

          {summary && summary.errors.length > 0 ? (
            <RowErrors
              title={t.rowErrorsTitle(summary.errors.length)}
              errors={summary.errors}
              rowLabel={t.rowLabel}
            />
          ) : null}
        </View>
      ) : (
        <View style={{ gap: 16, marginTop: 4 }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 16,
              paddingHorizontal: 2,
            }}>
            <Text font="sansMedium" size="sm">
              {t.format}
            </Text>
            <SegmentedControl
              accessibilityLabel={t.format}
              size="lg"
              style={{ width: 212 }}
              options={formatOptions}
              value={exportFormat}
              onValueChange={setExportFormat}
            />
          </View>
          <ExportSummaryCard title={t.whatsIncluded}>
            <ExportSummaryRow
              icon={Landmark}
              label={t.bankAccounts}
              value={exportSummary ? t.accountsCount(exportSummary.accounts) : '—'}
            />
            <ExportSummaryRow
              icon={CreditCard}
              label={t.creditCards}
              value={exportSummary ? t.cardsCount(exportSummary.cards) : '—'}
            />
            <ExportSummaryRow
              icon={List}
              label={t.transactionsLabel}
              value={exportSummary ? t.rowsCount(exportSummary.transactions) : '—'}
            />
            <ExportSummaryRow icon={CalendarDays} label={t.dateRange} value={t.allHistory} />
          </ExportSummaryCard>
        </View>
      )}
    </Modal>
  );
}

/** The dashed "choose a file" tile; solid once a file is picked. */
function FileTile({
  disabled,
  fileName,
  hint,
  onPress,
  placeholder,
  reading,
}: {
  disabled: boolean;
  fileName: string | null;
  hint: string;
  onPress: () => void;
  placeholder: string;
  /** The picked file is still being parsed. */
  reading: boolean;
}) {
  const { colors } = useTheme();
  const picked = fileName !== null;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={fileName ?? placeholder}
      accessibilityHint={hint}
      accessibilityState={{ disabled, busy: reading }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => ({
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingHorizontal: 20,
        paddingVertical: 32,
        borderRadius: radius['2xl'],
        borderWidth: 1,
        borderStyle: picked ? 'solid' : 'dashed',
        borderColor: picked ? colors.line : colors.controlBorder,
        backgroundColor: picked ? colors.surface1 : pressed ? colors.controlHover : colors.control,
      })}>
      <View
        style={{
          width: 44,
          height: 44,
          marginBottom: 4,
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: radius.xl,
          backgroundColor: picked ? colors.accentSoft : colors.surface2,
        }}>
        {reading ? (
          <ActivityIndicator size="small" color={colors.accentSoftFg} />
        ) : (
          <FileSpreadsheet size={20} color={picked ? colors.accentSoftFg : colors.ink2} />
        )}
      </View>
      <Text font="display" size="lg" align="center" numberOfLines={1} style={{ maxWidth: '100%' }}>
        {fileName ?? placeholder}
      </Text>
      <Text size="xs" color="ink3" align="center">
        {hint}
      </Text>
    </Pressable>
  );
}

function ExampleLink({
  disabled,
  label,
  onPress,
}: {
  disabled: boolean;
  label: string;
  onPress: () => void;
}) {
  const { colors } = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      hitSlop={8}
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        opacity: pressed ? 0.6 : 1,
      })}>
      <Download size={16} color={colors.ink1} />
      <Text font="sansMedium" size="sm" style={{ textDecorationLine: 'underline' }}>
        {label}
      </Text>
    </Pressable>
  );
}

/** A tinted card of the "Before importing" review. */
function ReviewCard({
  children,
  hint,
  title,
  tone,
}: {
  children: ReactNode;
  hint: string;
  title: string;
  tone: 'accent' | 'warning';
}) {
  const { colors } = useTheme();

  return (
    <View
      style={{
        padding: 16,
        borderRadius: radius['2xl'],
        backgroundColor: tone === 'accent' ? colors.accentSoft : colors.warningSoft,
      }}>
      <Text font="display" size="lg" style={{ lineHeight: 22 }}>
        {title}
      </Text>
      <Text size="xs" color="ink3" style={{ marginTop: 6, lineHeight: 20 }}>
        {hint}
      </Text>
      {children}
    </View>
  );
}

/** A flagged row: its name, and the field that fills in what it lacks. */
function FillRow({ children, issue }: { children: ReactNode; issue: ImportRowIssue }) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
      }}>
      <Text font="sansMedium" size="sm" numberOfLines={1} style={{ flex: 1 }}>
        {issue.name}
      </Text>
      {children}
    </View>
  );
}

/** Rows the server refused, listed after an import that kept the modal open. */
function RowErrors({
  errors,
  rowLabel,
  title,
}: {
  errors: ImportSummary['errors'];
  rowLabel: (row: number) => string;
  title: string;
}) {
  const { colors } = useTheme();

  return (
    <View
      style={{
        marginTop: 16,
        padding: 12,
        borderRadius: radius.lg,
        backgroundColor: colors.negativeSoft,
      }}>
      <Text font="sansMedium" size="xs" color="negativeFg">
        {title}
      </Text>
      <ScrollView
        nestedScrollEnabled
        style={{ maxHeight: 128, marginTop: 6 }}
        contentContainerStyle={{ gap: 4 }}>
        {errors.map((error) => (
          <Text key={`${error.row}-${error.message}`} size="xs" color="negativeFg">
            {rowLabel(error.row)}: {error.message}
          </Text>
        ))}
      </ScrollView>
    </View>
  );
}

function ExportSummaryCard({ children, title }: { children: ReactNode; title: string }) {
  const { colors } = useTheme();

  return (
    <View
      style={{
        padding: 16,
        borderRadius: radius['2xl'],
        borderWidth: 1,
        borderColor: colors.line,
        backgroundColor: colors.surface1,
      }}>
      <Eyebrow size="2xs">{title}</Eyebrow>
      <View style={{ gap: 10, marginTop: 12 }}>{children}</View>
    </View>
  );
}

function ExportSummaryRow({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  const { colors } = useTheme();

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
      }}>
      <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <Icon size={16} color={colors.ink3} />
        <Text size="sm" color="ink2" numberOfLines={1} style={{ flexShrink: 1 }}>
          {label}
        </Text>
      </View>
      <Text font="sansMedium" size="sm" style={{ fontVariant: ['tabular-nums'] }}>
        {value}
      </Text>
    </View>
  );
}
