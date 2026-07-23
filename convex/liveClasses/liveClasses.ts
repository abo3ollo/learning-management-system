// convex/liveClasses/liveClasses.ts

import { v } from "convex/values";
import { mutation, query } from "../_generated/server";
import { Id } from "../_generated/dataModel";

// ============================================
// QUERIES
// ============================================

// ✅ جلب الحصص المباشرة للمعلم
export const getTeacherLiveClasses = query({
  args: {
    status: v.optional(v.union(
      v.literal("scheduled"),
      v.literal("live"),
      v.literal("ended"),
      v.literal("cancelled")
    )),
    groupId: v.optional(v.id("groups")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("غير مصرح");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user || user.role !== "teacher") {
      throw new Error("مطلوب صلاحيات معلم");
    }

    let classes = await ctx.db
      .query("liveClasses")
      .withIndex("by_teacher", (q) => q.eq("teacherId", user._id))
      .collect();

    if (args.status) {
      classes = classes.filter((c) => c.status === args.status);
    }

    if (args.groupId) {
      classes = classes.filter((c) => c.groupId === args.groupId);
    }

    // جلب اسم المجموعة
    const classesWithDetails = await Promise.all(
      classes.map(async (cls) => {
        const group = await ctx.db.get(cls.groupId);
        return {
          ...cls,
          groupName: group?.name || "غير محدد",
          groupSubject: group?.subject || "غير محدد",
        };
      })
    );

    return classesWithDetails.sort((a, b) => a.startTime - b.startTime);
  },
});

// ✅ جلب الحصة المباشرة بواسطة ID
export const getLiveClassById = query({
  args: { liveClassId: v.id("liveClasses") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("غير مصرح");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) throw new Error("المستخدم غير موجود");

    const liveClass = await ctx.db.get(args.liveClassId);
    if (!liveClass) throw new Error("الحصة غير موجودة");

    // التحقق من الصلاحية
    if (liveClass.teacherId !== user._id && user.role !== "admin") {
      throw new Error("غير مصرح لمشاهدة هذه الحصة");
    }

    const group = await ctx.db.get(liveClass.groupId);
    const teacher = await ctx.db.get(liveClass.teacherId);

    return {
      ...liveClass,
      groupName: group?.name || "غير محدد",
      teacherName: teacher?.name || "غير محدد",
    };
  },
});

// ✅ جلب عدد الطلاب المسجلين في الحصة
export const getLiveClassAttendance = query({
  args: { liveClassId: v.id("liveClasses") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("غير مصرح");

    const liveClass = await ctx.db.get(args.liveClassId);
    if (!liveClass) throw new Error("الحصة غير موجودة");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user || (liveClass.teacherId !== user._id && user.role !== "admin")) {
      throw new Error("غير مصرح");
    }

    // جلب أسماء الطلاب الحاضرين
    const attendanceWithNames = await Promise.all(
      liveClass.attendance.map(async (att) => {
        const student = await ctx.db.get(att.studentId);
        return {
          ...att,
          studentName: student?.name || "غير معروف",
        };
      })
    );

    return attendanceWithNames;
  },
});

// ============================================
// MUTATIONS
// ============================================

