// convex/groups/groups.ts

import { v } from "convex/values";
import { mutation, query } from "../_generated/server";
import { Id } from "../_generated/dataModel";

// ============================================
// QUERIES
// ============================================

// ✅ جلب جميع المجموعات (للأدمن)
export const getGroups = query({
  args: {
    gradeId: v.optional(v.id("grades")),
    status: v.optional(
      v.union(
        v.literal("active"),
        v.literal("inactive"),
        v.literal("completed"),
      ),
    ),
    search: v.optional(v.string()),
    supervisorId: v.optional(v.id("users")),
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

    let groups = await ctx.db.query("groups").collect();

    // ✅ إذا كان معلم، اعرض المجموعات التي أنشأها فقط
    if (user.role === "teacher") {
      groups = groups.filter((g) => g.createdBy === user._id);
    }

    if (args.gradeId) {
      groups = groups.filter((g) => g.gradeId === args.gradeId);
    }
    if (args.status) {
      groups = groups.filter((g) => g.status === args.status);
    }
    if (args.supervisorId) {
      groups = groups.filter((g) => g.supervisorId === args.supervisorId);
    }
    if (args.search) {
      const searchLower = args.search.toLowerCase();
      groups = groups.filter(
        (g) =>
          g.name.toLowerCase().includes(searchLower) ||
          g.nameEn.toLowerCase().includes(searchLower) ||
          g.subject.toLowerCase().includes(searchLower),
      );
    }

    // جلب معلومات إضافية
    const groupsWithDetails = await Promise.all(
      groups.map(async (group) => {
        const grade = await ctx.db.get(group.gradeId);
        const creator = await ctx.db.get(group.createdBy);
        const supervisor = group.supervisorId
          ? await ctx.db.get(group.supervisorId)
          : null;

        return {
          ...group,
          gradeName: grade?.name || "غير معروف",
          creatorName: creator?.name || "غير معروف",
          supervisorName: supervisor?.name || "غير محدد",
        };
      }),
    );

    return groupsWithDetails.sort((a, b) => a.createdAt - b.createdAt);
  },
});

// ✅ جلب مجموعات المعلم
// convex/groups/groups.ts

// ✅ جلب مجموعات المعلم (مع دعم البحث)



// ✅ تحديث getGroupById لجلب الطلاب مع بياناتهم الكاملة
// convex/groups/groups.ts

export const getGroupById = query({
  args: { groupId: v.id("groups") },
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

    const group = await ctx.db.get(args.groupId);
    if (!group) throw new Error("المجموعة غير موجودة");

    // ✅ التحقق من صلاحية المعلم:
    // - إذا كان أدمن: يسمح له بكل شيء
    // - إذا كان معلم: يسمح له فقط إذا كان منشئ أو مشرف أو مدرس
    if (user.role === "teacher") {
      const isCreator = group.createdBy === user._id;
      const isSupervisor = group.supervisorId === user._id;
      const isTeacher = group.teachers && group.teachers.includes(user._id);
      
      if (!isCreator && !isSupervisor && !isTeacher) {
        throw new Error("غير مصرح لك بمشاهدة هذه المجموعة");
      }
    }

    const grade = await ctx.db.get(group.gradeId);
    const creator = await ctx.db.get(group.createdBy);
    const supervisor = group.supervisorId
      ? await ctx.db.get(group.supervisorId)
      : null;

    // ✅ جلب بيانات الطلاب الكاملة
    const students = await Promise.all(
      group.students.map(async (studentId) => {
        const student = await ctx.db.get(studentId);
        return student;
      })
    );

    // ✅ جلب أسماء المعلمين في المجموعة
    let teacherNames: string[] = [];
    if (group.teachers && group.teachers.length > 0) {
      const teachers = await Promise.all(
        group.teachers.map(async (teacherId) => {
          const teacher = await ctx.db.get(teacherId);
          return teacher?.name || null;
        })
      );
      teacherNames = teachers.filter((name): name is string => name !== null);
    }

    return {
      ...group,
      gradeName: grade?.name || "غير معروف",
      creatorName: creator?.name || "غير معروف",
      supervisorName: supervisor?.name || "غير محدد",
      teacherNames: teacherNames,
      students: students.filter(Boolean),
    };
  },
});

