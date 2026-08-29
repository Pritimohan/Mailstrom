import type { AttachmentPayload } from "@/types";

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

export function buildMimeMessage(
  to: string,
  subject: string,
  html: string,
  attachment?: AttachmentPayload,
): string {
  const boundary = `boundary_${Date.now()}_${Math.random().toString(36).slice(2)}`;

  const headers = [
    `To: ${to}`,
    `Subject: ${encodeSubject(subject)}`,
    "MIME-Version: 1.0",
  ];

  if (attachment) {
    headers.push(`Content-Type: multipart/mixed; boundary="${boundary}"`);
    const parts = [
      "",
      `--${boundary}`,
      "Content-Type: text/html; charset=UTF-8",
      "Content-Transfer-Encoding: 7bit",
      "",
      html,
      `--${boundary}`,
      `Content-Type: ${attachment.mimeType}; name="${attachment.filename}"`,
      `Content-Disposition: attachment; filename="${attachment.filename}"`,
      "Content-Transfer-Encoding: base64",
      "",
      wrapBase64(attachment.base64),
      `--${boundary}--`,
    ];
    return [...headers, ...parts].join("\r\n");
  }

  headers.push("Content-Type: text/html; charset=UTF-8");
  headers.push("Content-Transfer-Encoding: 7bit");
  return [...headers, "", html].join("\r\n");
}

export function encodeRawMessage(raw: string): string {
  return Buffer.from(raw)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}
