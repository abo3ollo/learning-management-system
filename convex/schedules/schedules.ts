// convex/schedules/schedules.ts

import { v } from "convex/values";
import { mutation, query } from "../_generated/server";
import { Id } from "../_generated/dataModel";

// ============================================
// QUERIES
// ============================================

// ✅ جلب جدول المجموعة
export const getGroupSchedule = query({
  args: { groupId: v.id("groups") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("غير مصرح");

    const schedule = await ctx.db
      .query("schedules")
      .withIndex("by_group", (q) => q.eq("groupId", args.groupId))
      .first();

    // ✅ إرجاع كائن افتراضي إذا لم يكن موجوداً
    if (!schedule) {
      return {
        weekDays: [],
        holidays: [],
        groupId: args.groupId,
      };
    }

    // جلب أسماء المعلمين
    const enrichedSchedule = { ...schedule };
    if (enrichedSchedule.weekDays) {
      for (const day of enrichedSchedule.weekDays) {
        if (day.periods) {
          for (const period of day.periods) {
            if (period.teacherId) {
              const teacher = await ctx.db.get(period.teacherId);
              period.teacherName = teacher?.name || "غير محدد";
            }
          }
        }
      }
    }

    return enrichedSchedule;
  },
});

// ✅ جلب جدول الفصل (للتوافق القديم)
export const getClassSchedule = query({
  args: { classId: v.id("classes") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("غير مصرح");

    const schedule = await ctx.db
      .query("schedules")
      .withIndex("by_class", (q) => q.eq("classId", args.classId))
      .first();

    if (!schedule) {
      return {
        weekDays: [],
        holidays: [],
      };
    }

    return schedule;
  },
});

// ✅ جلب الجدول حسب المجموعة (اسم بديل) - تم إزالة الاستدعاء المباشر
export const getScheduleByGroup = query({
  args: { groupId: v.id("groups") },
  handler: async (ctx, args) => {
    // ✅ لا تستدعي getGroupSchedule مباشرة، انسخ المنطق هنا
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("غير مصرح");

    const schedule = await ctx.db
      .query("schedules")
      .withIndex("by_group", (q) => q.eq("groupId", args.groupId))
      .first();

    if (!schedule) {
      return {
        weekDays: [],
        holidays: [],
        groupId: args.groupId,
      };
    }

    // جلب أسماء المعلمين
    const enrichedSchedule = { ...schedule };
    if (enrichedSchedule.weekDays) {
      for (const day of enrichedSchedule.weekDays) {
        if (day.periods) {
          for (const period of day.periods) {
            if (period.teacherId) {
              const teacher = await ctx.db.get(period.teacherId);
              period.teacherName = teacher?.name || "غير محدد";
            }
          }
        }
      }
    }

    return enrichedSchedule;
  },
});

export const getSchedulesByYearAndTerm = query({
  args: {
    academicYear: v.string(),
    term: v.optional(v.union(v.literal("first"), v.literal("second"))),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("غير مصرح");

    const schedules = await ctx.db
      .query("schedules")
      .withIndex("by_academicYear", (q) => q.eq("academicYear", args.academicYear))
      .collect();

    const filtered = schedules.filter((schedule) => !args.term || schedule.term === args.term);

    const enriched = await Promise.all(
      filtered.map(async (schedule) => {
        let name = "غير معروف";
        if (schedule.classId) {
          const classData = await ctx.db.get(schedule.classId);
          name = (classData as any)?.classNameAr || (classData as any)?.name || "غير معروف";
        } else if (schedule.groupId) {
          const groupData = await ctx.db.get(schedule.groupId);
          name = groupData?.name || "غير معروف";
        }
        return {
          ...schedule,
          className: name,
        };
      })
    );

    return enriched.sort((a, b) => b.createdAt - a.createdAt);
  },
});

export const getScheduleById = query({
  args: { scheduleId: v.id("schedules") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.scheduleId);
  },
});

// ============================================
// MUTATIONS
// ============================================

