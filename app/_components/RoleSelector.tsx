"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useUser } from "@clerk/nextjs";

type Role = "student" | "teacher" | "parent" | "admin";

interface RoleOption {
  id: Role;
  label: string;
  description: string;
  icon: string;
}

const ROLE_OPTIONS: RoleOption[] = [
  {
    id: "student",
    label: "Student",
    description: "Learn and track your academic progress",
    icon: "👨‍🎓",
  },
  {
    id: "teacher",
    label: "Teacher",
    description: "Create courses and manage students",
    icon: "👨‍🏫",
  },
  {
    id: "parent",
    label: "Parent",
    description: "Monitor your child's learning journey",
    icon: "👨‍👩‍👧",
  },
  {
    id: "admin",
    label: "Administrator",
    description: "Manage the platform and users",
    icon: "⚙️",
  },
];

export default function RoleSelector() {
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const router = useRouter();
  const { user } = useUser();
  const createUser = useMutation(api.user.auth.createUser);

  const handleContinue = async () => {
    if (!selectedRole || !user) {
      setError("Please select a role");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const primaryEmail = user.emailAddresses?.[0]?.emailAddress;
      if (!primaryEmail) {
        setError("No email found in your Clerk account");
        return;
      }

      await createUser({
        clerkId: user.id,
        name: user.fullName || user.username || "User",
        email: primaryEmail,
        role: selectedRole,
        phoneNumber: undefined,
      });

      // Redirect to pending approval page
      router.push("/pending-approval");
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to create user";
      setError(errorMsg);
      console.error("Error creating user:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-linear-to-br from-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Welcome to LMS</h1>
          <p className="text-xl text-gray-600">
            Tell us about yourself so we can personalize your experience
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-xl p-8 mb-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-8">Select Your Role</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            {ROLE_OPTIONS.map((role) => (
              <button
                key={role.id}
                onClick={() => setSelectedRole(role.id)}
                className={`p-6 rounded-lg border-2 transition-all text-left ${
                  selectedRole === role.id
                    ? "border-indigo-600 bg-indigo-50"
                    : "border-gray-200 bg-white hover:border-indigo-300"
                }`}
              >
                <div className="text-4xl mb-3">{role.icon}</div>
                <h3 className="text-lg font-semibold text-gray-900">{role.label}</h3>
                <p className="text-sm text-gray-600 mt-2">{role.description}</p>
                {selectedRole === role.id && (
                  <div className="mt-4 inline-block bg-indigo-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
                    Selected
                  </div>
                )}
              </button>
            ))}
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 text-sm font-medium">{error}</p>
            </div>
          )}

          <button
            onClick={handleContinue}
            disabled={!selectedRole || isLoading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            {isLoading ? "Creating your account..." : "Continue"}
          </button>
        </div>

        <div className="text-center text-sm text-gray-600">
          <p>You can change your role later in your account settings</p>
        </div>
      </div>
    </div>
  );
}
