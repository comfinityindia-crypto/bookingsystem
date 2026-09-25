/**
 * lib/email.ts
 * Email sending via Resend for ARMI.
 * Handles: visitor confirmation, employee notification, meeting notes, follow-up.
 */

import { Resend } from "resend";

function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  return new Resend(apiKey);
}

// Resend returns failures instead of throwing; surface them so callers can log.
async function send(resend: Resend, payload: Parameters<Resend["emails"]["send"]>[0]) {
  const { error } = await resend.emails.send(payload);
  if (error) throw new Error(`Resend: ${error.name} - ${error.message}`);
}

const FROM = `${process.env.RESEND_FROM_NAME || "Comfinity Team"} <${process.env.RESEND_FROM_EMAIL || "team@comfinityindia.com"}>`;

export interface BookingEmailData {
  visitorName: string;
  visitorEmail: string;
  employeeName: string;
  employeeEmail: string;
  employeeDesignation: string;
  meetingType: string;
  scheduledAt: Date;
  durationMinutes: number;
  timezone: string;
  googleMeetUrl: string | null;
  meetingTopic?: string;
  cancellationToken: string;
  rescheduleToken: string;
  appUrl: string;
  previousScheduledAt?: Date; // set when the team changed the meeting time
}

/**
 * Send booking confirmation to the visitor.
 */
