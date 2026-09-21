import { NextRequest, NextResponse } from "next/server";
import { getGoogleAuthUrl } from "@/lib/google-calendar";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const employeeId = searchParams.get("employeeId");
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  if (!employeeId) {
    return NextResponse.json({ error: "Missing employeeId" }, { status: 400 });
  }

  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    return NextResponse.redirect(
      `${appUrl}/admin/employees?error=${encodeURIComponent(
        "Google Client ID & Secret are not configured in .env.local. Please add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET first."
      )}`
    );
  }

  // Generate OAuth URL and redirect
  const authUrl = getGoogleAuthUrl(employeeId);
  return NextResponse.redirect(authUrl);
}
