import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// ── إنشاء فاتورة جديدة ──────────────────────────────────────
export const create = mutation({
  args: {
    warehouseId: v.id("warehouses"),
    date: v.number(),
    notes: v.optional(v.string()),
    items: v.array(
      v.object({
        itemId: v.id("items"),
        quantity: v.number(),
        purchasePrice: v.number(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("غير مصرح");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) throw new Error("المستخدم غير موجود");

    // حساب الإجمالي
    let totalAmount = 0;
    const invoiceItems = args.items.map((item) => {
      const total = item.quantity * item.purchasePrice;
      totalAmount += total;
      return {
        ...item,
        totalPrice: total,
      };
    });

    // إنشاء رقم فاتورة فريد
    const invoiceCount = await ctx.db.query("invoices").collect();
    const invoiceNumber = `INV-${String(invoiceCount.length + 1).padStart(5, "0")}`;

    // إنشاء الفاتورة
    const invoiceId = await ctx.db.insert("invoices", {
      invoiceNumber,
      date: args.date,
      warehouseId: args.warehouseId,
      createdBy: user._id,
      totalAmount,
      status: "saved",
      notes: args.notes,
    });

    // إنشاء تفاصيل الفاتورة
    for (const item of invoiceItems) {
      await ctx.db.insert("invoiceItems", {
        invoiceId,
        ...item,
      });
    }

    return { invoiceId, invoiceNumber };
  },
});

// ── جلب جميع الفواتير ──────────────────────────────────────
export const getAll = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("غير مصرح");

    const invoices = await ctx.db
      .query("invoices")
      .withIndex("by_status", (q) => q.eq("status", "saved"))
      .order("desc")
      .collect();

    // جلب بيانات المخزن لكل فاتورة
    const invoicesWithWarehouse = await Promise.all(
      invoices.map(async (invoice) => {
        const warehouse = await ctx.db.get(invoice.warehouseId);
        return {
          ...invoice,
          warehouseName: warehouse?.name || "",
        };
      })
    );

    return invoicesWithWarehouse;
  },
});

// ── جلب تفاصيل فاتورة معينة ──────────────────────────────
export const getInvoiceDetails = query({
  args: {
    invoiceId: v.id("invoices"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("غير مصرح");

    const invoice = await ctx.db.get(args.invoiceId);
    if (!invoice) throw new Error("الفاتورة غير موجودة");

    // جلب تفاصيل الفاتورة
    const invoiceItems = await ctx.db
      .query("invoiceItems")
      .withIndex("by_invoiceId", (q) => q.eq("invoiceId", args.invoiceId))
      .collect();

    // جلب بيانات الأصناف
    const itemsWithDetails = await Promise.all(
      invoiceItems.map(async (item) => {
        const itemData = await ctx.db.get(item.itemId);
        return {
          ...item,
          itemName: itemData?.name || "",
          itemCode: itemData?.code || "",
        };
      })
    );

    // جلب بيانات المخزن
    const warehouse = await ctx.db.get(invoice.warehouseId);

    return {
      ...invoice,
      warehouseName: warehouse?.name || "",
      items: itemsWithDetails,
    };
  },
});

// ── تحديث فاتورة ──────────────────────────────────────────────
export const update = mutation({
  args: {
    invoiceId: v.id("invoices"),
    date: v.optional(v.number()),
    notes: v.optional(v.string()),
    items: v.optional(
      v.array(
        v.object({
          itemId: v.id("items"),
          quantity: v.number(),
          purchasePrice: v.number(),
        })
      )
    ),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("غير مصرح");

    const invoice = await ctx.db.get(args.invoiceId);
    if (!invoice) throw new Error("الفاتورة غير موجودة");
    if (invoice.status === "cancelled") throw new Error("لا يمكن تعديل فاتورة ملغاة");

    // تحديث بيانات الفاتورة
    await ctx.db.patch(args.invoiceId, {
      date: args.date || invoice.date,
      notes: args.notes || invoice.notes,
    });

    // إذا تم إرسال أصناف جديدة، قم بتحديثها
    if (args.items) {
      // حذف الأصناف القديمة
      const oldItems = await ctx.db
        .query("invoiceItems")
        .withIndex("by_invoiceId", (q) => q.eq("invoiceId", args.invoiceId))
        .collect();

      for (const item of oldItems) {
        await ctx.db.delete(item._id);
      }

      // إضافة الأصناف الجديدة
      let totalAmount = 0;
      for (const item of args.items) {
        const total = item.quantity * item.purchasePrice;
        totalAmount += total;
        await ctx.db.insert("invoiceItems", {
          invoiceId: args.invoiceId,
          ...item,
          totalPrice: total,
        });
      }

      // تحديث الإجمالي
      await ctx.db.patch(args.invoiceId, {
        totalAmount,
      });
    }

    return args.invoiceId;
  },
});

// ── حذف فاتورة (إلغاء) ──────────────────────────────────────
export const remove = mutation({
  args: {
    invoiceId: v.id("invoices"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("غير مصرح");

    await ctx.db.patch(args.invoiceId, {
      status: "cancelled",
    });

    return args.invoiceId;
  },
});