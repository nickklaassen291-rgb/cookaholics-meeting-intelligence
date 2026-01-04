import type { NextApiRequest, NextApiResponse } from "next";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Resend } from "resend";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

type ReportType = "weekly_department" | "weekly_mt" | "monthly_department" | "monthly_mt";

const reportTypeLabels: Record<ReportType, string> = {
  weekly_department: "Weekrapport Afdeling",
  weekly_mt: "Weekrapport MT",
  monthly_department: "Maandrapport Afdeling",
  monthly_mt: "Maandrapport MT",
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { reportId, recipientEmail } = req.body;

  if (!reportId) {
    return res.status(400).json({ error: "Report ID is required" });
  }

  if (!recipientEmail) {
    return res.status(400).json({ error: "Recipient email is required" });
  }

  if (!process.env.RESEND_API_KEY) {
    return res.status(500).json({ error: "Resend API key not configured" });
  }

  try {
    // Get the report
    const report = await convex.query(api.reports.getById, {
      id: reportId as Id<"reports">,
    });

    if (!report) {
      return res.status(404).json({ error: "Report not found" });
    }

    // Get department name if applicable
    let departmentName = "";
    if (report.departmentId) {
      const department = await convex.query(api.departments.getById, {
        id: report.departmentId,
      });
      if (department) {
        departmentName = department.name;
      }
    }

    const resend = new Resend(process.env.RESEND_API_KEY);

    // Format date range
    const startDate = new Date(report.dateRangeStart);
    const endDate = new Date(report.dateRangeEnd);
    const periodLabel = `${startDate.toLocaleDateString("nl-NL")} - ${endDate.toLocaleDateString("nl-NL")}`;

    // Convert markdown to HTML (basic conversion)
    const contentHtml = report.content
      .replace(/^### (.*$)/gim, '<h3 style="color: #1a1a1a; margin-top: 20px;">$1</h3>')
      .replace(/^## (.*$)/gim, '<h2 style="color: #1a1a1a; margin-top: 24px;">$1</h2>')
      .replace(/^# (.*$)/gim, '<h1 style="color: #1a1a1a; margin-top: 0;">$1</h1>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br>');

    // Build highlights HTML
    let highlightsHtml = "";
    if (report.highlights && report.highlights.length > 0) {
      highlightsHtml = `
        <div style="background: #f0fdf4; padding: 16px; border-radius: 8px; margin-top: 24px;">
          <h3 style="color: #166534; margin: 0 0 12px 0;">✨ Highlights</h3>
          <ul style="margin: 0; padding-left: 20px;">
            ${report.highlights.map((h) => `<li style="margin-bottom: 8px;">${h}</li>`).join("")}
          </ul>
        </div>
      `;
    }

    // Build red flags HTML
    let redFlagsHtml = "";
    if (report.redFlags && report.redFlags.length > 0) {
      redFlagsHtml = `
        <div style="background: #fef2f2; padding: 16px; border-radius: 8px; margin-top: 24px;">
          <h3 style="color: #dc2626; margin: 0 0 12px 0;">⚠️ Aandachtspunten</h3>
          <ul style="margin: 0; padding-left: 20px;">
            ${report.redFlags.map((f) => `<li style="margin-bottom: 8px;">${f}</li>`).join("")}
          </ul>
        </div>
      `;
    }

    const reportTitle = reportTypeLabels[report.type as ReportType];

    // Send email
    const { data, error } = await resend.emails.send({
      from: "Cookaholics <onboarding@resend.dev>",
      to: recipientEmail,
      subject: `${reportTitle}${departmentName ? ` - ${departmentName}` : ""} (${periodLabel})`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1a1a1a; max-width: 700px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 24px; border-radius: 12px 12px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px;">📊 ${reportTitle}</h1>
            ${departmentName ? `<p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0;">Afdeling: ${departmentName}</p>` : ""}
          </div>

          <div style="background: #f9fafb; padding: 24px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
            <p style="color: #666; margin-bottom: 24px;">
              📅 Periode: ${periodLabel}
            </p>

            <div style="background: white; padding: 24px; border-radius: 8px; border: 1px solid #e5e7eb;">
              ${contentHtml}
            </div>

            ${highlightsHtml}

            ${redFlagsHtml}

            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">

            <p style="color: #666; font-size: 14px; margin-bottom: 0;">
              Dit rapport is automatisch gegenereerd door Cookaholics Meeting Intelligence.
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
