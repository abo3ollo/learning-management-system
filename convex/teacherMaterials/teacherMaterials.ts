// convex/teacherMaterials/teacherMaterials.ts

import { v } from "convex/values";
import { mutation, query } from "../_generated/server";

// ✅ جلب مواد معلم معين
export const getTeacherMaterials = query({
  args: {
    teacherId: v.id("users"),
    type: v.optional(v.union(
      v.literal("pdf"),
      v.literal("video"),
      v.literal("exam"),
      v.literal("assignment"),
      v.literal("revision")
    )),
    subject: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("غير مصرح");

    let materials = await ctx.db
      .query("teacherMaterials")
      .withIndex("by_teacher", (q) => q.eq("teacherId", args.teacherId))
      .collect();

    if (args.type) {
      materials = materials.filter((m) => m.type === args.type);
    }

    if (args.subject) {
      materials = materials.filter((m) => m.subject === args.subject);
    }

    return materials.sort((a, b) => a.displayOrder - b.displayOrder);
  },
});

// ✅ جلب مواد معلم معين (عام - بدون صلاحيات)
export const getPublicTeacherMaterials = query({
  args: {
    teacherId: v.id("users"),
    type: v.optional(v.union(
      v.literal("pdf"),
      v.literal("video"),
      v.literal("exam"),
      v.literal("assignment"),
      v.literal("revision")
    )),
  },
  handler: async (ctx, args) => {
    let materials = await ctx.db
      .query("teacherMaterials")
      .withIndex("by_teacher", (q) => q.eq("teacherId", args.teacherId))
      .collect();

    materials = materials.filter((m) => m.isPublished === true);

    if (args.type) {
      materials = materials.filter((m) => m.type === args.type);
    }

    return materials.sort((a, b) => a.displayOrder - b.displayOrder);
  },
});

// ✅ إنشاء مادة جديدة
export const createMaterial = mutation({
  args: {
    teacherId: v.id("users"),
    title: v.string(),
    titleAr: v.string(),
    description: v.optional(v.string()),
    descriptionAr: v.optional(v.string()),
    type: v.union(
      v.literal("pdf"),
      v.literal("video"),
      v.literal("exam"),
      v.literal("assignment"),
      v.literal("revision")
    ),
    fileUrl: v.optional(v.string()),
    fileSize: v.optional(v.string()),
    duration: v.optional(v.string()),
    subject: v.string(),
    grade: v.string(),
    questions: v.optional(v.array(
      v.object({
        id: v.string(),
        text: v.string(),
        options: v.optional(v.array(v.string())),
        correctAnswer: v.optional(v.string()),
        marks: v.number(),
      })
    )),
    deadline: v.optional(v.number()),
    isPublished: v.boolean(),
    displayOrder: v.number(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("غير مصرح");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) throw new Error("المستخدم غير موجود");
    
    // ✅ التحقق من أن المستخدم هو المعلم نفسه أو أدمن
    if (user.role !== "admin" && user.role !== "teacher") {
      throw new Error("غير مصرح");
    }

    if (user.role === "teacher" && user._id !== args.teacherId) {
      throw new Error("غير مصرح لك برفع مواد لمعلم آخر");
    }

    const materialId = await ctx.db.insert("teacherMaterials", {
      ...args,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return { success: true, materialId };
  },
});

// ✅ تحديث مادة
export const updateMaterial = mutation({
  args: {
    materialId: v.id("teacherMaterials"),
    title: v.optional(v.string()),
    titleAr: v.optional(v.string()),
    description: v.optional(v.string()),
    descriptionAr: v.optional(v.string()),
    fileUrl: v.optional(v.string()),
    fileSize: v.optional(v.string()),
    duration: v.optional(v.string()),
    questions: v.optional(v.array(
      v.object({
        id: v.string(),
        text: v.string(),
        options: v.optional(v.array(v.string())),
        correctAnswer: v.optional(v.string()),
        marks: v.number(),
      })
    )),
    deadline: v.optional(v.number()),
    isPublished: v.optional(v.boolean()),
    displayOrder: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("غير مصرح");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) throw new Error("المستخدم غير موجود");

    const material = await ctx.db.get(args.materialId);
    if (!material) throw new Error("المادة غير موجودة");

    if (user.role !== "admin" && user._id !== material.teacherId) {
      throw new Error("غير مصرح");
    }

    const { materialId, ...fields } = args;
    await ctx.db.patch(materialId, {
      ...fields,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

// ✅ حذف مادة
export const deleteMaterial = mutation({
  args: { materialId: v.id("teacherMaterials") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("غير مصرح");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) throw new Error("المستخدم غير موجود");

    const material = await ctx.db.get(args.materialId);
    if (!material) throw new Error("المادة غير موجودة");

    if (user.role !== "admin" && user._id !== material.teacherId) {
      throw new Error("غير مصرح");
    }

    await ctx.db.delete(args.materialId);
    return { success: true };
  },
});

// ✅ تصدير الدوال
export const teacherMaterials = {
  getTeacherMaterials,
  getPublicTeacherMaterials,
  createMaterial,
  updateMaterial,
  deleteMaterial,
};