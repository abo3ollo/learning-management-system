// convex/courses/courses.ts
import { v } from "convex/values";
import { mutation, query } from "../_generated/server";
import { Id } from "../_generated/dataModel";

// ============================================
// QUERIES
// ============================================

// جلب جميع المواد
export const getCourses = query({
  args: {
    teacherId: v.optional(v.id("users")),
    category: v.optional(v.string()),
    isPublished: v.optional(v.boolean()),
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

    let courses = await ctx.db.query("courses").collect();

    // تطبيق الفلاتر
    if (args.teacherId) {
      courses = courses.filter((c) => c.teacherId === args.teacherId);
    }
    if (args.category) {
      courses = courses.filter((c) => c.category === args.category);
    }
    if (args.isPublished !== undefined) {
      courses = courses.filter((c) => c.isPublished === args.isPublished);
    }
    if (args.search && args.search.trim() !== "") {
      const searchLower = args.search.toLowerCase();
      courses = courses.filter((c) =>
        c.title.toLowerCase().includes(searchLower) ||
        c.description.toLowerCase().includes(searchLower)
      );
    }

    // جلب اسم المعلم لكل مادة
    const coursesWithTeacher = await Promise.all(
      courses.map(async (course) => {
        const teacher = await ctx.db.get(course.teacherId);
        return {
          ...course,
          teacherName: teacher?.name || "معلم غير معروف",
          studentsCount: course.enrolledStudents.length,
        };
      })
    );

    // ترتيب حسب تاريخ الإنشاء (الأحدث أولاً)
    return coursesWithTeacher.sort((a, b) => b.createdAt - a.createdAt);
  },
});

// جلب مادة بواسطة ID
export const getCourseById = query({
  args: { courseId: v.id("courses") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("غير مصرح");

    const course = await ctx.db.get(args.courseId);
    if (!course) throw new Error("المادة غير موجودة");

    const teacher = await ctx.db.get(course.teacherId);
    return {
      ...course,
      teacherName: teacher?.name || "معلم غير معروف",
    };
  },
});

// جلب المواد المتاحة للإضافة للفصل
export const getAvailableCourses = query({
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

    // جلب جميع المواد المنشورة
    const allCourses = await ctx.db
      .query("courses")
      .filter((q) => q.eq(q.field("isPublished"), true))
      .collect();

    // جلب مواد الفصل الحالية
    const classSubjects = await ctx.db
      .query("classSubjects")
      .withIndex("by_class", (q) => q.eq("classId", args.classId))
      .collect();

    const existingCourseIds = new Set(classSubjects.map(cs => cs.subjectId));

    // تصفية المواد غير المرتبطة بالفصل
    let available = allCourses.filter(c => !existingCourseIds.has(c._id));

    // فلتر البحث
    if (args.search && args.search.trim() !== "") {
      const searchLower = args.search.toLowerCase();
      available = available.filter(c =>
        c.title.toLowerCase().includes(searchLower) ||
        c.description.toLowerCase().includes(searchLower)
      );
    }

    // جلب اسم المعلم لكل مادة
    const availableWithTeacher = await Promise.all(
      available.map(async (course) => {
        const teacher = await ctx.db.get(course.teacherId);
        return {
          ...course,
          teacherName: teacher?.name || "معلم غير معروف",
        };
      })
    );

    return availableWithTeacher;
  },
});


// إحصائيات المواد
export const getCoursesStats = query({
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

    const allCourses = await ctx.db.query("courses").collect();

    const published = allCourses.filter(c => c.isPublished).length;
    const draft = allCourses.filter(c => !c.isPublished).length;
    const totalStudents = allCourses.reduce((sum, c) => sum + c.enrolledStudents.length, 0);

    // ✅ إحصائيات حسب التصنيف - تجميع آمن
    const categories: Record<string, number> = {};
    for (const course of allCourses) {
      if (course.category) {
        const key = course.category.trim();
        categories[key] = (categories[key] || 0) + 1;
      }
    }

    // ✅ تحويل إلى array لتجنب مشاكل الـ keys
    const categoryList = Object.entries(categories).map(([name, count]) => ({
      name,
      count,
    }));

    return {
      total: allCourses.length,
      published,
      draft,
      totalStudents,
      categories: categoryList, // ✅ إرجاع كـ array بدلاً من object
    };
  },
});

// ✅ دالة لجلب الكورسات الخاصة بفصول الطالب
export const getStudentCourses = query({
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

    // جلب معرفات الكورسات من الفصول
    const courseIds = enrollments.map(e => e.courseId);

    // جلب الكورسات
    let courses = await ctx.db.query("courses").collect();
    
    // فلترة الكورسات التي تخص فصول الطالب
    courses = courses.filter(c => courseIds.includes(c._id));

    // جلب اسم المعلم
    const coursesWithTeacher = await Promise.all(
      courses.map(async (course) => {
        const teacher = await ctx.db.get(course.teacherId);
        return {
          ...course,
          teacherName: teacher?.name || "معلم غير معروف",
          studentsCount: course.enrolledStudents.length,
        };
      })
    );

    return coursesWithTeacher.sort((a, b) => b.createdAt - a.createdAt);
  },
});

