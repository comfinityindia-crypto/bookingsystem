import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const ReviewSchema = z.object({
  bookingId: z.string(),
  rating: z.number().int().min(1).max(5),
  feedback: z.string().optional(),
  sharedPublicly: z.boolean().default(false),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = ReviewSchema.parse(body);

    const booking = await prisma.booking.findUnique({
      where: { id: data.bookingId },
      include: { visitor: true },
    });

    if (!booking) {
      return NextResponse.json(
        { error: "Booking not found" },
        { status: 404 }
      );
    }

    // Upsert the review for this booking
    const review = await prisma.review.upsert({
      where: { bookingId: booking.id },
      create: {
        bookingId: booking.id,
        visitorId: booking.visitorId,
        rating: data.rating,
        positiveComment: data.rating >= 4 ? data.feedback : null,
        negativeFeedback: data.rating < 4 ? data.feedback : null,
        sharedPublicly: data.sharedPublicly,
      },
      update: {
        rating: data.rating,
        positiveComment: data.rating >= 4 ? data.feedback : null,
        negativeFeedback: data.rating < 4 ? data.feedback : null,
        sharedPublicly: data.sharedPublicly,
      },
    });

    return NextResponse.json({ success: true, reviewId: review.id });
  } catch (error: any) {
    console.error("Review submission error:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid review data", details: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to submit review" },
      { status: 500 }
    );
  }
}
