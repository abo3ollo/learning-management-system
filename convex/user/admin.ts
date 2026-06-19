import { v } from "convex/values";
import { mutation, query } from "../_generated/server";

// جلب جميع التسجيلات المنتظرة
export const getPendingRegistrations = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("غير مصرح");

    const admin = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!admin || admin.role !== "admin") {
      throw new Error("مطلوب صلاحيات مشرف");
    }

    const pendingUsers = await ctx.db
      .query("users")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .collect();

    return pendingUsers.sort((a, b) => a.createdAt - b.createdAt);
  },
});

// الموافقة على مستخدم
// convex/user/admin.ts

export const approveUser = mutation({
  args: { 
    userId: v.id("users"),
    role: v.optional(v.union(
      v.literal("student"),
      v.literal("teacher"),
      v.literal("parent"),
      v.literal("admin")
    ))
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("غير مصرح");

    const admin = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!admin || admin.role !== "admin") {
      throw new Error("مطلوب صلاحيات مشرف");
    }

    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("المستخدم غير موجود");

    // ✅ تحديث الحالة إلى active
    await ctx.db.patch(args.userId, {
      status: "active",
      approvedAt: Date.now(),
      approvedBy: admin._id,
      updatedAt: Date.now(),
      ...(args.role && { role: args.role }),
    });

    await ctx.db.insert("auditLogs", {
      userId: admin._id,
      action: "APPROVE_USER",
      resourceType: "user",
      resourceId: args.userId,
      details: {
        previousStatus: user.status,
        previousRole: user.role,
        newRole: args.role || user.role,
        approvedBy: admin.email,
      },
      createdAt: Date.now(),
    });

    return { success: true };
  },
});

// رفض مستخدم
export const rejectUser = mutation({
  args: {
    userId: v.id("users"),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("غير مصرح");

    const admin = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!admin || admin.role !== "admin") {
      throw new Error("مطلوب صلاحيات مشرف");
    }

    await ctx.db.patch(args.userId, {
      status: "rejected",
      rejectionReason: args.reason,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

// تحديث دور مستخدم
export const updateUserRole = mutation({
  args: {
    userId: v.id("users"),
    role: v.union(
      v.literal("student"),
      v.literal("teacher"),
      v.literal("parent"),
      v.literal("admin")
    ),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("غير مصرح");

    const admin = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!admin || admin.role !== "admin") {
      throw new Error("مطلوب صلاحيات مشرف");
    }

    await ctx.db.patch(args.userId, {
      role: args.role,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});