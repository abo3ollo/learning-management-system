"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { SignOutButton } from "@clerk/nextjs";
import { MdOutlinePending, MdOutlineEmail, MdInfoOutline } from "react-icons/md";
import { FaUser, FaEnvelope, FaUserTag } from "react-icons/fa";
import { HiOutlineClock } from "react-icons/hi";

export default function PendingApprovalPage() {
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
      } else if (currentUser.status === "rejected") {
        router.push("/account-rejected");
      }
    }
  }, [isLoaded, isSignedIn, currentUser, router]);

  if (!isLoaded || !currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f7fafa]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1a7a8a] mx-auto mb-4"></div>
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
          {/* Header with Marine gradient */}
          <div className="bg-linear-to-r from-[#0a2540] to-[#1a7a8a] px-6 py-8 text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white/10 rounded-full mb-4 backdrop-blur">
              <MdOutlinePending className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">
              Approval Pending
            </h1>
            <p className="text-[#e0f5f7] text-sm">
              Your registration request has been received
            </p>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Info Message */}
            <div className="bg-[#e0f5f7] border border-[#1a7a8a]/20 rounded-xl p-4 mb-6">
              <div className="flex items-start gap-3">
                <MdInfoOutline className="h-5 w-5 text-[#1a7a8a] shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-[#0a2540] text-sm mb-1">
                    What's next?
                  </p>
                  <p className="text-sm text-[#0a2540]/80 leading-relaxed">
                    An administrator will review your details and send you an email notification 
                    once your account is approved. This usually happens within 24 hours.
                  </p>
                </div>
              </div>
            </div>

            {/* User Information Card */}
            <div className="bg-[#f7fafa] rounded-xl p-4 mb-6">
              <div className="flex items-center gap-2 mb-4">
                <HiOutlineClock className="h-4 w-4 text-[#1a7a8a]" />
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
                <div className="flex items-center justify-between border-b border-[#c0c8c9]/30 pb-2">
                  <dt className="flex items-center gap-2 text-gray-500">
                    <FaUserTag className="h-3 w-3" />
                    Role:
                  </dt>
                  <dd className="text-[#0a2540] font-medium capitalize">
                    {currentUser.role}
                  </dd>
                </div>
                <div className="flex items-center justify-between pt-1">
                  <dt className="flex items-center gap-2 text-gray-500">Status:</dt>
                  <dd>
                    <span className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold text-amber-700 bg-amber-100 rounded-full">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                      </span>
                      Pending
                    </span>
                  </dd>
                </div>
              </dl>
            </div>

            {/* Note */}
            <p className="text-xs text-gray-400 text-center mb-6">
              Check back here or your email for updates.
            </p>

            {/* Sign Out Button */}
            <SignOutButton>
              <button className="w-full bg-[#0a2540] hover:bg-[#1a7a8a] text-white font-semibold py-3 px-4 rounded-xl transition-all duration-200">
                Sign Out
              </button>
            </SignOutButton>
          </div>
        </div>
      </div>
    </div>
  );
}