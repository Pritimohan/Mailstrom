import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { generateOAuthState, getGoogleAuthUrl } from "@/lib/oauth";

export async function GET() {
  try {
    const session = await getSession();
    const state = generateOAuthState();
    session.oauthState = state;
    await session.save();

    const url = getGoogleAuthUrl(state);
    return NextResponse.redirect(url);
  } catch (error) {
    console.error("OAuth redirect failed:", error);
    return NextResponse.redirect(
      new URL("/?error=auth_config", process.env.APP_URL ?? "http://localhost:3000"),
    );
  }
}