// ✅ إنشاء حصة مباشرة جديدة
export const createLiveClass = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    groupId: v.id("groups"),
    startTime: v.number(),
    endTime: v.number(),
    platform: v.union(
      v.literal("zoom"),
      v.literal("google_meet"),
      v.literal("youtube"),
      v.literal("teams"),
      v.literal("other")
    ),
    link: v.string(),
    meetingId: v.optional(v.string()),
    password: v.optional(v.string()),
    maxStudents: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("غير مصرح");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user || user.role !== "teacher") {
      throw new Error("مطلوب صلاحيات معلم");
    }

    // التحقق من وجود المجموعة
    const group = await ctx.db.get(args.groupId);
    if (!group) throw new Error("المجموعة غير موجودة");

    // التحقق من أن المعلم مشرف على المجموعة أو معلم فيها
    const isTeacherInGroup = group.createdBy === user._id || 
                             group.supervisorId === user._id ||
                             (group.teachers && group.teachers.includes(user._id));
    
    if (!isTeacherInGroup) {
      throw new Error("غير مصرح لك بإنشاء حصة لهذه المجموعة");
    }

    // التحقق من عدم وجود تعارض في التوقيت
    const existingClasses = await ctx.db
      .query("liveClasses")
      .withIndex("by_teacher", (q) => q.eq("teacherId", user._id))
      .collect();

    const conflict = existingClasses.some((cls) => {
      if (cls.status === "cancelled" || cls.status === "ended") return false;
      return (args.startTime < cls.endTime && args.endTime > cls.startTime);
    });

    if (conflict) {
      throw new Error("يوجد تعارض في التوقيت مع حصة أخرى");
    }

    const liveClassId = await ctx.db.insert("liveClasses", {
      title: args.title,
      description: args.description,
      groupId: args.groupId,
      teacherId: user._id,
      startTime: args.startTime,
      endTime: args.endTime,
      platform: args.platform,
      link: args.link,
      meetingId: args.meetingId,
      password: args.password,
      status: "scheduled",
      attendance: [],
      maxStudents: args.maxStudents,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // ✅ إصلاح: استخدام الحقول المتاحة فقط في details
    await ctx.db.insert("auditLogs", {
      userId: user._id,
      action: "CREATE_LIVE_CLASS",
      resourceType: "liveClass",
      resourceId: liveClassId,
      details: {
        name: args.title,
        createdBy: user.email,
        role: user.role,
      },
      createdAt: Date.now(),
    });

    return { success: true, liveClassId };
  },
});

