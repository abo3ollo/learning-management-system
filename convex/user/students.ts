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
    guardianName: v.optional(v.string()),
    guardianPhone: v.optional(v.string()),
    guardianEmail: v.optional(v.string()),
    guardianRelationship: v.optional(v.string()),
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
    
    // التحقق من البريد الإلكتروني
    if (args.email && args.email.trim() !== "") {
      const emailExists = await ctx.db
        .query("users")
        .withIndex("by_email", (q) => q.eq("email", args.email || ""))
        .first();
      if (emailExists) throw new Error("البريد الإلكتروني موجود مسبقاً");
    }
    
    // إنشاء الطالب
    const student = await ctx.db.insert("users", {
      clerkId: `manual_${studentId}`,
      name: args.name,
      email: args.email || `${studentId}@system.local`,
      phoneNumber: args.phoneNumber,
      role: "student",
      status: "active",
      studentId,
      birthDate: args.birthDate,
      gender: args.gender,
      address: args.address,
      grade: args.grade,
      guardianName: args.guardianName,
      guardianPhone: args.guardianPhone,
      guardianEmail: args.guardianEmail,
      guardianRelationship: args.guardianRelationship,
      enrollmentDate: Date.now(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    
    // ✅ ربط ولي الأمر إذا وجد - مع إضافة permissions المطلوبة
    if (args.parentId) {
      await ctx.db.insert("parentStudentLinks", {
        parentId: args.parentId,
        studentId: student,
        relationship: args.guardianRelationship || "guardian",
        isPrimary: true,
        permissions: {                    // ✅ إضافة permissions المطلوبة
          viewGrades: true,
          financialAccess: false,
          pickupNotification: false,
          emergencyContact: false,
        },
        createdAt: Date.now(),
      });
    }
    
    return { success: true, studentId, userId: student };
  },
});

// جلب جميع الطلاب
export const getStudents = query({
  args: {
    status: v.optional(v.string()),
    search: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // التحقق من الصلاحيات...
    const students = await ctx.db
      .query("users")
      .withIndex("by_role", (q) => q.eq("role", "student"))
      .collect();
    
    // إضافة معلومات أولياء الأمور
    const studentsWithParents = await Promise.all(
      students.map(async (student) => {
        const parentLinks = await ctx.db
          .query("parentStudentLinks")
          .withIndex("by_student", (q) => q.eq("studentId", student._id))
          .collect();
        
        const parents = await Promise.all(
          parentLinks.map(async (link) => {
            const parent = await ctx.db.get(link.parentId);
            return { ...parent, relationship: link.relationship };
          })
        );
        
        return { ...student, parents };
      })
    );
    
    return studentsWithParents;
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