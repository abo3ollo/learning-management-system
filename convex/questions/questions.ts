// convex/questions/questions.ts
import { v } from "convex/values";
import { mutation, query } from "../_generated/server";
import { Id } from "../_generated/dataModel";

// ============================================
// QUERIES
// ============================================

// جلب جميع الأسئلة
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

// جلب سؤال بواسطة ID
export const getQuestionById = query({
  args: { questionId: v.id("questions") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("غير مصرح");

    return await ctx.db.get(args.questionId);
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
    };
  },
});

// ============================================
// MUTATIONS
// ============================================

// إنشاء سؤال جديد
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
    options: v.array(v.object({
      id: v.string(),
      text: v.string(),
      isCorrect: v.boolean(),
      imageUrl: v.optional(v.string()),
    })),
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

// تحديث سؤال
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
    options: v.optional(v.array(v.object({
      id: v.string(),
      text: v.string(),
      isCorrect: v.boolean(),
      imageUrl: v.optional(v.string()),
    }))),
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

// حذف سؤال
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

    // التحقق من استخدام السؤال في امتحانات
    if (question.examUsage && question.examUsage.length > 0) {
      throw new Error("لا يمكن حذف السؤال لأنه مستخدم في امتحانات");
    }

    await ctx.db.delete(args.questionId);

    return { success: true };
  },
});

// نشر سؤال (تغيير الحالة إلى published)
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