// ✅ تحديث حالة الحصة (live, ended, cancelled)
export const updateLiveClassStatus = mutation({
  args: {
    liveClassId: v.id("liveClasses"),
    status: v.union(
      v.literal("scheduled"),
      v.literal("live"),
      v.literal("ended"),
      v.literal("cancelled")
    ),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("غير مصرح");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user || user.role !== "teacher") {
      throw new Error("مطلوب صلاحيات معلم");
    }

    const liveClass = await ctx.db.get(args.liveClassId);
    if (!liveClass) throw new Error("الحصة غير موجودة");

    if (liveClass.teacherId !== user._id) {
      throw new Error("غير مصرح لك بتحديث هذه الحصة");
    }

    await ctx.db.patch(args.liveClassId, {
      status: args.status,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

// ✅ تسجيل حضور طالب في الحصة
export const joinLiveClass = mutation({
  args: {
    liveClassId: v.id("liveClasses"),
    studentId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("غير مصرح");

    const liveClass = await ctx.db.get(args.liveClassId);
    if (!liveClass) throw new Error("الحصة غير موجودة");

    if (liveClass.status !== "scheduled" && liveClass.status !== "live") {
      throw new Error("الحصة غير متاحة للدخول");
    }

    // التحقق من أن الطالب في المجموعة
    const group = await ctx.db.get(liveClass.groupId);
    if (!group || !group.students.includes(args.studentId)) {
      throw new Error("الطالب غير مسجل في هذه المجموعة");
    }

    // التحقق من عدم تسجيل الحضور مسبقاً
    const alreadyJoined = liveClass.attendance.some(
      (a) => a.studentId === args.studentId
    );

    if (alreadyJoined) {
      throw new Error("تم تسجيل حضورك بالفعل");
    }

    const updatedAttendance = [
      ...liveClass.attendance,
      {
        studentId: args.studentId,
        joinedAt: Date.now(),
      },
    ];

    await ctx.db.patch(args.liveClassId, {
      attendance: updatedAttendance,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

// ✅ تسجيل مغادرة طالب
export const leaveLiveClass = mutation({
  args: {
    liveClassId: v.id("liveClasses"),
    studentId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("غير مصرح");

    const liveClass = await ctx.db.get(args.liveClassId);
    if (!liveClass) throw new Error("الحصة غير موجودة");

    const attendanceIndex = liveClass.attendance.findIndex(
      (a) => a.studentId === args.studentId
    );

    if (attendanceIndex === -1) {
      throw new Error("لم يتم تسجيل حضورك");
    }

    const attendance = [...liveClass.attendance];
    const joinedAt = attendance[attendanceIndex].joinedAt;
    const duration = Math.round((Date.now() - joinedAt) / 60000); // بالدقائق

    attendance[attendanceIndex] = {
      ...attendance[attendanceIndex],
      leftAt: Date.now(),
      duration: duration,
    };

    await ctx.db.patch(args.liveClassId, {
      attendance: attendance,
      updatedAt: Date.now(),
    });

    return { success: true, duration };
  },
});

// ✅ تحديث رابط التسجيل بعد الحصة
export const updateRecordingLink = mutation({
  args: {
    liveClassId: v.id("liveClasses"),
    recordingLink: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("غير مصرح");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user || user.role !== "teacher") {
      throw new Error("مطلوب صلاحيات معلم");
    }

    const liveClass = await ctx.db.get(args.liveClassId);
    if (!liveClass) throw new Error("الحصة غير موجودة");

    if (liveClass.teacherId !== user._id) {
      throw new Error("غير مصرح لك بتحديث هذه الحصة");
    }

    await ctx.db.patch(args.liveClassId, {
      recordingLink: args.recordingLink,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

// ✅ حذف حصة مباشرة
export const deleteLiveClass = mutation({
  args: {
    liveClassId: v.id("liveClasses"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("غير مصرح");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user || user.role !== "teacher") {
      throw new Error("مطلوب صلاحيات معلم");
    }

    const liveClass = await ctx.db.get(args.liveClassId);
    if (!liveClass) throw new Error("الحصة غير موجودة");

    if (liveClass.teacherId !== user._id) {
      throw new Error("غير مصرح لك بحذف هذه الحصة");
    }

    await ctx.db.delete(args.liveClassId);

    return { success: true };
  },
});



// ✅ جلب الحصص المباشرة للطالب
export const getStudentLiveClasses = query({
  args: { studentId: v.id("users") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("غير مصرح");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user || user.role !== "student") {
      throw new Error("مطلوب صلاحيات طالب");
    }

    // ✅ جلب جميع المجموعات التي فيها الطالب
    const allGroups = await ctx.db.query("groups").collect();
    const studentGroups = allGroups.filter((g) =>
      g.students && g.students.includes(args.studentId)
    );

    const groupIds = studentGroups.map((g) => g._id);

    // ✅ جلب الحصص المباشرة لهذه المجموعات
    let liveClasses = await ctx.db
      .query("liveClasses")
      .collect();

    liveClasses = liveClasses.filter((lc) =>
      groupIds.includes(lc.groupId) &&
      (lc.status === "scheduled" || lc.status === "live")
    );

    // جلب أسماء المجموعات
    const classesWithDetails = await Promise.all(
      liveClasses.map(async (lc) => {
        const group = await ctx.db.get(lc.groupId);
        return {
          ...lc,
          groupName: group?.name || "غير محدد",
        };
      })
    );

    return classesWithDetails.sort((a, b) => a.startTime - b.startTime);
  },
});

// ✅ جلب سجل حضور الطالب
export const getStudentAttendance = query({
  args: { studentId: v.id("users") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("غير مصرح");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user || user.role !== "student") {
      throw new Error("مطلوب صلاحيات طالب");
    }

    // ✅ جلب جميع الحصص التي حضرها الطالب
    const liveClasses = await ctx.db
      .query("liveClasses")
      .collect();

    const attendedClasses = liveClasses.filter((lc) =>
      lc.attendance.some((a) => a.studentId === args.studentId)
    );

    const attendanceHistory = await Promise.all(
      attendedClasses.map(async (lc) => {
        const group = await ctx.db.get(lc.groupId);
        const att = lc.attendance.find((a) => a.studentId === args.studentId);
        return {
          ...lc,
          groupName: group?.name || "غير محدد",
          joinedAt: att?.joinedAt || 0,
          leftAt: att?.leftAt,
          duration: att?.duration,
        };
      })
    );

    // ✅ إصلاح: التحقق من وجود joinedAt قبل المقارنة
    return attendanceHistory.sort((a, b) => {
      const aTime = a.joinedAt || 0;
      const bTime = b.joinedAt || 0;
      return bTime - aTime;
    });
  },
});

// ============================================
// EXPORTS
// ============================================

export const liveClasses = {
  getTeacherLiveClasses,
  getLiveClassById,
  getLiveClassAttendance,
  createLiveClass,
  updateLiveClassStatus,
  joinLiveClass,
  leaveLiveClass,
  updateRecordingLink,
  deleteLiveClass,
};