// convex/academic/academic.ts

import { v } from "convex/values";
import { mutation, query } from "../_generated/server";
import { Id } from "../_generated/dataModel";

// ── جلب جميع طلبات الشراء للطالب الحالي ──────────────────────
export const getMyAcademicPurchases = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("غير مصرح");

    const student = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!student) throw new Error("المستخدم غير موجود");

    const purchases = await ctx.db
      .query("academicPurchases")
      .withIndex("by_studentId", (q) => q.eq("studentId", student._id))
      .order("desc")
      .collect();

    const purchasesWithDetails = await Promise.all(
      purchases.map(async (purchase) => {
        const material = await ctx.db.get(purchase.materialId);
        const teacher = await ctx.db.get(purchase.teacherId);
        return {
          ...purchase,
          materialTitle: material?.title || "غير معروف",
          materialTitleAr: material?.titleAr || "غير معروف",
          materialType: material?.type || "unknown",
          teacherName: teacher?.name || "غير معروف",
          teacherEmail: teacher?.email || "",
        };
      })
    );

    return purchasesWithDetails;
  },
});

// ── جلب جميع طلبات الشراء (للأدمن) ──────────────────────────
export const getAllAcademicPurchases = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("غير مصرح");

    const admin = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!admin || admin.role !== "admin") {
      throw new Error("غير مصرح: فقط الأدمن يمكنه الوصول");
    }

    const purchases = await ctx.db
      .query("academicPurchases")
      .order("desc")
      .collect();

    const purchasesWithDetails = await Promise.all(
      purchases.map(async (purchase) => {
        const material = await ctx.db.get(purchase.materialId);
        const teacher = await ctx.db.get(purchase.teacherId);
        const student = await ctx.db.get(purchase.studentId);
        return {
          ...purchase,
          materialTitle: material?.title || "غير معروف",
          materialTitleAr: material?.titleAr || "غير معروف",
          materialType: material?.type || "unknown",
          teacherName: teacher?.name || "غير معروف",
          teacherEmail: teacher?.email || "",
          studentName: student?.name || "غير معروف",
          studentEmail: student?.email || "",
        };
      })
    );

    return purchasesWithDetails;
  },
});

