/**
 * GET /api/bookings/available-slots
 * Returns available time slots for an employee on a given date.
 * Sprint 1: Uses mock busy slots. Sprint 2: Connects to Google Calendar.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { computeAvailableSlots, MOCK_BUSY_SLOTS } from "@/lib/slots";
import { getFreeBusy } from "@/lib/google-calendar";
import { startOfDay, endOfDay, addDays, addMinutes } from "date-fns";
import { toZonedTime } from "date-fns-tz";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const employeeSlug = searchParams.get("employee");
  const meetingTypeSlug = searchParams.get("meetingType");
  const dateStr = searchParams.get("date");
  const timezone = searchParams.get("timezone") || "Asia/Kolkata";

  if (!employeeSlug || !meetingTypeSlug || !dateStr) {
    return NextResponse.json({ error: "Missing required params" }, { status: 400 });
  }

  const date = new Date(dateStr);
  if (isNaN(date.getTime())) {
    return NextResponse.json({ error: "Invalid date" }, { status: 400 });
  }

  try {
    const tenantSlug = process.env.NEXT_PUBLIC_TENANT_SLUG || "comfinity";

    // Fetch employee + meeting type from DB
    const employee = await prisma.employee.findFirst({
      where: { slug: employeeSlug, tenant: { slug: tenantSlug }, isActive: true },
      include: {
        availability: true,
        holidays: true,
        blockedTimes: { where: { end: { gt: new Date() } } },
      },
    });

    const meetingType = await prisma.meetingType.findFirst({
      where: { slug: meetingTypeSlug, isActive: true },
      select: { durationMinutes: true, bufferAfter: true },
    });

    if (!employee || !meetingType) {
      // Dev fallback: return mock slots
      return NextResponse.json({
        slots: getMockSlots(date, 30, timezone),
      });
    }

    // Count existing bookings for this date (for daily limit check)
    const dayStart = startOfDay(toZonedTime(date, employee.timezone));
    const dayEnd = endOfDay(toZonedTime(date, employee.timezone));

    const existingCount = await prisma.booking.count({
      where: {
        employeeId: employee.id,
        scheduledAt: { gte: dayStart, lte: dayEnd },
        status: { in: ["UPCOMING"] },
      },
    });

    // Fetch busy slots — real Google Calendar if connected, else mock
    let busySlots = MOCK_BUSY_SLOTS;
    if (employee.googleCalendarConnected && employee.googleCalendarTokenEncrypted && employee.googleCalendarEmail) {
      try {
        busySlots = await getFreeBusy(
          employee.googleCalendarTokenEncrypted,
          employee.googleCalendarEmail,
          startOfDay(date),
          addDays(startOfDay(date), 1)
        );
      } catch {
        busySlots = MOCK_BUSY_SLOTS;
      }
    }

    // Admin-blocked times. The slot engine pads every busy range with the
    // post-meeting buffer, so trim it here to block exactly what was marked.
    busySlots = [
      ...busySlots,
      ...employee.blockedTimes.map((b) => ({
        start: b.start,
        end: addMinutes(b.end, -employee.bufferMinutes),
      })),
    ];

    const config = {
      timezone: employee.timezone,
      dailyMeetingLimit: employee.dailyMeetingLimit,
      bufferMinutes: employee.bufferMinutes,
      workingHours: employee.availability.map((a) => ({
        dayOfWeek: a.dayOfWeek,
        startTime: a.startTime,
        endTime: a.endTime,
        isAvailable: a.isAvailable,
      })),
      holidays: employee.holidays.map((h) => h.date),
      vacationMode: employee.vacationMode,
      vacationStart: employee.vacationStart,
      vacationEnd: employee.vacationEnd,
    };

    const slots = computeAvailableSlots(
      date,
      meetingType.durationMinutes,
      config,
      busySlots,
      timezone,
      existingCount
    );

    return NextResponse.json({ slots });
  } catch (error) {
    console.error("Slot computation error:", error);
    // Fallback to mock slots on any error
    return NextResponse.json({
      slots: getMockSlots(date, 30, timezone),
    });
  }
}

/** Generate mock slots for development (9 AM – 5 PM in 30 min increments) */
function getMockSlots(date: Date, durationMinutes: number, timezone: string) {
  const slots = [];
  const today = new Date();
  const isToday =
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate();

  for (let hour = 9; hour <= 17; hour++) {
    for (const minute of [0, 30]) {
      if (hour === 17 && minute === 30) break;
      // Skip past times for today
      if (isToday && (hour < today.getHours() || (hour === today.getHours() && minute <= today.getMinutes()))) continue;
      // Mock: skip 10 AM and 2 PM (pretend they're busy)
      if ((hour === 10 && minute === 0) || (hour === 14 && minute === 0)) continue;

      const slotDate = new Date(date);
      slotDate.setUTCHours(hour - 5, minute - 30, 0, 0); // Rough IST->UTC

      const endDate = new Date(slotDate);
      endDate.setMinutes(endDate.getMinutes() + durationMinutes);

      const formatter = new Intl.DateTimeFormat("en-US", {
        timeZone: timezone,
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });

      slots.push({
        start: slotDate.toISOString(),
        end: endDate.toISOString(),
        startLocal: slotDate.toISOString(),
        endLocal: endDate.toISOString(),
        label: formatter.format(slotDate),
      });
    }
  }
  return slots;
}
