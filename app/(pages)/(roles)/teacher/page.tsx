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
  Bell,
  GraduationCap,
  FolderOpen,
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

// ✅ دالة مساعدة لتنسيق الوقت
const getTimeAgo = (timestamp: number) => {
  const now = Date.now();
  const diff = now - timestamp;
  
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) {
    return `منذ ${days} يوم${days > 1 ? 'ين' : ''}`;
  }
  if (hours > 0) {
    return `منذ ${hours} ساعة${hours > 1 ? 'ين' : ''}`;
  }
  if (minutes > 0) {
    return `منذ ${minutes} دقيقة${minutes > 1 ? 'ين' : ''}`;
  }
  return "الآن";
};

export default function TeacherDashboardPage() {
  // ✅ جلب المستخدم الحالي
  const teacher = useQuery(api.user.auth.getCurrentUser);
  
  // ✅ جلب مجموعات المعلم
  const teacherGroups = useQuery(
    api.groups.groups.getTeacherGroups,
    {}
  );

  // ✅ جلب الواجبات
  const assignments = useQuery(
    api.assignments.assignments.getTeacherAssignments,
    {}
  );

  // ✅ جلب الامتحانات
  const exams = useQuery(
    api.exams.exams.getTeacherExams,
    {}
  );

  // ✅ جلب الطلاب (للمعلم)
  const students = useQuery(
    api.user.students.getStudents,
    {}
  );

  // ✅ جلب الإشعارات
  const notifications = useQuery(
    api.notifications.notifications.getMyNotifications,
    { unreadOnly: false }
  );

  // ✅ جلب عدد الإشعارات غير المقروءة
  const unreadCount = useQuery(
    api.notifications.notifications.getUnreadCount,
    {}
  );

  // ── حساب الإحصائيات ─────────────────────────────────────────────
  const groupList = teacherGroups ?? [];
  const assignmentList = assignments ?? [];
  const examList = exams ?? [];
  const studentList = students ?? [];
  const notificationList = notifications ?? [];

  // ✅ حساب إجمالي الطلاب (من المجموعات)
  const totalStudents = groupList.reduce(
    (acc: number, group: any) => acc + (group.students?.length || 0),
    0
  );

  // ✅ حساب الواجبات النشطة والمتأخرة
  const now = Date.now();
  const activeAssignments = assignmentList.filter(
    (a: any) => a.status === "published" && a.dueDate > now
  );
  const lateAssignments = assignmentList.filter(
    (a: any) => a.status === "published" && a.dueDate < now
  );
  const pendingAssignments = assignmentList.filter(
    (a: any) => a.status === "draft"
  );

  // ✅ حساب الامتحانات القادمة
  const upcomingExamsList = examList.filter(
    (e: any) => e.status === "published" && e.date > now
  );

  // ✅ حساب الإشعارات غير المقروءة
  const unreadNotifications = notificationList.filter(
    (n: any) => n.status === "sent"
  );

  // ── إحصائيات البطاقات ──────────────────────────────────────────
  const statsCards = [
    {
      label: "الطلاب",
      value: totalStudents,
      icon: Users,
      color: "bg-blue-50 text-blue-500",
      trend: `+${groupList.length} مجموعات`,
      trendUp: true,
    },
    {
      label: "المجموعات",
      value: groupList.length,
      icon: FolderOpen,
      color: "bg-green-50 text-green-500",
      trend: groupList.length > 0 ? "نشطة" : "لا توجد",
      trendUp: true,
    },
    {
      label: "الواجبات",
      value: assignmentList.length,
      icon: FileText,
      color: "bg-amber-50 text-amber-500",
      trend: `${activeAssignments.length} نشطة`,
      trendUp: true,
    },
    {
      label: "الإشعارات",
      value: notificationList.length,
      icon: Bell,
      color: "bg-purple-50 text-purple-500",
      trend: `${unreadNotifications.length} غير مقروءة`,
      trendUp: unreadNotifications.length > 0,
    },
  ];

  // ── Quick Stats ──────────────────────────────────────────────────
  const quickStats = [
    {
      label: "واجبات قيد التصحيح",
      value: pendingAssignments.length,
      color: "text-amber-500",
      icon: Clock,
      bgColor: "bg-amber-50",
    },
    {
      label: "امتحانات قادمة",
      value: upcomingExamsList.length,
      color: "text-blue-500",
      icon: Calendar,
      bgColor: "bg-blue-50",
    },
    {
      label: "مجموعات نشطة",
      value: groupList.filter((g: any) => g.status === "active").length,
      color: "text-green-500",
      icon: CheckCircle,
      bgColor: "bg-green-50",
    },
    {
      label: "إجمالي الطلاب",
      value: totalStudents,
      color: "text-[#1a7a8a]",
      icon: GraduationCap,
      bgColor: "bg-[#e0f5f7]",
    },
  ];

  // ── عرض البيانات ─────────────────────────────────────────────────
  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#001f24]">
            مساء الخير، {teacher?.name || "معلم"}! 👋
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            إليك نظرة عامة على أداء المجموعات والواجبات
          </p>
        </div>
        <div className="flex items-center gap-3">
          
            <div className="relative p-2 bg-white rounded-xl border border-[#c0c8c9] hover:border-[#1a7a8a] transition-colors">
              <Bell className="h-5 w-5 text-gray-600" />
              {unreadCount && unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </div>
          
        </div>
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
        <Link href="/teacher/assignments">
          <Card className="hover:shadow-md transition-shadow cursor-pointer border-2 border-transparent hover:border-[#1a7a8a]">
            <CardContent className="p-4 text-center">
              <FileText className="h-8 w-8 mx-auto text-[#1a7a8a] mb-2" />
              <p className="text-sm font-medium">إنشاء واجب</p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/teacher/exams">
          <Card className="hover:shadow-md transition-shadow cursor-pointer border-2 border-transparent hover:border-[#1a7a8a]">
            <CardContent className="p-4 text-center">
              <ClipboardList className="h-8 w-8 mx-auto text-[#1a7a8a] mb-2" />
              <p className="text-sm font-medium">إنشاء امتحان</p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/teacher/groups">
          <Card className="hover:shadow-md transition-shadow cursor-pointer border-2 border-transparent hover:border-[#1a7a8a]">
            <CardContent className="p-4 text-center">
              <FolderOpen className="h-8 w-8 mx-auto text-[#1a7a8a] mb-2" />
              <p className="text-sm font-medium">إدارة المجموعات</p>
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
            {assignmentList.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <FileText className="h-10 w-10 mx-auto text-gray-300 mb-2" />
                <p className="text-sm">لا توجد واجبات</p>
              </div>
            ) : (
              assignmentList.slice(0, 5).map((assignment: any) => (
                <div
                  key={assignment._id}
                  className="flex items-center justify-between p-3 bg-[#f7fafa] rounded-lg hover:bg-[#e0f5f7] transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#001f24] truncate">
                      {assignment.title}
                    </p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-gray-500">{assignment.subject || "غير محدد"}</span>
                      <span className="text-xs text-gray-400">•</span>
                      <span className="text-xs text-gray-500">
                        {assignment.submissions?.length || 0} تسليم
                      </span>
                      <Badge
                        variant="outline"
                        className={`text-xs ${
                          assignment.status === "published" && assignment.dueDate > now
                            ? "border-green-500 text-green-600"
                            : assignment.status === "published" && assignment.dueDate < now
                            ? "border-red-500 text-red-600"
                            : "border-amber-500 text-amber-600"
                        }`}
                      >
                        {assignment.status === "published" && assignment.dueDate > now
                          ? "نشط"
                          : assignment.status === "published" && assignment.dueDate < now
                          ? "متأخر"
                          : "مسودة"}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">
                      {format(new Date(assignment.dueDate), "dd/MM", { locale: ar })}
                    </span>
                    <Link href="/teacher/assignments/">
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <Eye className="h-4 w-4 text-gray-400 hover:text-[#1a7a8a]" />
                      </Button>
                    </Link>
                  </div>
                </div>
              ))
            )}
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
            {upcomingExamsList.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <ClipboardList className="h-10 w-10 mx-auto text-gray-300 mb-2" />
                <p className="text-sm">لا توجد امتحانات قادمة</p>
              </div>
            ) : (
              upcomingExamsList.slice(0, 5).map((exam: any) => (
                <div
                  key={exam._id}
                  className="flex items-center justify-between p-3 bg-[#f7fafa] rounded-lg hover:bg-[#e0f5f7] transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#001f24] truncate">
                      {exam.title}
                    </p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-gray-500">{exam.subject || "غير محدد"}</span>
                      <span className="text-xs text-gray-400">•</span>
                      <span className="text-xs text-gray-500">{exam.duration || 0} دقيقة</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-amber-500 text-white text-xs">
                      {format(new Date(exam.date), "dd/MM", { locale: ar })}
                    </Badge>
                    <Link href={`/teacher/exams/preview/${exam._id}`}>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <Eye className="h-4 w-4 text-gray-400 hover:text-[#1a7a8a]" />
                      </Button>
                    </Link>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats - Dynamic */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {quickStats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className={`${stat.bgColor} rounded-lg border border-[#c0c8c9] p-4`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500">{stat.label}</p>
                  <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                </div>
                <Icon className={`h-8 w-8 ${stat.color}`} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Notifications */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Bell className="h-5 w-5 text-[#1a7a8a]" />
            آخر الإشعارات
            {unreadCount && unreadCount > 0 && (
              <Badge className="bg-red-500 text-white">
                {unreadCount} جديد
              </Badge>
            )}
          </CardTitle>
          <Link href="/teacher/notifications">
            <Button variant="ghost" size="sm" className="gap-1">
              عرض الكل
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent className="space-y-3">
          {notificationList.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Bell className="h-10 w-10 mx-auto text-gray-300 mb-2" />
              <p className="text-sm">لا توجد إشعارات</p>
            </div>
          ) : (
            notificationList.slice(0, 5).map((notification: any) => (
              <div
                key={notification._id}
                className={`flex items-center justify-between p-3 rounded-lg transition-colors ${
                  notification.status === "sent"
                    ? "bg-[#e0f5f7] border border-[#1a7a8a]/20"
                    : "bg-[#f7fafa]"
                }`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-[#001f24] truncate">
                      {notification.title}
                    </p>
                    {notification.status === "sent" && (
                      <span className="w-1.5 h-1.5 bg-red-500 rounded-full inline-block animate-pulse" />
                    )}
                    {notification.priority === "urgent" && (
                      <Badge className="bg-red-500 text-white text-[8px] px-1 py-0">عاجل</Badge>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 truncate">
                    {notification.message}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] text-gray-400 whitespace-nowrap">
                    {getTimeAgo(notification.createdAt)}
                  </span>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}