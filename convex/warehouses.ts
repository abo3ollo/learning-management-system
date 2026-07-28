import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// ── إضافة مخزن ──────────────────────────────────────────────
export const create = mutation({
  args: {
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("غير مصرح");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) throw new Error("المستخدم غير موجود");

    const warehouseId = await ctx.db.insert("warehouses", {
      name: args.name,
      createdBy: user._id,
      isActive: true,
    });

    return warehouseId;
  },
});

// ── جلب جميع المخازن ──────────────────────────────────────
export const getAll = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("غير مصرح");

    return await ctx.db
      .query("warehouses")
      .withIndex("by_isActive", (q) => q.eq("isActive", true))
      .collect();
  },
});

// ── تحديث مخزن ──────────────────────────────────────────────
export const update = mutation({
  args: {
    id: v.id("warehouses"),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("غير مصرح");

    await ctx.db.patch(args.id, {
      name: args.name,
    });

    return args.id;
  },
});

// ── حذف مخزن (تعطيل) ──────────────────────────────────────
export const remove = mutation({
  args: {
    id: v.id("warehouses"),
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