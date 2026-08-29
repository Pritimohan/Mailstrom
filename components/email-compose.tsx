"use client";

import { useRef, useState } from "react";
import { Paperclip, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024;

const ALLOWED_ATTACHMENT_EXTENSIONS = new Set([
  ".pdf",
  ".doc",
  ".docx",
  ".xls",
  ".xlsx",
  ".csv",
  ".png",
  ".jpg",
  ".jpeg",
  ".zip",
]);

export interface ComposeValues {
  subject: string;
  body: string;
  attachment: File | null;
}

interface EmailComposeProps {
  values: ComposeValues;
  onChange: (values: ComposeValues) => void;
  disabled?: boolean;
}

export function EmailCompose({
  values,
  onChange,
  disabled,
}: EmailComposeProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [attachmentError, setAttachmentError] = useState<string | null>(null);

  const handleAttachment = (file: File | undefined) => {
    setAttachmentError(null);
    if (!file) {
      onChange({ ...values, attachment: null });
      return;
    }

    const ext = file.name.includes(".")
      ? file.name.slice(file.name.lastIndexOf(".")).toLowerCase()
      : "";

    if (ext && !ALLOWED_ATTACHMENT_EXTENSIONS.has(ext)) {
      setAttachmentError("Attachment file type is not allowed.");
      return;
    }

    if (file.size > MAX_ATTACHMENT_BYTES) {
      setAttachmentError(
        `Attachment exceeds ${Math.round(MAX_ATTACHMENT_BYTES / 1024 / 1024)} MB limit.`,
      );
      return;
    }

    onChange({ ...values, attachment: file });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="subject">Subject</Label>
        <Input
          id="subject"
          value={values.subject}
          disabled={disabled}
          placeholder="Email subject"
          onChange={(event) =>
            onChange({ ...values, subject: event.target.value })
          }
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="body">Body</Label>
        <Textarea
          id="body"
          value={values.body}
          disabled={disabled}
          placeholder="Write your email message..."
          onChange={(event) =>
            onChange({ ...values, body: event.target.value })
          }
        />
      </div>

      <div className="flex justify-between items-center">
        <Label htmlFor="attachment">Attachment (optional)</Label>
        <input
          ref={fileRef}
          id="attachment"
          type="file"
          className="hidden"
          disabled={disabled}
          accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.png,.jpg,.jpeg,.zip"
          onChange={(event) => handleAttachment(event.target.files?.[0])}
        />
        {values.attachment ? (
          <div className=" max-w-md flex items-center gap-3 overflow-hidden rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2">
            <Paperclip className="h-4 w-4 shrink-0 text-neutral-400" />
            <p
              className="min-w-0 flex-1 truncate text-sm text-neutral-200"
              title={values.attachment.name}
            >
              {values.attachment.name}
            </p>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 w-8 shrink-0 p-0"
              disabled={disabled}
              aria-label="Remove attachment"
              onClick={() => {
                handleAttachment(undefined);
                if (fileRef.current) fileRef.current.value = "";
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <Button
            type="button"
            variant="outline"
            disabled={disabled}
            onClick={() => fileRef.current?.click()}
          >
            <Paperclip className="h-4 w-4" />
            Add attachment
          </Button>
        )}
        {attachmentError && (
          <p className="text-sm text-neutral-400">{attachmentError}</p>
        )}
      </div>
    </div>
  );
}
