import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// Get notifications for current user
export const listForUser = query({
  args: {
    userId: v.id("users"),
    unreadOnly: v.optional(v.boolean()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const notificationsQuery = ctx.db
      .query("notifications")
      .withIndex("by_user", (q) => q.eq("userId", args.userId));

    const notifications = await notificationsQuery.collect();

    // Filter unread if requested
    let filtered = args.unreadOnly
      ? notifications.filter((n) => !n.read)
      : notifications;

    // Sort by createdAt descending
    filtered.sort((a, b) => b.createdAt - a.createdAt);

    // Apply limit
    if (args.limit) {
      filtered = filtered.slice(0, args.limit);
    }

    // Enrich with related data
    const enriched = await Promise.all(
      filtered.map(async (notification) => {
        let meeting = null;
        let actionItem = null;
        let report = null;

        if (notification.meetingId) {
          meeting = await ctx.db.get(notification.meetingId);
        }
        if (notification.actionItemId) {
          actionItem = await ctx.db.get(notification.actionItemId);
        }
        if (notification.reportId) {
          report = await ctx.db.get(notification.reportId);
        }

        return {
          ...notification,
          meeting: meeting ? { _id: meeting._id, title: meeting.title, date: meeting.date } : null,
          actionItem: actionItem ? { _id: actionItem._id, description: actionItem.description } : null,
          report: report ? { _id: report._id, type: report.type } : null,
        };
      })
    );

    return enriched;
  },
});

// Get unread count
export const getUnreadCount = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_user_read", (q) => q.eq("userId", args.userId).eq("read", false))
      .collect();

    return notifications.length;
  },
});

// Mark notification as read
export const markAsRead = mutation({
  args: {
    notificationId: v.id("notifications"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.notificationId, { read: true });
  },
});

// Mark all notifications as read for a user
export const markAllAsRead = mutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const unreadNotifications = await ctx.db
      .query("notifications")
      .withIndex("by_user_read", (q) => q.eq("userId", args.userId).eq("read", false))
      .collect();

    await Promise.all(
      unreadNotifications.map((n) => ctx.db.patch(n._id, { read: true }))
    );

    return { updated: unreadNotifications.length };
  },
});

// Delete a notification
export const deleteNotification = mutation({
  args: {
    notificationId: v.id("notifications"),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.notificationId);
  },
});

// Create a notification
export const create = mutation({
  args: {
    userId: v.id("users"),
    type: v.union(
      v.literal("action_item_assigned"),
      v.literal("action_item_deadline"),
      v.literal("action_item_overdue"),
      v.literal("meeting_scheduled"),
      v.literal("meeting_reminder"),
      v.literal("transcription_completed"),
      v.literal("report_ready")
    ),
    title: v.string(),
    message: v.string(),
    actionItemId: v.optional(v.id("actionItems")),
    meetingId: v.optional(v.id("meetings")),
    reportId: v.optional(v.id("reports")),
  },
  handler: async (ctx, args) => {
    const notificationId = await ctx.db.insert("notifications", {
      userId: args.userId,
      type: args.type,
      title: args.title,
      message: args.message,
      actionItemId: args.actionItemId,
      meetingId: args.meetingId,
      reportId: args.reportId,
      read: false,
      emailSent: false,
      createdAt: Date.now(),
    });

    return notificationId;
  },
});

// Create notifications for action item assignment
export const notifyActionItemAssigned = mutation({
  args: {
    actionItemId: v.id("actionItems"),
    ownerId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const actionItem = await ctx.db.get(args.actionItemId);
    if (!actionItem) return null;

    const meeting = await ctx.db.get(actionItem.meetingId);
    const meetingTitle = meeting?.title || "Onbekende vergadering";

    const notificationId = await ctx.db.insert("notifications", {
      userId: args.ownerId,
      type: "action_item_assigned",
      title: "Nieuw actiepunt toegewezen",
      message: `Je hebt een nieuw actiepunt uit "${meetingTitle}": ${actionItem.description}`,
      actionItemId: args.actionItemId,
      meetingId: actionItem.meetingId,
      read: false,
      emailSent: false,
      createdAt: Date.now(),
    });

    return notificationId;
  },
});

