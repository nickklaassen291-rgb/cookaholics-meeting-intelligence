import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { requireAuth, getAuthenticatedUser, filterMeetingsByAccess, canAccessMeeting, isAdmin, isMT, AuthError } from "./lib/auth";

// Get all meetings (filtered by user access)
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
    // Use graceful auth - return empty list if user not set up yet
    const user = await getAuthenticatedUser(ctx);
    if (!user) {
      return [];
    }

    const meetings = await ctx.db.query("meetings").order("desc").collect();

    // Filter by user access (MT/admin sees all, others see own department)
    let filtered = filterMeetingsByAccess(user, meetings);

    if (args.status) {
      filtered = filtered.filter((m) => m.status === args.status);
    }

    if (args.limit) {
      filtered = filtered.slice(0, args.limit);
    }

    return filtered;
  },
});

// Get meetings by department (with access control)
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
    const user = await requireAuth(ctx);

    // Check if user can access this department's data
    if (!isAdmin(user) && !isMT(user) && user.departmentId !== args.departmentId) {
      throw new AuthError(
        "Je hebt geen toegang tot de vergaderingen van deze afdeling",
        "FORBIDDEN"
      );
    }

    const meetings = await ctx.db.query("meetings").order("desc").collect();

    return meetings.filter((m) => {
      const deptMatch = m.departmentIds.includes(args.departmentId);
      const statusMatch = !args.status || m.status === args.status;
      return deptMatch && statusMatch;
    });
  },
});

// Get upcoming meetings (with access control)
export const listUpcoming = query({
  args: {
    departmentId: v.optional(v.id("departments")),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);

    const now = Date.now();
    const meetings = await ctx.db
      .query("meetings")
      .withIndex("by_date")
      .order("asc")
      .collect();

    let filtered = meetings.filter(
      (m) => m.date >= now && m.status === "scheduled"
    );

    // Apply department filter if specified
    if (args.departmentId) {
      // Check access if filtering by specific department
      if (!isAdmin(user) && !isMT(user) && user.departmentId !== args.departmentId) {
        throw new AuthError(
          "Je hebt geen toegang tot de vergaderingen van deze afdeling",
          "FORBIDDEN"
        );
      }
      filtered = filtered.filter((m) =>
        m.departmentIds.includes(args.departmentId!)
      );
    } else {
      // If no department specified, filter by user access
      filtered = filterMeetingsByAccess(user, filtered);
    }

    if (args.limit) {
      filtered = filtered.slice(0, args.limit);
    }

    return filtered;
  },
});

// Get meeting by ID (with access control)
export const getById = query({
  args: { id: v.id("meetings") },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);

    const meeting = await ctx.db.get(args.id);
    if (!meeting) {
      return null;
    }

    // Check if user can access this meeting
    if (!canAccessMeeting(user, meeting.departmentIds)) {
      throw new AuthError(
        "Je hebt geen toegang tot deze vergadering",
        "FORBIDDEN"
      );
    }

    return meeting;
  },
});

// Create a new meeting (authenticated users only)
export const create = mutation({
  args: {
    title: v.string(),
    meetingTypeId: v.id("meetingTypes"),
    date: v.number(),
    duration: v.number(),
    departmentIds: v.array(v.id("departments")),
    attendeeIds: v.array(v.id("users")),
  },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);

    // Non-admin/MT users can only create meetings for their own department
    if (!isAdmin(user) && !isMT(user)) {
      const hasOwnDept = args.departmentIds.includes(user.departmentId);
      if (!hasOwnDept) {
        throw new AuthError(
          "Je kunt alleen vergaderingen aanmaken voor je eigen afdeling",
          "FORBIDDEN"
        );
      }
    }

    const now = Date.now();

    return await ctx.db.insert("meetings", {
      title: args.title,
      meetingTypeId: args.meetingTypeId,
      date: args.date,
      duration: args.duration,
      departmentIds: args.departmentIds,
      attendeeIds: args.attendeeIds,
      status: "scheduled",
      createdById: user._id,
      createdAt: now,
      updatedAt: now,
    });
  },
});

