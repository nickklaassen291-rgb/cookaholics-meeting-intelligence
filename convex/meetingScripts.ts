import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// Get all scripts
export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("meetingScripts").collect();
  },
});

// Get scripts by meeting type
export const getByMeetingType = query({
  args: { meetingTypeId: v.id("meetingTypes") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("meetingScripts")
      .withIndex("by_meeting_type", (q) => q.eq("meetingTypeId", args.meetingTypeId))
      .collect();
  },
});

// Get default script for a meeting type
export const getDefaultByMeetingType = query({
  args: { meetingTypeId: v.id("meetingTypes") },
  handler: async (ctx, args) => {
    const scripts = await ctx.db
      .query("meetingScripts")
      .withIndex("by_meeting_type", (q) => q.eq("meetingTypeId", args.meetingTypeId))
      .collect();

    return scripts.find((s) => s.isDefault) || scripts[0] || null;
  },
});

// Get script by ID
export const getById = query({
  args: { id: v.id("meetingScripts") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// Create a new script
export const create = mutation({
  args: {
    meetingTypeId: v.id("meetingTypes"),
    name: v.string(),
    sections: v.array(v.object({
      title: v.string(),
      description: v.string(),
      samplePhrases: v.optional(v.array(v.string())),
      order: v.number(),
    })),
    isDefault: v.boolean(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // If this is set as default, unset other defaults for this meeting type
    if (args.isDefault) {
      const existingScripts = await ctx.db
        .query("meetingScripts")
        .withIndex("by_meeting_type", (q) => q.eq("meetingTypeId", args.meetingTypeId))
        .collect();

      for (const script of existingScripts) {
        if (script.isDefault) {
          await ctx.db.patch(script._id, { isDefault: false, updatedAt: now });
        }
      }
    }

    return await ctx.db.insert("meetingScripts", {
      meetingTypeId: args.meetingTypeId,
      name: args.name,
      sections: args.sections,
      isDefault: args.isDefault,
      createdAt: now,
      updatedAt: now,
    });
  },
});

// Update a script
export const update = mutation({
  args: {
    id: v.id("meetingScripts"),
    name: v.optional(v.string()),
    sections: v.optional(v.array(v.object({
      title: v.string(),
      description: v.string(),
      samplePhrases: v.optional(v.array(v.string())),
      order: v.number(),
    }))),
    isDefault: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    const script = await ctx.db.get(id);
    if (!script) throw new Error("Script not found");

    const now = Date.now();

    // If setting as default, unset other defaults
    if (updates.isDefault === true) {
      const existingScripts = await ctx.db
        .query("meetingScripts")
        .withIndex("by_meeting_type", (q) => q.eq("meetingTypeId", script.meetingTypeId))
        .collect();

      for (const s of existingScripts) {
        if (s._id !== id && s.isDefault) {
          await ctx.db.patch(s._id, { isDefault: false, updatedAt: now });
        }
      }
    }

    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([, val]) => val !== undefined)
    );

    await ctx.db.patch(id, {
      ...filteredUpdates,
      updatedAt: now,
    });
  },
});

// Delete a script
export const remove = mutation({
  args: { id: v.id("meetingScripts") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

// Seed default scripts for all meeting types
export const seed = mutation({
  args: {},
  handler: async (ctx) => {
    const existingScripts = await ctx.db.query("meetingScripts").collect();
    if (existingScripts.length > 0) {
      return { message: "Scripts already seeded", count: existingScripts.length };
    }

    const meetingTypes = await ctx.db.query("meetingTypes").collect();
    const now = Date.now();

    // Default script structure for each meeting type
    const defaultSections = [
      {
        title: "Opening",
        description: "Start de vergadering en heet iedereen welkom",
        samplePhrases: [
          "Goedemorgen allemaal, welkom bij de vergadering.",
          "Laten we beginnen. Is iedereen aanwezig?",
          "De vergadering is geopend.",
        ],
        order: 1,
      },
      {
        title: "Vorige Actiepunten",
        description: "Loop de actiepunten van de vorige vergadering door",
        samplePhrases: [
          "Laten we eerst de actiepunten van vorige week doornemen.",
          "Wat is de status van de openstaande acties?",
          "[Naam], kun je een update geven over jouw actiepunt?",
        ],
        order: 2,
      },
      {
        title: "Agenda",
        description: "Bespreek de agendapunten van vandaag",
        samplePhrases: [
          "Het eerste agendapunt is...",
          "Zijn er nog vragen of opmerkingen hierover?",
          "Laten we verder gaan naar het volgende punt.",
        ],
        order: 3,
      },
      {
        title: "Nieuwe Actiepunten",
        description: "Vat de nieuwe actiepunten samen",
        samplePhrases: [
          "Laten we de nieuwe actiepunten samenvatten.",
          "[Naam] neemt actie op... met deadline...",
          "Zijn alle actiepunten duidelijk?",
        ],
        order: 4,
      },
      {
        title: "Afsluiting",
        description: "Sluit de vergadering af",
        samplePhrases: [
          "Zijn er nog rondvragen?",
          "De volgende vergadering is gepland op...",
          "Bedankt voor jullie aanwezigheid. De vergadering is gesloten.",
        ],
        order: 5,
      },
    ];

    for (const meetingType of meetingTypes) {
      await ctx.db.insert("meetingScripts", {
        meetingTypeId: meetingType._id,
        name: `Standaard script - ${meetingType.name}`,
        sections: defaultSections,
        isDefault: true,
        createdAt: now,
        updatedAt: now,
      });
    }

    return { message: "Scripts seeded", count: meetingTypes.length };
  },
});
