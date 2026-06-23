import { v } from "convex/values";
import { mutation, query } from "../_generated/server";
import { Id } from "../_generated/dataModel"; // ✅ إضافة استيراد Id

// ============================================
// MEDIA ASSIGNMENTS QUERIES
// ============================================

export const listMediaAssignments = query({
  args: {
    status:   v.optional(v.union(v.literal("draft"), v.literal("published"))),
    targetId: v.optional(v.string()),
    search:   v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) throw new Error("User not found");
    if (user.role !== "admin" && user.role !== "teacher") {
      throw new Error("Unauthorized");
    }

    let assignments;

    if (args.status) {
      assignments = await ctx.db
        .query("mediaAssignments")
        .withIndex("by_status", (q) => q.eq("status", args.status!))
        .order("desc")
        .collect();
    } else if (args.targetId) {
      assignments = await ctx.db
        .query("mediaAssignments")
        .withIndex("by_target", (q) => q.eq("targetId", args.targetId!))
        .order("desc")
        .collect();
    } else {
      assignments = await ctx.db
        .query("mediaAssignments")
        .order("desc")
        .collect();
    }

    // Filter by search
    if (args.search) {
      const q = args.search.toLowerCase();
      assignments = assignments.filter(
        (a) =>
          a.title.toLowerCase().includes(q) ||
          (a.description ?? "").toLowerCase().includes(q)
      );
    }

    // Enrich with media file names, assigner info, AND target info
    const enriched = await Promise.all(
      assignments.map(async (assignment) => {
        const mediaFiles = await Promise.all(
          assignment.mediaFileIds.map((id) => ctx.db.get(id))
        );
        const assigner = await ctx.db.get(assignment.assignedBy);
        
        // ✅ جلب اسم الهدف حسب نوع التعيين
        let targetName = null;
        if (assignment.assignTo === "student") {
          const student = await ctx.db.get(assignment.targetId as Id<"users">);
          targetName = (student as any)?.name;
        } else if (assignment.assignTo === "class" || assignment.assignTo === "section") {
          const classData = await ctx.db.get(assignment.targetId as Id<"classes">);
          targetName = (classData as any)?.classNameAr;
        }

        return {
          ...assignment,
          mediaFiles: mediaFiles.filter(Boolean),
          assignerName: (assigner as any)?.name ?? "Unknown",
          targetName,
        };
      })
    );

    return enriched;
  },
});

export const getMediaAssignmentById = query({
  args: { assignmentId: v.id("mediaAssignments") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const assignment = await ctx.db.get(args.assignmentId);
    if (!assignment) return null;

    const mediaFiles = await Promise.all(
      assignment.mediaFileIds.map((id) => ctx.db.get(id))
    );
    const assigner = await ctx.db.get(assignment.assignedBy);
    
    // ✅ جلب اسم الهدف
    let targetName = null;
    if (assignment.assignTo === "student") {
      const student = await ctx.db.get(assignment.targetId as Id<"users">);
      targetName = (student as any)?.name;
    } else if (assignment.assignTo === "class" || assignment.assignTo === "section") {
      const classData = await ctx.db.get(assignment.targetId as Id<"classes">);
      targetName = (classData as any)?.classNameAr;
    }

    return {
      ...assignment,
      mediaFiles: mediaFiles.filter(Boolean),
      assignerName: (assigner as any)?.name ?? "Unknown",
      targetName,
    };
  },
});

// For students: get assignments available to them
export const getStudentAssignments = query({
  args: { studentId: v.id("users") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const assignments = await ctx.db
      .query("mediaAssignments")
      .withIndex("by_target", (q) => q.eq("targetId", args.studentId))
      .collect();

    // Also get class-level assignments (targetId = classId of student's class)
    // This requires knowing which class the student belongs to
    // For now return direct assignments only
    const published = assignments.filter((a) => a.status === "published");

    const enriched = await Promise.all(
      published.map(async (a) => {
        const mediaFiles = await Promise.all(
          a.mediaFileIds.map((id) => ctx.db.get(id))
        );
        return { ...a, mediaFiles: mediaFiles.filter(Boolean) };
      })
    );

    return enriched;
  },
});

