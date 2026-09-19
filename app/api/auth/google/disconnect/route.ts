import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const { employeeId } = await request.json();

    if (!employeeId) {
      return NextResponse.json({ error: "Missing employeeId" }, { status: 400 });
    }

    await prisma.employee.update({
      where: { id: employeeId },
      data: {
        googleCalendarConnected: false,
        googleCalendarEmail: null,
        googleCalendarTokenEncrypted: null,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Disconnect error:", error);
    return NextResponse.json({ error: "Failed to disconnect calendar" }, { status: 500 });
  }
}
