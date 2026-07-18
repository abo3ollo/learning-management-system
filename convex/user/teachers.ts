// convex/user/teachers.ts
import { v } from "convex/values";
import { mutation, query } from "../_generated/server";
import { Doc, Id } from "../_generated/dataModel";

// توليد رقم معلم
async function generateTeacherId(ctx: any): Promise<string> {
  let settings = await ctx.db.query("adminSettings").first();
  
  if (!settings) {
    const settingsId = await ctx.db.insert("adminSettings", {
      requireApproval: true,
      autoApproveRoles: ["student", "teacher"],
      studentIdPrefix: "STU",
      teacherIdPrefix: "TCH",
      parentIdPrefix: "PAR",
      nextStudentIdNumber: 1000,
      nextTeacherIdNumber: 1000,
      nextParentIdNumber: 1000,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    settings = await ctx.db.get(settingsId);
  }

  const nextNumber = settings?.nextTeacherIdNumber || 1000;
  const prefix = settings?.teacherIdPrefix || "TCH";
  const teacherId = `${prefix}${nextNumber}`;

  await ctx.db.patch(settings._id, {
    nextTeacherIdNumber: nextNumber + 1,
    updatedAt: Date.now(),
  });

  return teacherId;
}

// إضافة معلم جديد
export const createTeacher = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    phoneNumber: v.string(),
    specialization: v.optional(v.string()),
    qualification: v.optional(v.string()),
    experience: v.optional(v.number()),
    address: v.optional(v.string()),
    hireDate: v.optional(v.number()),
    salary: v.optional(v.number()),
    employmentType: v.optional(v.union(v.literal("full_time"), v.literal("part_time"), v.literal("contract"))),
    subjects: v.optional(v.array(v.string())),
    status: v.optional(v.union(v.literal("active"), v.literal("inactive"), v.literal("on_leave"))),
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

    // التحقق من البريد الإلكتروني
    const emailExists = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (emailExists) {
      throw new Error("البريد الإلكتروني موجود مسبقاً");
    }

    const teacherId = await generateTeacherId(ctx);

    const teacher = await ctx.db.insert("users", {
      clerkId: `teacher_${teacherId}`,
      name: args.name,
      email: args.email,
      phoneNumber: args.phoneNumber,
      role: "teacher",
      status: args.status || "active",
      teacherId,
      specialization: args.specialization,
      qualification: args.qualification,
      experience: args.experience,
      address: args.address,
      hireDate: args.hireDate || Date.now(),
      salary: args.salary,
      subjects: args.subjects || [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // تسجيل في سجل التدقيق
    await ctx.db.insert("auditLogs", {
      userId: admin._id,
      action: "CREATE_TEACHER",
      resourceType: "user",
      resourceId: teacher,
      details: {
        teacherId,
        name: args.name,
        email: args.email,
        createdBy: admin.email,
      },
      createdAt: Date.now(),
    });

    return { success: true, teacherId, userId: teacher };
  },
});

// جلب جميع المعلمين
export const getTeachers = query({
  args: {
    status: v.optional(v.string()),
    search: v.optional(v.string()),
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

    let teachersQuery = ctx.db
      .query("users")
      .withIndex("by_role", (q) => q.eq("role", "teacher"));

    if (args.status && args.status !== "all") {
      teachersQuery = teachersQuery.filter((q) => q.eq(q.field("status"), args.status));
    }

    let teachers = await teachersQuery.collect();

    if (args.search && args.search.trim() !== "") {
      const searchLower = args.search.toLowerCase();
      teachers = teachers.filter((teacher) =>
        teacher.name.toLowerCase().includes(searchLower) ||
        teacher.email.toLowerCase().includes(searchLower) ||
        teacher.teacherId?.toLowerCase().includes(searchLower) ||
        teacher.phoneNumber?.includes(args.search || "")
      );
    }

    // جلب عدد المواد لكل معلم
    const teachersWithStats = await Promise.all(
      teachers.map(async (teacher) => {
        const courses = await ctx.db
          .query("courses")
          .withIndex("by_teacher", (q) => q.eq("teacherId", teacher._id))
          .collect();

        return {
          ...teacher,
          courseCount: courses.length,
          publishedCourses: courses.filter(c => c.isPublished).length,
        };
      })
    );

    return teachersWithStats;
  },
});

// جلب معلم بواسطة ID
export const getTeacherById = query({
  args: { teacherId: v.id("users") },
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

    const teacher = await ctx.db.get(args.teacherId);
    if (!teacher || teacher.role !== "teacher") {
      throw new Error("المعلم غير موجود");
    }

    // جلب عدد الدورات للمعلم
    const courses = await ctx.db
      .query("courses")
      .withIndex("by_teacher", (q) => q.eq("teacherId", teacher._id))
      .collect();

    return {
      ...teacher,
      courses,
      courseCount: courses.length,
    };
  },
});

// تحديث معلم
export const updateTeacher = mutation({
  args: {
    teacherId: v.id("users"),
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    phoneNumber: v.optional(v.string()),
    specialization: v.optional(v.string()),
    qualification: v.optional(v.string()),
    experience: v.optional(v.number()),
    address: v.optional(v.string()),
    status: v.optional(v.union(v.literal("active"), v.literal("inactive"), v.literal("on_leave"))),
    subjects: v.optional(v.array(v.string())),
    salary: v.optional(v.number()),
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

    const teacher = await ctx.db.get(args.teacherId);
    if (!teacher || teacher.role !== "teacher") {
      throw new Error("المعلم غير موجود");
    }

    const updateData: any = { updatedAt: Date.now() };
    if (args.name !== undefined) updateData.name = args.name;
    if (args.email !== undefined) updateData.email = args.email;
    if (args.phoneNumber !== undefined) updateData.phoneNumber = args.phoneNumber;
    if (args.specialization !== undefined) updateData.specialization = args.specialization;
    if (args.qualification !== undefined) updateData.qualification = args.qualification;
    if (args.experience !== undefined) updateData.experience = args.experience;
    if (args.address !== undefined) updateData.address = args.address;
    if (args.status !== undefined) updateData.status = args.status;
    if (args.subjects !== undefined) updateData.subjects = args.subjects;
    if (args.salary !== undefined) updateData.salary = args.salary;

    await ctx.db.patch(args.teacherId, updateData);

    return { success: true };
  },
});

// حذف معلم
export const deleteTeacher = mutation({
  args: { teacherId: v.id("users") },
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

    const teacher = await ctx.db.get(args.teacherId);
    if (!teacher || teacher.role !== "teacher") {
      throw new Error("المعلم غير موجود");
    }

    // التحقق من وجود مواد مرتبطة
    const courses = await ctx.db
      .query("courses")
      .withIndex("by_teacher", (q) => q.eq("teacherId", teacher._id))
      .collect();

    if (courses.length > 0) {
      throw new Error("لا يمكن حذف المعلم لأنه مرتبط بمواد دراسية");
    }

    await ctx.db.delete(args.teacherId);

    return { success: true };
  },
});