// ============================================
// MEDIA ASSIGNMENTS MUTATIONS
// ============================================

export const createMediaAssignment = mutation({
  args: {
    mediaFileIds:    v.array(v.id("mediaFiles")),
    assignTo:        v.union(v.literal("class"), v.literal("student"), v.literal("section")),
    targetId:        v.string(),
    title:           v.string(),
    description:     v.optional(v.string()),
    dueDate:         v.optional(v.number()),
    alwaysAvailable: v.boolean(),
    status:          v.union(v.literal("draft"), v.literal("published")),
    availability:    v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) throw new Error("User not found");
    if (user.role !== "admin" && user.role !== "teacher") {
      throw new Error("Unauthorized");
    }

    if (args.mediaFileIds.length === 0) {
      throw new Error("At least one media file must be selected");
    }

    // Validate all media files exist
    for (const fileId of args.mediaFileIds) {
      const file = await ctx.db.get(fileId);
      if (!file) throw new Error(`Media file not found: ${fileId}`);
    }

    const assignmentId = await ctx.db.insert("mediaAssignments", {
      mediaFileIds:    args.mediaFileIds,
      assignTo:        args.assignTo,
      targetId:        args.targetId,
      title:           args.title,
      description:     args.description,
      dueDate:         args.dueDate,
      alwaysAvailable: args.alwaysAvailable,
      status:          args.status,
      availability:    args.availability ?? (args.alwaysAvailable ? "media.always" : "media.scheduled"),
      assignedBy:      user._id,
      createdAt:       Date.now(),
    });

    // Mark each media file as used in this assignment
    for (const fileId of args.mediaFileIds) {
      const file = await ctx.db.get(fileId);
      if (file) {
        const currentUsedIn = (file as any).usedIn || [];
        await ctx.db.patch(fileId, {
          usedIn: [...currentUsedIn, assignmentId],
        });
      }
    }

    return assignmentId;
  },
});

export const updateMediaAssignment = mutation({
  args: {
    assignmentId:    v.id("mediaAssignments"),
    title:           v.optional(v.string()),
    description:     v.optional(v.string()),
    dueDate:         v.optional(v.number()),
    alwaysAvailable: v.optional(v.boolean()),
    status:          v.optional(v.union(v.literal("draft"), v.literal("published"))),
    mediaFileIds:    v.optional(v.array(v.id("mediaFiles"))),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) throw new Error("User not found");
    if (user.role !== "admin" && user.role !== "teacher") {
      throw new Error("Unauthorized");
    }

    const assignment = await ctx.db.get(args.assignmentId);
    if (!assignment) throw new Error("Assignment not found");

    const updates: Record<string, any> = {};

    if (args.title           !== undefined) updates.title           = args.title;
    if (args.description     !== undefined) updates.description     = args.description;
    if (args.dueDate         !== undefined) updates.dueDate         = args.dueDate;
    if (args.alwaysAvailable !== undefined) updates.alwaysAvailable = args.alwaysAvailable;
    if (args.status          !== undefined) updates.status          = args.status;

    // If media files changed, update usedIn on old and new files
    if (args.mediaFileIds !== undefined) {
      // Remove this assignment from old files
      for (const oldFileId of (assignment as any).mediaFileIds) {
        const file = await ctx.db.get(oldFileId);
        if (file) {
          const currentUsedIn = (file as any).usedIn || [];
          await ctx.db.patch(oldFileId, {
            usedIn: currentUsedIn.filter((id: Id<"mediaAssignments">) => id !== args.assignmentId),
          });
        }
      }
      // Add to new files
      for (const newFileId of args.mediaFileIds) {
        const file = await ctx.db.get(newFileId);
        if (file) {
          const currentUsedIn = (file as any).usedIn || [];
          if (!currentUsedIn.includes(args.assignmentId)) {
            await ctx.db.patch(newFileId, {
              usedIn: [...currentUsedIn, args.assignmentId],
            });
          }
        }
      }
      updates.mediaFileIds = args.mediaFileIds;
    }

    await ctx.db.patch(args.assignmentId, updates);
    return { success: true };
  },
});

