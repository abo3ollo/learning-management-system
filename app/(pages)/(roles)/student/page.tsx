"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import Link from "next/link";
import { useEffect } from "react";
import {
  Bell,
  Calendar,
  CheckCircle,
  Clock,
  BookOpen,
  FileText,
  Users,
  MessageSquare,
  FolderOpen,
  Award,
  Wallet,
  Megaphone,
  User,
  Settings,
  TrendingUp,
  Star,
  PlayCircle,
  FileCheck,
  GraduationCap,
} from "lucide-react";
import { MdOutlinePermMedia } from "react-icons/md";
import { SiGoogleclassroom } from "react-icons/si";
import { FaChalkboardTeacher } from "react-icons/fa";
import { RiParentFill } from "react-icons/ri";

export default function StudentDashboard() {
  const { isLoaded, isSignedIn } = useAuth();
  const router = useRouter();
  const currentUser = useQuery(api.user.auth.getCurrentUser);

  useEffect(() => {
    if (!isLoaded || !isSignedIn) {
      router.push("/");
      return;
    }

    if (currentUser !== undefined && currentUser?.role !== "student") {
      router.push("/dashboard");
    }
  }, [isLoaded, isSignedIn, currentUser, router]);

  if (!isLoaded || !currentUser || currentUser.role !== "student") {
    return (
      <div className="flex items-center justify-center h-full bg-[#f7fafa]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#001f24]"></div>
      </div>
    );
  }

  // بيانات وهمية (سيتم جلبها من Convex لاحقاً)
  const stats = {
    enrolledCourses: 4,
    inProgress: 2,
    completed: 1,
    assignments: 3,
    attendance: 92,
    walletBalance: 150.00,
    notifications: 5,
  };

  const recentActivities = [
    { title: "Quiz #4 - Biology", time: "منذ 11 دقيقة", date: "الخميس، 11 يونيو 2026، 10:54 م", type: "quiz" },
    { title: "Assignment: History", time: "منذ ساعتين", date: "الخميس، 11 يونيو 2026، 8:30 م", type: "assignment" },
    { title: "New Course Available", time: "منذ يوم", date: "الأربعاء، 10 يونيو 2026، 9:00 ص", type: "course" },
  ];

  const quickActions = [
    { label: "حذف", icon: "🗑️", href: "/student/delete" },
    { label: "مسائل", icon: "📝", href: "/student/problems" },
    { label: "المالية", icon: "💰", href: "/student/finance" },
    { label: "محفظة", icon: "👛", href: "/student/wallet" },
    { label: "إرسال", icon: "📤", href: "/student/send" },
  ];

  const menuItems = [
    { label: "اختياراتي", icon: "📚", href: "/student/my-courses" },
    { label: "فصلي", icon: "✍️", href: "/student/my-classes" },
    { label: "واجبائي", icon: "📋", href: "/student/assignments" },
    { label: "حضوري", icon: "✅", href: "/student/attendance" },
    { label: "ChatBox", icon: "💬", href: "/student/chat" },
    { label: "وسائطي", icon: "🎬", href: "/student/media" },
    { label: "شهاداتي", icon: "🏆", href: "/student/certificates" },
    { label: "المنجر", icon: "📊", href: "/student/dashboard" },
    { label: "الإعلانات", icon: "📢", href: "/student/announcements" },
    { label: "محفظتي", icon: "👛", href: "/student/wallet" },
    { label: "إشعاراتي", icon: "🔔", href: "/student/notifications" },
    { label: "ملفي الشخصي", icon: "👤", href: "/student/profile" },
  ];

  return (
    <div className="min-h-full bg-[#f7fafa] p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-[#001f24]">لوحة التحكم</h1>
            <p className="text-sm text-gray-500 mt-0.5">مرحباً بك، {currentUser.name}</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="relative p-2 bg-white rounded-xl border border-[#c0c8c9] hover:border-[#1a7a8a] transition-colors">
              <Bell className="h-5 w-5 text-gray-600" />
            </button>
            <Link href="/student/profile">
              <div className="w-10 h-10 rounded-xl bg-[#e0f5f7] flex items-center justify-center cursor-pointer ">
                <span className="font-bold text-[#1a7a8a] ">
                  {currentUser.name?.charAt(0)?.toUpperCase() || "S"}
                </span>
              </div>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Stats & Quick Actions */}
          <div className="lg:col-span-2 space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl p-4 border border-[#c0c8c9] hover:shadow-sm transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-[#001f24]">{stats.enrolledCourses}</p>
                    <p className="text-xs text-gray-500">المقررات المسجلة</p>
                  </div>
                  <BookOpen className="h-8 w-8 text-blue-400" />
                </div>
              </div>
              <div className="bg-white rounded-xl p-4 border border-[#c0c8c9] hover:shadow-sm transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-[#001f24]">{stats.inProgress}</p>
                    <p className="text-xs text-gray-500">قيد التقدم</p>
                  </div>
                  <Clock className="h-8 w-8 text-amber-400" />
                </div>
              </div>
              <div className="bg-white rounded-xl p-4 border border-[#c0c8c9] hover:shadow-sm transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-[#001f24]">{stats.completed}</p>
                    <p className="text-xs text-gray-500">مكتملة</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-400" />
                </div>
              </div>
              <div className="bg-white rounded-xl p-4 border border-[#c0c8c9] hover:shadow-sm transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-[#001f24]">{stats.assignments}</p>
                    <p className="text-xs text-gray-500">الواجبات</p>
                  </div>
                  <FileText className="h-8 w-8 text-purple-400" />
                </div>
              </div>
            </div>

            {/* Menu Grid - من الصورة */}
            <div className="bg-white rounded-xl border border-[#c0c8c9] p-4">
              <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                {menuItems.map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    className="flex flex-col items-center gap-1 p-3 rounded-xl hover:bg-[#e0f5f7] transition-colors group"
                  >
                    <span className="text-2xl group-hover:scale-110 transition-transform">{item.icon}</span>
                    <span className="text-xs text-gray-600 text-center group-hover:text-[#001f24] leading-tight">
                      {item.label}
                    </span>
                  </Link>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl border border-[#c0c8c9] p-4">
              <h3 className="text-sm font-semibold text-[#001f24] mb-3">إجراءات سريعة</h3>
              <div className="flex flex-wrap gap-2">
                {quickActions.map((action) => (
                  <Link
                    key={action.label}
                    href={action.href}
                    className="flex items-center gap-2 px-4 py-2 bg-[#f7fafa] rounded-lg hover:bg-[#e0f5f7] transition-colors text-sm text-gray-700 hover:text-[#001f24]"
                  >
                    <span>{action.icon}</span>
                    {action.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - Recent Activity & Notifications */}
          <div className="space-y-6">
            {/* Notifications */}
            <div className="bg-white rounded-xl border border-[#c0c8c9] p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-[#001f24]">أحدث الإشعارات</h3>
                <span className="text-xs text-[#1a7a8a] hover:underline cursor-pointer">عرض الكل</span>
              </div>

              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 bg-[#f7fafa] rounded-lg">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                    <Bell className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-[#001f24]">معلومات النظام</p>
                    <p className="text-xs text-gray-500">أدوات - طلب</p>
                    <p className="text-xs text-gray-400 mt-1">منذ 11 دقيقة • الخميس، 11 يونيو 2026، 10:54 م</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-[#f7fafa] rounded-lg">
                  <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                    <FileCheck className="h-4 w-4 text-amber-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-[#001f24]">نصوصت الدرجات</p>
                    <p className="text-xs text-gray-500">0% - واجهات مغلقة</p>
                    <p className="text-xs text-gray-400 mt-1">اختيارات مكملة • اختيارات قادمة</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-[#f7fafa] rounded-lg">
                  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                    <Wallet className="h-4 w-4 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-[#001f24]">رصيد المحفظة</p>
                    <p className="text-xs text-gray-500">0.0% - نصوصت الدرجات</p>
                    <p className="text-xs text-gray-400 mt-1">اختيارات قادمة • رصيد المحفظة</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-xl border border-[#c0c8c9] p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-[#001f24]">النشاط الأخير</h3>
                <span className="text-xs text-[#1a7a8a] hover:underline cursor-pointer">عرض الكل</span>
              </div>

              <div className="space-y-3">
                {recentActivities.map((activity, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 border-b border-[#c0c8c9] last:border-0">
                    <div className="w-8 h-8 rounded-full bg-[#e0f5f7] flex items-center justify-center shrink-0">
                      {activity.type === "quiz" && <FileText className="h-4 w-4 text-[#1a7a8a]" />}
                      {activity.type === "assignment" && <FileCheck className="h-4 w-4 text-[#1a7a8a]" />}
                      {activity.type === "course" && <BookOpen className="h-4 w-4 text-[#1a7a8a]" />}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-[#001f24]">{activity.title}</p>
                      <p className="text-xs text-gray-500">{activity.time}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{activity.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>


            {/* Attendance */}
            <div className="bg-white rounded-xl border border-[#c0c8c9] p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">نسبة الحضور</p>
                  <p className="text-2xl font-bold text-[#001f24]">{stats.attendance}%</p>
                </div>
                <div className="w-16 h-16 rounded-full border-4 border-[#1a7a8a] flex items-center justify-center">
                  <span className="text-lg font-bold text-[#1a7a8a]">{stats.attendance}%</span>
                </div>
              </div>
              <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-[#1a7a8a] h-2 rounded-full transition-all"
                  style={{ width: `${stats.attendance}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}