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
} from "lucide-react";
import { PiStudentBold } from "react-icons/pi";
import { FaChalkboardTeacher ,FaHandshake  } from "react-icons/fa";
import { LuBaggageClaim } from "react-icons/lu";
import { IoMdTrendingUp } from "react-icons/io";


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
    { title: "Students",      value: "27",   icon: PiStudentBold, trend: "+12%", up: true,  iconBg: "bg-blue-50",    iconColor: "text-blue-500"   },
    { title: "Teachers",      value: "2",    icon: FaChalkboardTeacher, trend: "+0%",  up: true,  iconBg: "bg-teal-50",    iconColor: "text-teal-500"   },
    { title: "Courses",       value: "10",   icon: BookOpen,      trend: "+5%",  up: true,  iconBg: "bg-slate-100",  iconColor: "text-slate-500"  },
    { title: "Claims",        value: "7",    icon: LuBaggageClaim ,  trend: "+3",   up: true,  iconBg: "bg-red-50",     iconColor: "text-red-400"    },
    { title: "Centers",       value: "1",    icon: MapPin,        trend: "+0%",  up: true,  iconBg: "bg-blue-50",    iconColor: "text-blue-400"   },
    { title: "Collaborators", value: "2",    icon: FaHandshake ,     trend: "+0%",  up: true,  iconBg: "bg-orange-50",  iconColor: "text-orange-400" },
    { title: "Avg Rates",     value: "0.00", icon: IoMdTrendingUp,    trend: "-0%",  up: false, iconBg: "bg-yellow-50",  iconColor: "text-yellow-500" },
    { title: "Question Bank", value: "0",    icon: BarChart3,     trend: "+0",   up: true,  iconBg: "bg-purple-50",  iconColor: "text-purple-400" },
  ];

  const quickActions = [
    { title: "Add Student",     icon: UserPlus, href: "/admin/students",     bg: "bg-blue-50",   iconBg: "bg-blue-600",   labelColor: "text-blue-600"   },
    { title: "Media Center",    icon: Library,  href: "/admin/content",      bg: "bg-green-100",  iconBg: "bg-green-600",  labelColor: "text-green-600"  },
    { title: "System Settings", icon: Settings, href: "/admin/settings",     bg: "bg-slate-100",  iconBg: "bg-slate-700",  labelColor: "text-slate-700"  },
    { title: "Lesson Plan",     icon: BookOpen, href: "/admin/plans",        bg: "bg-purple-100", iconBg: "bg-purple-600", labelColor: "text-purple-600" },
  ];

  const recentSubmissions = [
    { title: "Quiz #4 - Biology",   time: "2m ago",  dot: "bg-green-500"  },
    { title: "Assignment: History", time: "15m ago", dot: "bg-gray-800"   },
    { title: "New Support Ticket",  time: "1h ago",  dot: "bg-orange-400" },
  ];

  const pendingCount = pendingUsers?.length ?? 0;

  return (
    <div className="min-h-screen bg-[#f7fafa]">
      {/* Top bar */}
      <header className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between sticky top-0 z-10">
        <h1 className="text-xl font-bold text-[#001f24]">Dashboard</h1>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search data..."
              className="pl-9 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg w-56 focus:outline-none focus:ring-2 focus:ring-[#03363d]/20"
            />
          </div>
          <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <Bell className="h-5 w-5 text-gray-500" />
          </button>
          <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <HelpCircle className="h-5 w-5 text-gray-500" />
          </button>
          <div className="w-9 h-9 rounded-full bg-gray-200 overflow-hidden flex items-center justify-center text-sm font-semibold text-gray-600">
            {currentUser.name?.charAt(0).toUpperCase()}
          </div>
        </div>
      </header>

      <div className="p-8 max-w-7xl mx-auto space-y-8">
        {/* Welcome */}
        <div className="rounded-xl px-6 py-10 ms-14">
          <h2 className="text-3xl font-bold text-[#001f24]">
            Good Evening, Admin 👋
          </h2>
          <p className="text-gray-500 mt-1 text-sm">
            Overview of your academic products and system performance.
          </p>
        </div>

        {/* Pending approval banner */}
        {pendingCount > 0 && (
          <div className="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-xl px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center">
                <Users className="h-4 w-4 text-amber-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-sm">
                  {pendingCount} pending {pendingCount === 1 ? "registration" : "registrations"}
                </p>
                <p className="text-xs text-gray-500">Review and approve new accounts</p>
              </div>
            </div>
            <Link
              href="/admin/approvals"
              className="text-sm font-medium bg-[#001f24] text-white px-4 py-2 rounded-lg hover:bg-[#03363d] transition-colors"
            >
              Review →
            </Link>
          </div>
        )}

        {/* Stats grid — row 1 */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {stats.slice(0, 4).map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.title}
                className="bg-white rounded-xl p-5 border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-11 h-11 rounded-xl ${stat.iconBg} flex items-center justify-center`}>
                    <Icon className={`h-5 w-5 ${stat.iconColor}`} />
                  </div>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    stat.up ? "text-green-600" : "text-red-500"
                  }`}>
                    {stat.trend} {stat.up ? "↗" : "↘"}
                  </span>
                </div>
                <p className="text-3xl font-bold text-[#001f24]">{stat.value}</p>
                <p className="text-xs text-gray-500 mt-1 font-medium">{stat.title}</p>
              </div>
            );
          })}
        </div>

        {/* Stats grid — row 2 */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {stats.slice(4, 8).map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.title}
                className="bg-white rounded-xl p-5 border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-11 h-11 rounded-xl ${stat.iconBg} flex items-center justify-center`}>
                    <Icon className={`h-5 w-5 ${stat.iconColor}`} />
                  </div>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    stat.up ? "text-green-600" : "text-red-500"
                  }`}>
                    {stat.trend} {stat.up ? "↗" : "↘"}
                  </span>
                </div>
                <p className="text-3xl font-bold text-[#001f24]">{stat.value}</p>
                <p className="text-xs text-gray-500 mt-1 font-medium">{stat.title}</p>
              </div>
            );
          })}
        </div>

        {/* Quick Actions */}
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-1 h-5 bg-[#001f24] rounded-full" />
            <h3 className="text-base font-semibold text-[#001f24]">Quick Actions</h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <Link
                  key={action.title}
                  href={action.href}
                  className={`${action.bg} rounded-xl p-6 flex flex-col items-center gap-3 hover:opacity-90 hover:shadow-sm transition-all group`}
                >
                  <div className={`w-14 h-14 ${action.iconBg} rounded-2xl flex items-center justify-center group-hover:scale-105 transition-transform shadow-sm`}>
                    <Icon className="h-7 w-7 text-white"  />
                  </div>
                  <p className={`text-sm font-semibold ${action.labelColor}`}>{action.title}</p>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Recent Submissions */}
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-50">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Recent Submissions
            </p>
          </div>
          <div className="divide-y divide-gray-50">
            {recentSubmissions.map((item, i) => (
              <div key={i} className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${item.dot}`} />
                  <p className="text-sm font-medium text-gray-800">{item.title}</p>
                </div>
                <div className="flex items-center gap-1.5 text-gray-400">
                  <Clock className="h-3.5 w-3.5" />
                  <span className="text-xs">{item.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}