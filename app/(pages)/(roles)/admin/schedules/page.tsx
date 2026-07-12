// // app/(pages)/(roles)/admin/schedules/page.tsx
// "use client";

// import { useState } from "react";
// import { useQuery, useMutation } from "convex/react";
// import { api } from "@/convex/_generated/api";
// import {
//   Calendar,
//   Clock,
//   BookOpen,
//   Users,
//   Plus,
//   Edit,
//   Trash2,
//   Bell,
//   Loader2,
//   Filter,
// } from "lucide-react";
// import Link from "next/link";
// import { Button } from "@/components/ui/button";
// import { CreateScheduleModal } from "@/app/_components/CreateScheduleModal";

// export default function AdminSchedulesPage() {
//   const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
//   const [selectedYear, setSelectedYear] = useState("2025-2026");
//   const [selectedTerm, setSelectedTerm] = useState<"first" | "second">("first");
//   const [deletingId, setDeletingId] = useState<string | null>(null);


//   const classes = useQuery(api.classes.classes.getClasses, {});
//   // جلب الجداول حسب العام الدراسي والفصل الدراسي
//   const schedules = useQuery(api.schedules.schedules.getSchedulesByYearAndTerm, {
//     academicYear: selectedYear,
//     term: selectedTerm,
//   });

//   const deleteSchedule = useMutation(api.schedules.schedules.deleteSchedule);

//   const getTermName = (term: string) => {
//     return term === "first" ? "الفصل الدراسي الأول" : "الفصل الدراسي الثاني";
//   };

//   const handleDelete = async (scheduleId: string) => {
//     if (!confirm("هل أنت متأكد من حذف هذا الجدول؟")) return;

//     setDeletingId(scheduleId);
//     try {
//       await deleteSchedule({ scheduleId: scheduleId as any });
//     } catch (error) {
//       console.error("Error deleting schedule:", error);
//       alert("حدث خطأ أثناء حذف الجدول");
//     } finally {
//       setDeletingId(null);
//     }
//   };

//   const daysMap: Record<string, string> = {
//     saturday: "السبت",
//     sunday: "الأحد",
//     monday: "الإثنين",
//     tuesday: "الثلاثاء",
//     wednesday: "الأربعاء",
//     thursday: "الخميس",
//     friday: "الجمعة",
//   };

//   // ترتيب الأيام
//   const orderedDays = ["saturday", "sunday", "monday", "tuesday", "wednesday", "thursday"];

//   return (
//     <div className="min-h-screen bg-[#f7fafa]">
//       {/* Top bar */}
//       <header className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between sticky top-0 z-10">
//         <h1 className="text-xl font-semibold text-[#001f24]">جدول الحصص</h1>
//         <div className="flex items-center gap-3">
//           <Button
//             onClick={() => setIsCreateModalOpen(true)}
//             className="gap-2 bg-[#001f24] hover:bg-[#03363d] text-white"
//           >
//             <Plus className="h-4 w-4" />
//             إنشاء جدول
//           </Button>
//         </div>
//       </header>

//       <div className="p-8 max-w-7xl mx-auto space-y-6">
//         {/* Page title */}
//         <div>
//           <h2 className="text-2xl font-bold text-[#001f24]">إدارة جدول الحصص</h2>
//           <p className="text-gray-500 mt-1 text-sm">
//             إنشاء وإدارة الجداول الدراسية الأسبوعية للفصول
//           </p>
//         </div>

//         {/* Filters */}
//         <div className="bg-white rounded-xl border border-gray-100 p-4">
//           <div className="flex flex-col sm:flex-row gap-4">
//             <div className="flex items-center gap-2">
//               <Filter className="h-4 w-4 text-gray-400" />
//               <span className="text-sm text-gray-600">تصفية:</span>
//             </div>
//             <div className="flex flex-wrap gap-3">
//               <select
//                 value={selectedYear}
//                 onChange={(e) => setSelectedYear(e.target.value)}
//                 className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#03363d]/20 bg-white"
//               >
//                 <option value="2025-2026">2025-2026</option>
//                 <option value="2026-2027">2026-2027</option>
//                 <option value="2027-2028">2027-2028</option>
//               </select>
//               <select
//                 value={selectedTerm}
//                 onChange={(e) => setSelectedTerm(e.target.value as "first" | "second")}
//                 className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#03363d]/20 bg-white"
//               >
//                 <option value="first">الفصل الدراسي الأول</option>
//                 <option value="second">الفصل الدراسي الثاني</option>
//               </select>
//             </div>
//           </div>
//         </div>

