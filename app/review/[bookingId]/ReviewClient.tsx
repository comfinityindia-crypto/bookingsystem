"use client";

import { useState } from "react";
import Link from "next/link";

interface ReviewClientProps {
  bookingId: string;
  employeeName: string;
  employeeDesignation: string;
  meetingTypeName: string;
  meetingTypeEmoji: string;
  visitorName: string;
  existingRating?: number;
  existingComment?: string;
  existingSharedPublicly?: boolean;
}

export default function ReviewClient({
  bookingId,
  employeeName,
  employeeDesignation,
  meetingTypeName,
  meetingTypeEmoji,
  visitorName,
  existingRating,
  existingComment,
  existingSharedPublicly,
}: ReviewClientProps) {
  const [rating, setRating] = useState<number>(existingRating || 5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<string>(existingComment || "");
  const [sharedPublicly, setSharedPublicly] = useState<boolean>(
    existingSharedPublicly || false
  );

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(Boolean(existingRating));
  const [error, setError] = useState<string | null>(null);

  const activeRating = hoverRating !== null ? hoverRating : rating;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!rating) return;

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/reviews/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId,
          rating,
          feedback: feedback.trim() || undefined,
          sharedPublicly,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to submit review");
      }

      setSubmitted(true);
    } catch (err: any) {
      setError(err?.message || "Failed to submit. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-between">
      {/* Header */}
      <header className="border-b border-gray-100 bg-white">
        <div className="max-w-2xl mx-auto px-6 py-4 flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-blue-600 flex items-center justify-center">
            <span className="text-white font-bold text-xs">C</span>
          </div>
          <span className="font-semibold text-gray-900 text-sm">Comfinity</span>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-lg mx-auto px-6 py-12 w-full">
        {submitted ? (
          <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center shadow-xs">
            <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">⭐</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Thank you, {visitorName}!</h1>
            <p className="text-sm text-gray-500 mb-6">
              Your feedback helps {employeeName} and the Comfinity team continuously improve our conversations and partnerships.
            </p>

            {rating >= 4 && (
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-6 text-left">
                <div className="font-semibold text-blue-900 text-sm mb-1">
                  Enjoyed your conversation?
                </div>
                <p className="text-xs text-blue-700 leading-relaxed mb-3">
                  Connect with {employeeName} on LinkedIn or share a short recommendation with your network!
                </p>
                <a
                  href="https://linkedin.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Connect on LinkedIn ↗
                </a>
              </div>
            )}

            <Link
              href="/"
              className="text-sm text-gray-400 hover:text-gray-700 transition-colors"
            >
              Return to Comfinity home
            </Link>
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-xs">
            <div className="text-center mb-6">
              <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 bg-blue-50 px-3 py-1 rounded-full mb-3">
                <span>{meetingTypeEmoji}</span>
                <span>{meetingTypeName}</span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">
                How was your conversation?
              </h1>
              <p className="text-sm text-gray-500">
                With <strong>{employeeName}</strong> ({employeeDesignation})
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 mb-6">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Star Rating Component */}
              <div className="flex flex-col items-center justify-center py-2">
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      type="button"
                      key={star}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(null)}
                      onClick={() => setRating(star)}
                      className="text-4xl focus:outline-none transition-transform hover:scale-110 active:scale-95"
                    >
                      {star <= activeRating ? "★" : "☆"}
                    </button>
                  ))}
                </div>
                <div className="text-xs font-semibold text-gray-500 mt-2">
                  {activeRating === 5 && "Outstanding conversation"}
                  {activeRating === 4 && "Very helpful"}
                  {activeRating === 3 && "Good / As expected"}
                  {activeRating === 2 && "Could be better"}
                  {activeRating === 1 && "Not what I needed"}
                </div>
              </div>

              {/* Feedback Text */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                  {rating >= 4
                    ? "What did you find most valuable? (optional)"
                    : "How could we have made this meeting more helpful? (optional)"}
                </label>
                <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Share any thoughts, takeaways, or suggestions..."
                  rows={4}
                  className="w-full border border-gray-200 rounded-xl p-4 text-sm text-gray-900 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Public Testimonial Consent */}
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={sharedPublicly}
                  onChange={(e) => setSharedPublicly(e.target.checked)}
                  className="mt-0.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-xs text-gray-600 leading-relaxed">
                  Allow Comfinity to feature this feedback as a public testimonial or website review.
                </span>
              </label>

              {/* Submit */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-3.5 px-4 rounded-xl text-sm transition-colors shadow-xs flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Submitting review...</span>
                  </>
                ) : (
                  <span>Submit Feedback →</span>
                )}
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="py-6 text-center text-xs text-gray-400 border-t border-gray-100 bg-white">
        © {new Date().getFullYear()} Comfinity Technologies
      </footer>
    </div>
  );
}
