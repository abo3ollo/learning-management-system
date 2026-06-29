// convex/assignments/assignments.ts

import { v } from "convex/values";
import { mutation, query } from "../_generated/server";
import { Id } from "../_generated/dataModel";

// ============================================
// QUERIES
// ============================================

// جلب جميع الواجبات
export const getAssignments = query({
  args: {
    classId: v.optional(v.id("classes")),
    status: v.optional(v.union(v.literal("draft"), v.literal("published"), v.literal("archived"))),
    search: v.optional(v.string()),
    courseId: v.optional(v.id("courses")), // ✅ إضافة courseId
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

    let assignments = await ctx.db.query("assignments").collect();

    // ✅ فلترة حسب المادة
    if (args.courseId) {
      assignments = assignments.filter((a) => a.courseId === args.courseId);
    }

    if (args.classId) {
      assignments = assignments.filter((a) => 
        a.classIds.some(id => id === args.classId)
      );
    }
    if (args.status) {
      assignments = assignments.filter((a) => a.status === args.status);
    }
    if (args.search && args.search.trim() !== "") {
      const searchLower = args.search.toLowerCase();
      assignments = assignments.filter((a) =>
        a.title.toLowerCase().includes(searchLower) ||
        a.description?.toLowerCase().includes(searchLower)
      );
    }

    // جلب أسماء الفصول لكل واجب
    const assignmentsWithClasses = await Promise.all(
      assignments.map(async (assignment) => {
        const classes = await Promise.all(
          assignment.classIds.map(async (classId) => {
            const classData = await ctx.db.get(classId);
            return classData?.classNameAr || "فصل غير معروف";
          })
        );
        const creator = await ctx.db.get(assignment.createdBy);
        return {
          ...assignment,
          classNames: classes,
          creatorName: creator?.name || "غير معروف",
          submissionsCount: 0,
        };
      })
    );

    return assignmentsWithClasses.sort((a, b) => b.createdAt - a.createdAt);
  },
});

// جلب واجب بواسطة ID
export const getAssignmentById = query({
  args: { assignmentId: v.id("assignments") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("غير مصرح");

    const assignment = await ctx.db.get(args.assignmentId);
    if (!assignment) throw new Error("الواجب غير موجود");

    // ✅ جلب الفصول
    const classes = await Promise.all(
      assignment.classIds.map(async (classId) => {
        const classData = await ctx.db.get(classId);
        return classData;
      })
    );

    const creator = await ctx.db.get(assignment.createdBy);

    // ✅ جلب اسم المادة
    let courseName = null;
    if (assignment.courseId) {
      const course = await ctx.db.get(assignment.courseId);
      courseName = course?.title || null;
    }

    // ✅ جلب تفاصيل الأسئلة
    let questionDetails: any[] = [];
    if (assignment.questions && assignment.questions.length > 0) {
      questionDetails = await Promise.all(
        assignment.questions.map(async (qId) => {
          const q = await ctx.db.get(qId);
          return q;
        })
      );
      questionDetails = questionDetails.filter((q): q is NonNullable<typeof q> => q !== null && q !== undefined);
    }

    return {
      ...assignment,
      classes: classes.filter((c): c is NonNullable<typeof c> => c !== null && c !== undefined),
      creatorName: creator?.name || "غير معروف",
      courseName: courseName,
      questionDetails: questionDetails, // ✅ إضافة تفاصيل الأسئلة
    };
  },
});

// جلب واجبات الفصل
export const getClassAssignments = query({
  args: {
    classId: v.id("classes"),
    status: v.optional(
      v.union(
        v.literal("draft"),
        v.literal("published"),
        v.literal("archived"),
      ),
    ),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("غير مصرح");

    const allAssignments = await ctx.db.query("assignments").collect();

    let assignments = allAssignments.filter((a) =>
      a.classIds.some((id) => id === args.classId),
    );

    if (args.status) {
      assignments = assignments.filter((a) => a.status === args.status);
    }

    return assignments.sort((a, b) => b.dueDate - a.dueDate);
  },
});

