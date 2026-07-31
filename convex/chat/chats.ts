// convex/chat/chats.ts

import { v } from "convex/values";
import { mutation, query } from "../_generated/server";
import { Id } from "../_generated/dataModel";

// ============================================
// QUERIES
// ============================================

// ✅ جلب جميع محادثات المستخدم
export const getUserChats = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("غير مصرح");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) throw new Error("المستخدم غير موجود");

    // جلب جميع المشاركات الخاصة بالمستخدم
    const participants = await ctx.db
      .query("chatParticipants")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) => q.neq(q.field("status"), "kicked"))
      .collect();

    const chatIds = participants.map((p) => p.chatId);

    // جلب تفاصيل المحادثات
    const chats = await Promise.all(
      chatIds.map(async (chatId) => {
        const chat = await ctx.db.get(chatId);
        if (!chat || !chat.isActive) return null;

        // جلب آخر رسالة
        const lastMessages = await ctx.db
          .query("chatMessages")
          .withIndex("by_chat", (q) => q.eq("chatId", chatId))
          .order("desc")
          .take(1);

        const lastMessage = lastMessages[0] || null;

        // جلب عدد الأعضاء
        const memberCount = await ctx.db
          .query("chatParticipants")
          .withIndex("by_chat", (q) => q.eq("chatId", chatId))
          .filter((q) => q.eq(q.field("status"), "active"))
          .collect();

        // جلب عدد الرسائل غير المقروءة
        const userParticipant = participants.find(
          (p) => p.chatId === chatId && p.userId === user._id
        );

        const unreadMessages = await ctx.db
          .query("chatMessages")
          .withIndex("by_chat", (q) => q.eq("chatId", chatId))
          .filter((q) =>
            q.and(
              q.gt(q.field("createdAt"), userParticipant?.lastReadAt || 0),
              q.neq(q.field("senderId"), user._id)
            )
          )
          .collect();

        // جلب اسم المحادثة للمحادثات المباشرة
        let chatName = chat.name;
        if (chat.type === "direct") {
          const otherParticipant = participants.find(
            (p) => p.chatId === chatId && p.userId !== user._id
          );
          if (otherParticipant) {
            const otherUser = await ctx.db.get(otherParticipant.userId);
            if (otherUser) {
              chatName = otherUser.name;
            }
          }
        }

        return {
          ...chat,
          name: chatName,
          lastMessage: lastMessage?.content || null,
          lastMessageAt: lastMessage?.createdAt || chat.createdAt,
          lastMessageSender: lastMessage?.senderId || null,
          unreadCount: unreadMessages.length,
          memberCount: memberCount.length,
          isAdmin: participants.find(
            (p) => p.chatId === chatId && p.userId === user._id
          )?.role === "admin",
        };
      })
    );

    // تصفية المحادثات الفارغة وترتيبها حسب آخر رسالة
    return chats
      .filter(Boolean)
      .sort((a, b) => (b?.lastMessageAt || 0) - (a?.lastMessageAt || 0));
  },
});


