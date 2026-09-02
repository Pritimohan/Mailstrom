"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Mail, Rows3, Users, AlertCircle } from "lucide-react";
import { AuthButton } from "@/components/auth-button";
import { FileUpload } from "@/components/file-upload";
import { ColumnPicker } from "@/components/column-picker";
import { RecipientPreview } from "@/components/recipient-preview";
import { EmailCompose, type ComposeValues } from "@/components/email-compose";
import { SendControls } from "@/components/send-controls";
import {
  BentoCard,
  BentoDescription,
  BentoLabel,
  BentoTitle,
  StatTile,
} from "@/components/ui/bento-card";
import { detectEmailColumn, parseEmailsFromColumn } from "@/lib/parse-emails";
import type { AuthStatus, SpreadsheetData } from "@/types";

const MAX_RECIPIENTS = 500;

const ERROR_MESSAGES: Record<string, string> = {
  auth_denied: "Google sign-in was cancelled.",
  auth_invalid: "Invalid authentication response.",
  auth_state: "Security check failed. Please try connecting again.",
  auth_tokens: "Could not obtain Gmail tokens. Try connecting again.",
  auth_scopes:
    "Gmail send permission was not granted. Add the gmail.send scope in Google Cloud OAuth consent screen, then connect again.",
  auth_failed: "Authentication failed. Check your Google Cloud setup.",
  auth_config: "Server auth configuration is missing.",
};

