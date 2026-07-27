// convex/store/reports.ts

import { v } from "convex/values";
import { mutation, query } from "../_generated/server";
import { Id } from "../_generated/dataModel";

// ✅ تقرير المخزون الكامل
export const getInventoryReport = query({
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

    const report = {
      generatedAt: Date.now(),
      generatedBy: user.name || "مشرف",
      summary: {
        totalItems: items.length,
        totalQuantity: items.reduce((sum, i) => sum + i.quantity, 0),
        totalValue: items.reduce((sum, i) => sum + i.avgCost * i.quantity, 0),
        lowStock: items.filter((i) => i.minStock && i.quantity <= i.minStock)
          .length,
        outOfStock: items.filter((i) => i.quantity === 0).length,
      },
      items: items.map((item) => ({
        code: item.code,
        name: item.name,
        type: item.type,
        quantity: item.quantity,
        avgCost: item.avgCost,
        totalCost: item.totalCost,
        stockValue: item.avgCost * item.quantity,
        status: item.status,
      })),
    };

    return report;
  },
});

// ✅ تقرير حركة المخزون
export const getMovementReport = query({
  args: {
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

    if (args.startDate) {
      transactions = transactions.filter((t) => t.createdAt >= args.startDate!);
    }

    if (args.endDate) {
      transactions = transactions.filter((t) => t.createdAt <= args.endDate!);
    }

    const report = {
      generatedAt: Date.now(),
      generatedBy: user.name || "مشرف",
      period: {
        startDate: args.startDate,
        endDate: args.endDate,
      },
      summary: {
        totalPurchases: transactions
          .filter((t) => t.type === "purchase")
          .reduce((sum, t) => sum + t.totalPrice, 0),
        totalSales: transactions
          .filter((t) => t.type === "sale")
          .reduce((sum, t) => sum + Math.abs(t.totalPrice), 0),
        totalTransactions: transactions.length,
        purchaseCount: transactions.filter((t) => t.type === "purchase").length,
        saleCount: transactions.filter((t) => t.type === "sale").length,
      },
      transactions: await Promise.all(
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
      ),
    };

    return report;
  },
});

export const storeReports = {
  getInventoryReport,
  getMovementReport,
};