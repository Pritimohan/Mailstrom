import { getIronSession, SessionOptions } from "iron-session";
import { cookies } from "next/headers";

export interface SessionData {
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: number;
  userEmail?: string;
  oauthState?: string;
}

const DEV_FALLBACK_SECRET = "development-only-secret-min-32-chars!!";

function getSessionPassword(): string {
  const secret = process.env.SESSION_SECRET?.trim();
  if (secret && secret.length >= 32) {
    return secret;
  }
  if (process.env.NODE_ENV === "production") {
    throw new Error("SESSION_SECRET must be set and at least 32 characters");
  }
  return DEV_FALLBACK_SECRET;
}

const baseSessionOptions: Omit<SessionOptions, "password"> = {
  cookieName: "gmail-sender-session",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 14,
    path: "/",
  },
};

export async function getSession() {
  const cookieStore = await cookies();
  return getIronSession<SessionData>(cookieStore, {
    ...baseSessionOptions,
    password: getSessionPassword(),
  });
}
