import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// Get all reports
export const list = query({
  args: {
    type: v.optional(v.union(
      v.literal("weekly_department"),
      v.literal("weekly_mt"),
      v.literal("monthly_department"),
      v.literal("monthly_mt")
    )),
    departmentId: v.optional(v.id("departments")),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let reports = await ctx.db.query("reports").order("desc").collect();

    if (args.type) {
      reports = reports.filter((r) => r.type === args.type);
    }

    if (args.departmentId) {
      reports = reports.filter((r) => r.departmentId === args.departmentId);
    }

    if (args.limit) {
      reports = reports.slice(0, args.limit);
    }

    return reports;
  },
});

// Get report by ID
export const getById = query({
  args: { id: v.id("reports") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// Create a new report
export const create = mutation({
  args: {
    type: v.union(
      v.literal("weekly_department"),
      v.literal("weekly_mt"),
      v.literal("monthly_department"),
      v.literal("monthly_mt")
    ),
    departmentId: v.optional(v.id("departments")),
    dateRangeStart: v.number(),
    dateRangeEnd: v.number(),
    content: v.string(),
    highlights: v.optional(v.array(v.string())),
    redFlags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("reports", {
      type: args.type,
      departmentId: args.departmentId,
      dateRangeStart: args.dateRangeStart,
      dateRangeEnd: args.dateRangeEnd,
      content: args.content,
      highlights: args.highlights,
      redFlags: args.redFlags,
      createdAt: Date.now(),
    });
  },
});

// Mark report as sent
export const markAsSent = mutation({
  args: {
    reportId: v.id("reports"),
    recipientIds: v.array(v.id("users")),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.reportId, {
      sentAt: Date.now(),
      recipientIds: args.recipientIds,
    });
  },
});

// Delete a report
export const remove = mutation({
  args: { id: v.id("reports") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

// Get meetings for report generation
export const getMeetingsForReport = query({
  args: {
    departmentId: v.optional(v.id("departments")),
    dateRangeStart: v.number(),
    dateRangeEnd: v.number(),
  },
  handler: async (ctx, args) => {
    const meetings = await ctx.db
      .query("meetings")
      .withIndex("by_date")
      .filter((q) =>
        q.and(
          q.gte(q.field("date"), args.dateRangeStart),
          q.lte(q.field("date"), args.dateRangeEnd)
        )
      )
      .collect();

    // Filter by department if specified
    let filteredMeetings = meetings;
    if (args.departmentId) {
      filteredMeetings = meetings.filter((m) =>
        m.departmentIds.includes(args.departmentId!)
      );
    }

    // Get action items for each meeting
    const meetingsWithActionItems = await Promise.all(
      filteredMeetings.map(async (meeting) => {
        const actionItems = await ctx.db
          .query("actionItems")
          .withIndex("by_meeting", (q) => q.eq("meetingId", meeting._id))
          .collect();

        return {
          ...meeting,
          actionItems,
        };
      })
    );

    return meetingsWithActionItems;
  },
});
