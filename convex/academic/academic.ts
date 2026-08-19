// convex/academic/academic.ts
import { v } from "convex/values";
import { mutation, query } from "../_generated/server";
import { Id } from "../_generated/dataModel";

// ── Helper ──────────────────────────────────────────────────────
async function getAdminUser(ctx: any) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("غير مصرح");

  const user = await ctx.db
    .query("users")
    .withIndex("by_clerkId", (q: any) => q.eq("clerkId", identity.subject))
    .first();

  if (!user) throw new Error("المستخدم غير موجود");
  if (user.role !== "admin") throw new Error("مطلوب صلاحيات أدمن");

  return user;
}



// ── جلب جميع المعلمين المتاحين للتحصيلي ──────────────────────
export const getAvailableTeachers = query({
  handler: async (ctx) => {
    const teachers = await ctx.db
      .query("users")
      .withIndex("by_role", (q) => q.eq("role", "teacher"))
      .collect();

    const activeTeachers = teachers.filter(
      (teacher) => teacher.status === "active" || teacher.status === "approved"
    );

    const teachersWithMaterials = await Promise.all(
      activeTeachers.map(async (teacher) => {
        const materials = await ctx.db
          .query("academicMaterials")
          .withIndex("by_teacher", (q) => q.eq("teacherId", teacher._id))
          .collect();

        const activeMaterials = materials.filter((m) => m.isPublished === true);

        return {
          ...teacher,
          materialsCount: activeMaterials.length,
          // ✅ استخدم academicCoursePrice بدلاً من coursePrice
          coursePrice: teacher.academicCoursePrice || 0,
          courseCurrency: teacher.academicCourseCurrency || "EGP",
        };
      })
    );

    return teachersWithMaterials;
  },
});

// ── جلب مواد معلم معين للتحصيلي ──────────────────────────────
export const getTeacherMaterials = query({
  args: {
    teacherId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // ✅ استخدم academicMaterials
    const materials = await ctx.db
      .query("academicMaterials")
      .withIndex("by_teacher", (q) => q.eq("teacherId", args.teacherId))
      .collect();

    const activeMaterials = materials.filter((m) => m.isPublished === true);
    return activeMaterials;
  },
});

// ── جلب جميع المواد التحصيلية المنشورة ──────────────────────────
export const getPublishedAcademicMaterials = query({
  args: {
    subject: v.optional(v.string()),
    grade: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let materials = await ctx.db
      .query("academicMaterials")
      .withIndex("by_published", (q) => q.eq("isPublished", true))
      .collect();

    if (args.subject) {
      materials = materials.filter((m) => m.subject === args.subject);
    }
    if (args.grade) {
      materials = materials.filter((m) => m.grade === args.grade);
    }

    // إضافة اسم المعلم
    const materialsWithTeacher = await Promise.all(
      materials.map(async (material) => {
        const teacher = await ctx.db.get(material.teacherId);
        return {
          ...material,
          teacherName: teacher?.name || "غير معروف",
        };
      })
    );

    return materialsWithTeacher;
  },
});


// ── إنشاء طلب شراء تحصيلي ──────────────────────────────────
export const createAcademicPurchase = mutation({
  args: {
    teacherId: v.id("users"),
    amount: v.number(),
    currency: v.optional(v.string()),
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

    const existingPurchases = await ctx.db
      .query("academicPurchases")
      .withIndex("by_studentId", (q) => q.eq("studentId", student._id))
      .collect();

    const existing = existingPurchases.find(
      (p) => p.teacherId === args.teacherId && p.status === "pending"
    );

    if (existing) {
      throw new Error("لديك طلب قيد المراجعة لهذا المعلم");
    }

    const currency = args.currency || "EGP";
    const now = Date.now();

    const purchaseId = await ctx.db.insert("academicPurchases", {
      teacherId: args.teacherId,
      studentId: student._id,
      amount: args.amount,
      currency: currency,
      paymentProof: args.paymentProof,
      status: "pending",
      createdAt: now,
      updatedAt: now, // ✅ أضف updatedAt
    });

    // تسجيل في سجل التدقيق
    await ctx.db.insert("auditLogs", {
      userId: student._id,
      action: "CREATE_ACADEMIC_PURCHASE",
      resourceType: "academicPurchase",
      resourceId: purchaseId,
      details: {
        name: student.name,
        email: student.email,
        role: student.role,
        studentId: student._id,
        teacherId: args.teacherId,
        reason: `طلب شراء مواد تحصيلي بمبلغ ${args.amount} ${currency}`,
      },
      createdAt: now,
    });

    return purchaseId;
  },
});

// ── جلب طلبات التحصيلي للطالب الحالي ──────────────────────────
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

    const purchasesWithTeachers = await Promise.all(
      purchases.map(async (purchase) => {
        const teacher = await ctx.db.get(purchase.teacherId);
        return {
          ...purchase,
          teacherName: teacher?.name || "غير معروف",
          teacherSpecialization: teacher?.specialization || "",
        };
      })
    );

    return purchasesWithTeachers;
  },
});

