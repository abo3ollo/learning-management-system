// convex/user/parents.ts
import { v } from "convex/values";
import { mutation, query } from "../_generated/server";
import { Doc, Id } from "../_generated/dataModel";

// إضافة ولي أمر جديد
export const createParent = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    phoneNumber: v.string(),
    workPhone: v.optional(v.string()),
    workAddress: v.optional(v.string()),
    jobTitle: v.optional(v.string()),
    nationalId: v.optional(v.string()),
    address: v.optional(v.string()),
    relationship: v.optional(v.string()),
    status: v.optional(v.union(v.literal("active"), v.literal("inactive"))),
    children: v.optional(v.array(v.id("users"))),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("غير مصرح");

    const admin = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!admin || admin.role !== "admin") {
      throw new Error("مطلوب صلاحيات مشرف");
    }

    // Check if email exists
    const emailExists = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (emailExists) {
      throw new Error("البريد الإلكتروني موجود مسبقاً");
    }

    // Generate parent ID
    const parentId = `PAR${Date.now().toString().slice(-6)}`;

    // Create parent
    const parent = await ctx.db.insert("users", {
      clerkId: `parent_${parentId}`,
      name: args.name,
      email: args.email,
      phoneNumber: args.phoneNumber,
      role: "parent",
      status: args.status || "active",
      parentId,
      workPhone: args.workPhone,
      workAddress: args.workAddress,
      jobTitle: args.jobTitle,
      nationalId: args.nationalId,
      address: args.address,
      relationship: args.relationship,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Create audit log
    await ctx.db.insert("auditLogs", {
      userId: admin._id,
      action: "CREATE_PARENT",
      resourceType: "user",
      resourceId: parent,
      details: {
        parentId,
        name: args.name,
        email: args.email,
        createdBy: admin.email,
      },
      createdAt: Date.now(),
    });

    return { success: true, parentId, userId: parent };
  },
});

// جلب جميع أولياء الأمور
export const getParents = query({
  args: {
    status: v.optional(v.string()),
    search: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("غير مصرح");

    const admin = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!admin || admin.role !== "admin") {
      throw new Error("مطلوب صلاحيات مشرف");
    }

    let parentsQuery = ctx.db
      .query("users")
      .withIndex("by_role", (q) => q.eq("role", "parent"));

    if (args.status) {
      parentsQuery = parentsQuery.filter((q) => q.eq(q.field("status"), args.status));
    }

    let parents = await parentsQuery.collect();

    // Apply search filter
    if (args.search && args.search.trim() !== "") {
      const searchLower = args.search.toLowerCase();
      parents = parents.filter((parent) =>
        parent.name.toLowerCase().includes(searchLower) ||
        parent.email.toLowerCase().includes(searchLower) ||
        parent.parentId?.toLowerCase().includes(searchLower) ||
        parent.phoneNumber?.includes(args.search || "")
      );
    }

    // Get children count for each parent
    const parentsWithStats = await Promise.all(
      parents.map(async (parent) => {
        const links = await ctx.db
          .query("parentStudentLinks")
          .withIndex("by_parent", (q) => q.eq("parentId", parent._id))
          .collect();

        const children = await Promise.all(
          links.map(async (link) => {
            const student = await ctx.db.get(link.studentId);
            return {
              ...student,
              relationship: link.relationship,
              isPrimary: link.isPrimary,
            };
          })
        );

        return {
          ...parent,
          childrenCount: children.length,
          children,
        };
      })
    );

    return parentsWithStats;
  },
});

// جلب ولي أمر بواسطة ID
export const getParentById = query({
  args: { parentId: v.id("users") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("غير مصرح");

    const admin = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!admin || admin.role !== "admin") {
      throw new Error("مطلوب صلاحيات مشرف");
    }

    const parent = await ctx.db.get(args.parentId);
    if (!parent || parent.role !== "parent") {
      throw new Error("ولي الأمر غير موجود");
    }

    const links = await ctx.db
      .query("parentStudentLinks")
      .withIndex("by_parent", (q) => q.eq("parentId", parent._id))
      .collect();

    const children = await Promise.all(
      links.map(async (link) => {
        const student = await ctx.db.get(link.studentId);
        return {
          ...student,
          relationship: link.relationship,
          isPrimary: link.isPrimary,
        };
      })
    );

    // Get available students for linking
    const allStudents = await ctx.db
      .query("users")
      .withIndex("by_role", (q) => q.eq("role", "student"))
      .collect();

    const linkedStudentIds = new Set(children.map(c => c._id));
    const availableStudents = allStudents.filter(s => !linkedStudentIds.has(s._id));

    return {
      ...parent,
      children,
      availableStudents,
      childrenCount: children.length,
    };
  },
});

// تحديث ولي أمر
export const updateParent = mutation({
  args: {
    parentId: v.id("users"),
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    phoneNumber: v.optional(v.string()),
    workPhone: v.optional(v.string()),
    workAddress: v.optional(v.string()),
    jobTitle: v.optional(v.string()),
    nationalId: v.optional(v.string()),
    address: v.optional(v.string()),
    relationship: v.optional(v.string()),
    status: v.optional(v.union(v.literal("active"), v.literal("inactive"))),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("غير مصرح");

    const admin = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!admin || admin.role !== "admin") {
      throw new Error("مطلوب صلاحيات مشرف");
    }

    const parent = await ctx.db.get(args.parentId);
    if (!parent || parent.role !== "parent") {
      throw new Error("ولي الأمر غير موجود");
    }

    const updateData: any = { updatedAt: Date.now() };
    if (args.name !== undefined) updateData.name = args.name;
    if (args.email !== undefined) updateData.email = args.email;
    if (args.phoneNumber !== undefined) updateData.phoneNumber = args.phoneNumber;
    if (args.workPhone !== undefined) updateData.workPhone = args.workPhone;
    if (args.workAddress !== undefined) updateData.workAddress = args.workAddress;
    if (args.jobTitle !== undefined) updateData.jobTitle = args.jobTitle;
    if (args.nationalId !== undefined) updateData.nationalId = args.nationalId;
    if (args.address !== undefined) updateData.address = args.address;
    if (args.relationship !== undefined) updateData.relationship = args.relationship;
    if (args.status !== undefined) updateData.status = args.status;

    await ctx.db.patch(args.parentId, updateData);

    return { success: true };
  },
});

// حذف ولي أمر
export const deleteParent = mutation({
  args: { parentId: v.id("users") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("غير مصرح");

    const admin = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!admin || admin.role !== "admin") {
      throw new Error("مطلوب صلاحيات مشرف");
    }

    const parent = await ctx.db.get(args.parentId);
    if (!parent || parent.role !== "parent") {
      throw new Error("ولي الأمر غير موجود");
    }

    // Delete parent-student links
    const links = await ctx.db
      .query("parentStudentLinks")
      .withIndex("by_parent", (q) => q.eq("parentId", parent._id))
      .collect();

    for (const link of links) {
      await ctx.db.delete(link._id);
    }

    await ctx.db.delete(args.parentId);

    return { success: true };
  },
});

// إحصائيات أولياء الأمور
export const getParentsStats = query({
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

    const allParents = await ctx.db
      .query("users")
      .withIndex("by_role", (q) => q.eq("role", "parent"))
      .collect();

    const active = allParents.filter((p) => p.status === "active").length;
    const inactive = allParents.filter((p) => p.status === "inactive").length;

    return {
      total: allParents.length,
      active,
      inactive,
    };
  },
});