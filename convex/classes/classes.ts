// convex/classes/classes.ts

import { v } from "convex/values";
import { mutation, query } from "../_generated/server";

function buildClassCode(group: any, grade: any) {
  const gradeLabel = grade?.gradeLevel ? `G${grade.gradeLevel}` : "GR";
  const shortName = (group?.nameEn || group?.name || "group").replace(/\s+/g, "").slice(0, 4).toUpperCase();
  return `${gradeLabel}-${shortName}-${group?._id?.slice(-4) || "0000"}`;
}

function mapGroupToLegacyClass(group: any, grade: any, supervisor: any, createdBy: any) {
  return {
    ...group,
    _id: group._id,
    classNameAr: group.name,
    classNameEn: group.nameEn,
    classCode: buildClassCode(group, grade),
    grade: grade?.name || "غير معروف",
    gradeLevel: grade?.gradeLevel || 1,
    section: group.subject || "عام",
    supervisorId: group.supervisorId,
    supervisorName: supervisor?.name || "غير محدد",
    createdByName: createdBy?.name || "غير معروف",
    academicYear: grade?.academicYear || "2025-2026",
    maxStudents: group.maxStudents || 0,
    currentStudents: group.currentStudents || group.students?.length || 0,
    location: group.location || "",
    status: group.status || "active",
    students: group.students || [],
    teachers: group.teachers || [],
    createdAt: group.createdAt,
    updatedAt: group.updatedAt,
  };
}

export const getClasses = query({
  args: {
    status: v.optional(v.union(v.literal("active"), v.literal("inactive"), v.literal("completed"))),
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
    if (user.role !== "admin" && user.role !== "teacher") {
      throw new Error("مطلوب صلاحيات مشرف أو معلم");
    }

    let groups = await ctx.db.query("groups").collect();

    if (user.role === "teacher") {
      groups = groups.filter((group: any) => group.createdBy === user._id || group.supervisorId === user._id);
    }

    if (args.status) {
      groups = groups.filter((group: any) => group.status === args.status);
    }
    if (args.supervisorId) {
      groups = groups.filter((group: any) => group.supervisorId === args.supervisorId);
    }
    if (args.academicYear) {
      const matchingGroups = [] as any[];
      for (const group of groups) {
        const grade = await ctx.db.get(group.gradeId);
        if (grade && grade.academicYear === args.academicYear) {
          matchingGroups.push(group);
        }
      }
      groups = matchingGroups;
    }
    if (args.search && args.search.trim() !== "") {
      const search = args.search.toLowerCase();
      groups = groups.filter((group: any) => {
        const groupName = `${group.name || ""} ${group.nameEn || ""} ${group.subject || ""}`.toLowerCase();
        return groupName.includes(search);
      });
    }

    const enriched = await Promise.all(
      groups.map(async (group: any) => {
        const grade = await ctx.db.get(group.gradeId);
        const supervisor = group.supervisorId ? await ctx.db.get(group.supervisorId) : null;
        const creator = group.createdBy ? await ctx.db.get(group.createdBy) : null;
        return mapGroupToLegacyClass(group, grade, supervisor, creator);
      })
    );

    return enriched.sort((a, b) => b.createdAt - a.createdAt);
  },
});

export const getActiveClasses = query({
  args: {},
  handler: async (ctx) => {
    const groups = await ctx.db.query("groups").collect();
    const activeGroups = groups.filter((group: any) => group.status === "active");

    const enriched = await Promise.all(
      activeGroups.map(async (group: any) => {
        const grade = await ctx.db.get(group.gradeId);
        const supervisor = group.supervisorId ? await ctx.db.get(group.supervisorId) : null;
        const creator = group.createdBy ? await ctx.db.get(group.createdBy) : null;
        return mapGroupToLegacyClass(group, grade, supervisor, creator);
      })
    );

    return enriched.sort((a, b) => (a.classNameAr || "").localeCompare(b.classNameAr || ""));
  },
});

export const getClassById = query({
  args: { classId: v.id("groups") },
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

    const group = await ctx.db.get(args.classId);
    if (!group) throw new Error("المجموعة غير موجودة");

    const grade = group.gradeId ? await ctx.db.get(group.gradeId) : null;
    const supervisor = group.supervisorId ? await ctx.db.get(group.supervisorId) : null;
    const creator = group.createdBy ? await ctx.db.get(group.createdBy) : null;

    const students = await Promise.all((group.students || []).map(async (studentId: any) => ctx.db.get(studentId)));
    const teachers = await Promise.all((group.teachers || []).map(async (teacherId: any) => ctx.db.get(teacherId)));

    return {
      ...mapGroupToLegacyClass(group, grade, supervisor, creator),
      students: students.filter(Boolean),
      teachers: teachers.filter(Boolean),
      currentStudents: (group.students || []).length,
      teachersCount: (group.teachers || []).length,
    };
  },
});

