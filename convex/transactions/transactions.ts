import { v } from "convex/values";
import { mutation, query } from "../_generated/server";

// ── إنشاء معاملة جديدة ──────────────────────────────────────────
export const createTransaction = mutation({
  args: {
    studentId: v.id("users"),
    parentId: v.optional(v.id("users")),
    type: v.union(
      v.literal("platform"),
      v.literal("aptitude"),
      v.literal("purchase")
    ),
    category: v.string(),
    amount: v.number(),
    currency: v.string(),
    status: v.union(
      v.literal("pending"),
      v.literal("completed"),
      v.literal("refunded"),
      v.literal("failed")
    ),
    referenceId: v.string(),
    referenceType: v.string(),
    description: v.string(),
    descriptionAr: v.string(),
    paymentProof: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("غير مصرح");

    const student = await ctx.db.get(args.studentId);
    if (!student) throw new Error("الطالب غير موجود");

    const transactionId = await ctx.db.insert("transactions", {
      ...args,
      createdAt: Date.now(),
    });

    return { success: true, transactionId };
  },
});

// ── جلب معاملات طالب معين ──────────────────────────────────────
export const getStudentTransactions = query({
  args: {
    studentId: v.id("users"),
    type: v.optional(v.union(
      v.literal("platform"),
      v.literal("aptitude"),
      v.literal("purchase")
    )),
    status: v.optional(v.union(
      v.literal("pending"),
      v.literal("completed"),
      v.literal("refunded"),
      v.literal("failed")
    )),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("غير مصرح");

    let transactions = await ctx.db
      .query("transactions")
      .withIndex("by_student", (q) => q.eq("studentId", args.studentId))
      .order("desc")
      .collect();

    if (args.type) {
      transactions = transactions.filter((t) => t.type === args.type);
    }

    if (args.status) {
      transactions = transactions.filter((t) => t.status === args.status);
    }

    if (args.startDate) {
      transactions = transactions.filter((t) => t.createdAt >= args.startDate!);
    }

    if (args.endDate) {
      transactions = transactions.filter((t) => t.createdAt <= args.endDate!);
    }

    const student = await ctx.db.get(args.studentId);

    return transactions.map((t) => ({
      ...t,
      studentName: student?.name || "غير معروف",
      studentEmail: student?.email || "",
    }));
  },
});

// ✅ جلب معاملات حسب المسار
export const getTransactionsByTrack = query({
  args: {
    studentId: v.id("users"),
    track: v.union(
      v.literal("platform"),
      v.literal("aptitude"),
      v.literal("academic")
    ),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("غير مصرح");

    const transactions = await ctx.db
      .query("transactions")
      .withIndex("by_student", (q) => q.eq("studentId", args.studentId))
      .collect();

    // فلترة حسب نوع المعاملة
    return transactions.filter((t) => {
      if (args.track === "platform") return t.type === "platform";
      if (args.track === "aptitude") return t.type === "aptitude";
      if (args.track === "academic") return t.category === "academic";
      return false;
    });
  },
});

// ── جلب جميع المعاملات (للأدمن) ──────────────────────────────
export const getAllTransactions = query({
  args: {
    type: v.optional(v.union(
      v.literal("platform"),
      v.literal("aptitude"),
      v.literal("purchase")
    )),
    status: v.optional(v.union(
      v.literal("pending"),
      v.literal("completed"),
      v.literal("refunded"),
      v.literal("failed")
    )),
    searchQuery: v.optional(v.string()),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("غير مصرح");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user || user.role !== "admin") {
      throw new Error("غير مصرح: فقط الأدمن يمكنه الوصول");
    }

    let transactions = await ctx.db
      .query("transactions")
      .order("desc")
      .collect();

    if (args.type) {
      transactions = transactions.filter((t) => t.type === args.type);
    }

    if (args.status) {
      transactions = transactions.filter((t) => t.status === args.status);
    }

    if (args.searchQuery) {
      const search = args.searchQuery.toLowerCase();
      transactions = transactions.filter((t) => {
        return t.description.toLowerCase().includes(search) ||
               t.descriptionAr.includes(search);
      });
    }

    if (args.startDate) {
      transactions = transactions.filter((t) => t.createdAt >= args.startDate!);
    }

    if (args.endDate) {
      transactions = transactions.filter((t) => t.createdAt <= args.endDate!);
    }

    if (args.limit) {
      transactions = transactions.slice(0, args.limit);
    }

    const transactionsWithStudents = await Promise.all(
      transactions.map(async (t) => {
        const student = await ctx.db.get(t.studentId);
        const parent = t.parentId ? await ctx.db.get(t.parentId) : null;
        return {
          ...t,
          studentName: student?.name || "غير معروف",
          studentEmail: student?.email || "",
          parentName: parent?.name || null,
        };
      })
    );

    return transactionsWithStudents;
  },
});

