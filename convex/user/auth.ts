import { v } from "convex/values";
import { mutation, query } from "../_generated/server";

// دالة مساعدة لتوليد رقم معلم فريد
async function generateTeacherId(ctx: any): Promise<string> {
  const teachers = await ctx.db
    .query("users")
    .withIndex("by_role", (q: any) => q.eq("role", "teacher"))
    .collect();
  
  const nextNumber = teachers.length + 1;
  return `TCH-${String(nextNumber).padStart(5, '0')}`;
}

// دالة مساعدة لتوليد رقم طالب فريد
async function generateStudentId(ctx: any): Promise<string> {
  const students = await ctx.db
    .query("users")
    .withIndex("by_role", (q: any) => q.eq("role", "student"))
    .collect();
  
  const nextNumber = students.length + 1;
  return `STU-${String(nextNumber).padStart(5, '0')}`;
}

// ✅ إنشاء مستخدم جديد
export const createUser = mutation({
  args: {
    clerkId: v.string(),
    email: v.string(),
    name: v.string(),
    phoneNumber: v.optional(v.string()),
    tracks: v.optional(v.array(
      v.union(
        v.literal("platform"),
        v.literal("aptitude"),
        v.literal("academic"),
      )
    )),
    role: v.union(
      v.literal("student"),
      v.literal("teacher"),
      v.literal("parent"),
      v.literal("admin"),
    ),
    status: v.optional(
      v.union(
        v.literal("pending"),
        v.literal("approved"),
        v.literal("rejected"),
        v.literal("active"),
        v.literal("inactive"),
        v.literal("on_leave"),
      )
    ),
    // Student fields
    studentId: v.optional(v.string()),
    birthDate: v.optional(v.number()),
    gender: v.optional(v.union(v.literal("male"), v.literal("female"))),
    address: v.optional(v.string()),
    grade: v.optional(v.string()),
    gradeId: v.optional(v.id("grades")),
    groupId: v.optional(v.id("groups")),
    classId: v.optional(v.id("classes")),
    enrollmentDate: v.optional(v.number()),
    // Teacher fields
    teacherId: v.optional(v.string()),
    specialization: v.optional(v.string()),
    qualification: v.optional(v.string()),
    experience: v.optional(v.number()),
    hireDate: v.optional(v.number()),
    salary: v.optional(v.number()),
    subjects: v.optional(v.array(v.string())),
    // Parent fields
    parentId: v.optional(v.string()),
    workPhone: v.optional(v.string()),
    workAddress: v.optional(v.string()),
    jobTitle: v.optional(v.string()),
    nationalId: v.optional(v.string()),
    relationship: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Prevent duplicates
    const existingByClerk = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (existingByClerk) return existingByClerk._id;

    const existingByEmail = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (existingByEmail) {
      if (!existingByEmail.clerkId) {
        await ctx.db.patch(existingByEmail._id, { clerkId: args.clerkId, updatedAt: Date.now() });
      }
      return existingByEmail._id;
    }

    const now = Date.now();

    // ✅ توليد معرفات تلقائية
    let studentId = args.studentId;
    let teacherId = args.teacherId;
    let parentId = args.parentId;

    if (args.role === "student" && !studentId) {
      studentId = await generateStudentId(ctx);
    }
    if (args.role === "teacher" && !teacherId) {
      teacherId = await generateTeacherId(ctx);
    }
    if (args.role === "parent" && !parentId) {
      const parents = await ctx.db
        .query("users")
        .withIndex("by_role", (q: any) => q.eq("role", "parent"))
        .collect();
      const nextNumber = parents.length + 1;
      parentId = `PAR-${String(nextNumber).padStart(5, '0')}`;
    }

    return await ctx.db.insert("users", {
      clerkId: args.clerkId,
      email: args.email,
      name: args.name,
      phoneNumber: args.phoneNumber,
      tracks: args.tracks || [],
      role: args.role,
      status: args.status || "pending",
      createdAt: now,
      updatedAt: now,

      // Student
      studentId: studentId,
      birthDate: args.birthDate,
      gender: args.gender,
      address: args.address,
      grade: args.grade,
      gradeId: args.gradeId,
      groupId: args.groupId,
      classId: args.classId,
      enrollmentDate: args.enrollmentDate,

      // Teacher
      teacherId: teacherId,
      specialization: args.specialization,
      qualification: args.qualification,
      experience: args.experience,
      hireDate: args.hireDate,
      salary: args.salary,
      subjects: args.subjects,

      // Parent
      parentId: parentId,
      workPhone: args.workPhone,
      workAddress: args.workAddress,
      jobTitle: args.jobTitle,
      nationalId: args.nationalId,
      relationship: args.relationship,
    });
  },
});

