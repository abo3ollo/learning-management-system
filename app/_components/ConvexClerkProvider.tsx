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
    // أضف أي ايميلات تانية هنا
  ];

  useEffect(() => {
    if (userLoaded && isSignedIn !== undefined) {
      setIsReady(true);
    }
  }, [userLoaded, isSignedIn]);

  useEffect(() => {
    // ✅ لو في صفحة الاشتراك، منعملش أي توجيه
    if (pathname?.startsWith("/subscription")) {
      console.log("📝 [UserSync] On subscription page - staying");
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

    // ✅ لو أدمن في الـ Whitelist → يروح admin مباشرة (حتى لو status pending)
    if (role === "admin" && ADMIN_WHITELIST.includes(email?.toLowerCase())) {
      if (pathname !== "/admin" && !pathname?.startsWith("/admin")) {
        router.replace("/admin");
      }
      return;
    }

    // ✅ لو في الصفحة الرئيسية، منعملش توجيه تلقائي
    if (pathname === "/") {
      return;
    }

    // ✅ لو في pending-approval
    if (status === "pending") {
      if (pathname !== "/pending-approval") {
        router.replace("/pending-approval");
      }
      return;
    }

    // ✅ لو مرفوض
    if (status === "rejected") {
      if (pathname !== "/account-rejected") {
        router.replace("/account-rejected");
      }
      return;
    }

    // ✅ لو active أو approved
    if (status === "active" || status === "approved") {
      
      // ── التحقق من الصفحة الحالية أولاً ──────────────────
      
      // ✅ لو هو أصلاً في صفحة القدرات
      if (pathname?.startsWith("/aptitude")) {
        return;
      }

      // ✅ لو هو أصلاً في صفحة التحصيلي
      if (pathname?.startsWith("/academic")) {
        return;
      }

      // ✅ لو هو أصلاً في صفحة المنصة
      if (pathname?.startsWith("/student") || 
          pathname?.startsWith("/teacher") || 
          pathname?.startsWith("/parent") || 
          pathname?.startsWith("/admin")) {
        return;
      }

      // ── توجيه حسب المسارات (tracks) ──────────────────────
      
      // ✅ الأولوية للقدرات
      if (tracks.includes("aptitude")) {
        router.replace("/aptitude");
        return;
      }

      // ✅ الثاني للتحصيلي
      if (tracks.includes("academic")) {
        router.replace("/academic");
        return;
      }

      // ✅ الثالث للمنصة
      if (tracks.includes("platform")) {
        const routes: Record<string, string> = {
          student: "/student",
          teacher: "/teacher",
          parent: "/parent",
          admin: "/admin",
        };
        const dashboardPath = routes[role];
        if (dashboardPath && pathname !== dashboardPath && !pathname?.startsWith(dashboardPath)) {
          router.replace(dashboardPath);
        }
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