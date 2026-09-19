/**
 * lib/demo-store.ts
 * In-memory fallback store for local development & testing
 * when a PostgreSQL database is not yet connected.
 */

export interface DemoBooking {
  id: string;
  tenantId: string;
  employeeId: string;
  employee: {
    name: string;
    designation: string;
    photoUrl: string | null;
    slug: string;
    email: string;
  };
  meetingType: {
    name: string;
    emoji: string;
    slug: string;
    durationMinutes: number;
  };
  visitor: {
    name: string;
    email: string;
    company?: string;
    phone?: string;
  };
  scheduledAt: Date;
  durationMinutes: number;
  timezone: string;
  status: "UPCOMING" | "COMPLETED" | "CANCELLED" | "RESCHEDULED";
  googleMeetUrl: string | null;
  cancellationToken: string;
  rescheduleToken: string;
  answers: { question: string; answer: string; sequence: number }[];
}

const globalForDemo = globalThis as unknown as {
  demoBookings?: Map<string, DemoBooking>;
};

if (!globalForDemo.demoBookings) {
  globalForDemo.demoBookings = new Map<string, DemoBooking>();
}

export const demoStore = globalForDemo.demoBookings;
