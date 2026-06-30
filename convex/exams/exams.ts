// convex/exams/exams.ts

import { v } from "convex/values";
import { mutation, query } from "../_generated/server";
import { Id } from "../_generated/dataModel";

// ============================================
// QUERIES
// ============================================

// ✅ جلب جميع الامتحانات
export const getExams = query({
  args: {
    status: v.optional(v.union(
      v.literal("draft"),
      v.literal("published"),
      v.literal("archived"),
    )),
    courseId: v.optional(v.id("courses")),
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

    let exams = await ctx.db.query("exams").collect();

    if (args.status) {
      exams = exams.filter((e) => e.status === args.status);
    }
    if (args.courseId) {
      exams = exams.filter((e) => e.courseId === args.courseId);
    }
    if (args.search) {
      const searchLower = args.search.toLowerCase();
      exams = exams.filter((e) =>
        e.title.toLowerCase().includes(searchLower) ||
        e.subject.toLowerCase().includes(searchLower)
      );
    }

    // جلب معلومات إضافية
    const examsWithDetails = await Promise.all(
      exams.map(async (exam) => {
        const creator = await ctx.db.get(exam.createdBy);
        
        // جلب عدد الطلاب الذين سلموا
        const submissions = await ctx.db
          .query("examSubmissions")
          .withIndex("by_exam", (q) => q.eq("examId", exam._id))
          .collect();

        return {
          ...exam,
          questionsCount: exam.questions.length,
          submissionsCount: submissions.length,
          creatorName: creator?.name || "غير معروف",
        };
      })
    );

    return examsWithDetails.sort((a, b) => b.createdAt - a.createdAt);
  },
});

// ✅ جلب امتحان بواسطة ID مع تفاصيل الأسئلة
export const getExamById = query({
  args: { examId: v.id("exams") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("غير مصرح");

    const exam = await ctx.db.get(args.examId);
    if (!exam) throw new Error("الامتحان غير موجود");

    // جلب تفاصيل الأسئلة من بنك الأسئلة
    const questionsWithDetails = await Promise.all(
      exam.questions.map(async (item) => {
        const question = await ctx.db.get(item.questionId);
        return {
          ...item,
          question: question || null,
        };
      })
    );

    const creator = await ctx.db.get(exam.createdBy);

    return {
      ...exam,
      questions: questionsWithDetails.filter((q) => q.question !== null),
      creatorName: creator?.name || "غير معروف",
    };
  },
});

// ✅ جلب امتحانات الطالب
export const getStudentExams = query({
  args: {
    status: v.optional(v.union(
      v.literal("all"),
      v.literal("pending"),
      v.literal("submitted"),
      v.literal("graded"),
    )),
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

    const classIds = enrollments.map(e => e.classId);

    // جلب الامتحانات المنشورة للفصول
    let exams = await ctx.db.query("exams").collect();
    exams = exams.filter((e) => 
      e.status === "published" &&
      e.classIds.some(id => classIds.includes(id))
    );

    // جلب تسليمات الطالب
    const submissions = await ctx.db
      .query("examSubmissions")
      .withIndex("by_student", (q) => q.eq("studentId", student._id))
      .collect();

    const examsWithStatus = await Promise.all(
      exams.map(async (exam) => {
        const submission = submissions.find(
          (s) => s.examId === exam._id
        );

        let status = "pending";
        if (submission) {
          if (submission.status === "graded") {
            status = "graded";
          } else {
            status = "submitted";
          }
        }

        return {
          ...exam,
          submission,
          status,
        };
      })
    );

    // فلترة حسب الحالة
    let filtered = examsWithStatus;
    if (args.status && args.status !== "all") {
      filtered = filtered.filter((e) => e.status === args.status);
    }

    return filtered.sort((a, b) => a.date - b.date);
  },
});

// ============================================
// MUTATIONS
// ============================================

// ✅ إنشاء امتحان جديد
export const createExam = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    model: v.string(),
    grade: v.string(),
    subject: v.string(),
    courseId: v.optional(v.id("courses")),
    classIds: v.array(v.id("classes")),
    totalMarks: v.number(),
    duration: v.number(),
    date: v.number(),
    instructions: v.optional(v.string()),
    footerText: v.optional(v.string()),
    headerBorderColor: v.optional(v.string()),
    showInstructions: v.boolean(),
    showAnswerSheet: v.boolean(),
    showQrCode: v.boolean(),
    status: v.union(
      v.literal("draft"),
      v.literal("published"),
      v.literal("archived"),
    ),
    questions: v.array(
      v.object({
        questionId: v.id("questions"),
        marks: v.number(),
        order: v.number(),
      })
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

    const examId = await ctx.db.insert("exams", {
      title: args.title,
      description: args.description,
      model: args.model,
      grade: args.grade,
      subject: args.subject,
      courseId: args.courseId,
      classIds: args.classIds,
      totalMarks: args.totalMarks,
      duration: args.duration,
      date: args.date,
      instructions: args.instructions,
      footerText: args.footerText,
      headerBorderColor: args.headerBorderColor,
      showInstructions: args.showInstructions,
      showAnswerSheet: args.showAnswerSheet,
      showQrCode: args.showQrCode,
      status: args.status,
      questions: args.questions,
      createdBy: user._id,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      publishedAt: args.status === "published" ? Date.now() : undefined,
    });

    return { success: true, examId };
  },
});