// ✅ إنشاء جدول جديد للمجموعة
export const createGroupSchedule = mutation({
  args: {
    groupId: v.id("groups"),
    academicYear: v.string(),
    term: v.union(v.literal("first"), v.literal("second")),
    weekDays: v.array(
      v.object({
        day: v.string(),
        periods: v.array(
          v.object({
            periodNumber: v.number(),
            startTime: v.string(),
            endTime: v.string(),
            subject: v.string(),
            teacherId: v.optional(v.id("users")),
            room: v.optional(v.string()),
            isBreak: v.boolean(),
            notes: v.optional(v.string()),
          })
        ),
      })
    ),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("غير مصرح");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user || (user.role !== "admin" && user.role !== "teacher")) {
      throw new Error("مطلوب صلاحيات مشرف أو معلم");
    }

    // التحقق من وجود المجموعة
    const group = await ctx.db.get(args.groupId);
    if (!group) throw new Error("المجموعة غير موجودة");

    // التحقق من عدم وجود جدول مسبق
    const existing = await ctx.db
      .query("schedules")
      .withIndex("by_group", (q) => q.eq("groupId", args.groupId))
      .first();

    if (existing) {
      throw new Error("يوجد جدول لهذه المجموعة بالفعل");
    }

    const scheduleId = await ctx.db.insert("schedules", {
      groupId: args.groupId,
      academicYear: args.academicYear,
      term: args.term,
      weekDays: args.weekDays,
      holidays: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return { success: true, scheduleId };
  },
});

// ✅ إضافة حصة للمجموعة
export const addScheduleSlot = mutation({
  args: {
    groupId: v.id("groups"),
    day: v.string(),
    startTime: v.string(),
    endTime: v.string(),
    subject: v.optional(v.string()),
    teacherId: v.optional(v.id("users")),
    room: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("غير مصرح");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user || (user.role !== "admin" && user.role !== "teacher")) {
      throw new Error("مطلوب صلاحيات مشرف أو معلم");
    }

    const group = await ctx.db.get(args.groupId);
    if (!group) throw new Error("المجموعة غير موجودة");

    // جلب الجدول الحالي أو إنشاء جديد
    let schedule = await ctx.db
      .query("schedules")
      .withIndex("by_group", (q) => q.eq("groupId", args.groupId))
      .first();

    const newPeriod = {
      periodNumber: 0,
      startTime: args.startTime,
      endTime: args.endTime,
      subject: args.subject || group.subject || "غير محدد",
      teacherId: args.teacherId,
      room: args.room,
      isBreak: false,
      notes: args.notes,
    };

    if (!schedule) {
      // إنشاء جدول جديد
      const scheduleId = await ctx.db.insert("schedules", {
        groupId: args.groupId,
        academicYear: new Date().getFullYear().toString(),
        term: "first",
        weekDays: [
          {
            day: args.day,
            periods: [{ ...newPeriod, periodNumber: 1 }],
          },
        ],
        holidays: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      return { success: true, scheduleId };
    }

    // تحديث الجدول الحالي
    const weekDays = schedule.weekDays || [];
    const dayIndex = weekDays.findIndex((d: any) => d.day === args.day);

    if (dayIndex === -1) {
      // إضافة يوم جديد
      weekDays.push({
        day: args.day,
        periods: [{ ...newPeriod, periodNumber: 1 }],
      });
    } else {
      // إضافة حصة لليوم الموجود
      const periods = weekDays[dayIndex].periods || [];
      weekDays[dayIndex].periods = [
        ...periods,
        { ...newPeriod, periodNumber: periods.length + 1 },
      ];
    }

    await ctx.db.patch(schedule._id, {
      weekDays: weekDays,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

// ✅ إزالة حصة من المجموعة
export const removeScheduleSlot = mutation({
  args: {
    groupId: v.id("groups"),
    day: v.string(),
    periodIndex: v.number(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("غير مصرح");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user || (user.role !== "admin" && user.role !== "teacher")) {
      throw new Error("مطلوب صلاحيات مشرف أو معلم");
    }

    const schedule = await ctx.db
      .query("schedules")
      .withIndex("by_group", (q) => q.eq("groupId", args.groupId))
      .first();

    if (!schedule) throw new Error("الجدول غير موجود");

    const weekDays = schedule.weekDays || [];
    const dayIndex = weekDays.findIndex((d: any) => d.day === args.day);

    if (dayIndex === -1) throw new Error("اليوم غير موجود في الجدول");

    const periods = weekDays[dayIndex].periods || [];
    if (args.periodIndex >= periods.length) throw new Error("الحصة غير موجودة");

    // إزالة الحصة
    periods.splice(args.periodIndex, 1);

    // إعادة ترتيب الأرقام
    periods.forEach((p: any, index: number) => {
      p.periodNumber = index + 1;
    });

    // تحديث الجدول
    weekDays[dayIndex].periods = periods;
    await ctx.db.patch(schedule._id, {
      weekDays: weekDays,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

// ✅ تحديث حصة
export const updateScheduleSlot = mutation({
  args: {
    groupId: v.id("groups"),
    day: v.string(),
    periodIndex: v.number(),
    startTime: v.optional(v.string()),
    endTime: v.optional(v.string()),
    subject: v.optional(v.string()),
    teacherId: v.optional(v.id("users")),
    room: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("غير مصرح");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user || (user.role !== "admin" && user.role !== "teacher")) {
      throw new Error("مطلوب صلاحيات مشرف أو معلم");
    }

    const schedule = await ctx.db
      .query("schedules")
      .withIndex("by_group", (q) => q.eq("groupId", args.groupId))
      .first();

    if (!schedule) throw new Error("الجدول غير موجود");

    const weekDays = schedule.weekDays || [];
    const dayIndex = weekDays.findIndex((d: any) => d.day === args.day);

    if (dayIndex === -1) throw new Error("اليوم غير موجود");

    if (args.periodIndex >= weekDays[dayIndex].periods.length) {
      throw new Error("الحصة غير موجودة");
    }

    const period = weekDays[dayIndex].periods[args.periodIndex];
    if (args.startTime !== undefined) period.startTime = args.startTime;
    if (args.endTime !== undefined) period.endTime = args.endTime;
    if (args.subject !== undefined) period.subject = args.subject;
    if (args.teacherId !== undefined) period.teacherId = args.teacherId;
    if (args.room !== undefined) period.room = args.room;
    if (args.notes !== undefined) period.notes = args.notes;

    await ctx.db.patch(schedule._id, {
      weekDays: weekDays,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

// ✅ إضافة إجازة للمجموعة
export const addGroupHoliday = mutation({
  args: {
    groupId: v.id("groups"),
    date: v.number(),
    reason: v.string(),
    type: v.union(v.literal("holiday"), v.literal("exception")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("غير مصرح");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user || (user.role !== "admin" && user.role !== "teacher")) {
      throw new Error("مطلوب صلاحيات مشرف أو معلم");
    }

    let schedule = await ctx.db
      .query("schedules")
      .withIndex("by_group", (q) => q.eq("groupId", args.groupId))
      .first();

    if (!schedule) {
      // إنشاء جدول جديد بالإجازة
      const scheduleId = await ctx.db.insert("schedules", {
        groupId: args.groupId,
        academicYear: new Date().getFullYear().toString(),
        term: "first",
        weekDays: [],
        holidays: [
          {
            date: args.date,
            reason: args.reason,
            type: args.type,
          },
        ],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      return { success: true, scheduleId };
    }

    const holidays = schedule.holidays || [];
    holidays.push({
      date: args.date,
      reason: args.reason,
      type: args.type,
    });

    await ctx.db.patch(schedule._id, {
      holidays: holidays,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

// ✅ إزالة إجازة
export const removeHoliday = mutation({
  args: {
    groupId: v.id("groups"),
    holidayIndex: v.number(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("غير مصرح");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user || (user.role !== "admin" && user.role !== "teacher")) {
      throw new Error("مطلوب صلاحيات مشرف أو معلم");
    }

    const schedule = await ctx.db
      .query("schedules")
      .withIndex("by_group", (q) => q.eq("groupId", args.groupId))
      .first();

    if (!schedule) throw new Error("الجدول غير موجود");

    const holidays = schedule.holidays || [];
    if (args.holidayIndex >= holidays.length) {
      throw new Error("الإجازة غير موجودة");
    }

    holidays.splice(args.holidayIndex, 1);

    await ctx.db.patch(schedule._id, {
      holidays: holidays,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

// ✅ توليد جدول تلقائي
export const generateSchedule = mutation({
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

    if (!user || (user.role !== "admin" && user.role !== "teacher")) {
      throw new Error("مطلوب صلاحيات مشرف أو معلم");
    }

    const group = await ctx.db.get(args.groupId);
    if (!group) throw new Error("المجموعة غير موجودة");

    // أيام الدراسة (السبت - الخميس)
    const studyDays = ["saturday", "sunday", "monday", "tuesday", "wednesday", "thursday"];
    
    // توليد حصص لكل يوم (افتراضي)
    const weekDays = studyDays.map((day, index) => {
      // أيام مختلفة: الأحد والثلاثاء والخميس 4 حصص، الباقي 3 حصص
      const numPeriods = [0, 2, 4].includes(index) ? 4 : 3;
      const periods = [];
      let startHour = 8; // تبدأ من 8 صباحاً

      for (let i = 0; i < numPeriods; i++) {
        const startTime = `${String(startHour).padStart(2, '0')}:00`;
        const endHour = startHour + 1;
        const endTime = `${String(endHour).padStart(2, '0')}:00`;
        
        periods.push({
          periodNumber: i + 1,
          startTime: startTime,
          endTime: endTime,
          subject: group.subject || "غير محدد",
          teacherId: group.supervisorId,
          room: group.location || "",
          isBreak: false,
          notes: "",
        });
        
        startHour = endHour;
      }

      return {
        day: day,
        periods: periods,
      };
    });

    // حذف الجدول القديم إذا وجد
    const existing = await ctx.db
      .query("schedules")
      .withIndex("by_group", (q) => q.eq("groupId", args.groupId))
      .first();

    if (existing) {
      await ctx.db.delete(existing._id);
    }

    // إنشاء جدول جديد
    await ctx.db.insert("schedules", {
      groupId: args.groupId,
      academicYear: new Date().getFullYear().toString(),
      term: "first",
      weekDays: weekDays,
      holidays: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

// ✅ حذف جدول
export const deleteGroupSchedule = mutation({
  args: { groupId: v.id("groups") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("غير مصرح");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user || (user.role !== "admin" && user.role !== "teacher")) {
      throw new Error("مطلوب صلاحيات مشرف أو معلم");
    }

    const schedule = await ctx.db
      .query("schedules")
      .withIndex("by_group", (q) => q.eq("groupId", args.groupId))
      .first();

    if (!schedule) throw new Error("الجدول غير موجود");

    await ctx.db.delete(schedule._id);
    return { success: true };
  },
});

// ✅ دوال التوافق القديم (classId) - محذوفة لتجنب الأخطاء

// ============================================
// EXPORTS
// ============================================

export const schedules = {
  // دوال المجموعة
  getGroupSchedule,
  getScheduleByGroup,
  createGroupSchedule,
  addScheduleSlot,
  removeScheduleSlot,
  updateScheduleSlot,
  addGroupHoliday,
  removeHoliday,
  generateSchedule,
  deleteGroupSchedule,
  
  // دوال الفصل (للتوافق القديم)
  getClassSchedule,
  getSchedulesByYearAndTerm,
  getScheduleById,
  createSchedule: createGroupSchedule,
  deleteSchedule: deleteGroupSchedule,
  addPeriod: addScheduleSlot,
  updatePeriod: updateScheduleSlot,
  deletePeriod: removeScheduleSlot,
};