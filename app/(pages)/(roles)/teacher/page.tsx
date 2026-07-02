// app/(pages)/(roles)/teacher/page.tsx (Dashboard)

"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Users,
  BookOpen,
  FileText,
  ClipboardList,
  Calendar,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle,
  AlertCircle,
  BarChart3,
  UserPlus,
  Eye,
  Plus,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

export default function TeacherDashboardPage() {
    const teacher = useQuery(api.user.auth.getCurrentUser);
  
  // جلب الإحصائيات
  const stats = {
    totalStudents: 45,
    totalClasses: 3,
    totalAssignments: 12,
    totalExams: 8,
    pendingAssignments: 5,
    upcomingExams: 3,
  };

  // واجبات حديثة (تجريبي)
  const recentAssignments = [
    {
      id: "1",
      title: "واجب الرياضيات - الفصل الأول",
      subject: "الرياضيات",
      dueDate: Date.now() + 86400000 * 2,
      submissions: 12,
      totalStudents: 15,
      status: "active",
    },
    {
      id: "2",
      title: "تلخيص درس النحو",
      subject: "اللغة العربية",
      dueDate: Date.now() - 86400000,
      submissions: 8,
      totalStudents: 15,
      status: "late",
    },
    {
      id: "3",
      title: "بحث عن الطاقة المتجددة",
      subject: "العلوم",
      dueDate: Date.now() + 86400000 * 5,
      submissions: 3,
      totalStudents: 15,
      status: "pending",
    },
  ];

  // امتحانات قادمة (تجريبي)
  const upcomingExams = [
    {
      id: "1",
      title: "امتحان الرياضيات الشهري",
      subject: "الرياضيات",
      date: Date.now() + 86400000 * 4,
      duration: 60,
      students: 15,
    },
    {
      id: "2",
      title: "امتحان اللغة العربية",
      subject: "اللغة العربية",
      date: Date.now() + 86400000 * 7,
      duration: 45,
      students: 15,
    },
  ];

  const statsCards = [
    {
      label: "الطلاب",
      value: stats.totalStudents,
      icon: Users,
      color: "bg-blue-50 text-blue-500",
      trend: "+8%",
      trendUp: true,
    },
    {
      label: "الفصول",
      value: stats.totalClasses,
      icon: BookOpen,
      color: "bg-green-50 text-green-500",
      trend: "+2",
      trendUp: true,
    },
    {
      label: "الواجبات",
      value: stats.totalAssignments,
      icon: FileText,
      color: "bg-amber-50 text-amber-500",
      trend: "+5",
      trendUp: true,
    },
    {
      label: "امتحانات",
      value: stats.totalExams,
      icon: ClipboardList,
      color: "bg-purple-50 text-purple-500",
      trend: "+3",
      trendUp: true,
    },
  ];

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#001f24]">
            مساء الخير، {teacher?.name}! 👋
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            إليك نظرة عامة على أداء الفصول والواجبات
          </p>
        </div>
        {/* <div className="flex items-center gap-3">
          <Button className="bg-[#001f24] hover:bg-[#03363d] text-white gap-2">
            <Plus className="h-4 w-4" />
            إنشاء واجب جديد
          </Button>
        </div> */}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statsCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-[#001f24]">
                      {stat.value}
                    </p>
                    <p className="text-xs text-gray-500">{stat.label}</p>
                  </div>
                  <div className={`w-10 h-10 rounded-xl ${stat.color} bg-opacity-10 flex items-center justify-center`}>
                    <Icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                </div>
                <div className="flex items-center gap-1 mt-2">
                  {stat.trendUp ? (
                    <TrendingUp className="h-3 w-3 text-green-500" />
                  ) : (
                    <TrendingDown className="h-3 w-3 text-red-500" />
                  )}
                  <span className={`text-xs ${stat.trendUp ? "text-green-500" : "text-red-500"}`}>
                    {stat.trend}
                  </span>
                  <span className="text-xs text-gray-400">من الشهر الماضي</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Link href="/teacher/attendance">
          <Card className="hover:shadow-md transition-shadow cursor-pointer border-2 border-transparent hover:border-[#1a7a8a]">
            <CardContent className="p-4 text-center">
              <CheckCircle className="h-8 w-8 mx-auto text-[#1a7a8a] mb-2" />
              <p className="text-sm font-medium">تسجيل الحضور</p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/teacher/assignments/create">
          <Card className="hover:shadow-md transition-shadow cursor-pointer border-2 border-transparent hover:border-[#1a7a8a]">
            <CardContent className="p-4 text-center">
              <FileText className="h-8 w-8 mx-auto text-[#1a7a8a] mb-2" />
              <p className="text-sm font-medium">إنشاء واجب</p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/teacher/exams/create">
          <Card className="hover:shadow-md transition-shadow cursor-pointer border-2 border-transparent hover:border-[#1a7a8a]">
            <CardContent className="p-4 text-center">
              <ClipboardList className="h-8 w-8 mx-auto text-[#1a7a8a] mb-2" />
              <p className="text-sm font-medium">إنشاء امتحان</p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/teacher/students">
          <Card className="hover:shadow-md transition-shadow cursor-pointer border-2 border-transparent hover:border-[#1a7a8a]">
            <CardContent className="p-4 text-center">
              <UserPlus className="h-8 w-8 mx-auto text-[#1a7a8a] mb-2" />
              <p className="text-sm font-medium">إضافة طالب</p>
            </CardContent>
          </Card>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Assignments */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">آخر الواجبات</CardTitle>
            <Link href="/teacher/assignments">
              <Button variant="ghost" size="sm" className="gap-1">
                عرض الكل
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentAssignments.map((assignment) => (
              <div
                key={assignment.id}
                className="flex items-center justify-between p-3 bg-[#f7fafa] rounded-lg hover:bg-[#e0f5f7] transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#001f24] truncate">
                    {assignment.title}
                  </p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-gray-500">{assignment.subject}</span>
                    <span className="text-xs text-gray-400">•</span>
                    <span className="text-xs text-gray-500">
                      {assignment.submissions}/{assignment.totalStudents} طالب
                    </span>
                    <Badge
                      variant="outline"
                      className={`text-xs ${
                        assignment.status === "active"
                          ? "border-green-500 text-green-600"
                          : assignment.status === "late"
                          ? "border-red-500 text-red-600"
                          : "border-amber-500 text-amber-600"
                      }`}
                    >
                      {assignment.status === "active"
                        ? "نشط"
                        : assignment.status === "late"
                        ? "متأخر"
                        : "قادم"}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">
                    {format(new Date(assignment.dueDate), "dd/MM", { locale: ar })}
                  </span>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <Eye className="h-4 w-4 text-gray-400 hover:text-[#1a7a8a]" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Upcoming Exams */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">الامتحانات القادمة</CardTitle>
            <Link href="/teacher/exams">
              <Button variant="ghost" size="sm" className="gap-1">
                عرض الكل
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {upcomingExams.map((exam) => (
              <div
                key={exam.id}
                className="flex items-center justify-between p-3 bg-[#f7fafa] rounded-lg hover:bg-[#e0f5f7] transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#001f24] truncate">
                    {exam.title}
                  </p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-gray-500">{exam.subject}</span>
                    <span className="text-xs text-gray-400">•</span>
                    <span className="text-xs text-gray-500">{exam.duration} دقيقة</span>
                    <span className="text-xs text-gray-400">•</span>
                    <span className="text-xs text-gray-500">{exam.students} طالب</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-amber-500 text-white text-xs">
                    {format(new Date(exam.date), "dd/MM", { locale: ar })}
                  </Badge>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <Eye className="h-4 w-4 text-gray-400 hover:text-[#1a7a8a]" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-[#c0c8c9] p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">واجبات قيد التصحيح</p>
              <p className="text-2xl font-bold text-amber-500">{stats.pendingAssignments}</p>
            </div>
            <Clock className="h-8 w-8 text-amber-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg border border-[#c0c8c9] p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">امتحانات قادمة</p>
              <p className="text-2xl font-bold text-blue-500">{stats.upcomingExams}</p>
            </div>
            <Calendar className="h-8 w-8 text-blue-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg border border-[#c0c8c9] p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">حضور اليوم</p>
              <p className="text-2xl font-bold text-green-500">92%</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg border border-[#c0c8c9] p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">متوسط الدرجات</p>
              <p className="text-2xl font-bold text-[#1a7a8a]">78%</p>
            </div>
            <BarChart3 className="h-8 w-8 text-[#1a7a8a]" />
          </div>
        </div>
      </div>
    </div>
  );
}