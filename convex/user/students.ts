import { v } from "convex/values";
import { mutation, query } from "../_generated/server";
import { generateStudentId } from "./helpers";


// إنشاء طالب جديد
export const createStudent = mutation({
  args: {
    name: v.string(),
    email: v.optional(v.string()),
    phoneNumber: v.string(),
    birthDate: v.optional(v.number()),
    gender: v.optional(v.union(v.literal("male"), v.literal("female"))),
    address: v.optional(v.string()),
    grade: v.optional(v.string()),
    classId: v.optional(v.id("classes")),
    parentId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    // التحقق من صلاحيات المشرف
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("غير مصرح");
    
    const admin = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();
    
    if (!admin || admin.role !== "admin") {
      throw new Error("مطلوب صلاحيات مشرف");
    }
    
    const studentId = await generateStudentId(ctx);
    
    // ✅ التحقق من البريد الإلكتروني - لو موجود نرفض
    if (args.email && args.email.trim() !== "") {
      const existingUser = await ctx.db
        .query("users")
        .withIndex("by_email", (q) => q.eq("email", args.email || ""))
        .first();

      if (existingUser) {
        throw new Error("البريد الإلكتروني موجود مسبقاً");
      }
    }
    
    // ✅ إنشاء الطالب بحالة active
    const student = await ctx.db.insert("users", {
      clerkId: `manual_${studentId}`,
      name: args.name,
      email: args.email && args.email.trim() !== "" ? args.email : `${studentId}@system.local`,
      phoneNumber: args.phoneNumber,
      role: "student",
      classId: args.classId,
      status: "active",
      studentId,
      birthDate: args.birthDate,
      gender: args.gender,
      address: args.address,
      grade: args.grade,
      enrollmentDate: Date.now(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    
    // ✅ ربط ولي الأمر إذا وجد
    if (args.parentId) {
      const parent = await ctx.db.get(args.parentId);
      if (parent && parent.role === "parent") {
        await ctx.db.insert("parentStudentLinks", {
          parentId: args.parentId,
          studentId: student,
          relationship: "guardian",
          isPrimary: true,
          permissions: {
            viewGrades: true,
            financialAccess: false,
            pickupNotification: false,
            emergencyContact: false,
          },
          createdAt: Date.now(),
        });
      }
    }
    
    // ✅ إضافة الطالب إلى الفصل إذا تم تحديده
    if (args.classId) {
      const classData = await ctx.db.get(args.classId);
      if (classData) {
        await ctx.db.patch(args.classId, {
          students: [...classData.students, student],
          currentStudents: classData.currentStudents + 1,
          updatedAt: Date.now(),
        });
      }
    }
    
    await ctx.db.insert("auditLogs", {
      userId: admin._id,
      action: "CREATE_STUDENT",
      resourceType: "user",
      resourceId: student,
      details: {
        studentId: studentId,
        name: args.name,
        email: args.email || `${studentId}@system.local`,
        
        createdBy: admin.email,
      },
      createdAt: Date.now(),
    });
    
    return { success: true, studentId, userId: student };
  },
});

// جلب جميع الطلاب
export const getStudents = query({
  args: {
    status: v.optional(v.string()),
    search: v.optional(v.string()),
    classId: v.optional(v.id("classes")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("غير مصرح");

    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!currentUser) throw new Error("المستخدم غير موجود");
    
    // التحقق من الصلاحيات
    const isAdmin = currentUser.role === "admin";
    const isTeacher = currentUser.role === "teacher";
    const isParent = currentUser.role === "parent";
    
    if (!isAdmin && !isTeacher && !isParent) {
      throw new Error("غير مصرح بعرض الطلاب");
    }

    let students = await ctx.db
      .query("users")
      .withIndex("by_role", (q) => q.eq("role", "student"))
      .collect();

    // ✅ فلتر حسب الفصل إذا تم تحديده
    if (args.classId) {
      students = students.filter((s) => s.classId === args.classId);
    }

    // ✅ إذا كان المستخدم معلم، جلب طلاب فصوله فقط
    if (isTeacher && !args.classId) {
      // جلب جميع الفصول التي يدرسها المعلم
      const allClasses = await ctx.db.query("classes").collect();
      const teacherClasses = allClasses.filter(
        (c) => c.teachers && c.teachers.includes(currentUser._id)
      );
      
      const classIds = new Set(teacherClasses.map(c => c._id));
      
      students = students.filter(student => 
        student.classId && classIds.has(student.classId)
      );
    }

    // ✅ إذا كان المستخدم ولي أمر، جلب أبنائه فقط
    if (isParent) {
      const parentLinks = await ctx.db
        .query("parentStudentLinks")
        .withIndex("by_parent", (q) => q.eq("parentId", currentUser._id))
        .collect();
      
      const studentIds = new Set(parentLinks.map(link => link.studentId));
      students = students.filter(student => studentIds.has(student._id));
    }

    // فلتر حسب الحالة
    if (args.status) {
      students = students.filter((s) => s.status === args.status);
    }

    // فلتر حسب البحث
    if (args.search && args.search.trim() !== "") {
      const searchLower = args.search.toLowerCase();
      students = students.filter((student) =>
        student.name.toLowerCase().includes(searchLower) ||
        student.email.toLowerCase().includes(searchLower) ||
        student.studentId?.toLowerCase().includes(searchLower) ||
        student.phoneNumber?.includes(args.search || "")
      );
    }

    // إضافة معلومات أولياء الأمور والفصل
    const studentsWithParentsAndClass = await Promise.all(
      students.map(async (student) => {
        // جلب أولياء الأمور
        const parentLinks = await ctx.db
          .query("parentStudentLinks")
          .withIndex("by_student", (q) => q.eq("studentId", student._id))
          .collect();
        
        const parents = await Promise.all(
          parentLinks.map(async (link) => {
            const parent = await ctx.db.get(link.parentId);
            return parent ? { 
              ...parent, 
              relationship: link.relationship,
              isPrimary: link.isPrimary 
            } : null;
          })
        );

        // جلب معلومات الفصل
        let classInfo = null;
        if (student.classId) {
          const classData = await ctx.db.get(student.classId);
          if (classData) {
            let supervisorName = null;
            if (classData.supervisorId) {
              const supervisor = await ctx.db.get(classData.supervisorId);
              supervisorName = supervisor?.name;
            }
            classInfo = {
              _id: classData._id,
              classNameAr: classData.classNameAr,
              classNameEn: classData.classNameEn,
              classCode: classData.classCode,
              grade: classData.grade,
              section: classData.section,
              supervisorName: supervisorName || "غير محدد",
              academicYear: classData.academicYear,
            };
          }
        }
        
        return { 
          ...student, 
          parents: parents.filter(Boolean),
          classInfo,
        };
      })
    );
    
    return studentsWithParentsAndClass;
  },
});

// convex/user/students.ts
// convex/user/students.ts

export const getStudentWithClass = query({
  args: { studentId: v.id("users") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("غير مصرح");

    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!currentUser) throw new Error("المستخدم غير موجود");
    
    // التأكد من أن المستخدم يطلب بياناته أو أنه مشرف
    if (currentUser.role !== "admin" && currentUser._id !== args.studentId) {
      throw new Error("غير مصرح بعرض هذه البيانات");
    }

    const student = await ctx.db.get(args.studentId);
    if (!student || student.role !== "student") {
      throw new Error("الطالب غير موجود");
    }

    // جلب بيانات الفصل
    let classData = null;
    if (student.classId) {
      classData = await ctx.db.get(student.classId);
    }

    if (!classData) {
      return {
        student,
        class: null,
        teachers: [],
        classmates: [],
        schedule: null,
        subjects: [],
      };
    }

    // ✅ التحقق من الطلاب الصحيحين في الفصل
    const validStudentIds = [];
    for (const studentId of (classData.students || [])) {
      const studentCheck = await ctx.db.get(studentId);
      if (studentCheck) {
        validStudentIds.push(studentId);
      }
    }

    // ✅ تحديث classData بالعدد الصحيح
    const updatedClassData = {
      ...classData,
      students: validStudentIds,
      currentStudents: validStudentIds.length,
    };

    // جلب المعلمين
    const teachers = await Promise.all(
      (classData.teachers || []).map(async (teacherId) => {
        const teacher = await ctx.db.get(teacherId);
        return teacher;
      })
    );

    // جلب الزملاء (طلاب الفصل)
    const classmates = await Promise.all(
      validStudentIds.map(async (studentId) => {
        const studentData = await ctx.db.get(studentId);
        return studentData;
      })
    );

    // جلب المواد الدراسية (الكورسات)
    const allCourses = await ctx.db
      .query("courses")
      .filter((q) => q.eq(q.field("isPublished"), true))
      .collect();

    // تصفية المواد التي يدرسها معلمو الفصل
    const teacherIds = new Set(classData.teachers || []);
    const subjects = allCourses.filter(course => 
      course.teacherId && teacherIds.has(course.teacherId)
    );

    // جدول اليوم (يمكن إضافة جدول منفصل في المستقبل)
    const schedule = {
      days: ["السبت", "الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس"],
      periods: [
        { time: "8:00 - 8:45", subject: null },
        { time: "8:45 - 9:30", subject: null },
        { time: "9:30 - 10:15", subject: null },
        // ... إلخ
      ],
    };

    return {
      student,
      class: updatedClassData,
      teachers: teachers.filter(Boolean),
      classmates: classmates.filter(Boolean),
      schedule,
      subjects,
    };
  },
});

export const registerStudent = mutation({
  args: {
    name: v.string(),
    email: v.optional(v.string()),
    phoneNumber: v.string(),
    birthDate: v.optional(v.number()),
    gender: v.optional(v.union(v.literal("male"), v.literal("female"))),
    address: v.optional(v.string()),
    classId: v.optional(v.id("classes")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("غير مصرح");

    // التحقق من أن المستخدم مش موجود
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (existingUser) {
      throw new Error("المستخدم مسجل بالفعل في النظام");
    }

    const studentId = await generateStudentId(ctx);

    // التحقق من البريد الإلكتروني
    if (args.email && args.email.trim() !== "") {
      const emailExists = await ctx.db
        .query("users")
        .withIndex("by_email", (q) => q.eq("email", args.email || ""))
        .first();
      
      if (emailExists) {
        // ✅ لو البريد موجود وطالب active (أضافه الأدمن)، نربطه بالحساب
        if (emailExists.role === "student" && emailExists.status === "active") {
          await ctx.db.patch(emailExists._id, {
            clerkId: identity.subject,
            updatedAt: Date.now(),
          });
          return { success: true, studentId: emailExists.studentId, userId: emailExists._id };
        }
        
        // ✅ لو البريد موجود وطالب pending، نرفض
        if (emailExists.role === "student" && emailExists.status === "pending") {
          throw new Error("هذا البريد الإلكتروني قيد الانتظار للموافقة");
        }
        
        throw new Error("البريد الإلكتروني موجود مسبقاً");
      }
    }

    // ✅ إنشاء الطالب بحالة pending (مش active)
    const student = await ctx.db.insert("users", {
      clerkId: identity.subject,
      name: args.name,
      email: args.email && args.email.trim() !== "" ? args.email : `${studentId}@system.local`,
      phoneNumber: args.phoneNumber,
      role: "student",
      status: "pending", // ✅ pending مش active
      studentId,
      classId: args.classId,
      birthDate: args.birthDate,
      gender: args.gender,
      address: args.address,
      grade: undefined,
      enrollmentDate: Date.now(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // إذا تم تحديد فصل، أضف الطالب إلى الفصل
    if (args.classId) {
      const classData = await ctx.db.get(args.classId);
      if (classData) {
        await ctx.db.patch(args.classId, {
          students: [...classData.students, student],
          currentStudents: classData.currentStudents + 1,
          updatedAt: Date.now(),
        });
      }
    }

    await ctx.db.insert("auditLogs", {
      userId: student,
      action: "REGISTER_STUDENT",
      resourceType: "user",
      resourceId: student,
      details: {
        studentId: studentId,
        name: args.name,
        email: args.email || `${studentId}@system.local`,
      },
      createdAt: Date.now(),
    });

    return { success: true, studentId, userId: student };
  },
});
// تحديث طالب
// Update student (Admin only)
export const updateStudent = mutation({
  args: {
    studentId: v.id("users"),
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    phoneNumber: v.optional(v.string()),
    birthDate: v.optional(v.number()),
    gender: v.optional(v.union(v.literal("male"), v.literal("female"))),
    address: v.optional(v.string()),
    grade: v.optional(v.string()),
    status: v.optional(v.union(v.literal("active"), v.literal("inactive"))),
    guardianName: v.optional(v.string()),
    guardianPhone: v.optional(v.string()),
    guardianEmail: v.optional(v.string()),
    guardianRelationship: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const admin = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!admin || admin.role !== "admin") {
      throw new Error("Unauthorized: Admin only");
    }

    const student = await ctx.db.get(args.studentId);
    if (!student || student.role !== "student") {
      throw new Error("Student not found");
    }

    const updateData: any = {
      updatedAt: Date.now(),
    };

    if (args.name !== undefined) updateData.name = args.name;
    if (args.email !== undefined) updateData.email = args.email;
    if (args.phoneNumber !== undefined)
      updateData.phoneNumber = args.phoneNumber;
    if (args.birthDate !== undefined) updateData.birthDate = args.birthDate;
    if (args.gender !== undefined) updateData.gender = args.gender;
    if (args.address !== undefined) updateData.address = args.address;
    if (args.grade !== undefined) updateData.grade = args.grade;
    if (args.status !== undefined) updateData.status = args.status;
    if (args.guardianName !== undefined)
      updateData.guardianName = args.guardianName;
    if (args.guardianPhone !== undefined)
      updateData.guardianPhone = args.guardianPhone;
    if (args.guardianEmail !== undefined)
      updateData.guardianEmail = args.guardianEmail;
    if (args.guardianRelationship !== undefined)
      updateData.guardianRelationship = args.guardianRelationship;

    await ctx.db.patch(args.studentId, updateData);

    await ctx.db.insert("auditLogs", {
      userId: admin._id,
      action: "UPDATE_STUDENT",
      resourceType: "user",
      resourceId: args.studentId,
      details: {
        studentId: student.studentId || "",
        updatedFields: Object.keys(updateData).filter((k) => k !== "updatedAt"),
        updatedBy: admin.email,
      },
      createdAt: Date.now(),
    });

    return { success: true };
  },
});

// حذف طالب
export const deleteStudent = mutation({
  args: { studentId: v.id("users") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const admin = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!admin || admin.role !== "admin") {
      throw new Error("Unauthorized: Admin only");
    }

    const student = await ctx.db.get(args.studentId);
    if (!student || student.role !== "student") {
      throw new Error("Student not found");
    }

    if (student.classId) {
      const classData = await ctx.db.get(student.classId);
      if (classData) {
        const updatedStudents = classData.students.filter(id => id !== student._id);
        await ctx.db.patch(student.classId, {
          students: updatedStudents,
          currentStudents: updatedStudents.length,
          updatedAt: Date.now(),
        });
      }
    }

    const parentLinks = await ctx.db
      .query("parentStudentLinks")
      .withIndex("by_student", (q) => q.eq("studentId", student._id))
      .collect();

    for (const link of parentLinks) {
      await ctx.db.delete(link._id);
    }

    const enrollments = await ctx.db
      .query("enrollments")
      .withIndex("by_student", (q) => q.eq("studentId", student._id))
      .collect();

    for (const enrollment of enrollments) {
      await ctx.db.delete(enrollment._id);
    }

    await ctx.db.delete(args.studentId);

    await ctx.db.insert("auditLogs", {
      userId: admin._id,
      action: "DELETE_STUDENT",
      resourceType: "user",
      resourceId: args.studentId,
      details: {
        studentId: student.studentId || "",
        name: student.name,
        deletedBy: admin.email,
      },
      createdAt: Date.now(),
    });

    return { success: true };
  },
});


// Get students statistics for dashboard
export const getStudentsStats = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const admin = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!admin || admin.role !== "admin") {
      throw new Error("Unauthorized: Admin only");
    }

    const allStudents = await ctx.db
      .query("users")
      .withIndex("by_role", (q) => q.eq("role", "student"))
      .collect();

    const active = allStudents.filter((s) => s.status === "active").length;
    const pending = allStudents.filter((s) => s.status === "pending").length;
    const inactive = allStudents.filter((s) => s.status === "inactive").length;
    const approved = allStudents.filter((s) => s.status === "approved").length;

    return {
      total: allStudents.length,
      active,
      pending,
      inactive,
      approved,
    };
  },
});

// أضف هذه الدالة في نهاية ملف students.ts قبل الأقواس الختامية

// الطلاب المنتظرين للموافقة
export const getPendingStudents = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("غير مصرح");

    const admin = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!admin || admin.role !== "admin") {
      throw new Error("مطلوب صلاحيات مشرف");
    }

    return await ctx.db
      .query("users")
      .withIndex("by_role", (q) => q.eq("role", "student"))
      .filter((q) => q.eq(q.field("status"), "pending"))
      .collect();
  },
});