import { prisma } from "@/lib/prisma";
import Link from "next/link";
import ReviewClient from "./ReviewClient";

export const dynamic = "force-dynamic";

export default async function ReviewPage({
  params,
}: {
  params: Promise<{ bookingId: string }>;
}) {
  const { bookingId } = await params;

  let booking = null;
  let existingReview = null;

  try {
    booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        employee: true,
        visitor: true,
        meetingType: true,
      },
    });

    if (booking) {
      existingReview = await prisma.review.findUnique({
        where: { bookingId: booking.id },
      });
    }
  } catch {
    booking = null;
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
        <div className="text-center bg-white border border-gray-200 rounded-2xl p-8 max-w-md shadow-xs">
          <div className="text-4xl mb-3">🔍</div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Meeting Not Found</h1>
          <p className="text-sm text-gray-500 mb-6">
            We could not find the meeting record associated with this review link.
          </p>
          <Link
            href="/"
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm px-5 py-2.5 rounded-xl transition-colors"
          >
            Go to Comfinity home →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <ReviewClient
      bookingId={booking.id}
      employeeName={booking.employee.name}
      employeeDesignation={booking.employee.designation}
      meetingTypeName={booking.meetingType.name}
      meetingTypeEmoji={booking.meetingType.emoji || "📅"}
      visitorName={booking.visitor.name}
      existingRating={existingReview?.rating}
      existingComment={
        existingReview?.positiveComment ||
        existingReview?.negativeFeedback ||
        undefined
      }
      existingSharedPublicly={existingReview?.sharedPublicly}
    />
  );
}
