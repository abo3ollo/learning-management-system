"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

export default function TeacherDashboard() {
  const currentUser = useQuery(api.user.getCurrentUser);
  const courses = useQuery(api.courses.getTeacherCourses, 
    currentUser?.role === "teacher" ? { teacherId: currentUser._id } : "skip"
  );

  const courseCount = courses?.length || 0;

  return (
    <div className="p-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Total Courses Card */}
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-indigo-400">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium">Total Courses</p>
              <p className="text-4xl font-bold text-gray-900 mt-2">{courseCount}</p>
            </div>
            <div className="text-5xl">📚</div>
          </div>
          <Link
            href="/teacher/courses"
            className="mt-4 inline-block text-indigo-600 hover:text-indigo-700 font-semibold text-sm"
          >
            View Courses →
          </Link>
        </div>

        {/* Pending Grading Card */}
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-amber-400">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium">Pending Grading</p>
              <p className="text-4xl font-bold text-gray-900 mt-2">0</p>
            </div>
            <div className="text-5xl">📝</div>
          </div>
          <p className="mt-4 text-sm text-gray-600">Assignments to review</p>
        </div>

        {/* Total Students Card */}
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-400">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium">Total Students</p>
              <p className="text-4xl font-bold text-gray-900 mt-2">0</p>
            </div>
            <div className="text-5xl">👨‍🎓</div>
          </div>
          <p className="mt-4 text-sm text-gray-600">Across all courses</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Quick Actions</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link
              href="/teacher/courses/new"
              className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <p className="font-semibold text-gray-900">Create New Course</p>
              <p className="text-sm text-gray-600 mt-1">
                Start building a new course for your students
              </p>
            </Link>
            <Link
              href="/teacher/courses"
              className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <p className="font-semibold text-gray-900">View All Courses</p>
              <p className="text-sm text-gray-600 mt-1">
                Manage and edit all your courses
              </p>
            </Link>
          </div>
        </div>
      </div>

      {/* Teaching Tips */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="font-semibold text-blue-900 mb-2">Teaching Tips</h3>
        <p className="text-sm text-blue-800">
          Engage your students with interactive content and regular feedback.
        </p>
      </div>
    </div>
  );
}