export const publishMediaAssignment = mutation({
  args: { assignmentId: v.id("mediaAssignments") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user || (user.role !== "admin" && user.role !== "teacher")) {
      throw new Error("Unauthorized");
    }

    await ctx.db.patch(args.assignmentId, { status: "published" });
    return { success: true };
  },
});

export const deleteMediaAssignment = mutation({
  args: { assignmentId: v.id("mediaAssignments") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user || (user.role !== "admin" && user.role !== "teacher")) {
      throw new Error("Unauthorized");
    }

    const assignment = await ctx.db.get(args.assignmentId);
    if (!assignment) throw new Error("Assignment not found");

    // Remove this assignment from all media files' usedIn arrays
    for (const fileId of (assignment as any).mediaFileIds) {
      const file = await ctx.db.get(fileId);
      if (file) {
        const currentUsedIn = (file as any).usedIn || [];
        await ctx.db.patch(fileId, {
          usedIn: currentUsedIn.filter((id: Id<"mediaAssignments">) => id !== args.assignmentId),
        });
      }
    }

    await ctx.db.delete(args.assignmentId);
    return { success: true };
  },
});


// ✅ جلب جميع الوسائط المتاحة للطالب (من فصله وتعييناته الشخصية)
export const getStudentMedia = query({
  args: { studentId: v.id("users") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("غير مصرح");

    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!currentUser) throw new Error("المستخدم غير موجود");
    
    // التأكد من أن المستخدم يطلب بياناته
    if (currentUser._id !== args.studentId && currentUser.role !== "admin") {
      throw new Error("غير مصرح بعرض هذه البيانات");
    }

    const student = await ctx.db.get(args.studentId);
    if (!student || student.role !== "student") {
      throw new Error("الطالب غير موجود");
    }

    // ✅ 1. جلب جميع التعيينات المنشورة
    const allAssignments = await ctx.db
      .query("mediaAssignments")
      .withIndex("by_status", (q) => q.eq("status", "published"))
      .collect();

    // ✅ 2. تصفية التعيينات المتاحة للطالب
    const availableAssignments = allAssignments.filter((assignment) => {
      // إذا كان التعيين للطالب مباشرة
      if (assignment.assignTo === "student" && assignment.targetId === student._id) {
        return true;
      }
      
      // إذا كان التعيين للفصل (class) والطالب في هذا الفصل
      if (assignment.assignTo === "class" && student.classId && assignment.targetId === student.classId) {
        return true;
      }
      
      // إذا كان التعيين للشعبة (section) والطالب في هذه الشعبة
      if (assignment.assignTo === "section" && student.classId && assignment.targetId === student.classId) {
        return true;
      }
      
      return false;
    });

    // ✅ 3. جلب الملفات المرتبطة بكل تعيين
    const mediaFilesMap = new Map();
    const mediaIds = new Set();

    for (const assignment of availableAssignments) {
      for (const fileId of assignment.mediaFileIds) {
        if (!mediaIds.has(fileId)) {
          mediaIds.add(fileId);
          const file = await ctx.db.get(fileId);
          if (file && file.status === "ok") {
            // إضافة معلومات التعيين للملف
            mediaFilesMap.set(fileId, {
              ...file,
              assignmentTitle: assignment.title,
              assignmentId: assignment._id,
              assignmentDescription: assignment.description,
              dueDate: assignment.dueDate,
              alwaysAvailable: assignment.alwaysAvailable,
            });
          }
        }
      }
    }

    // ✅ 4. ترتيب الملفات حسب تاريخ الرفع (الأحدث أولاً)
    const mediaFiles = Array.from(mediaFilesMap.values())
      .sort((a, b) => b.uploadedAt - a.uploadedAt);

    return {
      mediaFiles,
      assignments: availableAssignments,
      total: mediaFiles.length,
    };
  },
});