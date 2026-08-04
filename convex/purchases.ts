import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// ── جلب مشتريات الطالب الحالي ──────────────────────────────
export const getMyPurchases = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("غير مصرح");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) throw new Error("المستخدم غير موجود");

    const purchases = await ctx.db
      .query("purchases")
      .withIndex("by_studentId", (q) => q.eq("studentId", user._id))
      .order("desc")
      .collect();

    // جلب بيانات الأصناف
    const purchasesWithItems = await Promise.all(
      purchases.map(async (purchase) => {
        const item = await ctx.db.get(purchase.itemId);
        return {
          ...purchase,
          itemName: item?.name || "",
          itemCode: item?.code || "",
        };
      })
    );

    return purchasesWithItems;
  },
});

// ── جلب جميع طلبات الشراء (للمشرفين) ──────────────────────
export const getAllPurchases = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("غير مصرح");

    const purchases = await ctx.db
      .query("purchases")
      .order("desc")
      .collect();

    // جلب بيانات الأصناف والطلاب
    const purchasesWithDetails = await Promise.all(
      purchases.map(async (purchase) => {
        const item = await ctx.db.get(purchase.itemId);
        const student = await ctx.db.get(purchase.studentId);
        return {
          ...purchase,
          itemName: item?.name || "",
          itemCode: item?.code || "",
          studentName: student?.name || "",
          studentEmail: student?.email || "",
        };
      })
    );

    return purchasesWithDetails;
  },
});


// ── جلب جميع طلبات الشراء مع تفاصيل كاملة (للأدمن) ──────
export const getAllPurchasesWithDetails = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("غير مصرح");

    // التحقق من أن المستخدم أدمن
    const admin = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!admin || admin.role !== "admin") {
      throw new Error("غير مصرح: يجب أن يكون لديك صلاحيات أدمن");
    }

    const purchases = await ctx.db
      .query("purchases")
      .order("desc")
      .collect();

    // جلب جميع البيانات المرتبطة
    const purchasesWithDetails = await Promise.all(
      purchases.map(async (purchase) => {
        const item = await ctx.db.get(purchase.itemId);
        const student = await ctx.db.get(purchase.studentId);
        const unit = item ? await ctx.db.get(item.unitId) : null;
        const category = item ? await ctx.db.get(item.categoryId) : null;
        const warehouse = item ? await ctx.db.get(item.warehouseId) : null;

        return {
          ...purchase,
          itemName: item?.name || "غير معروف",
          itemCode: item?.code || "غير معروف",
          itemSellingPrice: item?.sellingPrice || 0,
          itemPurchasePrice: item?.purchasePrice || 0,
          unitName: unit?.name || "",
          categoryName: category?.name || "",
          warehouseName: warehouse?.name || "",
          studentName: student?.name || "غير معروف",
          studentEmail: student?.email || "غير معروف",
          studentPhone: student?.phoneNumber || "غير معروف",
        };
      })
    );

    return purchasesWithDetails;
  },
});

// ── تحديث حالة طلب الشراء مع سبب الرفض ──────────────────────
export const updatePurchaseStatus = mutation({
  args: {
    purchaseId: v.id("purchases"),
    status: v.union(
      v.literal("pending"),
      v.literal("approved"),
      v.literal("rejected"),
      v.literal("completed")
    ),
    rejectionReason: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("غير مصرح");

    // التحقق من أن المستخدم أدمن
    const admin = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!admin || admin.role !== "admin") {
      throw new Error("غير مصرح: يجب أن يكون لديك صلاحيات أدمن");
    }

    const purchase = await ctx.db.get(args.purchaseId);
    if (!purchase) throw new Error("طلب الشراء غير موجود");

    const updateData: any = {
      status: args.status,
      updatedAt: Date.now(),
    };

    // إذا كان الحالة مرفوض، أضف سبب الرفض
    if (args.status === "rejected" && args.rejectionReason) {
      updateData.rejectionReason = args.rejectionReason;
    }

    if (args.notes) {
      updateData.notes = args.notes;
    }

    await ctx.db.patch(args.purchaseId, updateData);

    return args.purchaseId;
  },
});

// ── جلب إحصائيات المشتريات ──────────────────────────────────
export const getPurchaseStats = query({
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

    const purchases = await ctx.db.query("purchases").collect();

    const stats = {
      total: purchases.length,
      pending: purchases.filter(p => p.status === "pending").length,
      approved: purchases.filter(p => p.status === "approved").length,
      rejected: purchases.filter(p => p.status === "rejected").length,
      completed: purchases.filter(p => p.status === "completed").length,
      totalRevenue: purchases
        .filter(p => p.status === "approved" || p.status === "completed")
        .reduce((sum, p) => sum + p.totalPrice, 0),
    };

    return stats;
  },
});