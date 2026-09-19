/**
 * Calendar Page (server wrapper)
 * URL: /[employeeSlug]/[meetingTypeSlug]
 */

import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import CalendarClient from "./CalendarClient";

const SEED_MEETING_TYPES: Record<string, { name: string; emoji: string; durationMinutes: number }> = {
  "coffee-chat": { name: "Virtual Coffee Chat", emoji: "☕", durationMinutes: 30 },
  "business-discussion": { name: "Business Discussion", emoji: "💡", durationMinutes: 30 },
  "partnership-discussion": { name: "Partnership Discussion", emoji: "🤝", durationMinutes: 60 },
  "tech-discussion": { name: "Technology Discussion", emoji: "⚡", durationMinutes: 60 },
};

async function getMeetingType(employeeSlug: string, meetingTypeSlug: string) {
  try {
    const mt = await prisma.meetingType.findFirst({
      where: {
        slug: meetingTypeSlug,
        isActive: true,
        employees: { some: { employee: { slug: employeeSlug } } },
      },
      select: { name: true, emoji: true, durationMinutes: true },
    });
    return mt || SEED_MEETING_TYPES[meetingTypeSlug] || null;
  } catch {
    return SEED_MEETING_TYPES[meetingTypeSlug] || null;
  }
}

export default async function CalendarPage({
  params,
}: {
  params: Promise<{ employeeSlug: string; meetingTypeSlug: string }>;
}) {
  const { employeeSlug, meetingTypeSlug } = await params;
  const meetingType = await getMeetingType(employeeSlug, meetingTypeSlug);
  if (!meetingType) notFound();

  return (
    <CalendarClient
      params={{ employeeSlug, meetingTypeSlug }}
      meetingType={{ ...meetingType, emoji: meetingType.emoji ?? "📅" }}
    />
  );
}
