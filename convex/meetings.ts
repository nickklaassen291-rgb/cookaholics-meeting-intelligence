import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// Get all meetings
export const list = query({
  args: {
    status: v.optional(v.union(
      v.literal("scheduled"),
      v.literal("completed"),
      v.literal("cancelled")
    )),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const meetings = await ctx.db.query("meetings").order("desc").collect();

    let filtered = meetings;
    if (args.status) {
      filtered = meetings.filter((m) => m.status === args.status);
    }

    if (args.limit) {
      filtered = filtered.slice(0, args.limit);
    }

    return filtered;
  },
});

// Get meetings by department
export const listByDepartment = query({
  args: {
    departmentId: v.id("departments"),
    status: v.optional(v.union(
      v.literal("scheduled"),
      v.literal("completed"),
      v.literal("cancelled")
    )),
  },
  handler: async (ctx, args) => {
    const meetings = await ctx.db.query("meetings").order("desc").collect();

    return meetings.filter((m) => {
      const deptMatch = m.departmentIds.includes(args.departmentId);
      const statusMatch = !args.status || m.status === args.status;
      return deptMatch && statusMatch;
    });
  },
});

// Get upcoming meetings
export const listUpcoming = query({
  args: {
    departmentId: v.optional(v.id("departments")),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const meetings = await ctx.db
      .query("meetings")
      .withIndex("by_date")
      .order("asc")
      .collect();

    let filtered = meetings.filter(
      (m) => m.date >= now && m.status === "scheduled"
    );

    if (args.departmentId) {
      filtered = filtered.filter((m) =>
        m.departmentIds.includes(args.departmentId!)
      );
    }

    if (args.limit) {
      filtered = filtered.slice(0, args.limit);
    }

    return filtered;
  },
});

// Get meeting by ID
export const getById = query({
  args: { id: v.id("meetings") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// Create a new meeting
export const create = mutation({
  args: {
    title: v.string(),
    meetingTypeId: v.id("meetingTypes"),
    date: v.number(),
    duration: v.number(),
    departmentIds: v.array(v.id("departments")),
    attendeeIds: v.array(v.id("users")),
    createdById: v.id("users"),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    return await ctx.db.insert("meetings", {
      title: args.title,
      meetingTypeId: args.meetingTypeId,
      date: args.date,
      duration: args.duration,
      departmentIds: args.departmentIds,
      attendeeIds: args.attendeeIds,
      status: "scheduled",
      createdById: args.createdById,
      createdAt: now,
      updatedAt: now,
    });
  },
});

// Update meeting status
export const updateStatus = mutation({
  args: {
    id: v.id("meetings"),
    status: v.union(
      v.literal("scheduled"),
      v.literal("completed"),
      v.literal("cancelled")
    ),
    presentAttendeeIds: v.optional(v.array(v.id("users"))),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      status: args.status,
      presentAttendeeIds: args.presentAttendeeIds,
      updatedAt: Date.now(),
    });
  },
});

// Update meeting details
export const update = mutation({
  args: {
    id: v.id("meetings"),
    title: v.optional(v.string()),
    date: v.optional(v.number()),
    duration: v.optional(v.number()),
    attendeeIds: v.optional(v.array(v.id("users"))),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([, val]) => val !== undefined)
    );

    await ctx.db.patch(id, {
      ...filteredUpdates,
      updatedAt: Date.now(),
    });
  },
});

// Delete meeting
export const remove = mutation({
  args: { id: v.id("meetings") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

// Generate upload URL for audio file
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

// Save audio file reference to meeting
export const saveAudioFile = mutation({
  args: {
    meetingId: v.id("meetings"),
    storageId: v.id("_storage"),
    fileName: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.meetingId, {
      audioFileId: args.storageId,
      audioFileName: args.fileName,
      transcriptionStatus: "pending",
      updatedAt: Date.now(),
    });
  },
});

// Get audio URL
export const getAudioUrl = query({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, args) => {
    return await ctx.storage.getUrl(args.storageId);
  },
});

// Start transcription process
export const startTranscription = mutation({
  args: {
    meetingId: v.id("meetings"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.meetingId, {
      transcriptionStatus: "processing",
      updatedAt: Date.now(),
    });
  },
});

// Update transcription result
export const updateTranscription = mutation({
  args: {
    meetingId: v.id("meetings"),
    transcription: v.string(),
    status: v.union(v.literal("completed"), v.literal("failed")),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.meetingId, {
      transcription: args.transcription,
      transcriptionStatus: args.status,
      updatedAt: Date.now(),
    });
  },
});

// Mark transcription as failed
export const failTranscription = mutation({
  args: {
    meetingId: v.id("meetings"),
    error: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.meetingId, {
      transcriptionStatus: "failed",
      updatedAt: Date.now(),
    });
  },
});

// Retry transcription
export const retryTranscription = mutation({
  args: {
    meetingId: v.id("meetings"),
  },
  handler: async (ctx, args) => {
    const meeting = await ctx.db.get(args.meetingId);
    if (!meeting?.audioFileId) {
      throw new Error("No audio file found");
    }

    await ctx.db.patch(args.meetingId, {
      transcriptionStatus: "processing",
      updatedAt: Date.now(),
    });
  },
});

// Update summary and red flags
export const updateSummary = mutation({
  args: {
    meetingId: v.id("meetings"),
    summary: v.string(),
    redFlags: v.optional(v.array(v.object({
      type: v.string(),
      description: v.string(),
      severity: v.string(),
    }))),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.meetingId, {
      summary: args.summary,
      redFlags: args.redFlags,
      updatedAt: Date.now(),
    });
  },
});
