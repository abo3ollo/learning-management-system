// convex/classes/classes.ts
import { v } from "convex/values";
import { mutation, query } from "../_generated/server";

// توليد كود الفصل
async function generateClassCode(ctx: any, gradeLevel: number, section: string): Promise<string> {
  const gradeMap: Record<number, string> = {
    1: "P1", 2: "P2", 3: "P3", 4: "P4", 5: "P5", 6: "P6",
    7: "M1", 8: "M2", 9: "M3",
    10: "S1", 11: "S2", 12: "S3"
  };
  const prefix = gradeMap[gradeLevel] || `G${gradeLevel}`;
  return `${prefix}-${section}`;
}

// إنشاء فصل جديد
export const createClass = mutation({
  args: {
    classNameEn: v.string(),
    classNameAr: v.string(),
    grade: v.string(),
    gradeLevel: v.number(),
    section: v.string(),
    supervisorId: v.optional(v.id("users")),
    academicYear: v.string(),
    maxStudents: v.number(),
    location: v.optional(v.string()),
    schedule: v.optional(v.object({
      days: v.array(v.string()),
      startTime: v.string(),
      endTime: v.string(),
    })),
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

    const classCode = await generateClassCode(ctx, args.gradeLevel, args.section);

    const existing = await ctx.db
      .query("classes")
      .withIndex("by_classCode", (q) => q.eq("classCode", classCode))
      .first();

    if (existing) {
      throw new Error(`الفصل ${classCode} موجود مسبقاً`);
    }

    const classId = await ctx.db.insert("classes", {
      classNameEn: args.classNameEn,
      classNameAr: args.classNameAr,
      classCode,
      grade: args.grade,
      gradeLevel: args.gradeLevel,
      section: args.section,
      supervisorId: args.supervisorId,
      academicYear: args.academicYear,
      maxStudents: args.maxStudents,
      currentStudents: 0,
      location: args.location,
      schedule: args.schedule,
      status: "active",
      students: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    await ctx.db.insert("auditLogs", {
      userId: admin._id,
      action: "CREATE_CLASS",
      resourceType: "class",
      resourceId: classId,
      details: {
        name: args.classNameAr,
        createdBy: admin.email,
      },
      createdAt: Date.now(),
    });

    return { success: true, classId, classCode };
  },
});

// ✅ إضافة طالب إلى الفصل
export const addStudentToClass = mutation({
  args: {
    classId: v.id("classes"),
    studentId: v.id("users"),
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

    const classData = await ctx.db.get(args.classId);
    if (!classData) throw new Error("الفصل غير موجود");

    const student = await ctx.db.get(args.studentId);
    if (!student || student.role !== "student") throw new Error("الطالب غير موجود");

    const currentStudents = classData.students || [];
    
    if (currentStudents.includes(args.studentId)) {
      throw new Error("الطالب مسجل بالفعل في هذا الفصل");
    }

    if (currentStudents.length >= classData.maxStudents) {
      throw new Error("الحد الأقصى للطلاب في هذا الفصل قد تم الوصول إليه");
    }

    const updatedStudents = [...currentStudents, args.studentId];
    await ctx.db.patch(args.classId, {
      students: updatedStudents,
      currentStudents: updatedStudents.length,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

// ✅ إزالة طالب من الفصل
export const removeStudentFromClass = mutation({
  args: {
    classId: v.id("classes"),
    studentId: v.id("users"),
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

    const classData = await ctx.db.get(args.classId);
    if (!classData) throw new Error("الفصل غير موجود");

    const currentStudents = classData.students || [];
    
    if (!currentStudents.includes(args.studentId)) {
      throw new Error("الطالب غير مسجل في هذا الفصل");
    }

    const updatedStudents = currentStudents.filter(id => id !== args.studentId);
    await ctx.db.patch(args.classId, {
      students: updatedStudents,
      currentStudents: updatedStudents.length,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

// ✅ إضافة معلم إلى الفصل
export const addTeacherToClass = mutation({
  args: {
    classId: v.id("classes"),
    teacherId: v.id("users"),
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

    const classData = await ctx.db.get(args.classId);
    if (!classData) throw new Error("الفصل غير موجود");

    const teacher = await ctx.db.get(args.teacherId);
    if (!teacher || teacher.role !== "teacher") throw new Error("المعلم غير موجود");

    // ✅ التحقق من undefined باستخدام || []
    const currentTeachers = classData.teachers || [];
    
    if (currentTeachers.includes(args.teacherId)) {
      throw new Error("المعلم موجود بالفعل في هذا الفصل");
    }

    const updatedTeachers = [...currentTeachers, args.teacherId];
    await ctx.db.patch(args.classId, {
      teachers: updatedTeachers,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

// ✅ إزالة معلم من الفصل
export const removeTeacherFromClass = mutation({
  args: {
    classId: v.id("classes"),
    teacherId: v.id("users"),
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

    const classData = await ctx.db.get(args.classId);
    if (!classData) throw new Error("الفصل غير موجود");

    // ✅ التحقق من undefined باستخدام || []
    const currentTeachers = classData.teachers || [];
    
    if (!currentTeachers.includes(args.teacherId)) {
      throw new Error("المعلم غير موجود في هذا الفصل");
    }

    const updatedTeachers = currentTeachers.filter(id => id !== args.teacherId);
    await ctx.db.patch(args.classId, {
      teachers: updatedTeachers,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

// ✅ جلب طلاب الفصل
export const getClassStudents = query({
  args: { classId: v.id("classes") },
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

    const classData = await ctx.db.get(args.classId);
    if (!classData) throw new Error("الفصل غير موجود");

    const students = await Promise.all(
      (classData.students || []).map(async (studentId) => {
        const student = await ctx.db.get(studentId);
        return student;
      })
    );

    return students.filter(Boolean);
  },
});

// ✅ جلب معلمي الفصل
export const getClassTeachers = query({
  args: { classId: v.id("classes") },
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

    const classData = await ctx.db.get(args.classId);
    if (!classData) throw new Error("الفصل غير موجود");

    // ✅ التحقق من undefined باستخدام || []
    const teachers = await Promise.all(
      (classData.teachers || []).map(async (teacherId) => {
        const teacher = await ctx.db.get(teacherId);
        return teacher;
      })
    );

    return teachers.filter(Boolean);
  },
});

// ✅ جلب الطلاب غير المسجلين في الفصل
export const getAvailableStudents = query({
  args: { classId: v.id("classes") },
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

    const classData = await ctx.db.get(args.classId);
    if (!classData) throw new Error("الفصل غير موجود");

    const allStudents = await ctx.db
      .query("users")
      .withIndex("by_role", (q) => q.eq("role", "student"))
      .collect();

    const enrolledStudentIds = new Set(classData.students || []);
    const availableStudents = allStudents.filter(student => !enrolledStudentIds.has(student._id));

    return availableStudents;
  },
});

// ✅ جلب المعلمين غير المسجلين في الفصل
export const getAvailableTeachers = query({
  args: { classId: v.id("classes") },
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

    const classData = await ctx.db.get(args.classId);
    if (!classData) throw new Error("الفصل غير موجود");

    const allTeachers = await ctx.db
      .query("users")
      .withIndex("by_role", (q) => q.eq("role", "teacher"))
      .collect();

    const enrolledTeacherIds = new Set(classData.teachers || []);
    const availableTeachers = allTeachers.filter(teacher => !enrolledTeacherIds.has(teacher._id));

    return availableTeachers;
  },
});

// جلب جميع الفصول
export const getClasses = query({
  args: {
    status: v.optional(v.string()),
    academicYear: v.optional(v.string()),
    search: v.optional(v.string()),
    gradeLevel: v.optional(v.number()),
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

    let classes = await ctx.db.query("classes").collect();

    // Apply filters
    if (args.status) {
      classes = classes.filter((c) => c.status === args.status);
    }
    if (args.academicYear) {
      classes = classes.filter((c) => c.academicYear === args.academicYear);
    }
    if (args.gradeLevel) {
      classes = classes.filter((c) => c.gradeLevel === args.gradeLevel);
    }
    if (args.search && args.search.trim() !== "") {
      const searchLower = args.search.toLowerCase();
      classes = classes.filter((c) =>
        c.classNameAr.toLowerCase().includes(searchLower) ||
        c.classNameEn.toLowerCase().includes(searchLower) ||
        c.classCode.toLowerCase().includes(searchLower)
      );
    }

    // جلب معلومات المشرف لكل فصل
    const classesWithSupervisor = await Promise.all(
      classes.map(async (cls) => {
        let supervisor = null;
        if (cls.supervisorId) {
          supervisor = await ctx.db.get(cls.supervisorId);
        }
        return {
          ...cls,
          supervisorName: supervisor?.name || "غير محدد",
          currentStudents: cls.students?.length || 0,
          teachersCount: (cls.teachers || []).length,
        };
      })
    );

    return classesWithSupervisor;
  },
});

// جلب فصل بواسطة ID
export const getClassById = query({
  args: { classId: v.id("classes") },
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

    const classData = await ctx.db.get(args.classId);
    if (!classData) throw new Error("الفصل غير موجود");

    let supervisor = null;
    if (classData.supervisorId) {
      supervisor = await ctx.db.get(classData.supervisorId);
    }

    // جلب الطلاب المسجلين
    const students = await Promise.all(
      (classData.students || []).map(async (studentId) => {
        const student = await ctx.db.get(studentId);
        return student;
      })
    );

    // جلب المعلمين المسجلين
    const teachers = await Promise.all(
      (classData.teachers || []).map(async (teacherId) => {
        const teacher = await ctx.db.get(teacherId);
        return teacher;
      })
    );

    return {
      ...classData,
      supervisorName: supervisor?.name || "غير محدد",
      students: students.filter(Boolean),
      teachers: teachers.filter(Boolean),
      currentStudents: classData.students?.length || 0,
      teachersCount: (classData.teachers || []).length,
    };
  },
});

// تحديث فصل
export const updateClass = mutation({
  args: {
    classId: v.id("classes"),
    classNameEn: v.optional(v.string()),
    classNameAr: v.optional(v.string()),
    grade: v.optional(v.string()),
    section: v.optional(v.string()),
    supervisorId: v.optional(v.id("users")),
    academicYear: v.optional(v.string()),
    maxStudents: v.optional(v.number()),
    location: v.optional(v.string()),
    status: v.optional(v.union(v.literal("active"), v.literal("inactive"), v.literal("completed"))),
    schedule: v.optional(v.object({
      days: v.array(v.string()),
      startTime: v.string(),
      endTime: v.string(),
    })),
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

    const classData = await ctx.db.get(args.classId);
    if (!classData) throw new Error("الفصل غير موجود");

    const updateData: any = { updatedAt: Date.now() };
    if (args.classNameEn !== undefined) updateData.classNameEn = args.classNameEn;
    if (args.classNameAr !== undefined) updateData.classNameAr = args.classNameAr;
    if (args.grade !== undefined) updateData.grade = args.grade;
    if (args.section !== undefined) updateData.section = args.section;
    if (args.supervisorId !== undefined) updateData.supervisorId = args.supervisorId;
    if (args.academicYear !== undefined) updateData.academicYear = args.academicYear;
    if (args.maxStudents !== undefined) updateData.maxStudents = args.maxStudents;
    if (args.location !== undefined) updateData.location = args.location;
    if (args.status !== undefined) updateData.status = args.status;
    if (args.schedule !== undefined) updateData.schedule = args.schedule;

    await ctx.db.patch(args.classId, updateData);

    return { success: true };
  },
});

// حذف فصل
export const deleteClass = mutation({
  args: { classId: v.id("classes") },
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

    const classData = await ctx.db.get(args.classId);
    if (!classData) throw new Error("الفصل غير موجود");

    if ((classData.students?.length || 0) > 0) {
      throw new Error("لا يمكن حذف الفصل لأنه يحتوي على طلاب");
    }

    await ctx.db.delete(args.classId);

    return { success: true };
  },
});

// إحصائيات الفصول
export const getClassesStats = query({
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

    const allClasses = await ctx.db.query("classes").collect();
    
    const active = allClasses.filter((c) => c.status === "active").length;
    const inactive = allClasses.filter((c) => c.status === "inactive").length;
    const completed = allClasses.filter((c) => c.status === "completed").length;
    const totalStudents = allClasses.reduce((sum, c) => sum + (c.students?.length || 0), 0);

    return {
      total: allClasses.length,
      active,
      inactive,
      completed,
      totalStudents,
    };
  },
});