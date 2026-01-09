import { QueryCtx, MutationCtx } from "../_generated/server";
import { Doc, Id } from "../_generated/dataModel";

export type UserRole = "admin" | "department_head" | "member";

export interface AuthenticatedUser extends Doc<"users"> {
  departmentSlug?: string;
}

export class AuthError extends Error {
  constructor(
    message: string,
    public code: "UNAUTHENTICATED" | "UNAUTHORIZED" | "FORBIDDEN"
  ) {
    super(message);
    this.name = "AuthError";
  }
}

/**
 * Get the current authenticated user from context
 * Returns null if not authenticated or user not found (for graceful handling)
 */
export async function getAuthenticatedUser(
  ctx: QueryCtx | MutationCtx
): Promise<AuthenticatedUser | null> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    return null;
  }

  const user = await ctx.db
    .query("users")
    .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
    .first();

  if (!user) {
    return null;
  }

  // Get department slug for convenience
  const department = await ctx.db.get(user.departmentId);

  return {
    ...user,
    departmentSlug: department?.slug,
  };
}

/**
 * Get the current authenticated user from context
 * Throws AuthError if not authenticated
 */
export async function requireAuth(
  ctx: QueryCtx | MutationCtx
): Promise<AuthenticatedUser> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new AuthError("Je moet ingelogd zijn om deze actie uit te voeren", "UNAUTHENTICATED");
  }

  const user = await ctx.db
    .query("users")
    .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
    .first();

  if (!user) {
    // User is authenticated via Clerk but not yet in Convex DB
    // This can happen with new users - throw a more helpful error
    throw new AuthError(
      "Je account wordt nog ingesteld. Ververs de pagina of neem contact op met een beheerder.",
      "UNAUTHENTICATED"
    );
  }

  // Get department slug for convenience
  const department = await ctx.db.get(user.departmentId);

  return {
    ...user,
    departmentSlug: department?.slug,
  };
}

/**
 * Check if user has one of the required roles
 */
export function hasRole(user: AuthenticatedUser, roles: UserRole[]): boolean {
  return roles.includes(user.role);
}

/**
 * Require specific role(s) - throws if user doesn't have permission
 */
export function requireRole(user: AuthenticatedUser, roles: UserRole[]): void {
  if (!hasRole(user, roles)) {
    throw new AuthError(
      `Je hebt geen toestemming voor deze actie. Vereiste rol: ${roles.join(" of ")}`,
      "FORBIDDEN"
    );
  }
}

/**
 * Check if user is admin
 */
export function isAdmin(user: AuthenticatedUser): boolean {
  return user.role === "admin";
}

/**
 * Check if user is MT (Management Team)
 */
export function isMT(user: AuthenticatedUser): boolean {
  return user.departmentSlug === "mt";
}

/**
 * Check if user can access data for a specific department
 * MT and admins can see all departments
 * Others can only see their own department
 */
export function canAccessDepartment(
  user: AuthenticatedUser,
  departmentId: Id<"departments">
): boolean {
  // Admins and MT can access all departments
  if (isAdmin(user) || isMT(user)) {
    return true;
  }
  // Others can only access their own department
  return user.departmentId === departmentId;
}

/**
 * Check if user can access a meeting based on departments
 */
export function canAccessMeeting(
  user: AuthenticatedUser,
  meetingDepartmentIds: Id<"departments">[]
): boolean {
  // Admins and MT can access all meetings
  if (isAdmin(user) || isMT(user)) {
    return true;
  }
  // Others can only access meetings from their department
  return meetingDepartmentIds.includes(user.departmentId);
}

/**
 * Filter meetings based on user access
 */
export function filterMeetingsByAccess<T extends { departmentIds: Id<"departments">[] }>(
  user: AuthenticatedUser,
  meetings: T[]
): T[] {
  // Admins and MT can see all meetings
  if (isAdmin(user) || isMT(user)) {
    return meetings;
  }
  // Others only see meetings from their department
  return meetings.filter((m) => m.departmentIds.includes(user.departmentId));
}

/**
 * Filter action items based on user access (via meetings)
 */
export async function filterActionItemsByAccess<T extends { meetingId: Id<"meetings"> }>(
  ctx: QueryCtx,
  user: AuthenticatedUser,
  items: T[]
): Promise<T[]> {
  // Admins and MT can see all action items
  if (isAdmin(user) || isMT(user)) {
    return items;
  }

  // Get all meetings for the action items
  const meetingIds = [...new Set(items.map((i) => i.meetingId))];
  const meetings = await Promise.all(meetingIds.map((id) => ctx.db.get(id)));

  // Create a set of accessible meeting IDs
  const accessibleMeetingIds = new Set(
    meetings
      .filter((m) => m && m.departmentIds.includes(user.departmentId))
      .map((m) => m!._id)
  );

  // Filter items by accessible meetings, or if user is the owner
  return items.filter(
    (item) =>
      accessibleMeetingIds.has(item.meetingId) ||
      (item as T & { ownerId?: Id<"users"> }).ownerId === user._id
  );
}

/**
 * Require admin role
 */
export function requireAdmin(user: AuthenticatedUser): void {
  requireRole(user, ["admin"]);
}

/**
 * Require admin or department head role
 */
export function requireAdminOrDepartmentHead(user: AuthenticatedUser): void {
  requireRole(user, ["admin", "department_head"]);
}

/**
 * Check if user can modify a resource (is owner, admin, or department head)
 */
export function canModifyResource(
  user: AuthenticatedUser,
  resourceOwnerId?: Id<"users">
): boolean {
  // Admins can modify anything
  if (isAdmin(user)) {
    return true;
  }
  // Department heads can modify within their department context
  if (user.role === "department_head") {
    return true;
  }
  // Members can only modify their own resources
  return resourceOwnerId === user._id;
}
