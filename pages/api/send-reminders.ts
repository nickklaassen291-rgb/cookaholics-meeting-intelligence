import type { NextApiRequest, NextApiResponse } from "next";
import { Resend } from "resend";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

const resend = new Resend(process.env.RESEND_API_KEY);
const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only allow POST or GET with API key for cron jobs
  if (req.method !== "POST" && req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Verify API key for cron jobs
  const apiKey = req.headers["x-api-key"] || req.query.apiKey;
  if (apiKey !== process.env.CRON_API_KEY && req.method === "GET") {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    // First, check for new deadlines and create notifications
    await convex.mutation(api.notifications.checkDeadlines, {});

    // Get all unsent email notifications
    const notifications = await convex.query(
      api.notifications.getUnsentEmailNotifications,
      {}
    );

    if (notifications.length === 0) {
      return res.status(200).json({ message: "No notifications to send", sent: 0 });
    }

    let sentCount = 0;
    const errors: string[] = [];

    for (const notification of notifications) {
      if (!notification.user?.email) continue;

      try {
        // Get subject and content based on notification type
        const { subject, html } = getEmailContent(notification);

        await resend.emails.send({
          from: "Cookaholics <noreply@cookaholics.nl>",
          to: notification.user.email,
          subject,
          html,
        });

        // Mark as sent
        await convex.mutation(api.notifications.markEmailSent, {
          notificationId: notification._id,
        });

        sentCount++;
      } catch (error) {
        console.error(`Failed to send email to ${notification.user.email}:`, error);
        errors.push(`Failed to send to ${notification.user.email}`);
      }
    }

    return res.status(200).json({
      message: "Reminders processed",
      sent: sentCount,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error("Error processing reminders:", error);
    return res.status(500).json({ error: "Failed to process reminders" });
  }
}

function getEmailContent(notification: {
  type: string;
  title: string;
  message: string;
  user: { name: string; email: string } | null;
}): { subject: string; html: string } {
  const userName = notification.user?.name || "Collega";

  const baseStyles = `
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    max-width: 600px;
    margin: 0 auto;
    padding: 20px;
  `;

  const buttonStyles = `
    display: inline-block;
    padding: 12px 24px;
    background-color: #2563eb;
    color: white;
    text-decoration: none;
    border-radius: 6px;
    margin-top: 16px;
  `;

  let subject = notification.title;
  let content = "";
  let actionUrl = process.env.NEXT_PUBLIC_APP_URL || "https://cookaholics-meeting-intelligence.vercel.app";
  let actionText = "Bekijken";

  switch (notification.type) {
    case "action_item_assigned":
      subject = "📋 Nieuw actiepunt toegewezen";
      content = `<p>Er is een nieuw actiepunt aan je toegewezen:</p>
        <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
          <p style="margin: 0; font-weight: 500;">${notification.message}</p>
        </div>`;
      actionUrl += "/actiepunten/mijn";
      actionText = "Bekijk mijn actiepunten";
      break;

    case "action_item_deadline":
      subject = "⏰ Deadline morgen";
      content = `<p>Een van je actiepunten heeft morgen een deadline:</p>
        <div style="background: #fef3c7; padding: 16px; border-radius: 8px; margin: 16px 0;">
          <p style="margin: 0; font-weight: 500;">${notification.message}</p>
        </div>`;
      actionUrl += "/actiepunten/mijn";
      actionText = "Bekijk mijn actiepunten";
      break;

    case "action_item_overdue":
      subject = "🚨 Actiepunt verlopen";
      content = `<p>Een van je actiepunten is over de deadline:</p>
        <div style="background: #fee2e2; padding: 16px; border-radius: 8px; margin: 16px 0;">
          <p style="margin: 0; font-weight: 500; color: #dc2626;">${notification.message}</p>
        </div>`;
      actionUrl += "/actiepunten/mijn";
      actionText = "Bekijk mijn actiepunten";
      break;

    case "meeting_scheduled":
      subject = "📅 Nieuwe vergadering gepland";
      content = `<p>${notification.message}</p>`;
      actionUrl += "/vergaderingen";
      actionText = "Bekijk vergaderingen";
      break;

    case "meeting_reminder":
      subject = "🔔 Vergadering begint zo";
      content = `<p>${notification.message}</p>`;
      actionUrl += "/vergaderingen";
      actionText = "Bekijk vergaderingen";
      break;

    case "transcription_completed":
      subject = "✅ Transcriptie voltooid";
      content = `<p>${notification.message}</p>`;
      actionUrl += "/vergaderingen";
      actionText = "Bekijk vergadering";
      break;

    case "report_ready":
      subject = "📊 Nieuw rapport beschikbaar";
      content = `<p>${notification.message}</p>`;
      actionUrl += "/rapportages";
      actionText = "Bekijk rapporten";
      break;

    default:
      content = `<p>${notification.message}</p>`;
  }

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="${baseStyles}">
      <div style="border-bottom: 2px solid #2563eb; padding-bottom: 16px; margin-bottom: 24px;">
        <h1 style="margin: 0; color: #1f2937; font-size: 24px;">Cookaholics</h1>
        <p style="margin: 4px 0 0; color: #6b7280; font-size: 14px;">Meeting Intelligence</p>
      </div>

      <h2 style="color: #1f2937; margin-bottom: 16px;">Hoi ${userName},</h2>

      ${content}

      <a href="${actionUrl}" style="${buttonStyles}">${actionText}</a>

      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 32px 0;">

      <p style="color: #9ca3af; font-size: 12px;">
        Je ontvangt deze email omdat je notificatie-instellingen dit toestaan.
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/instellingen/meldingen" style="color: #6b7280;">
          Voorkeuren aanpassen
        </a>
      </p>
    </body>
    </html>
  `;

  return { subject, html };
}
