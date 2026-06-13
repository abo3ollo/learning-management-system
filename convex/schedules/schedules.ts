// convex/schedules/schedules.ts
import { v } from "convex/values";
import { mutation, query, internalMutation } from "../_generated/server";
import { Id } from "../_generated/dataModel";

// ============ إدارة الجدول ============

// إنشاء جدول أسبوعي لفصل
export const createSchedule = mutation({
  args: {
    classId: v.id("classes"),
    academicYear: v.string(),
    term: v.union(v.literal("first"), v.literal("second")),
    weekDays: v.array(v.object({
      day: v.union(
        v.literal("sunday"),
        v.literal("monday"),
        v.literal("tuesday"),
        v.literal("wednesday"),
        v.literal("thursday"),
        v.literal("friday"),
        v.literal("saturday")
      ),
      periods: v.array(v.object({
        periodNumber: v.number(),
        startTime: v.string(),
        endTime: v.string(),
        subject: v.string(),
        teacherId: v.optional(v.id("users")),
        room: v.optional(v.string()),
        isBreak: v.boolean(),
        notes: v.optional(v.string()),
      })),
    })),
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

    // التحقق من وجود جدول سابق
    const existing = await ctx.db
      .query("schedules")
      .withIndex("by_class", (q) => q.eq("classId", args.classId))
      .filter((q) => 
        q.eq(q.field("academicYear"), args.academicYear) &&
        q.eq(q.field("term"), args.term)
      )
      .first();

    if (existing) {
      throw new Error("يوجد جدول بالفعل لهذا الفصل في هذا العام الدراسي والفصل");
    }

    const scheduleId = await ctx.db.insert("schedules", {
      classId: args.classId,
      academicYear: args.academicYear,
      term: args.term,
      weekDays: args.weekDays,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // إنشاء إشعارات تذكير للحصص
    for (const day of args.weekDays) {
      for (const period of day.periods) {
        if (!period.isBreak) {
          await ctx.db.insert("scheduleReminders", {
            scheduleId,
            classId: args.classId,
            periodNumber: period.periodNumber,
            reminderTime: Date.now(), // سيتم تحديثه لاحقاً
            sent: false,
            createdAt: Date.now(),
          });
        }
      }
    }

    return { success: true, scheduleId };
  },
});

// جلب جدول فصل
export const getClassSchedule = query({
  args: {
    classId: v.id("classes"),
    academicYear: v.string(),
    term: v.union(v.literal("first"), v.literal("second")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("غير مصرح");

    const schedule = await ctx.db
      .query("schedules")
      .withIndex("by_class", (q) => q.eq("classId", args.classId))
      .filter((q) => 
        q.eq(q.field("academicYear"), args.academicYear) &&
        q.eq(q.field("term"), args.term)
      )
      .first();

    if (!schedule) return null;

    // جلب أسماء المعلمين لكل حصة
    const enrichedSchedule = await Promise.all(
      schedule.weekDays.map(async (day) => {
        const enrichedPeriods = await Promise.all(
          day.periods.map(async (period) => {
            if (!period.isBreak && period.teacherId) {
              const teacher = await ctx.db.get(period.teacherId);
              return {
                ...period,
                teacherName: teacher?.name || "غير محدد",
              };
            }
            return period;
          })
        );
        return { ...day, periods: enrichedPeriods };
      })
    );

    return { ...schedule, weekDays: enrichedSchedule };
  },
});

// تحديث جدول
export const updateSchedule = mutation({
  args: {
    scheduleId: v.id("schedules"),
    weekDays: v.array(v.object({
      day: v.union(
        v.literal("sunday"),
        v.literal("monday"),
        v.literal("tuesday"),
        v.literal("wednesday"),
        v.literal("thursday"),
        v.literal("friday"),
        v.literal("saturday")
      ),
      periods: v.array(v.object({
        periodNumber: v.number(),
        startTime: v.string(),
        endTime: v.string(),
        subject: v.string(),
        teacherId: v.id("users"),
        room: v.optional(v.string()),
        isBreak: v.boolean(),
        notes: v.optional(v.string()),
      })),
    })),
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

    await ctx.db.patch(args.scheduleId, {
      weekDays: args.weekDays,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

// حذف جدول
export const deleteSchedule = mutation({
  args: { scheduleId: v.id("schedules") },
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

    // حذف الإشعارات المرتبطة
    const reminders = await ctx.db
      .query("scheduleReminders")
      .withIndex("by_schedule", (q) => q.eq("scheduleId", args.scheduleId))
      .collect();

    for (const reminder of reminders) {
      await ctx.db.delete(reminder._id);
    }

    await ctx.db.delete(args.scheduleId);

    return { success: true };
  },
});


// جلب الجداول حسب العام الدراسي والفصل الدراسي
export const getSchedulesByYearAndTerm = query({
  args: {
    academicYear: v.string(),
    term: v.union(v.literal("first"), v.literal("second")),
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

    const schedules = await ctx.db
      .query("schedules")
      .withIndex("by_academicYear", (q) => q.eq("academicYear", args.academicYear))
      .filter((q) => q.eq(q.field("term"), args.term))
      .collect();

    // إضافة اسم الفصل وأسماء المعلمين لكل جدول
    const schedulesWithDetails = await Promise.all(
      schedules.map(async (schedule) => {
        const classData = await ctx.db.get(schedule.classId);
        
        // إضافة أسماء المعلمين لكل حصة
        const enrichedWeekDays = await Promise.all(
          schedule.weekDays.map(async (day) => {
            const enrichedPeriods = await Promise.all(
              day.periods.map(async (period) => {
                if (!period.isBreak && period.teacherId) {
                  const teacher = await ctx.db.get(period.teacherId);
                  return {
                    ...period,
                    teacherName: teacher?.name || "غير محدد",
                  };
                }
                return period;
              })
            );
            return { ...day, periods: enrichedPeriods };
          })
        );

        return {
          ...schedule,
          className: classData?.classNameAr || "غير محدد",
          classCode: classData?.classCode || "",
          weekDays: enrichedWeekDays,
        };
      })
    );

    return schedulesWithDetails;
  },
});

// جلب جدول بواسطة ID (للتعديل)
export const getScheduleById = query({
  args: { scheduleId: v.id("schedules") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("غير مصرح");

    const schedule = await ctx.db.get(args.scheduleId);
    if (!schedule) throw new Error("الجدول غير موجود");

    // جلب معلومات الفصل
    const classData = await ctx.db.get(schedule.classId);

    // جلب أسماء المعلمين لكل حصة
    const enrichedWeekDays = await Promise.all(
      schedule.weekDays.map(async (day) => {
        const enrichedPeriods = await Promise.all(
          day.periods.map(async (period) => {
            if (!period.isBreak && period.teacherId) {
              const teacher = await ctx.db.get(period.teacherId);
              return {
                ...period,
                teacherName: teacher?.name || "غير محدد",
              };
            }
            return period;
          })
        );
        return { ...day, periods: enrichedPeriods };
      })
    );

    return {
      ...schedule,
      className: classData?.classNameAr || "غير محدد",
      classCode: classData?.classCode || "",
      weekDays: enrichedWeekDays,
    };
  },
});

// جلب الجداول لفصل معين
export const getSchedulesByClass = query({
  args: {
    classId: v.id("classes"),
    academicYear: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("غير مصرح");

    let schedulesQuery = ctx.db
      .query("schedules")
      .withIndex("by_class", (q) => q.eq("classId", args.classId));

    let schedules = await schedulesQuery.collect();

    if (args.academicYear) {
      schedules = schedules.filter(s => s.academicYear === args.academicYear);
    }

    return schedules;
  },
});

// جلب إحصائيات الجداول
export const getSchedulesStats = query({
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

    const allSchedules = await ctx.db.query("schedules").collect();
    const totalClasses = new Set(allSchedules.map(s => s.classId)).size;

    // حساب إجمالي الحصص
    let totalPeriods = 0;
    for (const schedule of allSchedules) {
      for (const day of schedule.weekDays) {
        totalPeriods += day.periods.filter(p => !p.isBreak).length;
      }
    }

    return {
      totalSchedules: allSchedules.length,
      totalClasses,
      totalPeriods,
      activeSchedules: allSchedules.filter(s => {
        const today = new Date().toISOString().split('T')[0];
        return s.updatedAt > Date.now() - 30 * 24 * 60 * 60 * 1000;
      }).length,
    };
  },
});

// ============ تسجيل الحضور ============

// تسجيل حضور طالب
export const recordAttendance = mutation({
  args: {
    classId: v.id("classes"),
    studentId: v.id("users"),
    date: v.string(),
    periodNumber: v.number(),
    status: v.union(
      v.literal("present"),
      v.literal("absent"),
      v.literal("late"),
      v.literal("excused")
    ),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("غير مصرح");

    const teacher = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!teacher || (teacher.role !== "teacher" && teacher.role !== "admin")) {
      throw new Error("غير مصرح");
    }

    // التحقق من وجود تسجيل سابق
    const existing = await ctx.db
      .query("attendance")
      .withIndex("by_class_date", (q) => q.eq("classId", args.classId))
      .filter((q) =>
        q.eq(q.field("date"), args.date) &&
        q.eq(q.field("periodNumber"), args.periodNumber) &&
        q.eq(q.field("studentId"), args.studentId)
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        status: args.status,
        notes: args.notes,
        updatedAt: Date.now(),
      });
    } else {
      await ctx.db.insert("attendance", {
        classId: args.classId,
        studentId: args.studentId,
        date: args.date,
        periodNumber: args.periodNumber,
        status: args.status,
        notes: args.notes,
        recordedBy: teacher._id,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }

    // إرسال إشعار لولي الأمر عند الغياب
    if (args.status === "absent") {
      // يمكن إضافة منطق إرسال إشعار هنا
    }

    return { success: true };
  },
});

// جلب حضور طالب
export const getStudentAttendance = query({
  args: {
    studentId: v.id("users"),
    startDate: v.string(),
    endDate: v.string(),
  },
  handler: async (ctx, args) => {
    const attendance = await ctx.db
      .query("attendance")
      .withIndex("by_student", (q) => q.eq("studentId", args.studentId))
      .filter((q) =>
        q.gte(q.field("date"), args.startDate) &&
        q.lte(q.field("date"), args.endDate)
      )
      .collect();

    const stats = {
      total: attendance.length,
      present: attendance.filter(a => a.status === "present").length,
      absent: attendance.filter(a => a.status === "absent").length,
      late: attendance.filter(a => a.status === "late").length,
      excused: attendance.filter(a => a.status === "excused").length,
      percentage: 0,
    };

    stats.percentage = stats.total > 0 
      ? (stats.present / stats.total) * 100 
      : 0;

    return { attendance, stats };
  },
});

// جلب حضور فصل في يوم محدد
export const getClassAttendanceByDate = query({
  args: {
    classId: v.id("classes"),
    date: v.string(),
    periodNumber: v.number(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("غير مصرح");

    const attendance = await ctx.db
      .query("attendance")
      .withIndex("by_class_date", (q) => q.eq("classId", args.classId))
      .filter((q) =>
        q.eq(q.field("date"), args.date) &&
        q.eq(q.field("periodNumber"), args.periodNumber)
      )
      .collect();

    // جلب جميع طلاب الفصل
    const classData = await ctx.db.get(args.classId);
    const allStudents = await Promise.all(
      (classData?.students || []).map(async (studentId) => {
        const student = await ctx.db.get(studentId);
        const record = attendance.find(a => a.studentId === studentId);
        return {
          student,
          status: record?.status || "not_recorded",
          notes: record?.notes,
        };
      })
    );

    return allStudents;
  },
});