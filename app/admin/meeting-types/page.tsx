import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const SEED_MEETING_TYPES = [
  {
    id: "mt-1",
    name: "Virtual Coffee Chat",
    slug: "coffee-chat",
    emoji: "☕",
    description: "A casual 30-minute conversation to connect and discuss opportunities.",
    durationMinutes: 30,
    bufferAfter: 15,
    isActive: true,
  },
  {
    id: "mt-2",
    name: "Business Discussion",
    slug: "business-discussion",
    emoji: "💡",
    description: "Discuss a specific business challenge or explore technology solutions.",
    durationMinutes: 30,
    bufferAfter: 15,
    isActive: true,
  },
  {
    id: "mt-3",
    name: "Partnership Discussion",
    slug: "partnership-discussion",
    emoji: "🤝",
    description: "Explore strategic collaborations, integrations, and long-term business partnerships.",
    durationMinutes: 60,
    bufferAfter: 15,
    isActive: true,
  },
];

async function getMeetingTypes() {
  try {
    const types = await prisma.meetingType.findMany({
      orderBy: { durationMinutes: "asc" },
      select: {
        id: true,
        name: true,
        slug: true,
        emoji: true,
        description: true,
        durationMinutes: true,
        bufferAfter: true,
        isActive: true,
      },
    });
    return types.length > 0 ? types : SEED_MEETING_TYPES;
  } catch {
    return SEED_MEETING_TYPES;
  }
}

export default async function AdminMeetingTypesPage() {
  const meetingTypes = await getMeetingTypes();

  return (
    <div>
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Meeting Types</h1>
          <p className="text-sm text-gray-500 mt-1">
            Configure the types of conversations prospects can book with your team.
          </p>
        </div>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {meetingTypes.map((mt) => (
          <div
            key={mt.id}
            className="bg-white border border-gray-200 rounded-2xl p-6 shadow-2xs flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-3xl">{mt.emoji || "📅"}</span>
                <span className="text-xs bg-blue-50 text-blue-700 font-semibold px-2.5 py-1 rounded-full">
                  {mt.durationMinutes} minutes
                </span>
              </div>
              <h2 className="font-bold text-gray-900 text-lg mb-1">{mt.name}</h2>
              <p className="text-xs text-gray-400 mb-3">Slug: /{mt.slug}</p>
              <p className="text-sm text-gray-600 leading-relaxed mb-4">
                {mt.description}
              </p>
            </div>

            <div className="pt-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
              <span>⏱️ {mt.bufferAfter}m buffer</span>
              <span className="text-emerald-600 font-medium">Active</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
