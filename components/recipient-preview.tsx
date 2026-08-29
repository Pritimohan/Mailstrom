"use client";

import type { ParsedEmails } from "@/types";

interface RecipientPreviewProps {
  parsed: ParsedEmails;
  maxRecipients: number;
}

export function RecipientPreview({ parsed, maxRecipients }: RecipientPreviewProps) {
  const overLimit = parsed.valid.length > maxRecipients;

  return (
    <div className="rounded-xl bg-neutral-950/70 px-4 py-3 ring-1 ring-neutral-800/70">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
        <span className="text-neutral-100">
          {parsed.valid.length} valid recipient{parsed.valid.length === 1 ? "" : "s"}
        </span>
        {parsed.invalid.length > 0 && (
          <span className="text-neutral-400">
            {parsed.invalid.length} invalid skipped
          </span>
        )}
      </div>
      {parsed.invalid.length > 0 && (
        <p className="mt-2 text-xs text-neutral-500">
          Invalid: {parsed.invalid.slice(0, 5).join(", ")}
          {parsed.invalid.length > 5 ? "..." : ""}
        </p>
      )}
      {overLimit && (
        <p className="mt-2 text-xs text-neutral-300">
          Maximum {maxRecipients} recipients per batch. Only the first{" "}
          {maxRecipients} will be sent.
        </p>
      )}
    </div>
  );
}
