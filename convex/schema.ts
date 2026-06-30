import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    clerkId: v.string(),
    name: v.string(),
    email: v.string(),
    phoneNumber: v.optional(v.string()),
    classId: v.optional(v.id("classes")),
    role: v.union(
      v.literal("student"),
      v.literal("teacher"),
      v.literal("parent"),
      v.literal("admin"),
    ),
    status: v.union(
      v.literal("pending"),
      v.literal("approved"),
      v.literal("rejected"),
      v.literal("active"),
      v.literal("inactive"),
      v.literal("on_leave"), // ✅ إضافة حالة الإجازة للمعلمين
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
    teacherId: v.optional(v.string()), // معرف المعلم المخصص
    specialization: v.optional(v.string()), // التخصص
    qualification: v.optional(v.string()), // المؤهل العلمي
    experience: v.optional(v.number()), // سنوات الخبرة
    hireDate: v.optional(v.number()), // تاريخ التوظيف
    salary: v.optional(v.number()), // الراتب
    subjects: v.optional(v.array(v.string())), // المواد التي يدرسها

    // Parent specific fields
    parentId: v.optional(v.string()),
    workPhone: v.optional(v.string()),
    workAddress: v.optional(v.string()),
    jobTitle: v.optional(v.string()),
    nationalId: v.optional(v.string()),
    relationship: v.optional(v.string()),

    // Guardian info

    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
  })
    .index("by_clerkId", ["clerkId"])
    .index("by_email", ["email"])
    .index("by_status", ["status"])
    .index("by_role", ["role"])
    .index("by_studentId", ["studentId"])
    .index("by_teacherId", ["teacherId"]) // ✅ إضافة index للمعلمين
    .index("by_parentId", ["parentId"])
    .index("by_classId", ["classId"]), // ✅ إضافة index للبحث بالفصل    // إضافة index للوالدين

  parentStudentLinks: defineTable({
    parentId: v.id("users"),
    studentId: v.id("users"),
    relationship: v.string(), // أب، أم، وصي، إلخ
    isPrimary: v.boolean(), // جهة اتصال أساسية
    permissions: v.object({
      // صلاحيات ولي الأمر
      viewGrades: v.boolean(), // عرض الدرجات
      financialAccess: v.boolean(), // الوصول المالي
      pickupNotification: v.boolean(), // إشعار الاستلام
      emergencyContact: v.boolean(), // جهة اتصال طوارئ
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
    teacherIdPrefix: v.optional(v.string()), // ✅ optional
    parentIdPrefix: v.optional(v.string()), // ✅ optional
    nextStudentIdNumber: v.number(),
    nextTeacherIdNumber: v.optional(v.number()), // ✅ optional
    nextParentIdNumber: v.optional(v.number()), // ✅ optional
    createdAt: v.number(),
    updatedAt: v.number(),
  }),

  // classes
  classes: defineTable({
    classNameEn: v.string(),
    classNameAr: v.string(),
    classCode: v.string(),
    grade: v.string(),
    gradeLevel: v.number(),
    section: v.string(),
    supervisorId: v.optional(v.id("users")),
    academicYear: v.string(),
    maxStudents: v.number(),
    currentStudents: v.number(),
    location: v.optional(v.string()),
    status: v.union(
      v.literal("active"),
      v.literal("inactive"),
      v.literal("completed"),
    ),
    schedule: v.optional(
      v.object({
        days: v.array(v.string()),
        startTime: v.string(),
        endTime: v.string(),
      }),
    ),
    students: v.array(v.id("users")),
    teachers: v.optional(v.array(v.id("users"))), // ✅ جعل teachers اختيارياً
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_classCode", ["classCode"])
    .index("by_grade", ["grade"])
    .index("by_supervisor", ["supervisorId"])
    .index("by_academicYear", ["academicYear"])
    .index("by_status", ["status"]),

  classSubjects: defineTable({
    classId: v.id("classes"),
    subjectId: v.id("courses"), // ربط بالمادة (course)
    teacherId: v.id("users"), // معلم المادة
    order: v.number(), // ترتيب المادة في الفصل
    status: v.union(v.literal("active"), v.literal("inactive")),
    schedule: v.optional(
      v.object({
        days: v.array(v.string()),
        startTime: v.string(),
        endTime: v.string(),
      }),
    ),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_class", ["classId"])
    .index("by_subject", ["subjectId"])
    .index("by_teacher", ["teacherId"])
    .index("by_class_status", ["classId", "status"]),

  // جدول الحصص الأسبوعي
  schedules: defineTable({
    classId: v.id("classes"), // الفصل
    academicYear: v.string(), // العام الدراسي
    term: v.union(v.literal("first"), v.literal("second")), // الفصل الدراسي
    weekDays: v.array(
      v.object({
        day: v.union(
          v.literal("sunday"),
          v.literal("monday"),
          v.literal("tuesday"),
          v.literal("wednesday"),
          v.literal("thursday"),
          v.literal("friday"),
          v.literal("saturday"),
        ),
        periods: v.array(
          v.object({
            periodNumber: v.number(), // رقم الحصة (1،2،3...)
            startTime: v.string(), // وقت البداية "08:00"
            endTime: v.string(), // وقت النهاية "09:00"
            subject: v.string(), // المادة
            teacherId: v.optional(v.id("users")), // المعلم
            room: v.optional(v.string()), // رقم الفصل/القاعة
            isBreak: v.boolean(), // هل هي حصة استراحة؟
            notes: v.optional(v.string()), // ملاحظات
          }),
        ),
      }),
    ),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_class", ["classId"])
    .index("by_academicYear", ["academicYear"]),

  // تسجيل الحضور
  attendance: defineTable({
    classId: v.id("classes"),
    studentId: v.id("users"),
    date: v.string(), // تاريخ الحصة "2024-01-15"
    periodNumber: v.number(), // رقم الحصة
    status: v.union(
      v.literal("present"), // حاضر
      v.literal("absent"), // غائب
      v.literal("late"), // متأخر
      v.literal("excused"), // بعذر
    ),
    checkInTime: v.optional(v.string()), // وقت الدخول
    checkOutTime: v.optional(v.string()), // وقت الخروج
    notes: v.optional(v.string()),
    recordedBy: v.id("users"), // المعلم الذي سجل الحضور
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_class_date", ["classId", "date"])
    .index("by_student", ["studentId"])
    .index("by_date", ["date"]),

  // إشعارات التذكير
  scheduleReminders: defineTable({
    scheduleId: v.id("schedules"),
    classId: v.id("classes"),
    periodNumber: v.number(),
    reminderTime: v.number(), // وقت الإشعار (timestamp)
    sent: v.boolean(), // هل تم الإرسال؟
    sentAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_schedule", ["scheduleId"])
    .index("by_class", ["classId"])
    .index("by_reminderTime", ["reminderTime"]),

  mediaFiles: defineTable({
    name: v.string(),
    type: v.union(
      v.literal("image"),
      v.literal("video"),
      v.literal("youtube"),
      v.literal("pdf"),
      v.literal("audio"),
    ),
    url: v.string(), // R2 public URL or YouTube URL
    r2Key: v.optional(v.string()), // R2 object key (for deletion)
    size: v.optional(v.number()), // bytes (0 for YouTube)
    mimeType: v.optional(v.string()), // e.g. "image/jpeg"
    context: v.string(), // "general" | "classroom" | etc.
    status: v.union(v.literal("ok"), v.literal("draft")),
    uploadedBy: v.id("users"),
    uploadedAt: v.number(),
    usedIn: v.array(v.id("mediaAssignments")), // assignment IDs
  })
    .index("by_type", ["type"])
    .index("by_context", ["context"])
    .index("by_uploader", ["uploadedBy"])
    .index("by_status", ["status"]),

  mediaAssignments: defineTable({
    mediaFileIds: v.array(v.id("mediaFiles")),
    assignTo: v.union(
      v.literal("class"),
      v.literal("student"),
      v.literal("section"),
    ),
    targetId: v.string(), // classId | studentId | sectionId
    title: v.string(),
    description: v.optional(v.string()),
    dueDate: v.optional(v.number()),
    alwaysAvailable: v.boolean(),
    availability: v.optional(v.string()), // "media.always" | "media.scheduled"
    status: v.union(v.literal("draft"), v.literal("published")),
    assignedBy: v.id("users"),
    createdAt: v.number(),
  })
    .index("by_target", ["targetId"])
    .index("by_status", ["status"])
    .index("by_assigner", ["assignedBy"]),

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

  assignments: defineTable({
    title: v.string(),
    description: v.optional(v.string()),
    classIds: v.array(v.id("classes")), // يمكن اختيار أكثر من فصل
    type: v.union(
      v.literal("assignment"),
      v.literal("quiz"),
      v.literal("exam"),
      v.literal("project"),
    ),
    questions: v.optional(v.array(v.id("questions"))), // ✅ إضافة مصفوفة من معرفات الأسئلة
    fullGrade: v.float64(), // ✅ الدرجة الكاملة
    courseId: v.id("courses"),
    maxAttempts: v.optional(v.number()),
    allowResubmission: v.boolean(),
    isGroupWork: v.boolean(),
    maxGroupSize: v.optional(v.number()),
    showGrade: v.boolean(),
    location: v.optional(v.string()),
    logic: v.optional(v.string()),

    // جدول التقييم
    startDate: v.number(),
    dueDate: v.number(),
    weight: v.number(), // الوزن المئوي
    passingGrade: v.number(), // درجة النجاح
    allowLateSubmission: v.boolean(),
    lateSubmissionPenalty: v.optional(v.number()), // خصم التأخير

    // المرفقات
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
    createdBy: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
    publishedAt: v.optional(v.number()),
  })
    .index("by_class", ["classIds"])
    .index("by_status", ["status"])
    .index("by_createdBy", ["createdBy"])
    .index("by_dueDate", ["dueDate"]),

  submissions: defineTable({
    assignmentId: v.id("assignments"),
    studentId: v.id("users"),
    classId: v.id("classes"),
    submittedAt: v.number(),
    content: v.optional(v.string()),
    attachments: v.array(
      v.object({
        name: v.string(),
        url: v.string(),
        size: v.number(),
        type: v.string(),
      }),
    ),
    // ✅ إضافة حقل answers لتخزين إجابات الطالب على الأسئلة
    answers: v.optional(
      v.array(
        v.object({
          questionId: v.id("questions"),
          answer: v.string(),
        }),
      ),
    ),
    grade: v.optional(v.number()),
    feedback: v.optional(v.string()),
    gradedBy: v.optional(v.id("users")),
    gradedAt: v.optional(v.number()),
    status: v.union(
      v.literal("submitted"),
      v.literal("graded"),
      v.literal("returned"),
      v.literal("late"),
    ),
    attemptNumber: v.number(),
    isLate: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_assignment", ["assignmentId"])
    .index("by_student", ["studentId"])
    .index("by_class", ["classId"])
    .index("by_assignment_student", ["assignmentId", "studentId"]),

  enrollments: defineTable({
    studentId: v.id("users"),
    classId: v.id("classes"),
    courseId: v.id("courses"), // ✅ إذا كان عندك
    enrolledAt: v.number(),
    status: v.union(
      v.literal("active"),
      v.literal("completed"),
      v.literal("dropped"),
    ),
  })
    .index("by_student", ["studentId"])
    .index("by_class", ["classId"])
    .index("by_course", ["courseId"])
    .index("by_student_class", ["studentId", "classId"])
    .index("by_student_course", ["studentId", "courseId"]),

  // chapters: defineTable({
  //   courseId: v.id("courses"),
  //   title: v.string(),
  //   description: v.optional(v.string()),
  //   order: v.number(),
  //   isPublished: v.boolean(),
  //   createdAt: v.number(),
  //   updatedAt: v.number(),
  // })
  //   .index("by_course", ["courseId"])
  //   .index("by_course_order", ["courseId", "order"]),

  questions: defineTable({
    title: v.string(), // عنوان السؤال
    type: v.union(
      v.literal("mcq"), // اختيار من متعدد
      v.literal("true_false"), // صح/خطأ
      v.literal("essay"), // مقالي
      v.literal("fill_blank"), // ملء الفراغ
      v.literal("matching"), // مطابقة
    ),
    questionText: v.string(), // نص السؤال
    imageUrl: v.optional(v.string()), // صورة السؤال (اختياري)
    explanation: v.optional(v.string()), // شرح مفصل
    difficulty: v.union(
      v.literal("easy"),
      v.literal("medium"),
      v.literal("hard"),
    ),
    points: v.number(), // عدد النقاط
    options: v.array(
      v.object({
        id: v.string(),
        text: v.string(),
        isCorrect: v.boolean(),
        imageUrl: v.optional(v.string()),
      }),
    ),
    correctAnswer: v.optional(v.string()), // للإجابة القصيرة أو المقالي
    subject: v.optional(v.string()), // المادة
    lesson: v.optional(v.string()), // الدرس
    grade: v.optional(v.string()), // الصف الدراسي
    section: v.optional(v.string()), // الشعبة
    tags: v.array(v.string()), // وسوم
    createdBy: v.id("users"), // من أضاف السؤال
    createdAt: v.number(),
    updatedAt: v.number(),
    status: v.union(
      v.literal("draft"),
      v.literal("published"),
      v.literal("archived"),
    ),
    usageCount: v.number(), // عدد مرات الاستخدام
    examUsage: v.array(
      v.object({
        // استخدامات الامتحان
        examId: v.id("exams"),
        usedAt: v.number(),
      }),
    ),
  })
    .index("by_type", ["type"])
    .index("by_difficulty", ["difficulty"])
    .index("by_subject", ["subject"])
    .index("by_grade", ["grade"])
    .index("by_status", ["status"])
    .index("by_createdBy", ["createdBy"]),

  // ✅ جدول الامتحانات (معدل)
  exams: defineTable({
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
    // ✅ الأسئلة من بنك الأسئلة - مخزنة مباشرة
    questions: v.array(
      v.object({
        questionId: v.id("questions"),
        marks: v.number(),
        order: v.number(),
      }),
    ),
    createdBy: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
    publishedAt: v.optional(v.number()),
  })
    .index("by_course", ["courseId"])
    .index("by_status", ["status"])
    .index("by_createdBy", ["createdBy"])
    .index("by_date", ["date"]),

  // ✅ جدول تسليمات الامتحانات
  examSubmissions: defineTable({
    examId: v.id("exams"),
    studentId: v.id("users"),
    classId: v.id("classes"),
    submittedAt: v.number(),
    answers: v.array(
      v.object({
        questionId: v.id("questions"),
        answer: v.string(),
        marksObtained: v.optional(v.number()), // ✅ اختياري - يضاف عند التصحيح
        feedback: v.optional(v.string()), // ✅ ملاحظات المعلم على كل سؤال
      }),
    ),
    totalMarks: v.optional(v.number()), // ✅ اختياري - يضاف عند التصحيح
    status: v.union(
      v.literal("submitted"), // ✅ مسلم - بانتظار التصحيح
      v.literal("graded"), // ✅ تم التصحيح
      v.literal("returned"), // ✅ أعيد للطالب
    ),
    gradedBy: v.optional(v.id("users")),
    gradedAt: v.optional(v.number()),
    feedback: v.optional(v.string()), // ✅ ملاحظات عامة
    createdAt: v.number(),
    updatedAt: v.number(),
    locked: v.optional(v.boolean()),
    lockReason: v.optional(v.string()),
    lockedAt: v.optional(v.number()),
  })
    .index("by_exam", ["examId"])
    .index("by_student", ["studentId"])
    .index("by_class", ["classId"])
    .index("by_exam_student", ["examId", "studentId"])
    .index("by_status", ["status"]), // ✅ إضافة index للحالة
});