export const getClassStudents = query({
  args: { classId: v.id("groups") },
  handler: async (ctx, args) => {
    const group = await ctx.db.get(args.classId);
    if (!group) throw new Error("المجموعة غير موجودة");

    const students = await Promise.all((group.students || []).map(async (studentId: any) => ctx.db.get(studentId)));
    return students.filter(Boolean);
  },
});

export const getClassTeachers = query({
  args: { classId: v.id("groups") },
  handler: async (ctx, args) => {
    const group = await ctx.db.get(args.classId);
    if (!group) throw new Error("المجموعة غير موجودة");

    const teachers = await Promise.all((group.teachers || []).map(async (teacherId: any) => ctx.db.get(teacherId)));
    return teachers.filter(Boolean);
  },
});

export const getAvailableStudents = query({
  args: { classId: v.id("groups") },
  handler: async (ctx, args) => {
    const group = await ctx.db.get(args.classId);
    if (!group) throw new Error("المجموعة غير موجودة");

    const allStudents = await ctx.db
      .query("users")
      .withIndex("by_role", (q) => q.eq("role", "student"))
      .collect();

    const enrolled = new Set(group.students || []);
    return allStudents.filter((student: any) => student.status === "active" && !enrolled.has(student._id));
  },
});

export const getAvailableTeachersForClass = query({
  args: { classId: v.id("groups") },
  handler: async (ctx, args) => {
    const group = await ctx.db.get(args.classId);
    if (!group) throw new Error("المجموعة غير موجودة");

    const allTeachers = await ctx.db
      .query("users")
      .withIndex("by_role", (q) => q.eq("role", "teacher"))
      .collect();

    const enrolled = new Set(group.teachers || []);
    return allTeachers.filter((teacher: any) => teacher.status === "active" && !enrolled.has(teacher._id));
  },
});

