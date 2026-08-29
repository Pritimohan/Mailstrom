"use client";

import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { SpreadsheetData } from "@/types";

const VISIBLE_ROW_COUNT = 4;

interface ColumnPickerProps {
  data: SpreadsheetData;
  selectedColumn: string;
  onColumnChange: (column: string) => void;
  disabled?: boolean;
}

export function ColumnPicker({
  data,
  selectedColumn,
  onColumnChange,
  disabled,
}: ColumnPickerProps) {
  const isScrollable = data.rows.length > VISIBLE_ROW_COUNT;

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email-column">Email column</Label>
        <select
          id="email-column"
          value={selectedColumn}
          disabled={disabled}
          onChange={(event) => onColumnChange(event.target.value)}
          className="flex h-10 w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-500 disabled:opacity-50"
        >
          {data.headers.map((header) => (
            <option key={header} value={header}>
              {header}
            </option>
          ))}
        </select>
      </div>

      <div
        className={cn(
          "minimal-scroll overflow-auto rounded-xl ring-1 ring-neutral-800/70",
          isScrollable && "max-h-[13.5rem]",
        )}
      >
        <table className="w-full min-w-[480px] text-left text-sm">
          <thead className="sticky top-0 z-10 bg-neutral-950/95 backdrop-blur-sm">
            <tr>
              {data.headers.map((header) => (
                <th
                  key={header}
                  className={`px-3 py-2 font-medium ${
                    header === selectedColumn
                      ? "text-neutral-50"
                      : "text-neutral-400"
                  }`}
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.rows.map((row, index) => (
              <tr key={index} className="border-b border-neutral-900 last:border-0">
                {data.headers.map((header) => (
                  <td
                    key={header}
                    className={`max-w-[200px] truncate px-3 py-2 ${
                      header === selectedColumn
                        ? "text-neutral-100"
                        : "text-neutral-500"
                    }`}
                  >
                    {row[header] || "—"}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-neutral-500">
        {isScrollable
          ? `Showing all ${data.rows.length} rows · scroll to see more`
          : `Showing all ${data.rows.length} row${data.rows.length === 1 ? "" : "s"}`}
      </p>
    </div>
  );
}
