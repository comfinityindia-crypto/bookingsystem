import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createCalendarEvent } from "@/lib/google-calendar";
import { sendVisitorConfirmation, sendEmployeeNotification } from "@/lib/email";
import { generateToken } from "@/lib/utils";
import { demoStore } from "@/lib/demo-store";
import { z } from "zod";

const CreateBookingSchema = z.object({
  employeeSlug: z.string(),
  meetingTypeSlug: z.string(),
  slotStart: z.string().datetime(),
  slotEnd: z.string().datetime(),
  timezone: z.string(),
  meetingTopic: z.string().optional(),
  answers: z.array(z.object({ question: z.string(), answer: z.string() })).optional(),
  selectedIntent: z.string().optional(),
  visitor: z.object({
    name: z.string().min(1),
    email: z.string().email(),
    company: z.string().optional(),
    phone: z.string().optional(),
  }),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = CreateBookingSchema.parse(body);

    const tenantSlug = process.env.NEXT_PUBLIC_TENANT_SLUG || "comfinity";

    // 1. Generate tokens
    const cancellationToken = generateToken();
    const rescheduleToken = generateToken();

    // 2. Build answers
    const answerEntries = (data.answers || []).map((a, i) => ({
      question: a.question,
      answer: a.answer,
      sequence: i,
    }));
    if (data.meetingTopic) {
      answerEntries.push({
        question: "Meeting Topic / Notes",
        answer: data.meetingTopic,
        sequence: answerEntries.length,
      });
    }

    let bookingId = "";
    let employeeName = "Team Member";
    let employeeEmail =
      data.employeeSlug === "sooraj"
        ? "comfinityindia@gmail.com"
        : `${data.employeeSlug}@comfinity.com`;
    let employeeDesignation = "Representative";
    let meetingTypeName = "Meeting";
    let durationMinutes = 30;
    let googleMeetUrl: string | null = null;

    try {
      // ── Database Operations ──
      const tenant = await prisma.tenant.findUnique({ where: { slug: tenantSlug } });
      if (!tenant) throw new Error("Tenant not found");

      const employee = await prisma.employee.findFirst({
        where: { slug: data.employeeSlug, tenantId: tenant.id, isActive: true },
      });
      if (!employee) throw new Error("Employee not found");

      const meetingType = await prisma.meetingType.findFirst({
        where: { slug: data.meetingTypeSlug, tenantId: tenant.id, isActive: true },
      });
      if (!meetingType) throw new Error("Meeting type not found");

      employeeName = employee.name;
      employeeEmail = employee.email;
      employeeDesignation = employee.designation;
      meetingTypeName = meetingType.name;
      durationMinutes = meetingType.durationMinutes;

      // Upsert visitor
      const visitor = await prisma.visitor.upsert({
        where: { tenantId_email: { tenantId: tenant.id, email: data.visitor.email } },
        create: {
          tenantId: tenant.id,
          name: data.visitor.name,
          email: data.visitor.email,
          company: data.visitor.company,
          phone: data.visitor.phone,
          firstMeetingAt: new Date(data.slotStart),
          lastMeetingAt: new Date(data.slotStart),
          totalMeetings: 1,
        },
        update: {
          name: data.visitor.name,
          company: data.visitor.company,
          phone: data.visitor.phone,
          lastMeetingAt: new Date(data.slotStart),
          totalMeetings: { increment: 1 },
        },
      });

      // Create booking record
      const booking = await prisma.booking.create({
        data: {
          tenantId: tenant.id,
          employeeId: employee.id,
          visitorId: visitor.id,
          meetingTypeId: meetingType.id,
          scheduledAt: new Date(data.slotStart),
          durationMinutes: meetingType.durationMinutes,
          timezone: data.timezone,
          status: "UPCOMING",
          cancellationToken,
          rescheduleToken,
          answers: answerEntries.length > 0 ? { create: answerEntries } : undefined,
        },
      });

      bookingId = booking.id;

      // Create Google Calendar event if employee connected Google Calendar
      if (employee.googleCalendarConnected && employee.googleCalendarTokenEncrypted && employee.googleCalendarEmail) {
        try {
          const created = await createCalendarEvent(employee.googleCalendarTokenEncrypted, {
            summary: `${meetingType.name} — ${visitor.name} × ${employee.name}`,
            description: `Meeting with ${visitor.name}${visitor.company ? ` (${visitor.company})` : ""}\nTopic: ${data.meetingTopic || "General Discussion"}\n\nBooked via Comfinity`,
            startTime: new Date(data.slotStart),
            endTime: new Date(data.slotEnd),
            attendeeEmails: [visitor.email, employee.email],
            organizerEmail: employee.googleCalendarEmail,
            timezone: data.timezone,
          });
          googleMeetUrl = created.googleMeetUrl;

          await prisma.booking.update({
            where: { id: booking.id },
            data: { googleEventId: created.googleEventId, googleMeetUrl },
          });
        } catch (err) {
          console.error("Google Calendar event creation failed:", err);
        }
      }
    } catch (dbError) {
      console.warn(
        "[ARMI] Database not available or table query failed. Storing in local demoStore for testing without PostgreSQL:",
        dbError
      );

      // Fallback in-memory booking for local testing
      bookingId = `demo-${Date.now()}`;
      const nameMap: Record<string, string> = {
        sooraj: "Sooraj Sudevan",
      };
      const desigMap: Record<string, string> = {
        sooraj: "Co-Founder",
      };
      const typeMap: Record<string, string> = {
        "coffee-chat": "Virtual Coffee Chat",
        "business-discussion": "Business Discussion",
        "partnership-discussion": "Partnership Discussion",
      };

      employeeName = nameMap[data.employeeSlug] || "Sooraj Sudevan";
      employeeDesignation = desigMap[data.employeeSlug] || "Co-Founder";
      meetingTypeName = typeMap[data.meetingTypeSlug] || "Business Discussion";
      googleMeetUrl = "https://meet.google.com/com-fini-ty";

      demoStore.set(bookingId, {
        id: bookingId,
        tenantId: "comfinity",
        employeeId: `seed-${data.employeeSlug}`,
        employee: {
          name: employeeName,
          designation: employeeDesignation,
          photoUrl: null,
          slug: data.employeeSlug,
          email: employeeEmail,
        },
        meetingType: {
          name: meetingTypeName,
          emoji: "💡",
          slug: data.meetingTypeSlug,
          durationMinutes: 30,
        },
        visitor: data.visitor,
        scheduledAt: new Date(data.slotStart),
        durationMinutes: 30,
        timezone: data.timezone,
        status: "UPCOMING",
        googleMeetUrl,
        cancellationToken,
        rescheduleToken,
        answers: answerEntries,
      });
    }

    // Send emails (won't fail or block if email fails)
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const emailData = {
      visitorName: data.visitor.name,
      visitorEmail: data.visitor.email,
      employeeName,
      employeeEmail,
      employeeDesignation,
      meetingType: meetingTypeName,
      scheduledAt: new Date(data.slotStart),
      durationMinutes,
      timezone: data.timezone,
      googleMeetUrl,
      meetingTopic: data.meetingTopic || undefined,
      cancellationToken,
      rescheduleToken,
      appUrl,
    };

    Promise.all([
      sendVisitorConfirmation(emailData).catch((e) =>
        console.error("Visitor email failed:", e)
      ),
      sendEmployeeNotification({
        ...emailData,
        visitorCompany: data.visitor.company || undefined,
        visitorPhone: data.visitor.phone || undefined,
      }).catch((e) => console.error("Employee email failed:", e)),
    ]);

    return NextResponse.json({
      bookingId,
      success: true,
      googleMeetUrl,
      cancellationToken,
      rescheduleToken,
    });
  } catch (error: any) {
    console.error("Booking creation error:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to create booking" },
      { status: 500 }
    );
  }
}
