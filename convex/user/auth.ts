import { v } from "convex/values";
import { mutation, query } from "../_generated/server";

// إنشاء مستخدم من Clerk webhook
export const createUser = mutation({
  args: {
    clerkId: v.string(),
    name: v.string(),
    email: v.string(),
    role: v.union(
      v.literal("student"),
      v.literal("teacher"),
      v.literal("parent"),
      v.literal("admin"),
    ),
    phoneNumber: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (existing) {
      if (existing.role !== args.role) {
        await ctx.db.patch(existing._id, {
          role: args.role,
          updatedAt: Date.now(),
        });
      }
      return existing._id;
    }

    const emailExists = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (emailExists) {
      throw new Error("Email already registered");
    }

    const userId = await ctx.db.insert("users", {
      clerkId: args.clerkId,
      name: args.name,
      email: args.email,
      phoneNumber: args.phoneNumber,
      role: args.role,
      status: "pending",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    await ctx.db.insert("auditLogs", {
      userId,
      action: "REGISTER",
      resourceType: "user",
      resourceId: userId,
      details: {
        role: args.role,
        email: args.email,
        name: args.name,
      },
      createdAt: Date.now(),
    });

    return userId;
  },
});

// جلب المستخدم الحالي
export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();

    return user;
  },
});

// التحقق من حالة التسجيل
export const checkRegistrationStatus = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) return null;

    return {
      status: user.status,
      role: user.role,
      rejectionReason: user.rejectionReason,
      createdAt: user.createdAt,
    };
  },
});