// ============================================
// MUTATIONS
// ============================================

// ✅ جلب المعلمين المتاحين لإضافةهم إلى مجموعة
export const getAvailableTeachersForGroup = query({
  args: {
    groupId: v.id("groups"),
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

    const group = await ctx.db.get(args.groupId);
    if (!group) throw new Error("المجموعة غير موجودة");

    let teachers = await ctx.db
      .query("users")
      .withIndex("by_role", (q) => q.eq("role", "teacher"))
      .collect();

    teachers = teachers.filter((teacher) => {
      const isActive = teacher.status === "active";
      const sameGrade = teacher.gradeId === group.gradeId;
      const notAssigned = !(group.teachers || []).includes(teacher._id);
      return isActive && sameGrade && notAssigned;
    });

    if (args.search) {
      const searchLower = args.search.toLowerCase();
      teachers = teachers.filter(
        (teacher) =>
          teacher.name.toLowerCase().includes(searchLower) ||
          teacher.email.toLowerCase().includes(searchLower),
      );
    }

    return teachers.sort((a, b) => a.name.localeCompare(b.name));
  },
});

// ✅ إنشاء مجموعة جديدة (أدمن + معلم)
export const createGroup = mutation({
  args: {
    name: v.string(),
    nameEn: v.string(),
    gradeId: v.id("grades"),
    subject: v.string(),
    maxStudents: v.number(),
    supervisorId: v.optional(v.id("users")),
    location: v.optional(v.string()),
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

    // ✅ التحقق من وجود الصف
    const grade = await ctx.db.get(args.gradeId);
    if (!grade) throw new Error("الصف غير موجود");

    // ✅ التحقق من عدم وجود مجموعة بنفس الاسم تحت نفس الصف
    const existing = await ctx.db
      .query("groups")
      .withIndex("by_grade", (q) => q.eq("gradeId", args.gradeId))
      .collect();

    const sameName = existing.find((g) => g.name === args.name);
    if (sameName) {
      throw new Error(`المجموعة ${args.name} موجودة مسبقاً في هذا الصف`);
    }

    const groupId = await ctx.db.insert("groups", {
      name: args.name,
      nameEn: args.nameEn,
      gradeId: args.gradeId,
      subject: args.subject,
      maxStudents: args.maxStudents,
      currentStudents: 0,
      supervisorId: args.supervisorId || user._id,
      location: args.location,
      status: "active",
      students: [],
      teachers: [user._id],
      createdBy: user._id,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    await ctx.db.insert("auditLogs", {
      userId: user._id,
      action: "CREATE_GROUP",
      resourceType: "group",
      resourceId: groupId,
      details: {
        name: args.name,
        createdBy: user.email,
        role: user.role,
      },
      createdAt: Date.now(),
    });

    return { success: true, groupId };
  },
});

// ✅ تحديث مجموعة
export const updateGroup = mutation({
  args: {
    groupId: v.id("groups"),
    name: v.optional(v.string()),
    nameEn: v.optional(v.string()),
    subject: v.optional(v.string()),
    maxStudents: v.optional(v.number()),
    supervisorId: v.optional(v.id("users")),
    location: v.optional(v.string()),
    status: v.optional(
      v.union(
        v.literal("active"),
        v.literal("inactive"),
        v.literal("completed"),
      ),
    ),
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

    const group = await ctx.db.get(args.groupId);
    if (!group) throw new Error("المجموعة غير موجودة");

    // ✅ التحقق من صلاحية المعلم
    if (user.role === "teacher" && group.createdBy !== user._id) {
      throw new Error("غير مصرح لك بتعديل هذه المجموعة");
    }

    const updateData: any = { updatedAt: Date.now() };
    if (args.name !== undefined) updateData.name = args.name;
    if (args.nameEn !== undefined) updateData.nameEn = args.nameEn;
    if (args.subject !== undefined) updateData.subject = args.subject;
    if (args.maxStudents !== undefined)
      updateData.maxStudents = args.maxStudents;
    if (args.supervisorId !== undefined)
      updateData.supervisorId = args.supervisorId;
    if (args.location !== undefined) updateData.location = args.location;
    if (args.status !== undefined) updateData.status = args.status;

    await ctx.db.patch(args.groupId, updateData);

    return { success: true };
  },
});

// ✅ حذف مجموعة
export const deleteGroup = mutation({
  args: { groupId: v.id("groups") },
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

    const group = await ctx.db.get(args.groupId);
    if (!group) throw new Error("المجموعة غير موجودة");

    // ✅ التحقق من صلاحية المعلم
    if (user.role === "teacher" && group.createdBy !== user._id) {
      throw new Error("غير مصرح لك بحذف هذه المجموعة");
    }

    // التحقق من وجود طلاب
    if (group.students.length > 0) {
      throw new Error("لا يمكن حذف المجموعة لأنها تحتوي على طلاب");
    }

    await ctx.db.delete(args.groupId);

    return { success: true };
  },
});

// ============================================
// STUDENT GROUP OPERATIONS
// ============================================

// ✅ إضافة معلم إلى مجموعة
export const addTeacherToGroup = mutation({
  args: {
    groupId: v.id("groups"),
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

    const group = await ctx.db.get(args.groupId);
    if (!group) throw new Error("المجموعة غير موجودة");

    const teacher = await ctx.db.get(args.teacherId);
    if (!teacher || teacher.role !== "teacher") {
      throw new Error("المعلم غير موجود");
    }

    if (teacher.gradeId !== group.gradeId) {
      throw new Error("المعلم ليس في نفس الصف الدراسي للمجموعة");
    }

    if ((group.teachers || []).includes(args.teacherId)) {
      throw new Error("المعلم مسجل بالفعل في هذه المجموعة");
    }

    const updatedTeachers = [...(group.teachers || []), args.teacherId];
    await ctx.db.patch(args.groupId, {
      teachers: updatedTeachers,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

// ✅ إزالة معلم من مجموعة
export const removeTeacherFromGroup = mutation({
  args: {
    groupId: v.id("groups"),
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

    const group = await ctx.db.get(args.groupId);
    if (!group) throw new Error("المجموعة غير موجودة");

    if (!(group.teachers || []).includes(args.teacherId)) {
      throw new Error("المعلم غير مسجل في هذه المجموعة");
    }

    const updatedTeachers = (group.teachers || []).filter(
      (id) => id !== args.teacherId,
    );
    await ctx.db.patch(args.groupId, {
      teachers: updatedTeachers,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

// ✅ إضافة طالب إلى مجموعة (معدل للسماح للطلاب بالتسجيل بأنفسهم)
// convex/groups/groups.ts

// ✅ إضافة طالب إلى مجموعة (معدل لتحديث groupId في الطالب)
export const addStudentToGroup = mutation({
  args: {
    groupId: v.id("groups"),
    studentId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("غير مصرح");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) throw new Error("المستخدم غير موجود");

    // ✅ السماح للطلاب بالتسجيل بأنفسهم
    if (user.role === "student") {
      // ✅ التأكد أن الطالب يسجل نفسه فقط
      if (user._id !== args.studentId) {
        throw new Error("غير مصرح لك بتسجيل طالب آخر");
      }
    } 
    // ✅ للمعلمين والأدمن - يمكنهم تسجيل أي طالب
    else if (user.role !== "admin" && user.role !== "teacher") {
      throw new Error("مطلوب صلاحيات مشرف أو معلم");
    }

    const group = await ctx.db.get(args.groupId);
    if (!group) throw new Error("المجموعة غير موجودة");

    const student = await ctx.db.get(args.studentId);
    if (!student || student.role !== "student") {
      throw new Error("الطالب غير موجود");
    }

    // ✅ التحقق من أن الطالب في نفس الصف
    if (student.gradeId !== group.gradeId) {
      throw new Error("الطالب ليس في نفس الصف الدراسي للمجموعة");
    }

    // ✅ التحقق من عدم وجود الطالب مسبقاً
    if (group.students.includes(args.studentId)) {
      throw new Error("الطالب مسجل بالفعل في هذه المجموعة");
    }

    // ✅ التحقق من السعة
    if (group.students.length >= group.maxStudents) {
      throw new Error("السعة القصوى للمجموعة تم الوصول إليها");
    }

    const updatedStudents = [...group.students, args.studentId];
    
    // ✅ تحديث المجموعة بإضافة الطالب
    await ctx.db.patch(args.groupId, {
      students: updatedStudents,
      currentStudents: updatedStudents.length,
      updatedAt: Date.now(),
    });

    // ✅ تحديث الطالب بإضافة groupId (مهم جداً!)
    await ctx.db.patch(args.studentId, {
      groupId: args.groupId,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});


// ✅ إزالة طالب من مجموعة (معدل لإزالة groupId من الطالب)
export const removeStudentFromGroup = mutation({
  args: {
    groupId: v.id("groups"),
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

    const group = await ctx.db.get(args.groupId);
    if (!group) throw new Error("المجموعة غير موجودة");

    if (!group.students.includes(args.studentId)) {
      throw new Error("الطالب غير مسجل في هذه المجموعة");
    }

    const updatedStudents = group.students.filter(
      (id) => id !== args.studentId,
    );
    
    // ✅ تحديث المجموعة بإزالة الطالب
    await ctx.db.patch(args.groupId, {
      students: updatedStudents,
      currentStudents: updatedStudents.length,
      updatedAt: Date.now(),
    });

    // ✅ تحديث الطالب بإزالة groupId
    await ctx.db.patch(args.studentId, {
      groupId: undefined,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});


// ✅ جلب مجموعات الطالب مع الجدول والمشرف
export const getStudentGroups = query({
  args: { studentId: v.id("users") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("غير مصرح");

    const student = await ctx.db.get(args.studentId);
    if (!student || student.role !== "student") {
      throw new Error("الطالب غير موجود");
    }

    const allGroups = await ctx.db.query("groups").collect();
    const studentGroups = allGroups.filter((g) =>
      g.students.includes(args.studentId),
    );

    // جلب معلومات الصف والمشرف والجدول
    const groupsWithDetails = await Promise.all(
      studentGroups.map(async (group) => {
        const grade = await ctx.db.get(group.gradeId);
        
        // جلب المشرف
        let supervisorName = "غير محدد";
        if (group.supervisorId) {
          const supervisor = await ctx.db.get(group.supervisorId);
          if (supervisor) {
            supervisorName = supervisor.name || "غير محدد";
          }
        }

        // ✅ جلب الجدول
        const schedule = await ctx.db
          .query("schedules")
          .withIndex("by_group", (q) => q.eq("groupId", group._id))
          .first();

        // ✅ إضافة أسماء المعلمين في الجدول
        let scheduleWithNames = null;
        if (schedule) {
          scheduleWithNames = { ...schedule };
          if (scheduleWithNames.weekDays) {
            for (const day of scheduleWithNames.weekDays) {
              if (day.periods) {
                for (const period of day.periods) {
                  if (period.teacherId) {
                    const teacher = await ctx.db.get(period.teacherId);
                    period.teacherName = teacher?.name || "غير محدد";
                  }
                }
              }
            }
          }
        }

        return {
          ...group,
          gradeName: grade?.name || "غير معروف",
          supervisorName: supervisorName,
          schedule: scheduleWithNames,
        };
      }),
    );

    return groupsWithDetails;
  },
});

// ✅ جلب المجموعات المتاحة للطالب (في نفس الصف فقط)
export const getAvailableGroupsForStudent = query({
  args: { studentId: v.id("users") },
  handler: async (ctx, args) => {
    const student = await ctx.db.get(args.studentId);
    if (!student || student.role !== "student") {
      throw new Error("الطالب غير موجود");
    }

    if (!student.gradeId) {
      return []; // الطالب ليس لديه صف
    }

    const allGroups = await ctx.db.query("groups").collect();

    // ✅ جلب المجموعات في نفس الصف والتي الطالب غير مسجل فيها
    const availableGroups = allGroups.filter(
      (g) =>
        g.gradeId === student.gradeId && // ✅ نفس الصف
        !g.students.includes(args.studentId) && // ✅ غير مسجل فيها
        g.status === "active", // ✅ المجموعة نشطة
    );

    // جلب معلومات الصف
    const groupsWithGrade = await Promise.all(
      availableGroups.map(async (group) => {
        const grade = await ctx.db.get(group.gradeId);
        return {
          ...group,
          gradeName: grade?.name || "غير معروف",
        };
      }),
    );

    return groupsWithGrade;
  },
});

// ✅ جلب المجموعات حسب الصف (متاحة للجميع - بدون صلاحيات)
export const getGroupsByGrade = query({
  args: {
    gradeId: v.id("grades"),
    status: v.optional(
      v.union(
        v.literal("active"),
        v.literal("inactive"),
        v.literal("completed"),
      ),
    ),
  },
  handler: async (ctx, args) => {
    // ✅ بدون التحقق من الصلاحيات - متاحة للجميع (للتسجيل)
    let groups = await ctx.db
      .query("groups")
      .withIndex("by_grade", (q) => q.eq("gradeId", args.gradeId))
      .collect();

    if (args.status) {
      groups = groups.filter((g) => g.status === args.status);
    }

    // ترتيب حسب الاسم
    return groups.sort((a, b) => a.name.localeCompare(b.name));
  },
});

// ✅ جلب المجموعات النشطة حسب الصف (للاستخدام العام)
export const getActiveGroupsByGrade = query({
  args: {
    gradeId: v.id("grades"),
  },
  handler: async (ctx, args) => {
    const groups = await ctx.db
      .query("groups")
      .withIndex("by_grade", (q) => q.eq("gradeId", args.gradeId))
      .collect();

    return groups
      .filter((g) => g.status === "active")
      .sort((a, b) => a.name.localeCompare(b.name));
  },
});

// ✅ جلب جميع المجموعات النشطة (للاستخدام العام)
export const getAllActiveGroups = query({
  args: {},
  handler: async (ctx) => {
    const groups = await ctx.db.query("groups").collect();
    return groups
      .filter((g) => g.status === "active")
      .sort((a, b) => a.name.localeCompare(b.name));
  },
});
// convex/groups/groups.ts

// ✅ هذه الدالة موجودة بالفعل في نهاية الملف
export const getAvailableStudentsForGroup = query({
  args: {
    groupId: v.id("groups"),
    search: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("غير مصرح");

    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!currentUser || (currentUser.role !== "admin" && currentUser.role !== "teacher")) {
      throw new Error("مطلوب صلاحيات مشرف أو معلم");
    }

    const group = await ctx.db.get(args.groupId);
    if (!group) throw new Error("المجموعة غير موجودة");

    let students = await ctx.db
      .query("users")
      .withIndex("by_role", (q) => q.eq("role", "student"))
      .collect();

    students = students.filter((student) => 
      student.status === "active" && 
      student.gradeId === group.gradeId && 
      !group.students.includes(student._id)
    );

    if (args.search && args.search.trim() !== "") {
      const searchLower = args.search.toLowerCase();
      students = students.filter((student) =>
        student.name?.toLowerCase().includes(searchLower) ||
        student.email?.toLowerCase().includes(searchLower) ||
        student.studentId?.toLowerCase().includes(searchLower)
      );
    }

    return students.sort((a, b) => a.name?.localeCompare(b.name) || 0);
  },
});


// ✅ جلب مجموعات المعلم مع الجدول والمشرف


export const getTeacherGroups = query({
  args: {
    status: v.optional(
      v.union(
        v.literal("active"),
        v.literal("inactive"),
        v.literal("completed"),
      ),
    ),
    search: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("غير مصرح");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user || user.role !== "teacher") {
      throw new Error("مطلوب صلاحيات معلم");
    }

    let groups = await ctx.db.query("groups").collect();
    
    // ✅ جلب المجموعات التي:
    // 1. أنشأها المعلم (createdBy)
    // 2. أو هو مشرف عليها (supervisorId)
    // 3. أو هو مدرس فيها (teachers array)
    groups = groups.filter((g) => 
      g.createdBy === user._id || 
      g.supervisorId === user._id ||
      (g.teachers && g.teachers.includes(user._id))
    );

    if (args.status) {
      groups = groups.filter((g) => g.status === args.status);
    }

    if (args.search) {
      const searchLower = args.search.toLowerCase();
      groups = groups.filter(
        (g) =>
          g.name.toLowerCase().includes(searchLower) ||
          g.nameEn.toLowerCase().includes(searchLower) ||
          g.subject.toLowerCase().includes(searchLower),
      );
    }

    // جلب معلومات إضافية + الجدول
    const groupsWithDetails = await Promise.all(
      groups.map(async (group) => {
        const grade = await ctx.db.get(group.gradeId);
        
        // جلب المشرف
        let supervisorName = "غير محدد";
        if (group.supervisorId) {
          const supervisor = await ctx.db.get(group.supervisorId);
          if (supervisor) {
            supervisorName = supervisor.name || "غير محدد";
          }
        }

        // جلب المنشئ
        let creatorName = "غير محدد";
        if (group.createdBy) {
          const creator = await ctx.db.get(group.createdBy);
          if (creator) {
            creatorName = creator.name || "غير محدد";
          }
        }

        // ✅ جلب الجدول
        const schedule = await ctx.db
          .query("schedules")
          .withIndex("by_group", (q) => q.eq("groupId", group._id))
          .first();

        // ✅ إضافة أسماء المعلمين في الجدول
        let scheduleWithNames = null;
        if (schedule) {
          scheduleWithNames = { ...schedule };
          if (scheduleWithNames.weekDays) {
            for (const day of scheduleWithNames.weekDays) {
              if (day.periods) {
                for (const period of day.periods) {
                  if (period.teacherId) {
                    const teacher = await ctx.db.get(period.teacherId);
                    period.teacherName = teacher?.name || "غير محدد";
                  }
                }
              }
            }
          }
        }

        // ✅ جلب أسماء المعلمين في المجموعة
        let teacherNames: string[] = [];
        if (group.teachers && group.teachers.length > 0) {
          const teachers = await Promise.all(
            group.teachers.map(async (teacherId) => {
              const teacher = await ctx.db.get(teacherId);
              return teacher?.name || null;
            })
          );
          teacherNames = teachers.filter((name): name is string => name !== null);
        }

        return {
          ...group,
          gradeName: grade?.name || "غير معروف",
          supervisorName: supervisorName,
          creatorName: creatorName,
          teacherNames: teacherNames,
          schedule: scheduleWithNames,
        };
      }),
    );

    return groupsWithDetails.sort((a, b) => a.createdAt - b.createdAt);
  },
});

// ============================================
// EXPORTS
// ============================================

export const groups = {
  getGroups,
  getTeacherGroups,
  getGroupById,
  createGroup,
  updateGroup,
  deleteGroup,
  getAvailableTeachersForGroup,
  addTeacherToGroup,
  removeTeacherFromGroup,
  addStudentToGroup,
  removeStudentFromGroup,
  getStudentGroups,
  getAvailableGroupsForStudent,
  getGroupsByGrade, // ✅ إضافة
  getActiveGroupsByGrade, // ✅ إضافة
  getAllActiveGroups, // ✅ إضافة
  getAvailableStudentsForGroup, // ✅ إضافة
};
