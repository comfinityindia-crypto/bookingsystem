import { prisma } from "@/lib/prisma";
import { demoStore } from "@/lib/demo-store";
import Link from "next/link";
import { startOfDay, endOfDay } from "date-fns";

export const dynamic = "force-dynamic";

async function getDashboardData() {
  const demoList = Array.from(demoStore.values()).filter(
    (d) => d.status === "UPCOMING"
  );

  try {
    const todayStart = startOfDay(new Date());
    const todayEnd = endOfDay(new Date());

    const [
      totalUpcoming,
      todayCount,
      totalEmployees,
      connectedCalendars,
      recentBookings,
    ] = await Promise.all([
      prisma.booking.count({ where: { status: "UPCOMING" } }),
      prisma.booking.count({
        where: { scheduledAt: { gte: todayStart, lte: todayEnd } },
      }),
      prisma.employee.count({ where: { isActive: true } }),
      prisma.employee.count({ where: { googleCalendarConnected: true } }),
      prisma.booking.findMany({
        take: 10,
        orderBy: { scheduledAt: "asc" },
        where: { status: "UPCOMING" },
        include: {
          employee: { select: { name: true } },
          visitor: { select: { name: true, email: true, company: true } },
          meetingType: { select: { name: true, emoji: true } },
          answers: true,
        },
      }),
    ]);

    const combinedRecent = [...recentBookings, ...demoList].slice(0, 10);

    return {
      totalUpcoming: totalUpcoming + demoList.length,
      todayCount,
      totalEmployees,
      connectedCalendars,
      recentBookings: combinedRecent,
    };
  } catch {
    return {
      totalUpcoming: demoList.length,
      todayCount: 0,
      totalEmployees: 3,
      connectedCalendars: 0,
      recentBookings: demoList.slice(0, 10),
    };
  }
}

export default async function AdminDashboardPage() {
  const data = await getDashboardData();

  return (
    <div>
      {/* Top Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">
            Overview of team schedules, upcoming meetings, and calendar sync status.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/admin/employees"
            className="text-xs font-semibold bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 px-3.5 py-2 rounded-xl transition-colors shadow-2xs"
          >
            Manage Employees
          </Link>
          <Link
            href="/admin/bookings"
            className="text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-2 rounded-xl transition-colors shadow-2xs"
          >
            All Bookings
          </Link>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Today's Meetings
            </span>
            <span className="text-lg">⏰</span>
          </div>
          <div className="text-3xl font-bold text-gray-900">{data.todayCount}</div>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Upcoming Bookings
            </span>
            <span className="text-lg">📅</span>
          </div>
          <div className="text-3xl font-bold text-blue-600">{data.totalUpcoming}</div>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Active Team
            </span>
            <span className="text-lg">👥</span>
          </div>
          <div className="text-3xl font-bold text-gray-900">{data.totalEmployees}</div>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Google Calendars
            </span>
            <span className="text-lg">🔄</span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-bold text-emerald-600">
              {data.connectedCalendars}
            </span>
            <span className="text-xs text-gray-400">/ {data.totalEmployees} connected</span>
          </div>
        </div>
      </div>

      {/* Upcoming Schedule Table */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-2xs">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-bold text-gray-900 text-lg">Upcoming Schedule</h2>
          <span className="text-xs text-gray-400 font-medium">Next 10 meetings</span>
        </div>

        {data.recentBookings.length === 0 ? (
          <div className="text-center py-16 px-6">
            <div className="text-4xl mb-3">☕</div>
            <h3 className="font-semibold text-gray-900 mb-1">No upcoming meetings scheduled</h3>
            <p className="text-sm text-gray-500 max-w-sm mx-auto mb-6">
              When prospects book time through your links, their meetings and details will appear here.
            </p>
            <Link
              href="/"
              target="_blank"
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 px-4 py-2 rounded-xl transition-colors inline-block"
            >
              Test booking a slot →
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-gray-50/75 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  <th className="py-3 px-6">Date & Time</th>
                  <th className="py-3 px-6">Visitor</th>
                  <th className="py-3 px-6">Meeting With</th>
                  <th className="py-3 px-6">Type</th>
                  <th className="py-3 px-6">Topic / Notes</th>
                  <th className="py-3 px-6">Video Call</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.recentBookings.map((b) => {
                  const topic =
                    b.answers?.find((a) => a.question === "Meeting Topic / Notes")
                      ?.answer || "—";
                  return (
                    <tr key={b.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="py-4 px-6 font-medium text-gray-900 whitespace-nowrap">
                        {new Date(b.scheduledAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="py-4 px-6">
                        <div className="font-semibold text-gray-900">{b.visitor.name}</div>
                        <div className="text-xs text-gray-500">
                          {b.visitor.company ? `${b.visitor.company} · ` : ""}
                          {b.visitor.email}
                        </div>
                      </td>
                      <td className="py-4 px-6 font-medium text-gray-800 whitespace-nowrap">
                        {b.employee.name}
                      </td>
                      <td className="py-4 px-6 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 text-xs bg-gray-100 text-gray-700 px-2.5 py-1 rounded-full">
                          <span>{b.meetingType.emoji}</span>
                          <span>{b.meetingType.name}</span>
                        </span>
                      </td>
                      <td className="py-4 px-6 max-w-xs truncate text-gray-600 text-xs">
                        {topic}
                      </td>
                      <td className="py-4 px-6 whitespace-nowrap">
                        {b.googleMeetUrl ? (
                          <a
                            href={b.googleMeetUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 px-3 py-1.5 rounded-lg transition-colors"
                          >
                            <span>📹</span>
                            <span>Join Meet</span>
                          </a>
                        ) : (
                          <span className="text-xs text-gray-400">Not generated</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
