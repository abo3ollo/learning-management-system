// convex/chat/participants.ts

import { v } from "convex/values";
import { mutation, query } from "../_generated/server";
import { Id } from "../_generated/dataModel";

// ✅ إضافة مشارك إلى المحادثة
export const addParticipant = mutation({
  args: {
    chatId: v.id("chatGroups"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("غير مصرح");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) throw new Error("المستخدم غير موجود");

    const chat = await ctx.db.get(args.chatId);
    if (!chat || !chat.isActive) throw new Error("المحادثة غير موجودة");

    // التحقق من صلاحية المدير
    const participant = await ctx.db
      .query("chatParticipants")
      .withIndex("by_chat_user", (q) =>
        q.eq("chatId", args.chatId).eq("userId", user._id)
      )
      .first();

    if (!participant || participant.role !== "admin") {
      throw new Error("مطلوب صلاحيات مدير المجموعة");
    }

    // التحقق من أن المستخدم غير موجود بالفعل
    const existing = await ctx.db
      .query("chatParticipants")
      .withIndex("by_chat_user", (q) =>
        q.eq("chatId", args.chatId).eq("userId", args.userId)
      )
      .first();

    if (existing) {
      if (existing.status === "kicked") {
        // إعادة تفعيل العضو المطرود
        await ctx.db.patch(existing._id, {
          status: "active",
          joinedAt: Date.now(),
          role: "member",
        });
        return { success: true };
      }
      throw new Error("المستخدم موجود بالفعل في المحادثة");
    }

    // إضافة المستخدم
    await ctx.db.insert("chatParticipants", {
      chatId: args.chatId,
      userId: args.userId,
      role: "member",
      status: "active",
      joinedAt: Date.now(),
      isMuted: false,
      pinned: false,
    });

    // إضافة رسالة نظام
    const newUser = await ctx.db.get(args.userId);
    await ctx.db.insert("chatMessages", {
      chatId: args.chatId,
      senderId: user._id,
      content: `تم إضافة ${newUser?.name || "مستخدم جديد"} إلى المحادثة`,
      type: "system",
      isEdited: false,
      isDeleted: false,
      isPinned: false,
      readBy: [user._id],
      createdAt: Date.now(),
    });

    return { success: true };
  },
});


export const addMultipleParticipants = mutation({
  args: {
    chatId: v.id("chatGroups"),
    userIds: v.array(v.id("users")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("غير مصرح");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) throw new Error("المستخدم غير موجود");

    // ✅ منع الطلاب تماماً من إضافة أعضاء
    if (user.role === "student") {
      throw new Error("غير مصرح للطلاب بإضافة أعضاء");
    }

    const chat = await ctx.db.get(args.chatId);
    if (!chat || !chat.isActive) throw new Error("المحادثة غير موجودة");

    // ✅ التحقق من صلاحية المدير أو المعلم
    const participant = await ctx.db
      .query("chatParticipants")
      .withIndex("by_chat_user", (q) =>
        q.eq("chatId", args.chatId).eq("userId", user._id)
      )
      .first();

    if (!participant) {
      throw new Error("أنت لست عضواً في هذه المحادثة");
    }

    const isAdmin = participant.role === "admin";
    const isCreator = chat.createdBy === user._id;
    const isTeacher = user.role === "teacher";

    // ✅ السماح للمعلم بإضافة طلاب مجموعته فقط
    if (isTeacher && !isAdmin && !isCreator) {
      // التحقق من أن المعلم مرتبط بمجموعة هذه المحادثة
      if (!chat.groupId) {
        throw new Error("غير مصرح لك بإضافة أعضاء لهذه المحادثة");
      }
      
      const group = await ctx.db.get(chat.groupId as Id<"groups">);
      if (!group) {
        throw new Error("المجموعة غير موجودة");
      }
      
      const isTeacherInGroup = group.teachers?.includes(user._id) || 
                              group.createdBy === user._id ||
                              group.supervisorId === user._id;
      
      if (!isTeacherInGroup) {
        throw new Error("غير مصرح لك بإضافة أعضاء لهذه المحادثة");
      }
      
      // ✅ التحقق من أن المستخدمين المضافين هم طلاب في نفس المجموعة
      for (const userId of args.userIds) {
        const newUser = await ctx.db.get(userId);
        if (!newUser || newUser.role !== "student") {
          throw new Error("يمكن للمعلم إضافة طلاب فقط");
        }
        if (newUser.gradeId !== group.gradeId) {
          throw new Error("الطالب ليس في نفس الصف الدراسي");
        }
        if (!group.students.includes(userId)) {
          throw new Error("الطالب ليس من مجموعتك");
        }
      }
    } else if (!isAdmin && !isCreator) {
      throw new Error("مطلوب صلاحيات مدير المجموعة");
    }

    let addedCount = 0;

    for (const userId of args.userIds) {
      const existing = await ctx.db
        .query("chatParticipants")
        .withIndex("by_chat_user", (q) =>
          q.eq("chatId", args.chatId).eq("userId", userId)
        )
        .first();

      if (!existing || existing.status === "kicked") {
        if (existing) {
          await ctx.db.patch(existing._id, {
            status: "active",
            joinedAt: Date.now(),
            role: "member",
          });
        } else {
          await ctx.db.insert("chatParticipants", {
            chatId: args.chatId,
            userId,
            role: "member",
            status: "active",
            joinedAt: Date.now(),
            isMuted: false,
            pinned: false,
          });
        }
        addedCount++;
      }
    }

    if (addedCount > 0) {
      await ctx.db.insert("chatMessages", {
        chatId: args.chatId,
        senderId: user._id,
        content: `تم إضافة ${addedCount} أعضاء جدد إلى المحادثة`,
        type: "system",
        isEdited: false,
        isDeleted: false,
        isPinned: false,
        readBy: [user._id],
        createdAt: Date.now(),
      });
    }

    return { success: true, addedCount };
  },
});

