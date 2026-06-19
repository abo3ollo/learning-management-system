// app/_components/ConvexClerkProvider.tsx
"use client";

import { ConvexProviderWithClerk } from "convex/react-clerk";
import { ClerkProvider, useAuth, useUser } from "@clerk/nextjs";
import { ConvexReactClient } from "convex/react";
import { useEffect } from "react";
import { useQuery } from "convex/react";
import { useRouter, usePathname } from "next/navigation";
import { api } from "@/convex/_generated/api";

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

function UserSync() {
  const { user, isLoaded } = useUser();
  const { isSignedIn } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const currentUser = useQuery(api.user.auth.getCurrentUser);

  useEffect(() => {
    if (!isLoaded || !isSignedIn) {
      return;
    }

    const skipRedirectPaths = ["/onboarding", "/sign-in", "/sign-up"];
    if (skipRedirectPaths.some((path) => pathname?.startsWith(path))) {
      return;
    }

    if (currentUser === undefined) {
      return;
    }

    if (currentUser) {
      const role = (currentUser as any).role;
      const status = currentUser.status;

      // ✅ لو طالب و active - روح على طول student
      if (role === "student" && status === "active") {
        if (pathname !== "/student" && !pathname?.startsWith("/student")) {
          router.push("/student");
        }
        return;
      }

      // ✅ لو طالب و pending - روح pending-approval
      if (role === "student" && status === "pending") {
        if (pathname !== "/pending-approval") {
          router.push("/pending-approval");
        }
        return;
      }

      // ✅ لو أدمن و active - روح على طول admin
      if (role === "admin" && status === "active") {
        if (pathname !== "/admin" && !pathname?.startsWith("/admin")) {
          router.push("/admin");
        }
        return;
      }

      // ✅ لو أدمن و pending - روح pending-approval
      if (role === "admin" && status === "pending") {
        if (pathname !== "/pending-approval") {
          router.push("/pending-approval");
        }
        return;
      }

      // ✅ لو teacher أو parent و pending - روح pending-approval
      if ((role === "teacher" || role === "parent") && status === "pending") {
        if (pathname !== "/pending-approval") {
          router.push("/pending-approval");
        }
        return;
      }

      // ✅ لو teacher أو parent و active - روح dashboard بتاعهم
      if ((role === "teacher" || role === "parent") && status === "active") {
        const dashboardMap: Record<string, string> = {
          teacher: "/teacher",
          parent: "/parent",
        };
        const dashboardPath = dashboardMap[role];
        if (dashboardPath && pathname !== dashboardPath && !pathname?.startsWith(dashboardPath)) {
          router.push(dashboardPath);
        }
        return;
      }

      // ✅ لو معندوش role - روح onboarding
      if (!role) {
        if (pathname !== "/onboarding") {
          router.push("/onboarding");
        }
        return;
      }

      return;
    }

    if (!currentUser && user) {
      if (pathname !== "/onboarding") {
        router.push("/onboarding");
      }
    }
  }, [user, isLoaded, isSignedIn, currentUser, router, pathname]);

  return null;
}

export default function ConvexClerkProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
        <UserSync />
        {children}
      </ConvexProviderWithClerk>
    </ClerkProvider>
  );
}