// Create notifications for upcoming deadlines
export const checkDeadlines = mutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000;
    const tomorrow = now + oneDayMs;

    // Get all open action items with deadlines within the next day
    const actionItems = await ctx.db
      .query("actionItems")
      .withIndex("by_status", (q) => q.eq("status", "open"))
      .collect();

    const upcomingDeadlines = actionItems.filter(
      (item) =>
        item.deadline &&
        item.deadline > now &&
        item.deadline <= tomorrow &&
        item.ownerId
    );

    // Get overdue items
    const overdueItems = actionItems.filter(
      (item) => item.deadline && item.deadline < now && item.ownerId
    );

    const notifications: Id<"notifications">[] = [];

    // Create deadline reminder notifications
    for (const item of upcomingDeadlines) {
      if (!item.ownerId) continue;

      // Check if we already sent a deadline notification today
      const existingNotifications = await ctx.db
        .query("notifications")
        .withIndex("by_user", (q) => q.eq("userId", item.ownerId!))
        .collect();

      const alreadyNotified = existingNotifications.some(
        (n) =>
          n.type === "action_item_deadline" &&
          n.actionItemId === item._id &&
          n.createdAt > now - oneDayMs
      );

      if (!alreadyNotified) {
        const meeting = await ctx.db.get(item.meetingId);
        const notificationId = await ctx.db.insert("notifications", {
          userId: item.ownerId,
          type: "action_item_deadline",
          title: "Deadline morgen",
          message: `Actiepunt "${item.description}" heeft morgen een deadline`,
          actionItemId: item._id,
          meetingId: item.meetingId,
          read: false,
          emailSent: false,
          createdAt: now,
        });
        notifications.push(notificationId);
      }
    }

    // Create overdue notifications
    for (const item of overdueItems) {
      if (!item.ownerId) continue;

      // Check if we already sent an overdue notification today
      const existingNotifications = await ctx.db
        .query("notifications")
        .withIndex("by_user", (q) => q.eq("userId", item.ownerId!))
        .collect();

      const alreadyNotified = existingNotifications.some(
        (n) =>
          n.type === "action_item_overdue" &&
          n.actionItemId === item._id &&
          n.createdAt > now - oneDayMs
      );

      if (!alreadyNotified) {
        const notificationId = await ctx.db.insert("notifications", {
          userId: item.ownerId,
          type: "action_item_overdue",
          title: "Actiepunt verlopen",
          message: `Actiepunt "${item.description}" is over de deadline`,
          actionItemId: item._id,
          meetingId: item.meetingId,
          read: false,
          emailSent: false,
          createdAt: now,
        });
        notifications.push(notificationId);
      }
    }

    return { created: notifications.length };
  },
});

// Get or create notification preferences for a user
export const getPreferences = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const prefs = await ctx.db
      .query("notificationPreferences")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    if (prefs) return prefs;

    // Return defaults if no preferences set
    return {
      _id: null,
      userId: args.userId,
      emailActionItemAssigned: true,
      emailActionItemDeadline: true,
      emailActionItemOverdue: true,
      emailMeetingReminder: true,
      emailWeeklyDigest: true,
      inAppActionItemAssigned: true,
      inAppActionItemDeadline: true,
      inAppActionItemOverdue: true,
      inAppMeetingReminder: true,
      deadlineReminderDays: 1,
      meetingReminderMinutes: 30,
    };
  },
});

// Update notification preferences
export const updatePreferences = mutation({
  args: {
    userId: v.id("users"),
    emailActionItemAssigned: v.optional(v.boolean()),
    emailActionItemDeadline: v.optional(v.boolean()),
    emailActionItemOverdue: v.optional(v.boolean()),
    emailMeetingReminder: v.optional(v.boolean()),
    emailWeeklyDigest: v.optional(v.boolean()),
    inAppActionItemAssigned: v.optional(v.boolean()),
    inAppActionItemDeadline: v.optional(v.boolean()),
    inAppActionItemOverdue: v.optional(v.boolean()),
    inAppMeetingReminder: v.optional(v.boolean()),
    deadlineReminderDays: v.optional(v.number()),
    meetingReminderMinutes: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const existingPrefs = await ctx.db
      .query("notificationPreferences")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    const { userId, ...updates } = args;

    // Filter out undefined values
    const cleanUpdates: Record<string, boolean | number> = {};
    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) {
        cleanUpdates[key] = value;
      }
    }

    if (existingPrefs) {
      await ctx.db.patch(existingPrefs._id, {
        ...cleanUpdates,
        updatedAt: Date.now(),
      });
      return existingPrefs._id;
    } else {
      // Create new preferences with defaults
      const newPrefs = await ctx.db.insert("notificationPreferences", {
        userId,
        emailActionItemAssigned: true,
        emailActionItemDeadline: true,
        emailActionItemOverdue: true,
        emailMeetingReminder: true,
        emailWeeklyDigest: true,
        inAppActionItemAssigned: true,
        inAppActionItemDeadline: true,
        inAppActionItemOverdue: true,
        inAppMeetingReminder: true,
        deadlineReminderDays: 1,
        meetingReminderMinutes: 30,
        ...cleanUpdates,
        updatedAt: Date.now(),
      });
      return newPrefs;
    }
  },
});

// Get notifications that need to be emailed
export const getUnsentEmailNotifications = query({
  args: {},
  handler: async (ctx) => {
    const notifications = await ctx.db
      .query("notifications")
      .collect();

    const unsent = notifications.filter((n) => n.emailSent === false);

    // Enrich with user data
    const enriched = await Promise.all(
      unsent.map(async (notification) => {
        const user = await ctx.db.get(notification.userId);
        return {
          ...notification,
          user: user ? { email: user.email, name: user.name } : null,
        };
      })
    );

    return enriched.filter((n) => n.user !== null);
  },
});

// Mark notification email as sent
export const markEmailSent = mutation({
  args: {
    notificationId: v.id("notifications"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.notificationId, { emailSent: true });
  },
});
