"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { SignOutButton } from "@clerk/nextjs";

export default function PendingApprovalPage() {
  const { isLoaded, isSignedIn } = useAuth();
  const router = useRouter();
  const currentUser = useQuery(api.user.getCurrentUser);

  useEffect(() => {
    if (!isLoaded || !isSignedIn) {
      router.push("/");
      return;
    }

    // If user is approved, redirect to dashboard
    if (currentUser !== undefined && currentUser) {
      if (currentUser.status === "approved") {
        const dashboardMap: Record<string, string> = {
          admin: "/admin",
          teacher: "/teacher",
          student: "/student",
          parent: "/parent",
        };
        router.push(dashboardMap[currentUser.role] || "/dashboard");
      } else if (currentUser.status === "rejected") {
        router.push("/account-rejected");
      }
    }
  }, [isLoaded, isSignedIn, currentUser, router]);

  if (!isLoaded || !currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-amber-50 to-orange-100 p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-xl p-8">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">⏳</div>
          <h1 className="text-3xl font-bold text-gray-900 mb-3">
            Approval Pending
          </h1>
          <p className="text-gray-600 mb-6">
            Your registration request has been received and is awaiting approval.
          </p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
          <div className="flex items-start">
            <div className="shrink-0">
              <svg
                className="h-5 w-5 text-blue-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M18 5v8a2 2 0 01-2 2h-5l-5 4v-4H4a2 2 0 01-2-2V5a2 2 0 012-2h12a2 2 0 012 2zm-11-1a1 1 0 11-2 0 1 1 0 012 0z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-blue-800">
                <strong>What's next?</strong> An administrator will review your
                details and send you an email notification once your account is
                approved. This usually happens within 24 hours.
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
              <dt className="text-gray-600">Role:</dt>
              <dd className="text-gray-900 font-medium capitalize">
                {currentUser.role}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-600">Status:</dt>
              <dd>
                <span className="inline-block px-3 py-1 text-xs font-semibold text-amber-800 bg-amber-100 rounded-full">
                  {currentUser.status.charAt(0).toUpperCase() +
                    currentUser.status.slice(1)}
                </span>
              </dd>
            </div>
          </dl>
        </div>

        <p className="text-xs text-gray-500 text-center mb-6">
          Check back here or your email for updates.
        </p>

        <SignOutButton>
          <button className="w-full bg-gray-200 hover:bg-gray-300 text-gray-900 font-semibold py-2 px-4 rounded-lg transition-colors">
            Sign Out
          </button>
        </SignOutButton>
      </div>
    </div>
  );
}
