import type { NextApiRequest, NextApiResponse } from "next";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Resend } from "resend";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { meetingId, recipientEmail } = req.body;

  if (!meetingId) {
    return res.status(400).json({ error: "Meeting ID is required" });
  }

  if (!recipientEmail) {
    return res.status(400).json({ error: "Recipient email is required" });
  }

  if (!process.env.RESEND_API_KEY) {
    return res.status(500).json({ error: "Resend API key not configured" });
  }

  try {
    // Get the meeting
    const meeting = await convex.query(api.meetings.getById, {
      id: meetingId as Id<"meetings">,
    });

    if (!meeting) {
      return res.status(404).json({ error: "Meeting not found" });
    }

    if (!meeting.summary) {
      return res.status(400).json({ error: "No summary available for this meeting" });
    }

    // Get action items
    const actionItems = await convex.query(api.actionItems.listByMeeting, {
      meetingId: meetingId as Id<"meetings">,
    });

    const resend = new Resend(process.env.RESEND_API_KEY);

    // Format date
    const meetingDate = new Date(meeting.date);
    const formattedDate = meetingDate.toLocaleDateString("nl-NL", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    // Build action items HTML
    let actionItemsHtml = "";
    if (actionItems && actionItems.length > 0) {
      actionItemsHtml = `
        <h2 style="color: #1a1a1a; margin-top: 24px;">Actiepunten</h2>
        <ul style="padding-left: 20px;">
          ${actionItems
            .map(
              (item) => `
            <li style="margin-bottom: 12px;">
              <strong>${item.description}</strong>
              ${item.ownerName ? `<br><span style="color: #666;">Verantwoordelijke: ${item.ownerName}</span>` : ""}
              ${item.deadline ? `<br><span style="color: #666;">Deadline: ${new Date(item.deadline).toLocaleDateString("nl-NL")}</span>` : ""}
              <span style="display: inline-block; margin-left: 8px; padding: 2px 8px; border-radius: 4px; font-size: 12px; background: ${
                item.priority === "high" ? "#fee2e2" : item.priority === "medium" ? "#e0e7ff" : "#f3f4f6"
              }; color: ${
                item.priority === "high" ? "#dc2626" : item.priority === "medium" ? "#4f46e5" : "#374151"
              };">${item.priority === "high" ? "Hoog" : item.priority === "medium" ? "Medium" : "Laag"}</span>
            </li>
          `
            )
            .join("")}
        </ul>
      `;
    }

    // Build red flags HTML
    let redFlagsHtml = "";
    if (meeting.redFlags && meeting.redFlags.length > 0) {
      redFlagsHtml = `
        <h2 style="color: #dc2626; margin-top: 24px;">⚠️ Rode vlaggen</h2>
        <ul style="padding-left: 20px;">
          ${meeting.redFlags
            .map(
              (flag) => `
            <li style="margin-bottom: 12px; background: #fef2f2; padding: 12px; border-radius: 8px; list-style: none; margin-left: -20px;">
              <strong>${flag.type}</strong>
              <br><span style="color: #666;">${flag.description}</span>
              <span style="display: inline-block; margin-left: 8px; padding: 2px 8px; border-radius: 4px; font-size: 12px; background: #dc2626; color: white;">${flag.severity}</span>
            </li>
          `
            )
            .join("")}
        </ul>
      `;
    }

    // Send email
    const { data, error } = await resend.emails.send({
      from: "Cookaholics <onboarding@resend.dev>",
      to: recipientEmail,
      subject: `Vergadering samenvatting: ${meeting.title}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1a1a1a; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 24px; border-radius: 12px 12px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px;">📋 Vergadering Samenvatting</h1>
          </div>

          <div style="background: #f9fafb; padding: 24px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
            <h2 style="color: #1a1a1a; margin-top: 0;">${meeting.title}</h2>
            <p style="color: #666; margin-bottom: 24px;">
              📅 ${formattedDate}<br>
              ⏱️ Duur: ${meeting.duration} minuten
            </p>

            <h2 style="color: #1a1a1a;">Samenvatting</h2>
            <div style="background: white; padding: 16px; border-radius: 8px; border: 1px solid #e5e7eb;">
              <p style="white-space: pre-wrap; margin: 0;">${meeting.summary}</p>
            </div>

            ${actionItemsHtml}

            ${redFlagsHtml}

            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">

            <p style="color: #666; font-size: 14px; margin-bottom: 0;">
              Deze email is automatisch gegenereerd door Cookaholics Meeting Intelligence.
            </p>
          </div>
        </body>
        </html>
      `,
    });

    if (error) {
      console.error("Resend error:", error);
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({
      success: true,
      messageId: data?.id,
    });
  } catch (error) {
    console.error("Email error:", error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to send email",
    });
  }
}
