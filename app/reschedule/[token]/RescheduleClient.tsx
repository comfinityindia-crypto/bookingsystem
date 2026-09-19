"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { COMMON_TIMEZONES } from "@/lib/utils";

interface AvailableSlot {
  start: string;
  end: string;
  label: string;
}

interface RescheduleProps {
  token: string;
  bookingId: string;
  employeeName: string;
  employeeSlug: string;
  meetingTypeName: string;
  meetingTypeSlug: string;
  meetingTypeEmoji: string;
  durationMinutes: number;
  currentScheduledAt: string;
  currentTimezone: string;
}

export default function RescheduleClient({ booking }: { booking: RescheduleProps }) {
  const router = useRouter();

  const [selectedTimezone, setSelectedTimezone] = useState(booking.currentTimezone);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<AvailableSlot | null>(null);
  const [slots, setSlots] = useState<AvailableSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [rescheduling, setRescheduling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Month navigation
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());

  // Fetch slots whenever date or timezone changes
  useEffect(() => {
    if (!selectedDate) return;
    setLoadingSlots(true);
    setSlots([]);
    setSelectedSlot(null);

    fetch(
      `/api/bookings/available-slots?employee=${booking.employeeSlug}&meetingType=${booking.meetingTypeSlug}&date=${selectedDate.toISOString()}&timezone=${encodeURIComponent(selectedTimezone)}`
    )
      .then((r) => r.json())
      .then((data) => setSlots(data.slots || []))
      .catch(() => setSlots([]))
      .finally(() => setLoadingSlots(false));
  }, [selectedDate, selectedTimezone, booking.employeeSlug, booking.meetingTypeSlug]);

  function prevMonth() {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else setCurrentMonth((m) => m - 1);
  }

  function nextMonth() {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else setCurrentMonth((m) => m + 1);
  }

  async function handleConfirmReschedule() {
    if (!selectedSlot) return;

    setRescheduling(true);
    setError(null);

    try {
      const res = await fetch(`/api/bookings/reschedule/${booking.token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slotStart: selectedSlot.start,
          slotEnd: selectedSlot.end,
          timezone: selectedTimezone,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to reschedule");
      }

      const result = await res.json();
      router.push(`/confirmation/${result.bookingId}`);
    } catch (err: any) {
      setError(err?.message || "Failed to reschedule. Please try again.");
      setRescheduling(false);
    }
  }

  // Calendar helpers
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(currentYear, currentMonth, 1).getDay();
  const monthName = new Date(currentYear, currentMonth, 1).toLocaleDateString(
    "en-US",
    { month: "long", year: "numeric" }
  );

  const isPastDate = (day: number) => {
    const d = new Date(currentYear, currentMonth, day);
    return d < new Date(today.getFullYear(), today.getMonth(), today.getDate());
  };

  const isSelected = (day: number) => {
    if (!selectedDate) return false;
    return (
      selectedDate.getFullYear() === currentYear &&
      selectedDate.getMonth() === currentMonth &&
      selectedDate.getDate() === day
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-between">
      {/* Header */}
      <header className="border-b border-gray-100 bg-white">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-blue-600 flex items-center justify-center">
              <span className="text-white font-bold text-xs">C</span>
            </div>
            <span className="font-semibold text-gray-900 text-sm">Comfinity</span>
          </div>
          <span className="text-xs text-gray-500 font-medium bg-gray-100 px-3 py-1 rounded-full">
            Rescheduling
          </span>
        </div>
      </header>

      {/* Main Container */}
      <div className="max-w-4xl mx-auto px-6 py-10 w-full">
        {/* Current Booking Alert */}
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 mb-8 text-sm">
          <div className="flex items-center gap-2 font-bold text-amber-900 mb-1">
            <span>📅</span>
            <span>Current Schedule</span>
          </div>
          <p className="text-amber-800">
            Currently scheduled for <strong>{booking.currentScheduledAt}</strong> ({booking.currentTimezone}) with{" "}
            <strong>{booking.employeeName}</strong>. Select a new date and time below to reschedule.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 mb-6">
            {error}
          </div>
        )}

        <div className="bg-white border border-gray-200 rounded-2xl shadow-xs overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                Pick a new date & time
              </h1>
              <p className="text-sm text-gray-500">
                {booking.meetingTypeEmoji} {booking.meetingTypeName} · {booking.durationMinutes} mins
              </p>
            </div>

            {/* Timezone Selector */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400">Timezone:</span>
              <select
                value={selectedTimezone}
                onChange={(e) => setSelectedTimezone(e.target.value)}
                className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                {COMMON_TIMEZONES.map((tz) => (
                  <option key={tz.value} value={tz.value}>
                    {tz.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-100">
            {/* Left: Calendar Picker */}
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-bold text-gray-900 text-base">{monthName}</h2>
                <div className="flex items-center gap-1">
                  <button
                    onClick={prevMonth}
                    className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 transition-colors"
                  >
                    ‹
                  </button>
                  <button
                    onClick={nextMonth}
                    className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 transition-colors"
                  >
                    ›
                  </button>
                </div>
              </div>

              {/* Weekday headers */}
              <div className="grid grid-cols-7 text-center text-xs font-semibold text-gray-400 mb-2">
                {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
                  <div key={d} className="py-1">
                    {d}
                  </div>
                ))}
              </div>

              {/* Day numbers */}
              <div className="grid grid-cols-7 gap-1 text-sm text-center">
                {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                  <div key={`empty-${i}`} />
                ))}

                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1;
                  const past = isPastDate(day);
                  const active = isSelected(day);

                  return (
                    <button
                      key={day}
                      disabled={past}
                      onClick={() =>
                        setSelectedDate(new Date(currentYear, currentMonth, day))
                      }
                      className={`h-10 w-full rounded-xl font-medium transition-all flex items-center justify-center ${
                        past
                          ? "text-gray-300 cursor-not-allowed"
                          : active
                          ? "bg-blue-600 text-white font-bold shadow-xs"
                          : "text-gray-700 hover:bg-blue-50 hover:text-blue-600"
                      }`}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Right: Slot Selection */}
            <div className="p-6 flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-gray-900 text-sm mb-4">
                  {selectedDate
                    ? selectedDate.toLocaleDateString("en-US", {
                        weekday: "long",
                        month: "short",
                        day: "numeric",
                      })
                    : "Select a date to view open times"}
                </h3>

                {loadingSlots ? (
                  <div className="py-12 text-center text-sm text-gray-400">
                    <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    Checking open slots...
                  </div>
                ) : !selectedDate ? (
                  <div className="py-12 text-center text-sm text-gray-400">
                    ← Choose a date on the calendar
                  </div>
                ) : slots.length === 0 ? (
                  <div className="py-12 text-center text-sm text-gray-400">
                    No available slots on this day. Please choose another date.
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-1">
                    {slots.map((s) => {
                      const isSlotActive = selectedSlot?.start === s.start;
                      return (
                        <button
                          key={s.start}
                          onClick={() => setSelectedSlot(s)}
                          className={`py-2.5 px-3 text-xs font-semibold rounded-xl border transition-all text-center ${
                            isSlotActive
                              ? "bg-blue-600 border-blue-600 text-white shadow-xs"
                              : "border-gray-200 text-gray-700 hover:border-blue-400 hover:bg-blue-50/50"
                          }`}
                        >
                          {s.label}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Confirm Reschedule Button */}
              <div className="pt-6 border-t border-gray-100 mt-6">
                <button
                  disabled={!selectedSlot || rescheduling}
                  onClick={handleConfirmReschedule}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white font-semibold py-3.5 px-4 rounded-xl text-sm transition-colors shadow-xs flex items-center justify-center gap-2"
                >
                  {rescheduling ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Updating calendar...</span>
                    </>
                  ) : (
                    <span>Confirm Reschedule →</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-6 text-center text-xs text-gray-400 border-t border-gray-100 bg-white">
        © {new Date().getFullYear()} Comfinity Technologies
      </footer>
    </div>
  );
}
