/**
 * Booking Details + Confirmation (server wrapper) — Screen 4+5
 * URL: /[employeeSlug]/[meetingTypeSlug]/book
 */

import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import BookingClient from "./BookingClient";

const SEED_EMPLOYEE: Record<
  string,
  { name: string; designation: string; photoUrl: string | null }
> = {
  sooraj: { name: "Sooraj Sudevan", designation: "Co-Founder", photoUrl: null },
};

const SEED_MEETING_TYPES: Record<string, { name: string; emoji: string; durationMinutes: number }> = {
  "coffee-chat": { name: "Virtual Coffee Chat", emoji: "☕", durationMinutes: 30 },
  "business-discussion": { name: "Business Discussion", emoji: "💡", durationMinutes: 30 },
  "partnership-discussion": { name: "Partnership Discussion", emoji: "🤝", durationMinutes: 60 },
  "tech-discussion": { name: "Technology Discussion", emoji: "⚡", durationMinutes: 60 },
};

async function getDisplayInfo(employeeSlug: string, meetingTypeSlug: string) {
  try {
    const employee = await prisma.employee.findFirst({
      where: { slug: employeeSlug, isActive: true },
      select: { name: true, designation: true, photoUrl: true },
    });
    const meetingType = await prisma.meetingType.findFirst({
      where: { slug: meetingTypeSlug, isActive: true },
      select: { name: true, emoji: true, durationMinutes: true },
    });

    return {
      employee: employee || SEED_EMPLOYEE[employeeSlug] || { name: "Team Member", designation: "Representative", photoUrl: null },
      meetingType: meetingType || SEED_MEETING_TYPES[meetingTypeSlug] || { name: "Meeting", emoji: "📅", durationMinutes: 30 },
    };
  } catch {
    return {
      employee: SEED_EMPLOYEE[employeeSlug] || { name: "Team Member", designation: "Representative", photoUrl: null },
      meetingType: SEED_MEETING_TYPES[meetingTypeSlug] || { name: "Meeting", emoji: "📅", durationMinutes: 30 },
    };
  }
}

export default async function BookingDetailsPage({
  params,
}: {
  params: Promise<{ employeeSlug: string; meetingTypeSlug: string }>;
}) {
  const { employeeSlug, meetingTypeSlug } = await params;
  const { employee, meetingType } = await getDisplayInfo(employeeSlug, meetingTypeSlug);
  if (!employee || !meetingType) notFound();

  return (
    <BookingClient
      params={{ employeeSlug, meetingTypeSlug }}
      employee={{ ...employee, photoUrl: employee.photoUrl ?? null }}
      meetingType={{ ...meetingType, emoji: meetingType.emoji ?? "📅" }}
    />
  );
}
