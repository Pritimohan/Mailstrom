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

export const ALLOWED_INLINE_IMAGE_MIMES = new Set([
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/gif",
  "image/webp",
]);

const attachmentSchema = z.object({
  filename: z.string().min(1).max(255),
  mimeType: z.string().min(1).max(127),
  base64: z.string().min(1),
});

const inlineImageSchema = z.object({
  cid: z.string().min(1).max(255),
  filename: z.string().min(1).max(255),
  mimeType: z.string().min(1).max(127),
  base64: z.string().min(1),
});

export const sendEmailSchema = z.object({
  to: z.string().email(),
  subject: z.string().min(1).max(998),
  html: z.string().min(1).max(500_000),
  attachments: z.array(attachmentSchema).max(10).optional(),
  inlineImages: z.array(inlineImageSchema).max(20).optional(),
});

export function getMaxAttachmentBytes(): number {
  const value = Number(process.env.MAX_ATTACHMENT_BYTES ?? 10_485_760);
  return Number.isFinite(value) && value > 0 ? value : 10_485_760;
}

export function getMaxInlineImageBytes(): number {
  return 5 * 1024 * 1024;
}

export function getMaxRecipients(): number {
  const value = Number(process.env.MAX_RECIPIENTS ?? 500);
  return Number.isFinite(value) && value > 0 ? value : 500;
}

function getPayloadSizeBytes(base64: string): number {
  return Buffer.byteLength(base64, "base64");
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

  const sizeBytes = getPayloadSizeBytes(attachment.base64);
  if (sizeBytes > getMaxAttachmentBytes()) {
    return `Attachment exceeds maximum size of ${getMaxAttachmentBytes()} bytes.`;
  }

  return null;
}

export function validateInlineImage(
  image: z.infer<typeof inlineImageSchema>,
): string | null {
  if (!ALLOWED_INLINE_IMAGE_MIMES.has(image.mimeType)) {
    return "Inline image MIME type is not allowed.";
  }

  const sizeBytes = getPayloadSizeBytes(image.base64);
  if (sizeBytes > getMaxInlineImageBytes()) {
    return `Inline image exceeds maximum size of ${getMaxInlineImageBytes()} bytes.`;
  }

  return null;
}

export function validateSendPayload(
  payload: z.infer<typeof sendEmailSchema>,
): string | null {
  const attachments = payload.attachments ?? [];
  const inlineImages = payload.inlineImages ?? [];

  for (const attachment of attachments) {
    const error = validateAttachment(attachment);
    if (error) return error;
  }

  for (const image of inlineImages) {
    const error = validateInlineImage(image);
    if (error) return error;
  }

  const totalBytes =
    attachments.reduce((sum, item) => sum + getPayloadSizeBytes(item.base64), 0) +
    inlineImages.reduce((sum, item) => sum + getPayloadSizeBytes(item.base64), 0);

  const maxTotalBytes = getMaxAttachmentBytes() * 3;
  if (totalBytes > maxTotalBytes) {
    return "Combined attachment and inline image size exceeds the allowed limit.";
  }

  for (const image of inlineImages) {
    if (!payload.html.includes(`cid:${image.cid}`)) {
      return "Inline image is not referenced in the email body.";
    }
  }

  return null;
}
