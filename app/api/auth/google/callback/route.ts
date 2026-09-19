import { NextRequest, NextResponse } from "next/server";
import { exchangeCodeForTokens } from "@/lib/google-calendar";
import { encrypt } from "@/lib/encryption";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get("code");
  const employeeId = searchParams.get("state"); // state passes the employee ID
  const error = searchParams.get("error");

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  if (error || !code || !employeeId) {
    console.error("Google OAuth error or missing params:", { error, code, employeeId });
    return NextResponse.redirect(
      `${appUrl}/admin/employees?error=${encodeURIComponent(error || "Authorization failed")}`
    );
  }

  try {
    const { tokens, email } = await exchangeCodeForTokens(code);
    const encryptedToken = encrypt(JSON.stringify(tokens));

    await prisma.employee.update({
      where: { id: employeeId },
      data: {
        googleCalendarConnected: true,
        googleCalendarEmail: email,
        googleCalendarTokenEncrypted: encryptedToken,
      },
    });

    return NextResponse.redirect(
      `${appUrl}/admin/employees?success=calendar_connected&employeeId=${employeeId}`
    );
  } catch (err: any) {
    console.error("Failed to exchange tokens or update employee:", err);
    return NextResponse.redirect(
      `${appUrl}/admin/employees?error=${encodeURIComponent(err.message || "Failed to connect calendar")}`
    );
  }
}
