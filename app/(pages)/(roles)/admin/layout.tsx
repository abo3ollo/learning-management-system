"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { SignOutButton } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Users,
  BookOpen,
  Settings,
  GraduationCap,
  FileQuestion,
  Library,
  Circle,
  LogOut,
  Menu,
  X,
  ClipboardCheck,
  BarChart3,
  FileText,
  Bell,
} from "lucide-react";
import { Loader2 } from "lucide-react";
import { RiParentFill } from "react-icons/ri";
import { FaChalkboardTeacher } from "react-icons/fa";
import { SiGoogleclassroom } from "react-icons/si";
import { AiOutlineSchedule } from "react-icons/ai";
import { MdOutlineHomeMax, MdOutlinePermMedia } from "react-icons/md";
import { FaClipboardQuestion } from "react-icons/fa6";
import { PiExam } from "react-icons/pi";


export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isLoaded, isSignedIn } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  // ✅ Fixed — was api.user.auth.getCurrentUser
  const currentUser = useQuery(api.user.auth.getCurrentUser);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) { router.push("/"); return; }
    if (currentUser !== undefined && currentUser?.role !== "admin") {
      router.push("/dashboard");
    }
  }, [isLoaded, isSignedIn, currentUser, router]);

  if (!isLoaded || currentUser === undefined || currentUser === null) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#f7fafa]">
        <Loader2 className="h-10 w-10 animate-spin text-[#001f24]" />
      </div>
    );
  }

  if (currentUser.role !== "admin") return null;

  const navItems = [
    { href: "/admin", label: "رئيسيه", icon: LayoutDashboard },
    { href: "/admin/teachers", label: "المعلمين", icon: FaChalkboardTeacher },
    { href: "/admin/students", label: "الطلاب", icon: GraduationCap },
    { href: "/admin/parents", label: "أولياء الامور", icon: RiParentFill },
    // { href: "/admin/classes", label: "الفصول", icon: SiGoogleclassroom },
    { href: "/admin/grades", label: "الصفوف", icon: SiGoogleclassroom },
    // { href: "/admin/courses", label: "المواد", icon: BookOpen },
    // { href: "/admin/schedules", label: "الجدول", icon: AiOutlineSchedule },
    { href: "/admin/media", label: "الوسائط", icon: MdOutlinePermMedia },
    { href: "/admin/questions", label: "بنك الأسئلة", icon: FaClipboardQuestion  },
    { href: "/admin/assignments", label: "الواجبات", icon: FileText }, 
    { href: "/admin/exams", label: "الامتحانات", icon: PiExam  }, 
    { href: "/admin/approvals", label: "الموافقة", icon: ClipboardCheck },
    { href: "/admin/landing", label: "البرتوفوليو", icon: MdOutlineHomeMax  },
    { href: "/admin/notifications", label: "الإشعارات", icon: Bell  },
    { href: "/admin/settings", label: "الإعدادات", icon: Settings },
  ];

  return (
    <div className="flex h-screen bg-[#f7fafa] font-sans" dir="rtl">
      {/* Sidebar */}
      <div
        className={`${sidebarOpen ? "w-64" : "w-20"
          } bg-[#001f24] text-white transition-all duration-300 flex flex-col shrink-0`}
      >
        {/* Logo */}
        <div className="p-5 flex items-center justify-between border-b border-[#03363d]">
          {sidebarOpen ? (
            <Link href="/admin" className="text-xl font-semibold tracking-tight">
              Admin
            </Link>
          ) : (
            <Link href="/admin" className="text-xl font-semibold">
              📚
            </Link>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1.5 hover:bg-[#03363d] rounded-lg transition-colors"
          >
            {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 px-3 overflow-y-auto space-y-0.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${isActive
                    ? "bg-[#03363d] text-white"
                    : "text-[#a3ced6] hover:bg-[#03363d] hover:text-white"
                  }`}
              >
                <Icon size={19} className="shrink-0" />
                {sidebarOpen && (
                  <span className="text-sm font-medium">{item.label}</span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User + logout */}
        <div className="border-t border-[#03363d] p-4">
          {sidebarOpen && (
            <div className="mb-3">
              <p className="text-xs text-[#a3ced6] tracking-widest uppercase font-mono">
                مسجل الدخول كـ
              </p>
              <p className="font-semibold text-sm mt-1 truncate">{currentUser.name}</p>
              <p className="text-xs text-[#759fa7] truncate">{currentUser.email}</p>
            </div>
          )}
          <SignOutButton>
            <button className="flex items-center gap-3 w-full bg-[#03363d] hover:bg-[#032a30] text-white py-2.5 px-3 rounded-lg transition-colors text-sm font-medium">
              <LogOut size={17} />
              {sidebarOpen && <span>تسجيل الخروج</span>}
            </button>
          </SignOutButton>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}