export const getTeacherChats = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("غير مصرح");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user || user.role !== "teacher") {
      throw new Error("مطلوب صلاحيات معلم");
    }

    // ✅ جلب جميع المجموعات التي يدرسها المعلم
    const allGroups = await ctx.db.query("groups").collect();
    
    const teacherGroupIds = new Set<Id<"groups">>();
    const teacherGroups = allGroups.filter((g) => {
      const isCreator = g.createdBy === user._id;
      const isSupervisor = g.supervisorId === user._id;
      const isTeacher = g.teachers && g.teachers.includes(user._id);
      if (isCreator || isSupervisor || isTeacher) {
        teacherGroupIds.add(g._id);
        return true;
      }
      return false;
    });

    // ✅ جلب جميع المشاركات الخاصة بالمعلم
    const participants = await ctx.db
      .query("chatParticipants")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) => q.neq(q.field("status"), "kicked"))
      .collect();

    // ✅ تصفية المحادثات
    const validChats = [];
    for (const p of participants) {
      const chat = await ctx.db.get(p.chatId);
      if (!chat || !chat.isActive) continue;
      
      // ✅ إذا كانت المحادثة من نوع group وترتبط بمجموعة المعلم
      if (chat.type === "group" && chat.groupId) {
        if (teacherGroupIds.has(chat.groupId as Id<"groups">)) {
          validChats.push(p);
          continue;
        }
      }
      
      // ✅ إذا كان المعلم هو منشئ المحادثة
      if (chat.createdBy === user._id) {
        validChats.push(p);
        continue;
      }
      
      // ✅ إذا كانت المحادثة تحتوي على طلاب من مجموعات المعلم
      const chatParticipants = await ctx.db
        .query("chatParticipants")
        .withIndex("by_chat", (q) => q.eq("chatId", chat._id))
        .collect();
      
      for (const cp of chatParticipants) {
        if (cp.userId === user._id) continue;
        const participantUser = await ctx.db.get(cp.userId);
        if (participantUser && participantUser.role === "student") {
          // التحقق إذا كان الطالب في إحدى مجموعات المعلم
          const studentGroups = allGroups.filter(g => 
            g.students && g.students.includes(participantUser._id)
          );
          for (const sg of studentGroups) {
            if (teacherGroupIds.has(sg._id)) {
              validChats.push(p);
              break;
            }
          }
        }
        if (validChats.includes(p)) break;
      }
    }

    const chatIds = validChats.map((p) => p.chatId);

    // ✅ جلب تفاصيل المحادثات
    const chats = await Promise.all(
      chatIds.map(async (chatId) => {
        const chat = await ctx.db.get(chatId);
        if (!chat || !chat.isActive) return null;

        // جلب آخر رسالة
        const lastMessages = await ctx.db
          .query("chatMessages")
          .withIndex("by_chat", (q) => q.eq("chatId", chatId))
          .order("desc")
          .take(1);

        const lastMessage = lastMessages[0] || null;

        // جلب عدد الأعضاء
        const memberCount = await ctx.db
          .query("chatParticipants")
          .withIndex("by_chat", (q) => q.eq("chatId", chatId))
          .filter((q) => q.eq(q.field("status"), "active"))
          .collect();

        // جلب عدد الرسائل غير المقروءة
        const userParticipant = participants.find(
          (p) => p.chatId === chatId && p.userId === user._id
        );

        const unreadMessages = await ctx.db
          .query("chatMessages")
          .withIndex("by_chat", (q) => q.eq("chatId", chatId))
          .filter((q) =>
            q.and(
              q.gt(q.field("createdAt"), userParticipant?.lastReadAt || 0),
              q.neq(q.field("senderId"), user._id)
            )
          )
          .collect();

        let chatName = chat.name;
        if (chat.type === "direct") {
          const otherParticipant = participants.find(
            (p) => p.chatId === chatId && p.userId !== user._id
          );
          if (otherParticipant) {
            const otherUser = await ctx.db.get(otherParticipant.userId);
            if (otherUser) {
              chatName = otherUser.name;
            }
          }
        }

        return {
          ...chat,
          name: chatName,
          lastMessage: lastMessage?.content || null,
          lastMessageAt: lastMessage?.createdAt || chat.createdAt,
          lastMessageSender: lastMessage?.senderId || null,
          unreadCount: unreadMessages.length,
          memberCount: memberCount.length,
          isAdmin: participants.find(
            (p) => p.chatId === chatId && p.userId === user._id
          )?.role === "admin",
        };
      })
    );

    return chats
      .filter(Boolean)
      .sort((a, b) => (b?.lastMessageAt || 0) - (a?.lastMessageAt || 0));
  },
});

