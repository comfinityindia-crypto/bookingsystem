/**
 * GET /api/bookings/lookup?email=...&employeeSlug=...
 * Looks up the visitor's next UPCOMING booking with this employee, so the
 * booking page can offer to reschedule it instead of creating a duplicate.
 *
 * Returns only display info (no tokens) — the reschedule itself happens
 * server-side via /api/bookings/reschedule-by-email.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { demoStore } from "@/lib/demo-store";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const email = searchParams.get("email")?.trim().toLowerCase();
  const employeeSlug = searchParams.get("employeeSlug");

  if (!email || !employeeSlug) {
    return NextResponse.json({ error: "Missing email or employeeSlug" }, { status: 400 });
  }

  try {
    const tenantSlug = process.env.NEXT_PUBLIC_TENANT_SLUG || "comfinity";
    const tenant = await prisma.tenant.findUnique({ where: { slug: tenantSlug } });
    if (!tenant) throw new Error("Tenant not found");

    const visitor = await prisma.visitor.findUnique({
      where: { tenantId_email: { tenantId: tenant.id, email } },
    });
    if (!visitor) return NextResponse.json({ booking: null });

    const booking = await prisma.booking.findFirst({
      where: {
        visitorId: visitor.id,
        status: "UPCOMING",
        scheduledAt: { gte: new Date() },
        employee: { slug: employeeSlug, tenantId: tenant.id },
      },
      orderBy: { scheduledAt: "asc" },
      select: {
        scheduledAt: true,
        timezone: true,
        meetingType: { select: { slug: true, name: true, emoji: true, durationMinutes: true } },
      },
    });

    return NextResponse.json({ booking: booking || null });
  } catch {
    // Fallback for local dev without a connected database
    for (const d of demoStore.values()) {
      if (
        d.visitor.email.toLowerCase() === email &&
        d.employee.slug === employeeSlug &&
        d.status === "UPCOMING" &&
        new Date(d.scheduledAt) >= new Date()
      ) {
        return NextResponse.json({
          booking: {
            scheduledAt: d.scheduledAt,
            timezone: d.timezone,
            meetingType: d.meetingType,
          },
        });
      }
    }
    return NextResponse.json({ booking: null });
  }
}
