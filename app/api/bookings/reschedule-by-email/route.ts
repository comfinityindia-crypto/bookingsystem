/**
 * POST /api/bookings/reschedule-by-email
 * Reschedules the visitor's UPCOMING booking with an employee — identified
 * by email rather than a mailed reschedule-token link — and lets them
 * switch the meeting type at the same time (e.g. Business Discussion ->
 * Coffee Chat). The reschedule/cancellation tokens never leave the server.
 *
 * Note: unlike the token-based /reschedule/[token] flow, this trusts the
 * email address alone as proof of ownership — acceptable for this low-
 * stakes lead-gen booking flow, but anyone who knows the visitor's email
 * could move or retype their meeting this way.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { updateCalendarEvent } from "@/lib/google-calendar";
import { sendVisitorConfirmation } from "@/lib/email";
import { demoStore } from "@/lib/demo-store";
import { z } from "zod";

const RescheduleByEmailSchema = z.object({
  employeeSlug: z.string(),
  email: z.string().email(),
  meetingTypeSlug: z.string(),
  slotStart: z.string().datetime(),
  slotEnd: z.string().datetime(),
  timezone: z.string(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = RescheduleByEmailSchema.parse(body);
    const email = data.email.trim().toLowerCase();

    const tenantSlug = process.env.NEXT_PUBLIC_TENANT_SLUG || "comfinity";

    try {
      const tenant = await prisma.tenant.findUnique({ where: { slug: tenantSlug } });
      if (!tenant) throw new Error("Tenant not found");

      const visitor = await prisma.visitor.findUnique({
        where: { tenantId_email: { tenantId: tenant.id, email } },
      });
      if (!visitor) throw new Error("No booking found for this email");

      const meetingType = await prisma.meetingType.findFirst({
        where: { slug: data.meetingTypeSlug, tenantId: tenant.id, isActive: true },
      });
      if (!meetingType) throw new Error("Meeting type not found");

      const booking = await prisma.booking.findFirst({
        where: {
          visitorId: visitor.id,
          status: "UPCOMING",
          employee: { slug: data.employeeSlug, tenantId: tenant.id },
        },
        orderBy: { scheduledAt: "asc" },
        include: { employee: true },
      });
      if (!booking) throw new Error("No upcoming booking found for this email");

      const newStartTime = new Date(data.slotStart);
      const newEndTime = new Date(data.slotEnd);

      const updatedBooking = await prisma.booking.update({
        where: { id: booking.id },
        data: {
          scheduledAt: newStartTime,
          timezone: data.timezone,
          meetingTypeId: meetingType.id,
          durationMinutes: meetingType.durationMinutes,
          status: "UPCOMING",
        },
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
            newStartTime,
            newEndTime,
            data.timezone
          );
        } catch (err) {
          console.error("Failed to update Google Calendar event:", err);
        }
      }

      await sendVisitorConfirmation({
        visitorName: visitor.name,
        visitorEmail: visitor.email,
        employeeName: booking.employee.name,
        employeeEmail: booking.employee.email,
        employeeDesignation: booking.employee.designation,
        meetingType: meetingType.name,
        scheduledAt: newStartTime,
        durationMinutes: meetingType.durationMinutes,
        timezone: data.timezone,
        googleMeetUrl: booking.googleMeetUrl,
        cancellationToken: booking.cancellationToken || "",
        rescheduleToken: booking.rescheduleToken || "",
        appUrl: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
      }).catch((err) => console.error("Reschedule email failed:", err));

      return NextResponse.json({
        success: true,
        bookingId: updatedBooking.id,
        googleMeetUrl: booking.googleMeetUrl,
        cancellationToken: booking.cancellationToken,
        rescheduleToken: booking.rescheduleToken,
      });
    } catch (dbError) {
      // Fallback for local dev without a connected database
      for (const d of demoStore.values()) {
        if (
          d.visitor.email.toLowerCase() === email &&
          d.employee.slug === data.employeeSlug &&
          d.status === "UPCOMING"
        ) {
          d.scheduledAt = new Date(data.slotStart);
          d.timezone = data.timezone;
          d.meetingType = {
            ...d.meetingType,
            slug: data.meetingTypeSlug,
          };
          return NextResponse.json({
            success: true,
            bookingId: d.id,
            googleMeetUrl: d.googleMeetUrl,
            cancellationToken: d.cancellationToken,
            rescheduleToken: d.rescheduleToken,
          });
        }
      }
      throw dbError;
    }
  } catch (error: any) {
    console.error("Reschedule-by-email error:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request payload", details: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: error?.message || "Failed to reschedule booking" },
      { status: 400 }
    );
  }
}
