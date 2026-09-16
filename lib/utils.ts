import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, utcToZonedTime } from "date-fns-tz";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a UTC date into the given IANA timezone for display.
 * e.g. formatInTimezone(date, "Asia/Kolkata", "d MMM yyyy, h:mm a zzz")
 */
export function formatInTimezone(
  date: Date,
  timezone: string,
  formatStr: string = "d MMM yyyy, h:mm a zzz"
): string {
  const zoned = utcToZonedTime(date, timezone);
  return format(zoned, formatStr, { timeZone: timezone });
}

/**
 * Generate a cryptographically random URL-safe token.
 */
export function generateToken(bytes = 32): string {
  const array = new Uint8Array(bytes);
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    crypto.getRandomValues(array);
  }
  return Buffer.from(array).toString("base64url");
}

/**
 * Compute UTC offset label for display.
 * e.g. "UTC+05:30"
 */
export function getUtcOffsetLabel(timezone: string): string {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat("en", {
    timeZone: timezone,
    timeZoneName: "shortOffset",
  });
  const parts = formatter.formatToParts(now);
  const offset = parts.find((p) => p.type === "timeZoneName")?.value || "";
  return offset;
}

/**
 * Common IANA timezones for the manual timezone selector.
 */
export const COMMON_TIMEZONES = [
  { label: "India Standard Time (IST)", value: "Asia/Kolkata", offset: "UTC+05:30" },
  { label: "Gulf Standard Time (GST)", value: "Asia/Dubai", offset: "UTC+04:00" },
  { label: "Eastern Time (ET)", value: "America/New_York", offset: "UTC-05:00" },
  { label: "Central Time (CT)", value: "America/Chicago", offset: "UTC-06:00" },
  { label: "Pacific Time (PT)", value: "America/Los_Angeles", offset: "UTC-08:00" },
  { label: "British Time (GMT/BST)", value: "Europe/London", offset: "UTC+00:00" },
  { label: "Central European Time (CET)", value: "Europe/Berlin", offset: "UTC+01:00" },
  { label: "Singapore Time (SGT)", value: "Asia/Singapore", offset: "UTC+08:00" },
  { label: "Japan Standard Time (JST)", value: "Asia/Tokyo", offset: "UTC+09:00" },
  { label: "Australian Eastern Time (AEST)", value: "Australia/Sydney", offset: "UTC+10:00" },
];
