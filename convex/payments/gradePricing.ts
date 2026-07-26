// convex/payments/gradePricing.ts

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

// ✅ جلب جميع الأسعار (للأدمن)
export const getAllPricing = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("غير مصرح");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user || user.role !== "admin") {
      throw new Error("مطلوب صلاحيات مشرف");
    }

    const pricing = await ctx.db.query("gradePricing").collect();

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

    return pricingWithGrade.sort((a, b) => a.gradeId.localeCompare(b.gradeId));
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

// ✅ تغيير حالة السعر (تفعيل/إلغاء)
export const toggleGradePrice = mutation({
  args: {
    pricingId: v.id("gradePricing"),
    isActive: v.boolean(),
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

    const pricing = await ctx.db.get(args.pricingId);
    if (!pricing) throw new Error("السعر غير موجود");

    await ctx.db.patch(args.pricingId, {
      isActive: args.isActive,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

// ✅ جلب جميع المستخدمين مع حالة الاشتراك
export const getUsersWithSubscription = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("غير مصرح");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user || user.role !== "admin") {
      throw new Error("مطلوب صلاحيات مشرف");
    }

    // ✅ جلب جميع المستخدمين
    const users = await ctx.db.query("users").collect();

    // ✅ جلب جميع طلبات الموافقة
    const approvalRequests = await ctx.db
      .query("approvalRequests")
      .collect();

    // ✅ جلب جميع المدفوعات
    const payments = await ctx.db
      .query("payments")
      .collect();

    // ✅ جلب جميع الأسعار
    const pricing = await ctx.db.query("gradePricing").collect();

    // ✅ تجميع البيانات
    const usersWithSubscription = await Promise.all(
      users.map(async (u) => {
        // ✅ جلب طلب الموافقة للطالب
        const approvalRequest = approvalRequests.find(
          (r) => r.studentId === u._id
        );

        // ✅ جلب المدفوعات للطالب
        const userPayments = payments.filter(
          (p) => p.studentId === u._id || p.parentId === u._id
        );

        // ✅ جلب سعر الصف
        let gradePrice = null;
        if (u.gradeId) {
          gradePrice = pricing.find((p) => p.gradeId === u.gradeId);
        }

        // ✅ تحديد حالة الاشتراك
        let subscriptionStatus = u.subscriptionStatus || "pending";
        let paymentStatus = "unpaid";

        // ✅ التحقق من وجود دفعة مكتملة
        const hasCompletedPayment = userPayments.some(
          (p) => p.status === "completed"
        );
        const hasPendingPayment = userPayments.some(
          (p) => p.status === "pending"
        );

        if (hasCompletedPayment) {
          paymentStatus = "paid";
          subscriptionStatus = "active";
        } else if (hasPendingPayment) {
          paymentStatus = "pending";
          subscriptionStatus = "awaiting_approval";
        }

        // ✅ جلب اسم الصف
        let gradeName = "غير محدد";
        if (u.gradeId) {
          const grade = await ctx.db.get(u.gradeId);
          if (grade) {
            gradeName = grade.name || "غير محدد";
          }
        }

        return {
          ...u,
          gradeName,
          subscriptionStatus,
          paymentStatus,
          gradePrice: gradePrice?.price || null,
          gradePriceCurrency: gradePrice?.currency || "SAR",
          approvalRequest,
          hasPayment: userPayments.length > 0,
          payments: userPayments,
        };
      })
    );

    return usersWithSubscription;
  },
});

export const gradePricing = {
  getGradePrice,
  getActivePricing,
  getAllPricing,
  setGradePrice,
  toggleGradePrice,
  getUsersWithSubscription,
};