// ✅ جلب تفاصيل محادثة معينة
export const getChatById = query({
  args: { chatId: v.id("chatGroups") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("غير مصرح");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) throw new Error("المستخدم غير موجود");

    // التحقق من أن المستخدم مشارك في المحادثة
    const participant = await ctx.db
      .query("chatParticipants")
      .withIndex("by_chat_user", (q) =>
        q.eq("chatId", args.chatId).eq("userId", user._id)
      )
      .first();

    if (!participant || participant.status === "kicked") {
      throw new Error("غير مصرح لك بمشاهدة هذه المحادثة");
    }

    const chat = await ctx.db.get(args.chatId);
    if (!chat || !chat.isActive) {
      throw new Error("المحادثة غير موجودة");
    }

    // جلب جميع المشاركين
    const participants = await ctx.db
      .query("chatParticipants")
      .withIndex("by_chat", (q) => q.eq("chatId", args.chatId))
      .filter((q) => q.eq(q.field("status"), "active"))
      .collect();

    const participantsWithDetails = await Promise.all(
      participants.map(async (p) => {
        const userData = await ctx.db.get(p.userId);
        return {
          ...p,
          user: userData,
        };
      })
    );

    // جلب آخر 50 رسالة
    const messages = await ctx.db
      .query("chatMessages")
      .withIndex("by_chat", (q) => q.eq("chatId", args.chatId))
      .filter((q) => q.neq(q.field("isDeleted"), true))
      .order("desc")
      .take(50);

    // جلب المرسلين لكل رسالة
    const messagesWithSender = await Promise.all(
      messages.map(async (message) => {
        const sender = await ctx.db.get(message.senderId);
        return {
          ...message,
          sender: sender,
          isMine: message.senderId === user._id,
        };
      })
    );

    return {
      chat,
      participants: participantsWithDetails,
      messages: messagesWithSender.reverse(),
      participantStatus: participant,
    };
  },
});

