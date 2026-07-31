// convex/chat/messages.ts

import { v } from "convex/values";
import { mutation, query } from "../_generated/server";
import { Id } from "../_generated/dataModel";

// ✅ إرسال رسالة
export const sendMessage = mutation({
  args: {
    chatId: v.id("chatGroups"),
    content: v.string(),
    type: v.optional(
      v.union(
        v.literal("text"),
        v.literal("image"),
        v.literal("file"),
        v.literal("voice"),
        v.literal("video")
      )
    ),
    mediaUrl: v.optional(v.string()),
    mediaKey: v.optional(v.string()),
    replyTo: v.optional(v.id("chatMessages")),
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

    // التحقق من أن المستخدم مشارك في المحادثة
    const participant = await ctx.db
      .query("chatParticipants")
      .withIndex("by_chat_user", (q) =>
        q.eq("chatId", args.chatId).eq("userId", user._id)
      )
      .first();

    if (!participant || participant.status !== "active") {
      throw new Error("غير مصرح لك بإرسال رسائل في هذه المحادثة");
    }

    // إنشاء الرسالة
    const messageId = await ctx.db.insert("chatMessages", {
      chatId: args.chatId,
      senderId: user._id,
      content: args.content,
      type: args.type || "text",
      mediaUrl: args.mediaUrl,
      mediaKey: args.mediaKey,
      replyTo: args.replyTo,
      isEdited: false,
      isDeleted: false,
      isPinned: false,
      readBy: [user._id],
      createdAt: Date.now(),
    });

    // تحديث آخر رسالة في المجموعة
    await ctx.db.patch(args.chatId, {
      lastMessage: args.content,
      lastMessageAt: Date.now(),
      lastMessageSender: user._id,
      updatedAt: Date.now(),
    });

    // تحديث unreadCount لجميع المشاركين ما عدا المرسل
    const participants = await ctx.db
      .query("chatParticipants")
      .withIndex("by_chat", (q) => q.eq("chatId", args.chatId))
      .filter((q) =>
        q.and(
          q.neq(q.field("userId"), user._id),
          q.eq(q.field("status"), "active")
        )
      )
      .collect();

    // إنشاء إشعارات لكل مشارك
    for (const p of participants) {
      await ctx.db.insert("chatNotifications", {
        userId: p.userId,
        chatId: args.chatId,
        messageId,
        isRead: false,
        createdAt: Date.now(),
      });
    }

    return { success: true, messageId };
  },
});

// ✅ جلب رسائل المحادثة (مع Pagination)
// ✅ تم إزالة استخدام patch من هذه الدالة لأنها query
export const getMessages = query({
  args: {
    chatId: v.id("chatGroups"),
    limit: v.optional(v.number()),
    cursor: v.optional(v.id("chatMessages")),
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

    // التحقق من أن المستخدم مشارك في المحادثة
    const participant = await ctx.db
      .query("chatParticipants")
      .withIndex("by_chat_user", (q) =>
        q.eq("chatId", args.chatId).eq("userId", user._id)
      )
      .first();

    if (!participant || participant.status !== "active") {
      throw new Error("غير مصرح لك بمشاهدة هذه المحادثة");
    }

    const limit = args.limit || 30;
    let messagesQuery = ctx.db
      .query("chatMessages")
      .withIndex("by_chat", (q) => q.eq("chatId", args.chatId))
      .filter((q) => q.neq(q.field("isDeleted"), true));

    if (args.cursor) {
      const cursorMessage = await ctx.db.get(args.cursor);
      if (cursorMessage) {
        messagesQuery = messagesQuery.filter((q) =>
          q.lt(q.field("createdAt"), cursorMessage.createdAt)
        );
      }
    }

    const messages = await messagesQuery.order("desc").take(limit);

    // جلب بيانات المرسلين
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

    // ✅ تم إزالة patch من هنا - سيتم تحديث lastReadAt عند فتح المحادثة
    // عبر mutation منفصلة

    return {
      messages: messagesWithSender.reverse(),
      hasMore: messages.length === limit,
    };
  },
});

// ✅ تحديث آخر قراءة للمستخدم (mutation)
export const markChatAsRead = mutation({
  args: {
    chatId: v.id("chatGroups"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("غير مصرح");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) throw new Error("المستخدم غير موجود");

    // جلب المشارك
    const participant = await ctx.db
      .query("chatParticipants")
      .withIndex("by_chat_user", (q) =>
        q.eq("chatId", args.chatId).eq("userId", user._id)
      )
      .first();

    if (!participant) {
      throw new Error("المستخدم ليس عضوًا في هذه المحادثة");
    }

    // تحديث lastReadAt
    await ctx.db.patch(participant._id, {
      lastReadAt: Date.now(),
    });

    // تحديث الإشعارات كمقروءة
    const notifications = await ctx.db
      .query("chatNotifications")
      .withIndex("by_user_chat", (q) =>
        q.eq("userId", user._id).eq("chatId", args.chatId)
      )
      .filter((q) => q.eq(q.field("isRead"), false))
      .collect();

    for (const notif of notifications) {
      await ctx.db.patch(notif._id, {
        isRead: true,
        readAt: Date.now(),
      });
    }

    return { success: true };
  },
});

