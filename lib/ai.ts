/**
 * lib/ai.ts
 * Claude (Anthropic) integration for ARMI.
 * Handles pre-meeting question generation, brief generation,
 * post-meeting notes generation, and follow-up email drafting.
 */

import Anthropic from "@anthropic-ai/sdk";

function getAnthropicClient() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;
  return new Anthropic({ apiKey });
}

// ─────────────────────────────────────────
// PRE-MEETING: Dynamic follow-up questions
// ─────────────────────────────────────────

export interface QuestionContext {
  meetingType: string;      // e.g. "Coffee Chat"
  selectedIntent: string;   // e.g. "Comfinity Partnership"
  previousAnswers: { question: string; answer: string }[];
}

export async function generateFollowUpQuestion(
  context: QuestionContext
): Promise<string> {
  const anthropic = getAnthropicClient();
  if (!anthropic) {
    const defaultQuestions: Record<string, string[]> = {
      "coffee-chat": [
        "What are you most excited about or working on right now?",
        "What would make this virtual coffee chat most valuable for you?",
      ],
      "partnership": [
        "What specific areas of collaboration do you envision between our organizations?",
        "What timeline are you looking at for exploring this partnership?",
      ],
      "business-discussion": [
        "What key business challenge or technology goal are you currently tackling?",
        "What does an ideal solution look like from your perspective?",
      ],
    };
    const pool = defaultQuestions[context.meetingType] || [
      "What specifically would you like to discuss during our meeting?",
      "Is there any particular background or context we should know before we speak?",
    ];
    const index = Math.min(context.previousAnswers.length, pool.length - 1);
    return pool[index];
  }
  const prompt = `You are ARMI, an AI assistant for Comfinity Technologies, helping to understand a visitor's meeting purpose.

Meeting type: ${context.meetingType}
Visitor's stated intent: ${context.selectedIntent}

Previous Q&A:
${
  context.previousAnswers.length > 0
    ? context.previousAnswers
        .map((qa) => `Q: ${qa.question}\nA: ${qa.answer}`)
        .join("\n\n")
    : "None yet."
}

Generate ONE short, friendly, specific follow-up question to better understand what the visitor wants from this meeting. 
- Keep it conversational and warm, not corporate.
- Ask only what would genuinely help Comfinity prepare.
- Maximum 1–2 sentences.
- Do not number the question.
- Do not introduce yourself.
Just output the question text only.`;

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-5",
    max_tokens: 150,
    messages: [{ role: "user", content: prompt }],
  });

  const content = message.content[0];
  return content.type === "text" ? content.text.trim() : "";
}

// ─────────────────────────────────────────
// PRE-MEETING: Generate AI Brief
// ─────────────────────────────────────────

export interface MeetingBriefInput {
  meetingType: string;
  employeeName: string;
  employeeDesignation: string;
  visitorName: string;
  visitorCompany: string;
  selectedIntent: string;
  answers: { question: string; answer: string }[];
}

export interface MeetingBrief {
  meetingObjective: string;
  discussionPoints: string[];
  intent: string;
  urgency: "High" | "Medium" | "Low";
  leadTemperature: "Hot" | "Warm" | "Cold";
  opportunityEstimate: string;
  suggestedQuestions: string[];
}

export async function generateMeetingBrief(
  input: MeetingBriefInput
): Promise<MeetingBrief> {
  const anthropic = getAnthropicClient();
  if (!anthropic) {
    return {
      meetingObjective: `Discussion regarding ${input.selectedIntent} and potential collaboration with Comfinity.`,
      discussionPoints: [
        "Overview of current goals and requirements",
        "Exploring fit with Comfinity technology capabilities",
        "Next steps and timeline expectations",
      ],
      intent: input.selectedIntent || "Business Discussion",
      urgency: "Medium",
      leadTemperature: "Warm",
      opportunityEstimate: "₹2L – ₹10L (AI estimate)",
      suggestedQuestions: [
        `What is the primary timeline for ${input.visitorCompany}?`,
        "Who else is involved in making this decision?",
      ],
    };
  }
  const prompt = `You are ARMI, an AI relationship intelligence assistant for Comfinity Technologies.

Analyze this pre-meeting information and generate a structured meeting brief.

Meeting Type: ${input.meetingType}
Employee: ${input.employeeName} (${input.employeeDesignation})
Visitor: ${input.visitorName} from ${input.visitorCompany}
Stated Intent: ${input.selectedIntent}

Pre-meeting Q&A:
${input.answers.map((a) => `Q: ${a.question}\nA: ${a.answer}`).join("\n\n")}

Generate a JSON response with this exact structure:
{
  "meetingObjective": "One clear sentence describing the meeting's purpose",
  "discussionPoints": ["Point 1", "Point 2", "Point 3"],
  "intent": "Partnership | Business | Mentorship | Networking | Other",
  "urgency": "High | Medium | Low",
  "leadTemperature": "Hot | Warm | Cold",
  "opportunityEstimate": "Rough range like ₹X–₹Y or 'Non-commercial' — clearly an AI estimate",
  "suggestedQuestions": ["Question for employee to ask visitor", "Question 2"]
}

Base urgency on signals from their answers (specific timelines = High, exploring = Low).
Base lead temperature on engagement, specificity, and business readiness.
Keep all estimates clearly marked as AI-generated estimates, not facts.
Respond ONLY with the JSON object, no other text.`;

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-5",
    max_tokens: 600,
    messages: [{ role: "user", content: prompt }],
  });

  const content = message.content[0];
  if (content.type !== "text") throw new Error("Unexpected Claude response");

  try {
    return JSON.parse(content.text) as MeetingBrief;
  } catch {
    throw new Error("Failed to parse AI brief from Claude response");
  }
}

