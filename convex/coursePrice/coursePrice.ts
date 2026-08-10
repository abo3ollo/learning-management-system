// convex/teacher/coursePrice.ts

import { v } from "convex/values";
import { mutation, query } from "../_generated/server";

// ✅ جلب سعر الكورس للمعلم
export const getCoursePrice = query({
  args: {
    teacherId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const teacher = await ctx.db.get(args.teacherId);
    if (!teacher) throw new Error("المعلم غير موجود");

    return {
      price: teacher.coursePrice || 0,
      currency: teacher.courseCurrency || "EGP",
    };
  },
});

// ✅ تحديث سعر الكورس للمعلم
export const updateCoursePrice = mutation({
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

    // التحقق من الصلاحية (المعلم نفسه أو أدمن)
    if (user.role !== "admin" && user._id !== args.teacherId) {
      throw new Error("غير مصرح");
    }

    await ctx.db.patch(args.teacherId, {
      coursePrice: args.price,
      courseCurrency: args.currency,
    });

    return { success: true };
  },
});

// ✅ جلب جميع المعلمين مع أسعار كورساتهم (للطلاب)
export const getTeachersWithPrices = query({
  handler: async (ctx) => {
    const teachers = await ctx.db
      .query("users")
      .withIndex("by_role", (q) => q.eq("role", "teacher"))
      .collect();

    // تصفية المعلمين النشطين فقط
    const activeTeachers = teachers.filter(
      (t) => t.status === "active" || t.status === "approved"
    );

    // جلب المواد لكل معلم
    const teachersWithDetails = await Promise.all(
      activeTeachers.map(async (teacher) => {
        const materials = await ctx.db
          .query("teacherMaterials")
          .withIndex("by_teacher", (q) => q.eq("teacherId", teacher._id))
          .collect();

        const publishedMaterials = materials.filter((m) => m.isPublished === true);

        return {
          ...teacher,
          materialsCount: publishedMaterials.length,
          coursePrice: teacher.coursePrice || 0,
          courseCurrency: teacher.courseCurrency || "EGP",
        };
      })
    );

    return teachersWithDetails;
  },
});