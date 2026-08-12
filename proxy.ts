import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/trips(.*)',
  '/aptitude(.*)', // ✅ مسار القدرات عام
  '/academic(.*)', // ✅ مسار التحصيلي عام
  '/subscription(.*)', // ✅ صفحة الاشتراك عامة
]);

const isAuthRoute = createRouteMatcher([
  '/onboarding(.*)',
  '/pending-approval(.*)',
  '/account-rejected(.*)',
  '/platform(.*)', // ✅ مسار المنصة محمي
  '/student(.*)',
  '/teacher(.*)',
  '/parent(.*)',
  '/admin(.*)',
]);

export default clerkMiddleware(async (auth, req: NextRequest) => {
  // Allow public routes without authentication
  if (isPublicRoute(req)) {
    return NextResponse.next();
  }

  const { userId } = await auth();

  // Redirect to sign-in if not authenticated
  if (!userId) {
    return (await auth()).redirectToSignIn({ returnBackUrl: req.url });
  }

  // Auth routes and all protected routes — allow through
  return NextResponse.next();
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/__clerk/:path*',
    '/(api|trpc)(.*)',
  ],
};