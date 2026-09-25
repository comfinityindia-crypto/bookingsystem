/**
 * /api/admin/blocked-times
 * POST   — block a time range for an employee (times are wall-clock in the
 *          employee's timezone, e.g. "2026-09-26T14:00").
 * DELETE — remove a blocked range: ?id=<blockedTimeId>
 * Protected by the admin Basic Auth gate in proxy.ts.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { fromZonedTime } from "date-fns-tz";
import { isBefore } from "date-fns";
import { z } from "zod";

const LocalDateTime = z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/);

const CreateSchema = z.object({
  employeeId: z.string(),
  start: LocalDateTime,
  end: LocalDateTime,
  reason: z.string().max(200).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const data = CreateSchema.parse(await request.json());

    const employee = await prisma.employee.findUnique({ where: { id: data.employeeId } });
    if (!employee) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }

    const start = fromZonedTime(data.start, employee.timezone);
    const end = fromZonedTime(data.end, employee.timezone);
    if (!isBefore(start, end)) {
      return NextResponse.json({ error: "End time must be after start time" }, { status: 400 });
    }

    const blocked = await prisma.employeeBlockedTime.create({
      data: {
        employeeId: employee.id,
        start,
        end,
        reason: data.reason?.trim() || null,
      },
    });

    return NextResponse.json({ success: true, id: blocked.id });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid request data" }, { status: 400 });
    }
    console.error("Create blocked time error:", error);
    return NextResponse.json({ error: "Failed to block time" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  try {
    await prisma.employeeBlockedTime.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete blocked time error:", error);
    return NextResponse.json({ error: "Failed to remove blocked time" }, { status: 500 });
  }
}