// ✅ جلب المستخدم الحالي
export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();

    return user || null;
  },
});

// ✅ جلب المستخدم بواسطة البريد الإلكتروني
export const getUserByEmail = mutation({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    return user || null;
  },
});

// ✅ التحقق من حالة التسجيل
export const checkRegistrationStatus = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) return null;

    return {
      status: user.status,
      role: user.role,
      tracks: user.tracks,
      rejectionReason: user.rejectionReason,
      createdAt: user.createdAt,
    };
  },
});

// ✅ تحديث حالة المستخدم
export const updateUserStatus = mutation({
  args: {
    userId: v.id("users"),
    status: v.union(
      v.literal("pending"),
      v.literal("approved"),
      v.literal("rejected"),
      v.literal("active"),
      v.literal("inactive"),
      v.literal("on_leave"),
    ),
    rejectionReason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("غير مصرح");

    const admin = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!admin || admin.role !== "admin") {
      throw new Error("غير مصرح: فقط الأدمن يمكنه تغيير الحالة");
    }

    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("المستخدم غير موجود");

    await ctx.db.patch(args.userId, {
      status: args.status,
      rejectionReason: args.rejectionReason,
      updatedAt: Date.now(),
      ...(args.status === "active" || args.status === "approved" ? {
        approvedAt: Date.now(),
        approvedBy: admin._id,
      } : {}),
    });

    // ✅ تسجيل في سجل التدقيق
    await ctx.db.insert("auditLogs", {
      userId: args.userId,
      action: "update_status",
      resourceType: "user",
      resourceId: args.userId,
      details: {
        previousStatus: user.status,
        approvedBy: admin.name || admin.email,
        reason: args.rejectionReason,
      },
      createdAt: Date.now(),
    });

    return { success: true };
  },
});

// ✅ تحديث حالة الاشتراك
export const updateSubscriptionStatus = mutation({
  args: {
    userId: v.id("users"),
    status: v.union(
      v.literal("pending"),
      v.literal("awaiting_approval"),
      v.literal("active"),
      v.literal("rejected"),
      v.literal("expired"),
    ),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("غير مصرح");

    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("المستخدم غير موجود");

    await ctx.db.patch(args.userId, {
      subscriptionStatus: args.status,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

// ✅ جلب المستخدمين المنتظرين (للأدمن)
export const getPendingUsers = query({
  args: {
    track: v.optional(
      v.union(
        v.literal("platform"),
        v.literal("aptitude"),
        v.literal("academic"),
      )
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
      throw new Error("غير مصرح: فقط الأدمن يمكنه الوصول");
    }

    let users = await ctx.db
      .query("users")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .collect();

    // ✅ فلترة حسب المسار (باستخدام includes)
    if (args.track) {
      users = users.filter((u) => {
        const userTracks = u.tracks || [];
        return userTracks.includes(args.track as "platform" | "aptitude" | "academic");
      });
    }

    return users;
  },
});

export const auth = {
  createUser,
  getCurrentUser,
  getUserByEmail,
  checkRegistrationStatus,
  updateUserStatus,
  updateSubscriptionStatus,
  getPendingUsers,
};