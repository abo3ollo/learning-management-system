// convex/treasury/treasury.ts

import { v } from "convex/values";
import { mutation, query } from "../_generated/server";

// ── Helper: توليد رقم سند ──────────────────────────────────────
async function generateVoucherNumber(ctx: any, prefix: string): Promise<string> {
  const now = new Date();
  const year = now.getFullYear().toString().slice(2);
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const dateStr = `${year}${month}${day}`;

  // جلب آخر رقم مستخدم اليوم
  const existing = await ctx.db
    .query(prefix === "R" ? "receiptVouchers" : "paymentVouchers")
    .filter((q: any) => q.eq(q.field("voucherNumber"), `${prefix}${dateStr}`))
    .collect();

  const count = existing.length + 1;
  const serial = String(count).padStart(4, '0');

  return `${prefix}${dateStr}${serial}`;
}

// ── سندات القبض ──────────────────────────────────────────────────

// ✅ إنشاء سند قبض
export const createReceiptVoucher = mutation({
  args: {
    recipientId: v.id("users"),
    recipientName: v.string(),
    amount: v.number(),
    currency: v.string(),
    notes: v.optional(v.string()),
    date: v.number(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("غير مصرح");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) throw new Error("المستخدم غير موجود");

    // توليد رقم سند
    const voucherNumber = await generateVoucherNumber(ctx, "R");

    const voucherId = await ctx.db.insert("receiptVouchers", {
      voucherNumber,
      recipientId: args.recipientId,
      recipientName: args.recipientName,
      amount: args.amount,
      currency: args.currency || "EGP",
      notes: args.notes,
      date: args.date || Date.now(),
      createdBy: user._id,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // تسجيل في سجل التدقيق
    await ctx.db.insert("auditLogs", {
      userId: user._id,
      action: "CREATE_RECEIPT_VOUCHER",
      resourceType: "receiptVoucher",
      resourceId: voucherId,
      details: {
        
        
        
        createdBy: user.email,
      },
      createdAt: Date.now(),
    });

    return { success: true, voucherId, voucherNumber };
  },
});

// ✅ جلب جميع سندات القبض
export const getReceiptVouchers = query({
  args: {
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    recipientId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("غير مصرح");

    let vouchers = await ctx.db
      .query("receiptVouchers")
      .order("desc")
      .collect();

    if (args.startDate) {
      vouchers = vouchers.filter((v) => v.date >= args.startDate!);
    }
    if (args.endDate) {
      vouchers = vouchers.filter((v) => v.date <= args.endDate!);
    }
    if (args.recipientId) {
      vouchers = vouchers.filter((v) => v.recipientId === args.recipientId);
    }

    return vouchers;
  },
});

// ✅ تحديث سند قبض
export const updateReceiptVoucher = mutation({
  args: {
    voucherId: v.id("receiptVouchers"),
    recipientId: v.optional(v.id("users")),
    recipientName: v.optional(v.string()),
    amount: v.optional(v.number()),
    currency: v.optional(v.string()),
    notes: v.optional(v.string()),
    date: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("غير مصرح");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) throw new Error("المستخدم غير موجود");

    const voucher = await ctx.db.get(args.voucherId);
    if (!voucher) throw new Error("السند غير موجود");

    const updateData: any = { updatedAt: Date.now() };
    if (args.recipientId !== undefined) updateData.recipientId = args.recipientId;
    if (args.recipientName !== undefined) updateData.recipientName = args.recipientName;
    if (args.amount !== undefined) updateData.amount = args.amount;
    if (args.currency !== undefined) updateData.currency = args.currency;
    if (args.notes !== undefined) updateData.notes = args.notes;
    if (args.date !== undefined) updateData.date = args.date;

    await ctx.db.patch(args.voucherId, updateData);

    return { success: true };
  },
});

// ✅ حذف سند قبض
export const deleteReceiptVoucher = mutation({
  args: {
    voucherId: v.id("receiptVouchers"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("غير مصرح");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) throw new Error("المستخدم غير موجود");

    await ctx.db.delete(args.voucherId);
    return { success: true };
  },
});

// ── سندات الصرف ──────────────────────────────────────────────────

// ✅ إنشاء سند صرف
export const createPaymentVoucher = mutation({
  args: {
    payeeId: v.id("users"),
    payeeName: v.string(),
    amount: v.number(),
    currency: v.string(),
    notes: v.optional(v.string()),
    date: v.number(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("غير مصرح");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) throw new Error("المستخدم غير موجود");

    const voucherNumber = await generateVoucherNumber(ctx, "P");

    const voucherId = await ctx.db.insert("paymentVouchers", {
      voucherNumber,
      payeeId: args.payeeId,
      payeeName: args.payeeName,
      amount: args.amount,
      currency: args.currency || "EGP",
      notes: args.notes,
      date: args.date || Date.now(),
      createdBy: user._id,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    await ctx.db.insert("auditLogs", {
      userId: user._id,
      action: "CREATE_PAYMENT_VOUCHER",
      resourceType: "paymentVoucher",
      resourceId: voucherId,
      details: {
        createdBy: user.email,
      },
      createdAt: Date.now(),
    });

    return { success: true, voucherId, voucherNumber };
  },
});

// ✅ جلب جميع سندات الصرف
export const getPaymentVouchers = query({
  args: {
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    payeeId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("غير مصرح");

    let vouchers = await ctx.db
      .query("paymentVouchers")
      .order("desc")
      .collect();

    if (args.startDate) {
      vouchers = vouchers.filter((v) => v.date >= args.startDate!);
    }
    if (args.endDate) {
      vouchers = vouchers.filter((v) => v.date <= args.endDate!);
    }
    if (args.payeeId) {
      vouchers = vouchers.filter((v) => v.payeeId === args.payeeId);
    }

    return vouchers;
  },
});

// ✅ تحديث سند صرف
export const updatePaymentVoucher = mutation({
  args: {
    voucherId: v.id("paymentVouchers"),
    payeeId: v.optional(v.id("users")),
    payeeName: v.optional(v.string()),
    amount: v.optional(v.number()),
    currency: v.optional(v.string()),
    notes: v.optional(v.string()),
    date: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("غير مصرح");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) throw new Error("المستخدم غير موجود");

    const voucher = await ctx.db.get(args.voucherId);
    if (!voucher) throw new Error("السند غير موجود");

    const updateData: any = { updatedAt: Date.now() };
    if (args.payeeId !== undefined) updateData.payeeId = args.payeeId;
    if (args.payeeName !== undefined) updateData.payeeName = args.payeeName;
    if (args.amount !== undefined) updateData.amount = args.amount;
    if (args.currency !== undefined) updateData.currency = args.currency;
    if (args.notes !== undefined) updateData.notes = args.notes;
    if (args.date !== undefined) updateData.date = args.date;

    await ctx.db.patch(args.voucherId, updateData);

    return { success: true };
  },
});

// ✅ حذف سند صرف
export const deletePaymentVoucher = mutation({
  args: {
    voucherId: v.id("paymentVouchers"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("غير مصرح");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) throw new Error("المستخدم غير موجود");

    await ctx.db.delete(args.voucherId);
    return { success: true };
  },
});

// ── كشف حساب الخزينة ────────────────────────────────────────────

// ✅ جلب كشف حساب الخزينة (موحد)
export const getTreasuryStatement = query({
  args: {
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("غير مصرح");

    // جلب جميع سندات القبض
    let receiptVouchers = await ctx.db
      .query("receiptVouchers")
      .order("asc")
      .collect();

    // جلب جميع سندات الصرف
    let paymentVouchers = await ctx.db
      .query("paymentVouchers")
      .order("asc")
      .collect();

    // فلترة حسب التاريخ
    if (args.startDate) {
      receiptVouchers = receiptVouchers.filter((v) => v.date >= args.startDate!);
      paymentVouchers = paymentVouchers.filter((v) => v.date >= args.startDate!);
    }
    if (args.endDate) {
      receiptVouchers = receiptVouchers.filter((v) => v.date <= args.endDate!);
      paymentVouchers = paymentVouchers.filter((v) => v.date <= args.endDate!);
    }

    // دمج السندات في كشف حساب واحد
    const statement: any[] = [];

    // إضافة سندات القبض
    receiptVouchers.forEach((v) => {
      statement.push({
        type: "receipt",
        voucherNumber: v.voucherNumber,
        date: v.date,
        amount: v.amount,
        incoming: v.amount, // وارد
        outgoing: 0, // صادر
        balance: 0, // سيتم حسابه لاحقاً
        recipientName: v.recipientName,
        notes: v.notes || "",
        voucherId: v._id,
      });
    });

    // إضافة سندات الصرف
    paymentVouchers.forEach((v) => {
      statement.push({
        type: "payment",
        voucherNumber: v.voucherNumber,
        date: v.date,
        amount: v.amount,
        incoming: 0,
        outgoing: v.amount,
        balance: 0,
        payeeName: v.payeeName,
        notes: v.notes || "",
        voucherId: v._id,
      });
    });

    // ترتيب حسب التاريخ
    statement.sort((a, b) => a.date - b.date);

    // حساب الرصيد التراكمي
    let runningBalance = 0;
    statement.forEach((item) => {
      runningBalance += item.incoming - item.outgoing;
      item.balance = runningBalance;
    });

    // حساب الإجماليات
    const totals = {
      totalIncoming: statement.reduce((sum, item) => sum + item.incoming, 0),
      totalOutgoing: statement.reduce((sum, item) => sum + item.outgoing, 0),
      balance: runningBalance,
    };

    return {
      statement,
      totals,
    };
  },
});

// ✅ إحصائيات الخزينة
export const getTreasuryStats = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("غير مصرح");

    const receiptVouchers = await ctx.db.query("receiptVouchers").collect();
    const paymentVouchers = await ctx.db.query("paymentVouchers").collect();

    const totalReceipts = receiptVouchers.reduce((sum, v) => sum + v.amount, 0);
    const totalPayments = paymentVouchers.reduce((sum, v) => sum + v.amount, 0);

    return {
      totalReceipts,
      totalPayments,
      balance: totalReceipts - totalPayments,
      receiptCount: receiptVouchers.length,
      paymentCount: paymentVouchers.length,
    };
  },
});

// تصدير الدوال
export const treasury = {
  // Receipt Vouchers
  createReceiptVoucher,
  getReceiptVouchers,
  updateReceiptVoucher,
  deleteReceiptVoucher,
  // Payment Vouchers
  createPaymentVoucher,
  getPaymentVouchers,
  updatePaymentVoucher,
  deletePaymentVoucher,
  // Treasury Statement
  getTreasuryStatement,
  getTreasuryStats,
};