"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  Users,
  BookOpen,
  GraduationCap,
  FileQuestion,
  MapPin,
  Handshake,
  TrendingUp,
  BarChart3,
  UserPlus,
  Library,
  Settings,
  Clock,
  Search,
  Bell,
  HelpCircle,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  MessageSquare,
  Star,
  Award,
  Zap,
  Activity,
  PieChart,
  MoreVertical,
  ChevronRight,
} from "lucide-react";
import { PiStudentBold } from "react-icons/pi";
import { FaChalkboardTeacher, FaHandshake } from "react-icons/fa";
import { LuBaggageClaim } from "react-icons/lu";
import { IoMdTrendingUp } from "react-icons/io";

// بيانات النشاط الأخير
const recentActivities = [
  { user: "أحمد محمد", action: "أكمل واجب", course: "الرياضيات 101", time: "منذ 2 دقيقة", avatar: "أ" },
  { user: "سارة علي", action: "انضمت إلى الفصل", course: "الفيزياء 202", time: "منذ 15 دقيقة", avatar: "س" },
  { user: "محمد حسن", action: "سلم اختبار", course: "مختبر الكيمياء", time: "منذ ساعة", avatar: "م" },
  { user: "نورة عبدالله", action: "شاهدت دورة", course: "الأحياء 303", time: "منذ ساعتين", avatar: "ن" },
];

// الأحداث القادمة
const upcomingEvents = [
  { title: "اختبار رياضيات", time: "اليوم، 3:00 م", color: "bg-blue-500" },
  { title: "مختبر فيزياء", time: "غداً، 10:00 ص", color: "bg-green-500" },
  { title: "اجتماع المعلمين", time: "15 فبراير، 9:00 ص", color: "bg-purple-500" },
];

// أفضل الدورات
const topCourses = [
  { name: "الرياضيات 101", students: 45, progress: 78, color: "#1a7a8a" },
  { name: "الفيزياء 202", students: 32, progress: 65, color: "#2d9cdb" },
  { name: "مختبر الكيمياء", students: 28, progress: 52, color: "#27ae60" },
];

