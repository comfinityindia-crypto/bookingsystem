import { prisma } from "@/lib/prisma";
import { formatInTimeZone } from "date-fns-tz";
import BlockedTimeClient from "./BlockedTimeClient";

export const dynamic = "force-dynamic";

async function getData() {
  try {
    const employees = await prisma.employee.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        name: true,
        timezone: true,
        blockedTimes: {
          where: { end: { gt: new Date() } },
          orderBy: { start: "asc" },
        },
      },
    });

    return employees.map((e) => ({
      id: e.id,
      name: e.name,
      timezone: e.timezone,
      blocks: e.blockedTimes.map((b) => ({
        id: b.id,
        reason: b.reason,
        // Pre-format on the server in the employee's timezone
        label: `${formatInTimeZone(b.start, e.timezone, "EEE, MMM d · h:mm a")} – ${
          formatInTimeZone(b.start, e.timezone, "yyyy-MM-dd") ===
          formatInTimeZone(b.end, e.timezone, "yyyy-MM-dd")
            ? formatInTimeZone(b.end, e.timezone, "h:mm a")
            : formatInTimeZone(b.end, e.timezone, "EEE, MMM d · h:mm a")
        }`,
      })),
    }));
  } catch {
    return [];
  }
}

export default async function AdminBlockedTimePage() {
  const employees = await getData();
  return <BlockedTimeClient employees={employees} />;
}
