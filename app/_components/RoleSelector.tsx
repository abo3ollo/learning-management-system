"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { PiStudentBold } from "react-icons/pi";
import { FaChalkboardTeacher } from "react-icons/fa";
import { RiParentFill } from "react-icons/ri";
import { MdAdminPanelSettings } from "react-icons/md";

type Role = "student" | "teacher" | "parent" | "admin";

interface RoleOption {
  id: Role;
  label: string;
  description: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
}

const ROLE_OPTIONS: RoleOption[] = [
  {
    id: "student",
    label: "Student",
    description: "Learn and track your academic progress",
    icon: PiStudentBold,
  },
  {
    id: "teacher",
    label: "Teacher",
    description: "Create courses and manage students",
    icon: FaChalkboardTeacher,
  },
  {
    id: "parent",
    label: "Parent",
    description: "Monitor your child's learning journey",
    icon: RiParentFill,
  },
  {
    id: "admin",
    label: "Administrator",
    description: "Manage the platform and users",
    icon: MdAdminPanelSettings,
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
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#f7fafa] p-4">
      <div className="w-full max-w-3xl">
        <div className="text-center mb-12">
          <div className="inline-block p-4 bg-[#e0f5f7] rounded-full mb-6">
            <div className="w-12 h-12 bg-[#0a2540] rounded-full flex items-center justify-center">
              <span className="text-2xl">🎓</span>
            </div>
          </div>
          <h1 className="text-4xl font-bold text-[#0a2540] mb-3 tracking-tight">
            Welcome to Marine Academy
          </h1>
          <p className="text-lg text-gray-600 max-w-md mx-auto">
            Tell us about yourself so we can personalize your learning experience
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-[#c0c8c9] p-8 mb-6 shadow-sm">
          <h2 className="text-2xl font-semibold text-[#0a2540] mb-6">
            Select Your Role
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
            {ROLE_OPTIONS.map((role) => {
              const Icon = role.icon;
              return (
                <button
                  key={role.id}
                  onClick={() => setSelectedRole(role.id)}
                  className={`p-6 rounded-xl border-2 transition-all text-left group ${
                    selectedRole === role.id
                      ? "border-[#1a7a8a] bg-[#e0f5f7]"
                      : "border-[#c0c8c9] bg-white hover:border-[#1a7a8a] hover:bg-[#f7fafa]"
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-14 h-14 rounded-xl flex items-center justify-center transition-colors ${
                      selectedRole === role.id
                        ? "bg-[#1a7a8a] text-white"
                        : "bg-[#e0f5f7] text-[#1a7a8a] group-hover:bg-[#1a7a8a] group-hover:text-white"
                    }`}>
                      <Icon className="w-7 h-7" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-[#0a2540] mb-1">
                        {role.label}
                      </h3>
                      <p className="text-sm text-gray-500 leading-relaxed">
                        {role.description}
                      </p>
                    </div>
                  </div>
                  {selectedRole === role.id && (
                    <div className="mt-4 inline-block bg-[#1a7a8a] text-white text-xs font-semibold px-3 py-1 rounded-full">
                      ✓ Selected
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-red-700 text-sm font-medium">{error}</p>
            </div>
          )}

          <button
            onClick={handleContinue}
            disabled={!selectedRole || isLoading}
            className="w-full bg-[#0a2540] hover:bg-[#1a7a8a] disabled:bg-gray-300 text-white font-semibold py-3.5 px-6 rounded-xl transition-all duration-200 transform hover:scale-[1.02] disabled:hover:scale-100"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Creating your account...
              </span>
            ) : (
              "Continue"
            )}
          </button>
        </div>

        <div className="text-center text-sm text-gray-500">
          <p>You can change your role later in your account settings</p>
        </div>
      </div>
    </div>
  );
}