// إحصائيات الواجبات
export const getAssignmentsStats = query({
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

    const allAssignments = await ctx.db.query("assignments").collect();

    const published = allAssignments.filter(
      (a) => a.status === "published",
    ).length;
    const draft = allAssignments.filter((a) => a.status === "draft").length;
    const archived = allAssignments.filter(
      (a) => a.status === "archived",
    ).length;

    const upcoming = allAssignments.filter(
      (a) => a.status === "published" && a.dueDate > Date.now(),
    ).length;

    const overdue = allAssignments.filter(
      (a) => a.status === "published" && a.dueDate < Date.now(),
    ).length;

    return {
      total: allAssignments.length,
      published,
      draft,
      archived,
      upcoming,
      overdue,
    };
  },
});

// ✅ جلب واجبات الطالب مع حالة التسليم
export const getStudentAssignments = query({
  args: {
    status: v.optional(
      v.union(
        v.literal("all"),
        v.literal("pending"),
        v.literal("submitted"),
        v.literal("graded"),
      ),
    ),
    subjectId: v.optional(v.id("courses")),
    sortBy: v.optional(v.union(v.literal("dueDate"), v.literal("createdAt"))),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("غير مصرح");

    const student = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!student || student.role !== "student") {
      throw new Error("مطلوب صلاحيات طالب");
    }

    // جلب الفصول المسجل فيها الطالب
    const enrollments = await ctx.db
      .query("enrollments")
      .withIndex("by_student", (q) => q.eq("studentId", student._id))
      .collect();

    const courseIds = enrollments.map((e) => e.courseId);

    // جلب كل الواجبات
    let allAssignments = await ctx.db.query("assignments").collect();

    // ✅ فلترة الواجبات المنشورة فقط (published)
    allAssignments = allAssignments.filter((a) => a.status === "published");

    // فلترة الواجبات حسب الكورسات المسجل فيها الطالب
    let assignments = allAssignments.filter(
      (a) => a.courseId && courseIds.includes(a.courseId),
    );

    // إذا لم يجد واجبات، حاول جلب الواجبات حسب الفصل
    if (assignments.length === 0 && student.classId) {
      assignments = allAssignments.filter(
        (a) => a.classIds && a.classIds.includes(student.classId!),
      );
    }

    // جلب التسليمات الخاصة بالطالب
    const submissions = await ctx.db
      .query("submissions")
      .withIndex("by_student", (q) => q.eq("studentId", student._id))
      .collect();

    // تجميع البيانات
    const assignmentsWithStatus = await Promise.all(
      assignments.map(async (assignment) => {
        const submission = submissions.find(
          (s) => s.assignmentId === assignment._id,
        );

        const course = assignment.courseId
          ? await ctx.db.get(assignment.courseId)
          : null;

        const classData = await Promise.all(
          assignment.classIds?.map((id) => ctx.db.get(id)) || [],
        );

        let status: "pending" | "submitted" | "graded" = "pending";
        if (submission) {
          if (submission.grade !== undefined && submission.grade !== null) {
            status = "graded";
          } else {
            status = "submitted";
          }
        }

        return {
          ...assignment,
          submission,
          status,
          course: course
            ? {
                _id: course._id,
                title: course.title,
              }
            : null,
          classes: classData
            .filter(
              (c): c is NonNullable<typeof c> => c !== null && c !== undefined,
            )
            .map((c) => ({
              _id: c._id,
              classNameAr: c.classNameAr,
            })),
          isLate: submission?.submittedAt
            ? submission.submittedAt > assignment.dueDate
            : false,
        };
      }),
    );

    let filtered = assignmentsWithStatus;

    if (args.status && args.status !== "all") {
      filtered = filtered.filter((a) => a.status === args.status);
    }

    if (args.subjectId) {
      filtered = filtered.filter((a) => a.course?._id === args.subjectId);
    }

    if (args.sortBy === "dueDate") {
      filtered.sort((a, b) => a.dueDate - b.dueDate);
    } else {
      filtered.sort((a, b) => b.createdAt - a.createdAt);
    }

    return filtered;
  },
});