// ✅ جلب المشاركين المتاحين للإضافة
export const getAvailableParticipants = query({
  args: {
    chatId: v.id("chatGroups"),
    search: v.optional(v.string()),
    type: v.optional(
      v.union(
        v.literal("student"),
        v.literal("teacher"),
        v.literal("parent"),
        v.literal("admin")
      )
    ),
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
    if (!chat) throw new Error("المحادثة غير موجودة");

    // التحقق من صلاحية الأدمن
    const participant = await ctx.db
      .query("chatParticipants")
      .withIndex("by_chat_user", (q) =>
        q.eq("chatId", args.chatId).eq("userId", user._id)
      )
      .first();

    if (!participant || participant.role !== "admin") {
      throw new Error("مطلوب صلاحيات مدير المجموعة");
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

    // فلترة حسب النوع
    if (args.type) {
      users = users.filter((u) => u.role === args.type);
    }

    // فلترة حسب البحث
    if (args.search && args.search.trim() !== "") {
      const searchLower = args.search.toLowerCase();
      users = users.filter(
        (u) =>
          u.name.toLowerCase().includes(searchLower) ||
          u.email.toLowerCase().includes(searchLower) ||
          u.studentId?.toLowerCase().includes(searchLower) ||
          u.teacherId?.toLowerCase().includes(searchLower)
      );
    }

    // استبعاد المستخدمين الموجودين بالفعل
    const availableUsers = users.filter((u) => !currentUserIds.has(u._id));

    return availableUsers;
  },
});

// ============================================
// MUTATIONS
// ============================================


export const createChat = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    type: v.union(
      v.literal("group"),
      v.literal("class"),
      v.literal("grade"),
      v.literal("direct")
    ),
    isPrivate: v.boolean(),
    participants: v.array(v.id("users")),
    isGroupChat: v.boolean(),
    addGradeId: v.optional(v.id("grades")),
    addGroupId: v.optional(v.id("groups")),
    addAllTeachers: v.optional(v.boolean()),
    addAllParents: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("غير مصرح");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) throw new Error("المستخدم غير موجود");

    // التحقق من الصلاحيات
    const isAdmin = user.role === "admin";
    const isTeacher = user.role === "teacher";

    if (args.type === "group" && !isAdmin && !isTeacher) {
      throw new Error("غير مصرح لك بإنشاء مجموعات محادثة");
    }

    // ✅ إذا كان معلم، التحقق من أن المجموعة تابعة له
    let groupInfo = null;
    if (isTeacher && args.addGroupId) {
      const group = await ctx.db.get(args.addGroupId);
      if (!group) throw new Error("المجموعة غير موجودة");
      
      const isCreator = group.createdBy === user._id;
      const isSupervisor = group.supervisorId === user._id;
      const isTeacherInGroup = group.teachers?.includes(user._id);
      
      if (!isCreator && !isSupervisor && !isTeacherInGroup) {
        throw new Error("غير مصرح لك بإضافة هذه المجموعة");
      }
      groupInfo = group;
    }

    let participantIds = new Set<Id<"users">>();

    // إضافة المنشئ
    participantIds.add(user._id);

    // ✅ إضافة المعلمين الآخرين في المجموعة (إذا كانت مجموعة)
    if (args.addGroupId && groupInfo) {
      // إضافة جميع المعلمين في المجموعة
      if (groupInfo.teachers) {
        groupInfo.teachers.forEach((id) => participantIds.add(id));
      }
      if (groupInfo.supervisorId) {
        participantIds.add(groupInfo.supervisorId);
      }
    }

    // إضافة المشاركين المحددين
    if (args.participants) {
      args.participants.forEach((id) => participantIds.add(id));
    }

    // إضافة مجموعة كاملة (طلاب)
    if (args.addGroupId) {
      const group = await ctx.db.get(args.addGroupId);
      if (group) {
        group.students.forEach((id) => participantIds.add(id));
        if (group.teachers) {
          group.teachers.forEach((id) => participantIds.add(id));
        }
        if (group.supervisorId) {
          participantIds.add(group.supervisorId);
        }
      }
    }

    // إضافة صف كامل
    if (args.addGradeId) {
      const students = await ctx.db
        .query("users")
        .withIndex("by_gradeId", (q) => q.eq("gradeId", args.addGradeId))
        .collect();
      students.forEach((s) => participantIds.add(s._id));

      const teachers = await ctx.db
        .query("users")
        .withIndex("by_gradeId", (q) => q.eq("gradeId", args.addGradeId))
        .filter((q) => q.eq(q.field("role"), "teacher"))
        .collect();
      teachers.forEach((t) => participantIds.add(t._id));
    }

    // إضافة جميع المعلمين
    if (args.addAllTeachers) {
      const teachers = await ctx.db
        .query("users")
        .withIndex("by_role", (q) => q.eq("role", "teacher"))
        .collect();
      teachers.forEach((t) => participantIds.add(t._id));
    }

    // إضافة جميع أولياء الأمور
    if (args.addAllParents) {
      const parents = await ctx.db
        .query("users")
        .withIndex("by_role", (q) => q.eq("role", "parent"))
        .collect();
      parents.forEach((p) => participantIds.add(p._id));
    }

    // للمحادثات المباشرة، يجب أن يكون هناك مشاركين فقط (المنشئ + 1)
    if (args.type === "direct" && participantIds.size !== 2) {
      const participantsArray = Array.from(participantIds);
      participantIds = new Set([participantsArray[0], participantsArray[1]]);
    }

    // ✅ إنشاء المحادثة مع ربط groupId إذا كانت مجموعة
    const chatData: any = {
      name: args.name,
      description: args.description,
      type: args.type,
      createdBy: user._id,
      isPrivate: args.isPrivate,
      isActive: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    // ✅ إضافة groupId للمحادثة إذا كانت من نوع group
    if (args.type === "group" && args.addGroupId) {
      chatData.groupId = args.addGroupId;
    }

    const chatId = await ctx.db.insert("chatGroups", chatData);

    // ✅ إضافة المشاركين
    const participantPromises = Array.from(participantIds).map((userId) =>
      ctx.db.insert("chatParticipants", {
        chatId,
        userId,
        role: userId === user._id ? "admin" : "member",
        status: "active",
        joinedAt: Date.now(),
        isMuted: false,
        pinned: false,
      })
    );

    await Promise.all(participantPromises);

    // إرسال رسالة ترحيب
    await ctx.db.insert("chatMessages", {
      chatId,
      senderId: user._id,
      content: `تم إنشاء المحادثة "${args.name}"`,
      type: "system",
      isEdited: false,
      isDeleted: false,
      isPinned: false,
      readBy: [user._id],
      createdAt: Date.now(),
    });

    return { success: true, chatId };
  },
});

