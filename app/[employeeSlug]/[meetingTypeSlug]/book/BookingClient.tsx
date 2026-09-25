"use client";

/**
 * Booking Details Form + Confirmation — merged Screen 4+5
 * URL: /[employeeSlug]/[meetingTypeSlug]/book
 *
 * Fast, frictionless form for LinkedIn prospects that shows the
 * confirmation inline once the booking succeeds, instead of navigating
 * to a separate confirmation page.
 */

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

type Employee = { name: string; designation: string; photoUrl: string | null };
type MeetingType = { name: string; emoji: string; durationMinutes: number };

type ConfirmedBooking = {
  bookingId: string;
  googleMeetUrl: string | null;
  cancellationToken: string;
  rescheduleToken: string;
};

export default function BookingClient({
  params,
  employee,
  meetingType,
}: {
  params: { employeeSlug: string; meetingTypeSlug: string };
  employee: Employee;
  meetingType: MeetingType;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const slotStart = searchParams.get("start") || "";
  const slotEnd = searchParams.get("end") || "";
  const slotLabel = searchParams.get("label") || "";
  const timezone = searchParams.get("timezone") || "Asia/Kolkata";
  const dateStr = searchParams.get("date") || "";

  // Contact info
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [phone, setPhone] = useState("");
  const [meetingTopic, setMeetingTopic] = useState("");

  const [booking, setBooking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState<ConfirmedBooking | null>(null);

  const slotDate = dateStr
    ? new Date(dateStr).toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : "";

  async function handleBook(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;

    setBooking(true);
    setError(null);

    try {
      const res = await fetch("/api/bookings/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeSlug: params.employeeSlug,
          meetingTypeSlug: params.meetingTypeSlug,
          slotStart,
          slotEnd,
          timezone,
          meetingTopic: meetingTopic.trim() || undefined,
          visitor: {
            name: name.trim(),
            email: email.trim(),
            company: company.trim() || undefined,
            phone: phone.trim() || undefined,
          },
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Booking failed");
      }

      const data = await res.json();
      setConfirmed({
        bookingId: data.bookingId,
        googleMeetUrl: data.googleMeetUrl ?? null,
        cancellationToken: data.cancellationToken,
        rescheduleToken: data.rescheduleToken,
      });
    } catch (err: any) {
      setError(err?.message || "Something went wrong. Please try again.");
      setBooking(false);
    }
  }

  const employeeInitials = employee.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  if (confirmed) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="border-b border-gray-100 bg-white">
          <div className="max-w-3xl mx-auto px-6 py-4 flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-blue-600 flex items-center justify-center">
              <span className="text-white font-bold text-xs">C</span>
            </div>
            <span className="font-semibold text-gray-900 text-sm">Comfinity</span>
          </div>
        </header>

        <div className="max-w-3xl mx-auto px-6 py-10">
          {/* Success banner */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">✅</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">You're all set!</h1>
            <p className="text-gray-500">
              A confirmation has been sent to <strong>{email}</strong>
            </p>
          </div>

          {/* Booking card */}
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden mb-4">
            <div className="flex items-center gap-4 p-6 border-b border-gray-100">
              {employee.photoUrl ? (
                <Image
                  src={employee.photoUrl}
                  alt={employee.name}
                  width={48}
                  height={48}
                  className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-semibold">{employeeInitials}</span>
                </div>
              )}
              <div>
                <div className="font-semibold text-gray-900">{employee.name}</div>
                <div className="text-sm text-gray-500">{employee.designation}</div>
              </div>
              <div className="ml-auto text-right">
                <div className="text-sm font-medium text-gray-700">
                  {meetingType.emoji} {meetingType.name}
                </div>
                <div className="text-xs text-gray-400">{meetingType.durationMinutes} minutes</div>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex items-start gap-3">
                <span className="text-lg mt-0.5">📅</span>
                <div>
                  <div className="font-semibold text-gray-900">
                    {slotDate}{slotLabel ? ` · ${slotLabel}` : ""}
                  </div>
                  <div className="text-sm text-gray-400">{timezone}</div>
                </div>
              </div>

              {confirmed.googleMeetUrl && (
                <div className="flex items-center gap-3">
                  <span className="text-lg">📹</span>
                  <a
                    href={confirmed.googleMeetUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors inline-flex items-center gap-2"
                  >
                    Join Google Meet →
                  </a>
                </div>
              )}
            </div>

            {meetingTopic.trim() && (
              <div className="mx-6 mb-6 bg-gray-50 border border-gray-100 rounded-xl p-5">
                <h3 className="font-semibold text-gray-900 text-sm mb-1">Meeting Topic / Notes</h3>
                <p className="text-gray-600 text-sm whitespace-pre-wrap">{meetingTopic}</p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-3 justify-center">
            <a
              href={`/reschedule/${confirmed.rescheduleToken}`}
              className="text-sm text-gray-600 hover:text-gray-900 border border-gray-200 bg-white rounded-xl px-5 py-2.5 transition-colors shadow-2xs"
            >
              Reschedule
            </a>
            <a
              href={`/cancel/${confirmed.cancellationToken}`}
              className="text-sm text-gray-500 hover:text-red-600 border border-gray-200 bg-white rounded-xl px-5 py-2.5 transition-colors shadow-2xs"
            >
              Cancel
            </a>
            <Link
              href={`/review/${confirmed.bookingId}`}
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b border-gray-100 bg-white">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="text-sm text-gray-500 hover:text-gray-800 transition-colors flex items-center gap-1.5"
          >
            ← Change time
          </button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-blue-600 flex items-center justify-center">
              <span className="text-white font-bold text-xs">C</span>
            </div>
            <span className="font-semibold text-gray-900 text-sm">Comfinity</span>
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-10">
        {/* Slot + meeting details card */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-6 shadow-xs">
          <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-100">
            {employee.photoUrl ? (
              <Image
                src={employee.photoUrl}
                alt={employee.name}
                width={40}
                height={40}
                className="w-10 h-10 rounded-full object-cover flex-shrink-0"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center flex-shrink-0">
                <span className="text-white font-semibold text-sm">{employeeInitials}</span>
              </div>
            )}
            <div>
              <div className="font-semibold text-gray-900 text-sm">{employee.name}</div>
              <div className="text-xs text-gray-500">
                {meetingType.emoji} {meetingType.name} · {meetingType.durationMinutes} min
              </div>
            </div>
          </div>

          <div className="text-xs font-semibold uppercase tracking-wider text-blue-600 mb-2">
            Selected Time
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <div className="font-bold text-gray-900 text-lg">{slotDate || "Selected Date"}</div>
              <div className="text-sm text-gray-600">
                {slotLabel || "Selected Time"} · <span className="text-gray-500">{timezone}</span>
              </div>
            </div>
            <div className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full self-start sm:self-auto">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              Slot reserved
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-8 shadow-xs">
          <h1 className="text-xl font-bold text-gray-900 mb-1">Enter your details</h1>
          <p className="text-sm text-gray-500 mb-6">
            We will send a Google Calendar invite and Google Meet link to your email.
          </p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleBook} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                Your name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. John Smith"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                Email address <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                  Company name <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <input
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="Acme Corp"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                  Phone number <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                What would you like to discuss? <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <textarea
                value={meetingTopic}
                onChange={(e) => setMeetingTopic(e.target.value)}
                placeholder="Share any context, questions, or goals you'd like to cover..."
                rows={4}
                className="w-full border border-gray-200 rounded-xl p-4 text-sm text-gray-900 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={!name.trim() || !email.trim() || booking}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-3.5 px-6 rounded-xl transition-colors text-sm shadow-xs flex items-center justify-center gap-2"
              >
                {booking ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Scheduling your meeting...</span>
                  </>
                ) : (
                  <span>Confirm Booking →</span>
                )}
              </button>
            </div>

            <p className="text-xs text-gray-400 text-center pt-2">
              A calendar invite with Google Meet video link will be sent upon confirmation.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