//         {/* Schedules Grid - عرض واحد فقط */}
//         <div>
//           {schedules === undefined ? (
//             <div className="flex justify-center py-12">
//               <Loader2 className="h-8 w-8 animate-spin text-[#001f24]" />
//             </div>
//           ) : schedules.length === 0 ? (
//             <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
//               <Calendar className="h-12 w-12 mx-auto mb-3 text-gray-300" />
//               <p className="text-gray-500">لا توجد جداول دراسية للعام {selectedYear} - {getTermName(selectedTerm)}</p>
//               <Button
//                 variant="outline"
//                 className="mt-3"
//                 onClick={() => setIsCreateModalOpen(true)}
//               >
//                 <Plus className="h-4 w-4 ml-2" />
//                 إنشاء جدول جديد
//               </Button>
//             </div>
//           ) : (
//             // عرض الجدول كاملاً (جميع الحصص) في شكل grid واحد
//             <div className="space-y-6">
//               {schedules.map((schedule: any) => (
//                 <div key={schedule._id} className="bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
//                   {/* Schedule Header */}
//                   <div className="bg-linear-to-r from-[#001f24] to-[#03363d] px-6 py-4 text-white">
//                     <div className="flex items-center justify-between">
//                       <div>
//                         <h3 className="font-semibold text-lg">{schedule.className}</h3>
//                         <p className="text-sm text-[#a3ced6]">{getTermName(schedule.term)} - {schedule.academicYear}</p>
//                       </div>
//                       <div className="flex gap-2">
//                         <Link href={`/admin/schedules/${schedule._id}`}>
//                           <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
//                             <Edit className="h-4 w-4" />
//                           </button>
//                         </Link>
//                         <button
//                           onClick={() => handleDelete(schedule._id)}
//                           disabled={deletingId === schedule._id}
//                           className="p-2 hover:bg-white/10 rounded-lg transition-colors"
//                         >
//                           {deletingId === schedule._id ? (
//                             <Loader2 className="h-4 w-4 animate-spin" />
//                           ) : (
//                             <Trash2 className="h-4 w-4" />
//                           )}
//                         </button>
//                       </div>
//                     </div>
//                   </div>

//                   {/* Full Schedule Table */}
//                   <div className="p-4 overflow-x-auto">
//                     <table className="w-full border-collapse text-sm min-w-200">
//                       <thead>
//                         <tr className="bg-[#f7fafa] border-b-2 border-[#c0c8c9]">
//                           <th className="p-3 text-center text-sm font-semibold text-[#001f24] w-24">الحصة / اليوم</th>
//                           {orderedDays.map(day => (
//                             <th key={day} className="p-3 text-center text-sm font-semibold text-[#001f24] min-w-25">
//                               {daysMap[day]}
//                             </th>
//                           ))}
//                         </tr>
//                       </thead>
//                       <tbody>
//                         {(() => {
//                           // الحصول على عدد الحصص (أكبر عدد من الأيام)
//                           const maxPeriods = Math.max(
//                             ...schedule.weekDays.map((day: any) => day.periods?.length || 0)
//                           );

//                           return Array.from({ length: maxPeriods }, (_, periodIdx) => {
//                             const periodNumber = periodIdx + 1;
//                             // العثور على وقت الحصة من أول يوم
//                             const firstDayPeriod = schedule.weekDays.find((d: any) => d.periods?.[periodIdx])?.periods[periodIdx];

//                             return (
//                               <tr key={periodNumber} className="border-b border-gray-100 hover:bg-gray-50">
//                                 <td className="p-3 font-medium text-[#001f24] bg-gray-50 text-center">
//                                   <div className="flex flex-col">
//                                     <span>الحصة {periodNumber}</span>
//                                     {firstDayPeriod && (
//                                       <span className="text-xs text-gray-500">
//                                         {firstDayPeriod.startTime} - {firstDayPeriod.endTime}
//                                       </span>
//                                     )}
//                                   </div>
//                                 </td>
//                                 {orderedDays.map(day => {
//                                   const dayData = schedule.weekDays.find((d: any) => d.day === day);
//                                   const period = dayData?.periods?.[periodIdx];

//                                   if (!period) {
//                                     return <td key={day} className="p-3 text-center text-gray-300">—</td>;
//                                   }

//                                   return (
//                                     <td key={day} className="p-3 text-center align-top">
//                                       {period.isBreak ? (
//                                         <div className="flex flex-col items-center gap-1">
//                                           <span className="text-gray-400">🍽️</span>
//                                           <span className="text-xs text-gray-400">استراحة</span>
//                                         </div>
//                                       ) : (
//                                         <div className="flex flex-col items-center gap-1">
//                                           <span className="font-medium text-[#001f24]">{period.subject || "—"}</span>
//                                           {period.teacherName && (
//                                             <span className="text-xs text-gray-500">{period.teacherName}</span>
//                                           )}
//                                           {period.room && (
//                                             <span className="text-xs text-gray-400">📍 {period.room}</span>
//                                           )}
//                                         </div>
//                                       )}
//                                     </td>
//                                   );
//                                 })}
//                               </tr>
//                             );
//                           });
//                         })()}
//                       </tbody>
//                     </table>
//                   </div>

//                   {/* Stats Footer */}
//                   <div className="px-4 py-3 border-t border-gray-100 bg-[#f7fafa] flex items-center justify-between text-xs text-gray-500">
//                     <div className="flex items-center gap-3">
//                       <div className="flex items-center gap-1">
//                         <BookOpen className="h-3 w-3" />
//                         <span>{schedule.weekDays.reduce((sum: number, d: any) => sum + d.periods.filter((p: any) => !p.isBreak).length, 0)} حصة دراسية</span>
//                       </div>
//                       <div className="flex items-center gap-1">
//                         <Users className="h-3 w-3" />
//                         <span>{schedule.weekDays.length} أيام دراسية</span>
//                       </div>
//                     </div>
//                     <div className="flex items-center gap-1">
//                       <Bell className="h-3 w-3" />
//                       <span>تذكير نشط</span>
//                     </div>
//                   </div>
//                 </div>
//               ))}
//             </div>
//           )}
//         </div>
//       </div>

//       {/* Create Schedule Modal */}
//       <CreateScheduleModal
//         isOpen={isCreateModalOpen}
//         onClose={() => setIsCreateModalOpen(false)}
//         classes={classes || []}
//       />
//     </div>
//   );
// }

export default function AdminSchedulesPage() {
  return (
    <div>
      <h1>إدارة الجداول</h1>
      {/* محتوى الصفحة */}
    </div>
  );
}