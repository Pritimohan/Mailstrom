import type { InlineImage } from "@/types";

export const MAX_INLINE_IMAGE_BYTES = 5 * 1024 * 1024;
export const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024;
export const MAX_ATTACHMENTS = 10;
export const MAX_INLINE_IMAGES = 20;

export const ALLOWED_INLINE_IMAGE_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/gif",
  "image/webp",
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

export function generateCid(): string {
  return `img_${Date.now()}_${Math.random().toString(36).slice(2, 10)}@mailstrom`;
}

export async function fileToBase64(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i] ?? 0);
  }
  return btoa(binary);
}

export function isInlineImageFile(file: File): boolean {
  return ALLOWED_INLINE_IMAGE_TYPES.has(file.type.toLowerCase());
}

export function getFileExtension(filename: string): string {
  return filename.includes(".")
    ? filename.slice(filename.lastIndexOf(".")).toLowerCase()
    : "";
}

export function validateAttachmentFile(file: File): string | null {
  const ext = getFileExtension(file.name);
  if (ext && !ALLOWED_ATTACHMENT_EXTENSIONS.has(ext)) {
    return "Attachment file type is not allowed.";
  }
  if (file.size > MAX_ATTACHMENT_BYTES) {
    return `Attachment exceeds ${Math.round(MAX_ATTACHMENT_BYTES / 1024 / 1024)} MB limit.`;
  }
  return null;
}

export function validateInlineImageFile(file: File): string | null {
  if (!isInlineImageFile(file)) {
    return "Only PNG, JPG, GIF, and WebP images can be inserted inline.";
  }
  if (file.size > MAX_INLINE_IMAGE_BYTES) {
    return `Image exceeds ${Math.round(MAX_INLINE_IMAGE_BYTES / 1024 / 1024)} MB limit.`;
  }
  return null;
}

export async function fileToInlineImage(file: File): Promise<InlineImage> {
  const error = validateInlineImageFile(file);
  if (error) {
    throw new Error(error);
  }

  return {
    cid: generateCid(),
    filename: file.name,
    mimeType: file.type || "image/png",
    base64: await fileToBase64(file),
  };
}

export function filterInlineImagesForHtml(
  html: string,
  inlineImages: InlineImage[],
): InlineImage[] {
  return inlineImages.filter((image) => html.includes(`cid:${image.cid}`));
}

export function stripHtmlToText(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
