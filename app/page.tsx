"use client";

import { useAuth, SignInButton } from "@clerk/nextjs";
import Link from "next/link";

export default function Home() {
  const { isSignedIn } = useAuth();

  return (
    <div className="min-h-screen bg-linear-to-br from-indigo-600 to-purple-700 flex flex-col items-center justify-center p-4">
      <div className="max-w-2xl w-full text-center">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-5xl font-bold text-white mb-4">📚 Learning Management System</h1>
          <p className="text-xl text-indigo-100">
            Empower education with a modern, intuitive learning platform
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-lg p-6 text-white">
            <p className="text-3xl mb-3">👨‍🎓</p>
            <h3 className="font-semibold mb-2">For Students</h3>
            <p className="text-sm text-black">
              Access courses, submit assignments, and track your progress
            </p>
          </div>
          <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-lg p-6 text-white">
            <p className="text-3xl mb-3">👨‍🏫</p>
            <h3 className="font-semibold mb-2">For Teachers</h3>
            <p className="text-sm text-black">
              Create courses, manage students, and grade assignments
            </p>
          </div>
          <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-lg p-6 text-white">
            <p className="text-3xl mb-3">👨‍👩‍👧</p>
            <h3 className="font-semibold mb-2">For Parents</h3>
            <p className="text-sm text-black">
              Monitor your child's academic progress and communicate with teachers
            </p>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="space-y-4">
          {!isSignedIn ? (
            <>
              <SignInButton mode="modal">
                <button className="w-full bg-white text-indigo-600 font-semibold py-3 px-6 rounded-lg hover:bg-indigo-50 transition-colors">
                  Sign In
                </button>
              </SignInButton>
              <p className="text-indigo-100 text-sm">
                Don't have an account?{" "}
                <SignInButton mode="modal">
                  <button className="underline hover:text-white">
                    Create one now
                  </button>
                </SignInButton>
              </p>
            </>
          ) : (
            <>
              <Link href="/onboarding">
                <button className="w-full bg-white text-indigo-600 font-semibold py-3 px-6 rounded-lg hover:bg-indigo-50 transition-colors">
                  Complete Registration
                </button>
              </Link>
              <p className="text-indigo-100 text-sm">
                Continue setting up your account
              </p>
            </>
          )}
        </div>

        {/* Footer Info */}
        <div className="mt-12 text-indigo-100 text-sm">
          <p>🔒 Secure • 📱 Accessible • 🚀 Modern</p>
        </div>
      </div>
    </div>
  );
}
