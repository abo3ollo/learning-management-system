"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import Link from "next/link";
import { useEffect } from "react";

export default function StudentDashboard() {
  const { isLoaded, isSignedIn } = useAuth();
  const router = useRouter();
  const currentUser = useQuery(api.user.getCurrentUser);
  const courses = currentUser && currentUser.role === "student"
    ? useQuery(api.courses.getStudentCourses, {
        studentId: currentUser._id,
      })
    : null;
  const publishedCourses = useQuery(api.courses.getPublishedCourses, {
    limit: 10,
  });

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
    return null;
  }

  const enrolledCount = courses?.length || 0;

  return (
    <div className="p-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Enrolled Courses Card */}
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-indigo-400">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium">Enrolled Courses</p>
              <p className="text-4xl font-bold text-gray-900 mt-2">{enrolledCount}</p>
            </div>
            <div className="text-5xl">📖</div>
          </div>
          <Link
            href="/student/courses"
            className="mt-4 inline-block text-indigo-600 hover:text-indigo-700 font-semibold text-sm"
          >
            View Courses →
          </Link>
        </div>

        {/* In Progress Card */}
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-400">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium">In Progress</p>
              <p className="text-4xl font-bold text-gray-900 mt-2">0</p>
            </div>
            <div className="text-5xl">⏳</div>
          </div>
          <p className="mt-4 text-sm text-gray-600">Courses you're currently taking</p>
        </div>

        {/* Completed Card */}
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-400">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium">Completed</p>
              <p className="text-4xl font-bold text-gray-900 mt-2">0</p>
            </div>
            <div className="text-5xl">✅</div>
          </div>
          <p className="mt-4 text-sm text-gray-600">Courses you've finished</p>
        </div>
      </div>

      {/* Featured Courses */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Featured Courses</h2>
        </div>
        <div className="p-6">
          {courses && courses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {courses.slice(0, 4).map((course: any) => (
                <Link
                  key={course._id}
                  href={`/student/courses/${course._id}`}
                  className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <p className="font-semibold text-gray-900">{course.title}</p>
                  <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                    {course.description || "No description"}
                  </p>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-xs font-semibold px-2 py-1 rounded bg-indigo-100 text-indigo-800">
                      Enrolled
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-600 mb-4">You're not enrolled in any courses yet</p>
              <Link
                href="/student/courses"
                className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
              >
                Browse Courses
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Available Courses to Explore */}
      <div className="mt-8 bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Explore New Courses</h2>
        </div>
        <div className="p-6">
          {publishedCourses && publishedCourses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {publishedCourses.slice(0, 4).map((course: any) => (
                <Link
                  key={course._id}
                  href={`/student/courses/${course._id}`}
                  className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <p className="font-semibold text-gray-900">{course.title}</p>
                  <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                    {course.description || "No description"}
                  </p>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-xs text-gray-600">By {course.teacherId}</span>
                    <button className="text-indigo-600 hover:text-indigo-700 text-sm font-semibold">
                      Enroll →
                    </button>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-600 py-8">No courses available yet</p>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8 bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Quick Actions</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link
              href="/student/courses"
              className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <p className="font-semibold text-gray-900">View My Courses</p>
              <p className="text-sm text-gray-600 mt-1">
                Access all your enrolled courses
              </p>
            </Link>
            <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
              <p className="font-semibold text-gray-900">My Progress</p>
              <p className="text-sm text-gray-600 mt-1">
                Track your learning progress
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Help Section */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="font-semibold text-blue-900 mb-2">Learning Tips</h3>
        <p className="text-sm text-blue-800 mb-4">
          Stay organized and make the most of your learning experience. Set goals, complete assignments, and engage with instructors.
        </p>
        <button className="text-indigo-600 hover:text-indigo-700 font-semibold text-sm">
          View Documentation →
        </button>
      </div>
    </div>
  );
}
