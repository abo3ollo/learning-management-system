// convex/questions/questions.ts

import { v } from "convex/values";
import { mutation, query } from "../_generated/server";
import { Id } from "../_generated/dataModel";

// ============================================
// QUERIES
// ============================================

// ✅ جلب الأسئلة حسب المادة (للاستخدام في AddAssignmentModal)
export const getQuestionsByCourse = query({
  args: {
    courseId: v.optional(v.id("courses")),
    search: v.optional(v.string()),
    difficulty: v.optional(v.union(
      v.literal("easy"),
      v.literal("medium"),
      v.literal("hard"),
    )),
    type: v.optional(v.union(
      v.literal("mcq"),
      v.literal("true_false"),
      v.literal("essay"),
      v.literal("fill_blank"),
      v.literal("matching"),
    )),
    status: v.optional(v.union(
      v.literal("draft"),
      v.literal("published"),
      v.literal("archived"),
    )),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("غير مصرح");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) throw new Error("المستخدم غير موجود");

    let questions = await ctx.db.query("questions").collect();

    // فلترة حسب المادة (subject)
    if (args.courseId) {
      const course = await ctx.db.get(args.courseId);
      if (course) {
        questions = questions.filter((q) => q.subject === course.title);
      }
    }

    // فلترة حسب الحالة
    if (user.role === "student") {
      questions = questions.filter((q) => q.status === "published");
    } else if (args.status) {
      questions = questions.filter((q) => q.status === args.status);
    }

    if (args.type) {
      questions = questions.filter((q) => q.type === args.type);
    }
    if (args.difficulty) {
      questions = questions.filter((q) => q.difficulty === args.difficulty);
    }
    if (args.search && args.search.trim() !== "") {
      const searchLower = args.search.toLowerCase();
      questions = questions.filter((q) =>
        q.title.toLowerCase().includes(searchLower) ||
        q.questionText.toLowerCase().includes(searchLower) ||
        q.tags.some(tag => tag.toLowerCase().includes(searchLower))
      );
    }

    return questions.sort((a, b) => b.createdAt - a.createdAt);
  },
});

// ✅ جلب جميع الأسئلة (مع فلاتر)
export const getQuestions = query({
  args: {
    type: v.optional(v.union(
      v.literal("mcq"),
      v.literal("true_false"),
      v.literal("essay"),
      v.literal("fill_blank"),
      v.literal("matching"),
    )),
    difficulty: v.optional(v.union(
      v.literal("easy"),
      v.literal("medium"),
      v.literal("hard"),
    )),
    subject: v.optional(v.string()),
    grade: v.optional(v.string()),
    status: v.optional(v.union(
      v.literal("draft"),
      v.literal("published"),
      v.literal("archived"),
    )),
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

    let questions = await ctx.db.query("questions").collect();

    // تطبيق الفلاتر
    if (args.type) {
      questions = questions.filter((q) => q.type === args.type);
    }
    if (args.difficulty) {
      questions = questions.filter((q) => q.difficulty === args.difficulty);
    }
    if (args.subject) {
      questions = questions.filter((q) => q.subject === args.subject);
    }
    if (args.grade) {
      questions = questions.filter((q) => q.grade === args.grade);
    }
    if (args.status) {
      questions = questions.filter((q) => q.status === args.status);
    }
    if (args.search && args.search.trim() !== "") {
      const searchLower = args.search.toLowerCase();
      questions = questions.filter((q) =>
        q.title.toLowerCase().includes(searchLower) ||
        q.questionText.toLowerCase().includes(searchLower) ||
        q.tags.some(tag => tag.toLowerCase().includes(searchLower))
      );
    }

    // ترتيب حسب تاريخ الإنشاء (الأحدث أولاً)
    questions.sort((a, b) => b.createdAt - a.createdAt);

    return questions;
  },
});