// ✅ طرد مشارك من المحادثة
export const kickParticipant = mutation({
  args: {
    chatId: v.id("chatGroups"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("غير مصرح");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) throw new Error("المستخدم غير موجود");

    const chat = await ctx.db.get(args.chatId);
    if (!chat || !chat.isActive) throw new Error("المحادثة غير موجودة");

    // التحقق من صلاحية المدير
    const participant = await ctx.db
      .query("chatParticipants")
      .withIndex("by_chat_user", (q) =>
        q.eq("chatId", args.chatId).eq("userId", user._id)
      )
      .first();

    if (!participant || participant.role !== "admin") {
      throw new Error("مطلوب صلاحيات مدير المجموعة");
    }

    // منع طرد المنشئ
    if (chat.createdBy === args.userId) {
      throw new Error("لا يمكن طرد منشئ المجموعة");
    }

    // منع طرد النفس
    if (user._id === args.userId) {
      throw new Error("لا يمكن طرد نفسك من المجموعة");
    }

    const targetParticipant = await ctx.db
      .query("chatParticipants")
      .withIndex("by_chat_user", (q) =>
        q.eq("chatId", args.chatId).eq("userId", args.userId)
      )
      .first();

    if (!targetParticipant) {
      throw new Error("المستخدم غير موجود في المحادثة");
    }

    // تحديث الحالة إلى مطرود
    await ctx.db.patch(targetParticipant._id, {
      status: "kicked",
    });

    // إضافة رسالة نظام
    const kickedUser = await ctx.db.get(args.userId);
    await ctx.db.insert("chatMessages", {
      chatId: args.chatId,
      senderId: user._id,
      content: `تم طرد ${kickedUser?.name || "مستخدم"} من المحادثة`,
      type: "system",
      isEdited: false,
      isDeleted: false,
      isPinned: false,
      readBy: [user._id],
      createdAt: Date.now(),
    });

    return { success: true };
  },
});

// ✅ تغيير دور مشارك (جعله مدير أو عضو)
export const changeParticipantRole = mutation({
  args: {
    chatId: v.id("chatGroups"),
    userId: v.id("users"),
    role: v.union(v.literal("admin"), v.literal("member")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("غير مصرح");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) throw new Error("المستخدم غير موجود");

    // التحقق من صلاحية المدير
    const participant = await ctx.db
      .query("chatParticipants")
      .withIndex("by_chat_user", (q) =>
        q.eq("chatId", args.chatId).eq("userId", user._id)
      )
      .first();

    if (!participant || participant.role !== "admin") {
      throw new Error("مطلوب صلاحيات مدير المجموعة");
    }

    // منع تغيير دور المنشئ
    const chat = await ctx.db.get(args.chatId);
    if (chat?.createdBy === args.userId) {
      throw new Error("لا يمكن تغيير دور منشئ المجموعة");
    }

    const targetParticipant = await ctx.db
      .query("chatParticipants")
      .withIndex("by_chat_user", (q) =>
        q.eq("chatId", args.chatId).eq("userId", args.userId)
      )
      .first();

    if (!targetParticipant) {
      throw new Error("المستخدم غير موجود في المحادثة");
    }

    await ctx.db.patch(targetParticipant._id, {
      role: args.role,
    });

    return { success: true };
  },
});


