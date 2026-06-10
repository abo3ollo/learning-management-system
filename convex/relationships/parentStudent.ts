import { v } from "convex/values";
import { mutation, query } from "../_generated/server";

// ربط ولي أمر بطالب
export const linkParentToStudent = mutation({
  args: {
    parentId: v.id("users"),
    studentId: v.id("users"),
    relationship: v.string(),
    isPrimary: v.boolean(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("غير مصرح");
    
    // التحقق من وجود الرابط
    const existing = await ctx.db
      .query("parentStudentLinks")
      .withIndex("by_parent_student", (q) => 
        q.eq("parentId", args.parentId).eq("studentId", args.studentId)
      )
      .first();
    
    if (existing) throw new Error("الرابط موجود مسبقاً");
    
    // إنشاء الرابط
    await ctx.db.insert("parentStudentLinks", {
      parentId: args.parentId,
      studentId: args.studentId,
      relationship: args.relationship,
      isPrimary: args.isPrimary,
      createdAt: Date.now(),
    });
    
    return { success: true };
  },
});

// جلب أبناء ولي الأمر
export const getStudentByParent = query({
  args: { parentId: v.id("users") },
  handler: async (ctx, args) => {
    const links = await ctx.db
      .query("parentStudentLinks")
      .withIndex("by_parent", (q) => q.eq("parentId", args.parentId))
      .collect();
    
    const students = await Promise.all(
      links.map(async (link) => {
        return await ctx.db.get(link.studentId);
      })
    );
    
    return students.filter(Boolean);
  },
});

// جلب أولياء أمر الطالب
export const getParentsByStudent = query({
  args: { studentId: v.id("users") },
  handler: async (ctx, args) => {
    const links = await ctx.db
      .query("parentStudentLinks")
      .withIndex("by_student", (q) => q.eq("studentId", args.studentId))
      .collect();
    
    const parents = await Promise.all(
      links.map(async (link) => {
        const parent = await ctx.db.get(link.parentId);
        return { ...parent, relationship: link.relationship, isPrimary: link.isPrimary };
      })
    );
    
    return parents.filter(Boolean);
  },
});