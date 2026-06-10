"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

export default function AdminApprovalsPage() {
  const { isLoaded, isSignedIn } = useAuth();
  const router = useRouter();
  const currentUser = useQuery(api.user.auth.getCurrentUser);
  
  
  // ✅ تحديث المسارات - استخدام admin بدلاً من المباشر
  const pendingUsers = useQuery(api.user.admin.getPendingRegistrations);
  
  const approveUser = useMutation(api.user.admin.approveUser);
  const rejectUser = useMutation(api.user.admin.rejectUser);
  
  const [rejectionReason, setRejectionReason] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoaded || !isSignedIn) {
      router.push("/");
      return;
    }

    // Check if user is admin
    if (currentUser !== undefined && currentUser) {
      if (currentUser.role !== "admin") {
        router.push("/dashboard");
      } else if (currentUser.status !== "approved") {
        router.push("/pending-approval");
      }
    }
  }, [isLoaded, isSignedIn, currentUser, router]);

  const handleApprove = async (userId: string) => {
    setIsSubmitting((prev) => ({ ...prev, [userId]: true }));
    setError(null);
    
    try {
      await approveUser({ userId: userId as any });
      setSuccessMessage("User approved successfully!");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to approve user";
      setError(errorMsg);
    } finally {
      setIsSubmitting((prev) => ({ ...prev, [userId]: false }));
    }
  };

  const handleReject = async (userId: string) => {
    const reason = rejectionReason[userId] || "";
    setIsSubmitting((prev) => ({ ...prev, [userId]: true }));
    setError(null);
    
    try {
      await rejectUser({ userId: userId as any, reason: reason || undefined });
      setSuccessMessage("User rejected successfully!");
      setRejectionReason((prev) => ({ ...prev, [userId]: "" }));
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to reject user";
      setError(errorMsg);
    } finally {
      setIsSubmitting((prev) => ({ ...prev, [userId]: false }));
    }
  };

  if (!isLoaded || !currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  if (currentUser.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600">You must be an administrator to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">User Approvals</h1>
          <p className="text-gray-600 mt-2">Review and approve pending user registrations</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 text-sm font-medium">{error}</p>
          </div>
        )}

        {successMessage && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-800 text-sm font-medium">{successMessage}</p>
          </div>
        )}

        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          {pendingUsers === undefined ? (
            <div className="p-6 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-2"></div>
              <p className="text-gray-600">Loading pending users...</p>
            </div>
          ) : pendingUsers.length === 0 ? (
            <div className="p-6 text-center">
              <div className="text-4xl mb-2">✅</div>
              <p className="text-gray-600 font-medium">All registrations have been reviewed!</p>
              <p className="text-gray-500 text-sm mt-1">There are no pending approvals at this time.</p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {pendingUsers.map((user) => (
                <li key={user._id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {user.name}
                      </h3>
                      <p className="text-gray-600 text-sm">{user.email}</p>
                      {user.phoneNumber && (
                        <p className="text-gray-600 text-sm">{user.phoneNumber}</p>
                      )}
                    </div>
                    <div className="ml-4">
                      <span className="inline-block px-3 py-1 text-sm font-semibold text-indigo-800 bg-indigo-100 rounded-full">
                        {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                      </span>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg mb-4">
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Registered:</span>{" "}
                      {new Date(user.createdAt).toLocaleString()}
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Rejection Reason (optional):
                      </label>
                      <textarea
                        value={rejectionReason[user._id] || ""}
                        onChange={(e) =>
                          setRejectionReason((prev) => ({
                            ...prev,
                            [user._id]: e.target.value,
                          }))
                        }
                        placeholder="Enter reason for rejection if applicable..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        rows={2}
                      />
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={() => handleApprove(user._id)}
                        disabled={isSubmitting[user._id]}
                        className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                      >
                        {isSubmitting[user._id] ? "Processing..." : "✓ Approve"}
                      </button>
                      <button
                        onClick={() => handleReject(user._id)}
                        disabled={isSubmitting[user._id]}
                        className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                      >
                        {isSubmitting[user._id] ? "Processing..." : "✕ Reject"}
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
