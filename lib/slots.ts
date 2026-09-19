/**
 * lib/slots.ts
 * Computes available booking slots for an employee on a given date.
 * Works with both real Google Calendar busy times and mock data.
 */

import {
  startOfDay,
  endOfDay,
  addMinutes,
  isBefore,
  isAfter,
  getDay,
} from "date-fns";
import { toZonedTime, fromZonedTime } from "date-fns-tz";

export interface BusySlot {
  start: Date;
  end: Date;
}

export interface AvailableSlot {
  start: Date;    // UTC
  end: Date;      // UTC
  startLocal: string; // ISO string in visitor timezone
  endLocal: string;
  label: string;  // "4:00 PM"
}

export interface EmployeeAvailabilityConfig {
  timezone: string;
  dailyMeetingLimit: number;
  bufferMinutes: number; // buffer AFTER each meeting
  workingHours: {
    dayOfWeek: number; // 0=Sun
    startTime: string; // "09:00"
    endTime: string;   // "18:00"
    isAvailable: boolean;
  }[];
  holidays: Date[];
  vacationMode: boolean;
  vacationStart?: Date | null;
  vacationEnd?: Date | null;
}

/**
 * Given a date (in visitor's timezone), employee config, busy slots from Google Calendar,
 * meeting duration, and visitor timezone — returns available slots.
 */
export function computeAvailableSlots(
  date: Date, // any moment on the target day in visitor's TZ
  durationMinutes: number,
  config: EmployeeAvailabilityConfig,
  busySlots: BusySlot[],
  visitorTimezone: string,
  existingBookingsCount: number = 0
): AvailableSlot[] {
  // 1. Check vacation mode
  if (config.vacationMode) return [];
  if (config.vacationStart && config.vacationEnd) {
    const dayUtc = startOfDay(date);
    if (
      isAfter(dayUtc, config.vacationStart) &&
      isBefore(dayUtc, config.vacationEnd)
    )
      return [];
  }

  // 2. Get employee's local date
  const employeeLocalDate = toZonedTime(date, config.timezone);
  const dow = getDay(employeeLocalDate);

  // 3. Check working hours for this day
  const dayConfig = config.workingHours.find(
    (w) => w.dayOfWeek === dow && w.isAvailable
  );
  if (!dayConfig) return [];

  // 4. Check holidays
  const isHoliday = config.holidays.some((h) => {
    const hLocal = toZonedTime(h, config.timezone);
    return (
      hLocal.getFullYear() === employeeLocalDate.getFullYear() &&
      hLocal.getMonth() === employeeLocalDate.getMonth() &&
      hLocal.getDate() === employeeLocalDate.getDate()
    );
  });
  if (isHoliday) return [];

  // 5. Check daily booking limit
  if (existingBookingsCount >= config.dailyMeetingLimit) return [];

  // 6. Build working window in UTC
  const [startHour, startMin] = dayConfig.startTime.split(":").map(Number);
  const [endHour, endMin] = dayConfig.endTime.split(":").map(Number);

  const employeeDay = new Date(employeeLocalDate);
  employeeDay.setHours(0, 0, 0, 0);

  const workStart = fromZonedTime(
    new Date(
      employeeLocalDate.getFullYear(),
      employeeLocalDate.getMonth(),
      employeeLocalDate.getDate(),
      startHour,
      startMin,
      0
    ),
    config.timezone
  );
  const workEnd = fromZonedTime(
    new Date(
      employeeLocalDate.getFullYear(),
      employeeLocalDate.getMonth(),
      employeeLocalDate.getDate(),
      endHour,
      endMin,
      0
    ),
    config.timezone
  );

  // 7. Generate slots in 30-min increments, check against busy slots
  const slots: AvailableSlot[] = [];
  let cursor = workStart;

  while (isBefore(cursor, workEnd)) {
    const slotEnd = addMinutes(cursor, durationMinutes);
    if (isAfter(slotEnd, workEnd)) break;

    // Must not overlap with any busy slot (including buffer after each meeting)
    const overlaps = busySlots.some((busy) => {
      const bufferedEnd = addMinutes(busy.end, config.bufferMinutes);
      return (
        isBefore(cursor, bufferedEnd) && isAfter(slotEnd, busy.start)
      );
    });

    if (!overlaps) {
      const formatter = new Intl.DateTimeFormat("en-US", {
        timeZone: visitorTimezone,
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });

      slots.push({
        start: cursor,
        end: slotEnd,
        startLocal: cursor.toISOString(),
        endLocal: slotEnd.toISOString(),
        label: formatter.format(cursor),
      });
    }

    cursor = addMinutes(cursor, 30); // Step in 30-min increments
  }

  return slots;
}

// ─── Mock data for Sprint 1 (before Google Calendar is connected) ───────────

export const MOCK_BUSY_SLOTS: BusySlot[] = [
  {
    start: new Date(new Date().setHours(10, 0, 0, 0)),
    end: new Date(new Date().setHours(11, 0, 0, 0)),
  },
  {
    start: new Date(new Date().setHours(14, 0, 0, 0)),
    end: new Date(new Date().setHours(15, 0, 0, 0)),
  },
];
