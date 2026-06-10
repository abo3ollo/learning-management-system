"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { SignOutButton } from "@clerk/nextjs";
import Link from "next/link";

export default function AccountRejectedPage() {
  const { isLoaded, isSignedIn } = useAuth();
  const router = useRouter();
  const currentUser = useQuery(api.user.getCurrentUser);

  useEffect(() => {
    if (!isLoaded || !isSignedIn) {
      router.push("/");
      return;
    }

    if (currentUser !== undefined && currentUser) {
      if (currentUser.status === "approved") {
        const dashboardMap: Record<string, string> = {
          admin: "/admin",
          teacher: "/teacher",
          student: "/student",
          parent: "/parent",
        };
        router.push(dashboardMap[currentUser.role] || "/dashboard");
      } else if (currentUser.status === "pending") {
        router.push("/pending-approval");
      }
    }
  }, [isLoaded, isSignedIn, currentUser, router]);

  if (!isLoaded || !currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-red-50 to-pink-100 p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-xl p-8">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">❌</div>
          <h1 className="text-3xl font-bold text-gray-900 mb-3">
            Account Rejected
          </h1>
          <p className="text-gray-600 mb-6">
            Unfortunately, your registration request has been rejected.
          </p>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8">
          <div className="flex items-start">
            <div className="shrink-0">
              <svg
                className="h-5 w-5 text-red-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-800">
                <strong>Reason for rejection:</strong>
              </p>
              <p className="text-sm text-red-700 mt-1">
                {currentUser.rejectionReason ||
                  "No specific reason was provided."}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-4 mb-8">
          <h3 className="font-semibold text-gray-900 mb-3">Your Information</h3>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-gray-600">Name:</dt>
              <dd className="text-gray-900 font-medium">{currentUser.name}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-600">Email:</dt>
              <dd className="text-gray-900 font-medium">{currentUser.email}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-600">Role Applied For:</dt>
              <dd className="text-gray-900 font-medium capitalize">
                {currentUser.role}
              </dd>
            </div>
          </dl>
        </div>

        <p className="text-sm text-gray-600 mb-6">
          If you believe this is an error or would like to reapply with different
          information, please contact the administrator at{" "}
          <span className="font-semibold">support@lms.example.com</span>
        </p>

        <Link href="/">
          <button className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors">
            Sign Out
          </button>
        </Link>
      </div>
    </div>
  );
}