export const getClassesStats = query({
  args: {},
  handler: async (ctx) => {
    const groups = await ctx.db.query("groups").collect();
    const active = groups.filter((group: any) => group.status === "active").length;
    const inactive = groups.filter((group: any) => group.status === "inactive").length;
    const completed = groups.filter((group: any) => group.status === "completed").length;

    let totalStudents = 0;
    for (const group of groups) {
      totalStudents += group.students?.length || 0;
    }

    return {
      total: groups.length,
      active,
      inactive,
      completed,
      totalStudents,
    };
  },
});

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
    schedule: v.optional(v.object({ days: v.array(v.string()), startTime: v.string(), endTime: v.string() })),
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

    const existingGrades = await ctx.db.query("grades").collect();
    let grade: any = existingGrades.find((item: any) => item.name === args.grade || item.nameEn === args.grade || item.gradeLevel === args.gradeLevel);

    if (!grade) {
      const gradeId = await ctx.db.insert("grades", {
        name: args.grade,
        nameEn: args.grade,
        gradeLevel: args.gradeLevel || 1,
        academicYear: args.academicYear || "2025-2026",
        maxGroups: 20,
        status: "active",
        createdBy: user._id,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      grade = await ctx.db.get(gradeId);
    }

    if (!grade) {
      throw new Error("فشل إنشاء الصف الدراسي");
    }

    const groupId = await ctx.db.insert("groups", {
      name: args.classNameAr,
      nameEn: args.classNameEn,
      gradeId: grade?._id,
      subject: args.section || args.classNameAr,
      maxStudents: args.maxStudents,
      currentStudents: 0,
      supervisorId: args.supervisorId,
      location: args.location,
      status: "active",
      students: [],
      teachers: [],
      createdBy: user._id,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return { success: true, classId: groupId, classCode: buildClassCode({ _id: groupId, name: args.classNameAr, nameEn: args.classNameEn }, grade) };
  },
});

export const updateClass = mutation({
  args: {
    classId: v.id("groups"),
    classNameEn: v.optional(v.string()),
    classNameAr: v.optional(v.string()),
    grade: v.optional(v.string()),
    section: v.optional(v.string()),
    supervisorId: v.optional(v.id("users")),
    academicYear: v.optional(v.string()),
    maxStudents: v.optional(v.number()),
    location: v.optional(v.string()),
    status: v.optional(v.union(v.literal("active"), v.literal("inactive"), v.literal("completed"))),
  },
  handler: async (ctx, args) => {
    const updateData: any = { updatedAt: Date.now() };
    if (args.classNameEn !== undefined) updateData.nameEn = args.classNameEn;
    if (args.classNameAr !== undefined) updateData.name = args.classNameAr;
    if (args.section !== undefined) updateData.subject = args.section;
    if (args.supervisorId !== undefined) updateData.supervisorId = args.supervisorId;
    if (args.maxStudents !== undefined) updateData.maxStudents = args.maxStudents;
    if (args.location !== undefined) updateData.location = args.location;
    if (args.status !== undefined) updateData.status = args.status;
    if (args.grade !== undefined) {
      const grade = await ctx.db.query("grades").collect();
      const matched = grade.find((item: any) => item.name === args.grade || item.nameEn === args.grade);
      if (matched) {
        updateData.gradeId = matched._id;
      }
    }

    await ctx.db.patch(args.classId, updateData);
    return { success: true };
  },
});

export const deleteClass = mutation({
  args: { classId: v.id("groups") },
  handler: async (ctx, args) => {
    const group = await ctx.db.get(args.classId);
    if (!group) throw new Error("المجموعة غير موجودة");
    if ((group.students || []).length > 0) {
      throw new Error("لا يمكن حذف المجموعة لأنها تحتوي على طلاب");
    }
    await ctx.db.delete(args.classId);
    return { success: true };
  },
});

export const addStudentToClass = mutation({
  args: { classId: v.id("groups"), studentId: v.id("users") },
  handler: async (ctx, args) => {
    const group = await ctx.db.get(args.classId);
    const student = await ctx.db.get(args.studentId);
    if (!group) throw new Error("المجموعة غير موجودة");
    if (!student || student.role !== "student") throw new Error("الطالب غير موجود");
    if ((group.students || []).includes(args.studentId)) throw new Error("الطالب مسجل بالفعل");
    if ((group.students || []).length >= (group.maxStudents || 999)) throw new Error("تم الوصول إلى الحد الأقصى للطلاب");

    const updatedStudents = [...(group.students || []), args.studentId];
    await ctx.db.patch(args.classId, {
      students: updatedStudents,
      currentStudents: updatedStudents.length,
      updatedAt: Date.now(),
    });
    await ctx.db.patch(args.studentId, {
      gradeId: group.gradeId,
      updatedAt: Date.now(),
    });
    return { success: true };
  },
});

export const removeStudentFromClass = mutation({
  args: { classId: v.id("groups"), studentId: v.id("users") },
  handler: async (ctx, args) => {
    const group = await ctx.db.get(args.classId);
    if (!group) throw new Error("المجموعة غير موجودة");
    const updatedStudents = (group.students || []).filter((id: any) => id !== args.studentId);
    await ctx.db.patch(args.classId, {
      students: updatedStudents,
      currentStudents: updatedStudents.length,
      updatedAt: Date.now(),
    });
    return { success: true };
  },
});

export const addTeacherToClass = mutation({
  args: { classId: v.id("groups"), teacherId: v.id("users") },
  handler: async (ctx, args) => {
    const group = await ctx.db.get(args.classId);
    const teacher = await ctx.db.get(args.teacherId);
    if (!group) throw new Error("المجموعة غير موجودة");
    if (!teacher || teacher.role !== "teacher") throw new Error("المعلم غير موجود");
    if ((group.teachers || []).includes(args.teacherId)) throw new Error("المعلم موجود بالفعل");

    const updatedTeachers = [...(group.teachers || []), args.teacherId];
    await ctx.db.patch(args.classId, {
      teachers: updatedTeachers,
      updatedAt: Date.now(),
    });
    return { success: true };
  },
});

export const removeTeacherFromClass = mutation({
  args: { classId: v.id("groups"), teacherId: v.id("users") },
  handler: async (ctx, args) => {
    const group = await ctx.db.get(args.classId);
    if (!group) throw new Error("المجموعة غير موجودة");
    const updatedTeachers = (group.teachers || []).filter((id: any) => id !== args.teacherId);
    await ctx.db.patch(args.classId, {
      teachers: updatedTeachers,
      updatedAt: Date.now(),
    });
    return { success: true };
  },
});

export const classes = {
  getClasses,
  getActiveClasses,
  getClassById,
  getClassStudents,
  getClassTeachers,
  getAvailableStudents,
  getAvailableTeachersForClass,
  getClassesStats,
  createClass,
  updateClass,
  deleteClass,
  addStudentToClass,
  removeStudentFromClass,
  addTeacherToClass,
  removeTeacherFromClass,
};