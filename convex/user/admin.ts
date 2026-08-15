// convex/user/admin.ts

import { v } from "convex/values";
import { mutation, query } from "../_generated/server";

// ✅ قائمة الأدمن المسموح لهم
const ADMIN_WHITELIST = [
  "admin123@gmail.com",
  "admin@marineacademy.com",
  "your-email@gmail.com",
  "digitallandsystems2025@gmail.com",
  "abdalrahmanyehia333@gmail.com",
];

// جلب جميع التسجيلات المنتظرة (مع معلومات إضافية)
export const getPendingRegistrations = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("غير مصرح");

    const admin = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!admin || admin.role !== "admin") {
      throw new Error("مطلوب صلاحيات مشرف");
    }

    // ✅ جلب المستخدمين المنتظرين (pending فقط - بدون اشتراكات)
    const pendingUsers = await ctx.db
      .query("users")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .collect();

    // ✅ جلب طلبات الموافقة لكل مستخدم ومعلومات إضافية
    const usersWithRequests = await Promise.all(
      pendingUsers.map(async (user) => {
        // جلب طلب الموافقة إذا وجد
        const approvalRequest = await ctx.db
          .query("approvalRequests")
          .withIndex("by_student", (q) => q.eq("studentId", user._id))
          .first();

        // جلب الصف الدراسي
        let gradeName = "غير محدد";
        if (user.gradeId) {
          const grade = await ctx.db.get(user.gradeId);
          if (grade) {
            gradeName = grade.name || "غير محدد";
          }
        }

        // ✅ إذا كان المستخدم ولي أمر، جلب أطفاله
        let children: any[] = [];
        if (user.role === "parent") {
          const links = await ctx.db
            .query("parentStudentLinks")
            .withIndex("by_parent", (q) => q.eq("parentId", user._id))
            .collect();

          children = await Promise.all(
            links.map(async (link) => {
              const student = await ctx.db.get(link.studentId);
              if (student) {
                return {
                  ...student,
                  relationship: link.relationship,
                  isPrimary: link.isPrimary,
                  email: student.email || "لا يوجد بريد",
                };
              }
              return null;
            })
          );
          children = children.filter(Boolean);
        }

        return {
          ...user,
          gradeName,
          hasApprovalRequest: !!approvalRequest,
          approvalRequestStatus: approvalRequest?.status || null,
          paymentProof: approvalRequest?.paymentProof || null,
          amount: approvalRequest?.amount || null,
          currency: approvalRequest?.currency || null,
          referenceNumber: approvalRequest?.referenceNumber || null,
          children,
          email: user.email || "لا يوجد بريد",
          childrenCount: children.length,
        };
      })
    );

    // ترتيب من الأحدث للأقدم
    return usersWithRequests.sort((a, b) => b.createdAt - a.createdAt);
  },
});

// ✅ جلب جميع طلبات الاشتراكات مع بيانات المستخدمين (جميع الحالات)
export const getAllSubscriptionRequests = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("غير مصرح");

    const admin = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!admin || admin.role !== "admin") {
      throw new Error("مطلوب صلاحيات مشرف");
    }

    // ✅ جلب جميع طلبات الموافقة
    const approvalRequests = await ctx.db
      .query("approvalRequests")
      .order("desc")
      .collect();

    // ✅ جلب المستخدمين المرتبطين
    const usersWithDetails = await Promise.all(
      approvalRequests.map(async (request) => {
        const user = await ctx.db.get(request.studentId);
        return {
          ...request,
          user: user || null,
          studentName: user?.name || "غير معروف",
          studentEmail: user?.email || "لا يوجد بريد",
          studentPhone: user?.phoneNumber || "",
          gradeName: user?.grade || "غير محدد",
          subscriptionStatus: user?.subscriptionStatus || null,
          // ✅ تحديد الحالة
          displayStatus: request.status || 
                         (user?.subscriptionStatus === "active" ? "approved" : 
                          user?.subscriptionStatus === "rejected" ? "rejected" : "pending"),
        };
      })
    );

    return usersWithDetails;
  },
});