// convex/courses/courses.ts

// ✅ دالة جديدة لجلب المواد المنشورة للطلاب
export const getPublishedCourses = query({
  args: {
    search: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("غير مصرح");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) throw new Error("المستخدم غير موجود");

    // جلب الكورسات المنشورة فقط
    let courses = await ctx.db.query("courses").collect();
    courses = courses.filter((c) => c.isPublished === true);

    // تطبيق البحث
    if (args.search && args.search.trim() !== "") {
      const searchLower = args.search.toLowerCase();
      courses = courses.filter((c) =>
        c.title.toLowerCase().includes(searchLower) ||
        c.description.toLowerCase().includes(searchLower)
      );
    }

    // جلب اسم المعلم لكل مادة
    const coursesWithTeacher = await Promise.all(
      courses.map(async (course) => {
        const teacher = await ctx.db.get(course.teacherId);
        return {
          ...course,
          teacherName: teacher?.name || "معلم غير معروف",
          studentsCount: course.enrolledStudents.length,
        };
      })
    );

    return coursesWithTeacher.sort((a, b) => b.createdAt - a.createdAt);
  },
});

// ============================================
// MUTATIONS
// ============================================

// إنشاء مادة جديدة
export const createCourse = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    teacherId: v.id("users"),
    thumbnail: v.optional(v.string()),
    isPublished: v.boolean(),
    price: v.optional(v.number()),
    category: v.optional(v.string()),
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

    // التحقق من وجود المعلم
    const teacher = await ctx.db.get(args.teacherId);
    if (!teacher || teacher.role !== "teacher") {
      throw new Error("المعلم غير موجود");
    }

    // التحقق من عدم وجود مادة بنفس الاسم
    const existing = await ctx.db
      .query("courses")
      .filter((q) => q.eq(q.field("title"), args.title))
      .first();

    if (existing) {
      throw new Error("مادة بنفس الاسم موجودة بالفعل");
    }

    const courseId = await ctx.db.insert("courses", {
      title: args.title,
      description: args.description,
      teacherId: args.teacherId,
      thumbnail: args.thumbnail,
      isPublished: args.isPublished,
      price: args.price,
      category: args.category,
      enrolledStudents: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // تسجيل في سجل التدقيق
    await ctx.db.insert("auditLogs", {
      userId: user._id,
      action: "CREATE_COURSE",
      resourceType: "course",
      resourceId: courseId,
      details: {
        name: args.title,
        createdBy: user.email,
      },
      createdAt: Date.now(),
    });

    return { success: true, courseId };
  },
});

// تحديث مادة
export const updateCourse = mutation({
  args: {
    courseId: v.id("courses"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    teacherId: v.optional(v.id("users")),
    thumbnail: v.optional(v.string()),
    isPublished: v.optional(v.boolean()),
    price: v.optional(v.number()),
    category: v.optional(v.string()),
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

    const course = await ctx.db.get(args.courseId);
    if (!course) throw new Error("المادة غير موجودة");

    const updateData: any = { updatedAt: Date.now() };
    if (args.title !== undefined) updateData.title = args.title;
    if (args.description !== undefined) updateData.description = args.description;
    if (args.teacherId !== undefined) {
      const teacher = await ctx.db.get(args.teacherId);
      if (!teacher || teacher.role !== "teacher") {
        throw new Error("المعلم غير موجود");
      }
      updateData.teacherId = args.teacherId;
    }
    if (args.thumbnail !== undefined) updateData.thumbnail = args.thumbnail;
    if (args.isPublished !== undefined) updateData.isPublished = args.isPublished;
    if (args.price !== undefined) updateData.price = args.price;
    if (args.category !== undefined) updateData.category = args.category;

    await ctx.db.patch(args.courseId, updateData);

    return { success: true };
  },
});

// حذف مادة
export const deleteCourse = mutation({
  args: { courseId: v.id("courses") },
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

    const course = await ctx.db.get(args.courseId);
    if (!course) throw new Error("المادة غير موجودة");

    // التحقق من عدم استخدام المادة في فصول
    const classSubjects = await ctx.db
      .query("classSubjects")
      .withIndex("by_subject", (q) => q.eq("subjectId", args.courseId))
      .collect();

    if (classSubjects.length > 0) {
      throw new Error("لا يمكن حذف المادة因为她 مرتبطة بفصول");
    }

    await ctx.db.delete(args.courseId);

    return { success: true };
  },
});

// نشر/إلغاء نشر مادة
export const togglePublishCourse = mutation({
  args: { 
    courseId: v.id("courses"),
    isPublished: v.boolean(),
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

    await ctx.db.patch(args.courseId, {
      isPublished: args.isPublished,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});