// ✅ دالة جديدة لجلب أسئلة محددة بواسطة المعرفات (للطلاب)
export const getQuestionsByIds = query({
  args: {
    questionIds: v.array(v.id("questions")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("غير مصرح");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) throw new Error("المستخدم غير موجود");

    // جلب الأسئلة المطلوبة
    const questions = await Promise.all(
      args.questionIds.map(async (id) => {
        const q = await ctx.db.get(id);
        return q;
      })
    );

    // فلترة الأسئلة الموجودة والمنشورة
    const filteredQuestions = questions.filter((q) => {
      if (!q) return false;
      // للطلاب، فقط الأسئلة المنشورة
      if (user.role === "student" && q.status !== "published") {
        return false;
      }
      return true;
    });

    return filteredQuestions;
  },
});

export const getQuestionById = query({
  args: { questionId: v.id("questions") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("غير مصرح");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) throw new Error("المستخدم غير موجود");

    const question = await ctx.db.get(args.questionId);
    if (!question) throw new Error("السؤال غير موجود");

    // ✅ السماح للطلاب بمشاهدة الأسئلة المنشورة فقط
    if (user.role === "student" && question.status !== "published") {
      throw new Error("غير مصرح بمشاهدة هذا السؤال");
    }

    return question;
  },
});

// إحصائيات الأسئلة
export const getQuestionsStats = query({
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

    const allQuestions = await ctx.db.query("questions").collect();

    return {
      total: allQuestions.length,
      mcq: allQuestions.filter((q) => q.type === "mcq").length,
      trueFalse: allQuestions.filter((q) => q.type === "true_false").length,
      essay: allQuestions.filter((q) => q.type === "essay").length,
      fillBlank: allQuestions.filter((q) => q.type === "fill_blank").length,
      matching: allQuestions.filter((q) => q.type === "matching").length,
      easy: allQuestions.filter((q) => q.difficulty === "easy").length,
      medium: allQuestions.filter((q) => q.difficulty === "medium").length,
      hard: allQuestions.filter((q) => q.difficulty === "hard").length,
      published: allQuestions.filter((q) => q.status === "published").length,
      draft: allQuestions.filter((q) => q.status === "draft").length,
      archived: allQuestions.filter((q) => q.status === "archived").length,
    };
  },
});


