import { v } from "convex/values";
import { mutation, query } from "../_generated/server";

// ============================================
// MEDIA FILES QUERIES
// ============================================

export const listMediaFiles = query({
  args: {
    type: v.optional(v.union(
      v.literal("image"),
      v.literal("video"),
      v.literal("youtube"),
      v.literal("pdf"),
      v.literal("audio"),
    )),
    context: v.optional(v.string()),
    search: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    let filesQuery = ctx.db.query("mediaFiles");

    // Filter by type if provided
    if (args.type) {
      const results = await filesQuery
        .withIndex("by_type", (q) => q.eq("type", args.type!))
        .order("desc")
        .collect();

      return results.filter((f) => {
        const matchContext = !args.context || f.context === args.context;
        const matchSearch  = !args.search  || f.name.toLowerCase().includes(args.search!.toLowerCase());
        return matchContext && matchSearch;
      });
    }

    const all = await filesQuery.order("desc").collect();

    return all.filter((f) => {
      const matchContext = !args.context || f.context === args.context;
      const matchSearch  = !args.search  || f.name.toLowerCase().includes(args.search!.toLowerCase());
      return matchContext && matchSearch;
    });
  },
});

export const getMediaFileById = query({
  args: { fileId: v.id("mediaFiles") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    return await ctx.db.get(args.fileId);
  },
});

export const getMediaFileStats = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const all = await ctx.db.query("mediaFiles").collect();

    return {
      total:    all.length,
      images:   all.filter((f) => f.type === "image").length,
      videos:   all.filter((f) => f.type === "video" || f.type === "youtube").length,
      pdfs:     all.filter((f) => f.type === "pdf").length,
      unused:   all.filter((f) => f.usedIn.length === 0).length,
      totalSize: all.reduce((sum, f) => sum + (f.size ?? 0), 0),
    };
  },
});

// ============================================
// MEDIA FILES MUTATIONS
// ============================================

export const createMediaFile = mutation({
  args: {
    name:      v.string(),
    type:      v.union(
      v.literal("image"),
      v.literal("video"),
      v.literal("youtube"),
      v.literal("pdf"),
      v.literal("audio"),
    ),
    url:       v.string(),
    r2Key:     v.optional(v.string()),
    size:      v.optional(v.number()),
    context:   v.string(),
    mimeType:  v.optional(v.string()),
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
      throw new Error("Unauthorized: Only admins and teachers can upload media");
    }

    const fileId = await ctx.db.insert("mediaFiles", {
      name:       args.name,
      type:       args.type,
      url:        args.url,
      r2Key:      args.r2Key,
      size:       args.size,
      context:    args.context,
      mimeType:   args.mimeType,
      status:     "ok",
      uploadedBy: user._id,
      uploadedAt: Date.now(),
      usedIn:     [],
    });

    return fileId;
  },
});

export const addYoutubeFile = mutation({
  args: {
    url:     v.string(),
    title:   v.string(),  // ✅ جعل title مطلوباً
    context: v.optional(v.string()),
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

    // Extract YouTube video ID from URL
    const match = args.url.match(
      /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/
    );
    const videoId = match ? match[1] : args.url;
    
    // ✅ استخدام العنوان المدخل من المستخدم بدلاً من المولّد تلقائياً
    const name = args.title;

    const fileId = await ctx.db.insert("mediaFiles", {
      name,  // ✅ استخدام العنوان المدخل
      type:       "youtube",
      url:        args.url,
      size:       0,
      context:    args.context ?? "general",
      status:     "ok",
      uploadedBy: user._id,
      uploadedAt: Date.now(),
      usedIn:     [],
    });

    return fileId;
  },
});

export const deleteMediaFile = mutation({
  args: { fileId: v.id("mediaFiles") },
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

    const file = await ctx.db.get(args.fileId);
    if (!file) throw new Error("File not found");

    // Teachers can only delete their own files
    if (user.role === "teacher" && file.uploadedBy !== user._id) {
      throw new Error("Unauthorized: Cannot delete another teacher's file");
    }

    // Delete related assignments first
    const assignments = await ctx.db
      .query("mediaAssignments")
      .withIndex("by_status", (q) => q.eq("status", "draft"))
      .collect();

    for (const a of assignments) {
      if (a.mediaFileIds.includes(args.fileId)) {
        // Remove this file from the assignment's list
        const updated = a.mediaFileIds.filter((id) => id !== args.fileId);
        if (updated.length === 0) {
          await ctx.db.delete(a._id);
        } else {
          await ctx.db.patch(a._id, { mediaFileIds: updated });
        }
      }
    }

    await ctx.db.delete(args.fileId);

    // Return the r2Key so the caller can delete from R2
    return { r2Key: file.r2Key ?? null };
  },
});

export const deleteUnusedFiles = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user || user.role !== "admin") {
      throw new Error("Unauthorized: Admin only");
    }

    const unused = await ctx.db
      .query("mediaFiles")
      .collect()
      .then((files) => files.filter((f) => f.usedIn.length === 0));

    const r2Keys: string[] = [];

    for (const file of unused) {
      if (file.r2Key) r2Keys.push(file.r2Key);
      await ctx.db.delete(file._id);
    }

    return { deleted: unused.length, r2Keys };
  },
});