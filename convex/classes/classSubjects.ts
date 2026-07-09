import { v } from "convex/values";
import { mutation, query } from "../_generated/server";
import { Id } from "../_generated/dataModel";

// ============================================
// QUERIES
// ============================================

// جلب جميع مواد الفصل
export const getClassSubjects = query({
  args: { 
    classId: v.id("classes"),
    status: v.optional(v.union(v.literal("active"), v.literal("inactive"))),
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

    let query = ctx.db
      .query("classSubjects")
      .withIndex("by_class", (q) => q.eq("classId", args.classId));

    if (args.status) {
      query = query.filter((q) => q.eq(q.field("status"), args.status));
    }

    const classSubjects = await query.collect();

    // جلب بيانات المادة والمعلم لكل صف
    const enriched = await Promise.all(
      classSubjects.map(async (cs) => {
        const subject = await ctx.db.get(cs.subjectId);
        const teacher = await ctx.db.get(cs.teacherId);
        return {
          ...cs,
          subjectName: subject?.title || "مادة غير معروفة",
          subjectDescription: subject?.description,
          teacherName: teacher?.name || "معلم غير معروف",
          teacherEmail: teacher?.email,
          isPublished: subject?.isPublished,
        };
      })
    );

    // ترتيب حسب order
    return enriched.sort((a, b) => a.order - b.order);
  },
});

// جلب مادة فصل بواسطة ID
export const getClassSubjectById = query({
  args: { classSubjectId: v.id("classSubjects") },
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

    const classSubject = await ctx.db.get(args.classSubjectId);
    if (!classSubject) throw new Error("المادة غير موجودة في الفصل");

    const subject = await ctx.db.get(classSubject.subjectId);
    const teacher = await ctx.db.get(classSubject.teacherId);

    return {
      ...classSubject,
      subjectName: subject?.title || "مادة غير معروفة",
      teacherName: teacher?.name || "معلم غير معروف",
    };
  },
});

// جلب المواد المتاحة للإضافة (غير المرتبطة بالفصل)
export const getAvailableSubjects = query({
  args: { 
    classId: v.id("classes"),
    search: v.optional(v.string()),
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

    // جلب جميع المواد (courses)
    const allSubjects = await ctx.db
      .query("courses")
      .collect();

    // جلب مواد الفصل الحالية
    const existing = await ctx.db
      .query("classSubjects")
      .withIndex("by_class", (q) => q.eq("classId", args.classId))
      .collect();

    const existingSubjectIds = new Set(existing.map(cs => cs.subjectId));

    // تصفية المواد غير المرتبطة
    let available = allSubjects.filter(s => !existingSubjectIds.has(s._id));

    // فلتر البحث
    if (args.search && args.search.trim() !== "") {
      const searchLower = args.search.toLowerCase();
      available = available.filter(s =>
        s.title.toLowerCase().includes(searchLower) ||
        s.description?.toLowerCase().includes(searchLower)
      );
    }

    return available;
  },
});

// جلب المعلمين المتاحين لتدريس المادة
export const getAvailableTeachersForSubject = query({
  args: { 
    subjectId: v.id("courses"),
    classId: v.id("classes"),
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
    
    // ✅ التحقق من وجود subjectId
    if (!args.subjectId) {
      return [];
    }

    // جلب جميع المعلمين
    const allTeachers = await ctx.db
      .query("users")
      .withIndex("by_role", (q) => q.eq("role", "teacher"))
      .collect();

    // جلب معلمي الفصل الحاليين
    const classSubjects = await ctx.db
      .query("classSubjects")
      .withIndex("by_class", (q) => q.eq("classId", args.classId))
      .collect();

    const currentTeacherIds = new Set(classSubjects.map(cs => cs.teacherId));

    // تصفية المعلمين غير المرتبطين بالفصل
    return allTeachers.filter(t => !currentTeacherIds.has(t._id));
  },
});

// ============================================
// MUTATIONS
// ============================================

