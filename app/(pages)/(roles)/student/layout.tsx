"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { SignOutButton } from "@clerk/nextjs";
import { useEffect } from "react";

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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

  if (!isLoaded || !currentUser) {
    return null;
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-gray-900 text-white">
        <div className="p-6">
          <Link href="/student" className="text-2xl font-bold">
            📚 Student
          </Link>
        </div>

        <nav className="mt-8 space-y-1">
          <Link
            href="/student"
            className="block px-6 py-3 hover:bg-gray-800 rounded-r-lg transition-colors"
          >
            Dashboard
          </Link>
          <Link
            href="/student/courses"
            className="block px-6 py-3 hover:bg-gray-800 rounded-r-lg transition-colors"
          >
            My Courses
          </Link>
        </nav>

        <div className="absolute bottom-0 w-64 border-t border-gray-700 p-4">
          <div className="mb-4">
            <p className="text-xs text-gray-400">Logged in as</p>
            <p className="font-semibold text-sm">{currentUser.name}</p>
            <p className="text-xs text-gray-400">{currentUser.email}</p>
          </div>
          <SignOutButton>
            <button className="w-full bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded transition-colors text-sm font-medium">
              Sign Out
            </button>
          </SignOutButton>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <h1 className="text-2xl font-bold text-gray-900">Student Dashboard</h1>
        </header>
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
