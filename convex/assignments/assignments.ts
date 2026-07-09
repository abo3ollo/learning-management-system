import { v } from "convex/values";
import { mutation, query } from "../_generated/server";
import { Id } from "../_generated/dataModel";

// ============================================
// QUERIES
// ============================================

// جلب جميع الواجبات
// convex/assignments/assignments.ts

export const getAssignments = query({
  args: {
    classId: v.optional(v.id("classes")),
    status: v.optional(v.union(v.literal("draft"), v.literal("published"), v.literal("archived"))),
    search: v.optional(v.string()),
    gradeId: v.optional(v.id("grades")),
    groupId: v.optional(v.id("groups")),
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

    // ✅ فلترة حسب الصف
    if (args.gradeId) {
      assignments = assignments.filter((a) => a.gradeId === args.gradeId);
    }

    // ✅ فلترة حسب المجموعة - التحقق من وجود args.groupId
    if (args.groupId) {
      assignments = assignments.filter((a) => 
        a.groupIds && a.groupIds.some(id => id === args.groupId)
      );
    }

    if (args.classId) {
      assignments = assignments.filter((a) => 
        a.classIds && a.classIds.some(id => id === args.classId)
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

    // جلب أسماء الفصول والمجموعات والصف لكل واجب
    const assignmentsWithDetails = await Promise.all(
      assignments.map(async (assignment) => {
        // جلب أسماء الفصول (للتوافق القديم)
        const classes = await Promise.all(
          (assignment.classIds || []).map(async (classId) => {
            const classData = await ctx.db.get(classId);
            return classData?.classNameAr || "فصل غير معروف";
          })
        );

        // جلب أسماء المجموعات
        const groupNames = await Promise.all(
          (assignment.groupIds || []).map(async (groupId) => {
            const group = await ctx.db.get(groupId);
            return group?.name || "مجموعة غير معروفة";
          })
        );

        // جلب اسم الصف
        let gradeName = "غير محدد";
        if (assignment.gradeId) {
          const grade = await ctx.db.get(assignment.gradeId);
          if (grade) {
            gradeName = grade.name;
          }
        }

        const creator = await ctx.db.get(assignment.createdBy);
        
        return {
          ...assignment,
          classNames: classes,
          groupNames: groupNames,
          gradeName: gradeName,
          creatorName: creator?.name || "غير معروف",
          submissionsCount: 0,
        };
      })
    );

    return assignmentsWithDetails.sort((a, b) => b.createdAt - a.createdAt);
  },
});


// ✅ دالة جديدة للفلترة المتقدمة
export const getFilteredAssignments = query({
  args: {
    status: v.optional(v.union(v.literal("draft"), v.literal("published"), v.literal("archived"))),
    search: v.optional(v.string()),
    gradeId: v.optional(v.id("grades")),
    groupId: v.optional(v.id("groups")),
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

    if (args.gradeId) {
      assignments = assignments.filter((a) => a.gradeId === args.gradeId);
    }

    if (args.groupId) {
      assignments = assignments.filter((a) => 
        a.groupIds && a.groupIds.some(id => id === args.groupId)
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

    // جلب بيانات إضافية
    const assignmentsWithDetails = await Promise.all(
      assignments.map(async (assignment) => {
        const groupNames = await Promise.all(
          (assignment.groupIds || []).map(async (groupId) => {
            const group = await ctx.db.get(groupId);
            return group?.name || "مجموعة غير معروفة";
          })
        );

        let gradeName = "غير محدد";
        if (assignment.gradeId) {
          const grade = await ctx.db.get(assignment.gradeId);
          if (grade) {
            gradeName = grade.name;
          }
        }

        return {
          ...assignment,
          groupNames: groupNames,
          gradeName: gradeName,
        };
      })
    );

    return assignmentsWithDetails.sort((a, b) => b.createdAt - a.createdAt);
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
      (assignment.classIds || []).map(async (classId) => {
        const classData = await ctx.db.get(classId);
        return classData;
      })
    );

    // ✅ جلب المجموعات
    const groups = await Promise.all(
      (assignment.groupIds || []).map(async (groupId: Id<"groups">) => {
        const group = await ctx.db.get(groupId);
        return group;
      })
    );

    // ✅ جلب الصف
    const grade = assignment.gradeId ? await ctx.db.get(assignment.gradeId) : null;

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
      groups: groups.filter((g): g is NonNullable<typeof g> => g !== null && g !== undefined),
      grade: grade,
      creatorName: creator?.name || "غير معروف",
      courseName: courseName,
      questionDetails: questionDetails,
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
      a.classIds && a.classIds.some((id) => id === args.classId)
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
    groupId: v.optional(v.id("groups")), // ✅ إضافة فلتر المجموعة (بدلاً من subjectId)
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

    // جلب المجموعات المسجل فيها الطالب
    const allGroups = await ctx.db.query("groups").collect();
    const studentGroupIds = allGroups
      .filter((g) => g.students && g.students.includes(student._id))
      .map((g) => g._id);

    // جلب كل الواجبات
    let allAssignments = await ctx.db.query("assignments").collect();

    // فلترة الواجبات المنشورة فقط
    allAssignments = allAssignments.filter((a) => a.status === "published");

    // فلترة الواجبات حسب المجموعات والصف
    let assignments = allAssignments.filter((a) => {
      // إذا كان الواجب له مجموعات محددة
      if (a.groupIds && a.groupIds.length > 0) {
        return a.groupIds.some(id => studentGroupIds.includes(id));
      }
      // إذا كان الواجب للصف كامل
      if (a.gradeId && student.gradeId && a.gradeId === student.gradeId) {
        return true;
      }
      // للتوافق القديم - classIds
      if (a.classIds && a.classIds.length > 0) {
        return a.classIds.some(id => student.classId === id);
      }
      return false;
    });

    // ✅ فلترة حسب المجموعة المحددة (إذا وجدت)
    if (args.groupId) {
      assignments = assignments.filter((a) => 
        a.groupIds && a.groupIds.some(id => id === args.groupId)
      );
    }

    // جلب التسليمات الخاصة بالطالب
    const submissions = await ctx.db
      .query("submissions")
      .withIndex("by_student", (q) => q.eq("studentId", student._id))
      .collect();

    // تجميع البيانات مع تفاصيل إضافية
    const assignmentsWithStatus = await Promise.all(
      assignments.map(async (assignment) => {
        const submission = submissions.find(
          (s) => s.assignmentId === assignment._id,
        );

        // ✅ جلب اسم الصف
        let gradeName = "غير محدد";
        if (assignment.gradeId) {
          const grade = await ctx.db.get(assignment.gradeId);
          if (grade) {
            gradeName = grade.name;
          }
        }

        // ✅ جلب أسماء المجموعات
        const groupNames = await Promise.all(
          (assignment.groupIds || []).map(async (groupId) => {
            const group = await ctx.db.get(groupId);
            return group?.name || "مجموعة غير معروفة";
          })
        );

        // ✅ جلب تفاصيل المجموعات (للمادة)
        const groups = await Promise.all(
          (assignment.groupIds || []).map(async (groupId) => {
            const group = await ctx.db.get(groupId);
            return group;
          })
        );

        const course = assignment.courseId
          ? await ctx.db.get(assignment.courseId)
          : null;

        const classData = await Promise.all(
          (assignment.classIds || []).map((id) => ctx.db.get(id)) || [],
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
          gradeName, // ✅ اسم الصف
          groupNames, // ✅ أسماء المجموعات
          groups: groups.filter(Boolean), // ✅ تفاصيل المجموعات
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

    if (args.sortBy === "dueDate") {
      filtered.sort((a, b) => a.dueDate - b.dueDate);
    } else {
      filtered.sort((a, b) => b.createdAt - a.createdAt);
    }

    return filtered;
  },
});


// ✅ جلب الواجبات القادمة للطالب
export const getUpcomingForStudent = query({
  args: { studentId: v.id("users") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("غير مصرح");

    const student = await ctx.db.get(args.studentId);
    if (!student || student.role !== "student") {
      throw new Error("الطالب غير موجود");
    }

    // جلب جميع الواجبات المنشورة
    const allAssignments = await ctx.db
      .query("assignments")
      .withIndex("by_status", (q) => q.eq("status", "published"))
      .collect();

    // فلترة الواجبات التي تخص الطالب (حسب المجموعة أو الصف)
    const studentAssignments = allAssignments.filter((assignment) => {
      // التحقق من أن الواجب للصف الخاص بالطالب
      if (assignment.gradeId && student.gradeId) {
        return assignment.gradeId === student.gradeId;
      }
      return false;
    });

    // فلترة الواجبات القادمة (تاريخ التسليم في المستقبل)
    const now = Date.now();
    const upcoming = studentAssignments
      .filter((a) => a.dueDate > now)
      .sort((a, b) => a.dueDate - b.dueDate);

    return upcoming;
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

    // جلب المجموعات المسجل فيها الطالب
    const allGroups = await ctx.db.query("groups").collect();
    const studentGroupIds = allGroups
      .filter((g) => g.students && g.students.includes(student._id))
      .map((g) => g._id);

    let allAssignments = await ctx.db.query("assignments").collect();
    allAssignments = allAssignments.filter((a) => a.status === "published");

    let assignments = allAssignments.filter((a) => {
      if (a.groupIds && a.groupIds.length > 0) {
        return a.groupIds.some(id => studentGroupIds.includes(id));
      }
      if (a.gradeId && student.gradeId && a.gradeId === student.gradeId) {
        return true;
      }
      if (a.classIds && a.classIds.length > 0) {
        return a.classIds.some(id => student.classId === id);
      }
      return false;
    });

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

// ✅ دالة مساعدة لتسجيل الطلاب في المجموعات
async function enrollStudentsInGroupHelper(
  ctx: any,
  groupIds: Id<"groups">[],
) {
  if (!groupIds || groupIds.length === 0) {
    console.log("⚠️ No groupIds provided, skipping enrollment");
    return {
      success: true,
      enrolledCount: 0,
      totalStudents: 0,
    };
  }

  const allStudents: Id<"users">[] = [];

  for (const groupId of groupIds) {
    const group = await ctx.db.get(groupId);
    if (group) {
      const students = group.students || [];
      allStudents.push(...students);
    }
  }

  const uniqueStudentIds = [...new Set(allStudents)];

  // تسجيل الطلاب في enrollments (إذا لزم الأمر)
  for (const studentId of uniqueStudentIds) {
    // التحقق من وجود enrollment
    const existing = await ctx.db
      .query("enrollments")
      .withIndex("by_student", (q: any) => q.eq("studentId", studentId))
      .first();

    if (!existing) {
      await ctx.db.insert("enrollments", {
        studentId,
        classId: groupIds[0],
        courseId: undefined,
        enrolledAt: Date.now(),
        status: "active",
      });
    }
  }

  return {
    success: true,
    enrolledCount: uniqueStudentIds.length,
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
    gradeId: v.id("grades"),
    groupIds: v.array(v.id("groups")),
    type: v.union(
      v.literal("assignment"),
      v.literal("quiz"),
      v.literal("exam"),
      v.literal("project"),
    ),
    questions: v.optional(v.array(v.id("questions"))),
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
    if (!grade) {
      throw new Error(`الصف غير موجود: ${args.gradeId}`);
    }

    // ✅ التحقق من وجود المجموعات
    for (const groupId of args.groupIds) {
      const group = await ctx.db.get(groupId);
      if (!group) {
        throw new Error(`المجموعة غير موجودة: ${groupId}`);
      }
      if (group.gradeId !== args.gradeId) {
        throw new Error(`المجموعة ${group.name} ليست تابعة للصف ${grade.name}`);
      }
    }

    const assignmentId = await ctx.db.insert("assignments", {
      title: args.title,
      description: args.description,
      gradeId: args.gradeId,
      groupIds: args.groupIds,
      // Note: do not map group IDs into `classIds` - they are different tables.
      // `classIds` should only contain IDs from the `classes` table.
      type: args.type,
      questions: args.questions || [],
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
      courseId: undefined,
      createdBy: user._id,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      publishedAt: args.status === "published" ? Date.now() : undefined,
    });

    // ✅ إذا كان الواجب منشوراً، سجل الطلاب
    if (args.status === "published") {
      try {
        await enrollStudentsInGroupHelper(ctx, args.groupIds);
      } catch (error) {
        console.error("❌ Error enrolling students:", error);
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
    gradeId: v.optional(v.id("grades")),
    groupIds: v.optional(v.array(v.id("groups"))),
    questions: v.optional(v.array(v.id("questions"))),
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
    if (args.description !== undefined) updateData.description = args.description;
    if (args.gradeId !== undefined) updateData.gradeId = args.gradeId;
    if (args.groupIds !== undefined) {
      updateData.groupIds = args.groupIds;
      // Do NOT set `classIds` from `groupIds` — they reference different tables.
      // Leave `classIds` unchanged to respect the schema (ids must be from `classes`).
    }
    if (args.questions !== undefined) updateData.questions = args.questions;
    if (args.type !== undefined) updateData.type = args.type;
    if (args.maxAttempts !== undefined) updateData.maxAttempts = args.maxAttempts;
    if (args.allowResubmission !== undefined) updateData.allowResubmission = args.allowResubmission;
    if (args.isGroupWork !== undefined) updateData.isGroupWork = args.isGroupWork;
    if (args.maxGroupSize !== undefined) updateData.maxGroupSize = args.maxGroupSize;
    if (args.showGrade !== undefined) updateData.showGrade = args.showGrade;
    if (args.location !== undefined) updateData.location = args.location;
    if (args.logic !== undefined) updateData.logic = args.logic;
    if (args.startDate !== undefined) updateData.startDate = args.startDate;
    if (args.dueDate !== undefined) updateData.dueDate = args.dueDate;
    if (args.weight !== undefined) updateData.weight = args.weight;
    if (args.fullGrade !== undefined) updateData.fullGrade = args.fullGrade;
    if (args.passingGrade !== undefined) updateData.passingGrade = args.passingGrade;
    if (args.allowLateSubmission !== undefined) updateData.allowLateSubmission = args.allowLateSubmission;
    if (args.lateSubmissionPenalty !== undefined) updateData.lateSubmissionPenalty = args.lateSubmissionPenalty;
    if (args.attachments !== undefined) updateData.attachments = args.attachments;
    if (args.allowedFileTypes !== undefined) updateData.allowedFileTypes = args.allowedFileTypes;
    if (args.maxFileSize !== undefined) updateData.maxFileSize = args.maxFileSize;
    if (args.status !== undefined) {
      updateData.status = args.status;
      if (args.status === "published" && assignment.status !== "published") {
        updateData.publishedAt = Date.now();
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

    // ✅ تسجيل الطلاب في المجموعات قبل النشر
    if (assignment.groupIds && assignment.groupIds.length > 0) {
      try {
        await enrollStudentsInGroupHelper(ctx, assignment.groupIds);
      } catch (error) {
        console.error("Error enrolling students on publish:", error);
      }
    }

    await ctx.db.patch(args.assignmentId, {
      status: "published",
      publishedAt: Date.now(),
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

// ✅ دالة لتسجيل الطلاب في المجموعات (للاستخدام من الـ frontend)
export const enrollStudentsInGroups = mutation({
  args: {
    groupIds: v.array(v.id("groups")),
  },
  handler: async (ctx, args) => {
    return await enrollStudentsInGroupHelper(ctx, args.groupIds);
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
  enrollStudentsInGroups,
   getUpcomingForStudent,
};