// ─────────────────────────────────────────
// POST-MEETING: Generate AI Notes
// ─────────────────────────────────────────

export interface MeetingNotesInput {
  meetingType: string;
  employeeName: string;
  visitorName: string;
  visitorCompany: string;
  meetingObjective: string;
  discussionPoints: string[];
  adminNotes?: string; // Optional rough notes from admin
}

export interface MeetingNotes {
  summary: string;
  discussionPoints: string[];
  decisions: string[];
  actionItems: { task: string; owner: string; deadline: string }[];
  recommendedNextStep: string;
  updatedLeadTemperature: "Hot" | "Warm" | "Cold";
  updatedIntent: string;
}

export async function generateMeetingNotes(
  input: MeetingNotesInput
): Promise<MeetingNotes> {
  const anthropic = getAnthropicClient();
  if (!anthropic) {
    return {
      summary: `Productive discussion with ${input.visitorName} from ${input.visitorCompany} focusing on ${input.meetingObjective}.`,
      discussionPoints:
        input.discussionPoints.length > 0
          ? input.discussionPoints
          : ["Initial project scoping and objectives"],
      decisions: ["Agreed to follow up with proposal and technical overview"],
      actionItems: [
        {
          task: "Prepare follow-up materials",
          owner: "Comfinity",
          deadline: "Next week",
        },
        {
          task: "Review requirements internally",
          owner: input.visitorName,
          deadline: "Next week",
        },
      ],
      recommendedNextStep:
        "Schedule a follow-up call once requirements review is complete.",
      updatedLeadTemperature: "Warm",
      updatedIntent: "Partnership",
    };
  }
  const prompt = `You are ARMI, an AI meeting intelligence assistant for Comfinity Technologies.

Generate structured post-meeting notes based on this information:

Meeting Type: ${input.meetingType}
Between: ${input.employeeName} (Comfinity) and ${input.visitorName} (${input.visitorCompany})
Planned Objective: ${input.meetingObjective}
Planned Discussion Points: ${input.discussionPoints.join(", ")}
${input.adminNotes ? `Admin's rough notes: ${input.adminNotes}` : ""}

Generate a JSON response:
{
  "summary": "2–3 sentence meeting summary",
  "discussionPoints": ["What was discussed 1", "What was discussed 2"],
  "decisions": ["Decision made 1", "Decision made 2"],
  "actionItems": [
    { "task": "Task description", "owner": "Comfinity | ${input.visitorName}", "deadline": "TBD | specific date" }
  ],
  "recommendedNextStep": "Concrete next step recommendation",
  "updatedLeadTemperature": "Hot | Warm | Cold",
  "updatedIntent": "Partnership | Business | Mentorship | Networking | Other"
}

Keep the tone professional but warm. Be specific and actionable.
Respond ONLY with the JSON object.`;

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-5",
    max_tokens: 700,
    messages: [{ role: "user", content: prompt }],
  });

  const content = message.content[0];
  if (content.type !== "text") throw new Error("Unexpected Claude response");

  try {
    return JSON.parse(content.text) as MeetingNotes;
  } catch {
    throw new Error("Failed to parse AI notes from Claude response");
  }
}

// ─────────────────────────────────────────
// FOLLOW-UP: Draft follow-up email
// ─────────────────────────────────────────

export interface FollowUpInput {
  employeeName: string;
  visitorName: string;
  visitorCompany: string;
  lastMeetingType: string;
  lastMeetingDate: string;
  meetingSummary: string;
  recommendedNextStep: string;
  daysSinceContact: number;
}

export async function draftFollowUpEmail(
  input: FollowUpInput
): Promise<{ subject: string; body: string }> {
  const anthropic = getAnthropicClient();
  if (!anthropic) {
    return {
      subject: `Following up on our conversation — Comfinity & ${input.visitorCompany}`,
      body: `Hi ${input.visitorName},\n\nIt was great speaking with you during our ${input.lastMeetingType}. I wanted to follow up regarding our discussion about ${input.meetingSummary}.\n\nAs discussed, our next step is: ${input.recommendedNextStep}.\n\nPlease let me know when you have a moment to connect again.\n\nBest regards,\n${input.employeeName}\nComfinity Technologies`,
    };
  }
  const prompt = `You are ARMI, drafting a follow-up email for ${input.employeeName} at Comfinity Technologies.

Visitor: ${input.visitorName} from ${input.visitorCompany}
Last meeting: ${input.lastMeetingType} on ${input.lastMeetingDate}
Days since contact: ${input.daysSinceContact}
Meeting summary: ${input.meetingSummary}
Recommended next step: ${input.recommendedNextStep}

Draft a warm, professional follow-up email. Keep it short (3–5 sentences max).
Do not be salesy. Be genuine and helpful.

Respond in JSON:
{
  "subject": "Email subject line",
  "body": "Full email body with \\n for line breaks"
}

Respond ONLY with the JSON.`;

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-5",
    max_tokens: 400,
    messages: [{ role: "user", content: prompt }],
  });

  const content = message.content[0];
  if (content.type !== "text") throw new Error("Unexpected Claude response");

  try {
    return JSON.parse(content.text) as { subject: string; body: string };
  } catch {
    throw new Error("Failed to parse follow-up draft from Claude response");
  }
}
