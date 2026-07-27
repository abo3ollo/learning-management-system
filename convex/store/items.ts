// convex/store/items.ts

import { v } from "convex/values";
import { mutation, query } from "../_generated/server";
import { Id } from "../_generated/dataModel";

// ============================================
// HELPERS
// ============================================

// ✅ توليد كود صنف فريد
async function generateItemCode(ctx: any): Promise<string> {
  const items = await ctx.db.query("storeItems").collect();
  const nextNumber = items.length + 1;
  return `SKU-${String(nextNumber).padStart(5, "0")}`;
}

// ✅ حساب متوسط التكلفة
function calculateAvgCost(totalCost: number, quantity: number): number {
  if (quantity === 0) return 0;
  return totalCost / quantity;
}

// ============================================
// QUERIES
// ============================================

// ✅ جلب جميع الأصناف
export const getItems = query({
  args: {
    type: v.optional(v.string()),
    status: v.optional(v.string()),
    search: v.optional(v.string()),
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

    let items = await ctx.db.query("storeItems").collect();

    if (args.type) {
      items = items.filter((item) => item.type === args.type);
    }

    if (args.status) {
      items = items.filter((item) => item.status === args.status);
    }

    if (args.search) {
      const searchLower = args.search.toLowerCase();
      items = items.filter(
        (item) =>
          item.name.toLowerCase().includes(searchLower) ||
          item.code.toLowerCase().includes(searchLower) ||
          item.description?.toLowerCase().includes(searchLower)
      );
    }

    // جلب أسماء الصفوف
    const itemsWithDetails = await Promise.all(
      items.map(async (item) => {
        let gradeName = "غير محدد";

        if (item.gradeId) {
          const grade = await ctx.db.get(item.gradeId);
          if (grade) gradeName = grade.name;
        }

        return {
          ...item,
          gradeName,
          stockValue: item.avgCost * item.quantity,
        };
      })
    );

    return itemsWithDetails.sort((a, b) => a.createdAt - b.createdAt);
  },
});

// ✅ جلب صنف بواسطة ID
export const getItemById = query({
  args: { itemId: v.id("storeItems") },
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

    const item = await ctx.db.get(args.itemId);
    if (!item) throw new Error("الصنف غير موجود");

    let gradeName = "غير محدد";

    if (item.gradeId) {
      const grade = await ctx.db.get(item.gradeId);
      if (grade) gradeName = grade.name;
    }

    // جلب معاملات الصنف
    const transactions = await ctx.db
      .query("storeTransactions")
      .withIndex("by_item", (q) => q.eq("itemId", args.itemId))
      .collect();

    // جلب أسماء المستخدمين
    const transactionsWithUser = await Promise.all(
      transactions.map(async (t) => {
        const creator = await ctx.db.get(t.createdBy);
        return {
          ...t,
          createdByName: creator?.name || "غير معروف",
        };
      })
    );

    return {
      ...item,
      gradeName,
      stockValue: item.avgCost * item.quantity,
      transactions: transactionsWithUser,
    };
  },
});

// ✅ جلب إحصائيات المخزون
export const getInventoryStats = query({
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

    const items = await ctx.db.query("storeItems").collect();

    const totalItems = items.length;
    const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
    const totalValue = items.reduce(
      (sum, item) => sum + item.avgCost * item.quantity,
      0
    );

    const lowStock = items.filter(
      (item) => item.minStock && item.quantity <= item.minStock
    ).length;

    const outOfStock = items.filter((item) => item.quantity === 0).length;

    const byType = items.reduce((acc: any, item) => {
      acc[item.type] = (acc[item.type] || 0) + 1;
      return acc;
    }, {});

    return {
      totalItems,
      totalQuantity,
      totalValue,
      lowStock,
      outOfStock,
      byType,
    };
  },
});

// ============================================
// MUTATIONS
// ============================================

