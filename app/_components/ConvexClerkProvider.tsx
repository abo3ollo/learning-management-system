// app/_components/ConvexClerkProvider.tsx
"use client";

import { ConvexProviderWithClerk } from "convex/react-clerk";
import { ClerkProvider, useAuth, useUser } from "@clerk/nextjs";
import { ConvexReactClient } from "convex/react";
import { useEffect, useState } from "react";
import { useQuery } from "convex/react";
import { useRouter, usePathname } from "next/navigation";
import { api } from "@/convex/_generated/api";

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

function UserSync() {
  const { user, isLoaded: userLoaded } = useUser();
  const { isSignedIn, userId } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isReady, setIsReady] = useState(false);
  
  const currentUser = useQuery(
    api.user.auth.getCurrentUser,
    isSignedIn && userId ? {} : "skip"
  );

  // ✅ قائمة الأدمن المسموح لهم
  const ADMIN_WHITELIST = [
    "admin123@gmail.com",
    "admin@marineacademy.com",
    "your-email@gmail.com",
    "digitallandsystems2025@gmail.com",
    "abdalrahmanyehia333@gmail.com",
  ];

  useEffect(() => {
    if (userLoaded && isSignedIn !== undefined) {
      setIsReady(true);
    }
  }, [userLoaded, isSignedIn]);

// app/_components/ConvexClerkProvider.tsx

useEffect(() => {
  // ✅ لو في صفحة الاشتراك، منعملش أي توجيه
  if (pathname?.startsWith("/subscription")) {
    return;
  }

  if (!userLoaded || !isReady) {
    return;
  }

  if (!isSignedIn) {
    const protectedPaths = ["/student", "/teacher", "/parent", "/admin", "/aptitude", "/academic"];
    if (protectedPaths.some((path) => pathname?.startsWith(path))) {
      router.push("/");
    }
    return;
  }

  if (currentUser === undefined) {
    return;
  }

  if (currentUser === null) {
    const skipRedirectPaths = ["/onboarding", "/sign-in", "/sign-up", "/"];
    if (!skipRedirectPaths.some((path) => pathname?.startsWith(path))) {
      router.replace("/onboarding");
    }
    return;
  }

  const role = (currentUser as any).role;
  const status = currentUser.status;
  const tracks = (currentUser as any).tracks || [];
  const email = currentUser.email;

  // ✅ لو أدمن في الـ Whitelist → يروح admin
  if (role === "admin" && ADMIN_WHITELIST.includes(email?.toLowerCase())) {
    if (pathname !== "/admin" && !pathname?.startsWith("/admin")) {
      router.replace("/admin");
    }
    return;
  }

  // ✅ لو pending → pending-approval
  if (status === "pending") {
    if (pathname !== "/pending-approval") {
      router.replace("/pending-approval");
    }
    return;
  }

  // ✅ لو rejected → account-rejected
  if (status === "rejected") {
    if (pathname !== "/account-rejected") {
      router.replace("/account-rejected");
    }
    return;
  }

  // ✅ لو active أو approved → توجيه مرة واحدة فقط (عند تسجيل الدخول)
  if (status === "active" || status === "approved") {
    
    // ✅ IMPORTANT: منع التوجيه التلقائي إذا كان المستخدم أصلاً في صفحة
    // هذه هي النقطة الأساسية - منع التوجيه بعد تسجيل الدخول
    
    // ✅ لو هو أصلاً في أي صفحة من صفحات المنصة → منعملش توجيه
    if (pathname?.startsWith("/student") || 
        pathname?.startsWith("/teacher") || 
        pathname?.startsWith("/parent") || 
        pathname?.startsWith("/admin") ||
        pathname?.startsWith("/aptitude") ||
        pathname?.startsWith("/academic")) {
      return; // ✅ منعملش توجيه
    }

    // ✅ لو في الصفحة الرئيسية → منعملش توجيه (خلينا المستخدم يختار)
    if (pathname === "/") {
      return;
    }

    // ── توجيه حسب المسارات (يحدث فقط أول مرة) ──────────────
    
    // ✅ الأولوية للمنصة
    if (tracks.includes("platform")) {
      const routes: Record<string, string> = {
        student: "/student",
        teacher: "/teacher",
        parent: "/parent",
        admin: "/admin",
      };
      const dashboardPath = routes[role];
      if (dashboardPath) {
        router.replace(dashboardPath);
        return;
      }
    }

    // ✅ الثاني للقدرات
    if (tracks.includes("aptitude")) {
      router.replace("/aptitude");
      return;
    }

    // ✅ الثالث للتحصيلي
    if (tracks.includes("academic")) {
      router.replace("/academic");
      return;
    }

    // ✅ لو معندوش tracks → onboarding
    if (tracks.length === 0 && pathname !== "/onboarding") {
      router.replace("/onboarding");
      return;
    }
  }

}, [userLoaded, isReady, isSignedIn, userId, currentUser, router, pathname]);

  return null;
}

function ConvexProviderWrapper({ children }: { children: React.ReactNode }) {
  return (
    <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
      <UserSync />
      {children}
    </ConvexProviderWithClerk>
  );
}

export default function ConvexClerkProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <ConvexProviderWrapper>
        {children}
      </ConvexProviderWrapper>
    </ClerkProvider>
  );
}