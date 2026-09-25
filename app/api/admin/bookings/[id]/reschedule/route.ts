/**
 * POST /api/admin/bookings/[id]/reschedule
 * Lets the team move a booking to a new time from the admin panel.
 * Body: { newStart: "2026-09-26T15:00" } — wall-clock in the employee's timezone.
 * Updates the Google Calendar event and emails the visitor about the change.
 * Protected by the admin Basic Auth gate in proxy.ts.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { updateCalendarEvent } from "@/lib/google-calendar";
import { sendVisitorConfirmation } from "@/lib/email";
import { fromZonedTime } from "date-fns-tz";
import { addMinutes } from "date-fns";
import { z } from "zod";

const RescheduleSchema = z.object({
  newStart: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const data = RescheduleSchema.parse(await request.json());

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: { employee: true, visitor: true, meetingType: true, answers: true },
    });
    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }
    if (booking.status !== "UPCOMING") {
      return NextResponse.json(
        { error: "Only upcoming bookings can be rescheduled" },
        { status: 400 }
      );
    }

    const previousStart = booking.scheduledAt;
    const newStart = fromZonedTime(data.newStart, booking.employee.timezone);
    const newEnd = addMinutes(newStart, booking.durationMinutes);

    if (newStart.getTime() === previousStart.getTime()) {
      return NextResponse.json({ error: "That is already the meeting time" }, { status: 400 });
    }

    await prisma.booking.update({
      where: { id: booking.id },
      data: { scheduledAt: newStart },
    });

    if (
      booking.googleEventId &&
      booking.employee.googleCalendarConnected &&
      booking.employee.googleCalendarTokenEncrypted
    ) {
      try {
        await updateCalendarEvent(
          booking.employee.googleCalendarTokenEncrypted,
          booking.googleEventId,
          newStart,
          newEnd,
          booking.timezone
        );
      } catch (err) {
        console.error("Failed to update Google Calendar event:", err);
      }
    }

    const topicAnswer = booking.answers.find((a) => a.question === "Meeting Topic / Notes");

    let emailSent = true;
    await sendVisitorConfirmation({
      visitorName: booking.visitor.name,
      visitorEmail: booking.visitor.email,
      employeeName: booking.employee.name,
      employeeEmail: booking.employee.email,
      employeeDesignation: booking.employee.designation,
      meetingType: booking.meetingType.name,
      scheduledAt: newStart,
      previousScheduledAt: previousStart,
      durationMinutes: booking.durationMinutes,
      timezone: booking.timezone,
      googleMeetUrl: booking.googleMeetUrl,
      meetingTopic: topicAnswer?.answer,
      cancellationToken: booking.cancellationToken || "",
      rescheduleToken: booking.rescheduleToken || "",
      appUrl: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    }).catch((err) => {
      emailSent = false;
      console.error("Time-change email failed:", err);
    });

    return NextResponse.json({ success: true, emailSent });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid request data" }, { status: 400 });
    }
    console.error("Admin reschedule error:", error);
    return NextResponse.json({ error: "Failed to change meeting time" }, { status: 500 });
  }
}