// ✅ تحديث امتحان
export const updateExam = mutation({
  args: {
    examId: v.id("exams"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    model: v.optional(v.string()),
    grade: v.optional(v.string()),
    subject: v.optional(v.string()),
    courseId: v.optional(v.id("courses")),
    classIds: v.optional(v.array(v.id("classes"))),
    totalMarks: v.optional(v.number()),
    duration: v.optional(v.number()),
    date: v.optional(v.number()),
    instructions: v.optional(v.string()),
    footerText: v.optional(v.string()),
    headerBorderColor: v.optional(v.string()),
    showInstructions: v.optional(v.boolean()),
    showAnswerSheet: v.optional(v.boolean()),
    showQrCode: v.optional(v.boolean()),
    status: v.optional(v.union(
      v.literal("draft"),
      v.literal("published"),
      v.literal("archived"),
    )),
    questions: v.optional(v.array(
      v.object({
        questionId: v.id("questions"),
        marks: v.number(),
        order: v.number(),
      })
    )),
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

    const { examId, ...fields } = args;
    const updateData: any = { updatedAt: Date.now() };

    for (const [key, value] of Object.entries(fields)) {
      if (value !== undefined) {
        updateData[key] = value;
      }
    }

    if (args.status === "published") {
      updateData.publishedAt = Date.now();
    }

    await ctx.db.patch(examId, updateData);

    return { success: true };
  },
});

// ✅ حذف امتحان
export const deleteExam = mutation({
  args: { examId: v.id("exams") },
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

    const exam = await ctx.db.get(args.examId);
    if (!exam) throw new Error("الامتحان غير موجود");

    // التحقق من وجود تسليمات
    const submissions = await ctx.db
      .query("examSubmissions")
      .withIndex("by_exam", (q) => q.eq("examId", args.examId))
      .collect();

    if (submissions.length > 0) {
      throw new Error("لا يمكن حذف الامتحان لأنه يوجد تسليمات مرتبطة به");
    }

    await ctx.db.delete(args.examId);

    return { success: true };
  },
});


// ✅ دالة لنشر الامتحان
export const publishExam = mutation({
  args: { examId: v.id("exams") },
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

    await ctx.db.patch(args.examId, {
      status: "published",
      publishedAt: Date.now(),
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});


// ✅ جلب تسليم الطالب لامتحان معين
// convex/exams/exams.ts

// ✅ جلب تسليم الطالب مع التحقق من القفل
export const getStudentExamSubmission = query({
  args: {
    examId: v.id("exams"),
    studentId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const submission = await ctx.db
      .query("examSubmissions")
      .withIndex("by_exam_student", (q) => 
        q.eq("examId", args.examId).eq("studentId", args.studentId)
      )
      .first();
    
    return submission || null;
  },
});

// convex/exams/exams.ts

// ✅ تسليم امتحان (بدون حساب درجات)
export const submitExam = mutation({
  args: {
    examId: v.id("exams"),
    classId: v.id("classes"),
    answers: v.array(
      v.object({
        questionId: v.id("questions"),
        answer: v.string(),
      })
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

    const exam = await ctx.db.get(args.examId);
    if (!exam) throw new Error("الامتحان غير موجود");

    // ✅ تحويل الإجابات إلى الصيغة المطلوبة (بدون درجات)
    const answersData = args.answers.map((ans) => ({
      questionId: ans.questionId,
      answer: ans.answer,
      // ✅ لا نضيف marksObtained هنا - ستضاف من قبل المعلم
    }));

    const submissionId = await ctx.db.insert("examSubmissions", {
      examId: args.examId,
      studentId: student._id,
      classId: args.classId,
      submittedAt: Date.now(),
      answers: answersData,
      totalMarks: undefined, // ✅ بدون درجات حتى يصححها المعلم
      status: "submitted", // ✅ حالة "مسلم" بانتظار التصحيح
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return { success: true, submissionId };
  },
});


// ✅ قفل الامتحان للطالب (عند تجاوز محاولات الخروج)
export const lockExamForStudent = mutation({
  args: {
    examId: v.id("exams"),
    studentId: v.id("users"),
    classId: v.id("classes"),
    reason: v.string(),
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

    // التحقق من أن الطالب هو نفسه
    if (student._id !== args.studentId) {
      throw new Error("غير مصرح");
    }

    const exam = await ctx.db.get(args.examId);
    if (!exam) throw new Error("الامتحان غير موجود");

    // البحث عن تسليم موجود
    const existingSubmission = await ctx.db
      .query("examSubmissions")
      .withIndex("by_exam_student", (q) => 
        q.eq("examId", args.examId).eq("studentId", args.studentId)
      )
      .first();

    if (existingSubmission) {
      // ✅ تحديث التسليم الموجود بالقفل
      await ctx.db.patch(existingSubmission._id, {
        locked: true,
        lockReason: args.reason,
        lockedAt: Date.now(),
        updatedAt: Date.now(),
        // إذا كان غير مصحح، نضع علامة
        status: existingSubmission.status === "graded" ? "graded" : "submitted",
      });
    } else {
      // ✅ إنشاء تسليم جديد مقفل (بدون إجابات)
      await ctx.db.insert("examSubmissions", {
        examId: args.examId,
        studentId: args.studentId,
        classId: args.classId,
        submittedAt: Date.now(),
        answers: [], // بدون إجابات
        totalMarks: 0, // صفر درجات
        status: "submitted",
        locked: true,
        lockReason: args.reason,
        lockedAt: Date.now(),
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }

    return { success: true, locked: true };
  },
});

// ✅ تصدير الدوال
export const exams = {
  getExams,
  getExamById,
  getStudentExams,
  createExam,
  updateExam,
  deleteExam,
  publishExam,
};