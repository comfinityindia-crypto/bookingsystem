import { prisma } from "@/lib/prisma";
import { demoStore } from "@/lib/demo-store";
import Link from "next/link";
import { formatInTimeZone } from "date-fns-tz";
import ChangeTimeButton from "./ChangeTimeButton";

export const dynamic = "force-dynamic";

async function getBookings() {
  let dbBookings: any[] = [];
  try {
    dbBookings = await prisma.booking.findMany({
      orderBy: { scheduledAt: "desc" },
      include: {
        employee: { select: { name: true, designation: true, timezone: true } },
        visitor: { select: { name: true, email: true, company: true, phone: true } },
        meetingType: { select: { name: true, emoji: true, durationMinutes: true } },
        answers: true,
      },
    });
  } catch {
    dbBookings = [];
  }

  const demoList = Array.from(demoStore.values()).map((d) => ({
    id: d.id,
    scheduledAt: d.scheduledAt,
    timezone: d.timezone,
    status: d.status,
    googleMeetUrl: d.googleMeetUrl,
    employee: d.employee,
    visitor: d.visitor,
    meetingType: d.meetingType,
    answers: d.answers,
  }));

  return [...dbBookings, ...demoList].sort(
    (a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime()
  );
}

export default async function AdminBookingsPage() {
  const bookings = await getBookings();

  return (
    <div>
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">All Bookings</h1>
          <p className="text-sm text-gray-500 mt-1">
            Complete directory of conversations booked through ARMI with prospect context and video call links.
          </p>
        </div>
      </div>

      {/* Bookings Card */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-2xs">
        {bookings.length === 0 ? (
          <div className="text-center py-16 px-6">
            <div className="text-4xl mb-3">📅</div>
            <h3 className="font-semibold text-gray-900 mb-1">No bookings recorded yet</h3>
            <p className="text-sm text-gray-500 max-w-sm mx-auto mb-6">
              When someone books through a Comfinity link, their full record will show up here.
            </p>
            <Link
              href="/"
              target="_blank"
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 px-4 py-2 rounded-xl transition-colors inline-block"
            >
              Open public booking site →
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-gray-50/75 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  <th className="py-3 px-6">Date & Time</th>
                  <th className="py-3 px-6">Visitor</th>
                  <th className="py-3 px-6">With Team Member</th>
                  <th className="py-3 px-6">Meeting Type</th>
                  <th className="py-3 px-6">Topic / Agenda</th>
                  <th className="py-3 px-6">Status</th>
                  <th className="py-3 px-6">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {bookings.map((b) => {
                  const topic =
                    b.answers?.find((a: any) => a.question === "Meeting Topic / Notes")
                      ?.answer || "—";

                  const statusMap: Record<string, string> = {
                    UPCOMING: "bg-blue-50 text-blue-700",
                    COMPLETED: "bg-emerald-50 text-emerald-700",
                    CANCELLED: "bg-red-50 text-red-700",
                    NO_SHOW: "bg-gray-100 text-gray-700",
                    RESCHEDULED: "bg-amber-50 text-amber-700",
                  };
                  const statusClass = statusMap[String(b.status)] || "bg-gray-100 text-gray-700";
                  // Show times in the team member's timezone (the server runs in UTC)
                  const tz = b.employee.timezone || "Asia/Kolkata";

                  return (
                    <tr key={b.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="py-4 px-6 font-medium text-gray-900 whitespace-nowrap">
                        <div>{formatInTimeZone(b.scheduledAt, tz, "MMM d, yyyy")}</div>
                        <div className="text-xs text-gray-400 font-normal">
                          {formatInTimeZone(b.scheduledAt, tz, "h:mm a")} ({tz})
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="font-semibold text-gray-900">{b.visitor.name}</div>
                        <div className="text-xs text-gray-500">
                          {b.visitor.company ? `${b.visitor.company} · ` : ""}
                          {b.visitor.email}
                        </div>
                        {b.visitor.phone && (
                          <div className="text-xs text-gray-400">{b.visitor.phone}</div>
                        )}
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
                      <td className="py-4 px-6 max-w-xs text-gray-600 text-xs">
                        <p className="line-clamp-2">{topic}</p>
                      </td>
                      <td className="py-4 px-6 whitespace-nowrap">
                        <span
                          className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusClass}`}
                        >
                          {b.status}
                        </span>
                      </td>
                      <td className="py-4 px-6 whitespace-nowrap space-y-2">
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
                          <span className="text-xs text-gray-400">—</span>
                        )}
                        {b.status === "UPCOMING" && (
                          <div>
                            <ChangeTimeButton
                              bookingId={b.id}
                              currentLocal={formatInTimeZone(b.scheduledAt, tz, "yyyy-MM-dd'T'HH:mm")}
                              timezone={tz}
                            />
                          </div>
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
