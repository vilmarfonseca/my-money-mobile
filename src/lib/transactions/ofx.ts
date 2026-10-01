// Synced from my-money-v2 (src/lib/transactions/ofx.ts). Do not edit here: change it
// in the web repo and run `npm run sync:web`.
import {
  fileDateValue,
  parseAmountCell,
} from "@/lib/transactions/import-export";

/**
 * Minimal OFX (Open Financial Exchange) reader/writer. Handles both OFX 1.x
 * (SGML, leaf tags without closing tags) and OFX 2.x (XML) bank and credit
 * card statements. OFX carries fewer fields than the CSV/XLSX contract —
 * date, amount, name, memo, and the source account — so imported rows lean
 * on the same defaults as a spreadsheet with blank cells.
 */

/** The subset of columns an OFX transaction can fill, keyed like en-US headers. */
export type OfxParsedRow = Record<string, string | number>;

/** What an exported OFX transaction needs from a canonical export row. */
export type OfxExportRow = {
  type: string | number;
  name: string | number;
  description: string | number;
  amount: string | number;
  date: string | number;
};

/* -------------------------------------------------------------------------- */
/* Import                                                                     */
/* -------------------------------------------------------------------------- */

/** OFX ACCTTYPE values that read as a savings balance. */
const SAVINGS_ACCOUNT_TYPES = new Set(["SAVINGS"]);

/**
 * Parses an OFX file into sheet-like rows keyed by the canonical en-US
 * headers, ready for `rowsToImportInputs`. The sign of TRNAMT decides the
 * transaction type: negative amounts import as expenses, positive as income.
 */
export function ofxToRows(text: string): OfxParsedRow[] {
  const start = text.search(/<OFX>/i);
  const body = start >= 0 ? text.slice(start) : text;

  // Bank statements live in STMTRS, credit card statements in CCSTMTRS.
  // Files without either wrapper still get their STMTTRN blocks read.
  const statements = [
    ...aggregateBlocks(body, "STMTRS").map((content) => ({
      content,
      isCard: false,
    })),
    ...aggregateBlocks(body, "CCSTMTRS").map((content) => ({
      content,
      isCard: true,
    })),
  ];
  const scopes = statements.length
    ? statements
    : [{ content: body, isCard: false }];

  const rows: OfxParsedRow[] = [];

  for (const scope of scopes) {
    const accountBlock =
      aggregateBlocks(
        scope.content,
        scope.isCard ? "CCACCTFROM" : "BANKACCTFROM",
      )[0] ?? "";
    const accountId = decodeOfxText(leafValue(accountBlock, "ACCTID"));
    const accountType = leafValue(accountBlock, "ACCTTYPE").toUpperCase();
    const balance = scope.isCard
      ? "credit card"
      : accountId
        ? SAVINGS_ACCOUNT_TYPES.has(accountType)
          ? "savings"
          : "checking"
        : "";

    for (const transaction of transactionBlocks(scope.content)) {
      const amount = parseAmountCell(leafValue(transaction, "TRNAMT"));
      const name = decodeOfxText(leafValue(transaction, "NAME"));
      const memo = decodeOfxText(leafValue(transaction, "MEMO"));

      rows.push({
        type: amount < 0 ? "expense" : "income",
        name: name || memo,
        description: name ? memo : "",
        amount: Number.isFinite(amount) ? Math.abs(amount) : "",
        date: ofxDateValue(leafValue(transaction, "DTPOSTED")),
        account: scope.isCard ? "" : accountId,
        credit_card: scope.isCard ? accountId : "",
        payment_method: balance,
      });
    }
  }

  return rows;
}

