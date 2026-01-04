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

  const { meetingId } = req.body;

  if (!meetingId) {
    return res.status(400).json({ error: "Meeting ID is required" });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: "Anthropic API key not configured" });
  }

  try {
    // Get the meeting with transcription
    const meeting = await convex.query(api.meetings.getById, {
      id: meetingId as Id<"meetings">,
    });

    if (!meeting) {
      return res.status(404).json({ error: "Meeting not found" });
    }

    if (!meeting.transcription) {
      return res.status(400).json({ error: "No transcription available" });
    }

    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    // Generate summary, action items, and red flags
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2000,
      messages: [
        {
          role: "user",
          content: `Je bent een assistent die vergadernotities analyseert voor een Nederlands bedrijf genaamd Cookaholics (een cateringbedrijf).

Analyseer de volgende transcriptie van een vergadering en geef:

1. **SAMENVATTING**: Een beknopte samenvatting van de vergadering (max 3-4 alinea's)

2. **ACTIEPUNTEN**: Een lijst van concrete actiepunten in JSON-formaat:
[{"description": "beschrijving", "ownerName": "naam van verantwoordelijke of null", "priority": "high/medium/low", "deadline": "datum indien genoemd of null"}]

3. **RODE VLAGGEN**: Eventuele escalaties, problemen of aandachtspunten in JSON-formaat:
[{"type": "type probleem", "description": "beschrijving", "severity": "high/medium/low"}]

Geef je antwoord in het volgende formaat (gebruik exact deze markers):

---SAMENVATTING---
[samenvatting hier]

---ACTIEPUNTEN---
[JSON array hier]

---RODE_VLAGGEN---
[JSON array hier]

TRANSCRIPTIE:
${meeting.transcription}`,
        },
      ],
    });

    const content = response.content[0];
    if (content.type !== "text") {
      throw new Error("Unexpected response type");
    }

    const text = content.text;

    // Parse the response
    const summaryMatch = text.match(/---SAMENVATTING---\s*([\s\S]*?)(?=---ACTIEPUNTEN---|$)/);
    const actionItemsMatch = text.match(/---ACTIEPUNTEN---\s*([\s\S]*?)(?=---RODE_VLAGGEN---|$)/);
    const redFlagsMatch = text.match(/---RODE_VLAGGEN---\s*([\s\S]*?)$/);

    const summary = summaryMatch ? summaryMatch[1].trim() : "";

    let actionItems: Array<{
      description: string;
      ownerName?: string;
      priority: string;
      deadline?: string;
    }> = [];

    let redFlags: Array<{
      type: string;
      description: string;
      severity: string;
    }> = [];

    try {
      if (actionItemsMatch) {
        const jsonMatch = actionItemsMatch[1].match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          actionItems = JSON.parse(jsonMatch[0]);
        }
      }
    } catch (e) {
      console.error("Failed to parse action items:", e);
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

    // Save summary to meeting
    await convex.mutation(api.meetings.updateSummary, {
      meetingId: meetingId as Id<"meetings">,
      summary,
      redFlags,
    });

    // Create action items
    for (const item of actionItems) {
      await convex.mutation(api.actionItems.create, {
        meetingId: meetingId as Id<"meetings">,
        description: item.description,
        ownerName: item.ownerName || undefined,
        priority: item.priority as "high" | "medium" | "low",
        deadline: item.deadline ? new Date(item.deadline).getTime() : undefined,
      });
    }

    return res.status(200).json({
      success: true,
      summary,
      actionItemsCount: actionItems.length,
      redFlagsCount: redFlags.length,
    });
  } catch (error) {
    console.error("Summarization error:", error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Summarization failed",
    });
  }
}
