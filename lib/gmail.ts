import { google } from "googleapis";
import type { SessionData } from "@/lib/session";
import { createOAuth2Client } from "@/lib/oauth";
import { buildMimeMessage, encodeRawMessage } from "@/lib/mime";
import type { AttachmentPayload } from "@/types";

export function mapGmailError(error: unknown): string {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    if (message.includes("gmail api has not been used") || message.includes("it is disabled")) {
      return "Gmail API is not enabled for your Google Cloud project. Enable Gmail API in Google Cloud Console, wait 2–5 minutes, then try again.";
    }
    if (message.includes("insufficient authentication scopes")) {
      return "Gmail send permission is missing. Disconnect, then Connect Gmail again and approve the send access prompt.";
    }
    if (message.includes("invalid_grant") || message.includes("unauthorized")) {
      return "Gmail authorization expired. Please reconnect your account.";
    }
    if (message.includes("quota") || message.includes("rate limit")) {
      return "Gmail sending limit reached. Try again later.";
    }
    if (message.includes("invalid to")) {
      return "Invalid recipient email address.";
    }
    return "Failed to send email. Please try again.";
  }
  return "An unexpected error occurred while sending.";
}

async function getAuthenticatedClient(session: SessionData) {
  if (!session.refreshToken) {
    throw new Error("Not authenticated");
  }

  const client = createOAuth2Client();
  client.setCredentials({
    access_token: session.accessToken,
    refresh_token: session.refreshToken,
    expiry_date: session.expiresAt,
  });

  const now = Date.now();
  if (!session.expiresAt || session.expiresAt <= now + 60_000) {
    const { credentials } = await client.refreshAccessToken();
    session.accessToken = credentials.access_token ?? session.accessToken;
    session.expiresAt = credentials.expiry_date ?? session.expiresAt;
    if (credentials.refresh_token) {
      session.refreshToken = credentials.refresh_token;
    }
  }

  return client;
}

export async function sendEmail(
  session: SessionData,
  to: string,
  subject: string,
  html: string,
  attachment?: AttachmentPayload,
): Promise<{ messageId: string; session: SessionData }> {
  const client = await getAuthenticatedClient(session);
  const gmail = google.gmail({ version: "v1", auth: client });

  const raw = buildMimeMessage(to, subject, html, attachment);
  const encoded = encodeRawMessage(raw);

  const response = await gmail.users.messages.send({
    userId: "me",
    requestBody: { raw: encoded },
  });

  const messageId = response.data.id;
  if (!messageId) {
    throw new Error("Gmail did not return a message ID");
  }

  return { messageId, session };
}
