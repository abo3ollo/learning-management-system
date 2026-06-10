"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { SignOutButton } from "@clerk/nextjs";
import { useEffect } from "react";

export default function DashboardPage() {
  const { isLoaded, isSignedIn } = useAuth();
  const router = useRouter();
  const currentUser = useQuery(api.user.auth.getCurrentUser);

  useEffect(() => {
    if (!isLoaded || !isSignedIn) {
      router.push("/");
      return;
    }

    // If user data is loaded, redirect to their role-specific dashboard
    if (currentUser !== undefined && currentUser) {
      if (currentUser.status === "pending") {
        router.push("/pending-approval");
      } else if (currentUser.status === "approved") {
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

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
        <p className="text-gray-600 font-medium">Loading your dashboard...</p>
      </div>
    </div>
  );
}
