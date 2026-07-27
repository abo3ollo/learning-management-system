// convex/store/transactions.ts

import { v } from "convex/values";
import { mutation, query } from "../_generated/server";
import { Id } from "../_generated/dataModel";

// ✅ جلب معاملات صنف معين
export const getItemTransactions = query({
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

    const transactions = await ctx.db
      .query("storeTransactions")
      .withIndex("by_item", (q) => q.eq("itemId", args.itemId))
      .collect();

    const transactionsWithUser = await Promise.all(
      transactions.map(async (t) => {
        const creator = await ctx.db.get(t.createdBy);
        return {
          ...t,
          createdByName: creator?.name || "غير معروف",
        };
      })
    );

    return transactionsWithUser.sort((a, b) => b.createdAt - a.createdAt);
  },
});

// ✅ جلب جميع المعاملات (مع فلتر)
export const getAllTransactions = query({
  args: {
    type: v.optional(
      v.union(
        v.literal("purchase"),
        v.literal("sale"),
        v.literal("adjustment"),
        v.literal("return")
      )
    ),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
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

    let transactions = await ctx.db.query("storeTransactions").collect();

    if (args.type) {
      transactions = transactions.filter((t) => t.type === args.type);
    }

    if (args.startDate) {
      transactions = transactions.filter((t) => t.createdAt >= args.startDate!);
    }

    if (args.endDate) {
      transactions = transactions.filter((t) => t.createdAt <= args.endDate!);
    }

    const transactionsWithDetails = await Promise.all(
      transactions.map(async (t) => {
        const item = await ctx.db.get(t.itemId);
        const creator = await ctx.db.get(t.createdBy);

        return {
          ...t,
          itemName: item?.name || "صنف غير معروف",
          itemCode: item?.code || "---",
          createdByName: creator?.name || "غير معروف",
        };
      })
    );

    return transactionsWithDetails.sort((a, b) => b.createdAt - a.createdAt);
  },
});

export const storeTransactions = {
  getItemTransactions,
  getAllTransactions,
};