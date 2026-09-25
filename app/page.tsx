/**
 * Public Booking Landing Page + Contact Details (server wrapper) — Screen 1+4
 * URL: meeting.comfinity.com (or /)
 */

import { prisma } from "@/lib/prisma";
import LandingClient from "./LandingClient";

type EmployeeCard = {
  id: string;
  slug: string;
  name: string;
  designation: string;
  bio: string;
  expertiseTags: string[];
  photoUrl: string | null;
  linkedinUrl: string;
};

const SEED_EMPLOYEES: EmployeeCard[] = [
  {
    id: "seed-1",
    slug: "sooraj",
    name: "Sooraj Sudevan",
    designation: "Co-Founder",
    bio: "Technology entrepreneur focused on business problem solving, AI, automation and building practical technology solutions.",
    expertiseTags: ["AI", "Business Strategy", "Technology", "Partnerships"],
    photoUrl: null,
    linkedinUrl: "https://linkedin.com",
  },
];

async function getEmployees() {
  try {
    const tenantSlug = process.env.NEXT_PUBLIC_TENANT_SLUG || "comfinity";
    const employees = await prisma.employee.findMany({
      where: {
        tenant: { slug: tenantSlug },
        isActive: true,
      },
      select: {
        id: true,
        slug: true,
        name: true,
        designation: true,
        bio: true,
        expertiseTags: true,
        photoUrl: true,
        linkedinUrl: true,
      },
      orderBy: { createdAt: "asc" },
    });
    return employees.length > 0
      ? employees.map((e): EmployeeCard => ({
          id: e.id,
          slug: e.slug,
          name: e.name,
          designation: e.designation,
          bio: e.bio ?? "",
          expertiseTags: e.expertiseTags,
          photoUrl: e.photoUrl,
          linkedinUrl: e.linkedinUrl ?? "",
        }))
      : SEED_EMPLOYEES;
  } catch {
    return SEED_EMPLOYEES;
  }
}

export default async function BookingLandingPage() {
  const employees = await getEmployees();
  return <LandingClient employees={employees} />;
}
