import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import {
  exchangeCodeForTokens,
  fetchUserEmail,
} from "@/lib/oauth";

function redirectWithMessage(path: string, params: Record<string, string>) {
  const base = process.env.APP_URL ?? "http://localhost:3000";
  const url = new URL(path, base);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  return NextResponse.redirect(url);
}

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const oauthError = request.nextUrl.searchParams.get("error");

  if (oauthError) {
    return redirectWithMessage("/", { error: "auth_denied" });
  }

  if (!code || !state) {
    return redirectWithMessage("/", { error: "auth_invalid" });
  }

  try {
    const session = await getSession();

    if (!session.oauthState || session.oauthState !== state) {
      return redirectWithMessage("/", { error: "auth_state" });
    }

    const tokens = await exchangeCodeForTokens(code);
    if (!tokens.access_token || !tokens.refresh_token) {
      return redirectWithMessage("/", { error: "auth_tokens" });
    }

    const grantedScopes = (tokens.scope ?? "").split(/\s+/);
    const hasGmailSend = grantedScopes.some(
      (scope) =>
        scope === "https://www.googleapis.com/auth/gmail.send" ||
        scope === "https://www.googleapis.com/auth/gmail.compose" ||
        scope === "https://mail.google.com/",
    );
    if (!hasGmailSend) {
      return redirectWithMessage("/", { error: "auth_scopes" });
    }

    const userEmail = await fetchUserEmail(tokens.access_token);

    session.accessToken = tokens.access_token;
    session.refreshToken = tokens.refresh_token;
    session.expiresAt = tokens.expiry_date ?? Date.now() + 3600 * 1000;
    session.userEmail = userEmail;
    session.oauthState = undefined;
    await session.save();

    return redirectWithMessage("/", { connected: "1" });
  } catch (error) {
    console.error("OAuth callback failed:", error);
    return redirectWithMessage("/", { error: "auth_failed" });
  }
}