export const getAvailableParticipants = query({
  args: {
    chatId: v.id("chatGroups"),
    search: v.optional(v.string()),
    role: v.optional(
      v.union(
        v.literal("student"),
        v.literal("teacher"),
        v.literal("parent"),
        v.literal("admin")
      )
    ),
    excludeCurrent: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("غير مصرح");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) throw new Error("المستخدم غير موجود");

    // ✅ منع الطلاب تماماً من جلب المشاركين المتاحين
    if (user.role === "student") {
      return []; // إرجاع مصفوفة فارغة بدلاً من رمي خطأ
    }

    const chat = await ctx.db.get(args.chatId);
    if (!chat) throw new Error("المحادثة غير موجودة");

    // ✅ التحقق من صلاحيات المدير أو المنشئ أو المعلم
    const participant = await ctx.db
      .query("chatParticipants")
      .withIndex("by_chat_user", (q) =>
        q.eq("chatId", args.chatId).eq("userId", user._id)
      )
      .first();

    if (!participant) {
      throw new Error("أنت لست عضواً في هذه المحادثة");
    }

    // ✅ السماح للمديرين فقط بإضافة أعضاء جدد
    const isAdmin = participant.role === "admin";
    const isCreator = chat.createdBy === user._id;
    
    // ✅ التحقق إذا كان المعلم مرتبطاً بمجموعة هذه المحادثة
    let isTeacherInGroup = false;
    if (chat.groupId) {
      const group = await ctx.db.get(chat.groupId as Id<"groups">);
      if (group) {
        isTeacherInGroup = group.teachers?.includes(user._id) || 
                          group.createdBy === user._id ||
                          group.supervisorId === user._id;
      }
    }

    // ✅ السماح إذا كان مديراً أو منشئاً أو معلماً في المجموعة
    if (!isAdmin && !isCreator && !isTeacherInGroup) {
      // ✅ إذا كان معلم، نسمح له بإضافة طلاب مجموعته فقط
      if (user.role === "teacher" && chat.groupId) {
        // السماح للمعلم بإضافة طلاب من مجموعته
      } else {
        // ✅ إرجاع مصفوفة فارغة بدلاً من رمي خطأ
        return [];
      }
    }

    // جلب الأعضاء الحاليين
    const currentParticipants = await ctx.db
      .query("chatParticipants")
      .withIndex("by_chat", (q) => q.eq("chatId", args.chatId))
      .collect();

    const currentUserIds = new Set(currentParticipants.map((p) => p.userId));

    // جلب جميع المستخدمين النشطين
    let users = await ctx.db
      .query("users")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .collect();

    // ✅ إذا كان المعلم، نحدد المستخدمين المتاحين بناءً على مجموعته
    if (user.role === "teacher" && chat.groupId) {
      const group = await ctx.db.get(chat.groupId as Id<"groups">);
      if (group) {
        // جلب طلاب المجموعة فقط
        const studentIds = new Set(group.students || []);
        users = users.filter((u) => 
          u.role === "student" && studentIds.has(u._id)
        );
        
        // إضافة المعلمين الآخرين في نفس المجموعة
        const teacherIds = new Set(group.teachers || []);
        if (group.supervisorId) teacherIds.add(group.supervisorId);
        
        const groupTeachers = users.filter((u) => 
          u.role === "teacher" && teacherIds.has(u._id)
        );
        users = [...users, ...groupTeachers];
      }
    }

    // فلترة حسب النوع (الدور)
    if (args.role) {
      users = users.filter((u) => u.role === args.role);
    }

    // استبعاد المستخدم الحالي إذا كان مطلوباً
    if (args.excludeCurrent) {
      users = users.filter((u) => u._id !== user._id);
    }

    // فلترة حسب البحث
    if (args.search && args.search.trim() !== "") {
      const searchLower = args.search.toLowerCase();
      users = users.filter(
        (u) =>
          u.name?.toLowerCase().includes(searchLower) ||
          u.email?.toLowerCase().includes(searchLower) ||
          u.studentId?.toLowerCase().includes(searchLower) ||
          u.teacherId?.toLowerCase().includes(searchLower) ||
          u.phoneNumber?.includes(args.search || "")
      );
    }

    // استبعاد المستخدمين الموجودين بالفعل في المحادثة
    const availableUsers = users.filter(
      (u) => !currentUserIds.has(u._id)
    );

    // جلب معلومات إضافية لكل مستخدم
    const usersWithDetails = await Promise.all(
      availableUsers.map(async (u) => {
        let gradeName = "غير محدد";
        let groupName = "غير محدد";

        if (u.gradeId) {
          const grade = await ctx.db.get(u.gradeId);
          if (grade) {
            gradeName = grade.name;
          }
        }

        if (u.groupId) {
          const group = await ctx.db.get(u.groupId);
          if (group) {
            groupName = group.name;
          }
        }

        return {
          ...u,
          gradeName,
          groupName,
        };
      })
    );

    return usersWithDetails.sort((a, b) => 
      (a.name || "").localeCompare(b.name || "")
    );
  },
});

// ✅ تصدير الدوال
export const participants = {
  addParticipant,
  addMultipleParticipants,
  kickParticipant,
  changeParticipantRole,
  getAvailableParticipants, // ✅ إضافة الدالة الجديدة
};