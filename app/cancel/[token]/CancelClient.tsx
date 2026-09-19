"use client";

import { useState } from "react";
import Link from "next/link";

interface BookingInfo {
  id: string;
  token: string;
  status: string;
  employeeName: string;
  employeeSlug: string;
  employeeDesignation: string;
  meetingTypeName: string;
  meetingTypeEmoji: string;
  durationMinutes: number;
  scheduledAtFormatted: string;
  timezone: string;
  visitorName: string;
  visitorEmail: string;
}

export default function CancelClient({ booking }: { booking: BookingInfo }) {
  const [cancelling, setCancelling] = useState(false);
  const [cancelled, setCancelled] = useState(booking.status === "CANCELLED");
  const [error, setError] = useState<string | null>(null);

  async function handleCancel() {
    setCancelling(true);
    setError(null);

    try {
      const res = await fetch(`/api/bookings/cancel/${booking.token}`, {
        method: "POST",
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to cancel booking");
      }

      setCancelled(true);
    } catch (err: any) {
      setError(err?.message || "Failed to cancel meeting. Please try again.");
    } finally {
      setCancelling(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-between">
      {/* Header */}
      <header className="border-b border-gray-100 bg-white">
        <div className="max-w-2xl mx-auto px-6 py-4 flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-blue-600 flex items-center justify-center">
            <span className="text-white font-bold text-xs">C</span>
          </div>
          <span className="font-semibold text-gray-900 text-sm">Comfinity</span>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-lg mx-auto px-6 py-12 w-full">
        {cancelled ? (
          <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center shadow-xs">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">🗑️</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Meeting Cancelled</h1>
            <p className="text-sm text-gray-500 mb-6">
              Your meeting with <strong>{booking.employeeName}</strong> has been cancelled and removed from the calendar.
            </p>

            <Link
              href={`/${booking.employeeSlug}`}
              className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm px-6 py-3 rounded-xl transition-colors shadow-xs"
            >
              Book another time with {booking.employeeName.split(" ")[0]} →
            </Link>
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-xs">
            <h1 className="text-2xl font-bold text-gray-900 mb-2 text-center">
              Cancel Meeting?
            </h1>
            <p className="text-sm text-gray-500 text-center mb-6">
              Are you sure you want to cancel your upcoming conversation?
            </p>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 mb-6">
                {error}
              </div>
            )}

            {/* Meeting Summary Box */}
            <div className="bg-gray-50 border border-gray-100 rounded-xl p-5 mb-6 text-sm space-y-3">
              <div className="flex items-center justify-between pb-3 border-b border-gray-200/60">
                <span className="text-gray-500">Meeting with</span>
                <span className="font-semibold text-gray-900">{booking.employeeName}</span>
              </div>
              <div className="flex items-center justify-between pb-3 border-b border-gray-200/60">
                <span className="text-gray-500">Type</span>
                <span className="font-medium text-gray-800">
                  {booking.meetingTypeEmoji} {booking.meetingTypeName} ({booking.durationMinutes}m)
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Scheduled for</span>
                <span className="font-semibold text-gray-900 text-right">
                  {booking.scheduledAtFormatted}
                  <div className="text-xs text-gray-400 font-normal">{booking.timezone}</div>
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                onClick={handleCancel}
                disabled={cancelling}
                className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-semibold py-3 px-4 rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
              >
                {cancelling ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Cancelling meeting...</span>
                  </>
                ) : (
                  <span>Yes, cancel this meeting</span>
                )}
              </button>

              <Link
                href={`/confirmation/${booking.id}`}
                className="block text-center w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 px-4 rounded-xl text-sm transition-colors"
              >
                Keep this meeting
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="py-6 text-center text-xs text-gray-400 border-t border-gray-100 bg-white">
        © {new Date().getFullYear()} Comfinity Technologies
      </footer>
    </div>
  );
}
