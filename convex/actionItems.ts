import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// Get action items for a meeting
export const listByMeeting = query({
  args: { meetingId: v.id("meetings") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("actionItems")
      .withIndex("by_meeting", (q) => q.eq("meetingId", args.meetingId))
      .collect();
  },
});

// Get action items for a user
export const listByOwner = query({
  args: { ownerId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("actionItems")
      .withIndex("by_owner", (q) => q.eq("ownerId", args.ownerId))
      .collect();
  },
});

// Get action items by status
export const listByStatus = query({
  args: {
    status: v.union(v.literal("open"), v.literal("in_progress"), v.literal("done")),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("actionItems")
      .withIndex("by_status", (q) => q.eq("status", args.status))
      .collect();
  },
});

// Get all open action items (for dashboard)
export const listOpen = query({
  args: {
    ownerId: v.optional(v.id("users")),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let items = await ctx.db
      .query("actionItems")
      .withIndex("by_status", (q) => q.eq("status", "open"))
      .collect();

    if (args.ownerId) {
      items = items.filter((item) => item.ownerId === args.ownerId);
    }

    // Sort by deadline (items without deadline at the end)
    items.sort((a, b) => {
      if (!a.deadline && !b.deadline) return 0;
      if (!a.deadline) return 1;
      if (!b.deadline) return -1;
      return a.deadline - b.deadline;
    });

    if (args.limit) {
      items = items.slice(0, args.limit);
    }

    return items;
  },
});

// Get overdue action items
export const listOverdue = query({
  args: {
    ownerId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    let items = await ctx.db
      .query("actionItems")
      .withIndex("by_status", (q) => q.eq("status", "open"))
      .collect();

    items = items.filter((item) => item.deadline && item.deadline < now);

    if (args.ownerId) {
      items = items.filter((item) => item.ownerId === args.ownerId);
    }

    return items;
  },
});

// Create action item
export const create = mutation({
  args: {
    meetingId: v.id("meetings"),
    description: v.string(),
    ownerId: v.optional(v.id("users")),
    ownerName: v.optional(v.string()),
    deadline: v.optional(v.number()),
    priority: v.optional(v.union(v.literal("high"), v.literal("medium"), v.literal("low"))),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    return await ctx.db.insert("actionItems", {
      meetingId: args.meetingId,
      description: args.description,
      ownerId: args.ownerId,
      ownerName: args.ownerName,
      deadline: args.deadline,
      priority: args.priority || "medium",
      status: "open",
      createdAt: now,
      updatedAt: now,
    });
  },
});

