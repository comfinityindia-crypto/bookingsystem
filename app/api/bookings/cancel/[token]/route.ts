import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { deleteCalendarEvent } from "@/lib/google-calendar";
import { demoStore } from "@/lib/demo-store";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    if (!token) {
      return NextResponse.json({ error: "Missing token" }, { status: 400 });
    }

    let booking: any = null;
    try {
      booking = await prisma.booking.findUnique({
        where: { cancellationToken: token },
        include: {
          employee: true,
          visitor: true,
        },
      });
    } catch {
      // Database not connected
    }

    if (!booking) {
      for (const d of demoStore.values()) {
        if (d.cancellationToken === token) {
          booking = d;
          d.status = "CANCELLED";
          return NextResponse.json({ success: true, bookingId: d.id });
        }
      }
      return NextResponse.json(
        { error: "Booking not found or already cancelled" },
        { status: 404 }
      );
    }

    if (booking.status === "CANCELLED") {
      return NextResponse.json(
        { message: "Booking is already cancelled", alreadyCancelled: true },
        { status: 200 }
      );
    }

    // 1. Update booking status in database
    await prisma.booking.update({
      where: { id: booking.id },
      data: { status: "CANCELLED" },
    });

    // 2. Delete Google Calendar event if connected
    if (
      booking.googleEventId &&
      booking.employee.googleCalendarConnected &&
      booking.employee.googleCalendarTokenEncrypted
    ) {
      try {
        await deleteCalendarEvent(
          booking.employee.googleCalendarTokenEncrypted,
          booking.googleEventId
        );
      } catch (err) {
        console.error("Failed to delete Google Calendar event:", err);
      }
    }

    return NextResponse.json({ success: true, bookingId: booking.id });
  } catch (error: any) {
    console.error("Cancellation error:", error);
    return NextResponse.json(
      { error: "Failed to cancel booking" },
      { status: 500 }
    );
  }
}