// ✅ حذف رسالة (للمرسل فقط)
export const deleteMessage = mutation({
  args: {
    messageId: v.id("chatMessages"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("غير مصرح");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) throw new Error("المستخدم غير موجود");

    const message = await ctx.db.get(args.messageId);
    if (!message) throw new Error("الرسالة غير موجودة");

    // فقط المرسل يمكنه حذف رسالته
    if (message.senderId !== user._id) {
      throw new Error("غير مصرح لك بحذف هذه الرسالة");
    }

    // تحديث الرسالة كمحذوفة
    await ctx.db.patch(args.messageId, {
      isDeleted: true,
      content: "تم حذف هذه الرسالة",
    });

    return { success: true };
  },
});

// ✅ تعديل رسالة (للمرسل فقط)
export const editMessage = mutation({
  args: {
    messageId: v.id("chatMessages"),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("غير مصرح");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) throw new Error("المستخدم غير موجود");

    const message = await ctx.db.get(args.messageId);
    if (!message) throw new Error("الرسالة غير موجودة");

    // فقط المرسل يمكنه تعديل رسالته
    if (message.senderId !== user._id) {
      throw new Error("غير مصرح لك بتعديل هذه الرسالة");
    }

    await ctx.db.patch(args.messageId, {
      content: args.content,
      isEdited: true,
      updatedAt: Date.now(),
    });

    // تحديث آخر رسالة في المجموعة
    const chat = await ctx.db.get(message.chatId);
    if (chat && chat.lastMessage === message.content) {
      await ctx.db.patch(message.chatId, {
        lastMessage: args.content,
        updatedAt: Date.now(),
      });
    }

    return { success: true };
  },
});

// ✅ تثبيت رسالة (للمديرين فقط)
export const pinMessage = mutation({
  args: {
    messageId: v.id("chatMessages"),
    pin: v.boolean(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("غير مصرح");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) throw new Error("المستخدم غير موجود");

    const message = await ctx.db.get(args.messageId);
    if (!message) throw new Error("الرسالة غير موجودة");

    // التحقق من صلاحية المدير
    const participant = await ctx.db
      .query("chatParticipants")
      .withIndex("by_chat_user", (q) =>
        q.eq("chatId", message.chatId).eq("userId", user._id)
      )
      .first();

    if (!participant || participant.role !== "admin") {
      throw new Error("مطلوب صلاحيات مدير المجموعة");
    }

    await ctx.db.patch(args.messageId, {
      isPinned: args.pin,
    });

    return { success: true };
  },
});

// ✅ تعليم الرسالة كمقروءة
export const markMessageAsRead = mutation({
  args: {
    messageId: v.id("chatMessages"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("غير مصرح");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) throw new Error("المستخدم غير موجود");

    const message = await ctx.db.get(args.messageId);
    if (!message) throw new Error("الرسالة غير موجودة");

    // تحديث إشعارات المستخدم
    const notifications = await ctx.db
      .query("chatNotifications")
      .withIndex("by_user_chat", (q) =>
        q.eq("userId", user._id).eq("chatId", message.chatId)
      )
      .filter((q) =>
        q.and(
          q.eq(q.field("messageId"), args.messageId),
          q.eq(q.field("isRead"), false)
        )
      )
      .collect();

    for (const notif of notifications) {
      await ctx.db.patch(notif._id, {
        isRead: true,
        readAt: Date.now(),
      });
    }

    // تحديث readBy في الرسالة
    if (!message.readBy.includes(user._id)) {
      await ctx.db.patch(args.messageId, {
        readBy: [...message.readBy, user._id],
      });
    }

    return { success: true };
  },
});

// ✅ جلب عدد الرسائل غير المقروءة
export const getUnreadCount = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("غير مصرح");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) throw new Error("المستخدم غير موجود");

    const unreadNotifications = await ctx.db
      .query("chatNotifications")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("isRead"), false))
      .collect();

    return unreadNotifications.length;
  },
});

// ✅ تصدير الدوال
export const messages = {
  sendMessage,
  getMessages,
  markChatAsRead, // ✅ جديدة
  deleteMessage,
  editMessage,
  pinMessage,
  markMessageAsRead,
  getUnreadCount,
};