"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { 
  Users, 
  BookOpen, 
  GraduationCap, 
  FileQuestion,
  Circle,
  Library,
  TrendingUp,
  UserPlus,
  Settings
} from "lucide-react";

export default function AdminDashboard() {
  const currentUser = useQuery(api.user.auth.getCurrentUser);
  const pendingUsers = useQuery(api.user.admin.getPendingRegistrations);
  
  // Don't render until we have data
  if (!currentUser) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const stats = [
    { title: "الطلاب", value: "27", change: "+12%", icon: GraduationCap, color: "bg-blue-500", href: "/admin/students" },
    { title: "المعلمون", value: "2", change: "+0%", icon: Users, color: "bg-green-500", href: "/admin/teachers" },
    { title: "المواد", value: "10", change: "+5%", icon: BookOpen, color: "bg-purple-500", href: "/admin/courses" },
    { title: "المطالبات", value: "7", change: "+3", icon: FileQuestion, color: "bg-orange-500", href: "/admin/exams" },
    { title: "المراكز", value: "1", change: "+0%", icon: Circle, color: "bg-red-500", href: "/admin/circles" },
    { title: "المعاصرون", value: "2", change: "+0%", icon: Users, color: "bg-teal-500", href: "/admin/teachers" },
    { title: "المعدلات", value: "0.00", change: "-0%", icon: TrendingUp, color: "bg-yellow-500", href: "/admin/analytics" },
    { title: "بنك الأسئلة", value: "0", change: "+0", icon: FileQuestion, color: "bg-indigo-500", href: "/admin/exams" },
  ];

  const quickActions = [
    { title: "إضافة طالب", icon: UserPlus, href: "/admin/students/new", color: "bg-blue-100 text-blue-700" },
    { title: "مصرف الوسائل", icon: Library, href: "/admin/content", color: "bg-green-100 text-green-700" },
    { title: "الإعدادات", icon: Settings, href: "/admin/settings", color: "bg-gray-100 text-gray-700" },
    { title: "خطة الدروس", icon: BookOpen, href: "/admin/plans", color: "bg-purple-100 text-purple-700" },
  ];

  const pendingCount = pendingUsers?.length || 0;

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-linear-to-r from-indigo-600 to-purple-600 rounded-xl p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">مساء الخير! 👋</h2>
        <p className="text-indigo-100">نظرة عامة على منتجاتك</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link
              key={stat.title}
              href={stat.href}
              className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow border border-gray-100"
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`p-2 rounded-lg ${stat.color} bg-opacity-10`}>
                  <Icon className={`h-5 w-5 ${stat.color.replace('bg-', 'text-')}`} />
                </div>
                <span className={`text-xs font-medium ${
                  stat.change.startsWith('+') ? 'text-green-600' : 'text-red-600'
                }`}>
                  {stat.change}
                </span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-sm text-gray-500 mt-1">{stat.title}</p>
            </Link>
          );
        })}
      </div>

      {/* Pending Approvals Alert */}
      {pendingCount > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                <Users className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="font-semibold text-amber-800">
                  {pendingCount} طالب جديد ينتظر الموافقة
                </p>
                <p className="text-sm text-amber-600">قم بمراجعة طلبات التسجيل</p>
              </div>
            </div>
            <Link
              href="/admin/approvals"
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors text-sm font-medium"
            >
              مراجعة الآن
            </Link>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">إجراءات سريعة</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.title}
                href={action.href}
                className={`${action.color} rounded-xl p-4 text-center hover:opacity-80 transition-opacity`}
              >
                <Icon className="h-6 w-6 mx-auto mb-2" />
                <p className="text-sm font-medium">{action.title}</p>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}