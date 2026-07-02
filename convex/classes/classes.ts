// convex/classes/classes.ts

import { v } from "convex/values";
import { mutation, query } from "../_generated/server";
import { Id } from "../_generated/dataModel";

// ============================================
// HELPERS
// ============================================

// توليد كود الفصل
// convex/classes/classes.ts

// ✅ توليد كود فريد للفصل مع رقم تسلسلي متزايد
async function generateClassCode(ctx: any, gradeLevel: number, section: string): Promise<string> {
  const gradeMap: Record<number, string> = {
    1: "P1", 2: "P2", 3: "P3", 4: "P4", 5: "P5", 6: "P6",
    7: "M1", 8: "M2", 9: "M3",
    10: "S1", 11: "S2", 12: "S3"
  };
  const prefix = gradeMap[gradeLevel] || `G${gradeLevel}`;
  
  // ✅ البحث عن جميع الفصول بنفس prefix
  const allClasses = await ctx.db.query("classes").collect();
  const samePrefix = allClasses.filter((c : any) => c.classCode.startsWith(`${prefix}-${section}`));
  
  // ✅ إذا كان هناك فصول بنفس prefix، أضف رقم تسلسلي
  if (samePrefix.length > 0) {
    // استخراج الأرقام الموجودة
    const numbers = samePrefix.map((c : any) => {
      const parts = c.classCode.split('-');
      if (parts.length === 3) {
        return parseInt(parts[2]) || 0;
      }
      return 0;
    }).filter((n : any) => !isNaN(n) && n > 0);
    
    const maxNumber = numbers.length > 0 ? Math.max(...numbers) : 0;
    const newNumber = maxNumber + 1;
    
    // ✅ التحقق من عدم وجود كود مكرر
    let code = `${prefix}-${section}-${newNumber}`;
    let existing = await ctx.db
      .query("classes")
      .withIndex("by_classCode", (q : any) => q.eq("classCode", code))
      .first();
    
    // إذا كان موجوداً، استمر في الزيادة
    let counter = newNumber;
    while (existing) {
      counter++;
      code = `${prefix}-${section}-${counter}`;
      existing = await ctx.db
        .query("classes")
        .withIndex("by_classCode", (q: any) => q.eq("classCode", code))
        .first();
    }
    
    return code;
  }
  
  return `${prefix}-${section}`;
}

// ============================================
// QUERIES
// ============================================

// ✅ جلب جميع الفصول (للمعلمين والمشرفين)
export const getClasses = query({
  args: {
    status: v.optional(v.union(
      v.literal("active"),
      v.literal("inactive"),
      v.literal("completed"),
    )),
    supervisorId: v.optional(v.id("users")),
    search: v.optional(v.string()),
    academicYear: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("غير مصرح");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) throw new Error("المستخدم غير موجود");

    // ✅ السماح للمعلمين والمشرفين بمشاهدة الفصول
    if (user.role !== "admin" && user.role !== "teacher") {
      throw new Error("مطلوب صلاحيات مشرف أو معلم");
    }

    let classes = await ctx.db.query("classes").collect();

    // ✅ إذا كان معلم، اعرض الفصول التي يدرسها فقط
    if (user.role === "teacher") {
      // جلب الفصول التي يكون فيها المعلم مشرفاً
      classes = classes.filter((c) => c.supervisorId === user._id);
      
      // جلب الفصول التي يدرس فيها المعلم من جدول classSubjects
      const teacherClasses = await ctx.db
        .query("classSubjects")
        .withIndex("by_teacher", (q) => q.eq("teacherId", user._id))
        .collect();
      
      const teacherClassIds = teacherClasses.map((cs) => cs.classId);
      
      // دمج الفصول التي يشرف عليها والتي يدرسها
      const supervisorClassIds = classes.map((c) => c._id);
      const allClassIds = [...new Set([...supervisorClassIds, ...teacherClassIds])];
      
      classes = classes.filter((c) => allClassIds.includes(c._id));
    }

    // تطبيق الفلاتر
    if (args.status) {
      classes = classes.filter((c) => c.status === args.status);
    }
    if (args.supervisorId) {
      classes = classes.filter((c) => c.supervisorId === args.supervisorId);
    }
    if (args.academicYear) {
      classes = classes.filter((c) => c.academicYear === args.academicYear);
    }
    if (args.search && args.search.trim() !== "") {
      const searchLower = args.search.toLowerCase();
      classes = classes.filter((c) =>
        c.classNameAr.toLowerCase().includes(searchLower) ||
        c.classNameEn.toLowerCase().includes(searchLower) ||
        c.classCode.toLowerCase().includes(searchLower) ||
        c.grade.toLowerCase().includes(searchLower)
      );
    }

    // ✅ جلب أسماء المشرفين ومنشئ الفصل
    const classesWithDetails = await Promise.all(
      classes.map(async (classData) => {
        let supervisorName = "غير محدد";
        let createdByName = "غير معروف";
        
        if (classData.supervisorId) {
          const supervisor = await ctx.db.get(classData.supervisorId);
          if (supervisor) {
            supervisorName = supervisor.name;
          }
        }
        
        if (classData.createdBy) {
          const creator = await ctx.db.get(classData.createdBy);
          if (creator) {
            createdByName = creator.name;
          }
        }
        
        return {
          ...classData,
          supervisorName,
          createdByName,
        };
      })
    );

    // ترتيب حسب تاريخ الإنشاء (الأحدث أولاً)
    return classesWithDetails.sort((a, b) => b.createdAt - a.createdAt);
  },
});

