import { v } from "convex/values";
import { mutation, query } from "../_generated/server";
import { generateStudentId } from "./helpers";
import { Id } from "../_generated/dataModel";


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
    gradeId: v.optional(v.id("grades")),
    groupId: v.optional(v.id("groups")),
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
      gradeId: args.gradeId,
      groupId: args.groupId,
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
    
    // ✅ إضافة الطالب إلى المجموعة إذا تم تحديدها
    if (args.groupId) {
      const groupData = await ctx.db.get(args.groupId);
      if (groupData) {
        await ctx.db.patch(args.groupId, {
          students: [...(groupData.students || []), student],
          currentStudents: (groupData.currentStudents || 0) + 1,
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
export const getAvailableStudentsForGroup = query({
  args: {
    groupId: v.id("groups"),
    search: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("غير مصرح");

    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!currentUser || (currentUser.role !== "admin" && currentUser.role !== "teacher")) {
      throw new Error("مطلوب صلاحيات مشرف أو معلم");
    }

    const group = await ctx.db.get(args.groupId);
    if (!group) throw new Error("المجموعة غير موجودة");

    let students = await ctx.db
      .query("users")
      .withIndex("by_role", (q) => q.eq("role", "student"))
      .collect();

    students = students.filter((student) => student.status === "active" && student.gradeId === group.gradeId && !group.students.includes(student._id));

    if (args.search && args.search.trim() !== "") {
      const searchLower = args.search.toLowerCase();
      students = students.filter((student) =>
        student.name.toLowerCase().includes(searchLower) ||
        student.email.toLowerCase().includes(searchLower) ||
        student.studentId?.toLowerCase().includes(searchLower)
      );
    }

    return students.sort((a, b) => a.name.localeCompare(b.name));
  },
});

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

    // ✅ جلب بيانات المجموعة/الصف من الطالب
    let classData = null;
    const studentGroup = student.groupId
      ? await ctx.db.get(student.groupId)
      : null;

    if (studentGroup) {
      classData = {
        ...studentGroup,
        _id: studentGroup._id,
        classNameAr: studentGroup.name,
        classNameEn: studentGroup.nameEn,
        classCode: studentGroup._id,
        grade: student.gradeId ? (await ctx.db.get(student.gradeId))?.name : "",
        section: studentGroup.subject,
        status: studentGroup.status,
        academicYear: student.gradeId ? (await ctx.db.get(student.gradeId))?.academicYear : "",
        location: studentGroup.location,
        currentStudents: studentGroup.currentStudents || studentGroup.students?.length || 0,
      };
    }

    // ✅ إذا مفيش مجموعة نهائياً، أرجع بيانات الطالب فقط
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

    // ✅ جلب جميع الطلاب المسجلين في المجموعة
    let studentIdsInClass = classData.students || [];
    
    // ✅ دمج المعرفات (مع إزالة التكرار)
    const allStudentIds = new Set(studentIdsInClass);

    // ✅ فلترة المعرفات الصحيحة
    const validStudentIds: Id<"users">[] = [];
    for (const studentId of allStudentIds) {
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

    // ✅ جلب المعلمين (من classData.teachers)
    let teachers: any[] = [];
    const teacherIds = new Set(classData.teachers || []);
    
    // ✅ جلب المشرف أيضاً
    if (classData.supervisorId) {
      teacherIds.add(classData.supervisorId);
    }

    for (const teacherId of teacherIds) {
      const teacher = await ctx.db.get(teacherId);
      if (teacher) {
        teachers.push(teacher);
      }
    }

    // ✅ جلب الزملاء (جميع الطلاب ما عدا الطالب نفسه)
    const classmates = await Promise.all(
      validStudentIds
        .filter(id => id !== student._id) // استبعاد الطالب نفسه
        .map(async (studentId) => {
          const studentData = await ctx.db.get(studentId);
          return studentData;
        })
    );

    // ✅ جلب المواد الدراسية (الكورسات)
    // جلب جميع الكورسات
    const allCourses = await ctx.db.query("courses").collect();
    
    // ✅ تصفية المواد التي تخص هذا الفصل
    let subjects = allCourses.filter(course => {
      // ✅ التحقق من أن المعلم يدرس هذا الكورس وهو من معلمي الفصل
      if (course.teacherId && teacherIds.has(course.teacherId)) {
        return true;
      }
      // أو إذا كان المعلم الذي يدرس الكورس من معلمي الفصل
      if (course.teacherId && teacherIds.has(course.teacherId)) {
        return true;
      }
      return false;
    });

    // ✅ جلب اسم المعلم لكل مادة
    subjects = await Promise.all(
      subjects.map(async (course) => {
        let teacherName = "معلم غير معروف";
        if (course.teacherId) {
          const teacher = await ctx.db.get(course.teacherId);
          if (teacher) {
            teacherName = teacher.name;
          }
        }
        return {
          ...course,
          teacherName,
        };
      })
    );

    // ✅ جدول اليوم (يمكن إضافة جدول منفصل في المستقبل)
    const schedule = {
      days: ["السبت", "الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس"],
      periods: [
        { time: "8:00 - 8:45", subject: null },
        { time: "8:45 - 9:30", subject: null },
        { time: "9:30 - 10:15", subject: null },
        { time: "10:15 - 10:30", subject: null, break: true },
        { time: "10:30 - 11:15", subject: null },
        { time: "11:15 - 12:00", subject: null },
        { time: "12:00 - 12:45", subject: null },
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
    gradeId: v.optional(v.id("grades")),
    groupId: v.optional(v.id("groups")),
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
      gradeId: args.gradeId,
      groupId: args.groupId,
      birthDate: args.birthDate,
      gender: args.gender,
      address: args.address,
      grade: undefined,
      enrollmentDate: Date.now(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // إذا تم تحديد مجموعة، أضف الطالب إلى المجموعة
    if (args.groupId) {
      const groupData = await ctx.db.get(args.groupId);
      if (groupData) {
        await ctx.db.patch(args.groupId, {
          students: [...(groupData.students || []), student],
          currentStudents: (groupData.currentStudents || 0) + 1,
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

    if (student.groupId) {
      const groupData = await ctx.db.get(student.groupId);
      if (groupData) {
        const updatedStudents = (groupData.students || []).filter((id: Id<"users">) => id !== student._id);
        await ctx.db.patch(student.groupId, {
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