/**
 * Public Booking Landing Page — Screen 1
 * URL: meeting.comfinity.com (or /)
 *
 * Shows: Comfinity branding + "Book a conversation" + employee cards
 */

import { prisma } from "@/lib/prisma";
import Link from "next/link";
import Image from "next/image";

// Fallback seed data for development before DB is set up
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
  {
    id: "seed-2",
    slug: "anoop",
    name: "Anoop",
    designation: "Head of Technology",
    bio: "Full-stack technology leader specialising in scalable architecture, cloud infrastructure and software delivery.",
    expertiseTags: ["Engineering", "Cloud", "Architecture", "DevOps"],
    photoUrl: null,
    linkedinUrl: "https://linkedin.com",
  },
  {
    id: "seed-3",
    slug: "sarah",
    name: "Sarah",
    designation: "Business Development",
    bio: "Partnerships and growth specialist helping businesses identify the right opportunities and build lasting commercial relationships.",
    expertiseTags: ["Partnerships", "Growth", "Sales", "Strategy"],
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

  return (
    <div className="min-h-screen bg-white">
      {/* ── Header ── */}
      <header className="border-b border-gray-100 bg-white sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <span className="text-white font-bold text-sm">C</span>
            </div>
            <span className="font-semibold text-gray-900">Comfinity</span>
          </div>
          <span className="text-sm text-gray-400">Powered by ARMI</span>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="max-w-5xl mx-auto px-6 pt-16 pb-12 text-center">
        <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 text-sm font-medium px-4 py-2 rounded-full mb-6">
          <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
          Available for conversations
        </div>
        <h1 className="text-4xl font-bold text-gray-900 mb-4 leading-tight">
          Book a conversation<br className="hidden sm:block" /> with our team
        </h1>
        <p className="text-lg text-gray-500 max-w-2xl mx-auto">
          We build technology that solves real business problems — AI, automation, and digital platforms.
          Choose who you'd like to speak with and pick a time that works for you.
        </p>
      </section>

      {/* ── Employee Cards ── */}
      <section className="max-w-5xl mx-auto px-6 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {employees.map((employee) => (
            <EmployeeCard key={employee.id} employee={employee} />
          ))}
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-gray-100 py-8 text-center">
        <p className="text-sm text-gray-400">
          © {new Date().getFullYear()} Comfinity Technologies ·{" "}
          <span className="text-blue-500">Powered by ARMI</span>
        </p>
      </footer>
    </div>
  );
}

function EmployeeCard({
  employee,
}: {
  employee: EmployeeCard;
}) {
  const initials = employee.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 hover:border-blue-200 hover:shadow-md transition-all duration-200 flex flex-col">
      {/* Avatar */}
      <div className="flex items-start gap-4 mb-4">
        <div className="relative flex-shrink-0">
          {employee.photoUrl ? (
            <Image
              src={employee.photoUrl}
              alt={employee.name}
              width={64}
              height={64}
              className="w-16 h-16 rounded-full object-cover"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center">
              <span className="text-white font-semibold text-xl">{initials}</span>
            </div>
          )}
          <span className="absolute bottom-0 right-0 w-4 h-4 bg-green-400 border-2 border-white rounded-full"></span>
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="font-semibold text-gray-900 text-lg leading-tight">{employee.name}</h2>
          <p className="text-sm text-blue-600 font-medium">{employee.designation}</p>
          {employee.linkedinUrl && (
            <a
              href={employee.linkedinUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-gray-400 hover:text-blue-500 transition-colors mt-1 inline-block"
            >
              LinkedIn ↗
            </a>
          )}
        </div>
      </div>

      {/* Bio */}
      <p className="text-sm text-gray-600 leading-relaxed mb-4 flex-1">{employee.bio}</p>

      {/* Expertise tags */}
      {employee.expertiseTags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-5">
          {employee.expertiseTags.map((tag) => (
            <span
              key={tag}
              className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* CTA */}
      <Link
        href={`/${employee.slug}`}
        className="w-full text-center bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-xl transition-colors text-sm"
      >
        Book with {employee.name.split(" ")[0]} →
      </Link>
    </div>
  );
}