// إحصائيات المعلمين
export const getTeachersStats = query({
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

    const allTeachers = await ctx.db
      .query("users")
      .withIndex("by_role", (q) => q.eq("role", "teacher"))
      .collect();

    const active = allTeachers.filter((t) => t.status === "active").length;
    const inactive = allTeachers.filter((t) => t.status === "inactive").length;
    const onLeave = allTeachers.filter((t) => t.status === "on_leave").length;

    return {
      total: allTeachers.length,
      active,
      inactive,
      onLeave,
    };
  },
});



// ✅ دالة جديدة للمعلمين - تجلب المعلمين المتاحين فقط (لا تشمل نفسه)
export const getAvailableTeachers = query({
  args: {
    search: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("غير مصرح");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user || (user.role !== "admin" && user.role !== "teacher")) {
      throw new Error("مطلوب صلاحيات مشرف أو معلم");
    }

    let teachers = await ctx.db
      .query("users")
      .withIndex("by_role", (q) => q.eq("role", "teacher"))
      .collect();

    // ✅ استبعاد المستخدم نفسه
    teachers = teachers.filter((t) => t._id !== user._id);

    if (args.search) {
      const searchLower = args.search.toLowerCase();
      teachers = teachers.filter((t) =>
        t.name.toLowerCase().includes(searchLower) ||
        t.email.toLowerCase().includes(searchLower)
      );
    }

    return teachers;
  },
});



// ✅ دالة عامة لجلب المعلمين (لا تحتاج إلى تسجيل دخول)
export const getPublicTeachers = query({
  args: {
    search: v.optional(v.string()),
    subject: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // ✅ لا نتحقق من الصلاحيات - صفحة عامة
    let teachers = await ctx.db
      .query("users")
      .withIndex("by_role", (q) => q.eq("role", "teacher"))
      .collect();

    // فلترة المعلمين النشطين فقط
    teachers = teachers.filter((t) => t.status === "active");

    // فلترة حسب البحث
    if (args.search && args.search.trim() !== "") {
      const searchLower = args.search.toLowerCase();
      teachers = teachers.filter((teacher) =>
        teacher.name?.toLowerCase().includes(searchLower) ||
        teacher.email?.toLowerCase().includes(searchLower) ||
        teacher.specialization?.toLowerCase().includes(searchLower) ||
        teacher.subjects?.some((s: string) => s.toLowerCase().includes(searchLower))
      );
    }

    // فلترة حسب المادة
    if (args.subject) {
      teachers = teachers.filter((teacher) =>
        teacher.subjects?.includes(args.subject || "")
      );
    }

    // ترتيب حسب الاسم
    return teachers.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
  },
});


