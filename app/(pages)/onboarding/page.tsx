// app/onboarding/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useUser, useAuth } from "@clerk/nextjs";
import { PiStudentBold } from "react-icons/pi";
import { FaChalkboardTeacher } from "react-icons/fa";
import { RiParentFill } from "react-icons/ri";
import { MdAdminPanelSettings } from "react-icons/md";
import { StudentRegistrationModal } from "@/app/_components/StudentRegistrationModal";
import { Loader2 } from "lucide-react";
import { TeacherRegistrationModal } from "@/app/_components/TeacherRegistrationModal";

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
  const router = useRouter();
  const { user, isLoaded: isUserLoaded } = useUser();
  const { isSignedIn, isLoaded: isAuthLoaded } = useAuth();
  const currentUser = useQuery(api.user.auth.getCurrentUser);
  const createUser = useMutation(api.user.auth.createUser);
  
  // ✅ إضافة التحقق من وجود المستخدم بالبريد
  const checkUserByEmail = useMutation(api.user.auth.getUserByEmail);

  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [isExistingUser, setIsExistingUser] = useState(false);
  const [showTeacherModal, setShowTeacherModal] = useState(false);

  useEffect(() => {
    if (!isAuthLoaded || !isUserLoaded) return;

    if (!isSignedIn) {
      router.push("/");
      return;
    }

    if (currentUser !== undefined && currentUser !== null) {
      setIsChecking(false);

      const dashboardMap: Record<string, string> = {
        admin: "/admin",
        teacher: "/teacher",
        student: "/student",
        parent: "/parent",
      };

      // ✅ لو طالب - روح على طول student
      if (currentUser.role === "student") {
        router.push("/student");
        return;
      }

      // ✅ لو عنده role - روح dashboard بتاعه
      if (currentUser.role) {
        const dashboardPath = dashboardMap[currentUser.role];
        if (dashboardPath) {
          router.push(dashboardPath);
          return;
        }
      }
    }

    setIsChecking(false);
  }, [isAuthLoaded, isUserLoaded, isSignedIn, currentUser, router]);

  // ✅ لو لسا بيدور على المستخدم
  if (!isAuthLoaded || !isUserLoaded || isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f7fafa]">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-[#1a7a8a] mx-auto mb-4" />
          <p className="text-gray-600">جاري التحقق من حسابك...</p>
        </div>
      </div>
    );
  }

  if (!isSignedIn) {
    return null;
  }


const handleContinue = async () => {
  if (!selectedRole || !user) {
    setError("Please select a role");
    return;
  }

  const primaryEmail = user.emailAddresses?.[0]?.emailAddress;
  if (!primaryEmail) {
    setError("No email found in your Clerk account");
    return;
  }

  // ✅ لو اختار Student، نفتح المودال على طول من غير ما نعمل createUser
  if (selectedRole === "student") {
    // ✅ نفتح المودال عشان الطالب يكمل بياناته
    setShowStudentModal(true);
    return;
  }

  // ✅ لو اختار Teacher، نفتح مودال المعلم
    if (selectedRole === "teacher") {
      setShowTeacherModal(true);
      return;
    }

  setIsLoading(true);
  setError(null);

  try {
    await createUser({
      clerkId: user.id,
      name: user.fullName || user.username || "User",
      email: primaryEmail,
      role: selectedRole,
      phoneNumber: undefined,
    });

    // ✅ الأدمن يروح pending-approval
    if (selectedRole === "admin") {
      router.push("/pending-approval");
      return;
    }

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
    <>
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#f7fafa] p-4">
        <div className="w-full max-w-3xl">
          <div className="text-center mb-12">
            <div className="inline-block p-4 bg-[#e0f5f7] rounded-full mb-6">
              <div className="w-12 h-12 bg-[#001f24] rounded-full flex items-center justify-center">
                <span className="text-2xl">🎓</span>
              </div>
            </div>
            <h1 className="text-4xl font-bold text-[#001f24] mb-3 tracking-tight">
              Welcome to Marine Academy
            </h1>
            <p className="text-lg text-gray-600 max-w-md mx-auto">
              Tell us about yourself so we can personalize your learning experience
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-[#c0c8c9] p-8 mb-6 shadow-sm">
            <h2 className="text-2xl font-semibold text-[#001f24] mb-6">
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
                        <h3 className="text-lg font-bold text-[#001f24] mb-1">
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
              className="w-full bg-[#001f24] hover:bg-[#1a7a8a] disabled:bg-gray-300 text-white font-semibold py-3.5 px-6 rounded-xl transition-all duration-200 transform hover:scale-[1.02] disabled:hover:scale-100"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin text-white" />
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

      <StudentRegistrationModal 
        isOpen={showStudentModal} 
        onClose={() => setShowStudentModal(false)} 
      />
      <TeacherRegistrationModal 
        isOpen={showTeacherModal} 
        onClose={() => setShowTeacherModal(false)} 
      />
    </>
  );
}