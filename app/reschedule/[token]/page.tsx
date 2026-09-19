import { prisma } from "@/lib/prisma";
import { demoStore } from "@/lib/demo-store";
import Link from "next/link";
import RescheduleClient from "./RescheduleClient";

export const dynamic = "force-dynamic";

export default async function ReschedulePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  let booking: any = null;
  try {
    booking = await prisma.booking.findUnique({
      where: { rescheduleToken: token },
      include: {
        employee: true,
        visitor: true,
        meetingType: true,
      },
    });
  } catch {
    booking = null;
  }

  if (!booking) {
    for (const d of demoStore.values()) {
      if (d.rescheduleToken === token) {
        booking = d;
        break;
      }
    }
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
        <div className="text-center bg-white border border-gray-200 rounded-2xl p-8 max-w-md shadow-xs">
          <div className="text-4xl mb-3">🔍</div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Booking Not Found</h1>
          <p className="text-sm text-gray-500 mb-6">
            This reschedule link is invalid or the meeting has been deleted.
          </p>
          <Link
            href="/"
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm px-5 py-2.5 rounded-xl transition-colors"
          >
            Go to Comfinity home →
          </Link>
        </div>
      </div>
    );
  }

  if (booking.status === "CANCELLED") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
        <div className="text-center bg-white border border-gray-200 rounded-2xl p-8 max-w-md shadow-xs">
          <div className="text-4xl mb-3">⚠️</div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Meeting Already Cancelled</h1>
          <p className="text-sm text-gray-500 mb-6">
            This meeting has been cancelled and cannot be rescheduled. You can book a fresh conversation anytime.
          </p>
          <Link
            href={`/${booking.employee.slug}`}
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm px-5 py-2.5 rounded-xl transition-colors"
          >
            Book with {booking.employee.name.split(" ")[0]} →
          </Link>
        </div>
      </div>
    );
  }

  const currentScheduledAt = new Intl.DateTimeFormat("en-US", {
    timeZone: booking.timezone,
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(booking.scheduledAt));

  return (
    <RescheduleClient
      booking={{
        token,
        bookingId: booking.id,
        employeeName: booking.employee.name,
        employeeSlug: booking.employee.slug,
        meetingTypeName: booking.meetingType.name,
        meetingTypeSlug: booking.meetingType.slug,
        meetingTypeEmoji: booking.meetingType.emoji || "📅",
        durationMinutes: booking.durationMinutes,
        currentScheduledAt,
        currentTimezone: booking.timezone,
      }}
    />
  );
}
