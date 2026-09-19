/**
 * Employee Profile + Meeting Type Selection — Screen 2
 * URL: /[employeeSlug]
 * e.g. /sooraj
 */

import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

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
  anoop: {
    employee: {
      id: "seed-2",
      slug: "anoop",
      name: "Anoop",
      designation: "Head of Technology",
      bio: "Full-stack technology leader specialising in scalable architecture, cloud infrastructure and software delivery.",
      expertiseTags: ["Engineering", "Cloud", "Architecture", "DevOps"],
      photoUrl: null,
    },
    meetingTypes: [
      { id: "mt-1", slug: "coffee-chat", name: "Virtual Coffee Chat", emoji: "☕", description: "A casual 30-minute conversation.", durationMinutes: 30 },
      { id: "mt-4", slug: "tech-discussion", name: "Technology Discussion", emoji: "⚡", description: "Deep dive into technical requirements, architecture, and solutions.", durationMinutes: 60 },
    ],
  },
  sarah: {
    employee: {
      id: "seed-3",
      slug: "sarah",
      name: "Sarah",
      designation: "Business Development",
      bio: "Partnerships and growth specialist helping businesses identify the right opportunities and build lasting commercial relationships.",
      expertiseTags: ["Partnerships", "Growth", "Sales", "Strategy"],
      photoUrl: null,
    },
    meetingTypes: [
      { id: "mt-1", slug: "coffee-chat", name: "Virtual Coffee Chat", emoji: "☕", description: "A casual 30-minute conversation.", durationMinutes: 30 },
      { id: "mt-2", slug: "business-discussion", name: "Business Discussion", emoji: "💡", description: "Discuss a specific business challenge or opportunity.", durationMinutes: 30 },
      { id: "mt-3", slug: "partnership-discussion", name: "Partnership Discussion", emoji: "🤝", description: "Explore how we can work together.", durationMinutes: 60 },
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
  const initials = employee.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Header ── */}
      <header className="border-b border-gray-100 bg-white">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center gap-4">
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

      <div className="max-w-3xl mx-auto px-6 py-12">
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
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Choose the type of conversation
          </h2>
          <div className="space-y-3">
            {meetingTypes.map((mt) => (
              <Link
                key={mt.id}
                href={`/${employeeSlug}/${mt.slug}`}
                className="flex items-center gap-4 bg-white border border-gray-200 rounded-2xl p-5 hover:border-blue-300 hover:shadow-sm transition-all duration-200 group"
              >
                <div className="text-3xl flex-shrink-0">{mt.emoji || "📅"}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-gray-900 group-hover:text-blue-700 transition-colors">
                      {mt.name}
                    </h3>
                    <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full flex-shrink-0">
                      {mt.durationMinutes} min
                    </span>
                  </div>
                  {mt.description && (
                    <p className="text-sm text-gray-500">{mt.description}</p>
                  )}
                </div>
                <div className="text-gray-300 group-hover:text-blue-400 transition-colors flex-shrink-0">
                  →
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