// إضافة مادة للفصل
export const addSubjectToClass = mutation({
  args: {
    classId: v.id("classes"),
    subjectId: v.id("courses"),
    teacherId: v.id("users"),
    order: v.optional(v.number()),
    status: v.optional(v.union(v.literal("active"), v.literal("inactive"))),
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

    if (!user || user.role !== "admin") {
      throw new Error("مطلوب صلاحيات مشرف");
    }

    // التحقق من وجود الفصل والمادة والمعلم
    const classData = await ctx.db.get(args.classId);
    if (!classData) throw new Error("الفصل غير موجود");

    const subject = await ctx.db.get(args.subjectId);
    if (!subject) throw new Error("المادة غير موجودة");

    const teacher = await ctx.db.get(args.teacherId);
    if (!teacher || teacher.role !== "teacher") {
      throw new Error("المعلم غير موجود");
    }

    // التحقق من عدم تكرار المادة
    const existing = await ctx.db
      .query("classSubjects")
      .withIndex("by_class", (q) => q.eq("classId", args.classId))
      .filter((q) => q.eq(q.field("subjectId"), args.subjectId))
      .first();

    if (existing) {
      throw new Error("هذه المادة موجودة بالفعل في الفصل");
    }

    // حساب الترتيب
    const allSubjects = await ctx.db
      .query("classSubjects")
      .withIndex("by_class", (q) => q.eq("classId", args.classId))
      .collect();

    const order = args.order !== undefined ? args.order : allSubjects.length;

    const classSubjectId = await ctx.db.insert("classSubjects", {
      classId: args.classId,
      gradeId: classData.gradeId || (classData as any).gradeId || (classData as any).grade?._id || (classData as any).gradeId || (classData as any).gradeId || (classData as any).gradeId,
      subjectId: args.subjectId,
      teacherId: args.teacherId,
      order: order,
      status: args.status || "active",
      schedule: args.schedule,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // ✅ تسجيل في سجل التدقيق - استخدام الحقول المتاحة فقط
    await ctx.db.insert("auditLogs", {
      userId: user._id,
      action: "ADD_SUBJECT_TO_CLASS",
      resourceType: "classSubject",
      resourceId: classSubjectId,
      details: {
        name: subject.title, // استخدام name بدلاً من subjectName
        createdBy: user.email,
      },
      createdAt: Date.now(),
    });

    return { success: true, classSubjectId };
  },
});

// تحديث مادة في الفصل
export const updateClassSubject = mutation({
  args: {
    classSubjectId: v.id("classSubjects"),
    teacherId: v.optional(v.id("users")),
    order: v.optional(v.number()),
    status: v.optional(v.union(v.literal("active"), v.literal("inactive"))),
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

    if (!user || user.role !== "admin") {
      throw new Error("مطلوب صلاحيات مشرف");
    }

    const classSubject = await ctx.db.get(args.classSubjectId);
    if (!classSubject) throw new Error("المادة غير موجودة في الفصل");

    const updateData: any = { updatedAt: Date.now() };
    if (args.teacherId !== undefined) {
      const teacher = await ctx.db.get(args.teacherId);
      if (!teacher || teacher.role !== "teacher") {
        throw new Error("المعلم غير موجود");
      }
      updateData.teacherId = args.teacherId;
    }
    if (args.order !== undefined) updateData.order = args.order;
    if (args.status !== undefined) updateData.status = args.status;
    if (args.schedule !== undefined) updateData.schedule = args.schedule;

    await ctx.db.patch(args.classSubjectId, updateData);

    return { success: true };
  },
});

// حذف مادة من الفصل
export const removeSubjectFromClass = mutation({
  args: { 
    classSubjectId: v.id("classSubjects"),
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

    const classSubject = await ctx.db.get(args.classSubjectId);
    if (!classSubject) throw new Error("المادة غير موجودة في الفصل");

    await ctx.db.delete(args.classSubjectId);

    return { success: true };
  },
});

// تغيير ترتيب المواد (سحب وإفلات)
export const reorderClassSubjects = mutation({
  args: {
    classId: v.id("classes"),
    subjectOrders: v.array(v.object({
      classSubjectId: v.id("classSubjects"),
      order: v.number(),
    })),
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

    for (const item of args.subjectOrders) {
      await ctx.db.patch(item.classSubjectId, {
        order: item.order,
        updatedAt: Date.now(),
      });
    }

    return { success: true };
  },
});

// إحصائيات مواد الفصل
export const getClassSubjectsStats = query({
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

    const allSubjects = await ctx.db
      .query("classSubjects")
      .withIndex("by_class", (q) => q.eq("classId", args.classId))
      .collect();

    const active = allSubjects.filter(s => s.status === "active").length;
    const inactive = allSubjects.filter(s => s.status === "inactive").length;

    return {
      total: allSubjects.length,
      active,
      inactive,
    };
  },
});