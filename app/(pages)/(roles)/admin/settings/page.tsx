"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useEffect } from "react";

export default function AdminSettingsPage() {
  const { isLoaded, isSignedIn } = useAuth();
  const router = useRouter();
  const currentUser = useQuery(api.user.auth.getCurrentUser);

  useEffect(() => {
    if (!isLoaded || !isSignedIn) {
      router.push("/");
      return;
    }

    if (currentUser !== undefined && currentUser?.role !== "admin") {
      router.push("/dashboard");
    }
  }, [isLoaded, isSignedIn, currentUser, router]);

  return (
    <div className="p-8">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Settings</h2>
        <p className="text-gray-600">System settings coming soon...</p>
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Planned settings:</strong> Approval requirements, email notifications, role permissions, system maintenance
          </p>
        </div>
      </div>
    </div>
  );
}
