import type { NextApiRequest, NextApiResponse } from "next";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import Anthropic from "@anthropic-ai/sdk";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { type, departmentId, dateRangeStart, dateRangeEnd } = req.body;

  if (!type || !dateRangeStart || !dateRangeEnd) {
    return res.status(400).json({ error: "Type and date range are required" });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: "Anthropic API key not configured" });
  }

  try {
    // Get department name if specified
    let departmentName = "Alle afdelingen";
    if (departmentId) {
      const department = await convex.query(api.departments.getById, {
        id: departmentId as Id<"departments">,
      });
      if (department) {
        departmentName = department.name;
      }
    }

    // Get meetings for the report period
    const meetings = await convex.query(api.reports.getMeetingsForReport, {
      departmentId: departmentId as Id<"departments"> | undefined,
      dateRangeStart,
      dateRangeEnd,
    });

    if (meetings.length === 0) {
      return res.status(400).json({
        error: "Geen vergaderingen gevonden in deze periode",
      });
    }

    // Format meetings data for Claude
    const meetingsData = meetings.map((m) => ({
      title: m.title,
      date: new Date(m.date).toLocaleDateString("nl-NL"),
      summary: m.summary || "Geen samenvatting",
      redFlags: m.redFlags || [],
      actionItems: m.actionItems.map((ai) => ({
        description: ai.description,
        owner: ai.ownerName || "Niet toegewezen",
        status: ai.status,
        priority: ai.priority,
      })),
    }));

    // Determine report period label
    const startDate = new Date(dateRangeStart);
    const endDate = new Date(dateRangeEnd);
    const periodLabel = `${startDate.toLocaleDateString("nl-NL")} - ${endDate.toLocaleDateString("nl-NL")}`;

    const isWeekly = type.includes("weekly");
    const periodType = isWeekly ? "week" : "maand";

    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4000,
      messages: [
        {
          role: "user",
          content: `Je bent een management assistent voor Cookaholics, een cateringbedrijf in Nederland. Genereer een ${periodType}rapport voor ${departmentName}.

Periode: ${periodLabel}
Aantal vergaderingen: ${meetings.length}

DATA VAN VERGADERINGEN:
${JSON.stringify(meetingsData, null, 2)}

Genereer een professioneel rapport in het volgende formaat (gebruik exact deze markers):

---TITEL---
[Een passende titel voor dit rapport]

---SAMENVATTING---
[Executive summary van 2-3 alinea's met de belangrijkste ontwikkelingen]

---HIGHLIGHTS---
[JSON array met 3-5 belangrijkste highlights als strings]
["highlight 1", "highlight 2", ...]

---ACTIEPUNTEN_OVERZICHT---
[Overzicht van alle openstaande actiepunten, gegroepeerd per prioriteit]

---RODE_VLAGGEN---
[JSON array met eventuele rode vlaggen/aandachtspunten als strings]
["rode vlag 1", "rode vlag 2", ...]

---AANBEVELINGEN---
[2-3 concrete aanbevelingen voor de komende periode]

Schrijf in professioneel Nederlands. Focus op bruikbare inzichten voor het management.`,
        },
      ],
    });

    const content = response.content[0];
    if (content.type !== "text") {
      throw new Error("Unexpected response type");
    }

    const text = content.text;

    // Parse the response
    const titleMatch = text.match(/---TITEL---\s*([\s\S]*?)(?=---SAMENVATTING---|$)/);
    const summaryMatch = text.match(/---SAMENVATTING---\s*([\s\S]*?)(?=---HIGHLIGHTS---|$)/);
    const highlightsMatch = text.match(/---HIGHLIGHTS---\s*([\s\S]*?)(?=---ACTIEPUNTEN_OVERZICHT---|$)/);
    const actionOverviewMatch = text.match(/---ACTIEPUNTEN_OVERZICHT---\s*([\s\S]*?)(?=---RODE_VLAGGEN---|$)/);
    const redFlagsMatch = text.match(/---RODE_VLAGGEN---\s*([\s\S]*?)(?=---AANBEVELINGEN---|$)/);
    const recommendationsMatch = text.match(/---AANBEVELINGEN---\s*([\s\S]*?)$/);

    const title = titleMatch ? titleMatch[1].trim() : `${periodType}rapport ${departmentName}`;
    const summary = summaryMatch ? summaryMatch[1].trim() : "";
    const actionOverview = actionOverviewMatch ? actionOverviewMatch[1].trim() : "";
    const recommendations = recommendationsMatch ? recommendationsMatch[1].trim() : "";

    // Parse JSON arrays
    let highlights: string[] = [];
    let redFlags: string[] = [];

    try {
      if (highlightsMatch) {
        const jsonMatch = highlightsMatch[1].match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          highlights = JSON.parse(jsonMatch[0]);
        }
      }
    } catch (e) {
      console.error("Failed to parse highlights:", e);
    }

    try {
      if (redFlagsMatch) {
        const jsonMatch = redFlagsMatch[1].match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          redFlags = JSON.parse(jsonMatch[0]);
        }
      }
    } catch (e) {
      console.error("Failed to parse red flags:", e);
    }

    // Build full report content
    const fullContent = `# ${title}

**Periode:** ${periodLabel}
**Afdeling:** ${departmentName}
**Aantal vergaderingen:** ${meetings.length}

## Samenvatting

${summary}

## Actiepunten Overzicht

${actionOverview}

## Aanbevelingen

${recommendations}`;

    // Save report to database
    const reportId = await convex.mutation(api.reports.create, {
      type: type as "weekly_department" | "weekly_mt" | "monthly_department" | "monthly_mt",
      departmentId: departmentId as Id<"departments"> | undefined,
      dateRangeStart,
      dateRangeEnd,
      content: fullContent,
      highlights,
      redFlags,
    });

    return res.status(200).json({
      success: true,
      reportId,
      title,
      highlights,
      redFlags,
    });
  } catch (error) {
    console.error("Report generation error:", error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Report generation failed",
    });
  }
}