// ✅ إحصائيات الواجبات للطالب
export const getStudentAssignmentStats = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("غير مصرح");

    const student = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!student || student.role !== "student") {
      throw new Error("مطلوب صلاحيات طالب");
    }

    // جلب الفصول المسجل فيها الطالب
    const enrollments = await ctx.db
      .query("enrollments")
      .withIndex("by_student", (q) => q.eq("studentId", student._id))
      .collect();

    const courseIds = enrollments.map((e) => e.courseId);

    let allAssignments = await ctx.db.query("assignments").collect();
    allAssignments = allAssignments.filter((a) => a.status === "published");

    let assignments = allAssignments.filter(
      (a) => a.courseId && courseIds.includes(a.courseId),
    );

    if (assignments.length === 0 && student.classId) {
      assignments = allAssignments.filter(
        (a) => a.classIds && a.classIds.includes(student.classId!),
      );
    }

    const submissions = await ctx.db
      .query("submissions")
      .withIndex("by_student", (q) => q.eq("studentId", student._id))
      .collect();

    let total = assignments.length;
    let pending = 0;
    let submitted = 0;
    let graded = 0;
    let totalGrades = 0;
    let gradedCount = 0;

    for (const assignment of assignments) {
      const submission = submissions.find(
        (s) => s.assignmentId === assignment._id,
      );

      if (submission) {
        if (submission.grade !== undefined && submission.grade !== null) {
          graded++;
          totalGrades += submission.grade;
          gradedCount++;
        } else {
          submitted++;
        }
      } else {
        pending++;
      }
    }

    const averageGrade = gradedCount > 0 ? totalGrades / gradedCount : 0;

    return {
      total,
      pending,
      submitted,
      graded,
      averageGrade: Math.round(averageGrade * 100) / 100,
    };
  },
});

// ============================================
// HELPER FUNCTIONS
// ============================================

// ✅ دالة مساعدة لتسجيل الطلاب في الكورسات (تُستخدم داخلياً فقط)
async function enrollStudentsInCourseHelper(
  ctx: any,
  courseId: Id<"courses">,
  classIds: Id<"classes">[],
) {
  const allStudents: Id<"users">[] = [];

  for (const classId of classIds) {
    const classData = await ctx.db.get(classId);
    if (classData) {
      const students = classData.students || [];
      const studentsByClass = await ctx.db
        .query("users")
        .withIndex("by_classId", (q: any) => q.eq("classId", classId))
        .collect();

      const studentIds = studentsByClass.map((s: any) => s._id);
      allStudents.push(...students, ...studentIds);
    }
  }

  const uniqueStudentIds = [...new Set(allStudents)];

  const existingEnrollments = await ctx.db
    .query("enrollments")
    .withIndex("by_class", (q: any) => q.eq("classId", classIds[0]))
    .collect();

  const enrollmentMap = new Map();
  for (const enrollment of existingEnrollments) {
    enrollmentMap.set(enrollment.studentId, enrollment);
  }

  let enrolledCount = 0;
  let updatedCount = 0;

  for (const studentId of uniqueStudentIds) {
    const existing = enrollmentMap.get(studentId);

    if (existing) {
      if (existing.courseId !== courseId) {
        await ctx.db.patch(existing._id, {
          courseId: courseId,
        });
        updatedCount++;
      }
      continue;
    }

    await ctx.db.insert("enrollments", {
      studentId,
      classId: classIds[0],
      courseId: courseId,
      enrolledAt: Date.now(),
      status: "active",
    });
    enrolledCount++;
  }

  return {
    success: true,
    newEnrollments: enrolledCount,
    updatedEnrollments: updatedCount,
    totalStudents: uniqueStudentIds.length,
  };
}

// ============================================
// MUTATIONS
// ============================================

