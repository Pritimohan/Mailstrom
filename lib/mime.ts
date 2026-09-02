import type { AttachmentPayload, InlineImage } from "@/types";

function encodeSubject(subject: string): string {
  if (/^[\x20-\x7E]*$/.test(subject)) {
    return subject;
  }
  const encoded = Buffer.from(subject, "utf-8").toString("base64");
  return `=?UTF-8?B?${encoded}?=`;
}

function wrapBase64(base64: string, lineLength = 76): string {
  const chunks: string[] = [];
  for (let i = 0; i < base64.length; i += lineLength) {
    chunks.push(base64.slice(i, i + lineLength));
  }
  return chunks.join("\r\n");
}

function buildInlineImagePart(boundary: string, image: InlineImage): string[] {
  return [
    `--${boundary}`,
    `Content-Type: ${image.mimeType}; name="${image.filename}"`,
    `Content-Transfer-Encoding: base64`,
    `Content-Disposition: inline; filename="${image.filename}"`,
    `Content-ID: <${image.cid}>`,
    "",
    wrapBase64(image.base64),
  ];
}

function buildAttachmentPart(boundary: string, attachment: AttachmentPayload): string[] {
  return [
    `--${boundary}`,
    `Content-Type: ${attachment.mimeType}; name="${attachment.filename}"`,
    `Content-Disposition: attachment; filename="${attachment.filename}"`,
    "Content-Transfer-Encoding: base64",
    "",
    wrapBase64(attachment.base64),
  ];
}

function buildRelatedBody(
  html: string,
  inlineImages: InlineImage[],
): { headers: string[]; body: string[] } {
  const boundary = `related_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  const headers = [
    `Content-Type: multipart/related; boundary="${boundary}"`,
  ];

  const body = [
    "",
    `--${boundary}`,
    "Content-Type: text/html; charset=UTF-8",
    "Content-Transfer-Encoding: 7bit",
    "",
    html,
    ...inlineImages.flatMap((image) => buildInlineImagePart(boundary, image)),
    `--${boundary}--`,
  ];

  return { headers, body };
}

export function buildMimeMessage(
  to: string,
  subject: string,
  html: string,
  attachments: AttachmentPayload[] = [],
  inlineImages: InlineImage[] = [],
): string {
  const headers = [
    `To: ${to}`,
    `Subject: ${encodeSubject(subject)}`,
    "MIME-Version: 1.0",
  ];

  const hasAttachments = attachments.length > 0;
  const hasInlineImages = inlineImages.length > 0;

  if (!hasAttachments && !hasInlineImages) {
    headers.push("Content-Type: text/html; charset=UTF-8");
    headers.push("Content-Transfer-Encoding: 7bit");
    return [...headers, "", html].join("\r\n");
  }

  if (!hasAttachments && hasInlineImages) {
    const related = buildRelatedBody(html, inlineImages);
    return [...headers, ...related.headers, ...related.body].join("\r\n");
  }

  const mixedBoundary = `mixed_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  headers.push(`Content-Type: multipart/mixed; boundary="${mixedBoundary}"`);

  const parts: string[] = [""];

  if (hasInlineImages) {
    const related = buildRelatedBody(html, inlineImages);
    parts.push(
      `--${mixedBoundary}`,
      ...related.headers,
      ...related.body,
    );
  } else {
    parts.push(
      `--${mixedBoundary}`,
      "Content-Type: text/html; charset=UTF-8",
      "Content-Transfer-Encoding: 7bit",
      "",
      html,
    );
  }

  for (const attachment of attachments) {
    parts.push(...buildAttachmentPart(mixedBoundary, attachment));
  }

  parts.push(`--${mixedBoundary}--`);

  return [...headers, ...parts].join("\r\n");
}

export function encodeRawMessage(raw: string): string {
  return Buffer.from(raw)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}
