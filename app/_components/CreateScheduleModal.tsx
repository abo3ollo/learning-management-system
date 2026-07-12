// // app/_components/CreateScheduleModal.tsx
// "use client";

// import { useState } from "react";
// import { useMutation, useQuery } from "convex/react";
// import { api } from "@/convex/_generated/api";
// import { Id } from "@/convex/_generated/dataModel";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { X } from "lucide-react";

// // ✅ تعريف الأنواع
// type DayOfWeek = "saturday" | "sunday" | "monday" | "tuesday" | "wednesday" | "thursday" | "friday";

// interface Period {
//     periodNumber: number;
//     startTime: string;
//     endTime: string;
//     subject: string;
//     teacherId: Id<"users"> | "";
//     room: string;
//     isBreak: boolean;
//     notes: string;
// }

// interface WeekDay {
//     day: DayOfWeek;
//     periods: Period[];
// }

// interface CreateScheduleModalProps {
//     isOpen: boolean;
//     onClose: () => void;
//     classes: any[];
// }

// // ✅ إضافة يوم السبت مع ترتيب صحيح (السبت أول يوم في الأسبوع)
// const DAYS: { value: DayOfWeek; label: string }[] = [
//     { value: "saturday", label: "السبت" },
//     { value: "sunday", label: "الأحد" },
//     { value: "monday", label: "الإثنين" },
//     { value: "tuesday", label: "الثلاثاء" },
//     { value: "wednesday", label: "الأربعاء" },
//     { value: "thursday", label: "الخميس" },
// ];

// const PERIODS = [
//     { number: 1, start: "08:00", end: "09:00" },
//     { number: 2, start: "09:00", end: "10:00" },
//     { number: 3, start: "10:00", end: "11:00" },
//     { number: 4, start: "11:00", end: "12:00" },
//     { number: 5, start: "12:00", end: "13:00" },
//     { number: 6, start: "13:00", end: "14:00" },
// ];

// export function CreateScheduleModal({ isOpen, onClose, classes }: CreateScheduleModalProps) {
//     const [selectedClassId, setSelectedClassId] = useState("");
//     const [selectedTerm, setSelectedTerm] = useState<"first" | "second">("first");
//     const [academicYear, setAcademicYear] = useState("2025-2026");
//     const [weekDays, setWeekDays] = useState<WeekDay[]>(
//         DAYS.map(day => ({
//             day: day.value,
//             periods: PERIODS.map(period => ({
//                 periodNumber: period.number,
//                 startTime: period.start,
//                 endTime: period.end,
//                 subject: "",
//                 teacherId: "",
//                 room: "",
//                 isBreak: false,
//                 notes: "",
//             })),
//         }))
//     );
//     const [isSubmitting, setIsSubmitting] = useState(false);

//     // جلب المعلمين للاختيار
//     const teachers = useQuery(api.user.teachers.getTeachers, {});

//     const createSchedule = useMutation(api.schedules.schedules.createSchedule);

//     if (!isOpen) return null;

//     const updatePeriod = (dayIndex: number, periodIndex: number, field: keyof Period, value: any) => {
//         const newWeekDays = [...weekDays];
//         newWeekDays[dayIndex].periods[periodIndex] = {
//             ...newWeekDays[dayIndex].periods[periodIndex],
//             [field]: value,
//         };
//         setWeekDays(newWeekDays);
//     };

//     const handleSubmit = async (e: React.FormEvent) => {
//         e.preventDefault();
//         if (!selectedClassId) {
//             alert("الرجاء اختيار فصل");
//             return;
//         }

//         // تنظيف البيانات قبل الإرسال
//         const cleanedWeekDays = weekDays.map(day => ({
//             day: day.day,
//             periods: day.periods.map(period => ({
//                 ...period,
//                 teacherId: period.teacherId === "" ? undefined : period.teacherId,
//                 room: period.room || undefined,
//                 notes: period.notes || undefined,
//             })),
//         }));

//         setIsSubmitting(true);
//         try {
//             await createSchedule({
//                 classId: selectedClassId as any,
//                 academicYear,
//                 term: selectedTerm,
//                 weekDays: cleanedWeekDays as any,
//             });
//             onClose();
//         } catch (error) {
//             console.error("Error creating schedule:", error);
//             alert("حدث خطأ أثناء إنشاء الجدول");
//         } finally {
//             setIsSubmitting(false);
//         }
//     };

//     return (
//         <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
//             <div className="bg-white rounded-2xl shadow-xl w-full max-w-7xl max-h-[90vh] overflow-y-auto">
//                 {/* Header */}
//                 <div className="sticky top-0 bg-white border-b border-[#c0c8c9] px-6 py-4 flex items-center justify-between">
//                     <div>
//                         <h2 className="text-xl font-bold text-[#0a2540]">إنشاء جدول حصص</h2>
//                         <p className="text-sm text-gray-500 mt-1">إنشاء جدول أسبوعي جديد لفصل دراسي</p>
//                     </div>
//                     <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
//                         <X className="h-5 w-5 text-gray-500" />
//                     </button>
//                 </div>