// ✅ إنشاء واجب جديد
export const createAssignment = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    classIds: v.array(v.id("classes")),
    type: v.union(
      v.literal("assignment"),
      v.literal("quiz"),
      v.literal("exam"),
      v.literal("project"),
    ),
    questions: v.optional(v.array(v.id("questions"))), // ✅ إضافة
    maxAttempts: v.optional(v.number()),
    allowResubmission: v.boolean(),
    isGroupWork: v.boolean(),
    maxGroupSize: v.optional(v.number()),
    showGrade: v.boolean(),
    location: v.optional(v.string()),
    logic: v.optional(v.string()),
    startDate: v.number(),
    dueDate: v.number(),
    fullGrade: v.float64(),
    weight: v.number(),
    passingGrade: v.number(),
    allowLateSubmission: v.boolean(),
    lateSubmissionPenalty: v.optional(v.number()),
    attachments: v.array(
      v.object({
        name: v.string(),
        url: v.string(),
        size: v.number(),
        type: v.string(),
      }),
    ),
    allowedFileTypes: v.array(v.string()),
    maxFileSize: v.optional(v.number()),
    status: v.union(
      v.literal("draft"),
      v.literal("published"),
      v.literal("archived"),
    ),
    courseId: v.id("courses"),
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

    // التحقق من وجود الفصول
    for (const classId of args.classIds) {
      const classData = await ctx.db.get(classId);
      if (!classData) {
        throw new Error(`الفصل غير موجود: ${classId}`);
      }
    }

    const assignmentId = await ctx.db.insert("assignments", {
      title: args.title,
      description: args.description,
      classIds: args.classIds,
      type: args.type,
      questions: args.questions || [], // ✅ إضافة
      maxAttempts: args.maxAttempts,
      allowResubmission: args.allowResubmission,
      isGroupWork: args.isGroupWork,
      maxGroupSize: args.maxGroupSize,
      showGrade: args.showGrade,
      location: args.location,
      logic: args.logic,
      startDate: args.startDate,
      dueDate: args.dueDate,
      weight: args.weight,
      fullGrade: args.fullGrade,
      passingGrade: args.passingGrade,
      allowLateSubmission: args.allowLateSubmission,
      lateSubmissionPenalty: args.lateSubmissionPenalty,
      attachments: args.attachments,
      allowedFileTypes: args.allowedFileTypes,
      maxFileSize: args.maxFileSize,
      status: args.status,
      courseId: args.courseId,
      createdBy: user._id,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      publishedAt: args.status === "published" ? Date.now() : undefined,
    });

    // ✅ إذا كان الواجب منشوراً، سجل الطلاب في الكورس
    if (args.status === "published") {
      try {
        const result = await enrollStudentsInCourseHelper(
          ctx,
          args.courseId,
          args.classIds,
        );
        console.log("✅ Enrollment result:", result);
      } catch (error) {
        console.error("❌ Error enrolling students:", error);
        // لا نمنع إنشاء الواجب إذا فشل التسجيل
      }
    }

    return { success: true, assignmentId };
  },
});

