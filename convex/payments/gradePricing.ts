// convex/gradePricing.ts

import { v } from "convex/values";
import { mutation, query } from "../_generated/server";

// ✅ جلب سعر الصف
export const getGradePrice = query({
  args: { gradeId: v.id("grades") },
  handler: async (ctx, args) => {
    const pricing = await ctx.db
      .query("gradePricing")
      .withIndex("by_grade", (q) => q.eq("gradeId", args.gradeId))
      .first();

    return pricing || null;
  },
});

// ✅ جلب جميع الأسعار النشطة
export const getActivePricing = query({
  args: {},
  handler: async (ctx) => {
    const pricing = await ctx.db
      .query("gradePricing")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .collect();

    const pricingWithGrade = await Promise.all(
      pricing.map(async (p) => {
        const grade = await ctx.db.get(p.gradeId);
        return {
          ...p,
          gradeName: grade?.name || "غير محدد",
          gradeNameEn: grade?.nameEn || "",
        };
      })
    );

    return pricingWithGrade;
  },
});

// ✅ إنشاء أو تحديث سعر الصف (للأدمن)
export const setGradePrice = mutation({
  args: {
    gradeId: v.id("grades"),
    price: v.number(),
    currency: v.string(),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("غير مصرح");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user || user.role !== "admin") {
      throw new Error("مطلوب صلاحيات مشرف");
    }

    const existing = await ctx.db
      .query("gradePricing")
      .withIndex("by_grade", (q) => q.eq("gradeId", args.gradeId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        price: args.price,
        currency: args.currency,
        description: args.description,
        updatedAt: Date.now(),
      });
      return { success: true, updated: true };
    }

    await ctx.db.insert("gradePricing", {
      gradeId: args.gradeId,
      price: args.price,
      currency: args.currency,
      description: args.description,
      isActive: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return { success: true, updated: false };
  },
});

export const gradePricing = {
  getGradePrice,
  getActivePricing,
  setGradePrice,
};