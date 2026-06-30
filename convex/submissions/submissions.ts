// convex/submissions.ts
import { v } from "convex/values";
import { mutation, query } from "../_generated/server";
import { Id } from "../_generated/dataModel";

// ============================================
// QUERIES
// ============================================

// جلب جميع تسليمات واجب معين
export const getSubmissionsByAssignment = query({
  args: {
    assignmentId: v.id("assignments"),
    studentId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("غير مصرح");

    // التحقق من صلاحيات المعلم أو الطالب
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) throw new Error("المستخدم غير موجود");

    let submissions = await ctx.db
      .query("submissions")
      .withIndex("by_assignment", (q) =>
        q.eq("assignmentId", args.assignmentId),
      )
      .collect();

    // إذا كان طالب، جلب تسليماته فقط
    if (user.role === "student") {
      submissions = submissions.filter((s) => s.studentId === user._id);
    }

    // فلترة حسب الطالب إذا تم تحديده
    if (args.studentId && (user.role === "admin" || user.role === "teacher")) {
      submissions = submissions.filter((s) => s.studentId === args.studentId);
    }

    // جلب بيانات الطلاب
    const submissionsWithStudent = await Promise.all(
      submissions.map(async (submission) => {
        const student = await ctx.db.get(submission.studentId);
        return {
          ...submission,
          studentName: student?.name || "طالب غير معروف",
          studentId: student?._id,
        };
      }),
    );

    return submissionsWithStudent.sort((a, b) => b.submittedAt - a.submittedAt);
  },
});

// جلب تسليمات طالب معين
export const getStudentSubmissions = query({
  args: {
    studentId: v.id("users"),
    assignmentId: v.optional(v.id("assignments")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("غير مصرح");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) throw new Error("المستخدم غير موجود");

    // السماح للطالب برؤية تسليماته فقط
    if (user.role === "student" && user._id !== args.studentId) {
      throw new Error("غير مصرح لك برؤية تسليمات طالب آخر");
    }

    let submissions = await ctx.db
      .query("submissions")
      .withIndex("by_student", (q) => q.eq("studentId", args.studentId))
      .collect();

    if (args.assignmentId) {
      submissions = submissions.filter(
        (s) => s.assignmentId === args.assignmentId,
      );
    }

    // جلب بيانات الواجبات
    const submissionsWithAssignment = await Promise.all(
      submissions.map(async (submission) => {
        const assignment = await ctx.db.get(submission.assignmentId);
        return {
          ...submission,
          assignmentTitle: assignment?.title || "واجب غير معروف",
          assignmentDueDate: assignment?.dueDate,
        };
      }),
    );

    return submissionsWithAssignment.sort(
      (a, b) => b.submittedAt - a.submittedAt,
    );
  },
});

// جلب تسليم واحد محدد
export const getSubmissionById = query({
  args: { submissionId: v.id("submissions") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("غير مصرح");

    const submission = await ctx.db.get(args.submissionId);
    if (!submission) throw new Error("التسليم غير موجود");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) throw new Error("المستخدم غير موجود");

    // التحقق من الصلاحيات
    if (user.role === "student" && user._id !== submission.studentId) {
      throw new Error("غير مصرح لك برؤية هذا التسليم");
    }

    const student = await ctx.db.get(submission.studentId);
    const assignment = await ctx.db.get(submission.assignmentId);

    return {
      ...submission,
      studentName: student?.name || "طالب غير معروف",
      assignmentTitle: assignment?.title || "واجب غير معروف",
    };
  },
});

// التحقق من وجود تسليم سابق
export const hasSubmitted = query({
  args: {
    assignmentId: v.id("assignments"),
    studentId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const submissions = await ctx.db
      .query("submissions")
      .withIndex("by_assignment_student", (q) =>
        q.eq("assignmentId", args.assignmentId).eq("studentId", args.studentId),
      )
      .collect();

    return submissions.length > 0;
  },
});

// ============================================
// MUTATIONS
// ============================================

