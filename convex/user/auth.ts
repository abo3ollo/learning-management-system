import { v } from "convex/values";
import { mutation, query } from "../_generated/server";

// convex/user/auth.ts

export const createUser = mutation({
  args: {
    clerkId: v.string(),
    name: v.string(),
    email: v.string(),
    role: v.union(
      v.literal("student"),
      v.literal("teacher"),
      v.literal("parent"),
      v.literal("admin")
    ),
    phoneNumber: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // ✅ التحقق من وجود المستخدم بواسطة clerkId
    const existingByClerkId = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (existingByClerkId) {
      if (existingByClerkId.role !== args.role) {
        await ctx.db.patch(existingByClerkId._id, {
          role: args.role,
          updatedAt: Date.now(),
        });
      }
      return existingByClerkId._id;
    }

    // ✅ التحقق من وجود المستخدم بواسطة البريد الإلكتروني
    const existingByEmail = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (existingByEmail) {
      // ✅ لو المستخدم موجود وطالب و active (أضافه الأدمن)، نربطه بحساب Clerk
      if (existingByEmail.role === "student" && existingByEmail.status === "active") {
        await ctx.db.patch(existingByEmail._id, {
          clerkId: args.clerkId,
          updatedAt: Date.now(),
        });
        return existingByEmail._id;
      }

      // ✅ لو المستخدم موجود بحالة pending، نرفض ونقول يستنى موافقة
      if (existingByEmail.status === "pending") {
        throw new Error("هذا البريد الإلكتروني قيد الانتظار للموافقة");
      }

      // ✅ لو المستخدم موجود بدور تاني (معلم، ولي أمر، أدمن)
      throw new Error("هذا البريد الإلكتروني مستخدم من قبل");
    }

    // ✅ كل الأدوار تتسجل pending (ما عدا الأدمن)
    let status: "pending" | "approved" | "rejected" | "active" | "inactive" | "on_leave" = "pending";
    
    // ✅ الأدمن لازم pending عشان يوافق عليه أدمن تاني
    if (args.role === "admin") {
      status = "pending";
    }

    // ✅ المعلم وولي الأمر pending
    if (args.role === "teacher" || args.role === "parent") {
      status = "pending";
    }

    // ✅ الطالب pending برضه (هيكمل بياناته في المودال)
    if (args.role === "student") {
      status = "pending";
    }

    // ✅ إنشاء مستخدم جديد
    const userId = await ctx.db.insert("users", {
      clerkId: args.clerkId,
      name: args.name,
      email: args.email,
      phoneNumber: args.phoneNumber,
      role: args.role,
      status: status,
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

export const getUserByEmail = mutation({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
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
