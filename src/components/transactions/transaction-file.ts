import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

import {
  rowsToImportInputs,
  type SpreadsheetFileFormat,
  type TransactionFileFormat,
} from '@/lib/transactions/import-export';
import { ofxToRows } from '@/lib/transactions/ofx';

/*
 * Native counterpart of the web app's `lib/transactions/parse-transaction-file.ts`:
 * the browser's file input becomes the system document picker, and a download
 * becomes a file in the cache directory handed to the share sheet ("Save to
 * Files", mail, another app).
 */

/** A file chosen in the system picker, already copied into the app's cache. */
export type PickedTransactionFile = {
  name: string;
  uri: string;
  mimeType?: string;
};

const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

const mimeTypes: Record<TransactionFileFormat, string> = {
  csv: 'text/csv',
  xlsx: XLSX_MIME,
  ofx: 'application/x-ofx',
};

/** Uniform Type Identifiers for the iOS share sheet; OFX has none of its own. */
const utis: Record<TransactionFileFormat, string> = {
  csv: 'public.comma-separated-values-text',
  xlsx: 'org.openxmlformats.spreadsheetml.sheet',
  ofx: 'public.data',
};

/** The format a picked file is in, by extension first and MIME type second. */
function fileFormat(file: Pick<PickedTransactionFile, 'name' | 'mimeType'>): TransactionFileFormat | null {
  const mimeType = file.mimeType ?? '';
  if (/\.ofx$/i.test(file.name) || /ofx/i.test(mimeType)) return 'ofx';
  if (/\.csv$/i.test(file.name) || /^text\/(csv|comma-separated-values)$/i.test(mimeType)) {
    return 'csv';
  }
  if (/\.xlsx$/i.test(file.name) || mimeType === XLSX_MIME) return 'xlsx';
  return null;
}

/**
 * Opens the system document picker. Resolves to `null` when the user cancels
 * and throws for anything that is not a CSV, XLSX or OFX file.
 *
 * The picker is not narrowed by type: OFX has no registered type on either
 * platform, so a type filter would grey those files out. The extension is
 * checked here instead, as the web input's `accept=".csv,.xlsx,.ofx"` does.
 */
export async function pickTransactionFile(): Promise<PickedTransactionFile | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: '*/*',
    copyToCacheDirectory: true,
    multiple: false,
  });
  if (result.canceled) return null;

  const asset = result.assets[0];
  if (!asset) return null;
  if (!fileFormat(asset)) throw new Error('Unsupported file type');

  return { name: asset.name, uri: asset.uri, mimeType: asset.mimeType };
}

/** Parse a picked CSV/XLSX/OFX transactions file into import inputs. */
export async function parseTransactionFile(file: PickedTransactionFile) {
  const bytes = await new File(file.uri).bytes();
  const format = fileFormat(file);

  if (format === 'ofx') {
    return rowsToImportInputs(ofxToRows(decodeOfxBytes(bytes)));
  }

  const XLSX = await import('xlsx');
  // CSV bytes must be decoded as UTF-8 explicitly; SheetJS otherwise falls
  // back to Latin-1 and mangles accented text. XLSX carries its own encoding.
  const workbook =
    format === 'csv'
      ? XLSX.read(new TextDecoder('utf-8').decode(bytes), { type: 'string', cellDates: true })
      : XLSX.read(bytes, { type: 'array', cellDates: true });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' });
  return rowsToImportInputs(rawRows);
}

/**
 * OFX 1.x files often declare CHARSET:1252 (Latin-1) instead of UTF-8; decode
 * per the header, and fall back to windows-1252 when UTF-8 decoding mangles.
 */
function decodeOfxBytes(bytes: Uint8Array): string {
  const utf8 = new TextDecoder('utf-8').decode(bytes);
  const header = utf8.slice(0, 400);
  if (/CHARSET:\s*1252/i.test(header) || utf8.includes('�')) {
    return decodeWindows1252(bytes);
  }
  return utf8;
}

/** Code points of bytes 0x80-0x9F, the range where windows-1252 leaves Latin-1. */
const WINDOWS_1252_HIGH = [
  0x20ac, 0x0081, 0x201a, 0x0192, 0x201e, 0x2026, 0x2020, 0x2021, 0x02c6, 0x2030, 0x0160, 0x2039,
  0x0152, 0x008d, 0x017d, 0x008f, 0x0090, 0x2018, 0x2019, 0x201c, 0x201d, 0x2022, 0x2013, 0x2014,
  0x02dc, 0x2122, 0x0161, 0x203a, 0x0153, 0x009d, 0x017e, 0x0178,
];

/** The runtime's `TextDecoder` only knows UTF-8, so this one is by hand. */
function decodeWindows1252(bytes: Uint8Array): string {
  const chunkSize = 8192;
  let text = '';
  for (let start = 0; start < bytes.length; start += chunkSize) {
    const codes = Array.from(bytes.subarray(start, start + chunkSize), (byte) =>
      byte >= 0x80 && byte <= 0x9f ? WINDOWS_1252_HIGH[byte - 0x80] : byte,
    );
    text += String.fromCharCode(...codes);
  }
  return text;
}

/** Write rows to a CSV/XLSX file and offer it through the share sheet. */
export async function writeRowsToFile(
  rows: Record<string, string | number>[],
  headers: string[],
  fileName: string,
  format: SpreadsheetFileFormat,
) {
  const XLSX = await import('xlsx');
  const worksheet = XLSX.utils.json_to_sheet(rows, { header: headers });
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Transactions');
  // Base64 for both: it is how binary XLSX reaches the file, and SheetJS adds
  // the UTF-8 byte order mark to CSV in this mode, as its browser download does.
  const base64: string = XLSX.write(workbook, { type: 'base64', bookType: format });
  await shareFile(`${fileName}.${format}`, base64, 'base64', format);
}

/** Offer a plain-text file through the share sheet (used for OFX). */
export async function writeTextToFile(content: string, fileName: string) {
  await shareFile(fileName, content, 'utf8', 'ofx');
}

async function shareFile(
  name: string,
  content: string,
  encoding: 'utf8' | 'base64',
  format: TransactionFileFormat,
) {
  if (!(await Sharing.isAvailableAsync())) {
    throw new Error('Sharing is not available on this device');
  }

  const file = new File(Paths.cache, name);
  file.create({ overwrite: true });
  file.write(content, { encoding });

  await Sharing.shareAsync(file.uri, {
    dialogTitle: name,
    mimeType: mimeTypes[format],
    UTI: utis[format],
  });
}