export async function sendVisitorConfirmation(data: BookingEmailData) {
  const formattedDate = formatDate(data.scheduledAt, data.timezone);

  const resend = getResendClient();
  if (!resend) {
    console.log("[Resend Mock] Visitor confirmation email skipped (no API key configured):", data.visitorEmail);
    return;
  }

  await send(resend, {
    from: FROM,
    to: data.visitorEmail,
    subject: data.previousScheduledAt
      ? `Your meeting time with ${data.employeeName} has changed 🕒`
      : `Your meeting with ${data.employeeName} is confirmed ✅`,
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f5f5f5;margin:0;padding:20px;">
  <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
    
    <!-- Header -->
    <div style="background:#0066FF;padding:32px 40px;text-align:center;">
      <h1 style="color:#fff;margin:0;font-size:24px;font-weight:600;">${data.previousScheduledAt ? "Meeting Time Changed 🕒" : "Meeting Confirmed ✅"}</h1>
      <p style="color:rgba(255,255,255,0.85);margin:8px 0 0;font-size:15px;">${data.previousScheduledAt ? `${data.employeeName} has moved your meeting to a new time` : "Your conversation with Comfinity is booked"}</p>
    </div>

    <!-- Details -->
    <div style="padding:40px;">
      <table style="width:100%;border-collapse:collapse;margin-bottom:28px;">
        <tr><td style="padding:10px 0;color:#666;font-size:14px;border-bottom:1px solid #f0f0f0;width:140px;">Meeting with</td>
            <td style="padding:10px 0;font-weight:600;border-bottom:1px solid #f0f0f0;">${data.employeeName}<br><span style="font-weight:400;color:#666;font-size:13px;">${data.employeeDesignation}</span></td></tr>
        <tr><td style="padding:10px 0;color:#666;font-size:14px;border-bottom:1px solid #f0f0f0;">Meeting type</td>
            <td style="padding:10px 0;border-bottom:1px solid #f0f0f0;">${data.meetingType}</td></tr>
        ${
          data.previousScheduledAt
            ? `<tr><td style="padding:10px 0;color:#666;font-size:14px;border-bottom:1px solid #f0f0f0;">Previous time</td>
            <td style="padding:10px 0;border-bottom:1px solid #f0f0f0;color:#999;text-decoration:line-through;">${formatDate(data.previousScheduledAt, data.timezone)}</td></tr>`
            : ""
        }
        <tr><td style="padding:10px 0;color:#666;font-size:14px;border-bottom:1px solid #f0f0f0;">${data.previousScheduledAt ? "New time" : "Date & Time"}</td>
            <td style="padding:10px 0;border-bottom:1px solid #f0f0f0;font-weight:600;">${formattedDate}</td></tr>
        <tr><td style="padding:10px 0;color:#666;font-size:14px;">Duration</td>
            <td style="padding:10px 0;">${data.durationMinutes} minutes</td></tr>
      </table>

      ${
        data.googleMeetUrl
          ? `<div style="text-align:center;margin-bottom:28px;">
              <a href="${data.googleMeetUrl}" style="display:inline-block;background:#0066FF;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;">Join Google Meet →</a>
            </div>`
          : ""
      }

      ${
        data.meetingTopic
          ? `<div style="background:#f8f9fa;border-left:4px solid #0066FF;border-radius:0 8px 8px 0;padding:16px 20px;margin-bottom:28px;">
              <h3 style="margin:0 0 6px;font-size:14px;color:#111;font-weight:600;">Meeting Topic / Notes</h3>
              <p style="margin:0;color:#444;font-size:14px;line-height:1.5;">${data.meetingTopic}</p>
            </div>`
          : ""
      }

      <div style="text-align:center;border-top:1px solid #f0f0f0;padding-top:20px;">
        <a href="${data.appUrl}/reschedule/${data.rescheduleToken}" style="color:#0066FF;text-decoration:none;margin-right:20px;font-size:14px;">Reschedule</a>
        <a href="${data.appUrl}/cancel/${data.cancellationToken}" style="color:#999;text-decoration:none;font-size:14px;">Cancel</a>
      </div>
    </div>

    <div style="background:#f8f8f8;padding:20px 40px;text-align:center;">
      <p style="margin:0;color:#999;font-size:12px;">Comfinity Technologies</p>
    </div>
  </div>
</body>
</html>`,
  });
}

export interface EmployeeNotificationData extends BookingEmailData {
  visitorCompany?: string;
  visitorPhone?: string;
  rescheduled?: boolean;
}

/**
 * Send booking notification to the employee.
 */
export async function sendEmployeeNotification(data: EmployeeNotificationData) {
  const formattedDate = formatDate(data.scheduledAt, data.timezone);

  const resend = getResendClient();
  if (!resend) {
    console.log("[Resend Mock] Employee notification email skipped (no API key configured):", data.employeeEmail);
    return;
  }

  await send(resend, {
    from: FROM,
    to: data.employeeEmail,
    subject: `${data.rescheduled ? "Rescheduled" : "New booking"}: ${data.visitorName}${data.visitorCompany ? ` (${data.visitorCompany})` : ""} — ${data.meetingType}`,
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f5f5f5;margin:0;padding:20px;">
  <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
    
    <div style="background:#111;padding:28px 40px;">
      <h1 style="color:#fff;margin:0;font-size:20px;">${data.rescheduled ? "Meeting Rescheduled" : "New Meeting Booked"}</h1>
      <p style="color:#aaa;margin:6px 0 0;font-size:14px;">Booking Notification</p>
    </div>

    <div style="padding:32px 40px;">
      <!-- Visitor card -->
      <div style="border:1px solid #e5e7eb;border-radius:8px;padding:20px;margin-bottom:24px;">
        <h2 style="margin:0 0 4px;font-size:18px;">${data.visitorName}</h2>
        <p style="margin:0;color:#666;font-size:14px;">
          ${data.visitorCompany ? `${data.visitorCompany} · ` : ""}${data.visitorEmail}
          ${data.visitorPhone ? ` · ${data.visitorPhone}` : ""}
        </p>
      </div>

      <!-- Meeting details -->
      <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
        <tr><td style="padding:8px 0;color:#666;font-size:14px;border-bottom:1px solid #f0f0f0;width:140px;">Type</td>
            <td style="padding:8px 0;border-bottom:1px solid #f0f0f0;">${data.meetingType}</td></tr>
        <tr><td style="padding:8px 0;color:#666;font-size:14px;border-bottom:1px solid #f0f0f0;">Date & Time</td>
            <td style="padding:8px 0;border-bottom:1px solid #f0f0f0;font-weight:600;">${formattedDate}</td></tr>
        <tr><td style="padding:8px 0;color:#666;font-size:14px;">Duration</td>
            <td style="padding:8px 0;">${data.durationMinutes} minutes</td></tr>
      </table>

      ${
        data.googleMeetUrl
          ? `<div style="margin-bottom:24px;">
              <a href="${data.googleMeetUrl}" style="display:inline-block;background:#0066FF;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;">Join Google Meet →</a>
            </div>`
          : ""
      }

      ${
        data.meetingTopic
          ? `<div style="background:#f8f9fa;border-radius:8px;padding:18px 20px;margin-bottom:24px;border:1px solid #e5e7eb;">
              <h3 style="margin:0 0 6px;font-size:14px;color:#111;font-weight:600;">Topic / Notes from Visitor</h3>
              <p style="margin:0;color:#444;font-size:14px;line-height:1.5;">${data.meetingTopic}</p>
            </div>`
          : ""
      }
    </div>
  </div>
</body>
</html>`,
  });
}

