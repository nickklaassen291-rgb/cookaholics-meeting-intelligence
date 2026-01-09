import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { requireAuth, requireAdmin, isAdmin, isMT, AuthError } from "./lib/auth";

// Get user by Clerk ID (public for auth flow)
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

// Get all users (MT/Admin can see all, others see own department)
export const list = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireAuth(ctx);
    const allUsers = await ctx.db.query("users").collect();

    // MT and admins can see all users
    if (isAdmin(user) || isMT(user)) {
      return allUsers;
    }

    // Others can only see users in their department
    return allUsers.filter((u) => u.departmentId === user.departmentId);
  },
});

// Get users by department (with access control)
export const listByDepartment = query({
  args: { departmentId: v.id("departments") },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);

    // Check if user can access this department's users
    if (!isAdmin(user) && !isMT(user) && user.departmentId !== args.departmentId) {
      throw new AuthError(
        "Je hebt geen toegang tot de gebruikers van deze afdeling",
        "FORBIDDEN"
      );
    }

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
    const currentUser = await requireAuth(ctx);
    requireAdmin(currentUser);

    await ctx.db.patch(args.userId, {
      role: args.role,
      updatedAt: Date.now(),
    });
  },
});

// Update user department (admin only)
export const updateDepartment = mutation({
  args: {
    userId: v.id("users"),
    departmentId: v.id("departments"),
  },
  handler: async (ctx, args) => {
    const currentUser = await requireAuth(ctx);
    requireAdmin(currentUser);

    await ctx.db.patch(args.userId, {
      departmentId: args.departmentId,
      updatedAt: Date.now(),
    });
  },
});

// Register current Clerk user in Convex (self-registration)
export const registerCurrentUser = mutation({
  args: {
    name: v.string(),
    email: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Niet ingelogd");
    }

    // Check if user already exists
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (existingUser) {
      return { message: "User already exists", userId: existingUser._id };
    }

    // Get MT department as default for new users (admin can change later)
    const mtDept = await ctx.db
      .query("departments")
      .withIndex("by_slug", (q) => q.eq("slug", "mt"))
      .first();

    if (!mtDept) {
      throw new Error("MT afdeling niet gevonden. Run eerst departments:seed");
    }

    const now = Date.now();
    const userId = await ctx.db.insert("users", {
      clerkId: identity.subject,
      email: args.email || identity.email || "",
      name: args.name || identity.name || "Nieuwe Gebruiker",
      departmentId: mtDept._id,
      role: "member", // New users get member role by default
      createdAt: now,
      updatedAt: now,
    });

    return { message: "User created", userId };
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
