import { z } from "zod";

export const ALLOWED_ATTACHMENT_MIMES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/csv",
  "image/png",
  "image/jpeg",
  "image/jpg",
  "application/zip",
  "application/x-zip-compressed",
]);

export const ALLOWED_ATTACHMENT_EXTENSIONS = new Set([
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

const attachmentSchema = z.object({
  filename: z.string().min(1).max(255),
  mimeType: z.string().min(1).max(127),
  base64: z.string().min(1),
});

export const sendEmailSchema = z.object({
  to: z.string().email(),
  subject: z.string().min(1).max(998),
  html: z.string().min(1).max(500_000),
  attachment: attachmentSchema.optional(),
});

export function getMaxAttachmentBytes(): number {
  const value = Number(process.env.MAX_ATTACHMENT_BYTES ?? 10_485_760);
  return Number.isFinite(value) && value > 0 ? value : 10_485_760;
}

export function getMaxRecipients(): number {
  const value = Number(process.env.MAX_RECIPIENTS ?? 500);
  return Number.isFinite(value) && value > 0 ? value : 500;
}

export function validateAttachment(
  attachment: z.infer<typeof attachmentSchema>,
): string | null {
  const ext = attachment.filename.includes(".")
    ? attachment.filename.slice(attachment.filename.lastIndexOf(".")).toLowerCase()
    : "";

  if (ext && !ALLOWED_ATTACHMENT_EXTENSIONS.has(ext)) {
    return "Attachment file type is not allowed.";
  }

  if (!ALLOWED_ATTACHMENT_MIMES.has(attachment.mimeType)) {
    return "Attachment MIME type is not allowed.";
  }

  const sizeBytes = Buffer.byteLength(attachment.base64, "base64");
  if (sizeBytes > getMaxAttachmentBytes()) {
    return `Attachment exceeds maximum size of ${getMaxAttachmentBytes()} bytes.`;
  }

  return null;
}
