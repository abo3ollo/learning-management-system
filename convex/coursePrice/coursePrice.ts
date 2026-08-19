// convex/coursePrice/coursePrice.ts
import { v } from "convex/values";
import { mutation, query } from "../_generated/server";

// ── جلب سعر كورس القدرات للمعلم ──────────────────────────────
export const getAptitudeCoursePrice = query({
  args: {
    teacherId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const teacher = await ctx.db.get(args.teacherId);
    if (!teacher) throw new Error("المعلم غير موجود");

    return {
      price: teacher.aptitudeCoursePrice || 0,
      currency: teacher.aptitudeCourseCurrency || "EGP",
    };
  },
});

// ── جلب سعر كورس التحصيلي للمعلم ──────────────────────────────
export const getAcademicCoursePrice = query({
  args: {
    teacherId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const teacher = await ctx.db.get(args.teacherId);
    if (!teacher) throw new Error("المعلم غير موجود");

    return {
      price: teacher.academicCoursePrice || 0,
      currency: teacher.academicCourseCurrency || "EGP",
    };
  },
});

// ── تحديث سعر كورس القدرات للمعلم ──────────────────────────────
export const updateAptitudeCoursePrice = mutation({
  args: {
    teacherId: v.id("users"),
    price: v.number(),
    currency: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("غير مصرح");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) throw new Error("المستخدم غير موجود");

    if (user.role !== "admin" && user._id !== args.teacherId) {
      throw new Error("غير مصرح: يمكنك فقط تعديل سعر كورسك");
    }

    await ctx.db.patch(args.teacherId, {
      aptitudeCoursePrice: args.price,
      aptitudeCourseCurrency: args.currency,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

// ── تحديث سعر كورس التحصيلي للمعلم ──────────────────────────────
export const updateAcademicCoursePrice = mutation({
  args: {
    teacherId: v.id("users"),
    price: v.number(),
    currency: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("غير مصرح");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) throw new Error("المستخدم غير موجود");

    if (user.role !== "admin" && user._id !== args.teacherId) {
      throw new Error("غير مصرح: يمكنك فقط تعديل سعر كورسك");
    }

    await ctx.db.patch(args.teacherId, {
      academicCoursePrice: args.price,
      academicCourseCurrency: args.currency,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

// ── جلب جميع المعلمين مع أسعار كورسات القدرات (للطلاب) ──────────
export const getTeachersWithAptitudePrices = query({
  handler: async (ctx) => {
    const teachers = await ctx.db
      .query("users")
      .withIndex("by_role", (q) => q.eq("role", "teacher"))
      .collect();

    const activeTeachers = teachers.filter(
      (t) => t.status === "active" || t.status === "approved"
    );

    const teachersWithDetails = await Promise.all(
      activeTeachers.map(async (teacher) => {
        const materials = await ctx.db
          .query("aptitudeMaterials")
          .withIndex("by_teacherId", (q) => q.eq("teacherId", teacher._id))
          .collect();

        const activeMaterials = materials.filter((m) => m.isActive === true);

        return {
          ...teacher,
          materialsCount: activeMaterials.length,
          aptitudeCoursePrice: teacher.aptitudeCoursePrice || 0,
          aptitudeCourseCurrency: teacher.aptitudeCourseCurrency || "EGP",
        };
      })
    );

    return teachersWithDetails;
  },
});

// ── جلب جميع المعلمين مع أسعار كورسات التحصيلي (للطلاب) ──────────
export const getTeachersWithAcademicPrices = query({
  handler: async (ctx) => {
    const teachers = await ctx.db
      .query("users")
      .withIndex("by_role", (q) => q.eq("role", "teacher"))
      .collect();

    const activeTeachers = teachers.filter(
      (t) => t.status === "active" || t.status === "approved"
    );

    const teachersWithDetails = await Promise.all(
      activeTeachers.map(async (teacher) => {
        const materials = await ctx.db
          .query("academicMaterials")
          .withIndex("by_teacher", (q) => q.eq("teacherId", teacher._id))
          .collect();

        const publishedMaterials = materials.filter((m) => m.isPublished === true);

        return {
          ...teacher,
          materialsCount: publishedMaterials.length,
          academicCoursePrice: teacher.academicCoursePrice || 0,
          academicCourseCurrency: teacher.academicCourseCurrency || "EGP",
        };
      })
    );

    return teachersWithDetails;
  },
});

// ── تصدير الدوال ──────────────────────────────────────────────────
export const coursePrice = {
  getAptitudeCoursePrice,
  getAcademicCoursePrice,
  updateAptitudeCoursePrice,
  updateAcademicCoursePrice,
  getTeachersWithAptitudePrices,
  getTeachersWithAcademicPrices,
};