// ✅ إنشاء صنف جديد
export const createItem = mutation({
  args: {
    name: v.string(),
    type: v.union(
      v.literal("books"),
      v.literal("stationery"),
      v.literal("electronics"),
      v.literal("uniforms"),
      v.literal("supplies"),
      v.literal("other")
    ),
    description: v.optional(v.string()),
    unit: v.union(
      v.literal("piece"),
      v.literal("kg"),
      v.literal("meter"),
      v.literal("box"),
      v.literal("liter"),
      v.literal("other")
    ),
    purchasePrice: v.number(),
    sellingPrice: v.number(),
    quantity: v.number(),
    minStock: v.optional(v.number()),
    gradeId: v.optional(v.id("grades")),
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

    const code = await generateItemCode(ctx);

    // حساب التكاليف
    const totalCost = args.purchasePrice * args.quantity;
    const avgCost = calculateAvgCost(totalCost, args.quantity);

    const itemId = await ctx.db.insert("storeItems", {
      code,
      name: args.name,
      type: args.type,
      description: args.description,
      unit: args.unit,
      purchasePrice: args.purchasePrice,
      sellingPrice: args.sellingPrice,
      quantity: args.quantity,
      minStock: args.minStock,
      gradeId: args.gradeId,
      status: args.quantity > 0 ? "active" : "out_of_stock",
      totalCost,
      avgCost,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // ✅ تسجيل معاملة شراء أولية
    if (args.quantity > 0) {
      await ctx.db.insert("storeTransactions", {
        itemId,
        type: "purchase",
        quantity: args.quantity,
        unitPrice: args.purchasePrice,
        totalPrice: args.purchasePrice * args.quantity,
        notes: "شراء أولي",
        createdBy: user._id,
        createdAt: Date.now(),
      });
    }

    return { success: true, itemId, code };
  },
});

// ✅ تحديث صنف
export const updateItem = mutation({
  args: {
    itemId: v.id("storeItems"),
    name: v.optional(v.string()),
    type: v.optional(
      v.union(
        v.literal("books"),
        v.literal("stationery"),
        v.literal("electronics"),
        v.literal("uniforms"),
        v.literal("supplies"),
        v.literal("other")
      )
    ),
    description: v.optional(v.string()),
    unit: v.optional(
      v.union(
        v.literal("piece"),
        v.literal("kg"),
        v.literal("meter"),
        v.literal("box"),
        v.literal("liter"),
        v.literal("other")
      )
    ),
    sellingPrice: v.optional(v.number()),
    minStock: v.optional(v.number()),
    gradeId: v.optional(v.id("grades")),
    status: v.optional(
      v.union(
        v.literal("active"),
        v.literal("inactive"),
        v.literal("out_of_stock")
      )
    ),
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

    const item = await ctx.db.get(args.itemId);
    if (!item) throw new Error("الصنف غير موجود");

    const updateData: any = { updatedAt: Date.now() };
    if (args.name !== undefined) updateData.name = args.name;
    if (args.type !== undefined) updateData.type = args.type;
    if (args.description !== undefined) updateData.description = args.description;
    if (args.unit !== undefined) updateData.unit = args.unit;
    if (args.sellingPrice !== undefined) updateData.sellingPrice = args.sellingPrice;
    if (args.minStock !== undefined) updateData.minStock = args.minStock;
    if (args.gradeId !== undefined) updateData.gradeId = args.gradeId;
    if (args.status !== undefined) updateData.status = args.status;

    await ctx.db.patch(args.itemId, updateData);

    return { success: true };
  },
});

// ✅ إضافة مشتريات (زيادة الكمية)
export const addPurchase = mutation({
  args: {
    itemId: v.id("storeItems"),
    quantity: v.number(),
    unitPrice: v.number(),
    notes: v.optional(v.string()),
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

    const item = await ctx.db.get(args.itemId);
    if (!item) throw new Error("الصنف غير موجود");

    // حساب التكاليف الجديدة
    const newTotalCost = item.totalCost + args.unitPrice * args.quantity;
    const newQuantity = item.quantity + args.quantity;
    const newAvgCost = calculateAvgCost(newTotalCost, newQuantity);

    // تحديث الصنف
    await ctx.db.patch(args.itemId, {
      quantity: newQuantity,
      totalCost: newTotalCost,
      avgCost: newAvgCost,
      purchasePrice: args.unitPrice,
      status: newQuantity > 0 ? "active" : "out_of_stock",
      updatedAt: Date.now(),
    });

    // تسجيل المعاملة
    await ctx.db.insert("storeTransactions", {
      itemId: args.itemId,
      type: "purchase",
      quantity: args.quantity,
      unitPrice: args.unitPrice,
      totalPrice: args.unitPrice * args.quantity,
      notes: args.notes || "إضافة مشتريات",
      createdBy: user._id,
      createdAt: Date.now(),
    });

    return { success: true };
  },
});

// ✅ سحب من المخزون (بيع أو استخدام)
export const removeFromStock = mutation({
  args: {
    itemId: v.id("storeItems"),
    quantity: v.number(),
    notes: v.optional(v.string()),
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

    const item = await ctx.db.get(args.itemId);
    if (!item) throw new Error("الصنف غير موجود");

    if (item.quantity < args.quantity) {
      throw new Error("الكمية غير متوفرة في المخزون");
    }

    const newQuantity = item.quantity - args.quantity;

    // تحديث الصنف
    await ctx.db.patch(args.itemId, {
      quantity: newQuantity,
      status: newQuantity > 0 ? "active" : "out_of_stock",
      updatedAt: Date.now(),
    });

    // تسجيل المعاملة
    await ctx.db.insert("storeTransactions", {
      itemId: args.itemId,
      type: "sale",
      quantity: -args.quantity,
      unitPrice: item.avgCost,
      totalPrice: -item.avgCost * args.quantity,
      notes: args.notes || "سحب من المخزون",
      createdBy: user._id,
      createdAt: Date.now(),
    });

    return { success: true };
  },
});

// ✅ حذف صنف
export const deleteItem = mutation({
  args: { itemId: v.id("storeItems") },
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

    const item = await ctx.db.get(args.itemId);
    if (!item) throw new Error("الصنف غير موجود");

    if (item.quantity > 0) {
      throw new Error("لا يمكن حذف صنف يحتوي على كمية في المخزون");
    }

    await ctx.db.delete(args.itemId);

    return { success: true };
  },
});

export const storeItems = {
  getItems,
  getItemById,
  getInventoryStats,
  createItem,
  updateItem,
  addPurchase,
  removeFromStock,
  deleteItem,
};