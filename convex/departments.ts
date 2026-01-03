import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// Get all departments
export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("departments").collect();
  },
});

// Get department by slug
export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("departments")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();
  },
});

// Get department by ID
export const getById = query({
  args: { id: v.id("departments") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// Create a new department (admin only)
export const create = mutation({
  args: {
    name: v.string(),
    slug: v.string(),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const departmentId = await ctx.db.insert("departments", {
      name: args.name,
      slug: args.slug,
      description: args.description,
      createdAt: Date.now(),
    });
    return departmentId;
  },
});

// Seed initial departments
export const seed = mutation({
  args: {},
  handler: async (ctx) => {
    const existingDepartments = await ctx.db.query("departments").collect();
    if (existingDepartments.length > 0) {
      return { message: "Departments already seeded", count: existingDepartments.length };
    }

    const departments = [
      { name: "Keuken", slug: "keuken", description: "Kitchen department" },
      { name: "Sales", slug: "sales", description: "Sales department" },
      { name: "Marketing", slug: "marketing", description: "Marketing department" },
      { name: "MT", slug: "mt", description: "Management Team" },
    ];

    for (const dept of departments) {
      await ctx.db.insert("departments", {
        ...dept,
        createdAt: Date.now(),
      });
    }

    return { message: "Departments seeded", count: departments.length };
  },
});