// ✅ جلب الفصول النشطة فقط
export const getActiveClasses = query({
  args: {},
  handler: async (ctx) => {
    const allClasses = await ctx.db.query("classes").collect();
    
    const activeClasses = allClasses.filter(
      (c) => c.status === "active"
    );
    
    activeClasses.sort((a, b) => a.classNameAr.localeCompare(b.classNameAr));
    
    return activeClasses;
  },
});

// ✅ جلب فصل بواسطة ID
export const getClassById = query({
  args: { classId: v.id("classes") },
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

    const classData = await ctx.db.get(args.classId);
    if (!classData) throw new Error("الفصل غير موجود");

    let supervisor = null;
    if (classData.supervisorId) {
      supervisor = await ctx.db.get(classData.supervisorId);
    }

    let createdBy = null;
    if (classData.createdBy) {
      createdBy = await ctx.db.get(classData.createdBy);
    }

    // جلب الطلاب المسجلين
    const studentObjects = await Promise.all(
      (classData.students || []).map(async (studentId) => {
        const student = await ctx.db.get(studentId);
        return student;
      })
    );

    const validStudents = studentObjects.filter(Boolean);

    // جلب المعلمين المسجلين
    const teacherObjects = await Promise.all(
      (classData.teachers || []).map(async (teacherId) => {
        const teacher = await ctx.db.get(teacherId);
        return teacher;
      })
    );

    return {
      ...classData,
      supervisorName: supervisor?.name || "غير محدد",
      createdByName: createdBy?.name || "غير معروف",
      students: validStudents,
      teachers: teacherObjects.filter(Boolean),
      currentStudents: validStudents.length,
      teachersCount: (classData.teachers || []).length,
    };
  },
});

// ✅ جلب طلاب الفصل
export const getClassStudents = query({
  args: { classId: v.id("classes") },
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

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user || (user.role !== "admin" && user.role !== "teacher")) {
      throw new Error("مطلوب صلاحيات مشرف أو معلم");
    }

    const classData = await ctx.db.get(args.classId);
    if (!classData) throw new Error("الفصل غير موجود");

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

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user || (user.role !== "admin" && user.role !== "teacher")) {
      throw new Error("مطلوب صلاحيات مشرف أو معلم");
    }

    const classData = await ctx.db.get(args.classId);
    if (!classData) throw new Error("الفصل غير موجود");

    const allStudents = await ctx.db
      .query("users")
      .withIndex("by_role", (q) => q.eq("role", "student"))
      .collect();

    const enrolledStudentIds = new Set(classData.students || []);
    
    const availableStudents = allStudents.filter(student => 
      !enrolledStudentIds.has(student._id) &&
      student.status === "active"
    );

    return availableStudents;
  },
});

// ✅ جلب المعلمين غير المسجلين في الفصل
export const getAvailableTeachers = query({
  args: { classId: v.id("classes") },
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

    const classData = await ctx.db.get(args.classId);
    if (!classData) throw new Error("الفصل غير موجود");

    const allTeachers = await ctx.db
      .query("users")
      .withIndex("by_role", (q) => q.eq("role", "teacher"))
      .collect();

    const enrolledTeacherIds = new Set(classData.teachers || []);
    const availableTeachers = allTeachers.filter(teacher => 
      !enrolledTeacherIds.has(teacher._id) &&
      teacher.status === "active"
    );

    return availableTeachers;
  },
});

// ✅ إحصائيات الفصول
export const getClassesStats = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("غير مصرح");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user || (user.role !== "admin" && user.role !== "teacher")) {
      throw new Error("مطلوب صلاحيات مشرف أو معلم");
    }

    const allClasses = await ctx.db.query("classes").collect();
    
    const active = allClasses.filter((c) => c.status === "active").length;
    const inactive = allClasses.filter((c) => c.status === "inactive").length;
    const completed = allClasses.filter((c) => c.status === "completed").length;
    
    let totalStudents = 0;
    for (const cls of allClasses) {
      for (const studentId of (cls.students || [])) {
        const student = await ctx.db.get(studentId);
        if (student) {
          totalStudents++;
        }
      }
    }

    return {
      total: allClasses.length,
      active,
      inactive,
      completed,
      totalStudents,
    };
  },
});

// ============================================
// MUTATIONS
// ============================================