export function GmailSenderApp() {
  const searchParams = useSearchParams();
  const [authStatus, setAuthStatus] = useState<AuthStatus>({ connected: false });
  const [spreadsheet, setSpreadsheet] = useState<SpreadsheetData | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [selectedColumn, setSelectedColumn] = useState("");
  const [compose, setCompose] = useState<ComposeValues>({
    subject: "",
    body: "",
    attachments: [],
    inlineImages: [],
  });
  const [banner, setBanner] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const urlNotice = useMemo(() => {
    const error = searchParams.get("error");
    const connected = searchParams.get("connected");
    if (error) {
      return ERROR_MESSAGES[error] ?? "Something went wrong.";
    }
    if (connected) {
      return "Gmail connected successfully.";
    }
    return null;
  }, [searchParams]);

  useEffect(() => {
    if (!urlNotice) return;

    const frame = requestAnimationFrame(() => {
      setBanner(urlNotice);
      window.history.replaceState({}, "", "/");
    });

    return () => cancelAnimationFrame(frame);
  }, [urlNotice]);

  const parsedEmails = useMemo(() => {
    if (!spreadsheet || !selectedColumn) {
      return { valid: [], invalid: [] };
    }
    return parseEmailsFromColumn(spreadsheet.rows, selectedColumn);
  }, [spreadsheet, selectedColumn]);

  const handleParsed = (data: SpreadsheetData, name: string) => {
    setSpreadsheet(data);
    setFileName(name);
    const detected = detectEmailColumn(data.headers) ?? data.headers[0] ?? "";
    setSelectedColumn(detected);
    setBanner(null);
  };

  const handleClearFile = () => {
    setSpreadsheet(null);
    setFileName(null);
    setSelectedColumn("");
  };

  return (
    <div className="bento-page min-h-full text-neutral-100">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        {banner && (
          <div className="mb-4 rounded-2xl border border-neutral-800 bg-neutral-900/90 px-4 py-3 text-sm text-neutral-200 ring-1 ring-neutral-800/80">
            {banner}
          </div>
        )}

        <div className="bento-grid">
          <BentoCard span="hero" className="flex min-h-[140px] flex-col justify-between">
            <div className="space-y-3">
              <BentoLabel>Bulk mailer</BentoLabel>
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-neutral-950 ring-1 ring-neutral-800">
                  <Mail className="h-5 w-5 text-neutral-300" />
                </div>
                <div>
                  <BentoTitle className="text-2xl sm:text-3xl">Mailstrom</BentoTitle>
                  <BentoDescription className="mt-1 max-w-md">
                    Upload a spreadsheet, compose once, and send individually via Gmail API.
                  </BentoDescription>
                </div>
              </div>
            </div>
          </BentoCard>

          <BentoCard span="compact" variant="muted" className="flex flex-col justify-between">
            <div className="space-y-3">
              <BentoLabel>Account</BentoLabel>
              <div className="flex items-center gap-2">
                <span
                  className={`h-2.5 w-2.5 rounded-full ${
                    authStatus.connected
                      ? "status-dot-connected"
                      : "bg-neutral-600"
                  }`}
                />
                <p className="text-sm text-neutral-300">
                  {authStatus.connected ? "Connected" : "Not connected"}
                </p>
              </div>
              {authStatus.email && (
                <p className="truncate text-xs text-neutral-500">{authStatus.email}</p>
              )}
            </div>
            <div className="mt-4">
              <AuthButton onStatusChange={setAuthStatus} />
            </div>
          </BentoCard>

          <BentoCard span="half" className="min-h-[260px]">
            <div className="mb-4 space-y-1">
              <BentoLabel>Step 01</BentoLabel>
              <BentoTitle>Upload file</BentoTitle>
              <BentoDescription>
                CSV or Excel with an email column. Multiple addresses per cell supported.
              </BentoDescription>
            </div>
            <FileUpload
              onParsed={handleParsed}
              onClear={handleClearFile}
              disabled={sending}
            />
          </BentoCard>

          <BentoCard span="half" className="min-h-[260px]">
            <div className="mb-4 space-y-1">
              <BentoLabel>Overview</BentoLabel>
              <BentoTitle>Batch stats</BentoTitle>
            </div>
            <div className="grid h-[calc(100%-4rem)] grid-cols-1 gap-3 sm:grid-cols-3">
              <StatTile
                label="Recipients"
                value={parsedEmails.valid.length}
                hint={fileName ? "Valid addresses" : "Upload a file"}
              />
              <StatTile
                label="Invalid"
                value={parsedEmails.invalid.length}
                hint="Skipped entries"
              />
              <StatTile
                label="Rows"
                value={spreadsheet?.rows.length ?? 0}
                hint={fileName ?? "No file loaded"}
              />
            </div>
          </BentoCard>

          {spreadsheet && (
            <BentoCard span="full">
              <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-1">
                  <BentoLabel>Step 02</BentoLabel>
                  <BentoTitle>Map email column</BentoTitle>
                  <BentoDescription>
                    {fileName} · {spreadsheet.rows.length} rows
                  </BentoDescription>
                </div>
                <div className="inline-flex items-center gap-2 rounded-full bg-neutral-950 px-3 py-1.5 text-xs text-neutral-400 ring-1 ring-neutral-800">
                  <Rows3 className="h-3.5 w-3.5" />
                  {spreadsheet.rows.length > 4
                    ? `${spreadsheet.rows.length} rows · scrollable`
                    : `${spreadsheet.rows.length} row${spreadsheet.rows.length === 1 ? "" : "s"}`}
                </div>
              </div>
              <div className="space-y-4">
                <ColumnPicker
                  data={spreadsheet}
                  selectedColumn={selectedColumn}
                  onColumnChange={setSelectedColumn}
                  disabled={sending}
                />
                <RecipientPreview
                  parsed={parsedEmails}
                  maxRecipients={MAX_RECIPIENTS}
                />
              </div>
            </BentoCard>
          )}

          <BentoCard span="two-thirds" className="min-h-[360px]">
            <div className="mb-5 space-y-1">
              <BentoLabel>Step 03</BentoLabel>
              <BentoTitle>Compose</BentoTitle>
              <BentoDescription>
                Same subject, body, attachments, and inline images for every recipient.
              </BentoDescription>
            </div>
            <EmailCompose
              values={compose}
              onChange={setCompose}
              disabled={sending}
            />
          </BentoCard>

          <BentoCard span="third" variant="inset" className="flex min-h-[360px] flex-col">
            <div className="mb-5 space-y-1">
              <BentoLabel>Step 04</BentoLabel>
              <BentoTitle>Send</BentoTitle>
              <BentoDescription>
                Keep this tab open while the batch runs.
              </BentoDescription>
            </div>

            <div className="mb-4 grid grid-cols-2 gap-2">
              <div className="rounded-xl bg-neutral-900/60 p-3 ring-1 ring-neutral-800/70">
                <div className="flex items-center gap-1.5 text-neutral-500">
                  <Users className="h-3.5 w-3.5" />
                  <span className="text-[10px] uppercase tracking-wider">Queue</span>
                </div>
                <p className="mt-1 text-xl font-semibold tabular-nums text-neutral-50">
                  {Math.min(parsedEmails.valid.length, MAX_RECIPIENTS)}
                </p>
              </div>
              <div className="rounded-xl bg-neutral-900/60 p-3 ring-1 ring-neutral-800/70">
                <div className="flex items-center gap-1.5 text-neutral-500">
                  <AlertCircle className="h-3.5 w-3.5" />
                  <span className="text-[10px] uppercase tracking-wider">Status</span>
                </div>
                <p className="mt-1 text-sm font-medium text-neutral-200">
                  {sending ? "Sending…" : authStatus.connected ? "Ready" : "Connect Gmail"}
                </p>
              </div>
            </div>

            <div className="mt-auto">
              <SendControls
                recipients={parsedEmails.valid}
                compose={compose}
                connected={authStatus.connected}
                disabled={sending}
                onSendingChange={setSending}
              />
            </div>
          </BentoCard>
        </div>
      </div>
    </div>
  );
}
