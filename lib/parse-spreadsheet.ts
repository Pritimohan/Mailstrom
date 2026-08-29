import Papa from "papaparse";
import * as XLSX from "xlsx";
import type { SpreadsheetData } from "@/types";

export const MAX_SPREADSHEET_BYTES = 5 * 1024 * 1024;

const ACCEPTED_EXTENSIONS = [".csv", ".xlsx", ".xls"];

export function isAcceptedSpreadsheet(file: File): boolean {
  const name = file.name.toLowerCase();
  return ACCEPTED_EXTENSIONS.some((ext) => name.endsWith(ext));
}

function normalizeRows(rawRows: Record<string, unknown>[]): SpreadsheetData {
  if (rawRows.length === 0) {
    return { headers: [], rows: [] };
  }

  const headers = Object.keys(rawRows[0] ?? {}).filter(Boolean);
  const rows = rawRows.map((row) => {
    const normalized: Record<string, string> = {};
    for (const header of headers) {
      const value = row[header];
      normalized[header] =
        value === null || value === undefined ? "" : String(value).trim();
    }
    return normalized;
  });

  return { headers, rows };
}

async function parseCsv(file: File): Promise<SpreadsheetData> {
  let text = await file.text();

  if (text.charCodeAt(0) === 0xfeff) {
    text = text.slice(1);
  }

  const result = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: true,
    delimiter: ",",
    transformHeader: (header) => header.trim(),
  });

  const blockingErrors = result.errors.filter(
    (error) =>
      error.type !== "Delimiter" &&
      !(error.type === "FieldMismatch" && error.code === "TooManyFields"),
  );

  if (blockingErrors.length > 0) {
    throw new Error(blockingErrors[0]?.message ?? "Failed to parse CSV file");
  }

  return normalizeRows(result.data);
}

async function parseExcel(file: File): Promise<SpreadsheetData> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array" });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    throw new Error("Excel file contains no sheets");
  }

  const sheet = workbook.Sheets[sheetName];
  const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: "",
  });

  return normalizeRows(json);
}

export async function parseSpreadsheet(file: File): Promise<SpreadsheetData> {
  if (file.size > MAX_SPREADSHEET_BYTES) {
    throw new Error("File exceeds 5 MB limit");
  }

  if (!isAcceptedSpreadsheet(file)) {
    throw new Error("Only CSV and Excel files are supported");
  }

  const lowerName = file.name.toLowerCase();
  if (lowerName.endsWith(".csv")) {
    return parseCsv(file);
  }

  return parseExcel(file);
}
