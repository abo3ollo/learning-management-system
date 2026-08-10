import { v } from "convex/values";
import { mutation, query } from "../_generated/server";

// ── جلب جميع معلمي القدرات المتاحين ──────────────────────────
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
          .query("aptitudeMaterials")
          .withIndex("by_teacherId", (q) => q.eq("teacherId", teacher._id))
          .collect();

        const activeMaterials = materials.filter((m) => m.isActive === true);

        return {
          ...teacher,
          materialsCount: activeMaterials.length,
        };
      })
    );

    return teachersWithMaterials;
  },
});

// ── جلب مواد معلم معين ──────────────────────────────────────
export const getTeacherMaterials = query({
  args: {
    teacherId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const materials = await ctx.db
      .query("aptitudeMaterials")
      .withIndex("by_teacherId", (q) => q.eq("teacherId", args.teacherId))
      .collect();

    const activeMaterials = materials.filter((m) => m.isActive === true);
    return activeMaterials;
  },
});

// ── إنشاء طلب شراء قدرات ──────────────────────────────────
export const createAptitudePurchase = mutation({
  args: {
    teacherId: v.id("users"),
    amount: v.number(),
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
      .query("aptitudePurchases")
      .withIndex("by_studentId", (q) => q.eq("studentId", student._id))
      .collect();

    const existing = existingPurchases.find(
      (p) => p.teacherId === args.teacherId && p.status === "pending"
    );

    if (existing) {
      throw new Error("لديك طلب قيد المراجعة لهذا المعلم");
    }

    const purchaseId = await ctx.db.insert("aptitudePurchases", {
      teacherId: args.teacherId,
      studentId: student._id,
      amount: args.amount,
      paymentProof: args.paymentProof,
      status: "pending",
      createdAt: Date.now(),
    });

    return purchaseId;
  },
});

// ── جلب طلبات القدرات للطالب الحالي ──────────────────────────
export const getMyAptitudePurchases = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("غير مصرح");

    const student = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!student) throw new Error("المستخدم غير موجود");

    const purchases = await ctx.db
      .query("aptitudePurchases")
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

// ── جلب جميع طلبات القدرات (للأدمن) ──────────────────────────
export const getAllAptitudePurchases = query({
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
      .query("aptitudePurchases")
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

// ── تحديث حالة طلب القدرات (للأدمن) ──────────────────────────
export const updateAptitudePurchaseStatus = mutation({
  args: {
    purchaseId: v.id("aptitudePurchases"),
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
    return args.purchaseId;
  },
});

// ── جلب حالة طلب معين ──────────────────────────────────────────
export const getPurchaseStatus = query({
  args: {
    purchaseId: v.id("aptitudePurchases"),
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

// ── إضافة مواد للمعلم (للأدمن) ──────────────────────────────
export const addAptitudeMaterial = mutation({
  args: {
    teacherId: v.id("users"),
    title: v.string(),
    titleAr: v.optional(v.string()),
    type: v.union(
      v.literal("pdf"),
      v.literal("video"),
      v.literal("exam"),
      v.literal("assignment"),
      v.literal("revision")
    ),
    url: v.string(),
    size: v.optional(v.string()),
    duration: v.optional(v.string()),
    description: v.optional(v.string()),
    descriptionAr: v.optional(v.string()),
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

    const materialId = await ctx.db.insert("aptitudeMaterials", {
      teacherId: args.teacherId,
      title: args.title,
      titleAr: args.titleAr,
      type: args.type,
      url: args.url,
      size: args.size,
      duration: args.duration,
      description: args.description,
      descriptionAr: args.descriptionAr,
      isActive: true,
      createdAt: Date.now(),
    });

    return materialId;
  },
});

// ── حذف مادة (تعطيل) ──────────────────────────────────────────
export const removeAptitudeMaterial = mutation({
  args: {
    materialId: v.id("aptitudeMaterials"),
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

    await ctx.db.patch(args.materialId, {
      isActive: false,
    });

    return args.materialId;
  },
});

// ── الحصول على إحصائيات القدرات ──────────────────────────────
export const getAptitudeStats = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("غير مصرح");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) throw new Error("المستخدم غير موجود");

    if (user.role === "admin") {
      const allPurchases = await ctx.db.query("aptitudePurchases").collect();
      const allTeachers = await ctx.db
        .query("users")
        .withIndex("by_role", (q) => q.eq("role", "teacher"))
        .collect();
      const allMaterials = await ctx.db.query("aptitudeMaterials").collect();

      return {
        totalPurchases: allPurchases.length,
        pendingPurchases: allPurchases.filter(p => p.status === "pending").length,
        approvedPurchases: allPurchases.filter(p => p.status === "approved").length,
        rejectedPurchases: allPurchases.filter(p => p.status === "rejected").length,
        totalTeachers: allTeachers.filter(t => t.status === "active" || t.status === "approved").length,
        totalMaterials: allMaterials.filter(m => m.isActive === true).length,
      };
    }

    const myPurchases = await ctx.db
      .query("aptitudePurchases")
      .withIndex("by_studentId", (q) => q.eq("studentId", user._id))
      .collect();

    return {
      totalPurchases: myPurchases.length,
      pendingPurchases: myPurchases.filter(p => p.status === "pending").length,
      approvedPurchases: myPurchases.filter(p => p.status === "approved").length,
      rejectedPurchases: myPurchases.filter(p => p.status === "rejected").length,
    };
  },
});