// ── جلب جميع طلبات التحصيلي (للأدمن) ──────────────────────────
export const getAllAcademicPurchases = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("غير مصرح");

    const admin = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!admin || admin.role !== "admin") {
      throw new Error("غير مصرح");
    }

    const purchases = await ctx.db
      .query("academicPurchases")
      .order("desc")
      .collect();

    const purchasesWithDetails = await Promise.all(
      purchases.map(async (purchase) => {
        const teacher = await ctx.db.get(purchase.teacherId);
        const student = await ctx.db.get(purchase.studentId);
        return {
          ...purchase,
          teacherName: teacher?.name || "غير معروف",
          studentName: student?.name || "غير معروف",
          studentEmail: student?.email || "",
        };
      })
    );

    return purchasesWithDetails;
  },
});

// ── تحديث حالة طلب التحصيلي (للأدمن) ──────────────────────────
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
      throw new Error("غير مصرح");
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

    await ctx.db.patch(args.purchaseId, updateData);

    // إرسال إشعار للطالب
    await ctx.db.insert("notifications", {
      title: args.status === "approved" ? "تم قبول طلبك" : "تم رفض طلبك",
      message: args.status === "approved"
        ? "تم قبول طلب شراء المواد التحصيلية، يمكنك الآن الوصول إليها"
        : args.rejectionReason || "تم رفض طلب شراء المواد التحصيلية",
      type: "system_announcement",
      priority: "normal",
      recipientType: "student",
      recipientId: purchase.studentId,
      status: "sent",
      createdBy: admin._id,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return args.purchaseId;
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

    const teacher = await ctx.db.get(purchase.teacherId);

    return {
      ...purchase,
      teacherName: teacher?.name || "غير معروف",
    };
  },
});

// ── جلب حالة الشراء للطالب الحالي ──────────────────────────────
export const getMyAcademicPurchaseStatus = query({
  args: {
    teacherId: v.id("users"),
  },
  handler: async (ctx, args) => {
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
      .collect();

    const purchase = purchases.find((p) => p.teacherId === args.teacherId);

    if (!purchase) return null;

    return {
      ...purchase,
      status: purchase.status,
    };
  },
});

// ── جلب جميع طلبات التحصيلي للطالب مع حالة الموافقة ────────────
export const getMyAcademicPurchasesWithStatus = query({
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
        const teacher = await ctx.db.get(purchase.teacherId);
        return {
          ...purchase,
          teacherName: teacher?.name || "غير معروف",
          teacherSpecialization: teacher?.specialization || "",
          isApproved: purchase.status === "approved",
          isPending: purchase.status === "pending",
          isRejected: purchase.status === "rejected",
        };
      })
    );

    return purchasesWithDetails;
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
      const allTeachers = await ctx.db
        .query("users")
        .withIndex("by_role", (q) => q.eq("role", "teacher"))
        .collect();
      const allMaterials = await ctx.db.query("academicMaterials").collect();

      return {
        totalPurchases: allPurchases.length,
        pendingPurchases: allPurchases.filter(p => p.status === "pending").length,
        approvedPurchases: allPurchases.filter(p => p.status === "approved").length,
        rejectedPurchases: allPurchases.filter(p => p.status === "rejected").length,
        totalTeachers: allTeachers.filter(t => t.status === "active" || t.status === "approved").length,
        totalMaterials: allMaterials.filter(m => m.isPublished === true).length,
        totalRevenue: allPurchases
          .filter(p => p.status === "approved")
          .reduce((sum, p) => sum + (p.amount || 0), 0),
      };
    }

    const myPurchases = await ctx.db
      .query("academicPurchases")
      .withIndex("by_studentId", (q) => q.eq("studentId", user._id))
      .collect();

    return {
      totalPurchases: myPurchases.length,
      pendingPurchases: myPurchases.filter(p => p.status === "pending").length,
      approvedPurchases: myPurchases.filter(p => p.status === "approved").length,
      rejectedPurchases: myPurchases.filter(p => p.status === "rejected").length,
      totalSpent: myPurchases
        .filter(p => p.status === "approved")
        .reduce((sum, p) => sum + (p.amount || 0), 0),
    };
  },
});

// ── تصدير الدوال ──────────────────────────────────────────────────
export const academic = {
  getAvailableTeachers,
  getTeacherMaterials,
  getPublishedAcademicMaterials,
  createAcademicPurchase,
  getMyAcademicPurchases,
  getAllAcademicPurchases,
  updateAcademicPurchaseStatus,
  getPurchaseStatus,
  getMyAcademicPurchaseStatus,
  getMyAcademicPurchasesWithStatus,
  getAcademicStats,
};