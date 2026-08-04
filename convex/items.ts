import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const create = mutation({
  args: {
    code: v.string(),
    name: v.string(),
    purchasePrice: v.number(),
    sellingPrice: v.number(),
    averageCost: v.number(),
    unitId: v.id("units"),
    categoryId: v.id("categories"),
    warehouseId: v.id("warehouses"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("غير مصرح");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) throw new Error("المستخدم غير موجود");

    // التحقق من عدم تكرار الكود
    const existingItem = await ctx.db
      .query("items")
      .withIndex("by_code", (q) => q.eq("code", args.code))
      .first();

    if (existingItem) throw new Error("هذا الكود موجود بالفعل");

    const itemId = await ctx.db.insert("items", {
      ...args,
      createdBy: user._id,
      isActive: true,
    });

    return itemId;
  },
});

export const getAll = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("غير مصرح");

    const items = await ctx.db
      .query("items")
      .withIndex("by_isActive", (q) => q.eq("isActive", true))
      .collect();

    // جلب البيانات المرتبطة
    const itemsWithRelations = await Promise.all(
      items.map(async (item) => {
        const unit = await ctx.db.get(item.unitId);
        const category = await ctx.db.get(item.categoryId);
        const warehouse = await ctx.db.get(item.warehouseId);

        return {
          ...item,
          unitName: unit?.name || "",
          categoryName: category?.name || "",
          warehouseName: warehouse?.name || "",
        };
      })
    );

    return itemsWithRelations;
  },
});

export const update = mutation({
  args: {
    id: v.id("items"),
    code: v.string(),
    name: v.string(),
    purchasePrice: v.number(),
    sellingPrice: v.number(),
    averageCost: v.number(),
    unitId: v.id("units"),
    categoryId: v.id("categories"),
    warehouseId: v.id("warehouses"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("غير مصرح");

    // التحقق من عدم تكرار الكود (باستثناء نفس العنصر)
    const existingItem = await ctx.db
      .query("items")
      .withIndex("by_code", (q) => q.eq("code", args.code))
      .first();

    if (existingItem && existingItem._id !== args.id) {
      throw new Error("هذا الكود موجود بالفعل");
    }

    const { id, ...updateData } = args;
    await ctx.db.patch(id, updateData);

    return id;
  },
});

export const remove = mutation({
  args: {
    id: v.id("items"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("غير مصرح");

    await ctx.db.patch(args.id, {
      isActive: false,
    });

    return args.id;
  },
});

export const getByWarehouse = query({
  args: {
    warehouseId: v.id("warehouses"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("غير مصرح");

    const items = await ctx.db
      .query("items")
      .withIndex("by_warehouseId", (q) => q.eq("warehouseId", args.warehouseId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    const itemsWithRelations = await Promise.all(
      items.map(async (item) => {
        const unit = await ctx.db.get(item.unitId);
        const category = await ctx.db.get(item.categoryId);

        return {
          ...item,
          unitName: unit?.name || "",
          categoryName: category?.name || "",
        };
      })
    );

    return itemsWithRelations;
  },
});

// ── جلب الأصناف المتاحة للشراء للطلاب ──────────────────────
export const getAvailableForPurchase = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("غير مصرح");

    // جلب جميع الأصناف النشطة
    const items = await ctx.db
      .query("items")
      .withIndex("by_isActive", (q) => q.eq("isActive", true))
      .collect();

    // جلب البيانات المرتبطة
    const itemsWithDetails = await Promise.all(
      items.map(async (item) => {
        const unit = await ctx.db.get(item.unitId);
        const category = await ctx.db.get(item.categoryId);
        const warehouse = await ctx.db.get(item.warehouseId);

        return {
          ...item,
          unitName: unit?.name || "",
          categoryName: category?.name || "",
          warehouseName: warehouse?.name || "",
        };
      })
    );

    return itemsWithDetails;
  },
});

// ── إنشاء طلب شراء (Purchase Request) ──────────────────────
export const createPurchaseRequest = mutation({
  args: {
    itemId: v.id("items"),
    quantity: v.number(),
    totalPrice: v.number(),
    paymentProof: v.string(), // URL أو base64 للصورة
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("غير مصرح");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) throw new Error("المستخدم غير موجود");

    // جلب بيانات الصنف
    const item = await ctx.db.get(args.itemId);
    if (!item) throw new Error("الصنف غير موجود");

    // إنشاء طلب الشراء
    const purchaseId = await ctx.db.insert("purchases", {
      itemId: args.itemId,
      studentId: user._id,
      quantity: args.quantity,
      totalPrice: args.totalPrice,
      paymentProof: args.paymentProof,
      status: "pending",
      createdAt: Date.now(),
    });

    return purchaseId;
  },
});