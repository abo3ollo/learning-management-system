
import { v } from "convex/values";
import { mutation, query } from "../_generated/server";

// دالة مساعدة لتوليد رقم معلم فريد
async function generateTeacherId(ctx: any): Promise<string> {
  const teachers = await ctx.db
    .query("users")
    .withIndex("by_role", (q:any) => q.eq("role", "teacher"))
    .collect();
  
  const nextNumber = teachers.length + 1;
  return `TCH-${String(nextNumber).padStart(5, '0')}`;
}

// دالة مساعدة لتوليد رقم طالب فريد
async function generateStudentId(ctx: any): Promise<string> {
  const students = await ctx.db
    .query("users")
    .withIndex("by_role", (q:any) => q.eq("role", "student"))
    .collect();
  
  const nextNumber = students.length + 1;
  return `STU-${String(nextNumber).padStart(5, '0')}`;
}

// ✅ إنشاء مستخدم جديد (مع دعم حقول المعلم والطالب)
export const createUser = mutation({
  args: {
    clerkId:      v.string(),
    email:        v.string(),
    name:         v.string(),
    phoneNumber:  v.optional(v.string()),
    role:         v.union(
      v.literal("student"),
      v.literal("teacher"),
      v.literal("parent"),
      v.literal("admin"),
    ),
 
    // Student fields
    studentId:      v.optional(v.string()),
    birthDate:      v.optional(v.number()),
    gender:         v.optional(v.union(v.literal("male"), v.literal("female"))),
    address:        v.optional(v.string()),
    grade:          v.optional(v.string()),
    gradeId:        v.optional(v.id("grades")),
    groupId:        v.optional(v.id("groups")),
    
    classId:        v.optional(v.id("classes")),
    enrollmentDate: v.optional(v.number()),
 
    // Teacher fields
    teacherId:      v.optional(v.string()),
    specialization: v.optional(v.string()),
    qualification:  v.optional(v.string()),
    experience:     v.optional(v.number()),
    hireDate:       v.optional(v.number()),
    salary:         v.optional(v.number()),
    subjects:       v.optional(v.array(v.string())),
 
    // Parent fields
    parentId:       v.optional(v.string()),
    workPhone:      v.optional(v.string()),
    workAddress:    v.optional(v.string()),
    jobTitle:       v.optional(v.string()),
    nationalId:     v.optional(v.string()),
    relationship:   v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Prevent duplicates:
    // 1) If a user with this clerkId already exists — return it.
    // 2) If a user with this email exists, link clerkId if missing and return that record instead of creating a duplicate.
    // 3) If a user with this email exists and already has a different clerkId, return the existing record (do not create duplicate).
    const existingByClerk = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (existingByClerk) return existingByClerk._id;

    const existingByEmail = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (existingByEmail) {
      // Attach clerkId to the existing record if it wasn't set yet so getCurrentUser will find it.
      if (!existingByEmail.clerkId) {
        await ctx.db.patch(existingByEmail._id, { clerkId: args.clerkId, updatedAt: Date.now() });
      } else {
        // If there is already a different clerkId, do not create a duplicate.
        // Optionally: record an audit log or notify admin about the identity conflict.
      }
      return existingByEmail._id;
    }
 
    const now = Date.now();
 
    return await ctx.db.insert("users", {
      // Core
      clerkId:     args.clerkId,
      email:       args.email,
      name:        args.name,
      phoneNumber: args.phoneNumber,
      role:        args.role,
      status:      "pending",
      createdAt:   now,
      updatedAt:   now,
 
      // Student
      studentId:      args.studentId,
      birthDate:      args.birthDate,
      gender:         args.gender,
      address:        args.address,
      grade:          args.grade,
      gradeId:        args.gradeId,
      groupId:        args.groupId,
      classId:        args.classId,
      enrollmentDate: args.enrollmentDate,
 
      // Teacher
      teacherId:      args.teacherId,
      specialization: args.specialization,
      qualification:  args.qualification,
      experience:     args.experience,
      hireDate:       args.hireDate,
      salary:         args.salary,
      subjects:       args.subjects,
 
      // Parent
      parentId:     args.parentId,
      workPhone:    args.workPhone,
      workAddress:  args.workAddress,
      jobTitle:     args.jobTitle,
      nationalId:   args.nationalId,
      relationship: args.relationship,
    });
  },
});

// ✅ جلب المستخدم الحالي
export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();

    return user || null;
  },
});

// ✅ جلب المستخدم بواسطة البريد الإلكتروني
export const getUserByEmail = mutation({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    return user || null;
  },
});


// ✅ تصدير الدوال
export const auth = {
  createUser,
  getCurrentUser,
  getUserByEmail,
};
// التحقق من حالة التسجيل
export const checkRegistrationStatus = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) return null;

    return {
      status: user.status,
      role: user.role,
      rejectionReason: user.rejectionReason,
      createdAt: user.createdAt,
    };
  },
});
