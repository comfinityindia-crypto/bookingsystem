/**
 * lib/google-calendar.ts
 * Google Calendar API integration for ARMI.
 * Handles FreeBusy queries, event creation, updating, deletion.
 * Uses per-employee OAuth tokens stored encrypted in the DB.
 */

import { google } from "googleapis";
import { decrypt } from "./encryption";

const SCOPES = [
  "https://www.googleapis.com/auth/calendar",
  "https://www.googleapis.com/auth/calendar.events",
  "https://www.googleapis.com/auth/userinfo.email",
];

/**
 * Create an OAuth2 client for a given employee's encrypted token.
 */
export function getOAuthClient() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID || "",
    process.env.GOOGLE_CLIENT_SECRET || "",
    `${appUrl}/api/auth/google/callback`
  );
}

/**
 * Exchange an OAuth authorization code for credentials and retrieve the primary Google email.
 */
export async function exchangeCodeForTokens(code: string): Promise<{
  tokens: any;
  email: string;
}> {
  const auth = getOAuthClient();
  const { tokens } = await auth.getToken(code);
  auth.setCredentials(tokens);

  const oauth2 = google.oauth2({ version: "v2", auth });
  let email = "";
  try {
    const userInfo = await oauth2.userinfo.get();
    email = userInfo.data.email || "";
  } catch {
    const calendar = google.calendar({ version: "v3", auth });
    const primary = await calendar.calendars.get({ calendarId: "primary" });
    email = primary.data.id || "";
  }

  return { tokens, email };
}

/**
 * Returns an authenticated OAuth client for an employee.
 */
export function getEmployeeOAuthClient(encryptedToken: string) {
  const auth = getOAuthClient();
  const tokens = JSON.parse(decrypt(encryptedToken));
  auth.setCredentials(tokens);

  // Auto-refresh token when it expires
  auth.on("tokens", async (newTokens) => {
    // In a real implementation, update the encrypted token in the DB here
    console.log("Google token refreshed for employee");
  });

  return auth;
}

/**
 * Generate the Google OAuth URL for employee calendar connection.
 */
export function getGoogleAuthUrl(employeeId: string): string {
  const auth = getOAuthClient();
  return auth.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
    prompt: "consent",
    state: employeeId,
  });
}

export interface BusyPeriod {
  start: Date;
  end: Date;
}

/**
 * Fetch busy time periods from the employee's Google Calendar.
 * Returns UTC times.
 */
export async function getFreeBusy(
  encryptedToken: string,
  calendarEmail: string,
  timeMin: Date,
  timeMax: Date
): Promise<BusyPeriod[]> {
  const auth = getEmployeeOAuthClient(encryptedToken);
  const calendar = google.calendar({ version: "v3", auth });

  const response = await calendar.freebusy.query({
    requestBody: {
      timeMin: timeMin.toISOString(),
      timeMax: timeMax.toISOString(),
      items: [{ id: calendarEmail }],
    },
  });

  const busy = response.data.calendars?.[calendarEmail]?.busy ?? [];
  return busy
    .filter((b) => b.start && b.end)
    .map((b) => ({
      start: new Date(b.start!),
      end: new Date(b.end!),
    }));
}

export interface CreateEventParams {
  summary: string;        // Meeting title
  description: string;    // AI discussion points, etc.
  startTime: Date;        // UTC
  endTime: Date;          // UTC
  attendeeEmails: string[];
  organizerEmail: string;
  timezone: string;       // For display in calendar
}

export interface CreatedEvent {
  googleEventId: string;
  googleMeetUrl: string | null;
}

/**
 * Create a Google Calendar event with a Google Meet conference link.
 */
export async function createCalendarEvent(
  encryptedToken: string,
  params: CreateEventParams
): Promise<CreatedEvent> {
  const auth = getEmployeeOAuthClient(encryptedToken);
  const calendar = google.calendar({ version: "v3", auth });

  const event = await calendar.events.insert({
    calendarId: "primary",
    conferenceDataVersion: 1,
    sendUpdates: "all",
    requestBody: {
      summary: params.summary,
      description: params.description,
      start: {
        dateTime: params.startTime.toISOString(),
        timeZone: params.timezone,
      },
      end: {
        dateTime: params.endTime.toISOString(),
        timeZone: params.timezone,
      },
      attendees: params.attendeeEmails.map((email) => ({ email })),
      conferenceData: {
        createRequest: {
          requestId: `armi-${Date.now()}`,
          conferenceSolutionKey: { type: "hangoutsMeet" },
        },
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: "email", minutes: 60 },
          { method: "popup", minutes: 15 },
        ],
      },
    },
  });

  const meetUrl =
    event.data.conferenceData?.entryPoints?.find(
      (ep) => ep.entryPointType === "video"
    )?.uri ?? null;

  return {
    googleEventId: event.data.id!,
    googleMeetUrl: meetUrl,
  };
}

/**
 * Delete a Google Calendar event (for cancellation).
 */
export async function deleteCalendarEvent(
  encryptedToken: string,
  googleEventId: string
): Promise<void> {
  const auth = getEmployeeOAuthClient(encryptedToken);
  const calendar = google.calendar({ version: "v3", auth });
  await calendar.events.delete({
    calendarId: "primary",
    eventId: googleEventId,
    sendUpdates: "all",
  });
}

/**
 * Update a Google Calendar event (for rescheduling).
 */
export async function updateCalendarEvent(
  encryptedToken: string,
  googleEventId: string,
  startTime: Date,
  endTime: Date,
  timezone: string
): Promise<void> {
  const auth = getEmployeeOAuthClient(encryptedToken);
  const calendar = google.calendar({ version: "v3", auth });
  await calendar.events.patch({
    calendarId: "primary",
    eventId: googleEventId,
    sendUpdates: "all",
    requestBody: {
      start: { dateTime: startTime.toISOString(), timeZone: timezone },
      end: { dateTime: endTime.toISOString(), timeZone: timezone },
    },
  });
}
