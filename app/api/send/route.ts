import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { sendEmail, mapGmailError } from "@/lib/gmail";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import {
  sendEmailSchema,
  validateAttachment,
} from "@/lib/validators";

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const rateLimit = checkRateLimit(ip);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: "Rate limit exceeded. Please wait before sending more emails.",
        },
        {
          status: 429,
          headers: rateLimit.retryAfterMs
            ? { "Retry-After": String(Math.ceil(rateLimit.retryAfterMs / 1000)) }
            : undefined,
        },
      );
    }

    const session = await getSession();
    if (!session.refreshToken) {
      return NextResponse.json(
        { success: false, error: "Not authenticated. Connect Gmail first." },
        { status: 401 },
      );
    }

    const body = await request.json();
    const parsed = sendEmailSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Invalid request payload." },
        { status: 400 },
      );
    }

    if (parsed.data.attachment) {
      const attachmentError = validateAttachment(parsed.data.attachment);
      if (attachmentError) {
        return NextResponse.json(
          { success: false, error: attachmentError },
          { status: 400 },
        );
      }
    }

    const html = parsed.data.html.includes("<")
      ? parsed.data.html
      : parsed.data.html.replace(/\n/g, "<br>");

    const { messageId, session: updatedSession } = await sendEmail(
      session,
      parsed.data.to,
      parsed.data.subject,
      html,
      parsed.data.attachment,
    );

    session.accessToken = updatedSession.accessToken;
    session.refreshToken = updatedSession.refreshToken;
    session.expiresAt = updatedSession.expiresAt;
    await session.save();

    return NextResponse.json({ success: true, messageId });
  } catch (error) {
    console.error("Send email failed:", error);
    return NextResponse.json(
      { success: false, error: mapGmailError(error) },
      { status: 500 },
    );
  }
}