//                 <form onSubmit={handleSubmit} className="p-6 space-y-6">
//                     {/* Basic Info */}
//                     <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//                         <div className="space-y-2">
//                             <Label>الفصل الدراسي</Label>
//                             <select
//                                 value={selectedTerm}
//                                 onChange={(e) => setSelectedTerm(e.target.value as "first" | "second")}
//                                 className="w-full px-3 py-2 border border-[#c0c8c9] rounded-lg"
//                             >
//                                 <option value="first">الفصل الدراسي الأول</option>
//                                 <option value="second">الفصل الدراسي الثاني</option>
//                             </select>
//                         </div>
//                         <div className="space-y-2">
//                             <Label>العام الدراسي</Label>
//                             <select
//                                 value={academicYear}
//                                 onChange={(e) => setAcademicYear(e.target.value)}
//                                 className="w-full px-3 py-2 border border-[#c0c8c9] rounded-lg"
//                             >
//                                 <option value="2025-2026">2025-2026</option>
//                                 <option value="2026-2027">2026-2027</option>
//                                 <option value="2027-2028">2027-2028</option>
//                             </select>
//                         </div>
//                         <div className="space-y-2">
//                             <Label>اختر الفصل</Label>
//                             <select
//                                 value={selectedClassId}
//                                 onChange={(e) => setSelectedClassId(e.target.value)}
//                                 className="w-full px-3 py-2 border border-[#c0c8c9] rounded-lg"
//                             >
//                                 <option value="">-- اختر فصل --</option>
//                                 {classes?.map((cls: any) => (
//                                     <option key={cls._id} value={cls._id}>{cls.classNameAr} ({cls.classCode})</option>
//                                 ))}
//                             </select>
//                         </div>
//                     </div>

//                     {/* Schedule Table */}
//                     <div className="overflow-x-auto">
//                         <table className="w-full border-collapse text-sm min-w-200">
//                             <thead>
//                                 <tr className="bg-[#f7fafa] border-b border-[#c0c8c9]">
//                                     <th className="p-3 text-center text-sm font-semibold text-[#001f24] w-24">الحصة / اليوم</th>
//                                     {DAYS.map(day => (
//                                         <th key={day.value} className="p-3 text-center text-sm font-semibold text-[#001f24] min-w-45">
//                                             {day.label}
//                                         </th>
//                                     ))}
//                                 </tr>
//                             </thead>
//                             <tbody>
//                                 {PERIODS.map((period, periodIdx) => (
//                                     <tr key={period.number} className="border-b border-gray-100">
//                                         <td className="p-3 font-medium text-[#001f24] bg-gray-50">
//                                             <div className="flex flex-col">
//                                                 <span>الحصة {period.number}</span>
//                                                 <span className="text-xs text-gray-500">{period.start} - {period.end}</span>
//                                             </div>
//                                         </td>
//                                         {DAYS.map((day, dayIdx) => {
//                                             const periodData = weekDays[dayIdx]?.periods[periodIdx];
//                                             if (!periodData) return <td key={day.value} className="p-2">—</td>;
                                            
//                                             return (
//                                                 <td key={day.value} className="p-2 align-top">
//                                                     <div className="space-y-2">
//                                                         {/* استراحة checkbox */}
//                                                         <label className="flex items-center gap-2 text-sm cursor-pointer">
//                                                             <input
//                                                                 type="checkbox"
//                                                                 checked={periodData.isBreak}
//                                                                 onChange={(e) => updatePeriod(dayIdx, periodIdx, "isBreak", e.target.checked)}
//                                                                 className="w-4 h-4"
//                                                             />
//                                                             <span className="text-gray-600">استراحة</span>
//                                                         </label>

//                                                         {!periodData.isBreak && (
//                                                             <>
//                                                                 {/* المادة */}
//                                                                 <Input
//                                                                     placeholder="المادة"
//                                                                     value={periodData.subject}
//                                                                     onChange={(e) => updatePeriod(dayIdx, periodIdx, "subject", e.target.value)}
//                                                                     className="text-sm"
//                                                                 />
                                                                
//                                                                 {/* المعلم */}
//                                                                 <select
//                                                                     value={periodData.teacherId}
//                                                                     onChange={(e) => updatePeriod(dayIdx, periodIdx, "teacherId", e.target.value)}
//                                                                     className="w-full px-2 py-1 text-sm border border-[#c0c8c9] rounded-lg"
//                                                                 >
//                                                                     <option value="">اختر المعلم</option>
//                                                                     {teachers?.map((teacher: any) => (
//                                                                         <option key={teacher._id} value={teacher._id}>
//                                                                             {teacher.name} - {teacher.specialization || ""}
//                                                                         </option>
//                                                                     ))}
//                                                                 </select>

//                                                                 {/* رقم الفصل */}
//                                                                 <Input
//                                                                     placeholder="رقم الفصل"
//                                                                     value={periodData.room}
//                                                                     onChange={(e) => updatePeriod(dayIdx, periodIdx, "room", e.target.value)}
//                                                                     className="text-sm"
//                                                                 />
//                                                             </>
//                                                         )}
//                                                     </div>
//                                                  </td>
//                                             );
//                                         })}
//                                     </tr>
//                                 ))}
//                             </tbody>
//                         </table>
//                     </div>

//                     {/* Note */}
//                     <div className="bg-blue-50 rounded-lg p-3 text-sm text-blue-800">
//                         <p>💡 ملاحظة: يمكنك ترك الحقول فارغة للحصص التي لا تريد إضافتها حالياً</p>
//                     </div>

//                     {/* Footer */}
//                     <div className="flex justify-end gap-3 pt-4 border-t border-[#c0c8c9]">
//                         <Button variant="outline" onClick={onClose}>
//                             إلغاء
//                         </Button>
//                         <Button type="submit" disabled={isSubmitting} className="bg-[#0a2540] hover:bg-[#1a7a8a]">
//                             {isSubmitting ? "جاري الإنشاء..." : "إنشاء الجدول"}
//                         </Button>
//                     </div>
//                 </form>
//             </div>
//         </div>
//     );
// }
import React from 'react'

function CreateScheduleModal() {
  return (
    <div>CreateScheduleModal</div>
  )
}

export default CreateScheduleModal