// ✅ تحديث محادثة
export const updateChat = mutation({
  args: {
    chatId: v.id("chatGroups"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    avatar: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
    isPrivate: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("غير مصرح");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) throw new Error("المستخدم غير موجود");

    const participant = await ctx.db
      .query("chatParticipants")
      .withIndex("by_chat_user", (q) =>
        q.eq("chatId", args.chatId).eq("userId", user._id)
      )
      .first();

    if (!participant || participant.role !== "admin") {
      throw new Error("مطلوب صلاحيات مدير المجموعة");
    }

    const updateData: any = { updatedAt: Date.now() };
    if (args.name !== undefined) updateData.name = args.name;
    if (args.description !== undefined) updateData.description = args.description;
    if (args.avatar !== undefined) updateData.avatar = args.avatar;
    if (args.isActive !== undefined) updateData.isActive = args.isActive;
    if (args.isPrivate !== undefined) updateData.isPrivate = args.isPrivate;

    await ctx.db.patch(args.chatId, updateData);

    return { success: true };
  },
});

// ✅ حذف محادثة (للأدمن فقط)
export const deleteChat = mutation({
  args: { chatId: v.id("chatGroups") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("غير مصرح");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) throw new Error("المستخدم غير موجود");

    if (user.role !== "admin") {
      throw new Error("مطلوب صلاحيات مشرف");
    }

    const participants = await ctx.db
      .query("chatParticipants")
      .withIndex("by_chat", (q) => q.eq("chatId", args.chatId))
      .collect();

    for (const p of participants) {
      await ctx.db.delete(p._id);
    }

    const messages = await ctx.db
      .query("chatMessages")
      .withIndex("by_chat", (q) => q.eq("chatId", args.chatId))
      .collect();

    for (const m of messages) {
      await ctx.db.delete(m._id);
    }

    await ctx.db.delete(args.chatId);

    return { success: true };
  },
});

