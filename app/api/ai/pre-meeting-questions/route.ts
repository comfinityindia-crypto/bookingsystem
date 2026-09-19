/**
 * POST /api/ai/pre-meeting-questions
 * Generates a dynamic follow-up question using Claude.
 */

import { NextRequest, NextResponse } from "next/server";
import { generateFollowUpQuestion } from "@/lib/ai";
import { z } from "zod";

const Schema = z.object({
  meetingType: z.string(),
  selectedIntent: z.string(),
  previousAnswers: z.array(
    z.object({ question: z.string(), answer: z.string() })
  ),
});

// Questions to ask based on question count
const MAX_QUESTIONS = 3;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = Schema.parse(body);

    // Stop after max questions
    if (data.previousAnswers.length >= MAX_QUESTIONS) {
      return NextResponse.json({ done: true });
    }

    const question = await generateFollowUpQuestion({
      meetingType: data.meetingType,
      selectedIntent: data.selectedIntent,
      previousAnswers: data.previousAnswers,
    });

    return NextResponse.json({ question, done: false });
  } catch (error) {
    console.error("AI question generation error:", error);
    // Graceful fallback questions
    const fallbacks = [
      "What specifically would you like to discuss in this meeting?",
      "Is there a particular outcome or decision you'd like to reach?",
      "Is there anything else that would help us prepare for our conversation?",
    ];
    const fallbackIdx = 0; // Use first fallback on error
    return NextResponse.json({
      question: fallbacks[fallbackIdx],
      done: false,
    });
  }
}