// Update meeting status (with access control)
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
    const user = await requireAuth(ctx);

    const meeting = await ctx.db.get(args.id);
    if (!meeting) {
      throw new AuthError("Vergadering niet gevonden", "FORBIDDEN");
    }

    // Check if user can modify this meeting
    if (!canAccessMeeting(user, meeting.departmentIds)) {
      throw new AuthError(
        "Je hebt geen toestemming om deze vergadering te wijzigen",
        "FORBIDDEN"
      );
    }

    await ctx.db.patch(args.id, {
      status: args.status,
      presentAttendeeIds: args.presentAttendeeIds,
      updatedAt: Date.now(),
    });
  },
});

// Update meeting details (with access control)
export const update = mutation({
  args: {
    id: v.id("meetings"),
    title: v.optional(v.string()),
    date: v.optional(v.number()),
    duration: v.optional(v.number()),
    attendeeIds: v.optional(v.array(v.id("users"))),
  },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);

    const meeting = await ctx.db.get(args.id);
    if (!meeting) {
      throw new AuthError("Vergadering niet gevonden", "FORBIDDEN");
    }

    // Check if user can modify this meeting
    if (!canAccessMeeting(user, meeting.departmentIds)) {
      throw new AuthError(
        "Je hebt geen toestemming om deze vergadering te wijzigen",
        "FORBIDDEN"
      );
    }

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

// Delete meeting (admin or creator only)
export const remove = mutation({
  args: { id: v.id("meetings") },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);

    const meeting = await ctx.db.get(args.id);
    if (!meeting) {
      throw new AuthError("Vergadering niet gevonden", "FORBIDDEN");
    }

    // Only admin or creator can delete meetings
    if (!isAdmin(user) && meeting.createdById !== user._id) {
      throw new AuthError(
        "Alleen de aanmaker of een admin kan deze vergadering verwijderen",
        "FORBIDDEN"
      );
    }

    await ctx.db.delete(args.id);
  },
});

// Generate upload URL for audio file (authenticated users only)
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    await requireAuth(ctx);
    return await ctx.storage.generateUploadUrl();
  },
});

// Save audio file reference to meeting (with access control)
export const saveAudioFile = mutation({
  args: {
    meetingId: v.id("meetings"),
    storageId: v.id("_storage"),
    fileName: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);

    const meeting = await ctx.db.get(args.meetingId);
    if (!meeting) {
      throw new AuthError("Vergadering niet gevonden", "FORBIDDEN");
    }

    if (!canAccessMeeting(user, meeting.departmentIds)) {
      throw new AuthError(
        "Je hebt geen toestemming om een audio bestand aan deze vergadering toe te voegen",
        "FORBIDDEN"
      );
    }

    await ctx.db.patch(args.meetingId, {
      audioFileId: args.storageId,
      audioFileName: args.fileName,
      transcriptionStatus: "pending",
      updatedAt: Date.now(),
    });
  },
});

// Get audio URL (with access control)
export const getAudioUrl = query({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    return await ctx.storage.getUrl(args.storageId);
  },
});

// Start transcription process (with access control)
export const startTranscription = mutation({
  args: {
    meetingId: v.id("meetings"),
  },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);

    const meeting = await ctx.db.get(args.meetingId);
    if (!meeting) {
      throw new AuthError("Vergadering niet gevonden", "FORBIDDEN");
    }

    if (!canAccessMeeting(user, meeting.departmentIds)) {
      throw new AuthError(
        "Je hebt geen toestemming om transcriptie te starten voor deze vergadering",
        "FORBIDDEN"
      );
    }

    await ctx.db.patch(args.meetingId, {
      transcriptionStatus: "processing",
      updatedAt: Date.now(),
    });
  },
});

// Update transcription result (internal/system use)
export const updateTranscription = mutation({
  args: {
    meetingId: v.id("meetings"),
    transcription: v.string(),
    status: v.union(v.literal("completed"), v.literal("failed")),
  },
  handler: async (ctx, args) => {
    // This is called by the API route after transcription
    // Authentication handled at API level
    await ctx.db.patch(args.meetingId, {
      transcription: args.transcription,
      transcriptionStatus: args.status,
      updatedAt: Date.now(),
    });
  },
});

