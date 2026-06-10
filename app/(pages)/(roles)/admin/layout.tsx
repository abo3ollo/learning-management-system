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
  ClipboardCheck
} from "lucide-react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isLoaded, isSignedIn } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const currentUser = useQuery(api.user.auth.getCurrentUser);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    // Only run redirects after auth is loaded
    if (!isLoaded) return;
    
    if (!isSignedIn) {
      router.push("/");
      return;
    }

    if (currentUser !== undefined && currentUser?.role !== "admin") {
      router.push("/dashboard");
    }
  }, [isLoaded, isSignedIn, currentUser, router]);

  // Show loading state while checking auth
  if (!isLoaded || currentUser === undefined) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // Don't render layout if not admin (will redirect)
  if (currentUser?.role !== "admin") {
    return null;
  }

  const navItems = [
    { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/students", label: "الطلاب", icon: GraduationCap },
    { href: "/admin/teachers", label: "المعلمون", icon: Users },
    { href: "/admin/courses", label: "المواد", icon: BookOpen },
    { href: "/admin/exams", label: "بنك الأسئلة", icon: FileQuestion },
    { href: "/admin/circles", label: "الدوائر", icon: Circle },
    { href: "/admin/content", label: "مكتبة المحتوى", icon: Library },
    { href: "/admin/resources", label: "الموارد", icon: Library },
    { href: "/admin/users", label: "المستخدمين", icon: Users },
    { href: "/admin/approvals", label: "الموافقة", icon: ClipboardCheck  },

    { href: "/admin/settings", label: "الإعدادات", icon: Settings },
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-gray-900 text-white transition-all duration-300 flex flex-col`}>
        <div className="p-4 flex items-center justify-between border-b border-gray-800">
          {sidebarOpen ? (
            <Link href="/admin" className="text-xl font-bold">
              📚 LMS Admin
            </Link>
          ) : (
            <Link href="/admin" className="text-xl font-bold">
              📚
            </Link>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1 hover:bg-gray-800 rounded"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        <nav className="flex-1 py-4 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 mx-2 rounded-lg transition-colors ${
                  isActive
                    ? "bg-indigo-600 text-white"
                    : "text-gray-300 hover:bg-gray-800 hover:text-white"
                }`}
              >
                <Icon size={20} />
                {sidebarOpen && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-gray-800 p-4">
          {sidebarOpen && (
            <div className="mb-4">
              <p className="text-xs text-gray-400">Logged in as</p>
              <p className="font-semibold text-sm truncate">{currentUser.name}</p>
              <p className="text-xs text-gray-400 truncate">{currentUser.email}</p>
            </div>
          )}
          <SignOutButton>
            <button className={`flex items-center gap-3 w-full bg-gray-800 hover:bg-gray-700 text-white py-2 px-3 rounded transition-colors text-sm`}>
              <LogOut size={18} />
              {sidebarOpen && <span>تسجيل الخروج</span>}
            </button>
          </SignOutButton>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <h1 className="text-2xl font-bold text-gray-900">لوحة التحكم</h1>
        </header>
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}