// convex/admin/approvals.ts

import { v } from "convex/values";
import { mutation, query } from "../_generated/server";

// ✅ إنشاء طلب موافقة جديد + إنشاء دفعة
export const createApprovalRequest = mutation({
  args: {
    studentId: v.id("users"),
    gradeId: v.id("grades"),
    amount: v.number(),
    currency: v.string(),
    paymentProof: v.string(),
    referenceNumber: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("غير مصرح");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) throw new Error("المستخدم غير موجود");

    const isStudent = user._id === args.studentId;
    const isParent = user.role === "parent";

    if (!isStudent && !isParent) {
      throw new Error("غير مصرح بتقديم طلب");
    }

    const student = await ctx.db.get(args.studentId);
    if (!student || student.role !== "student") {
      throw new Error("الطالب غير موجود");
    }

    // ✅ جلب ولي الأمر (إذا كان المستخدم ولي أمر، استخدمه، وإلا جلب ولي أمر الطالب)
    let parentId = user._id;
    if (isStudent) {
      // ✅ إذا كان الطالب يدفع عن نفسه، جلب ولي أمره (إذا وجد)
      const parentLink = await ctx.db
        .query("parentStudentLinks")
        .withIndex("by_student", (q) => q.eq("studentId", args.studentId))
        .first();
      
      if (parentLink) {
        parentId = parentLink.parentId;
      } else {
        // ✅ إذا لم يكن هناك ولي أمر، استخدم الطالب نفسه كـ parentId
        parentId = args.studentId;
      }
    }

    // ✅ التحقق من عدم وجود طلب pending مسبقاً
    const existing = await ctx.db
      .query("approvalRequests")
      .withIndex("by_student", (q) => q.eq("studentId", args.studentId))
      .collect();

    const hasPending = existing.some((r) => r.status === "pending");
    if (hasPending) {
      throw new Error("يوجد طلب موافقة قيد الانتظار بالفعل");
    }

    // ✅ 1. إنشاء طلب الموافقة
    const requestId = await ctx.db.insert("approvalRequests", {
      userId: user._id,
      studentId: args.studentId,
      gradeId: args.gradeId,
      amount: args.amount,
      currency: args.currency,
      paymentProof: args.paymentProof,
      referenceNumber: args.referenceNumber,
      status: "pending",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // ✅ 2. إنشاء دفعة في جدول payments (لتظهر في لوحة ولي الأمر)
    const paymentId = await ctx.db.insert("payments", {
      parentId: parentId, // ✅ ولي الأمر أو الطالب نفسه
      studentId: args.studentId,
      amount: args.amount,
      currency: args.currency || "SAR",
      status: "pending", // ✅ pending حتى يتم الموافقة
      paymentMethod: "bank_transfer",
      description: `رسوم اشتراك - ${student.name}`,
      transactionId: args.referenceNumber,
      dueDate: Date.now() + 86400000 * 30, // ✅ 30 يوم من الآن
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // ✅ تحديث حالة المستخدم إلى awaiting_approval
    await ctx.db.patch(args.studentId, {
      subscriptionStatus: "awaiting_approval",
      updatedAt: Date.now(),
    });

    // ✅ إرسال إشعار للأدمن
    await ctx.db.insert("notifications", {
      title: "طلب اشتراك جديد",
      message: `الطالب ${student.name} يطلب الموافقة على الاشتراك`,
      type: "system_announcement",
      priority: "high",
      recipientType: "all_teachers",
      status: "sent",
      createdBy: user._id,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return { success: true, requestId, paymentId };
  },
});

// ✅ جلب طلبات الموافقة (للأدمن)
export const getApprovalRequests = query({
  args: {
    status: v.optional(v.union(
      v.literal("pending"),
      v.literal("approved"),
      v.literal("rejected"),
    )),
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

    let requests = await ctx.db
      .query("approvalRequests")
      .collect();

    if (args.status) {
      requests = requests.filter((r) => r.status === args.status);
    }

    const requestsWithDetails = await Promise.all(
      requests.map(async (req) => {
        const userData = await ctx.db.get(req.userId);
        const studentData = await ctx.db.get(req.studentId);
        const grade = await ctx.db.get(req.gradeId);

        return {
          ...req,
          userName: userData?.name || "غير معروف",
          userEmail: userData?.email || "",
          studentName: studentData?.name || "غير معروف",
          studentEmail: studentData?.email || "",
          gradeName: grade?.name || "غير محدد",
        };
      })
    );

    return requestsWithDetails.sort((a, b) => b.createdAt - a.createdAt);
  },
});

// ✅ جلب جميع طلبات الموافقة مع تفاصيل المستخدمين
export const listApprovalRequests = query({
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

    const requests = await ctx.db
      .query("approvalRequests")
      .collect();

    const requestsWithDetails = await Promise.all(
      requests.map(async (req) => {
        const userData = await ctx.db.get(req.userId);
        const studentData = await ctx.db.get(req.studentId);
        const grade = await ctx.db.get(req.gradeId);

        return {
          ...req,
          userName: userData?.name || "غير معروف",
          userEmail: userData?.email || "",
          userPhone: userData?.phoneNumber || "",
          studentName: studentData?.name || "غير معروف",
          studentEmail: studentData?.email || "",
          studentPhone: studentData?.phoneNumber || "",
          studentGrade: studentData?.grade || "",
          studentIdNumber: studentData?.studentId || "",
          gradeName: grade?.name || "غير محدد",
          userRole: userData?.role || "",
          studentRole: studentData?.role || "",
          studentStatus: studentData?.status || "",
          subscriptionStatus: studentData?.subscriptionStatus || "",
        };
      })
    );

    return requestsWithDetails.sort((a, b) => b.createdAt - a.createdAt);
  },
});


// ✅ الموافقة على الطلب - تحديث حالة الدفعة أيضاً
export const approveRequest = mutation({
  args: {
    requestId: v.id("approvalRequests"),
    adminNotes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("غير مصرح");

    const admin = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!admin || admin.role !== "admin") {
      throw new Error("مطلوب صلاحيات مشرف");
    }

    const request = await ctx.db.get(args.requestId);
    if (!request) throw new Error("الطلب غير موجود");

    if (request.status !== "pending") {
      throw new Error("تم معالجة هذا الطلب بالفعل");
    }

    // ✅ تحديث طلب الموافقة
    await ctx.db.patch(args.requestId, {
      status: "approved",
      adminNotes: args.adminNotes,
      reviewedBy: admin._id,
      reviewedAt: Date.now(),
      updatedAt: Date.now(),
    });

    // ✅ تحديث الدفعة المرتبطة إلى completed
    // البحث عن الدفعة المرتبطة بالطالب والمبلغ
    const payments = await ctx.db
      .query("payments")
      .withIndex("by_student", (q) => q.eq("studentId", request.studentId))
      .collect();

    // ✅ العثور على الدفعة المعلقة بنفس المبلغ
    const pendingPayment = payments.find(
      (p) => p.amount === request.amount && p.status === "pending"
    );

    if (pendingPayment) {
      await ctx.db.patch(pendingPayment._id, {
        status: "completed",
        paymentDate: Date.now(),
        updatedAt: Date.now(),
      });
    }

    // ✅ تحديث حالة المستخدم
    await ctx.db.patch(request.studentId, {
      subscriptionStatus: "active",
      status: "active",
      updatedAt: Date.now(),
    });

    // ✅ إرسال إشعار للطالب
    await ctx.db.insert("notifications", {
      title: "تم الموافقة على اشتراكك",
      message: `تم الموافقة على اشتراكك. يمكنك الآن الدخول إلى المنصة.`,
      type: "system_announcement",
      priority: "normal",
      recipientType: "student",
      recipientId: request.studentId,
      status: "sent",
      createdBy: admin._id,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});


// ✅ رفض الطلب - تحديث حالة الدفعة أيضاً
export const rejectRequest = mutation({
  args: {
    requestId: v.id("approvalRequests"),
    adminNotes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("غير مصرح");

    const admin = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!admin || admin.role !== "admin") {
      throw new Error("مطلوب صلاحيات مشرف");
    }

    const request = await ctx.db.get(args.requestId);
    if (!request) throw new Error("الطلب غير موجود");

    if (request.status !== "pending") {
      throw new Error("تم معالجة هذا الطلب بالفعل");
    }

    // ✅ تحديث طلب الموافقة
    await ctx.db.patch(args.requestId, {
      status: "rejected",
      adminNotes: args.adminNotes || "تم رفض الطلب",
      reviewedBy: admin._id,
      reviewedAt: Date.now(),
      updatedAt: Date.now(),
    });

    // ✅ تحديث الدفعة المرتبطة إلى failed
    const payments = await ctx.db
      .query("payments")
      .withIndex("by_student", (q) => q.eq("studentId", request.studentId))
      .collect();

    const pendingPayment = payments.find(
      (p) => p.amount === request.amount && p.status === "pending"
    );

    if (pendingPayment) {
      await ctx.db.patch(pendingPayment._id, {
        status: "failed",
        updatedAt: Date.now(),
      });
    }

    // ✅ تحديث حالة المستخدم
    await ctx.db.patch(request.studentId, {
      subscriptionStatus: "rejected",
      status: "inactive",
      updatedAt: Date.now(),
    });

    // ✅ إرسال إشعار للطالب
    await ctx.db.insert("notifications", {
      title: "تم رفض اشتراكك",
      message: args.adminNotes || "تم رفض طلب الاشتراك الخاص بك. يرجى التواصل مع الإدارة.",
      type: "system_announcement",
      priority: "normal",
      recipientType: "student",
      recipientId: request.studentId,
      status: "sent",
      createdBy: admin._id,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

export const approvals = {
  createApprovalRequest,
  getApprovalRequests,
  listApprovalRequests,
  approveRequest,
  rejectRequest,
};