// Get today's meetings (with access control)
export const listToday = query({
  args: {
    departmentId: v.optional(v.id("departments")),
  },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999).getTime();

    const meetings = await ctx.db
      .query("meetings")
      .withIndex("by_date")
      .filter((q) =>
        q.and(
          q.gte(q.field("date"), todayStart),
          q.lte(q.field("date"), todayEnd)
        )
      )
      .collect();

    // Apply department filter
    let filtered = meetings;
    if (args.departmentId) {
      if (!isAdmin(user) && !isMT(user) && user.departmentId !== args.departmentId) {
        throw new AuthError(
          "Je hebt geen toegang tot de vergaderingen van deze afdeling",
          "FORBIDDEN"
        );
      }
      filtered = meetings.filter((m) =>
        m.departmentIds.includes(args.departmentId!)
      );
    } else {
      filtered = filterMeetingsByAccess(user, meetings);
    }

    return filtered;
  },
});

// Get this week's meetings (with access control)
export const listThisWeek = query({
  args: {
    departmentId: v.optional(v.id("departments")),
  },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);

    const now = new Date();
    const dayOfWeek = now.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

    const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() + mondayOffset).getTime();
    const weekEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + mondayOffset + 6, 23, 59, 59, 999).getTime();

    const meetings = await ctx.db
      .query("meetings")
      .withIndex("by_date")
      .filter((q) =>
        q.and(
          q.gte(q.field("date"), weekStart),
          q.lte(q.field("date"), weekEnd)
        )
      )
      .collect();

    // Apply department filter
    let filtered = meetings;
    if (args.departmentId) {
      if (!isAdmin(user) && !isMT(user) && user.departmentId !== args.departmentId) {
        throw new AuthError(
          "Je hebt geen toegang tot de vergaderingen van deze afdeling",
          "FORBIDDEN"
        );
      }
      filtered = meetings.filter((m) =>
        m.departmentIds.includes(args.departmentId!)
      );
    } else {
      filtered = filterMeetingsByAccess(user, meetings);
    }

    return filtered;
  },
});

// Get meetings with red flags (MT/Admin only)
export const listWithRedFlags = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);

    // Only MT and admins can see red flags overview
    if (!isAdmin(user) && !isMT(user)) {
      throw new AuthError(
        "Alleen MT en administrators kunnen de red flags overzicht zien",
        "FORBIDDEN"
      );
    }

    const meetings = await ctx.db
      .query("meetings")
      .order("desc")
      .collect();

    let filtered = meetings.filter(
      (m) => m.redFlags && m.redFlags.length > 0
    );

    if (args.limit) {
      filtered = filtered.slice(0, args.limit);
    }

    return filtered;
  },
});

// Get recent activity (with access control)
export const listRecentActivity = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);

    const meetings = await ctx.db
      .query("meetings")
      .order("desc")
      .collect();

    // Filter by user access
    const filtered = filterMeetingsByAccess(user, meetings);

    // Get meetings that have been processed (have transcription or summary)
    let processed = filtered.filter(
      (m) => m.transcription || m.summary
    );

    if (args.limit) {
      processed = processed.slice(0, args.limit);
    }

    return processed;
  },
});

// Get department stats (with access control)
export const getDepartmentStats = query({
  args: {
    departmentId: v.id("departments"),
  },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);

    // Check if user can access this department's stats
    if (!isAdmin(user) && !isMT(user) && user.departmentId !== args.departmentId) {
      throw new AuthError(
        "Je hebt geen toegang tot de statistieken van deze afdeling",
        "FORBIDDEN"
      );
    }

    const now = Date.now();

    // Get all meetings for this department
    const allMeetings = await ctx.db.query("meetings").collect();
    const deptMeetings = allMeetings.filter((m) =>
      m.departmentIds.includes(args.departmentId)
    );

    // This week's meetings
    const dayOfWeek = new Date().getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() + mondayOffset);
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    const thisWeekMeetings = deptMeetings.filter(
      (m) => m.date >= weekStart.getTime() && m.date <= weekEnd.getTime()
    );

    // Get action items
    const allActionItems = await ctx.db.query("actionItems").collect();
    const meetingIds = new Set(deptMeetings.map((m) => m._id));
    const deptActionItems = allActionItems.filter((ai) =>
      meetingIds.has(ai.meetingId)
    );

    const openItems = deptActionItems.filter((ai) => ai.status !== "done");
    const overdueItems = deptActionItems.filter(
      (ai) => ai.status !== "done" && ai.deadline && ai.deadline < now
    );

    return {
      totalMeetings: deptMeetings.length,
      thisWeekMeetings: thisWeekMeetings.length,
      completedMeetings: deptMeetings.filter((m) => m.status === "completed").length,
      openActionItems: openItems.length,
      overdueActionItems: overdueItems.length,
    };
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
      severity: v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
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