/** Contents of every `<TAG>…</TAG>` aggregate (aggregates close even in SGML). */
function aggregateBlocks(text: string, tag: string): string[] {
  const pattern = new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`, "gi");
  return [...text.matchAll(pattern)].map((match) => match[1]);
}

/** STMTTRN blocks, tolerating SGML files that never close the aggregate. */
function transactionBlocks(text: string): string[] {
  const closed = aggregateBlocks(text, "STMTTRN");
  if (closed.length > 0) return closed;
  return text
    .split(/<STMTTRN>/i)
    .slice(1)
    .map((chunk) => chunk.split(/<\/?(?:BANKTRANLIST|LEDGERBAL|AVAILBAL)/i)[0]);
}

/** A leaf tag's value: everything up to the next tag or line break. */
function leafValue(text: string, tag: string): string {
  const match = new RegExp(`<${tag}>([^<\\r\\n]*)`, "i").exec(text);
  return match ? match[1].trim() : "";
}

const OFX_ENTITIES: Record<string, string> = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&apos;": "'",
  "&nbsp;": " ",
};

function decodeOfxText(value: string): string {
  return value.replace(
    /&(?:amp|lt|gt|quot|apos|nbsp);/g,
    (entity) => OFX_ENTITIES[entity] ?? entity,
  );
}

/** "20260821", "20260821120000.000[-3:BRT]" → "2026-08-21"; else pass through. */
function ofxDateValue(value: string): string {
  const digits = /^(\d{4})(\d{2})(\d{2})/.exec(value);
  return digits ? `${digits[1]}-${digits[2]}-${digits[3]}` : value;
}

/* -------------------------------------------------------------------------- */
/* Export                                                                     */
/* -------------------------------------------------------------------------- */

function encodeOfxText(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/** "2026-08-21" → "20260821"; anything unparseable falls back to `today`. */
function ofxStamp(value: string | number, fallback: string): string {
  const date = fileDateValue(value);
  return /^\d{4}-\d{2}-\d{2}$/.test(date) ? date.replace(/-/g, "") : fallback;
}

/**
 * Builds an OFX 1.02 statement from canonical export rows. Expenses are
 * written as negative amounts (DEBIT), income as positive (CREDIT), matching
 * how `ofxToRows` reads the sign back on import.
 */
export function buildOfxContent(
  rows: OfxExportRow[],
  options: { currency: string; now?: Date },
): string {
  const now = options.now ?? new Date();
  const today = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("");

  const transactions = rows.map((row, index) => {
    const stamp = ofxStamp(row.date, today);
    const isExpense = String(row.type) === "expense";
    const amount = parseAmountCell(row.amount);
    const signed = (Number.isFinite(amount) ? Math.abs(amount) : 0) *
      (isExpense ? -1 : 1);
    return { row, index, stamp, isExpense, signed };
  });

  const stamps = transactions.map((transaction) => transaction.stamp).sort();
  const dtStart = stamps[0] ?? today;
  const dtEnd = stamps[stamps.length - 1] ?? today;

  const lines = [
    "OFXHEADER:100",
    "DATA:OFXSGML",
    "VERSION:102",
    "SECURITY:NONE",
    "ENCODING:UTF-8",
    "CHARSET:NONE",
    "COMPRESSION:NONE",
    "OLDFILEUID:NONE",
    "NEWFILEUID:NONE",
    "",
    "<OFX>",
    "<SIGNONMSGSRSV1>",
    "<SONRS>",
    "<STATUS>",
    "<CODE>0",
    "<SEVERITY>INFO",
    "</STATUS>",
    `<DTSERVER>${today}`,
    "<LANGUAGE>ENG",
    "</SONRS>",
    "</SIGNONMSGSRSV1>",
    "<BANKMSGSRSV1>",
    "<STMTTRNRS>",
    "<TRNUID>1",
    "<STATUS>",
    "<CODE>0",
    "<SEVERITY>INFO",
    "</STATUS>",
    "<STMTRS>",
    `<CURDEF>${options.currency}`,
    "<BANKACCTFROM>",
    "<BANKID>MYMONEY",
    "<ACCTID>MYMONEY",
    "<ACCTTYPE>CHECKING",
    "</BANKACCTFROM>",
    "<BANKTRANLIST>",
    `<DTSTART>${dtStart}`,
    `<DTEND>${dtEnd}`,
  ];

  for (const { row, index, stamp, isExpense, signed } of transactions) {
    lines.push(
      "<STMTTRN>",
      `<TRNTYPE>${isExpense ? "DEBIT" : "CREDIT"}`,
      `<DTPOSTED>${stamp}`,
      `<TRNAMT>${signed.toFixed(2)}`,
      `<FITID>${stamp}-${index + 1}`,
      `<NAME>${encodeOfxText(String(row.name ?? ""))}`,
    );
    const memo = String(row.description ?? "").trim();
    if (memo) lines.push(`<MEMO>${encodeOfxText(memo)}`);
    lines.push("</STMTTRN>");
  }

  lines.push(
    "</BANKTRANLIST>",
    "<LEDGERBAL>",
    "<BALAMT>0.00",
    `<DTASOF>${today}`,
    "</LEDGERBAL>",
    "</STMTRS>",
    "</STMTTRNRS>",
    "</BANKMSGSRSV1>",
    "</OFX>",
    "",
  );

  return lines.join("\r\n");
}

/** The currency an exported OFX file declares, by app locale. */
export function ofxCurrencyForLocale(locale: string): string {
  return locale === "pt-BR" ? "BRL" : "USD";
}
