"use client";

/**
 * Employee Profile + Meeting Type + Calendar — merged Screen 2+3
 * URL: /[employeeSlug]
 * e.g. /sooraj
 *
 * Combines profile/meeting-type selection and the date/time picker into
 * a single page so visitors don't have to navigate to a separate screen.
 */

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { COMMON_TIMEZONES } from "@/lib/utils";

type Employee = {
  id: string;
  slug: string;
  name: string;
  designation: string;
  bio: string | null;
  expertiseTags: string[];
  photoUrl: string | null;
};

type MeetingType = {
  id: string;
  slug: string;
  name: string;
  emoji: string | null;
  description: string | null;
  durationMinutes: number;
};

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

export default function EmployeeBookingClient({
  employeeSlug,
  employee,
  meetingTypes,
}: {
  employeeSlug: string;
  employee: Employee;
  meetingTypes: MeetingType[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const today = new Date();

  // Contact info collected on the landing page (Screen 1+4)
  const contactName = searchParams.get("name") || "";
  const contactEmail = searchParams.get("email") || "";
  const contactCompany = searchParams.get("company") || "";
  const contactPhone = searchParams.get("phone") || "";
  const contactTopic = searchParams.get("topic") || "";
  const hasContactInfo = Boolean(contactName && contactEmail);

  const [selectedMeetingType, setSelectedMeetingType] = useState<MeetingType | null>(null);
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTimezone, setSelectedTimezone] = useState("Asia/Kolkata");
  const [slots, setSlots] = useState<Slot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState<{
    bookingId: string;
    googleMeetUrl: string | null;
    cancellationToken: string;
    rescheduleToken: string;
  } | null>(null);
  const [existingBooking, setExistingBooking] = useState<{
    scheduledAt: string;
    timezone: string;
    meetingType: { slug: string; name: string; emoji: string | null; durationMinutes: number };
  } | null>(null);
  const [wasRescheduled, setWasRescheduled] = useState(false);

  // Deep-link support for old /[employeeSlug]/[meetingTypeSlug] URLs
  useEffect(() => {
    const preselect = searchParams.get("meetingType");
    if (preselect) {
      const match = meetingTypes.find((mt) => mt.slug === preselect);
      if (match) setSelectedMeetingType(match);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // If this visitor already has an upcoming meeting with this employee,
  // surface it so they can reschedule instead of double-booking.
  useEffect(() => {
    if (!hasContactInfo) return;
    fetch(`/api/bookings/lookup?email=${encodeURIComponent(contactEmail)}&employeeSlug=${employeeSlug}`)
      .then((r) => r.json())
      .then((data) => {
        if (!data.booking) return;
        setExistingBooking(data.booking);
        const scheduled = new Date(data.booking.scheduledAt);
        setCurrentYear(scheduled.getFullYear());
        setCurrentMonth(scheduled.getMonth());
        if (!searchParams.get("meetingType")) {
          const match = meetingTypes.find((mt) => mt.slug === data.booking.meetingType.slug);
          if (match) setSelectedMeetingType(match);
        }
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasContactInfo, contactEmail, employeeSlug]);

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth);

  useEffect(() => {
    if (!selectedDate || !selectedMeetingType) return;
    setLoadingSlots(true);
    setSlots([]);
    setSelectedSlot(null);

    fetch(
      `/api/bookings/available-slots?employee=${employeeSlug}&meetingType=${selectedMeetingType.slug}&date=${selectedDate.toISOString()}&timezone=${encodeURIComponent(selectedTimezone)}`
    )
      .then((r) => r.json())
      .then((data) => setSlots(data.slots || []))
      .catch(() => setSlots([]))
      .finally(() => setLoadingSlots(false));
  }, [selectedDate, selectedTimezone, selectedMeetingType, employeeSlug]);

  function prevMonth() {
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear((y) => y - 1); }
    else setCurrentMonth((m) => m - 1);
  }
  function nextMonth() {
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear((y) => y + 1); }
    else setCurrentMonth((m) => m + 1);
  }

  function handleSelectMeetingType(mt: MeetingType) {
    setSelectedMeetingType(mt);
    setSelectedDate(null);
    setSelectedSlot(null);
    setSlots([]);
  }

  async function handleContinue() {
    if (!selectedDate || !selectedSlot || !selectedMeetingType) return;

    // No contact info on hand (e.g. a direct/legacy link) — fall back to
    // the standalone details form.
    if (!hasContactInfo) {
      const params_str = new URLSearchParams({
        date: selectedDate.toISOString(),
        start: selectedSlot.startLocal,
        end: selectedSlot.endLocal,
        label: selectedSlot.label,
        timezone: selectedTimezone,
      }).toString();
      router.push(`/${employeeSlug}/${selectedMeetingType.slug}/book?${params_str}`);
      return;
    }

    // Contact info was already collected on the landing page — finalize
    // the booking (or reschedule the existing one) right here.
    setSubmitting(true);
    setSubmitError(null);
    try {
      const isReschedule = Boolean(existingBooking);
      const res = await fetch(
        isReschedule ? "/api/bookings/reschedule-by-email" : "/api/bookings/create",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            isReschedule
              ? {
                  employeeSlug,
                  email: contactEmail,
                  meetingTypeSlug: selectedMeetingType.slug,
                  slotStart: selectedSlot.startLocal,
                  slotEnd: selectedSlot.endLocal,
                  timezone: selectedTimezone,
                }
              : {
                  employeeSlug,
                  meetingTypeSlug: selectedMeetingType.slug,
                  slotStart: selectedSlot.startLocal,
                  slotEnd: selectedSlot.endLocal,
                  timezone: selectedTimezone,
                  meetingTopic: contactTopic || undefined,
                  visitor: {
                    name: contactName,
                    email: contactEmail,
                    company: contactCompany || undefined,
                    phone: contactPhone || undefined,
                  },
                }
          ),
        }
      );

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Booking failed");
      }

      const data = await res.json();
      setWasRescheduled(isReschedule);
      setConfirmed({
        bookingId: data.bookingId,
        googleMeetUrl: data.googleMeetUrl ?? null,
        cancellationToken: data.cancellationToken,
        rescheduleToken: data.rescheduleToken,
      });
    } catch (err: any) {
      setSubmitError(err?.message || "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
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

  const initials = employee.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  if (confirmed && selectedMeetingType && selectedDate && selectedSlot) {
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
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">✅</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {wasRescheduled ? "Your meeting has been rescheduled!" : "You're all set!"}
            </h1>
            <p className="text-gray-500">
              A confirmation has been sent to <strong>{contactEmail}</strong>
            </p>
          </div>

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
                  <span className="text-white font-semibold">{initials}</span>
                </div>
              )}
              <div>
                <div className="font-semibold text-gray-900">{employee.name}</div>
                <div className="text-sm text-gray-500">{employee.designation}</div>
              </div>
              <div className="ml-auto text-right">
                <div className="text-sm font-medium text-gray-700">
                  {selectedMeetingType.emoji || "📅"} {selectedMeetingType.name}
                </div>
                <div className="text-xs text-gray-400">{selectedMeetingType.durationMinutes} minutes</div>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex items-start gap-3">
                <span className="text-lg mt-0.5">📅</span>
                <div>
                  <div className="font-semibold text-gray-900">
                    {selectedDate.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })} · {selectedSlot.label}
                  </div>
                  <div className="text-sm text-gray-400">{selectedTimezone}</div>
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

            {contactTopic && (
              <div className="mx-6 mb-6 bg-gray-50 border border-gray-100 rounded-xl p-5">
                <h3 className="font-semibold text-gray-900 text-sm mb-1">Meeting Topic / Notes</h3>
                <p className="text-gray-600 text-sm whitespace-pre-wrap">{contactTopic}</p>
              </div>
            )}
          </div>

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
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center gap-4">
          <Link href="/" className="text-gray-400 hover:text-gray-600 transition-colors">
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

      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* ── Contact info banner ── */}
        {hasContactInfo && (
          <div className="flex items-center justify-between bg-blue-50 border border-blue-100 rounded-xl px-4 py-2.5 mb-6 text-sm">
            <span className="text-blue-800">
              Booking as <strong>{contactName}</strong> ({contactEmail})
            </span>
            <Link href="/" className="text-blue-600 hover:underline font-medium">
              Edit
            </Link>
          </div>
        )}

        {/* ── Existing upcoming booking banner ── */}
        {existingBooking && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-6 text-sm text-amber-900">
            You already have <strong>{existingBooking.meetingType.emoji || "📅"} {existingBooking.meetingType.name}</strong> scheduled for{" "}
            <strong>
              {new Date(existingBooking.scheduledAt).toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}
            </strong>{" "}
            at{" "}
            <strong>
              {new Date(existingBooking.scheduledAt).toLocaleTimeString("en-US", {
                hour: "numeric",
                minute: "2-digit",
                timeZone: existingBooking.timezone,
              })}
            </strong>{" "}
            ({existingBooking.timezone}). Pick a new time or conversation type below to reschedule it.
          </div>
        )}

        {/* ── Employee Header ── */}
        <div className="bg-white rounded-2xl border border-gray-200 p-8 mb-6">
          <div className="flex items-start gap-6">
            {employee.photoUrl ? (
              <Image
                src={employee.photoUrl}
                alt={employee.name}
                width={80}
                height={80}
                className="w-20 h-20 rounded-full object-cover flex-shrink-0"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-2xl">{initials}</span>
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{employee.name}</h1>
              <p className="text-blue-600 font-medium mb-2">{employee.designation}</p>
              <p className="text-gray-600 text-sm leading-relaxed mb-3">{employee.bio}</p>
              <div className="flex flex-wrap gap-1.5">
                {employee.expertiseTags?.map((tag) => (
                  <span key={tag} className="text-xs bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full font-medium">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── Meeting Type Selection ── */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Choose the type of conversation
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {meetingTypes.map((mt) => {
              const active = selectedMeetingType?.id === mt.id;
              return (
                <button
                  key={mt.id}
                  onClick={() => handleSelectMeetingType(mt)}
                  className={`text-left flex items-start gap-3 bg-white border rounded-2xl p-5 transition-all duration-200 ${
                    active
                      ? "border-blue-500 ring-2 ring-blue-100 shadow-sm"
                      : "border-gray-200 hover:border-blue-300 hover:shadow-sm"
                  }`}
                >
                  <div className="text-2xl flex-shrink-0">{mt.emoji || "📅"}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900">{mt.name}</h3>
                      <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full flex-shrink-0">
                        {mt.durationMinutes} min
                      </span>
                    </div>
                    {mt.description && (
                      <p className="text-sm text-gray-500">{mt.description}</p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Calendar & Time Slots ── */}
        {selectedMeetingType ? (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Pick a date &amp; time</h2>
              <button
                onClick={() => handleSelectMeetingType(null as unknown as MeetingType)}
                className="text-sm text-gray-500 hover:text-gray-800 transition-colors"
              >
                Change meeting type
              </button>
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
                  <h3 className="font-semibold text-gray-900">
                    {MONTHS[currentMonth]} {currentYear}
                  </h3>
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
                  {Array.from({ length: firstDay }).map((_, i) => (
                    <div key={`empty-${i}`} />
                  ))}

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

                    {submitError && (
                      <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl px-3 py-2 mt-4">
                        {submitError}
                      </div>
                    )}

                    {selectedSlot && (
                      <button
                        onClick={handleContinue}
                        disabled={submitting}
                        className="w-full mt-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-3 px-4 rounded-xl transition-colors flex items-center justify-center gap-2"
                      >
                        {submitting ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            <span>{existingBooking ? "Rescheduling your meeting..." : "Scheduling your meeting..."}</span>
                          </>
                        ) : (
                          <span>
                            {existingBooking
                              ? "Reschedule Meeting →"
                              : hasContactInfo
                              ? "Confirm Booking →"
                              : "Continue →"}
                          </span>
                        )}
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
        ) : (
          <div className="bg-white border border-gray-200 rounded-2xl p-10 flex items-center justify-center">
            <p className="text-gray-400 text-sm">Select a conversation type above to see available times</p>
          </div>
        )}
      </div>
    </div>
  );
}