// ✅ جلب أسئلة متعددة بواسطة المعرفات (للامتحانات)
export const getQuestionsForExam = query({
  args: {
    questionIds: v.array(v.object({
      questionId: v.id("questions"),
      marks: v.number(),
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

    if (!user) throw new Error("المستخدم غير موجود");

    // جلب كل الأسئلة المطلوبة
    const questionsWithMarks = await Promise.all(
      args.questionIds.map(async (item) => {
        const question = await ctx.db.get(item.questionId);
        if (!question) return null;
        
        // التحقق من صلاحية المشاهدة
        if (user.role === "student" && question.status !== "published") {
          return null;
        }

        return {
          ...question,
          marksInExam: item.marks,
          orderInExam: item.order,
        };
      })
    );

    return questionsWithMarks.filter((q): q is NonNullable<typeof q> => q !== null);
  },
});

// ============================================
// MUTATIONS
// ============================================


export const createQuestion = mutation({
  args: {
    title: v.string(),
    type: v.union(
      v.literal("mcq"),
      v.literal("true_false"),
      v.literal("essay"),
      v.literal("fill_blank"),
      v.literal("matching"),
    ),
    questionText: v.string(),
    imageUrl: v.optional(v.string()),
    explanation: v.optional(v.string()),
    difficulty: v.union(
      v.literal("easy"),
      v.literal("medium"),
      v.literal("hard"),
    ),
    points: v.number(),
    options: v.array(
      v.object({
        id: v.string(),
        text: v.string(),
        isCorrect: v.boolean(),
        imageUrl: v.optional(v.string()),
      }),
    ),
    correctAnswer: v.optional(v.string()),
    subject: v.optional(v.string()),
    lesson: v.optional(v.string()),
    grade: v.optional(v.string()),
    section: v.optional(v.string()),
    tags: v.array(v.string()),
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

    const questionId = await ctx.db.insert("questions", {
      title: args.title,
      type: args.type,
      questionText: args.questionText,
      imageUrl: args.imageUrl,
      explanation: args.explanation,
      difficulty: args.difficulty,
      points: args.points,
      options: args.options,
      correctAnswer: args.correctAnswer,
      subject: args.subject,
      lesson: args.lesson,
      grade: args.grade,
      section: args.section,
      tags: args.tags,
      createdBy: user._id,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      status: args.status || "draft",
      usageCount: 0,
      examUsage: [],
    });

    return { success: true, questionId };
  },
});

export const updateQuestion = mutation({
  args: {
    questionId: v.id("questions"),
    title: v.optional(v.string()),
    type: v.optional(v.union(
      v.literal("mcq"),
      v.literal("true_false"),
      v.literal("essay"),
      v.literal("fill_blank"),
      v.literal("matching"),
    )),
    questionText: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    explanation: v.optional(v.string()),
    difficulty: v.optional(v.union(
      v.literal("easy"),
      v.literal("medium"),
      v.literal("hard"),
    )),
    points: v.optional(v.number()),
    options: v.optional(v.array(
      v.object({
        id: v.string(),
        text: v.string(),
        isCorrect: v.boolean(),
        imageUrl: v.optional(v.string()),
      }),
    )),
    correctAnswer: v.optional(v.string()),
    subject: v.optional(v.string()),
    lesson: v.optional(v.string()),
    grade: v.optional(v.string()),
    section: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    status: v.optional(v.union(
      v.literal("draft"),
      v.literal("published"),
      v.literal("archived"),
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

    const question = await ctx.db.get(args.questionId);
    if (!question) throw new Error("السؤال غير موجود");

    const updateData: any = { updatedAt: Date.now() };
    if (args.title !== undefined) updateData.title = args.title;
    if (args.type !== undefined) updateData.type = args.type;
    if (args.questionText !== undefined) updateData.questionText = args.questionText;
    if (args.imageUrl !== undefined) updateData.imageUrl = args.imageUrl;
    if (args.explanation !== undefined) updateData.explanation = args.explanation;
    if (args.difficulty !== undefined) updateData.difficulty = args.difficulty;
    if (args.points !== undefined) updateData.points = args.points;
    if (args.options !== undefined) updateData.options = args.options;
    if (args.correctAnswer !== undefined) updateData.correctAnswer = args.correctAnswer;
    if (args.subject !== undefined) updateData.subject = args.subject;
    if (args.lesson !== undefined) updateData.lesson = args.lesson;
    if (args.grade !== undefined) updateData.grade = args.grade;
    if (args.section !== undefined) updateData.section = args.section;
    if (args.tags !== undefined) updateData.tags = args.tags;
    if (args.status !== undefined) updateData.status = args.status;

    await ctx.db.patch(args.questionId, updateData);

    return { success: true };
  },
});

export const deleteQuestion = mutation({
  args: { questionId: v.id("questions") },
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

    const question = await ctx.db.get(args.questionId);
    if (!question) throw new Error("السؤال غير موجود");

    // التحقق من استخدام السؤال في واجبات
    const assignments = await ctx.db.query("assignments").collect();
    const isUsed = assignments.some(a => 
      a.questions && a.questions.some(q => q === args.questionId)
    );

    if (isUsed) {
      throw new Error("لا يمكن حذف السؤال لأنه مستخدم في واجبات");
    }

    await ctx.db.delete(args.questionId);

    return { success: true };
  },
});

export const publishQuestion = mutation({
  args: { questionId: v.id("questions") },
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

    await ctx.db.patch(args.questionId, {
      status: "published",
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

export const archiveQuestion = mutation({
  args: { questionId: v.id("questions") },
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

    await ctx.db.patch(args.questionId, {
      status: "archived",
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

export const questions = {
  getQuestions,
  getQuestionsByCourse,
  getQuestionsByIds,
  getQuestionsStats,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  publishQuestion,
  archiveQuestion,
};