import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// ── جلب مشتريات الطالب الحالي مع رسائل الأدمن ──────────────
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

    const purchasesWithItems = await Promise.all(
      purchases.map(async (purchase) => {
        const item = await ctx.db.get(purchase.itemId);
        return {
          ...purchase,
          itemName: item?.name || "غير معروف",
          itemCode: item?.code || "غير معروف",
          itemSellingPrice: item?.sellingPrice || 0,
        };
      })
    );

    return purchasesWithItems;
  },
});

// ── تحديث حالة طلب الشراء مع ملاحظات إضافية ──────────────
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
    notes: v.optional(v.string()), // ✅ هذا هو adminNotes
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

    // ✅ إضافة سبب الرفض
    if (args.status === "rejected" && args.rejectionReason) {
      updateData.rejectionReason = args.rejectionReason;
    }

    // ✅ إضافة ملاحظات الأدمن (سواء موافقة أو رفض)
    if (args.notes) {
      updateData.adminNotes = args.notes;
    }

    console.log("Updating purchase with data:", updateData); // للتتبع

    await ctx.db.patch(args.purchaseId, updateData);

    return args.purchaseId;
  },
});

// ── جلب جميع طلبات الشراء مع تفاصيل كاملة (للأدمن) ──────
export const getAllPurchasesWithDetails = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("غير مصرح");

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
        .reduce((sum, p) => sum + (p.totalPrice || 0), 0),
    };

    return stats;
  },
});