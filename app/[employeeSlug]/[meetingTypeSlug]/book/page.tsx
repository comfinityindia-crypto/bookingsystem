"use client";

/**
 * Clean Booking Details Screen
 * URL: /[employeeSlug]/[meetingTypeSlug]/book
 *
 * Fast, frictionless 1-page form for LinkedIn prospects.
 * No AI chat, no waiting, instant confirmation.
 */

import { useState, use } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

export default function BookingDetailsPage({
  params: paramsPromise,
}: {
  params: Promise<{ employeeSlug: string; meetingTypeSlug: string }>;
}) {
  const params = use(paramsPromise);
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

  // Format the selected slot for display
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
      router.push(`/confirmation/${data.bookingId}`);
    } catch (err: any) {
      setError(err?.message || "Something went wrong. Please try again.");
      setBooking(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b border-gray-100 bg-white">
        <div className="max-w-2xl mx-auto px-6 py-4 flex items-center justify-between">
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

      <div className="max-w-2xl mx-auto px-6 py-10">
        {/* Slot details card */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-6 shadow-xs">
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