/**
 * Send AI meeting notes to the visitor (after admin approval).
 */
export async function sendMeetingNotes(params: {
  visitorName: string;
  visitorEmail: string;
  employeeName: string;
  meetingType: string;
  scheduledAt: Date;
  timezone: string;
  summary: string;
  discussionPoints: string[];
  decisions: string[];
  actionItems: { task: string; owner: string; deadline: string }[];
  recommendedNextStep: string;
  appUrl: string;
}) {
  const formattedDate = formatDate(params.scheduledAt, params.timezone);

  const actionItemsHtml = params.actionItems
    .map(
      (ai) =>
        `<tr>
          <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;">${ai.task}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;color:#666;">${ai.owner}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;color:#666;">${ai.deadline}</td>
        </tr>`
    )
    .join("");

  const resend = getResendClient();
  if (!resend) {
    console.log("[Resend Mock] Meeting notes email skipped (no API key configured):", params.visitorEmail);
    return;
  }

  await send(resend, {
    from: FROM,
    to: params.visitorEmail,
    subject: `Meeting notes: Your conversation with ${params.employeeName}`,
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f5f5f5;margin:0;padding:20px;">
  <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;">
    <div style="background:#0066FF;padding:28px 40px;">
      <h1 style="color:#fff;margin:0;font-size:20px;">Meeting Notes</h1>
      <p style="color:rgba(255,255,255,0.8);margin:6px 0 0;font-size:14px;">${params.meetingType} · ${formattedDate}</p>
    </div>
    <div style="padding:32px 40px;">
      <h3 style="margin:0 0 8px;font-size:15px;">Summary</h3>
      <p style="margin:0 0 24px;color:#444;">${params.summary}</p>

      ${params.discussionPoints.length > 0 ? `
      <h3 style="margin:0 0 8px;font-size:15px;">What We Discussed</h3>
      <ul style="margin:0 0 24px;padding-left:20px;color:#444;">
        ${params.discussionPoints.map((p) => `<li style="margin-bottom:4px;">${p}</li>`).join("")}
      </ul>` : ""}

      ${params.decisions.length > 0 ? `
      <h3 style="margin:0 0 8px;font-size:15px;">Decisions Made</h3>
      <ul style="margin:0 0 24px;padding-left:20px;color:#444;">
        ${params.decisions.map((d) => `<li style="margin-bottom:4px;">${d}</li>`).join("")}
      </ul>` : ""}

      ${params.actionItems.length > 0 ? `
      <h3 style="margin:0 0 8px;font-size:15px;">Action Items</h3>
      <table style="width:100%;border-collapse:collapse;margin-bottom:24px;font-size:14px;">
        <thead>
          <tr style="background:#f8f8f8;">
            <th style="padding:8px 12px;text-align:left;font-weight:600;border-bottom:2px solid #e5e7eb;">Task</th>
            <th style="padding:8px 12px;text-align:left;font-weight:600;border-bottom:2px solid #e5e7eb;">Owner</th>
            <th style="padding:8px 12px;text-align:left;font-weight:600;border-bottom:2px solid #e5e7eb;">Deadline</th>
          </tr>
        </thead>
        <tbody>${actionItemsHtml}</tbody>
      </table>` : ""}

      <div style="background:#f0f7ff;border-radius:8px;padding:16px;">
        <h3 style="margin:0 0 8px;font-size:14px;color:#0066FF;">Recommended Next Step</h3>
        <p style="margin:0;color:#333;">${params.recommendedNextStep}</p>
      </div>
    </div>
    <div style="background:#f8f8f8;padding:20px 40px;text-align:center;">
      <p style="margin:0;color:#999;font-size:12px;">Powered by ARMI · Comfinity Technologies</p>
    </div>
  </div>
</body>
</html>`,
  });
}

// Helper: Format date in a given timezone for email display
function formatDate(date: Date, timezone: string): string {
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: timezone,
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
  }).format(date);
}