// ✅ مغادرة المحادثة
export const leaveChat = mutation({
  args: { chatId: v.id("chatGroups") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("غير مصرح");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) throw new Error("المستخدم غير موجود");

    const chat = await ctx.db.get(args.chatId);
    if (!chat) throw new Error("المحادثة غير موجودة");

    if (chat.createdBy === user._id) {
      const admins = await ctx.db
        .query("chatParticipants")
        .withIndex("by_chat", (q) => q.eq("chatId", args.chatId))
        .filter((q) =>
          q.and(
            q.eq(q.field("role"), "admin"),
            q.neq(q.field("userId"), user._id),
            q.eq(q.field("status"), "active")
          )
        )
        .collect();

      if (admins.length === 0) {
        throw new Error(
          "أنت المنشئ الوحيد للمجموعة. قم بتعيين مدير آخر قبل المغادرة"
        );
      }
    }

    const participant = await ctx.db
      .query("chatParticipants")
      .withIndex("by_chat_user", (q) =>
        q.eq("chatId", args.chatId).eq("userId", user._id)
      )
      .first();

    if (!participant) {
      throw new Error("أنت لست عضواً في هذه المحادثة");
    }

    await ctx.db.patch(participant._id, {
      status: "inactive",
    });

    await ctx.db.insert("chatMessages", {
      chatId: args.chatId,
      senderId: user._id,
      content: `${user.name} غادر المحادثة`,
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


// convex/chat/chats.ts - إصلاح دالة getChatByGroupId

// ✅ جلب مجموعة الشات المرتبطة بمجموعة دراسية
export const getChatByGroupId = query({
  args: {
    groupId: v.id("groups"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("غير مصرح");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) throw new Error("المستخدم غير موجود");

    // ✅ البحث عن مجموعة الشات المرتبطة
    const chat = await ctx.db
      .query("chatGroups")
      .withIndex("by_groupId", (q) => q.eq("groupId", args.groupId))
      .first();

    if (!chat) return null;

    // ✅ التحقق من أن المستخدم مشارك في المحادثة
    const participant = await ctx.db
      .query("chatParticipants")
      .withIndex("by_chat_user", (q) =>
        q.eq("chatId", chat._id).eq("userId", user._id)
      )
      .first();

    if (!participant || participant.status === "kicked") {
      throw new Error("غير مصرح لك بمشاهدة هذه المحادثة");
    }

    // ✅ جلب تفاصيل المحادثة يدوياً (بدلاً من استدعاء getChatById)
    // جلب جميع المشاركين
    const participants = await ctx.db
      .query("chatParticipants")
      .withIndex("by_chat", (q) => q.eq("chatId", chat._id))
      .filter((q) => q.eq(q.field("status"), "active"))
      .collect();

    const participantsWithDetails = await Promise.all(
      participants.map(async (p) => {
        const userData = await ctx.db.get(p.userId);
        return {
          ...p,
          user: userData,
        };
      })
    );

    // جلب آخر 50 رسالة
    const messages = await ctx.db
      .query("chatMessages")
      .withIndex("by_chat", (q) => q.eq("chatId", chat._id))
      .filter((q) => q.neq(q.field("isDeleted"), true))
      .order("desc")
      .take(50);

    // جلب المرسلين لكل رسالة
    const messagesWithSender = await Promise.all(
      messages.map(async (message) => {
        const sender = await ctx.db.get(message.senderId);
        return {
          ...message,
          sender: sender,
          isMine: message.senderId === user._id,
        };
      })
    );

    return {
      chat,
      participants: participantsWithDetails,
      messages: messagesWithSender.reverse(),
      participantStatus: participant,
    };
  },
});


// ✅ جلب محادثات الطالب (تشمل مجموعات الشات المرتبطة)
export const getStudentChats = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("غير مصرح");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user || user.role !== "student") {
      throw new Error("مطلوب صلاحيات طالب");
    }

    // ✅ جلب جميع المحادثات التي يشارك فيها الطالب
    const participants = await ctx.db
      .query("chatParticipants")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) => q.neq(q.field("status"), "kicked"))
      .collect();

    const chatIds = participants.map((p) => p.chatId);

    // ✅ جلب تفاصيل المحادثات
    const chats = await Promise.all(
      chatIds.map(async (chatId) => {
        const chat = await ctx.db.get(chatId);
        if (!chat || !chat.isActive) return null;

        // جلب آخر رسالة
        const lastMessages = await ctx.db
          .query("chatMessages")
          .withIndex("by_chat", (q) => q.eq("chatId", chatId))
          .order("desc")
          .take(1);

        const lastMessage = lastMessages[0] || null;

        // جلب عدد الأعضاء
        const memberCount = await ctx.db
          .query("chatParticipants")
          .withIndex("by_chat", (q) => q.eq("chatId", chatId))
          .filter((q) => q.eq(q.field("status"), "active"))
          .collect();

        // جلب عدد الرسائل غير المقروءة
        const userParticipant = participants.find(
          (p) => p.chatId === chatId && p.userId === user._id
        );

        const unreadMessages = await ctx.db
          .query("chatMessages")
          .withIndex("by_chat", (q) => q.eq("chatId", chatId))
          .filter((q) =>
            q.and(
              q.gt(q.field("createdAt"), userParticipant?.lastReadAt || 0),
              q.neq(q.field("senderId"), user._id)
            )
          )
          .collect();

        let chatName = chat.name;
        if (chat.type === "direct") {
          const otherParticipant = participants.find(
            (p) => p.chatId === chatId && p.userId !== user._id
          );
          if (otherParticipant) {
            const otherUser = await ctx.db.get(otherParticipant.userId);
            if (otherUser) {
              chatName = otherUser.name;
            }
          }
        }

        return {
          ...chat,
          name: chatName,
          lastMessage: lastMessage?.content || null,
          lastMessageAt: lastMessage?.createdAt || chat.createdAt,
          lastMessageSender: lastMessage?.senderId || null,
          unreadCount: unreadMessages.length,
          memberCount: memberCount.length,
          isAdmin: participants.find(
            (p) => p.chatId === chatId && p.userId === user._id
          )?.role === "admin",
        };
      })
    );

    return chats
      .filter(Boolean)
      .sort((a, b) => (b?.lastMessageAt || 0) - (a?.lastMessageAt || 0));
  },
});

// ✅ تصدير الدوال
export const chats = {
  getUserChats,
  getTeacherChats,
  getChatByGroupId,
  getChatById,
  getAvailableParticipants,
  createChat,
  updateChat,
  deleteChat,
  leaveChat,
};