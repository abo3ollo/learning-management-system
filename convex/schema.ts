import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    clerkId: v.string(),
    name: v.string(),
    email: v.string(),
    phoneNumber: v.optional(v.string()),
    role: v.union(
      v.literal("student"),
      v.literal("teacher"),
      v.literal("parent"),
      v.literal("admin")
    ),
    status: v.union(
      v.literal("pending"),
      v.literal("approved"),
      v.literal("rejected"),
      v.literal("active"),
      v.literal("inactive"),
      v.literal("on_leave")  // ✅ إضافة حالة الإجازة للمعلمين
    ),
    rejectionReason: v.optional(v.string()),
    approvedAt: v.optional(v.number()),
    approvedBy: v.optional(v.id("users")),

    // Student specific fields
    studentId: v.optional(v.string()),
    birthDate: v.optional(v.number()),
    gender: v.optional(v.union(v.literal("male"), v.literal("female"))),
    address: v.optional(v.string()),
    grade: v.optional(v.string()),
    enrollmentDate: v.optional(v.number()),

    // Teacher specific fields ✅
    teacherId: v.optional(v.string()),           // معرف المعلم المخصص
    specialization: v.optional(v.string()),      // التخصص
    qualification: v.optional(v.string()),       // المؤهل العلمي
    experience: v.optional(v.number()),          // سنوات الخبرة
    hireDate: v.optional(v.number()),            // تاريخ التوظيف
    salary: v.optional(v.number()),              // الراتب
    subjects: v.optional(v.array(v.string())),   // المواد التي يدرسها

    // Parent specific fields
    parentId: v.optional(v.string()),
    workPhone: v.optional(v.string()),
    workAddress: v.optional(v.string()),
    jobTitle: v.optional(v.string()),
    nationalId: v.optional(v.string()),
    relationship: v.optional(v.string()),

    // Guardian info
    guardianName: v.optional(v.string()),
    guardianPhone: v.optional(v.string()),
    guardianEmail: v.optional(v.string()),
    guardianRelationship: v.optional(v.string()),

    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
  })
    .index("by_clerkId", ["clerkId"])
    .index("by_email", ["email"])
    .index("by_status", ["status"])
    .index("by_role", ["role"])
    .index("by_studentId", ["studentId"])
    .index("by_teacherId", ["teacherId"])   // ✅ إضافة index للمعلمين
    .index("by_parentId", ["parentId"]),      // إضافة index للوالدين

  parentStudentLinks: defineTable({
    parentId: v.id("users"),
    studentId: v.id("users"),
    relationship: v.string(),                    // أب، أم، وصي، إلخ
    isPrimary: v.boolean(),                     // جهة اتصال أساسية
    permissions: v.object({                     // صلاحيات ولي الأمر
      viewGrades: v.boolean(),                  // عرض الدرجات
      financialAccess: v.boolean(),             // الوصول المالي
      pickupNotification: v.boolean(),          // إشعار الاستلام
      emergencyContact: v.boolean(),            // جهة اتصال طوارئ
    }),
    createdAt: v.number(),
  })
    .index("by_parent_student", ["parentId", "studentId"])
    .index("by_parent", ["parentId"])
    .index("by_student", ["studentId"]),

  auditLogs: defineTable({
    userId: v.id("users"),
    action: v.string(),
    resourceType: v.string(),
    resourceId: v.string(),
    details: v.object({
      role: v.optional(v.string()),
      email: v.optional(v.string()),
      name: v.optional(v.string()),
      previousStatus: v.optional(v.string()),
      previousRole: v.optional(v.string()),
      newRole: v.optional(v.string()),
      approvedBy: v.optional(v.string()),
      reason: v.optional(v.string()),
      rejectedBy: v.optional(v.string()),
      studentId: v.optional(v.string()),
      parentId: v.optional(v.string()),
      teacherId: v.optional(v.string()),
      updatedFields: v.optional(v.array(v.string())),
      updatedBy: v.optional(v.string()),
      createdBy: v.optional(v.string()),
      deletedBy: v.optional(v.string()),
    }),
    createdAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_resourceId", ["resourceId"])
    .index("by_action", ["action"]),

  adminSettings: defineTable({
    requireApproval: v.boolean(),
    autoApproveRoles: v.array(v.string()),
    studentIdPrefix: v.string(),
    teacherIdPrefix: v.optional(v.string()),    // ✅ optional
    parentIdPrefix: v.optional(v.string()),     // ✅ optional
    nextStudentIdNumber: v.number(),
    nextTeacherIdNumber: v.optional(v.number()), // ✅ optional
    nextParentIdNumber: v.optional(v.number()),  // ✅ optional
    createdAt: v.number(),
    updatedAt: v.number(),
  }),

  // classes
  classes: defineTable({
    classNameEn: v.string(),        // الاسم بالإنجليزي
    classNameAr: v.string(),        // الاسم بالعربي
    classCode: v.string(),          // كود الفصل (مثال: G5-A, P3-1)
    grade: v.string(),              // الصف (مثال: الصف الأول الثانوي)
    gradeLevel: v.number(),         // المستوى الدراسي (1,2,3...)
    section: v.optional(v.string()), // الشعبة (أ, ب, ج...)
    supervisorId: v.optional(v.id("users")), // مشرف الفصل (معلم)
    academicYear: v.string(),       // العام الدراسي (مثال: 2025-2026)
    maxStudents: v.number(),        // الحد الأقصى للطلاب
    currentStudents: v.number(),    // عدد الطلاب الحالي
    location: v.optional(v.string()), // الموقع (مبنى أ - غرفة 101)
    status: v.union(
      v.literal("active"),
      v.literal("inactive"),
      v.literal("completed")
    ),
    schedule: v.optional(v.object({
      days: v.array(v.string()),    // أيام الأسبوع
      startTime: v.string(),        // وقت البداية
      endTime: v.string(),          // وقت النهاية
    })),
    students: v.array(v.id("users")), // قائمة الطلاب المسجلين
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_classCode", ["classCode"])
    .index("by_grade", ["grade"])
    .index("by_supervisor", ["supervisorId"])
    .index("by_academicYear", ["academicYear"])
    .index("by_status", ["status"]),

  courses: defineTable({
    title: v.string(),
    description: v.string(),
    teacherId: v.id("users"),
    thumbnail: v.optional(v.string()),
    isPublished: v.boolean(),
    price: v.optional(v.number()),
    category: v.optional(v.string()),
    enrolledStudents: v.array(v.id("users")),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_teacher", ["teacherId"])
    .index("by_published", ["isPublished"])
    .index("by_category", ["category"]),

  enrollments: defineTable({
    studentId: v.id("users"),
    courseId: v.id("courses"),
    status: v.union(v.literal("active"), v.literal("completed"), v.literal("dropped")),
    enrolledAt: v.number(),
    completedAt: v.optional(v.number()),
    progress: v.number(),
  })
    .index("by_student", ["studentId"])
    .index("by_course", ["courseId"])
    .index("by_student_course", ["studentId", "courseId"])
    .index("by_status", ["status"]),

  chapters: defineTable({
    courseId: v.id("courses"),
    title: v.string(),
    description: v.optional(v.string()),
    order: v.number(),
    isPublished: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_course", ["courseId"])
    .index("by_course_order", ["courseId", "order"]),

  lessons: defineTable({
    chapterId: v.id("chapters"),
    title: v.string(),
    description: v.optional(v.string()),
    content: v.optional(v.string()),
    videoUrl: v.optional(v.string()),
    duration: v.optional(v.number()),
    order: v.number(),
    isPublished: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_chapter", ["chapterId"])
    .index("by_chapter_order", ["chapterId", "order"]),
});