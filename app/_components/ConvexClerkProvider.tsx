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
    // Skip if not fully loaded
    if (!isLoaded || !isSignedIn) {
      return;
    }

    // Skip on certain pages to avoid redirect loops
    const skipRedirectPaths = [
      "/onboarding",
      "/pending-approval",
      "/account-rejected",
      "/sign-in",
      "/sign-up",
    ];
    
    if (skipRedirectPaths.some((path) => pathname?.startsWith(path))) {
      return;
    }

    // If we're still loading the user query, wait
    if (currentUser === undefined) {
      return;
    }

    // If no user exists in Convex yet, redirect to onboarding
    if (!currentUser && user) {
      router.push("/onboarding");
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