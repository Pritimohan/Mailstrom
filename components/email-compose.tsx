"use client";

import { useRef, useState } from "react";
import type { Editor } from "@tiptap/react";
import { Paperclip, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ComposeToolbar } from "@/components/compose/compose-toolbar";
import {
  insertInlineImageFromFile,
  RichTextEditor,
} from "@/components/compose/rich-text-editor";
import {
  MAX_ATTACHMENTS,
  validateAttachmentFile,
} from "@/lib/compose-utils";
import type { InlineImage } from "@/types";
import { cn } from "@/lib/utils";

export interface ComposeValues {
  subject: string;
  body: string;
  attachments: File[];
  inlineImages: InlineImage[];
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
  const editorRef = useRef<Editor | null>(null);
  const attachmentRef = useRef<HTMLInputElement>(null);
  const photoRef = useRef<HTMLInputElement>(null);
  const [editor, setEditor] = useState<Editor | null>(null);
  const [attachmentError, setAttachmentError] = useState<string | null>(null);
  const [inlineImageError, setInlineImageError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const addAttachments = (files: FileList | File[]) => {
    setAttachmentError(null);
    const incoming = Array.from(files);
    if (incoming.length === 0) return;

    const nextAttachments = [...values.attachments];
    for (const file of incoming) {
      if (nextAttachments.length >= MAX_ATTACHMENTS) {
        setAttachmentError(`Maximum ${MAX_ATTACHMENTS} attachments allowed.`);
        break;
      }

      const error = validateAttachmentFile(file);
      if (error) {
        setAttachmentError(error);
        continue;
      }

      if (
        nextAttachments.some(
          (existing) =>
            existing.name === file.name && existing.size === file.size,
        )
      ) {
        continue;
      }

      nextAttachments.push(file);
    }

    onChange({ ...values, attachments: nextAttachments });
  };

  const removeAttachment = (index: number) => {
    onChange({
      ...values,
      attachments: values.attachments.filter((_, current) => current !== index),
    });
  };

  const handleInlineImageAdd = (image: InlineImage) => {
    setInlineImageError(null);
    onChange({
      ...values,
      inlineImages: [...values.inlineImages, image],
    });
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (!disabled) {
      setDragActive(true);
    }
  };

  const handleDragLeave = () => {
    setDragActive(false);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragActive(false);
    if (disabled || !event.dataTransfer.files.length) return;

    const files = Array.from(event.dataTransfer.files);
    const imageFiles = files.filter((file) => file.type.startsWith("image/"));
    const otherFiles = files.filter((file) => !file.type.startsWith("image/"));

    for (const file of imageFiles) {
      insertInlineImageFromFile(
        editorRef.current,
        file,
        handleInlineImageAdd,
        setInlineImageError,
      );
    }

    if (otherFiles.length > 0) {
      addAttachments(otherFiles);
    }
  };

  return (
    <div
      className={cn(
        "space-y-4 rounded-2xl transition-colors",
        dragActive && "ring-2 ring-neutral-500 ring-offset-2 ring-offset-neutral-950",
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
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
        <ComposeToolbar
          editor={editor}
          disabled={disabled}
          onAttachFiles={() => attachmentRef.current?.click()}
          onInsertPhoto={() => photoRef.current?.click()}
        />
        <RichTextEditor
          value={values.body}
          disabled={disabled}
          editorRef={editorRef}
          onEditorReady={setEditor}
          onChange={(body) => onChange({ ...values, body })}
          onInlineImageAdd={handleInlineImageAdd}
          onInlineImageError={setInlineImageError}
        />
        {inlineImageError && (
          <p className="text-sm text-red-400">{inlineImageError}</p>
        )}
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <Label>Attachments (optional)</Label>
          <Button
            type="button"
            variant="outline"
            disabled={disabled}
            onClick={() => attachmentRef.current?.click()}
          >
            <Paperclip className="h-4 w-4" />
            Add attachment
          </Button>
        </div>

        {values.attachments.length > 0 && (
          <div className="space-y-2">
            {values.attachments.map((attachment, index) => (
              <div
                key={`${attachment.name}-${attachment.size}-${index}`}
                className="flex items-center gap-3 overflow-hidden rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2"
              >
                <Paperclip className="h-4 w-4 shrink-0 text-neutral-400" />
                <p
                  className="min-w-0 flex-1 truncate text-sm text-neutral-200"
                  title={attachment.name}
                >
                  {attachment.name}
                </p>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 shrink-0 p-0"
                  disabled={disabled}
                  aria-label={`Remove ${attachment.name}`}
                  onClick={() => removeAttachment(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {attachmentError && (
          <p className="text-sm text-red-400">{attachmentError}</p>
        )}

        <p className="text-xs text-neutral-500">
          Drag files here to attach, or drop images on the editor to insert inline.
        </p>
      </div>

      <input
        ref={attachmentRef}
        type="file"
        className="hidden"
        multiple
        disabled={disabled}
        accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.png,.jpg,.jpeg,.zip"
        onChange={(event) => {
          if (event.target.files) {
            addAttachments(event.target.files);
          }
          event.target.value = "";
        }}
      />
      <input
        ref={photoRef}
        type="file"
        className="hidden"
        disabled={disabled}
        accept="image/png,image/jpeg,image/jpg,image/gif,image/webp"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) {
            insertInlineImageFromFile(
              editorRef.current,
              file,
              handleInlineImageAdd,
              setInlineImageError,
            );
          }
          event.target.value = "";
        }}
      />
    </div>
  );
}
