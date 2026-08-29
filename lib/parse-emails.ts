import { z } from "zod";
import type { ParsedEmails } from "@/types";

const emailSchema = z.string().email();

const SPLIT_PATTERN = /[,;\s\n\r]+/;

export function extractEmailsFromCell(value: string): string[] {
  if (!value?.trim()) {
    return [];
  }
  return value
    .split(SPLIT_PATTERN)
    .map((part) => part.trim())
    .filter(Boolean);
}

export function parseEmailsFromColumn(
  rows: Record<string, string>[],
  column: string,
): ParsedEmails {
  const seen = new Set<string>();
  const valid: string[] = [];
  const invalid: string[] = [];

  for (const row of rows) {
    const cellValue = row[column] ?? "";
    const candidates = extractEmailsFromCell(cellValue);

    for (const candidate of candidates) {
      const normalized = candidate.toLowerCase();
      if (seen.has(normalized)) {
        continue;
      }
      seen.add(normalized);

      const result = emailSchema.safeParse(candidate);
      if (result.success) {
        valid.push(candidate);
      } else {
        invalid.push(candidate);
      }
    }
  }

  return { valid, invalid };
}

export function detectEmailColumn(headers: string[]): string | undefined {
  return headers.find((header) => /email/i.test(header));
}