// ✅ الموافقة على مستخدم (معدل)
export const approveUser = mutation({
  args: { 
    userId: v.id("users"),
    role: v.optional(v.union(
      v.literal("student"),
      v.literal("teacher"),
      v.literal("parent"),
      v.literal("admin")
    )),
    approveSubscription: v.optional(v.boolean()),
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

    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("المستخدم غير موجود");

    // ✅ تحديث الحالة إلى active
    const updateData: any = {
      status: "active",
      approvedAt: Date.now(),
      approvedBy: admin._id,
      updatedAt: Date.now(),
      ...(args.role && { role: args.role }),
    };

    // ✅ فقط لو approveSubscription = true يتم تفعيل الاشتراك
    if (args.approveSubscription) {
      updateData.subscriptionStatus = "active";
    }

    await ctx.db.patch(args.userId, updateData);

    // ✅ إذا كان هناك طلب موافقة، قم بتحديثه
    if (user.role === "student") {
      const approvalRequest = await ctx.db
        .query("approvalRequests")
        .withIndex("by_student", (q) => q.eq("studentId", user._id))
        .first();

      if (approvalRequest && approvalRequest.status === "pending") {
        await ctx.db.patch(approvalRequest._id, {
          status: "approved",
          reviewedBy: admin._id,
          reviewedAt: Date.now(),
          adminNotes: args.approveSubscription ? "تم الموافقة على الاشتراك" : "تم الموافقة على المستخدم بدون اشتراك",
          updatedAt: Date.now(),
        });
      }
    }

    // ✅ إرسال إشعار للمستخدم
    await ctx.db.insert("notifications", {
      title: "تم قبول طلبك",
      message: args.approveSubscription 
        ? `تم قبول تسجيلك في المنصة وتفعيل اشتراكك. يمكنك الآن الدخول والمشاركة.`
        : `تم قبول تسجيلك في المنصة. يرجى تفعيل الاشتراك للوصول إلى جميع الخدمات.`,
      type: "system_announcement",
      priority: "normal",
      recipientType: "student",
      recipientId: user._id,
      status: "sent",
      createdBy: admin._id,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    await ctx.db.insert("auditLogs", {
      userId: admin._id,
      action: "APPROVE_USER",
      resourceType: "user",
      resourceId: args.userId,
      details: {
        previousStatus: user.status,
        previousRole: user.role,
        newRole: args.role || user.role,
        approvedBy: admin.email,
        name: args.approveSubscription ? "تمت الموافقة على الاشتراك" : "تمت الموافقة على المستخدم بدون اشتراك",
      },
      createdAt: Date.now(),
    });

    return { success: true };
  },
});

// ✅ رفض مستخدم (معدل)
export const rejectUser = mutation({
  args: {
    userId: v.id("users"),
    reason: v.optional(v.string()),
    rejectSubscription: v.optional(v.boolean()),
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

    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("المستخدم غير موجود");

    // ✅ تحديث الحالة إلى rejected
    const updateData: any = {
      status: "rejected",
      rejectionReason: args.reason,
      updatedAt: Date.now(),
    };

    // ✅ فقط لو rejectSubscription = true يتم رفض الاشتراك
    if (args.rejectSubscription) {
      updateData.subscriptionStatus = "rejected";
    }

    await ctx.db.patch(args.userId, updateData);

    // ✅ إذا كان هناك طلب موافقة، قم بتحديثه
    if (user.role === "student") {
      const approvalRequest = await ctx.db
        .query("approvalRequests")
        .withIndex("by_student", (q) => q.eq("studentId", user._id))
        .first();

      if (approvalRequest && approvalRequest.status === "pending") {
        await ctx.db.patch(approvalRequest._id, {
          status: "rejected",
          reviewedBy: admin._id,
          reviewedAt: Date.now(),
          adminNotes: args.reason || "تم رفض الطلب",
          updatedAt: Date.now(),
        });
      }
    }

    // ✅ إرسال إشعار للمستخدم
    await ctx.db.insert("notifications", {
      title: "تم رفض طلبك",
      message: args.reason || "تم رفض طلب التسجيل الخاص بك. يرجى التواصل مع الإدارة.",
      type: "system_announcement",
      priority: "normal",
      recipientType: "student",
      recipientId: user._id,
      status: "sent",
      createdBy: admin._id,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    await ctx.db.insert("auditLogs", {
      userId: admin._id,
      action: "REJECT_USER",
      resourceType: "user",
      resourceId: args.userId,
      details: {
        previousStatus: user.status,
        reason: args.reason,
        rejectedBy: admin.email,
      },
      createdAt: Date.now(),
    });

    return { success: true };
  },
});

// ✅ تحديث دور مستخدم
export const updateUserRole = mutation({
  args: {
    userId: v.id("users"),
    role: v.union(
      v.literal("student"),
      v.literal("teacher"),
      v.literal("parent"),
      v.literal("admin")
    ),
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

    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("المستخدم غير موجود");

    await ctx.db.patch(args.userId, {
      role: args.role,
      updatedAt: Date.now(),
    });

    await ctx.db.insert("auditLogs", {
      userId: admin._id,
      action: "UPDATE_USER_ROLE",
      resourceType: "user",
      resourceId: args.userId,
      details: {
        previousRole: user.role,
        newRole: args.role,
        updatedBy: admin.email,
      },
      createdAt: Date.now(),
    });

    return { success: true };
  },
});

// ✅ جلب إحصائيات التسجيلات
export const getRegistrationStats = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("غير مصرح");

    const admin = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!admin || admin.role !== "admin") {
      throw new Error("مطلوب صلاحيات مشرف");
    }

    const allUsers = await ctx.db.query("users").collect();

    const stats = {
      total: allUsers.length,
      pending: allUsers.filter((u) => u.status === "pending").length,
      active: allUsers.filter((u) => u.status === "active").length,
      rejected: allUsers.filter((u) => u.status === "rejected").length,
      awaitingApproval: allUsers.filter((u) => u.subscriptionStatus === "awaiting_approval").length,
      students: allUsers.filter((u) => u.role === "student").length,
      teachers: allUsers.filter((u) => u.role === "teacher").length,
      parents: allUsers.filter((u) => u.role === "parent").length,
    };

    return stats;
  },
});

// ✅ التحقق من أن المستخدم في الـ Whitelist
export const isWhitelistedAdmin = query({
  args: {
    email: v.string(),
  },
  handler: async (ctx, args) => {
    return ADMIN_WHITELIST.includes(args.email.toLowerCase());
  },
});

// ✅ تصدير الدوال
export const admin = {
  getPendingRegistrations,
  getAllSubscriptionRequests,
  approveUser,
  rejectUser,
  updateUserRole,
  getRegistrationStats,
  isWhitelistedAdmin,
};