// ── تحديث حالة المعاملة ──────────────────────────────────────
export const updateTransactionStatus = mutation({
  args: {
    transactionId: v.id("transactions"),
    status: v.union(
      v.literal("pending"),
      v.literal("completed"),
      v.literal("refunded"),
      v.literal("failed")
    ),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("غير مصرح");

    const transaction = await ctx.db.get(args.transactionId);
    if (!transaction) throw new Error("المعاملة غير موجودة");

    await ctx.db.patch(args.transactionId, {
      status: args.status,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

// ── إحصائيات المعاملات ──────────────────────────────────────
export const getTransactionStats = query({
  args: {
    studentId: v.optional(v.id("users")),
    parentId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("غير مصرح");

    let transactions: any[] = [];

    if (args.studentId) {
      transactions = await ctx.db
        .query("transactions")
        .withIndex("by_student", (q) => q.eq("studentId", args.studentId!))
        .collect();
    } else if (args.parentId) {
      transactions = await ctx.db
        .query("transactions")
        .withIndex("by_parent", (q) => q.eq("parentId", args.parentId!))
        .collect();
    } else {
      transactions = await ctx.db.query("transactions").collect();
    }

    const stats = {
      totalAmount: 0,
      totalCount: transactions.length,
      completedCount: 0,
      pendingCount: 0,
      refundedCount: 0,
      failedCount: 0,
      platformTotal: 0,
      aptitudeTotal: 0,
      purchaseTotal: 0,
    };

    for (const t of transactions) {
      stats.totalAmount += t.amount || 0;

      switch (t.status) {
        case "completed":
          stats.completedCount++;
          break;
        case "pending":
          stats.pendingCount++;
          break;
        case "refunded":
          stats.refundedCount++;
          break;
        case "failed":
          stats.failedCount++;
          break;
      }

      switch (t.type) {
        case "platform":
          stats.platformTotal += t.amount || 0;
          break;
        case "aptitude":
          stats.aptitudeTotal += t.amount || 0;
          break;
        case "purchase":
          stats.purchaseTotal += t.amount || 0;
          break;
      }
    }

    return stats;
  },
});

// ── جلب معاملات أبناء ولي الأمر ──────────────────────────────
export const getChildrenTransactions = query({
  args: {
    parentId: v.id("users"),
    childId: v.optional(v.id("users")),
    type: v.optional(v.union(
      v.literal("platform"),
      v.literal("aptitude"),
      v.literal("purchase")
    )),
    status: v.optional(v.union(
      v.literal("pending"),
      v.literal("completed"),
      v.literal("refunded"),
      v.literal("failed")
    )),
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

    if (!user) throw new Error("المستخدم غير موجود");

    // ✅ تأكد أن المستخدم هو ولي الأمر أو أدمن
    if (user.role !== "parent" && user.role !== "admin") {
      throw new Error("غير مصرح: فقط ولي الأمر أو الأدمن يمكنه الوصول");
    }

    // ✅ لو المستخدم ولي أمر، تأكد أن parentId هو نفسه
    if (user.role === "parent" && user._id !== args.parentId) {
      throw new Error("غير مصرح: يمكنك فقط رؤية معاملات أبنائك");
    }

    // ✅ جلب المعاملات
    let transactions = await ctx.db
      .query("transactions")
      .withIndex("by_parent", (q) => q.eq("parentId", args.parentId))
      .order("desc")
      .collect();

    // ✅ فلترة حسب الابن المحدد
    if (args.childId) {
      transactions = transactions.filter((t) => t.studentId === args.childId);
    }

    // ✅ فلترة حسب النوع
    if (args.type) {
      transactions = transactions.filter((t) => t.type === args.type);
    }

    // ✅ فلترة حسب الحالة
    if (args.status) {
      transactions = transactions.filter((t) => t.status === args.status);
    }

    // ✅ فلترة حسب التاريخ
    if (args.startDate) {
      transactions = transactions.filter((t) => t.createdAt >= args.startDate!);
    }

    if (args.endDate) {
      transactions = transactions.filter((t) => t.createdAt <= args.endDate!);
    }

    // ✅ جلب بيانات الطلاب
    const transactionsWithStudents = await Promise.all(
      transactions.map(async (t) => {
        const student = await ctx.db.get(t.studentId);
        return {
          ...t,
          studentName: student?.name || "غير معروف",
          studentEmail: student?.email || "",
          studentGrade: student?.grade || "غير محدد",
        };
      })
    );

    return transactionsWithStudents;
  },
});



// ✅ جلب معاملات الطالب مع إحصائيات مفصلة
export const getStudentTransactionsWithDetails = query({
  args: {
    studentId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("غير مصرح");

    const transactions = await ctx.db
      .query("transactions")
      .withIndex("by_student", (q) => q.eq("studentId", args.studentId))
      .order("desc")
      .collect();

    // جلب بيانات إضافية لكل معاملة
    const transactionsWithDetails = await Promise.all(
      transactions.map(async (t) => {
        const student = await ctx.db.get(t.studentId);
        return {
          ...t,
          studentName: student?.name || "غير معروف",
          studentEmail: student?.email || "",
        };
      })
    );

    return transactionsWithDetails;
  },
});



// ✅ جلب إحصائيات الطالب
export const getStudentStats = query({
  args: {
    studentId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("غير مصرح");

    const transactions = await ctx.db
      .query("transactions")
      .withIndex("by_student", (q) => q.eq("studentId", args.studentId))
      .collect();

    const stats = {
      totalAmount: 0,
      totalCount: transactions.length,
      completedCount: 0,
      pendingCount: 0,
      refundedCount: 0,
      failedCount: 0,
      platformTotal: 0,
      aptitudeTotal: 0,
      purchaseTotal: 0,
    };

    for (const t of transactions) {
      stats.totalAmount += t.amount || 0;

      switch (t.status) {
        case "completed":
          stats.completedCount++;
          break;
        case "pending":
          stats.pendingCount++;
          break;
        case "refunded":
          stats.refundedCount++;
          break;
        case "failed":
          stats.failedCount++;
          break;
      }

      switch (t.type) {
        case "platform":
          stats.platformTotal += t.amount || 0;
          break;
        case "aptitude":
          stats.aptitudeTotal += t.amount || 0;
          break;
        case "purchase":
          stats.purchaseTotal += t.amount || 0;
          break;
      }
    }

    return stats;
  },
});

