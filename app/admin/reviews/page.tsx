import { prisma } from "@/lib/prisma";
import Link from "next/link";

export const dynamic = "force-dynamic";

async function getReviewsData() {
  try {
    const reviews = await prisma.review.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        booking: {
          include: {
            employee: { select: { name: true, designation: true } },
            visitor: { select: { name: true, email: true, company: true } },
            meetingType: { select: { name: true, emoji: true } },
          },
        },
      },
    });

    const totalReviews = reviews.length;
    const avgRating =
      totalReviews > 0
        ? (reviews.reduce((acc, r) => acc + r.rating, 0) / totalReviews).toFixed(1)
        : "5.0";

    const fiveStarCount = reviews.filter((r) => r.rating === 5).length;
    const fiveStarPct =
      totalReviews > 0 ? Math.round((fiveStarCount / totalReviews) * 100) : 100;

    return { reviews, totalReviews, avgRating, fiveStarPct };
  } catch {
    return { reviews: [], totalReviews: 0, avgRating: "5.0", fiveStarPct: 100 };
  }
}

export default async function AdminReviewsPage() {
  const { reviews, totalReviews, avgRating, fiveStarPct } =
    await getReviewsData();

  return (
    <div>
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Prospect Reviews</h1>
          <p className="text-sm text-gray-500 mt-1">
            Feedback and ratings collected from visitors following their conversations with your team.
          </p>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-2xs">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
            Average Rating
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-gray-900">{avgRating}</span>
            <span className="text-amber-500 text-lg">★★★★★</span>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-2xs">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
            Total Reviews
          </div>
          <div className="text-3xl font-bold text-gray-900">{totalReviews}</div>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-2xs">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
            5-Star Satisfaction
          </div>
          <div className="text-3xl font-bold text-emerald-600">{fiveStarPct}%</div>
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {reviews.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center shadow-2xs">
            <div className="text-4xl mb-3">⭐</div>
            <h3 className="font-semibold text-gray-900 mb-1">No reviews received yet</h3>
            <p className="text-sm text-gray-500 max-w-sm mx-auto">
              After meetings, prospects receive a feedback link to rate their conversation and share testimonials.
            </p>
          </div>
        ) : (
          reviews.map((r) => {
            const comment = r.positiveComment || r.negativeFeedback;
            return (
              <div
                key={r.id}
                className="bg-white border border-gray-200 rounded-2xl p-6 shadow-2xs"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-amber-400 font-bold text-base tracking-wide">
                      {"★".repeat(r.rating)}
                      <span className="text-gray-200">{"★".repeat(5 - r.rating)}</span>
                    </span>
                    <span className="font-bold text-gray-900 text-sm">
                      {r.rating}.0 / 5.0
                    </span>
                    {r.sharedPublicly && (
                      <span className="text-xs bg-blue-50 text-blue-700 font-medium px-2 py-0.5 rounded-full">
                        Approved Testimonial
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-gray-400">
                    {new Date(r.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                </div>

                {comment && (
                  <p className="text-sm text-gray-700 leading-relaxed mb-4 italic bg-gray-50/75 border border-gray-100 rounded-xl p-3.5">
                    "{comment}"
                  </p>
                )}

                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-gray-500 pt-2 border-t border-gray-100">
                  <div>
                    <strong className="text-gray-800">{r.booking.visitor.name}</strong>
                    {r.booking.visitor.company && ` · ${r.booking.visitor.company}`}
                    <span className="text-gray-400"> ({r.booking.visitor.email})</span>
                  </div>
                  <div>
                    Met with{" "}
                    <strong className="text-gray-800">{r.booking.employee.name}</strong>
                    <span className="text-gray-400">
                      {" "}
                      ({r.booking.meetingType.emoji} {r.booking.meetingType.name})
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
