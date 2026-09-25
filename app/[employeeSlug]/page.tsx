/**
 * Employee Profile + Meeting Type Selection + Calendar — Screen 2+3
 * URL: /[employeeSlug]
 * e.g. /sooraj
 */

import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import EmployeeBookingClient from "./EmployeeBookingClient";

// Seed data for development
const SEED_DATA: Record<
  string,
  {
    employee: {
      id: string;
      slug: string;
      name: string;
      designation: string;
      bio: string;
      expertiseTags: string[];
      photoUrl: string | null;
    };
    meetingTypes: {
      id: string;
      slug: string;
      name: string;
      emoji: string;
      description: string | null;
      durationMinutes: number;
    }[];
  }
> = {
  sooraj: {
    employee: {
      id: "seed-1",
      slug: "sooraj",
      name: "Sooraj Sudevan",
      designation: "Co-Founder",
      bio: "Technology entrepreneur focused on business problem solving, AI, automation and building practical technology solutions.",
      expertiseTags: ["AI", "Business Strategy", "Technology", "Partnerships"],
      photoUrl: null,
    },
    meetingTypes: [
      { id: "mt-1", slug: "coffee-chat", name: "Virtual Coffee Chat", emoji: "☕", description: "A casual 30-minute conversation to get to know each other.", durationMinutes: 30 },
      { id: "mt-2", slug: "business-discussion", name: "Business Discussion", emoji: "💡", description: "Discuss a specific business challenge or opportunity.", durationMinutes: 30 },
      { id: "mt-3", slug: "partnership-discussion", name: "Partnership Discussion", emoji: "🤝", description: "Explore how we can work together and build something meaningful.", durationMinutes: 60 },
    ],
  },
};

async function getEmployeeData(slug: string) {
  try {
    const tenantSlug = process.env.NEXT_PUBLIC_TENANT_SLUG || "comfinity";
    const employee = await prisma.employee.findFirst({
      where: { slug, tenant: { slug: tenantSlug }, isActive: true },
      include: {
        meetingTypeLinks: {
          include: {
            meetingType: {
              select: {
                id: true,
                slug: true,
                name: true,
                emoji: true,
                description: true,
                durationMinutes: true,
                isActive: true,
              },
            },
          },
        },
      },
    });

    if (!employee) return SEED_DATA[slug] || null;

    return {
      employee: {
        id: employee.id,
        slug: employee.slug,
        name: employee.name,
        designation: employee.designation,
        bio: employee.bio,
        expertiseTags: employee.expertiseTags,
        photoUrl: employee.photoUrl,
      },
      meetingTypes: employee.meetingTypeLinks
        .filter((l) => l.meetingType.isActive)
        .map((l) => l.meetingType),
    };
  } catch {
    return SEED_DATA[slug] || null;
  }
}

export default async function EmployeePage({
  params,
}: {
  params: Promise<{ employeeSlug: string }>;
}) {
  const { employeeSlug } = await params;
  const data = await getEmployeeData(employeeSlug);

  if (!data) notFound();

  const { employee, meetingTypes } = data;

  return (
    <EmployeeBookingClient
      employeeSlug={employeeSlug}
      employee={employee}
      meetingTypes={meetingTypes}
    />
  );
}
