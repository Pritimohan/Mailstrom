import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";

export async function GET() {
  try {
    const session = await getSession();
    const connected = Boolean(session.refreshToken && session.userEmail);

    return NextResponse.json({
      connected,
      email: connected ? session.userEmail : undefined,
    });
  } catch (error) {
    console.error("Auth status failed:", error);
    return NextResponse.json({ connected: false }, { status: 500 });
  }
}
