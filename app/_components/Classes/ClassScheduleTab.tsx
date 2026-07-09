// app/_components/Classes/ClassScheduleTab.tsx
"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  Calendar,
  Clock,
  BookOpen,
  User,
  Plus,
  Edit,
  Trash2,
  Loader2,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  RefreshCw,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AddScheduleModal } from "../AddScheduleModal";
import { SiGoogleclassroom } from "react-icons/si";


interface ClassScheduleTabProps {
  classId: string;
}

// ترجمة أيام الأسبوع
const dayTranslations: Record<string, string> = {
  saturday: "السبت",
  sunday: "الأحد",
  monday: "الإثنين",
  tuesday: "الثلاثاء",
  wednesday: "الأربعاء",
  thursday: "الخميس",
  friday: "الجمعة",
};

const dayOrder = ["saturday", "sunday", "monday", "tuesday", "wednesday", "thursday"];

export function ClassScheduleTab({ classId }: ClassScheduleTabProps) {
  const [selectedDay, setSelectedDay] = useState(0);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [academicYear, setAcademicYear] = useState("2025-2026");
  const [term, setTerm] = useState<"first" | "second">("first");

  const classData = useQuery(api.classes.classes.getClassById, {
    classId: classId as any,
  });

  // جلب الجدول من Convex
  const scheduleData = useQuery(api.schedules.schedules.getClassSchedule, {
    classId: classId as any,
  });

  // جلب الجدول النشط
  const activeSchedule = scheduleData && (scheduleData as any).weekDays !== undefined ? (scheduleData as any) : null;

  // جلب الجدول الكامل مع التفاصيل
  const fullSchedule = activeSchedule
    ? useQuery(
        api.schedules.schedules.getScheduleById,
        activeSchedule._id ? { scheduleId: activeSchedule._id as any } : "skip"
      )
    : null;

  const deleteSchedule = useMutation(api.schedules.schedules.deleteSchedule);

  const isLoading = classData === undefined || scheduleData === undefined;

  // استخراج أيام الجدول
  const weekDays = fullSchedule?.weekDays || [];
  const currentDay = weekDays[selectedDay] || { day: "", periods: [] };

  // ترتيب الأيام حسب الترتيب الصحيح
  const sortedDays = weekDays.sort(
    (a, b) => dayOrder.indexOf(a.day) - dayOrder.indexOf(b.day)
  );

  const dayNames = sortedDays.map((d) => dayTranslations[d.day] || d.day);

  const goToPrevDay = () => {
    setSelectedDay((prev) => (prev > 0 ? prev - 1 : sortedDays.length - 1));
  };

  const goToNextDay = () => {
    setSelectedDay((prev) => (prev < sortedDays.length - 1 ? prev + 1 : 0));
  };

  const handleDeleteSchedule = async () => {
    if (!activeSchedule?._id) return;
    if (!confirm("هل أنت متأكد من حذف هذا الجدول؟")) return;

    try {
      await deleteSchedule({ scheduleId: activeSchedule._id as any });
    } catch (error) {
      console.error("Error deleting schedule:", error);
      alert("حدث خطأ أثناء حذف الجدول");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-[#1a7a8a]" />
      </div>
    );
  }

  // إذا لم يكن هناك جدول
  if (!activeSchedule || !fullSchedule) {
    return (
      <div className="p-6 space-y-6">
        <div className="text-center py-12">
          <Calendar className="h-16 w-16 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-semibold text-[#001f24]">لا يوجد جدول دراسي</h3>
          <p className="text-sm text-gray-500 mt-2">
            لم يتم إنشاء جدول لهذا الفصل في العام الدراسي {academicYear}
          </p>
          <Button
            onClick={() => setIsAddModalOpen(true)}
            className="mt-4 bg-[#001f24] hover:bg-[#03363d] text-white"
          >
            <Plus className="h-4 w-4 ml-2" />
            إنشاء جدول
          </Button>
        </div>

        <AddScheduleModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          classId={classId}
          academicYear={academicYear}
          term={term}
        />
      </div>
    );
  }

  // حساب إحصائيات الجدول
  const totalPeriods = weekDays.reduce(
    (sum, day) => sum + day.periods.filter((p: any) => !p.isBreak).length,
    0
  );
  const totalDays = weekDays.length;
  const totalSubjects = new Set(
    weekDays.flatMap((d) => d.periods.filter((p: any) => !p.isBreak).map((p: any) => p.subject))
  ).size;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h3 className="text-lg font-semibold text-[#001f24] flex items-center gap-2">
            <Calendar className="h-5 w-5 text-[#1a7a8a]" />
            جدول الفصل
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            {classData?.classNameAr} - {academicYear} - {term === "first" ? "الفصل الأول" : "الفصل الثاني"}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleDeleteSchedule}
            className="text-red-600 hover:text-red-700"
          >
            <Trash2 className="h-4 w-4 ml-2" />
            حذف الجدول
          </Button>
          <Button
            onClick={() => setIsAddModalOpen(true)}
            className="bg-[#001f24] hover:bg-[#03363d] text-white"
          >
            <Plus className="h-4 w-4 ml-2" />
            تعديل الجدول
          </Button>
        </div>
      </div>

      {/* Schedule Info */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[#f7fafa] rounded-xl p-3 text-center border border-[#c0c8c9]">
          <p className="text-2xl font-bold text-[#001f24]">{totalPeriods}</p>
          <p className="text-xs text-gray-500">إجمالي الحصص</p>
        </div>
        <div className="bg-[#f7fafa] rounded-xl p-3 text-center border border-[#c0c8c9]">
          <p className="text-2xl font-bold text-[#001f24]">{totalDays}</p>
          <p className="text-xs text-gray-500">أيام دراسية</p>
        </div>
        <div className="bg-[#f7fafa] rounded-xl p-3 text-center border border-[#c0c8c9]">
          <p className="text-2xl font-bold text-[#001f24]">{totalSubjects}</p>
          <p className="text-xs text-gray-500">مواد دراسية</p>
        </div>
        <div className="bg-[#f7fafa] rounded-xl p-3 text-center border border-[#c0c8c9]">
          <p className="text-2xl font-bold text-[#001f24]">{activeSchedule?.createdAt ? new Date(activeSchedule.createdAt).toLocaleDateString("ar-EG") : "—"}</p>
          <p className="text-xs text-gray-500">تاريخ الإنشاء</p>
        </div>
      </div>

      {/* Day Navigator */}
      {sortedDays.length > 0 && (
        <div className="flex items-center justify-between gap-4 bg-[#f7fafa] rounded-xl p-3 border border-[#c0c8c9]">
          <button
            onClick={goToPrevDay}
            className="p-2 hover:bg-white rounded-lg transition-colors"
          >
            <ChevronRight className="h-5 w-5 text-gray-500" />
          </button>

          <div className="flex gap-2 overflow-x-auto flex-1 justify-center">
            {dayNames.map((day, index) => (
              <button
                key={day}
                onClick={() => setSelectedDay(index)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                  selectedDay === index
                    ? "bg-[#001f24] text-white"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                {day}
              </button>
            ))}
          </div>

          <button
            onClick={goToNextDay}
            className="p-2 hover:bg-white rounded-lg transition-colors"
          >
            <ChevronLeft className="h-5 w-5 text-gray-500" />
          </button>
        </div>
      )}

      {/* Day Schedule */}
      {currentDay.periods && currentDay.periods.length > 0 ? (
        <div className="bg-white rounded-xl border border-[#c0c8c9] overflow-hidden">
          <div className="bg-[#f7fafa] px-6 py-3 border-b border-[#c0c8c9] flex items-center justify-between">
            <h4 className="font-semibold text-[#001f24]">
              {dayTranslations[currentDay.day] || currentDay.day}
            </h4>
            <span className="text-sm text-gray-500">
              {currentDay.periods.filter((p: any) => !p.isBreak).length} حصص
            </span>
          </div>

          <div className="divide-y divide-[#c0c8c9]">
            {currentDay.periods.map((period: any) => (
              <div
                key={period.periodNumber}
                className={`flex items-center justify-between p-4 hover:bg-[#f7fafa] transition-colors group ${
                  period.isBreak ? "bg-amber-50" : ""
                }`}
              >
                <div className="flex items-center gap-4 flex-1">
                  <div className="w-40 text-sm font-medium text-[#001f24]">
                    <Clock className="h-3 w-3 inline ml-1 text-gray-400" />
                    {period.startTime} - {period.endTime}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      {period.isBreak ? (
                        <>
                          <span className="text-amber-600">☕</span>
                          <span className="font-medium text-amber-700">استراحة</span>
                        </>
                      ) : (
                        <>
                          <SiGoogleclassroom className="h-4 w-4 text-[#1a7a8a]" />
                          <span className="font-medium text-[#001f24]">
                            {period.subject}
                          </span>
                        </>
                      )}
                    </div>
                    {!period.isBreak && (
                      <div className="flex items-center gap-3 text-xs text-gray-500 mt-1 flex-wrap">
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {period.teacherName || period.teacherId || "غير محدد"}
                        </span>
                        {period.room && (
                          <span className="flex items-center gap-1">
                            <span className="text-gray-300">|</span>
                            غرفة {period.room}
                          </span>
                        )}
                        {period.notes && (
                          <span className="flex items-center gap-1 text-gray-400">
                            <FileText className="h-3 w-3" />
                            {period.notes}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="p-1.5 hover:bg-blue-50 rounded-lg transition-colors">
                    <Edit className="h-4 w-4 text-gray-400 hover:text-blue-600" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-xl border border-[#c0c8c9]">
          <Calendar className="h-12 w-12 mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500">لا توجد حصص لهذا اليوم</p>
        </div>
      )}

      {/* Add Schedule Modal */}
      <AddScheduleModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        classId={classId}
        academicYear={academicYear}
        term={term}
        scheduleId={activeSchedule?._id}
      />
    </div>
  );
}