// ✅ إنشاء فصل جديد مع createdBy
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

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) throw new Error("المستخدم غير موجود");

    // ✅ السماح للمعلمين والمشرفين بإنشاء فصول
    if (user.role !== "admin" && user.role !== "teacher") {
      throw new Error("مطلوب صلاحيات مشرف أو معلم");
    }

    const classCode = await generateClassCode(ctx, args.gradeLevel, args.section);

    const existing = await ctx.db
      .query("classes")
      .withIndex("by_classCode", (q) => q.eq("classCode", classCode))
      .first();

    if (existing) {
      throw new Error(`الفصل ${classCode} موجود مسبقاً`);
    }

    let supervisorId = args.supervisorId;
    if (user.role === "teacher" && !supervisorId) {
      supervisorId = user._id;
    }

    const classId = await ctx.db.insert("classes", {
      classNameEn: args.classNameEn,
      classNameAr: args.classNameAr,
      classCode,
      grade: args.grade,
      gradeLevel: args.gradeLevel,
      section: args.section,
      supervisorId: supervisorId,
      academicYear: args.academicYear,
      maxStudents: args.maxStudents,
      currentStudents: 0,
      location: args.location,
      schedule: args.schedule,
      status: "active",
      students: [],
      createdBy: user._id, // ✅ إضافة منشئ الفصل
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    await ctx.db.insert("auditLogs", {
      userId: user._id,
      action: "CREATE_CLASS",
      resourceType: "class",
      resourceId: classId,
      details: {
        name: args.classNameAr,
        createdBy: user.email,
        role: user.role,
        
      },
      createdAt: Date.now(),
    });

    return { success: true, classId, classCode };
  },
});

// ✅ تحديث الفصل
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
    status: v.optional(v.union(
      v.literal("active"),
      v.literal("inactive"),
      v.literal("completed"),
    )),
    schedule: v.optional(v.object({
      days: v.array(v.string()),
      startTime: v.string(),
      endTime: v.string(),
    })),
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

    await ctx.db.insert("auditLogs", {
      userId: user._id,
      action: "UPDATE_CLASS",
      resourceType: "class",
      resourceId: args.classId,
      details: {
        name: classData.classNameAr,
        updatedBy: user.email,
        role: user.role,
        
      },
      createdAt: Date.now(),
    });

    return { success: true };
  },
});

// ✅ حذف الفصل
export const deleteClass = mutation({
  args: { classId: v.id("classes") },
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

    const classData = await ctx.db.get(args.classId);
    if (!classData) throw new Error("الفصل غير موجود");

    if ((classData.students?.length || 0) > 0) {
      throw new Error("لا يمكن حذف الفصل لأنه يحتوي على طلاب");
    }

    await ctx.db.delete(args.classId);

    await ctx.db.insert("auditLogs", {
      userId: user._id,
      action: "DELETE_CLASS",
      resourceType: "class",
      resourceId: args.classId,
      details: {
        name: classData.classNameAr,
        deletedBy: user.email,
        role: user.role,
        
      },
      createdAt: Date.now(),
    });

    return { success: true };
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

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user || (user.role !== "admin" && user.role !== "teacher")) {
      throw new Error("مطلوب صلاحيات مشرف أو معلم");
    }

    const classData = await ctx.db.get(args.classId);
    if (!classData) throw new Error("الفصل غير موجود");

    const student = await ctx.db.get(args.studentId);
    if (!student || student.role !== "student") {
      throw new Error("الطالب غير موجود");
    }

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

    await ctx.db.patch(args.studentId, {
      classId: args.classId,
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

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user || (user.role !== "admin" && user.role !== "teacher")) {
      throw new Error("مطلوب صلاحيات مشرف أو معلم");
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

    await ctx.db.patch(args.studentId, {
      classId: undefined,
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

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user || (user.role !== "admin" && user.role !== "teacher")) {
      throw new Error("مطلوب صلاحيات مشرف أو معلم");
    }

    const classData = await ctx.db.get(args.classId);
    if (!classData) throw new Error("الفصل غير موجود");

    const teacher = await ctx.db.get(args.teacherId);
    if (!teacher || teacher.role !== "teacher") {
      throw new Error("المعلم غير موجود");
    }

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

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user || (user.role !== "admin" && user.role !== "teacher")) {
      throw new Error("مطلوب صلاحيات مشرف أو معلم");
    }

    const classData = await ctx.db.get(args.classId);
    if (!classData) throw new Error("الفصل غير موجود");

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

// ✅ تصدير جميع الدوال
export const classes = {
  getClasses,
  getActiveClasses,
  getClassById,
  getClassStudents,
  getClassTeachers,
  getAvailableStudents,
  getAvailableTeachers,
  getClassesStats,
  createClass,
  updateClass,
  deleteClass,
  addStudentToClass,
  removeStudentFromClass,
  addTeacherToClass,
  removeTeacherFromClass,
};