// تسليم واجب
export const submitAssignment = mutation({
  args: {
    assignmentId: v.id("assignments"),
    classId: v.id("classes"),
    content: v.optional(v.string()),
    attachments: v.array(
      v.object({
        name: v.string(),
        url: v.string(),
        size: v.number(),
        type: v.string(),
      }),
    ),
    answers: v.optional(
      v.array(
        v.object({
          questionId: v.id("questions"),
          answer: v.string(),
        })
      )
    ),
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

    // التحقق من وجود الواجب
    const assignment = await ctx.db.get(args.assignmentId);
    if (!assignment) throw new Error("الواجب غير موجود");

    // التحقق من وجود الفصل
    const classData = await ctx.db.get(args.classId);
    if (!classData) throw new Error("الفصل غير موجود");

    // التحقق من أن الطالب مسجل في الفصل
    if (!classData.students.includes(student._id)) {
      throw new Error("أنت غير مسجل في هذا الفصل");
    }

    // التحقق من عدم وجود تسليم سابق (إذا كان مسموح بمحاولة واحدة)
    const existingSubmissions = await ctx.db
      .query("submissions")
      .withIndex("by_assignment_student", (q) =>
        q.eq("assignmentId", args.assignmentId).eq("studentId", student._id),
      )
      .collect();

    if (existingSubmissions.length > 0 && !assignment.allowResubmission) {
      throw new Error(
        "لقد قمت بتسليم هذا الواجب مسبقاً ولا يسمح بإعادة التسليم",
      );
    }

    const attemptNumber = existingSubmissions.length + 1;
    const isLate = Date.now() > assignment.dueDate;

    // التحقق من حجم الملفات
    if (assignment.maxFileSize) {
      const maxSize = assignment.maxFileSize * 1024 * 1024; // تحويل من MB إلى bytes
      for (const attachment of args.attachments) {
        if (attachment.size > maxSize) {
          throw new Error(
            `حجم الملف ${attachment.name} يتجاوز الحد الأقصى المسموح به`,
          );
        }
      }
    }

    // التحقق من أنواع الملفات
    if (assignment.allowedFileTypes.length > 0) {
      for (const attachment of args.attachments) {
        const fileType = attachment.type;
        const isValid = assignment.allowedFileTypes.some(
          (allowed) =>
            fileType.includes(allowed) ||
            attachment.name.toLowerCase().endsWith(allowed.toLowerCase()),
        );
        if (!isValid) {
          throw new Error(`نوع الملف ${attachment.name} غير مسموح به`);
        }
      }
    }

    // حساب الدرجة النهائية مع خصم التأخير
    let finalGrade = undefined;
    let status: "submitted" | "late" = isLate ? "late" : "submitted";

    // إذا كان متأخر والسماح بالتسليم المتأخر موجود
    if (isLate && assignment.allowLateSubmission) {
      status = "late";
    }

    const submissionId = await ctx.db.insert("submissions", {
      assignmentId: args.assignmentId,
      studentId: student._id,
      classId: args.classId,
      submittedAt: Date.now(),
      content: args.content,
      attachments: args.attachments,
      answers: args.answers || [], // ✅ تخزين الإجابات
      status: status,
      attemptNumber: attemptNumber,
      isLate: isLate,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return {
      success: true,
      submissionId,
      isLate,
      attemptNumber,
    };
  },
});

// تصحيح تسليم (للمعلمين)
export const gradeSubmission = mutation({
  args: {
    submissionId: v.id("submissions"),
    grade: v.number(),
    feedback: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("غير مصرح");

    const teacher = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!teacher || (teacher.role !== "admin" && teacher.role !== "teacher")) {
      throw new Error("مطلوب صلاحيات معلم أو مشرف");
    }

    const submission = await ctx.db.get(args.submissionId);
    if (!submission) throw new Error("التسليم غير موجود");

    // التحقق من أن المعلم لديه صلاحية على هذا الفصل
    const classData = await ctx.db.get(submission.classId);
    if (!classData) throw new Error("الفصل غير موجود");

    if (teacher.role === "teacher") {
      const isTeacherOfClass =
        classData.teachers?.includes(teacher._id) ||
        classData.supervisorId === teacher._id;
      if (!isTeacherOfClass) {
        throw new Error("غير مصرح لك بتصحيح هذا التسليم");
      }
    }

    // التحقق من أن الدرجة لا تتجاوز الدرجة الكاملة
    const assignment = await ctx.db.get(submission.assignmentId);
    if (assignment && args.grade > assignment.fullGrade) {
      throw new Error(`الدرجة لا يمكن أن تتجاوز ${assignment.fullGrade}`);
    }

    await ctx.db.patch(args.submissionId, {
      grade: args.grade,
      feedback: args.feedback,
      gradedBy: teacher._id,
      gradedAt: Date.now(),
      status: "graded",
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

// إعادة تسليم واجب (للطلاب)
export const resubmitAssignment = mutation({
  args: {
    submissionId: v.id("submissions"),
    content: v.optional(v.string()),
    attachments: v.array(
      v.object({
        name: v.string(),
        url: v.string(),
        size: v.number(),
        type: v.string(),
      }),
    ),
     answers: v.optional(
      v.array(
        v.object({
          questionId: v.id("questions"),
          answer: v.string(),
        })
      )
    ),
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

    const existingSubmission = await ctx.db.get(args.submissionId);
    if (!existingSubmission) throw new Error("التسليم غير موجود");

    // التحقق من ملكية التسليم
    if (existingSubmission.studentId !== student._id) {
      throw new Error("غير مصرح لك بإعادة تسليم هذا الواجب");
    }

    // التحقق من السماح بإعادة التسليم
    const assignment = await ctx.db.get(existingSubmission.assignmentId);
    if (!assignment || !assignment.allowResubmission) {
      throw new Error("لا يسمح بإعادة تسليم هذا الواجب");
    }

    // التحقق من أن الواجب لم يتم تصحيحه بعد
    if (existingSubmission.status === "graded") {
      throw new Error("لا يمكن إعادة التسليم بعد التصحيح");
    }

    // حذف التسليم القديم وإنشاء جديد
    await ctx.db.delete(args.submissionId);

    const newSubmissionId = await ctx.db.insert("submissions", {
      assignmentId: existingSubmission.assignmentId,
      studentId: student._id,
      classId: existingSubmission.classId,
      submittedAt: Date.now(),
      content: args.content,
      attachments: args.attachments,
       answers: args.answers || [], // ✅ تخزين الإجابات
      status: "submitted",
      attemptNumber: existingSubmission.attemptNumber + 1,
      isLate: Date.now() > assignment.dueDate,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return {
      success: true,
      submissionId: newSubmissionId,
      attemptNumber: existingSubmission.attemptNumber + 1,
    };
  },
});

// إرجاع تسليم للطالب (للمعلمين)
export const returnSubmission = mutation({
  args: {
    submissionId: v.id("submissions"),
    feedback: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("غير مصرح");

    const teacher = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!teacher || (teacher.role !== "admin" && teacher.role !== "teacher")) {
      throw new Error("مطلوب صلاحيات معلم أو مشرف");
    }

    const submission = await ctx.db.get(args.submissionId);
    if (!submission) throw new Error("التسليم غير موجود");

    await ctx.db.patch(args.submissionId, {
      status: "returned",
      feedback: args.feedback,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});