// ── إنشاء طلب شراء تحصيلي ──────────────────────────────────
export const createAcademicPurchase = mutation({
  args: {
    materialId: v.id("teacherMaterials"),
    teacherId: v.id("users"),
    amount: v.number(),
    currency: v.string(),
    paymentProof: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("غير مصرح");

    const student = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!student) throw new Error("المستخدم غير موجود");

    // ✅ التحقق من وجود طلب سابق لنفس المادة
    const existingPurchases = await ctx.db
      .query("academicPurchases")
      .withIndex("by_studentId", (q) => q.eq("studentId", student._id))
      .collect();

    const existing = existingPurchases.find(
      (p) => p.materialId === args.materialId && p.status === "pending"
    );

    if (existing) {
      throw new Error("لديك طلب قيد المراجعة لهذه المادة");
    }

    // ✅ إنشاء الطلب
    const purchaseId = await ctx.db.insert("academicPurchases", {
      materialId: args.materialId,
      teacherId: args.teacherId,
      studentId: student._id,
      amount: args.amount,
      currency: args.currency,
      paymentProof: args.paymentProof,
      status: "pending",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // ✅ تسجيل في سجل التدقيق - باستخدام الحقول المسموحة فقط
    await ctx.db.insert("auditLogs", {
      userId: student._id,
      action: "CREATE_ACADEMIC_PURCHASE",
      resourceType: "academicPurchase",
      resourceId: purchaseId,
      details: {
        // ✅ استخدم الحقول المسموحة فقط
        name: student.name,
        email: student.email,
        role: student.role,
        studentId: student._id,
        teacherId: args.teacherId,
        // ✅ أضف معلومات إضافية في reason
        reason: `طلب شراء مادة تحصيلي بمبلغ ${args.amount} ${args.currency}`,
      },
      createdAt: Date.now(),
    });

    return purchaseId;
  },
});

// ── تحديث حالة طلب شراء (للأدمن) ──────────────────────────
export const updateAcademicPurchaseStatus = mutation({
  args: {
    purchaseId: v.id("academicPurchases"),
    status: v.union(
      v.literal("pending"),
      v.literal("approved"),
      v.literal("rejected")
    ),
    rejectionReason: v.optional(v.string()),
    adminNotes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("غير مصرح");

    const admin = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!admin || admin.role !== "admin") {
      throw new Error("غير مصرح: فقط الأدمن يمكنه تحديث الحالة");
    }

    const purchase = await ctx.db.get(args.purchaseId);
    if (!purchase) throw new Error("طلب الشراء غير موجود");

    const updateData: any = {
      status: args.status,
      updatedAt: Date.now(),
    };

    if (args.status === "rejected" && args.rejectionReason) {
      updateData.rejectionReason = args.rejectionReason;
    }

    if (args.adminNotes) {
      updateData.adminNotes = args.adminNotes;
    }

    // ✅ إذا تمت الموافقة، قم بتفعيل المادة للطالب
    if (args.status === "approved") {
      await ctx.db.insert("auditLogs", {
        userId: admin._id,
        action: "APPROVE_ACADEMIC_PURCHASE",
        resourceType: "academicPurchase",
        resourceId: args.purchaseId,
        details: {
          // ✅ استخدم الحقول المسموحة فقط
          name: admin.name,
          email: admin.email,
          role: admin.role,
          studentId: purchase.studentId,
          teacherId: purchase.teacherId,
          reason: `تمت الموافقة على طلب شراء مادة تحصيلي بمبلغ ${purchase.amount} ${purchase.currency}`,
        },
        createdAt: Date.now(),
      });
    }

    await ctx.db.patch(args.purchaseId, updateData);

    // ✅ إرسال إشعار للطالب
    await ctx.db.insert("notifications", {
      title: args.status === "approved" ? "تم قبول طلبك" : "تم رفض طلبك",
      message: args.status === "approved"
        ? "تم قبول طلب شراء المادة، يمكنك الآن الوصول إليها"
        : args.rejectionReason || "تم رفض طلب شراء المادة",
      type: "system_announcement",
      priority: "normal",
      recipientType: "student",
      recipientId: purchase.studentId,
      status: "sent",
      createdBy: admin._id,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return { success: true, purchaseId: args.purchaseId };
  },
});

// ── جلب حالة طلب معين ──────────────────────────────────────────
export const getPurchaseStatus = query({
  args: {
    purchaseId: v.id("academicPurchases"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("غير مصرح");

    const purchase = await ctx.db.get(args.purchaseId);
    if (!purchase) throw new Error("الطلب غير موجود");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) throw new Error("المستخدم غير موجود");

    if (user._id !== purchase.studentId && user.role !== "admin") {
      throw new Error("غير مصرح");
    }

    const material = await ctx.db.get(purchase.materialId);
    const teacher = await ctx.db.get(purchase.teacherId);

    return {
      ...purchase,
      materialTitle: material?.title || "غير معروف",
      materialTitleAr: material?.titleAr || "غير معروف",
      teacherName: teacher?.name || "غير معروف",
    };
  },
});

// ── إحصائيات التحصيلي ──────────────────────────────────────────
export const getAcademicStats = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("غير مصرح");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) throw new Error("المستخدم غير موجود");

    if (user.role === "admin") {
      const allPurchases = await ctx.db.query("academicPurchases").collect();
      const allMaterials = await ctx.db.query("teacherMaterials").collect();

      return {
        totalPurchases: allPurchases.length,
        pendingPurchases: allPurchases.filter((p) => p.status === "pending").length,
        approvedPurchases: allPurchases.filter((p) => p.status === "approved").length,
        rejectedPurchases: allPurchases.filter((p) => p.status === "rejected").length,
        totalMaterials: allMaterials.filter((m) => m.isPublished === true).length,
        totalRevenue: allPurchases
          .filter((p) => p.status === "approved")
          .reduce((sum, p) => sum + (p.amount || 0), 0),
      };
    }

    const myPurchases = await ctx.db
      .query("academicPurchases")
      .withIndex("by_studentId", (q) => q.eq("studentId", user._id))
      .collect();

    return {
      totalPurchases: myPurchases.length,
      pendingPurchases: myPurchases.filter((p) => p.status === "pending").length,
      approvedPurchases: myPurchases.filter((p) => p.status === "approved").length,
      rejectedPurchases: myPurchases.filter((p) => p.status === "rejected").length,
      totalSpent: myPurchases
        .filter((p) => p.status === "approved")
        .reduce((sum, p) => sum + (p.amount || 0), 0),
    };
  },
});

// ── تصدير الدوال ──────────────────────────────────────────────────
export const academic = {
  getMyAcademicPurchases,
  getAllAcademicPurchases,
  createAcademicPurchase,
  updateAcademicPurchaseStatus,
  getPurchaseStatus,
  getAcademicStats,
};