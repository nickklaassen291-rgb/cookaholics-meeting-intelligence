import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// Get all meeting types
export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("meetingTypes").collect();
  },
});

// Get meeting type by slug
export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("meetingTypes")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();
  },
});

// Seed initial meeting types based on PRD
export const seed = mutation({
  args: {},
  handler: async (ctx) => {
    const existingTypes = await ctx.db.query("meetingTypes").collect();
    if (existingTypes.length > 0) {
      return { message: "Meeting types already seeded", count: existingTypes.length };
    }

    const meetingTypes = [
      {
        name: "Daily Standup",
        slug: "daily",
        defaultDuration: 15,
        frequency: "daily" as const,
        description: "Quick daily check-in meeting",
      },
      {
        name: "Weekly Team Meeting",
        slug: "weekly",
        defaultDuration: 60,
        frequency: "weekly" as const,
        description: "Weekly department team meeting",
      },
      {
        name: "Monthly Review",
        slug: "monthly",
        defaultDuration: 90,
        frequency: "monthly" as const,
        description: "Monthly department review meeting",
      },
      {
        name: "Quarterly Planning",
        slug: "quarterly",
        defaultDuration: 240,
        frequency: "quarterly" as const,
        description: "Quarterly MT planning session",
      },
      {
        name: "Marketing-Sales Sync",
        slug: "cross-marketing-sales",
        defaultDuration: 45,
        frequency: "weekly" as const,
        description: "Cross-department sync between Marketing and Sales",
      },
      {
        name: "Keuken-Sales Sync",
        slug: "cross-keuken-sales",
        defaultDuration: 45,
        frequency: "weekly" as const,
        description: "Cross-department sync between Keuken and Sales",
      },
      {
        name: "Project Meeting",
        slug: "cross-project",
        defaultDuration: 60,
        frequency: "weekly" as const,
        description: "Cross-department project meeting",
      },
    ];

    for (const type of meetingTypes) {
      await ctx.db.insert("meetingTypes", {
        ...type,
        createdAt: Date.now(),
      });
    }

    return { message: "Meeting types seeded", count: meetingTypes.length };
  },
});
