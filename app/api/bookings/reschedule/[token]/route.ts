import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { updateCalendarEvent } from "@/lib/google-calendar";
import { sendVisitorConfirmation } from "@/lib/email";
import { demoStore } from "@/lib/demo-store";
import { z } from "zod";

const RescheduleSchema = z.object({
  slotStart: z.string().datetime(),
  slotEnd: z.string().datetime(),
  timezone: z.string(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const body = await request.json();
    const data = RescheduleSchema.parse(body);

    if (!token) {
      return NextResponse.json({ error: "Missing token" }, { status: 400 });
    }

    let booking: any = null;
    try {
      booking = await prisma.booking.findUnique({
        where: { rescheduleToken: token },
        include: {
          employee: true,
          visitor: true,
          meetingType: true,
          answers: true,
        },
      });
    } catch {
      // Database not connected
    }

    if (!booking) {
      for (const d of demoStore.values()) {
        if (d.rescheduleToken === token) {
          booking = d;
          d.scheduledAt = new Date(data.slotStart);
          d.timezone = data.timezone;
          d.status = "UPCOMING";
          return NextResponse.json({ success: true, bookingId: d.id });
        }
      }
      return NextResponse.json(
        { error: "Booking not found or invalid reschedule token" },
        { status: 404 }
      );
    }

    if (booking.status === "CANCELLED") {
      return NextResponse.json(
        { error: "This booking has been cancelled and cannot be rescheduled" },
        { status: 400 }
      );
    }

    const newStartTime = new Date(data.slotStart);
    const newEndTime = new Date(data.slotEnd);

    // 1. Update database booking
    const updatedBooking = await prisma.booking.update({
      where: { id: booking.id },
      data: {
        scheduledAt: newStartTime,
        timezone: data.timezone,
        status: "UPCOMING",
      },
    });

    // 2. Update Google Calendar event if connected
    if (
      booking.googleEventId &&
      booking.employee.googleCalendarConnected &&
      booking.employee.googleCalendarTokenEncrypted
    ) {
      try {
        await updateCalendarEvent(
          booking.employee.googleCalendarTokenEncrypted,
          booking.googleEventId,
          newStartTime,
          newEndTime,
          data.timezone
        );
      } catch (err) {
        console.error("Failed to update Google Calendar event:", err);
      }
    }

    // 3. Send updated confirmation email
    const topicAnswer = booking.answers?.find(
      (a: any) => a.question === "Meeting Topic / Notes"
    );

    sendVisitorConfirmation({
      visitorName: booking.visitor.name,
      visitorEmail: booking.visitor.email,
      employeeName: booking.employee.name,
      employeeEmail: booking.employee.email,
      employeeDesignation: booking.employee.designation,
      meetingType: booking.meetingType.name,
      scheduledAt: newStartTime,
      durationMinutes: booking.durationMinutes,
      timezone: data.timezone,
      googleMeetUrl: booking.googleMeetUrl,
      meetingTopic: topicAnswer?.answer,
      cancellationToken: booking.cancellationToken || "",
      rescheduleToken: booking.rescheduleToken || "",
      appUrl: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    }).catch((err) => console.error("Reschedule email failed:", err));

    return NextResponse.json({
      success: true,
      bookingId: updatedBooking.id,
    });
  } catch (error: any) {
    console.error("Reschedule error:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request payload", details: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to reschedule booking" },
      { status: 500 }
    );
  }
}
