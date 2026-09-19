/**
 * Booking Confirmation Page — Screen 5
 * URL: /confirmation/[bookingId]
 */

import { prisma } from "@/lib/prisma";
import { demoStore } from "@/lib/demo-store";
import Link from "next/link";

async function getBooking(bookingId: string) {
  try {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        employee: { select: { name: true, designation: true, photoUrl: true } },
        meetingType: { select: { name: true, emoji: true } },
        visitor: { select: { name: true, email: true } },
        answers: true,
      },
    });
    if (booking) return booking;
  } catch {
    // Database query failed or PostgreSQL not connected
  }

  // Fallback to in-memory demoStore for local testing
  const demo = demoStore.get(bookingId);
  if (demo) {
    return {
      id: demo.id,
      scheduledAt: demo.scheduledAt,
      durationMinutes: demo.durationMinutes,
      timezone: demo.timezone,
      googleMeetUrl: demo.googleMeetUrl,
      cancellationToken: demo.cancellationToken,
      rescheduleToken: demo.rescheduleToken,
      employee: demo.employee,
      meetingType: demo.meetingType,
      visitor: demo.visitor,
      answers: demo.answers,
    };
  }

  return null;
}

export default async function ConfirmationPage({
  params,
}: {
  params: Promise<{ bookingId: string }>;
}) {
  const { bookingId } = await params;
  const booking = await getBooking(bookingId);

  if (!booking) {
    // Show a graceful not-found rather than hard 404
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
        <div className="text-center">
          <div className="text-5xl mb-4">🔍</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Booking not found</h1>
          <p className="text-gray-500 mb-6">This booking may have been cancelled or the link is incorrect.</p>
          <Link href="/" className="text-blue-600 hover:underline">Book a new meeting →</Link>
        </div>
      </div>
    );
  }

  const formattedDateTime = new Intl.DateTimeFormat("en-IN", {
    timeZone: booking.timezone,
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
  }).format(new Date(booking.scheduledAt));

  const topicAnswer = booking.answers?.find(
    (a) => a.question === "Meeting Topic / Notes"
  ) || booking.answers?.[0];

  const employeeInitials = booking.employee.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b border-gray-100 bg-white">
        <div className="max-w-2xl mx-auto px-6 py-4 flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-blue-600 flex items-center justify-center">
            <span className="text-white font-bold text-xs">C</span>
          </div>
          <span className="font-semibold text-gray-900 text-sm">Comfinity</span>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-6 py-10">
        {/* Success banner */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">✅</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">You're all set!</h1>
          <p className="text-gray-500">
            A confirmation has been sent to <strong>{booking.visitor.email}</strong>
          </p>
        </div>

        {/* Booking card */}
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden mb-4">
          {/* Employee row */}
          <div className="flex items-center gap-4 p-6 border-b border-gray-100">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center flex-shrink-0">
              <span className="text-white font-semibold">{employeeInitials}</span>
            </div>
            <div>
              <div className="font-semibold text-gray-900">{booking.employee.name}</div>
              <div className="text-sm text-gray-500">{booking.employee.designation}</div>
            </div>
            <div className="ml-auto text-right">
              <div className="text-sm font-medium text-gray-700">
                {booking.meetingType.emoji} {booking.meetingType.name}
              </div>
              <div className="text-xs text-gray-400">{booking.durationMinutes} minutes</div>
            </div>
          </div>

          {/* Details */}
          <div className="p-6 space-y-4">
            <div className="flex items-start gap-3">
              <span className="text-lg mt-0.5">📅</span>
              <div>
                <div className="font-semibold text-gray-900">{formattedDateTime}</div>
                <div className="text-sm text-gray-400">{booking.timezone}</div>
              </div>
            </div>

            {booking.googleMeetUrl && (
              <div className="flex items-center gap-3">
                <span className="text-lg">📹</span>
                <a
                  href={booking.googleMeetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors inline-flex items-center gap-2"
                >
                  Join Google Meet →
                </a>
              </div>
            )}
          </div>

          {/* Meeting topic or notes if provided */}
          {topicAnswer && (
            <div className="mx-6 mb-6 bg-gray-50 border border-gray-100 rounded-xl p-5">
              <h3 className="font-semibold text-gray-900 text-sm mb-1">Meeting Topic / Notes</h3>
              <p className="text-gray-600 text-sm whitespace-pre-wrap">{topicAnswer.answer}</p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-3 justify-center">
          <a
            href={`/reschedule/${booking.rescheduleToken}`}
            className="text-sm text-gray-600 hover:text-gray-900 border border-gray-200 bg-white rounded-xl px-5 py-2.5 transition-colors shadow-2xs"
          >
            Reschedule
          </a>
          <a
            href={`/cancel/${booking.cancellationToken}`}
            className="text-sm text-gray-500 hover:text-red-600 border border-gray-200 bg-white rounded-xl px-5 py-2.5 transition-colors shadow-2xs"
          >
            Cancel
          </a>
          <Link
            href={`/review/${booking.id}`}
            className="text-sm text-amber-700 hover:text-amber-900 border border-amber-200 bg-amber-50/50 rounded-xl px-5 py-2.5 transition-colors shadow-2xs"
          >
            ⭐ Leave Feedback
          </Link>
        </div>

        <div className="text-center mt-10">
          <Link href="/" className="text-sm text-blue-500 hover:underline">
            Book another meeting →
          </Link>
        </div>
      </div>
    </div>
  );
}
