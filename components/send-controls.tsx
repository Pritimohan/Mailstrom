"use client";

import { useMemo, useRef, useState } from "react";
import { Pause, Play, Square, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { AttachmentPayload, InlineImage, SendLogEntry, SendResult } from "@/types";
import type { ComposeValues } from "@/components/email-compose";
import { SendProgress } from "@/components/send-progress";
import {
  fileToBase64,
  filterInlineImagesForHtml,
  stripHtmlToText,
} from "@/lib/compose-utils";

const SEND_DELAY_MS = 600;
const MAX_RECIPIENTS = 500;

interface SendControlsProps {
  recipients: string[];
  compose: ComposeValues;
  connected: boolean;
  disabled?: boolean;
  onSendingChange?: (sending: boolean) => void;
}

async function fileToAttachmentPayload(file: File): Promise<AttachmentPayload> {
  return {
    filename: file.name,
    mimeType: file.type || "application/octet-stream",
    base64: await fileToBase64(file),
  };
}

function downloadFailedCsv(failures: SendLogEntry[]) {
  const rows = failures.map((entry) => [entry.email, entry.error ?? "Unknown error"]);
  const csv = ["email,error", ...rows.map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "failed-recipients.csv";
  link.click();
  URL.revokeObjectURL(url);
}

export function SendControls({
  recipients,
  compose,
  connected,
  disabled,
  onSendingChange,
}: SendControlsProps) {
  const [sending, setSending] = useState(false);
  const [paused, setPaused] = useState(false);
  const [completed, setCompleted] = useState(0);
  const [logs, setLogs] = useState<SendLogEntry[]>([]);
  const cancelRef = useRef(false);
  const pauseRef = useRef(false);

  const cappedRecipients = useMemo(
    () => recipients.slice(0, MAX_RECIPIENTS),
    [recipients],
  );

  const bodyHasContent = stripHtmlToText(compose.body).length > 0;

  const canStart =
    connected &&
    !disabled &&
    !sending &&
    cappedRecipients.length > 0 &&
    compose.subject.trim().length > 0 &&
    bodyHasContent;

  const waitWhilePaused = async () => {
    while (pauseRef.current && !cancelRef.current) {
      await new Promise((resolve) => setTimeout(resolve, 200));
    }
  };

  const delay = async () => {
    await new Promise((resolve) => setTimeout(resolve, SEND_DELAY_MS));
  };

  const handleStart = async () => {
    const confirmed = window.confirm(
      `Send email to ${cappedRecipients.length} recipient${cappedRecipients.length === 1 ? "" : "s"}?`,
    );
    if (!confirmed) return;

    cancelRef.current = false;
    pauseRef.current = false;
    setPaused(false);
    setSending(true);
    onSendingChange?.(true);
    setCompleted(0);
    setLogs([]);

    let attachmentPayloads: AttachmentPayload[] = [];
    let inlineImagePayloads: InlineImage[] = filterInlineImagesForHtml(
      compose.body,
      compose.inlineImages,
    );

    try {
      attachmentPayloads = await Promise.all(
        compose.attachments.map((file) => fileToAttachmentPayload(file)),
      );
    } catch {
      setLogs([
        {
          email: "—",
          status: "failed",
          error: "Failed to read attachments",
          timestamp: new Date().toISOString(),
        },
      ]);
      setSending(false);
      onSendingChange?.(false);
      return;
    }

    for (let index = 0; index < cappedRecipients.length; index += 1) {
      if (cancelRef.current) break;

      await waitWhilePaused();
      if (cancelRef.current) break;

      const email = cappedRecipients[index]!;
      try {
        const response = await fetch("/api/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            to: email,
            subject: compose.subject.trim(),
            html: compose.body.trim(),
            attachments: attachmentPayloads,
            inlineImages: inlineImagePayloads,
          }),
        });

        const result = (await response.json()) as SendResult;
        const entry: SendLogEntry = {
          email,
          status: result.success ? "sent" : "failed",
          error: result.error,
          timestamp: new Date().toISOString(),
        };
        setLogs((prev) => [...prev, entry]);
      } catch {
        setLogs((prev) => [
          ...prev,
          {
            email,
            status: "failed",
            error: "Network error",
            timestamp: new Date().toISOString(),
          },
        ]);
      }

      setCompleted(index + 1);

      if (index < cappedRecipients.length - 1 && !cancelRef.current) {
        await delay();
      }
    }

    setSending(false);
    onSendingChange?.(false);
    setPaused(false);
    pauseRef.current = false;
  };

  const handlePause = () => {
    pauseRef.current = true;
    setPaused(true);
  };

  const handleResume = () => {
    pauseRef.current = false;
    setPaused(false);
  };

  const handleCancel = () => {
    cancelRef.current = true;
    pauseRef.current = false;
    setPaused(false);
  };

  const failures = logs.filter((entry) => entry.status === "failed");

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Button onClick={handleStart} disabled={!canStart}>
          <Play className="h-4 w-4" />
          Start sending
        </Button>
        {sending && !paused && (
          <Button variant="outline" onClick={handlePause}>
            <Pause className="h-4 w-4" />
            Pause
          </Button>
        )}
        {sending && paused && (
          <Button variant="outline" onClick={handleResume}>
            <Play className="h-4 w-4" />
            Resume
          </Button>
        )}
        {sending && (
          <Button variant="destructive" onClick={handleCancel}>
            <Square className="h-4 w-4" />
            Cancel
          </Button>
        )}
        {failures.length > 0 && !sending && (
          <Button variant="ghost" onClick={() => downloadFailedCsv(failures)}>
            <Download className="h-4 w-4" />
            Export failures
          </Button>
        )}
      </div>

      {!connected && (
        <p className="text-sm text-neutral-400">
          Connect Gmail before sending.
        </p>
      )}

      <SendProgress
        total={sending || completed > 0 ? cappedRecipients.length : 0}
        completed={completed}
        logs={logs}
      />
    </div>
  );
}
