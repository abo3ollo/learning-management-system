"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { SignOutButton } from "@clerk/nextjs";
import Link from "next/link";
import { MdErrorOutline, MdEmail, MdSupportAgent } from "react-icons/md";
import { FaUser, FaEnvelope, FaUserTag, FaExclamationTriangle } from "react-icons/fa";
import { HiOutlineInformationCircle } from "react-icons/hi";

export default function AccountRejectedPage() {
  const { isLoaded, isSignedIn } = useAuth();
  const router = useRouter();
  const currentUser = useQuery(api.user.auth.getCurrentUser);

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
      <div className="min-h-screen flex items-center justify-center bg-[#f7fafa]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f7fafa] p-4">
      <div className="w-full max-w-md">
        {/* Main Card */}
        <div className="bg-white rounded-2xl border border-[#c0c8c9] shadow-sm overflow-hidden">
          {/* Header with Red Gradient */}
          <div className="bg-linear-to-r from-red-700 to-red-500 px-6 py-8 text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white/10 rounded-full mb-4 backdrop-blur">
              <MdErrorOutline className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">
              Account Rejected
            </h1>
            <p className="text-red-100 text-sm">
              Your registration request has been rejected
            </p>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Rejection Reason */}
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
              <div className="flex items-start gap-3">
                <FaExclamationTriangle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-red-800 text-sm mb-1">
                    Reason for rejection:
                  </p>
                  <p className="text-sm text-red-700 leading-relaxed">
                    {currentUser.rejectionReason ||
                      "No specific reason was provided. Please contact support for more information."}
                  </p>
                </div>
              </div>
            </div>

            {/* User Information Card */}
            <div className="bg-[#f7fafa] rounded-xl p-4 mb-6">
              <div className="flex items-center gap-2 mb-4">
                <HiOutlineInformationCircle className="h-4 w-4 text-gray-500" />
                <h3 className="font-semibold text-[#0a2540] text-sm">
                  Your Information
                </h3>
              </div>
              <dl className="space-y-3 text-sm">
                <div className="flex items-center justify-between border-b border-[#c0c8c9]/30 pb-2">
                  <dt className="flex items-center gap-2 text-gray-500">
                    <FaUser className="h-3 w-3" />
                    Name:
                  </dt>
                  <dd className="text-[#0a2540] font-medium">{currentUser.name}</dd>
                </div>
                <div className="flex items-center justify-between border-b border-[#c0c8c9]/30 pb-2">
                  <dt className="flex items-center gap-2 text-gray-500">
                    <FaEnvelope className="h-3 w-3" />
                    Email:
                  </dt>
                  <dd className="text-[#0a2540] font-medium">{currentUser.email}</dd>
                </div>
                <div className="flex items-center justify-between pt-1">
                  <dt className="flex items-center gap-2 text-gray-500">
                    <FaUserTag className="h-3 w-3" />
                    Role Applied For:
                  </dt>
                  <dd className="text-[#0a2540] font-medium capitalize">
                    {currentUser.role}
                  </dd>
                </div>
              </dl>
            </div>

            {/* Help Message */}
            <div className="bg-[#e0f5f7] border border-[#1a7a8a]/20 rounded-xl p-4 mb-6">
              <div className="flex items-start gap-3">
                <MdSupportAgent className="h-5 w-5 text-[#1a7a8a] shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-[#0a2540] text-sm mb-1">
                    Need help?
                  </p>
                  <p className="text-sm text-[#0a2540]/80 leading-relaxed">
                    If you believe this is an error or would like to reapply with different
                    information, please contact our support team at
                  </p>
                  <a 
                    href="mailto:support@marineacademy.com" 
                    className="inline-flex items-center gap-1 mt-2 text-sm font-medium text-[#1a7a8a] hover:text-[#0a2540] transition-colors"
                  >
                    <MdEmail className="h-3 w-3" />
                    support@marineacademy.com
                  </a>
                </div>
              </div>
            </div>

            {/* Sign Out Button */}
            <Link href="/">
              <button className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-200">
                Sign Out
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}