// Bulk create action items (from AI extraction)
export const createBatch = mutation({
  args: {
    meetingId: v.id("meetings"),
    items: v.array(
      v.object({
        description: v.string(),
        ownerId: v.optional(v.id("users")),
        ownerName: v.optional(v.string()),
        deadline: v.optional(v.number()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const createdIds = [];

    for (const item of args.items) {
      const id = await ctx.db.insert("actionItems", {
        meetingId: args.meetingId,
        description: item.description,
        ownerId: item.ownerId,
        ownerName: item.ownerName,
        deadline: item.deadline,
        status: "open",
        createdAt: now,
        updatedAt: now,
      });
      createdIds.push(id);
    }

    return createdIds;
  },
});

// Update action item status
export const updateStatus = mutation({
  args: {
    id: v.id("actionItems"),
    status: v.union(v.literal("open"), v.literal("in_progress"), v.literal("done")),
  },
  handler: async (ctx, args) => {
    const updates: Record<string, unknown> = {
      status: args.status,
      updatedAt: Date.now(),
    };

    if (args.status === "done") {
      updates.completedAt = Date.now();
    }

    await ctx.db.patch(args.id, updates);
  },
});

// Update action item
export const update = mutation({
  args: {
    id: v.id("actionItems"),
    description: v.optional(v.string()),
    ownerId: v.optional(v.id("users")),
    ownerName: v.optional(v.string()),
    deadline: v.optional(v.number()),
    notes: v.optional(v.string()),
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

// Delete action item
export const remove = mutation({
  args: { id: v.id("actionItems") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

// Get all action items with optional filters
export const list = query({
  args: {
    status: v.optional(v.union(v.literal("open"), v.literal("in_progress"), v.literal("done"))),
    ownerId: v.optional(v.id("users")),
    ownerName: v.optional(v.string()),
    priority: v.optional(v.union(v.literal("high"), v.literal("medium"), v.literal("low"))),
    includeOverdueOnly: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    let items = await ctx.db.query("actionItems").order("desc").collect();

    // Filter by status
    if (args.status) {
      items = items.filter((item) => item.status === args.status);
    }

    // Filter by owner
    if (args.ownerId) {
      items = items.filter((item) => item.ownerId === args.ownerId);
    }

    // Filter by owner name (for items without linked user)
    if (args.ownerName) {
      items = items.filter((item) =>
        item.ownerName?.toLowerCase().includes(args.ownerName!.toLowerCase())
      );
    }

    // Filter by priority
    if (args.priority) {
      items = items.filter((item) => item.priority === args.priority);
    }

    // Filter overdue only
    if (args.includeOverdueOnly) {
      const now = Date.now();
      items = items.filter((item) =>
        item.deadline && item.deadline < now && item.status !== "done"
      );
    }

    return items;
  },
});

// Get action item by ID
export const getById = query({
  args: { id: v.id("actionItems") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// Bulk update status
export const bulkUpdateStatus = mutation({
  args: {
    ids: v.array(v.id("actionItems")),
    status: v.union(v.literal("open"), v.literal("in_progress"), v.literal("done")),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    for (const id of args.ids) {
      const updates: Record<string, unknown> = {
        status: args.status,
        updatedAt: now,
      };

      if (args.status === "done") {
        updates.completedAt = now;
      }

      await ctx.db.patch(id, updates);
    }

    return { updated: args.ids.length };
  },
});

// Get action items grouped by deadline (for personal view)
export const listGroupedByDeadline = query({
  args: {
    ownerName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let items = await ctx.db
      .query("actionItems")
      .filter((q) => q.neq(q.field("status"), "done"))
      .collect();

    // Filter by owner name if provided
    if (args.ownerName) {
      items = items.filter((item) =>
        item.ownerName?.toLowerCase().includes(args.ownerName!.toLowerCase())
      );
    }

    const now = Date.now();
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);
    const todayEndTime = todayEnd.getTime();

    const weekEnd = new Date();
    weekEnd.setDate(weekEnd.getDate() + 7);
    weekEnd.setHours(23, 59, 59, 999);
    const weekEndTime = weekEnd.getTime();

    const overdue: typeof items = [];
    const today: typeof items = [];
    const thisWeek: typeof items = [];
    const later: typeof items = [];
    const noDeadline: typeof items = [];

    for (const item of items) {
      if (!item.deadline) {
        noDeadline.push(item);
      } else if (item.deadline < now) {
        overdue.push(item);
      } else if (item.deadline <= todayEndTime) {
        today.push(item);
      } else if (item.deadline <= weekEndTime) {
        thisWeek.push(item);
      } else {
        later.push(item);
      }
    }

    // Sort each group by deadline
    const sortByDeadline = (a: typeof items[0], b: typeof items[0]) => {
      if (!a.deadline && !b.deadline) return 0;
      if (!a.deadline) return 1;
      if (!b.deadline) return -1;
      return a.deadline - b.deadline;
    };

    return {
      overdue: overdue.sort(sortByDeadline),
      today: today.sort(sortByDeadline),
      thisWeek: thisWeek.sort(sortByDeadline),
      later: later.sort(sortByDeadline),
      noDeadline: noDeadline.sort((a, b) => b.createdAt - a.createdAt),
    };
  },
});