export default function AdminDashboard() {
  const currentUser = useQuery(api.user.auth.getCurrentUser);
  const pendingUsers = useQuery(api.user.admin.getPendingRegistrations);

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#001f24]" />
      </div>
    );
  }

  const stats = [
    { title: "الطلاب", value: "١,٢٤٧", icon: PiStudentBold, trend: "+١٢٪", up: true, iconBg: "bg-blue-50", iconColor: "text-blue-500" },
    { title: "المعلمون", value: "٤٨", icon: FaChalkboardTeacher, trend: "+٨٪", up: true, iconBg: "bg-teal-50", iconColor: "text-teal-500" },
    { title: "الدورات", value: "١٥٦", icon: BookOpen, trend: "+١٥٪", up: true, iconBg: "bg-slate-100", iconColor: "text-slate-500" },
    { title: "الإيرادات", value: "٤٥,٢٠٠ ر.س", icon: TrendingUp, trend: "+٢٣٪", up: true, iconBg: "bg-green-50", iconColor: "text-green-500" },
  ];

  const quickActions = [
    { title: "إضافة طالب", icon: UserPlus, href: "/admin/students", bg: "bg-blue-50", iconBg: "bg-blue-600", labelColor: "text-blue-600" },
    { title: "مركز الوسائط", icon: Library, href: "/admin/content", bg: "bg-green-100", iconBg: "bg-green-600", labelColor: "text-green-600" },
    { title: "إعدادات النظام", icon: Settings, href: "/admin/settings", bg: "bg-slate-100", iconBg: "bg-slate-700", labelColor: "text-slate-700" },
    { title: "الخطة الدراسية", icon: BookOpen, href: "/admin/plans", bg: "bg-purple-100", iconBg: "bg-purple-600", labelColor: "text-purple-600" },
  ];

  const pendingCount = pendingUsers?.length ?? 0;

  return (
    <div className="min-h-screen bg-[#f8fafc]" dir="rtl">
      {/* الشريط العلوي */}
      <header className="bg-linear-to-r from-[#001f24] to-[#03363d] px-8 py-5 flex items-center justify-between sticky top-0 z-10 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center backdrop-blur">
            <GraduationCap className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">لوحة التحكم</h1>
            <p className="text-xs text-[#a3ced6]">مرحباً بعودتك، {currentUser.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="بحث..."
              className="pr-9 pl-4 py-2 text-sm bg-white/10 backdrop-blur border border-white/20 rounded-xl w-56 text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-white/30"
            />
          </div>
          <button className="relative p-2 hover:bg-white/10 rounded-xl transition-all">
            <Bell className="h-5 w-5 text-white/80" />
            {pendingCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                {pendingCount}
              </span>
            )}
          </button>
          <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur flex items-center justify-center text-sm font-semibold text-white border border-white/20">
            {currentUser.name?.charAt(0).toUpperCase()}
          </div>
        </div>
      </header>

      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* تنبيه الطلبات المعلقة */}
        {pendingCount > 0 && (
          <div className="flex items-center justify-between bg-linear-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl px-6 py-4 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center">
                <Users className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">
                  {pendingCount} طلب {pendingCount === 1 ? "تسجيل" : "تسجيلات"} معلق
                </p>
                <p className="text-sm text-gray-500">مراجعة وقبول الحسابات الجديدة</p>
              </div>
            </div>
            <Link
              href="/admin/approvals"
              className="flex items-center gap-2 text-sm font-medium bg-[#001f24] text-white px-5 py-2.5 rounded-xl hover:bg-[#03363d] transition-all shadow-lg hover:shadow-xl"
            >
              مراجعة الآن
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        )}

        {/* بطاقات الإحصائيات */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.title}
                className="group bg-white rounded-2xl p-6 border border-gray-100 hover:border-[#1a7a8a]/20 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              >
                <div className="flex items-start justify-between">
                  <div className={`w-12 h-12 rounded-2xl ${stat.iconBg} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                    <Icon className={`h-6 w-6 ${stat.iconColor}`} />
                  </div>
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full flex items-center gap-1 ${
                    stat.up ? "bg-green-50 text-green-600" : "bg-red-50 text-red-500"
                  }`}>
                    {stat.trend}
                    {stat.up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                  </span>
                </div>
                <p className="text-3xl font-bold text-[#001f24] mt-4">{stat.value}</p>
                <p className="text-sm text-gray-500 mt-1">{stat.title}</p>
              </div>
            );
          })}
        </div>

        {/* قسم المخططات والنشاط */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* المخطط البياني */}
          <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-[#001f24]">نظرة عامة على النشاط</h3>
                <p className="text-sm text-gray-500">النشاط الأسبوعي على المنصة</p>
              </div>
              <button className="text-sm text-[#1a7a8a] hover:underline flex items-center gap-1">
                عرض الكل <ChevronRight className="h-4 w-4" />
              </button>
            </div>
            <div className="h-48 flex items-end gap-3">
              {[
                { day: "السبت", value: 65, color: "#1a7a8a" },
                { day: "الأحد", value: 45, color: "#2d9cdb" },
                { day: "الإثنين", value: 80, color: "#27ae60" },
                { day: "الثلاثاء", value: 55, color: "#f39c12" },
                { day: "الأربعاء", value: 70, color: "#8e44ad" },
                { day: "الخميس", value: 40, color: "#e74c3c" },
                { day: "الجمعة", value: 30, color: "#95a5a6" },
              ].map((item) => (
                <div key={item.day} className="flex-1 flex flex-col items-center gap-2">
                  <div 
                    className="w-full rounded-lg transition-all duration-500 hover:opacity-80"
                    style={{ 
                      height: `${item.value}%`, 
                      background: `linear-linear(to top, ${item.color}dd, ${item.color}44)`,
                      minHeight: '20px'
                    }}
                  />
                  <span className="text-xs text-gray-500">{item.day}</span>
                </div>
              ))}
            </div>
          </div>

          {/* الإجراءات السريعة */}
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <h3 className="text-lg font-semibold text-[#001f24] mb-4">إجراءات سريعة</h3>
            <div className="space-y-3">
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <Link
                    key={action.title}
                    href={action.href}
                    className={`${action.bg} rounded-xl p-4 flex items-center gap-4 hover:shadow-md transition-all group`}
                  >
                    <div className={`w-11 h-11 ${action.iconBg} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm`}>
                      <Icon className="h-5 w-5 text-white" />
                    </div>
                    <p className={`text-sm font-semibold ${action.labelColor}`}>{action.title}</p>
                    <ChevronRight className="h-4 w-4 mr-auto text-gray-400 group-hover:text-gray-600 group-hover:translate-x-1 transition-all" />
                  </Link>
                );
              })}
            </div>
          </div>
        </div>

        {/* القسم السفلي */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* النشاط الأخير */}
          <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-[#001f24]">النشاط الأخير</h3>
                <p className="text-sm text-gray-500">أحدث إجراءات المستخدمين</p>
              </div>
              <button className="text-sm text-[#1a7a8a] hover:underline">عرض الكل</button>
            </div>
            <div className="space-y-4">
              {recentActivities.map((item, idx) => (
                <div key={idx} className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 transition-all">
                  <div className="w-10 h-10 rounded-full bg-linear-to-br from-[#1a7a8a] to-[#2d9cdb] flex items-center justify-center text-white font-semibold text-sm">
                    {item.avatar}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {item.user} <span className="text-gray-500 font-normal">{item.action}</span>
                    </p>
                    <p className="text-xs text-gray-400">{item.course}</p>
                  </div>
                  <span className="text-xs text-gray-400">{item.time}</span>
                </div>
              ))}
            </div>
          </div>

          {/* الأحداث القادمة وأفضل الدورات */}
          <div className="space-y-6">
            {/* الأحداث القادمة */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="h-5 w-5 text-[#1a7a8a]" />
                <h3 className="text-lg font-semibold text-[#001f24]">الأحداث القادمة</h3>
              </div>
              <div className="space-y-3">
                {upcomingEvents.map((event, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
                    <div className={`w-2 h-12 rounded-full ${event.color}`} />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{event.title}</p>
                      <p className="text-xs text-gray-500">{event.time}</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                  </div>
                ))}
              </div>
            </div>

            {/* أفضل الدورات */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <Award className="h-5 w-5 text-[#1a7a8a]" />
                <h3 className="text-lg font-semibold text-[#001f24]">أفضل الدورات</h3>
              </div>
              <div className="space-y-4">
                {topCourses.map((course, idx) => (
                  <div key={idx}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium text-gray-900">{course.name}</span>
                      <span className="text-gray-500">{course.students} طالب</span>
                    </div>
                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all duration-1000"
                        style={{ width: `${course.progress}%`, backgroundColor: course.color }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* التذييل */}
        <div className="text-center text-xs text-gray-400 pt-4 border-t border-gray-100">
          © ٢٠٢٤ أكاديمية مارين. جميع الحقوق محفوظة.
        </div>
      </div>
    </div>
  );
}