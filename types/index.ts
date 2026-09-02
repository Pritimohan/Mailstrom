export interface SpreadsheetData {
  headers: string[];
  rows: Record<string, string>[];
}

export interface ParsedEmails {
  valid: string[];
  invalid: string[];
}

export interface AttachmentPayload {
  filename: string;
  mimeType: string;
  base64: string;
}

export interface InlineImage {
  cid: string;
  filename: string;
  mimeType: string;
  base64: string;
}

export interface SendLogEntry {
  email: string;
  status: "sent" | "failed";
  error?: string;
  timestamp: string;
}

export interface AuthStatus {
  connected: boolean;
  email?: string;
}

export interface SendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}
