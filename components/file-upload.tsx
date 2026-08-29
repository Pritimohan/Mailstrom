"use client";

import { useRef, useState } from "react";
import { FileSpreadsheet, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  isAcceptedSpreadsheet,
  MAX_SPREADSHEET_BYTES,
  parseSpreadsheet,
} from "@/lib/parse-spreadsheet";
import type { SpreadsheetData } from "@/types";

interface FileUploadProps {
  onParsed: (data: SpreadsheetData, fileName: string) => void;
  onClear: () => void;
  disabled?: boolean;
}

export function FileUpload({ onParsed, onClear, disabled }: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const handleFile = async (file: File) => {
    setError(null);

    if (!isAcceptedSpreadsheet(file)) {
      setError("Only CSV and Excel (.xlsx, .xls) files are supported.");
      return;
    }

    if (file.size > MAX_SPREADSHEET_BYTES) {
      setError("File exceeds 5 MB limit.");
      return;
    }

    setLoading(true);
    try {
      const data = await parseSpreadsheet(file);
      if (data.headers.length === 0) {
        setError("No columns found in the file.");
        return;
      }
      setFileName(file.name);
      onParsed(data, file.name);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to parse file.");
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setFileName(null);
    setError(null);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
    onClear();
  };

  return (
    <div className="space-y-3">
      <Label htmlFor="spreadsheet">Upload spreadsheet</Label>
      <div
        className={`flex flex-col items-center justify-center rounded-2xl border border-dashed px-6 py-10 transition-colors ${
          dragOver
            ? "border-neutral-500 bg-neutral-900/80"
            : "border-neutral-800 bg-neutral-950/60"
        } ${disabled ? "opacity-50" : "cursor-pointer hover:border-neutral-600"}`}
        onDragOver={(event) => {
          event.preventDefault();
          if (!disabled) setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragOver(false);
          if (disabled) return;
          const file = event.dataTransfer.files[0];
          if (file) void handleFile(file);
        }}
        onClick={() => !disabled && inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          id="spreadsheet"
          type="file"
          accept=".csv,.xlsx,.xls"
          className="hidden"
          disabled={disabled}
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void handleFile(file);
          }}
        />
        {loading ? (
          <p className="text-sm text-neutral-400">Parsing file...</p>
        ) : fileName ? (
          <div
            className="flex w-full items-center gap-3 overflow-hidden"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <FileSpreadsheet className="h-8 w-8 shrink-0 text-neutral-400" />
              <div className="min-w-0 flex-1">
                <p
                  className="truncate text-sm font-medium text-neutral-100"
                  title={fileName}
                >
                  {fileName}
                </p>
                <p className="truncate text-xs text-neutral-500">
                  Click or drop to replace
                </p>
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-9 shrink-0 px-3"
              onClick={(event) => {
                event.stopPropagation();
                handleClear();
              }}
              disabled={disabled}
            >
              <X className="h-4 w-4" />
              <span className="hidden sm:inline">Remove</span>
            </Button>
          </div>
        ) : (
          <>
            <Upload className="mb-3 h-8 w-8 text-neutral-500" />
            <p className="text-sm text-neutral-300">
              Drop CSV or Excel file here, or click to browse
            </p>
            <p className="mt-1 text-xs text-neutral-500">Max 5 MB</p>
          </>
        )}
      </div>
      {error && <p className="text-sm text-neutral-400">{error}</p>}
    </div>
  );
}
