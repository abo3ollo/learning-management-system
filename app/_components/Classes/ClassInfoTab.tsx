// app/_components/Classes/ClassInfoTab.tsx
"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  School,
  Users,
  GraduationCap,
  Calendar,
  MapPin,
  User,
  BookOpen,
  Clock,
  CheckCircle,
  XCircle,
  Building2,
  Mail,
  Phone,
  CalendarDays,
  UserCheck,
  UserPlus,
  Loader2,
} from "lucide-react";

interface ClassInfoTabProps {
  classId: string;
}

export function ClassInfoTab({ classId }: ClassInfoTabProps) {
  const classData = useQuery(api.classes.classes.getClassById, {
    classId: classId as any,
  });

  const classSubjectsStats = useQuery(api.classes.classSubjects.getClassSubjectsStats, {
    classId: classId as any,
  });

  // جلب بيانات المشرف بشكل منفصل (إذا كان موجود)
//   const supervisorData = useQuery(
//     api.user.users.getUserById,
//     classData?.supervisorId ? { userId: classData.supervisorId as any } : "skip"
//   );

  if (!classData) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-[#1a7a8a]" />
      </div>
    );
  }

  const infoCards = [
    {
      label: "اسم الفصل",
      value: classData.classNameAr,
      icon: School,
      color: "bg-blue-50 text-blue-600",
    },
    {
      label: "الكود",
      value: classData.classCode,
      icon: BookOpen,
      color: "bg-purple-50 text-purple-600",
    },
    {
      label: "الصف الدراسي",
      value: `${classData.grade} - شعبة ${classData.section}`,
      icon: GraduationCap,
      color: "bg-green-50 text-green-600",
    },
    {
      label: "مشرف الفصل",
      value: classData.supervisorName || "غير محدد",
      icon: User,
      color: "bg-amber-50 text-amber-600",
    },
    {
      label: "الموقع",
      value: classData.location || "غير محدد",
      icon: MapPin,
      color: "bg-red-50 text-red-600",
    },
    {
      label: "العام الدراسي",
      value: classData.academicYear,
      icon: Calendar,
      color: "bg-indigo-50 text-indigo-600",
    },
  ];

  const stats = [
    {
      label: "الطلاب",
      value: classData.currentStudents || 0,
      max: classData.maxStudents,
      icon: Users,
      color: "text-blue-500",
      bg: "bg-blue-50",
    },
    {
      label: "المعلمون",
      value: classData.teachers?.length || 0,
      icon: UserCheck,
      color: "text-purple-500",
      bg: "bg-purple-50",
    },
    {
      label: "المواد",
      value: classSubjectsStats?.total || 0,
      icon: BookOpen,
      color: "text-green-500",
      bg: "bg-green-50",
    },
    {
      label: "الحالة",
      value: classData.status === "active" ? "نشط" : "غير نشط",
      icon: classData.status === "active" ? CheckCircle : XCircle,
      color: classData.status === "active" ? "text-green-500" : "text-gray-500",
      bg: classData.status === "active" ? "bg-green-50" : "bg-gray-50",
    },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="bg-white rounded-xl p-4 border border-[#c0c8c9] hover:shadow-sm transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-[#001f24]">
                    {stat.value}
                    {stat.max && ` / ${stat.max}`}
                  </p>
                  <p className="text-xs text-gray-500">{stat.label}</p>
                </div>
                <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center`}>
                  <Icon className={`h-5 w-5 ${stat.color}`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Info Cards Grid */}
      <div>
        <h3 className="text-sm font-semibold text-[#001f24] mb-4">معلومات الفصل</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {infoCards.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.label}
                className="bg-[#f7fafa] rounded-xl p-4 border border-[#c0c8c9]"
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${card.color} bg-opacity-10`}>
                    <Icon className={`h-5 w-5 ${card.color}`} />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">{card.label}</p>
                    <p className="font-medium text-[#001f24] text-sm mt-0.5">
                      {card.value}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Additional Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        

        <div className="bg-[#f7fafa] rounded-xl p-4 border border-[#c0c8c9]">
          <h4 className="text-sm font-semibold text-[#001f24] mb-3 flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-[#1a7a8a]" />
            معلومات إضافية
          </h4>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">تاريخ الإنشاء</span>
              <span className="text-[#001f24]">
                {new Date(classData.createdAt).toLocaleDateString("ar-EG")}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">آخر تحديث</span>
              <span className="text-[#001f24]">
                {classData.updatedAt
                  ? new Date(classData.updatedAt).toLocaleDateString("ar-EG")
                  : "—"}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">عدد الطلاب</span>
              <span className="text-[#001f24] font-semibold">
                {classData.currentStudents || 0} / {classData.maxStudents}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">نسبة الإشغال</span>
              <span className="text-[#001f24] font-semibold">
                {classData.maxStudents
                  ? Math.round((classData.currentStudents / classData.maxStudents) * 100)
                  : 0}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}