// ✅ تحديث واجب
export const updateAssignment = mutation({
  args: {
    assignmentId: v.id("assignments"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    classIds: v.optional(v.array(v.id("classes"))),
    questions: v.optional(v.array(v.id("questions"))), // ✅ إضافة
    type: v.optional(
      v.union(
        v.literal("assignment"),
        v.literal("quiz"),
        v.literal("exam"),
        v.literal("project"),
      ),
    ),
    maxAttempts: v.optional(v.number()),
    allowResubmission: v.optional(v.boolean()),
    isGroupWork: v.optional(v.boolean()),
    maxGroupSize: v.optional(v.number()),
    showGrade: v.optional(v.boolean()),
    location: v.optional(v.string()),
    logic: v.optional(v.string()),
    startDate: v.optional(v.number()),
    dueDate: v.optional(v.number()),
    weight: v.optional(v.number()),
    fullGrade: v.optional(v.float64()),
    courseId: v.optional(v.id("courses")),
    passingGrade: v.optional(v.number()),
    allowLateSubmission: v.optional(v.boolean()),
    lateSubmissionPenalty: v.optional(v.number()),
    attachments: v.optional(
      v.array(
        v.object({
          name: v.string(),
          url: v.string(),
          size: v.number(),
          type: v.string(),
        }),
      ),
    ),
    allowedFileTypes: v.optional(v.array(v.string())),
    maxFileSize: v.optional(v.number()),
    status: v.optional(
      v.union(
        v.literal("draft"),
        v.literal("published"),
        v.literal("archived"),
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

    const assignment = await ctx.db.get(args.assignmentId);
    if (!assignment) throw new Error("الواجب غير موجود");

    const updateData: any = { updatedAt: Date.now() };
    if (args.title !== undefined) updateData.title = args.title;
    if (args.description !== undefined)
      updateData.description = args.description;
    if (args.classIds !== undefined) updateData.classIds = args.classIds;
    if (args.questions !== undefined) updateData.questions = args.questions;
    if (args.type !== undefined) updateData.type = args.type;
    if (args.maxAttempts !== undefined)
      updateData.maxAttempts = args.maxAttempts;
    if (args.allowResubmission !== undefined)
      updateData.allowResubmission = args.allowResubmission;
    if (args.isGroupWork !== undefined)
      updateData.isGroupWork = args.isGroupWork;
    if (args.maxGroupSize !== undefined)
      updateData.maxGroupSize = args.maxGroupSize;
    if (args.showGrade !== undefined) updateData.showGrade = args.showGrade;
    if (args.location !== undefined) updateData.location = args.location;
    if (args.logic !== undefined) updateData.logic = args.logic;
    if (args.startDate !== undefined) updateData.startDate = args.startDate;
    if (args.dueDate !== undefined) updateData.dueDate = args.dueDate;
    if (args.weight !== undefined) updateData.weight = args.weight;
    if (args.fullGrade !== undefined) updateData.fullGrade = args.fullGrade;
    if (args.passingGrade !== undefined)
      updateData.passingGrade = args.passingGrade;
    if (args.courseId !== undefined) updateData.courseId = args.courseId;
    if (args.allowLateSubmission !== undefined)
      updateData.allowLateSubmission = args.allowLateSubmission;
    if (args.lateSubmissionPenalty !== undefined)
      updateData.lateSubmissionPenalty = args.lateSubmissionPenalty;
    if (args.attachments !== undefined)
      updateData.attachments = args.attachments;
    if (args.allowedFileTypes !== undefined)
      updateData.allowedFileTypes = args.allowedFileTypes;
    if (args.maxFileSize !== undefined)
      updateData.maxFileSize = args.maxFileSize;
    if (args.status !== undefined) {
      updateData.status = args.status;
      if (args.status === "published" && assignment.status !== "published") {
        updateData.publishedAt = Date.now();
        // ✅ إذا تم النشر، سجل الطلاب في الكورس
        try {
          await enrollStudentsInCourseHelper(
            ctx,
            args.courseId || assignment.courseId,
            args.classIds || assignment.classIds,
          );
        } catch (error) {
          console.error("Error enrolling students on publish:", error);
        }
      }
    }

    await ctx.db.patch(args.assignmentId, updateData);

    return { success: true };
  },
});

// حذف واجب
export const deleteAssignment = mutation({
  args: { assignmentId: v.id("assignments") },
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

    const assignment = await ctx.db.get(args.assignmentId);
    if (!assignment) throw new Error("الواجب غير موجود");

    const submissions = await ctx.db
      .query("submissions")
      .withIndex("by_assignment", (q) =>
        q.eq("assignmentId", args.assignmentId),
      )
      .collect();

    if (submissions.length > 0) {
      throw new Error("لا يمكن حذف الواجب لأنه يوجد تسليمات مرتبطة به");
    }

    await ctx.db.delete(args.assignmentId);

    return { success: true };
  },
});

// نشر واجب
export const publishAssignment = mutation({
  args: { assignmentId: v.id("assignments") },
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

    const assignment = await ctx.db.get(args.assignmentId);
    if (!assignment) throw new Error("الواجب غير موجود");

    await ctx.db.patch(args.assignmentId, {
      status: "published",
      publishedAt: Date.now(),
      updatedAt: Date.now(),
    });

    // ✅ تسجيل الطلاب في الكورس عند النشر
    try {
      await enrollStudentsInCourseHelper(
        ctx,
        assignment.courseId,
        assignment.classIds,
      );
    } catch (error) {
      console.error("Error enrolling students on publish:", error);
    }

    return { success: true };
  },
});

// ✅ دالة لتسجيل الطلاب في الكورسات (للاستخدام من الـ frontend)
export const enrollStudentsInCourse = mutation({
  args: {
    courseId: v.id("courses"),
    classIds: v.array(v.id("classes")),
  },
  handler: async (ctx, args) => {
    return await enrollStudentsInCourseHelper(
      ctx,
      args.courseId,
      args.classIds,
    );
  },
});

// ✅ تصدير جميع الدوال
export const assignments = {
  getAssignments,
  getAssignmentById,
  getClassAssignments,
  getAssignmentsStats,
  getStudentAssignments,
  getStudentAssignmentStats,
  createAssignment,
  updateAssignment,
  deleteAssignment,
  publishAssignment,
  enrollStudentsInCourse,
};
