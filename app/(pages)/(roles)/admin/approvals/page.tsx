"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  CheckCircle,
  XCircle,
  Clock,
  Users,
  Mail,
  Phone,
  User,
  Calendar,
  Search,
  Filter,
  Loader2,
  AlertCircle,
  Check,
  X,
  UserCheck,
  UserX,
  FileText,
  Shield,
  UserPlus,
} from "lucide-react";

export default function AdminApprovalsPage() {
  const { isLoaded, isSignedIn } = useAuth();
  const router = useRouter();
  const currentUser = useQuery(api.user.auth.getCurrentUser);
  const pendingUsers = useQuery(api.user.admin.getPendingRegistrations);
  
  const approveUser = useMutation(api.user.admin.approveUser);
  const rejectUser = useMutation(api.user.admin.rejectUser);
  
  const [rejectionReason, setRejectionReason] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRole, setSelectedRole] = useState<string>("all");

  useEffect(() => {
    if (!isLoaded || !isSignedIn) {
      router.push("/");
      return;
    }

    if (currentUser !== undefined && currentUser) {
      if (currentUser.role !== "admin") {
        router.push("/dashboard");
      } else if (currentUser.status !== "approved" && currentUser.status !== "active") {
        router.push("/pending-approval");
      }
    }
  }, [isLoaded, isSignedIn, currentUser, router]);

  const handleApprove = async (userId: string) => {
    setIsSubmitting((prev) => ({ ...prev, [userId]: true }));
    setError(null);
    
    try {
      await approveUser({ userId: userId as any });
      setSuccessMessage("✅ تم الموافقة على المستخدم بنجاح");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "فشل في الموافقة على المستخدم";
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
      setSuccessMessage("❌ تم رفض المستخدم بنجاح");
      setRejectionReason((prev) => ({ ...prev, [userId]: "" }));
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "فشل في رفض المستخدم";
      setError(errorMsg);
    } finally {
      setIsSubmitting((prev) => ({ ...prev, [userId]: false }));
    }
  };

  const getRoleLabel = (role: string) => {
    const roles: Record<string, string> = {
      student: "طالب",
      teacher: "معلم",
      parent: "ولي أمر",
      admin: "مشرف",
    };
    return roles[role] || role;
  };

  const getRoleColor = (role: string) => {
    const colors: Record<string, string> = {
      student: "bg-blue-100 text-blue-700 border-blue-200",
      teacher: "bg-purple-100 text-purple-700 border-purple-200",
      parent: "bg-green-100 text-green-700 border-green-200",
      admin: "bg-red-100 text-red-700 border-red-200",
    };
    return colors[role] || "bg-gray-100 text-gray-700 border-gray-200";
  };

  const getRoleIcon = (role: string) => {
    const icons: Record<string, any> = {
      student: Users,
      teacher: User,
      parent: Users,
      admin: Shield,
    };
    return icons[role] || User;
  };

  // فلتر المستخدمين
  const filteredUsers = pendingUsers?.filter((user) => {
    const matchSearch = 
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchRole = selectedRole === "all" || user.role === selectedRole;
    return matchSearch && matchRole;
  });

  if (!isLoaded || !currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f7fafa]">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-[#1a7a8a] mx-auto mb-4" />
          <p className="text-gray-600 font-medium">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  if (currentUser.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f7fafa] p-4">
        <div className="text-center bg-white rounded-2xl border border-[#c0c8c9] p-8 max-w-md">
          <XCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-[#001f24] mb-2">وصول غير مصرح</h1>
          <p className="text-gray-600">يجب أن تكون مشرفاً للوصول إلى هذه الصفحة.</p>
        </div>
      </div>
    );
  }

  const pendingCount = pendingUsers?.length || 0;

  return (
    <div className="min-h-screen bg-[#f7fafa]">
      {/* Header */}
      <div className="bg-linear-to-r from-[#001f24] to-[#03363d] px-8 py-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-xl">
              <UserCheck className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">موافقات المستخدمين</h1>
              <p className="text-[#a3ced6] text-sm mt-0.5">
                مراجعة والموافقة على تسجيلات المستخدمين الجدد
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 border border-[#c0c8c9] hover:shadow-sm transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-[#001f24]">{pendingCount}</p>
                <p className="text-xs text-gray-500">بانتظار الموافقة</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                <Clock className="h-5 w-5 text-amber-500" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-[#c0c8c9] hover:shadow-sm transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-[#001f24]">0</p>
                <p className="text-xs text-gray-500">تمت الموافقة اليوم</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-green-500" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-[#c0c8c9] hover:shadow-sm transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-[#001f24]">{pendingUsers?.filter(u => u.role === "student").length || 0}</p>
                <p className="text-xs text-gray-500">طلاب منتظرين</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                <UserPlus className="h-5 w-5 text-blue-500" />
              </div>
            </div>
          </div>
        </div>

        {/* Error / Success Messages */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-500 shrink-0" />
            <p className="text-red-700 text-sm font-medium flex-1">{error}</p>
            <button onClick={() => setError(null)} className="p-1 hover:bg-red-100 rounded-lg transition-colors">
              <X className="h-4 w-4 text-red-400" />
            </button>
          </div>
        )}

        {successMessage && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3">
            <Check className="h-5 w-5 text-green-500 shrink-0" />
            <p className="text-green-700 text-sm font-medium flex-1">{successMessage}</p>
            <button onClick={() => setSuccessMessage(null)} className="p-1 hover:bg-green-100 rounded-lg transition-colors">
              <X className="h-4 w-4 text-green-400" />
            </button>
          </div>
        )}

        {/* Search and Filter */}
        <div className="bg-white rounded-xl border border-[#c0c8c9] p-4 mb-6">
          <div className="flex flex-wrap gap-3">
            <div className="flex-1 min-w-50 relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="بحث بالاسم أو البريد الإلكتروني..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full border border-gray-200 rounded-lg pr-9 pl-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a7a8a]"
              />
            </div>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="border border-gray-200 rounded-lg px-4 py-2 text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#1a7a8a] bg-white"
            >
              <option value="all">جميع الأدوار</option>
              <option value="student">طالب</option>
              <option value="teacher">معلم</option>
              <option value="parent">ولي أمر</option>
              <option value="admin">مشرف</option>
            </select>
            <button
              onClick={() => { setSearchQuery(""); setSelectedRole("all"); }}
              className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors"
            >
              <Filter className="h-4 w-4" />
              إعادة ضبط
            </button>
          </div>
        </div>

        {/* Pending Users List */}
        <div className="bg-white rounded-xl border border-[#c0c8c9] overflow-hidden">
          {pendingUsers === undefined ? (
            <div className="p-12 text-center">
              <Loader2 className="h-8 w-8 animate-spin text-[#1a7a8a] mx-auto mb-3" />
              <p className="text-gray-500">جاري تحميل المستخدمين...</p>
            </div>
          ) : filteredUsers?.length === 0 ? (
            <div className="p-12 text-center">
              <div className="text-6xl mb-4">✅</div>
              <p className="text-gray-600 font-medium text-lg">تم مراجعة جميع التسجيلات!</p>
              <p className="text-gray-400 text-sm mt-1">لا توجد موافقات معلقة حالياً.</p>
            </div>
          ) : (
            <div className="divide-y divide-[#c0c8c9]">
              {filteredUsers?.map((user) => {
                const RoleIcon = getRoleIcon(user.role);
                return (
                  <div key={user._id} className="p-6 hover:bg-[#f7fafa] transition-colors">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                      {/* User Info */}
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-linear-to-br from-[#e0f5f7] to-[#1a7a8a]/20 flex items-center justify-center shrink-0">
                            <span className="text-[#1a7a8a] font-bold text-lg">
                              {user.name?.charAt(0)?.toUpperCase() || "?"}
                            </span>
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-[#001f24]">{user.name}</h3>
                            <div className="flex items-center gap-3 mt-1 flex-wrap">
                              <span className="text-sm text-gray-500 flex items-center gap-1">
                                <Mail className="h-3.5 w-3.5" />
                                {user.email}
                              </span>
                              {user.phoneNumber && (
                                <span className="text-sm text-gray-500 flex items-center gap-1">
                                  <Phone className="h-3.5 w-3.5" />
                                  {user.phoneNumber}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Role Badge & Date */}
                      <div className="flex items-center gap-3 shrink-0">
                        <span className={`px-3 py-1 text-sm font-semibold rounded-full border ${getRoleColor(user.role)} flex items-center gap-1.5`}>
                          <RoleIcon className="h-3.5 w-3.5" />
                          {getRoleLabel(user.role)}
                        </span>
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(user.createdAt).toLocaleDateString("ar-EG")}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-3">
                      <div className="md:col-span-2">
                        <textarea
                          value={rejectionReason[user._id] || ""}
                          onChange={(e) =>
                            setRejectionReason((prev) => ({
                              ...prev,
                              [user._id]: e.target.value,
                            }))
                          }
                          placeholder="سبب الرفض (اختياري)..."
                          className="w-full px-3 py-2 border border-[#c0c8c9] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1a7a8a] resize-none h-10.5"
                          rows={1}
                        />
                      </div>
                      <button
                        onClick={() => handleApprove(user._id)}
                        disabled={isSubmitting[user._id]}
                        className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white font-semibold py-2.5 px-4 rounded-lg transition-colors"
                      >
                        {isSubmitting[user._id] ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Check className="h-4 w-4" />
                        )}
                        موافقة
                      </button>
                      <button
                        onClick={() => handleReject(user._id)}
                        disabled={isSubmitting[user._id]}
                        className="flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-300 text-white font-semibold py-2.5 px-4 rounded-lg transition-colors"
                      >
                        {isSubmitting[user._id] ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <X className="h-4 w-4" />
                        )}
                        رفض
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-4 flex items-center justify-between text-xs text-gray-400">
          <span>عرض {filteredUsers?.length || 0} من {pendingUsers?.length || 0} مستخدم</span>
          <span>آخر تحديث: {new Date().toLocaleTimeString("ar-EG")}</span>
        </div>
      </div>
    </div>
  );
}