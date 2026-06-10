"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { SignOutButton } from "@clerk/nextjs";
import { useEffect } from "react";

export default function ParentDashboard() {
  const { isLoaded, isSignedIn } = useAuth();
  const router = useRouter();
  const currentUser = useQuery(api.user.getCurrentUser);

  useEffect(() => {
    if (!isLoaded || !isSignedIn) {
      router.push("/");
      return;
    }

    if (currentUser !== undefined && currentUser?.role !== "parent") {
      router.push("/dashboard");
    }
  }, [isLoaded, isSignedIn, currentUser, router]);

  if (!isLoaded || !currentUser) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-6xl mx-auto px-4 py-6 sm:px-6 lg:px-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Parent Dashboard</h1>
            <p className="text-gray-600 mt-1">Welcome, {currentUser.name}</p>
          </div>
          <SignOutButton>
            <button className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors">
              Sign Out
            </button>
          </SignOutButton>
        </div>
      </header>

      <main className="max-w-6xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm">Children</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">0</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm">Active Courses</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">0</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm">Average GPA</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">N/A</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Monitor Your Child's Progress</h2>
          <p className="text-gray-600 mb-6">
            Your parent dashboard is being set up. More features coming soon!
          </p>
          <div className="space-y-3">
            <button className="w-full text-left p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <p className="font-semibold text-gray-900">Connect Child Accounts</p>
              <p className="text-sm text-gray-600">Link your children's accounts</p>
            </button>
            <button className="w-full text-left p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <p className="font-semibold text-gray-900">View Academic Progress</p>
              <p className="text-sm text-gray-600">Track grades and performance</p>
            </button>
            <button className="w-full text-left p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <p className="font-semibold text-gray-900">Communicate with Teachers</p>
              <p className="text-sm text-gray-600">Send messages to instructors</p>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
