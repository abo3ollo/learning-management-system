import { v } from "convex/values";
import { mutation, query } from "../_generated/server";

// إنشاء ولي أمر جديد
export const createParent = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    phoneNumber: v.string(),
    address: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("غير مصرح");
    
    // التحقق من البريد
    const existing = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();
    
    if (existing) throw new Error("البريد الإلكتروني موجود مسبقاً");
    
    // إنشاء ولي الأمر
    const parentId = await ctx.db.insert("users", {
      clerkId: `parent_${Date.now()}`,
      name: args.name,
      email: args.email,
      phoneNumber: args.phoneNumber,
      address: args.address,
      role: "parent",
      status: "active",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    
    return { success: true, parentId };
  },
});

// جلب جميع أولياء الأمور
export const getParents = query({
  args: {},
  handler: async (ctx) => {
    const parents = await ctx.db
      .query("users")
      .withIndex("by_role", (q) => q.eq("role", "parent"))
      .collect();
    
    // جلب أبناء كل ولي أمر
    const parentsWithChildren = await Promise.all(
      parents.map(async (parent) => {
        const links = await ctx.db
          .query("parentStudentLinks")
          .withIndex("by_parent", (q) => q.eq("parentId", parent._id))
          .collect();
        
        const children = await Promise.all(
          links.map(async (link) => {
            return await ctx.db.get(link.studentId);
          })
        );
        
        return { ...parent, children: children.filter(Boolean) };
      })
    );
    
    return parentsWithChildren;
  },
});