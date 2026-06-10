"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth, useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import RoleSelector from "@/app/_components/RoleSelector";

export default function OnboardingPage() {
  const { isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();
  const router = useRouter();
  const currentUser = useQuery(api.user.auth.getCurrentUser);

  useEffect(() => {
    // Redirect if not signed in
    if (isLoaded && !isSignedIn) {
      router.push("/");
      return;
    }

    // If user already exists in Convex, redirect to appropriate page
    if (currentUser !== undefined) {
      if (currentUser) {
        // User already has a role
        if (currentUser.status === "pending") {
          router.push("/pending-approval");
        } else if (currentUser.status === "approved") {
          // Redirect to appropriate dashboard based on role
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
    }
  }, [isLoaded, isSignedIn, currentUser, router]);

  // Show loading state while checking user
  if (!isLoaded || !user || currentUser === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  // Show role selector
  return <RoleSelector />;
}
