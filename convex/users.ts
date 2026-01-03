import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// Get user by Clerk ID
export const getByClerkId = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();
  },
});

// Get current user (requires identity)
export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    return user;
  },
});

// Get all users
export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("users").collect();
  },
});

// Get users by department
export const listByDepartment = query({
  args: { departmentId: v.id("departments") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_department", (q) => q.eq("departmentId", args.departmentId))
      .collect();
  },
});

// Create or update user from Clerk webhook
export const upsertFromClerk = mutation({
  args: {
    clerkId: v.string(),
    email: v.string(),
    name: v.string(),
    imageUrl: v.optional(v.string()),
    departmentId: v.id("departments"),
    role: v.union(v.literal("admin"), v.literal("department_head"), v.literal("member")),
  },
  handler: async (ctx, args) => {
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();

    const now = Date.now();

    if (existingUser) {
      await ctx.db.patch(existingUser._id, {
        email: args.email,
        name: args.name,
        imageUrl: args.imageUrl,
        departmentId: args.departmentId,
        role: args.role,
        updatedAt: now,
      });
      return existingUser._id;
    } else {
      return await ctx.db.insert("users", {
        clerkId: args.clerkId,
        email: args.email,
        name: args.name,
        imageUrl: args.imageUrl,
        departmentId: args.departmentId,
        role: args.role,
        createdAt: now,
        updatedAt: now,
      });
    }
  },
});

// Update user role (admin only)
export const updateRole = mutation({
  args: {
    userId: v.id("users"),
    role: v.union(v.literal("admin"), v.literal("department_head"), v.literal("member")),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.userId, {
      role: args.role,
      updatedAt: Date.now(),
    });
  },
});

// Update user department
export const updateDepartment = mutation({
  args: {
    userId: v.id("users"),
    departmentId: v.id("departments"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.userId, {
      departmentId: args.departmentId,
      updatedAt: Date.now(),
    });
  },
});

// Seed test users for development
export const seed = mutation({
  args: {},
  handler: async (ctx) => {
    const existingUsers = await ctx.db.query("users").collect();
    if (existingUsers.length > 0) {
      return { message: "Users already seeded", count: existingUsers.length };
    }

    // Get departments
    const departments = await ctx.db.query("departments").collect();
    if (departments.length === 0) {
      return { message: "Please seed departments first", count: 0 };
    }

    const getDeptId = (slug: string) => {
      const dept = departments.find((d) => d.slug === slug);
      return dept?._id;
    };

    const now = Date.now();

    const testUsers = [
      // Admin
      { name: "Nick Klaassen", email: "nick@cookaholics.nl", dept: "mt", role: "admin" as const },
      // MT
      { name: "Lisa van Berg", email: "lisa@cookaholics.nl", dept: "mt", role: "department_head" as const },
      { name: "Peter Jansen", email: "peter@cookaholics.nl", dept: "mt", role: "member" as const },
      // Keuken
      { name: "Chef Marco", email: "marco@cookaholics.nl", dept: "keuken", role: "department_head" as const },
      { name: "Anna de Wit", email: "anna@cookaholics.nl", dept: "keuken", role: "member" as const },
      { name: "Tom Bakker", email: "tom@cookaholics.nl", dept: "keuken", role: "member" as const },
      // Sales
      { name: "Sarah Smit", email: "sarah@cookaholics.nl", dept: "sales", role: "department_head" as const },
      { name: "Jan de Vries", email: "jan@cookaholics.nl", dept: "sales", role: "member" as const },
      { name: "Eva Mulder", email: "eva@cookaholics.nl", dept: "sales", role: "member" as const },
      // Marketing
      { name: "Emma Visser", email: "emma@cookaholics.nl", dept: "marketing", role: "department_head" as const },
      { name: "Daan Hendriks", email: "daan@cookaholics.nl", dept: "marketing", role: "member" as const },
      { name: "Sophie Groot", email: "sophie@cookaholics.nl", dept: "marketing", role: "member" as const },
    ];

    let createdCount = 0;
    for (const user of testUsers) {
      const deptId = getDeptId(user.dept);
      if (deptId) {
        await ctx.db.insert("users", {
          clerkId: `test_${user.email.split("@")[0]}`,
          email: user.email,
          name: user.name,
          departmentId: deptId,
          role: user.role,
          createdAt: now,
          updatedAt: now,
        });
        createdCount++;
      }
    }

    return { message: "Test users seeded", count: createdCount };
  },
});
