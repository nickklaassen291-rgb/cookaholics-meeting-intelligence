import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Departments: Keuken, Sales, Marketing, MT
  departments: defineTable({
    name: v.string(),
    slug: v.string(),
    description: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_slug", ["slug"]),

  // Users synced from Clerk
  users: defineTable({
    clerkId: v.string(),
    email: v.string(),
    name: v.string(),
    imageUrl: v.optional(v.string()),
    departmentId: v.id("departments"),
    role: v.union(v.literal("admin"), v.literal("department_head"), v.literal("member")),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_clerk_id", ["clerkId"])
    .index("by_email", ["email"])
    .index("by_department", ["departmentId"]),

  // Meeting types with default configurations
  meetingTypes: defineTable({
    name: v.string(),
    slug: v.string(),
    defaultDuration: v.number(), // in minutes
    frequency: v.union(
      v.literal("daily"),
      v.literal("weekly"),
      v.literal("monthly"),
      v.literal("quarterly")
    ),
    description: v.optional(v.string()),
    scriptTemplate: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_slug", ["slug"]),

  // Meetings
  meetings: defineTable({
    title: v.string(),
    meetingTypeId: v.id("meetingTypes"),
    date: v.number(), // timestamp
    duration: v.number(), // in minutes
    departmentIds: v.array(v.id("departments")), // supports cross-department meetings
    attendeeIds: v.array(v.id("users")),
    presentAttendeeIds: v.optional(v.array(v.id("users"))), // who actually attended

    // Audio and transcription
    audioFileId: v.optional(v.id("_storage")),
    audioFileName: v.optional(v.string()),
    transcription: v.optional(v.string()),
    transcriptionStatus: v.optional(
      v.union(
        v.literal("pending"),
        v.literal("processing"),
        v.literal("completed"),
        v.literal("failed")
      )
    ),

    // AI-generated content
    summary: v.optional(v.string()),
    topics: v.optional(v.array(v.string())),
    decisions: v.optional(v.array(v.object({
      description: v.string(),
      context: v.optional(v.string()),
    }))),
    redFlags: v.optional(v.array(v.object({
      type: v.string(),
      description: v.string(),
      severity: v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
    }))),
    processingStatus: v.optional(
      v.union(
        v.literal("pending"),
        v.literal("processing"),
        v.literal("completed"),
        v.literal("failed")
      )
    ),

    // Meeting status
    status: v.union(
      v.literal("scheduled"),
      v.literal("completed"),
      v.literal("cancelled")
    ),

    // Metadata
    createdById: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_date", ["date"])
    .index("by_status", ["status"])
    .index("by_created_by", ["createdById"]),

  // Action items extracted from meetings
  actionItems: defineTable({
    meetingId: v.id("meetings"),
    description: v.string(),
    ownerId: v.optional(v.id("users")),
    ownerName: v.optional(v.string()), // fallback if owner not in system
    deadline: v.optional(v.number()),
    status: v.union(
      v.literal("open"),
      v.literal("in_progress"),
      v.literal("done")
    ),
    completedAt: v.optional(v.number()),
    notes: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_meeting", ["meetingId"])
    .index("by_owner", ["ownerId"])
    .index("by_status", ["status"])
    .index("by_deadline", ["deadline"]),

  // Generated reports
  reports: defineTable({
    type: v.union(
      v.literal("weekly_department"),
      v.literal("weekly_mt"),
      v.literal("monthly_department"),
      v.literal("monthly_mt")
    ),
    departmentId: v.optional(v.id("departments")), // null for MT reports
    dateRangeStart: v.number(),
    dateRangeEnd: v.number(),
    content: v.string(), // JSON or markdown content
    highlights: v.optional(v.array(v.string())),
    redFlags: v.optional(v.array(v.string())),
    sentAt: v.optional(v.number()),
    recipientIds: v.optional(v.array(v.id("users"))),
    createdAt: v.number(),
  })
    .index("by_type", ["type"])
    .index("by_department", ["departmentId"])
    .index("by_date_range", ["dateRangeStart", "dateRangeEnd"]),

  // Meeting scripts/templates for structured meetings
  meetingScripts: defineTable({
    meetingTypeId: v.id("meetingTypes"),
    name: v.string(),
    sections: v.array(v.object({
      title: v.string(),
      description: v.string(),
      samplePhrases: v.optional(v.array(v.string())),
      order: v.number(),
    })),
    isDefault: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_meeting_type", ["meetingTypeId"]),
});
