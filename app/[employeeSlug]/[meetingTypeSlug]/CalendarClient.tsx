"use client";

/**
 * Calendar & Slot Picker — Screen 3
 * URL: /[employeeSlug]/[meetingTypeSlug]
 * e.g. /sooraj/coffee-chat
 *
 * Client component — fetches available slots via API.
 */

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { COMMON_TIMEZONES } from "@/lib/utils";

interface Slot {
  startLocal: string;
  endLocal: string;
  label: string;
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

export default function CalendarPage({
  params,
  meetingType,
}: {
  params: { employeeSlug: string; meetingTypeSlug: string };
  meetingType?: { name: string; emoji: string; durationMinutes: number };
}) {
  const router = useRouter();
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTimezone, setSelectedTimezone] = useState("Asia/Kolkata");
  const [slots, setSlots] = useState<Slot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth);

  // Fetch slots when date/timezone changes
  useEffect(() => {
    if (!selectedDate) return;
    setLoadingSlots(true);
    setSlots([]);
    setSelectedSlot(null);

    fetch(
      `/api/bookings/available-slots?employee=${params.employeeSlug}&meetingType=${params.meetingTypeSlug}&date=${selectedDate.toISOString()}&timezone=${encodeURIComponent(selectedTimezone)}`
    )
      .then((r) => r.json())
      .then((data) => setSlots(data.slots || []))
      .catch(() => setSlots([]))
      .finally(() => setLoadingSlots(false));
  }, [selectedDate, selectedTimezone, params.employeeSlug, params.meetingTypeSlug]);

  function prevMonth() {
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(y => y - 1); }
    else setCurrentMonth(m => m - 1);
  }
  function nextMonth() {
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(y => y + 1); }
    else setCurrentMonth(m => m + 1);
  }

  function handleContinue() {
    if (!selectedDate || !selectedSlot) return;
    const params_str = new URLSearchParams({
      date: selectedDate.toISOString(),
      start: selectedSlot.startLocal,
      end: selectedSlot.endLocal,
      label: selectedSlot.label,
      timezone: selectedTimezone,
    }).toString();
    router.push(`/${params.employeeSlug}/${params.meetingTypeSlug}/book?${params_str}`);
  }

  const isPastDate = (day: number) => {
    const d = new Date(currentYear, currentMonth, day);
    return d < new Date(today.getFullYear(), today.getMonth(), today.getDate());
  };

  const isSelectedDate = (day: number) => {
    if (!selectedDate) return false;
    return (
      selectedDate.getFullYear() === currentYear &&
      selectedDate.getMonth() === currentMonth &&
      selectedDate.getDate() === day
    );
  };

  const tzInfo = COMMON_TIMEZONES.find((tz) => tz.value === selectedTimezone);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b border-gray-100 bg-white">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-4">
          <Link href={`/${params.employeeSlug}`} className="text-gray-400 hover:text-gray-600 transition-colors">
            ← Back
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-blue-600 flex items-center justify-center">
              <span className="text-white font-bold text-xs">C</span>
            </div>
            <span className="font-semibold text-gray-900 text-sm">Comfinity</span>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-10">
        {/* Meeting info banner */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-6 flex items-center gap-4">
          <div className="text-3xl">{meetingType?.emoji || "📅"}</div>
          <div>
            <h1 className="font-bold text-gray-900">{meetingType?.name || "Meeting"}</h1>
            <p className="text-sm text-gray-500">{meetingType?.durationMinutes || 30} minutes · Video call</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* ── Calendar ── */}
          <div className="lg:col-span-3 bg-white border border-gray-200 rounded-2xl p-6">
            {/* Timezone selector */}
            <div className="mb-5">
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Timezone</label>
              <select
                value={selectedTimezone}
                onChange={(e) => setSelectedTimezone(e.target.value)}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {COMMON_TIMEZONES.map((tz) => (
                  <option key={tz.value} value={tz.value}>
                    {tz.label} ({tz.offset})
                  </option>
                ))}
              </select>
            </div>

            {/* Month navigation */}
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={prevMonth}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                aria-label="Previous month"
              >
                ←
              </button>
              <h2 className="font-semibold text-gray-900">
                {MONTHS[currentMonth]} {currentYear}
              </h2>
              <button
                onClick={nextMonth}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                aria-label="Next month"
              >
                →
              </button>
            </div>

            {/* Day headers */}
            <div className="grid grid-cols-7 mb-2">
              {DAYS.map((d) => (
                <div key={d} className="text-center text-xs font-medium text-gray-400 py-1">
                  {d}
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-1">
              {/* Empty cells before first day */}
              {Array.from({ length: firstDay }).map((_, i) => (
                <div key={`empty-${i}`} />
              ))}

              {/* Day cells */}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const past = isPastDate(day);
                const selected = isSelectedDate(day);

                return (
                  <button
                    key={day}
                    onClick={() => !past && setSelectedDate(new Date(currentYear, currentMonth, day))}
                    disabled={past}
                    className={`
                      aspect-square flex items-center justify-center rounded-xl text-sm font-medium transition-all
                      ${past ? "text-gray-300 cursor-not-allowed" : "hover:bg-blue-50 cursor-pointer"}
                      ${selected ? "bg-blue-600 text-white hover:bg-blue-700" : past ? "" : "text-gray-700"}
                    `}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Time Slots ── */}
          <div className="lg:col-span-2">
            {selectedDate ? (
              <div className="bg-white border border-gray-200 rounded-2xl p-6 h-full">
                <h3 className="font-semibold text-gray-900 mb-1">
                  {selectedDate.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
                </h3>
                <p className="text-xs text-gray-400 mb-4">{tzInfo?.label}</p>

                {loadingSlots ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : slots.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-3xl mb-2">😔</div>
                    <p className="text-sm text-gray-500">No availability on this day.</p>
                    <p className="text-xs text-gray-400 mt-1">Try another date.</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                    {slots.map((slot) => (
                      <button
                        key={slot.startLocal}
                        onClick={() => setSelectedSlot(slot)}
                        className={`
                          w-full py-3 px-4 rounded-xl border text-sm font-medium transition-all
                          ${selectedSlot?.startLocal === slot.startLocal
                            ? "bg-blue-600 text-white border-blue-600"
                            : "border-gray-200 text-gray-700 hover:border-blue-300 hover:bg-blue-50"
                          }
                        `}
                      >
                        {slot.label}
                      </button>
                    ))}
                  </div>
                )}

                {selectedSlot && (
                  <button
                    onClick={handleContinue}
                    className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-xl transition-colors"
                  >
                    Continue →
                  </button>
                )}
              </div>
            ) : (
              <div className="bg-white border border-gray-200 rounded-2xl p-6 flex items-center justify-center h-full min-h-[200px]">
                <div className="text-center">
                  <div className="text-4xl mb-3">📅</div>
                  <p className="text-gray-400 text-sm">Select a date to see available times</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
