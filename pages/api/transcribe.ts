import type { NextApiRequest, NextApiResponse } from "next";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export const config = {
  api: {
    bodyParser: true,
    responseLimit: false,
  },
};

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

  try {
    // Get the meeting to get the audio file ID
    const meeting = await convex.query(api.meetings.getById, {
      id: meetingId as Id<"meetings">,
    });

    if (!meeting) {
      return res.status(404).json({ error: "Meeting not found" });
    }

    if (!meeting.audioFileId) {
      return res.status(400).json({ error: "No audio file attached to meeting" });
    }

    // Get the audio URL from Convex storage
    const audioUrl = await convex.query(api.meetings.getAudioUrl, {
      storageId: meeting.audioFileId,
    });

    if (!audioUrl) {
      return res.status(400).json({ error: "Could not get audio URL" });
    }

    // Download the audio file
    const audioResponse = await fetch(audioUrl);
    if (!audioResponse.ok) {
      throw new Error("Failed to fetch audio file");
    }

    const audioBlob = await audioResponse.blob();

    // Check if OpenAI API key is configured
    // Use placeholder for testing (set USE_PLACEHOLDER_TRANSCRIPTION=true in .env.local)
    const usePlaceholder = !process.env.OPENAI_API_KEY || process.env.USE_PLACEHOLDER_TRANSCRIPTION === "true";

    if (usePlaceholder) {
      console.warn("Using placeholder transcription (no API key or placeholder mode enabled)");

      await convex.mutation(api.meetings.updateTranscription, {
        meetingId: meetingId as Id<"meetings">,
        transcription: "[Transcriptie placeholder - configureer OPENAI_API_KEY voor echte transcriptie]\n\nDit is een placeholder transcriptie. In productie wordt dit vervangen door de echte transcriptie via OpenAI Whisper.",
        status: "completed",
      });

      return res.status(200).json({
        success: true,
        message: "Placeholder transcription saved (no API key configured)",
      });
    }

    // Create form data for Whisper API
    const formData = new FormData();
    formData.append("file", audioBlob, meeting.audioFileName || "audio.mp3");
    formData.append("model", "whisper-1");
    formData.append("language", "nl"); // Dutch language
    formData.append("response_format", "text");

    // Call OpenAI Whisper API
    const whisperResponse = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: formData,
    });

    if (!whisperResponse.ok) {
      const error = await whisperResponse.text();
      console.error("Whisper API error:", error);

      await convex.mutation(api.meetings.failTranscription, {
        meetingId: meetingId as Id<"meetings">,
        error: `Whisper API error: ${whisperResponse.status}`,
      });

      return res.status(500).json({ error: "Transcription failed" });
    }

    const transcription = await whisperResponse.text();

    // Save transcription to database
    await convex.mutation(api.meetings.updateTranscription, {
      meetingId: meetingId as Id<"meetings">,
      transcription,
      status: "completed",
    });

    return res.status(200).json({
      success: true,
      message: "Transcription completed",
    });
  } catch (error) {
    console.error("Transcription error:", error);

    // Mark transcription as failed
    try {
      await convex.mutation(api.meetings.failTranscription, {
        meetingId: meetingId as Id<"meetings">,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    } catch {
      console.error("Failed to update transcription status");
    }

    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Full error:", error);

    return res.status(500).json({
      error: errorMessage,
      details: errorMessage,
    });
  }
}
