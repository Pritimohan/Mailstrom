import { google } from "googleapis";
import crypto from "crypto";

export const GMAIL_SEND_SCOPE = "https://www.googleapis.com/auth/gmail.send";
export const USERINFO_EMAIL_SCOPE =
  "https://www.googleapis.com/auth/userinfo.email";

export const OAUTH_SCOPES = [GMAIL_SEND_SCOPE, USERINFO_EMAIL_SCOPE];

function getAppUrl(): string {
  const url = process.env.APP_URL;
  if (!url) {
    throw new Error("APP_URL must be set");
  }
  return url.replace(/\/$/, "");
}

export function createOAuth2Client() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must be set");
  }

  return new google.auth.OAuth2(
    clientId,
    clientSecret,
    `${getAppUrl()}/api/auth/callback`,
  );
}

export function generateOAuthState(): string {
  return crypto.randomBytes(32).toString("hex");
}

export function getGoogleAuthUrl(state: string): string {
  const client = createOAuth2Client();
  return client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: OAUTH_SCOPES,
    state,
    include_granted_scopes: true,
  });
}

export async function exchangeCodeForTokens(code: string) {
  const client = createOAuth2Client();
  const { tokens } = await client.getToken(code);
  return tokens;
}

export async function fetchUserEmail(accessToken: string): Promise<string> {
  const client = createOAuth2Client();
  client.setCredentials({ access_token: accessToken });
  const oauth2 = google.oauth2({ version: "v2", auth: client });
  const { data } = await oauth2.userinfo.get();
  const email = data.email;
  if (!email) {
    throw new Error("Could not retrieve email from Google account");
  }
  return email;
}
