"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import {
  Users, Check, X, Eye, Search, Loader2,
  Phone, Mail, MapPin, GraduationCap, BookOpen,
  Calendar, CreditCard, AlertCircle, CheckCircle,
  Clock, User, Briefcase, FileText, Image,
  ChevronDown, Filter, RefreshCw, Link2, Link2Off,
  UserPlus,
} from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

// ── Helpers ───────────────────────────────────────────────────────
function formatDate(ts?: number) {
  if (!ts) return "—";
  return format(new Date(ts), "dd MMM yyyy", { locale: ar });
}

function formatDateTime(ts?: number) {
  if (!ts) return "—";
  return format(new Date(ts), "dd MMM yyyy – HH:mm", { locale: ar });
}

const roleMap: Record<string, { label: string; color: string }> = {
  student: { label: "طالب",     color: "bg-blue-100 text-blue-700"   },
  teacher: { label: "معلم",     color: "bg-purple-100 text-purple-700" },
  parent:  { label: "ولي أمر", color: "bg-green-100 text-green-700"  },
  admin:   { label: "أدمن",    color: "bg-red-100 text-red-700"      },
};

// ═══════════════════════════════════════════════════════════════════
export default function AdminApprovalsPage() {
  const [search, setSearch]             = useState("");
  const [roleFilter, setRoleFilter]     = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [approvingId, setApprovingId]   = useState<string | null>(null);
  const [rejectingId, setRejectingId]   = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectInput, setShowRejectInput] = useState<string | null>(null);
  const [imageModalUrl, setImageModalUrl] = useState<string | null>(null);
  const [expandedParent, setExpandedParent] = useState<string | null>(null);

  // ── Queries ───────────────────────────────────────────────────
  const pendingUsers     = useQuery(api.user.admin.getPendingRegistrations);
  const approvalRequests = useQuery(api.admin.approvals.listApprovalRequests);
  const parentLinks      = useQuery(api.relationships.parentStudent.getAllParentStudentLinks);

  const approveUser = useMutation(api.user.admin.approveUser);
  const rejectUser  = useMutation(api.user.admin.rejectUser);

  // ── Enrich users with approval/payment data ───────────────────
  const users = (pendingUsers ?? []).map((user: any) => {
    const request = (approvalRequests ?? []).find(
      (r: any) => r.studentId === user._id || r.userId === user._id
    );
    
    // ✅ جلب الطلاب المرتبطين بولي الأمر
    let linkedStudents: any[] = [];
    let hasStudents = false;
    
    if (user.role === "parent" && parentLinks) {
      const links = parentLinks.filter((link: any) => link.parentId === user._id);
      linkedStudents = links.map((link: any) => ({
        studentId: link.studentId,
        studentName: link.student?.name || "غير معروف",
        studentEmail: link.student?.email || "لا يوجد بريد", // ✅ التأكد من وجود البريد
        student: link.student,
        relationship: link.relationship || "ولي أمر",
        isPrimary: link.isPrimary || false,
      }));
      hasStudents = linkedStudents.length > 0;
    }
    
    return {
      ...user,
      approvalRequest: request ?? null,
      hasPaid: !!request?.paymentProof,
      receiptUrl: request?.paymentProof ?? null,
      requestedAt: request?.createdAt ?? null,
      amount: request?.amount ?? null,
      currency: request?.currency ?? null,
      referenceNumber: request?.referenceNumber ?? null,
      requestStatus: request?.status ?? null,
      linkedStudents,
      hasStudents,
      // ✅ التأكد من وجود البريد الإلكتروني
      displayEmail: user.email || "لا يوجد بريد",
    };
  });

  // ── Filters ───────────────────────────────────────────────────
  const filtered = users.filter((u: any) => {
    const matchSearch =
      !search ||
      u.name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase()) ||
      u.phoneNumber?.includes(search) ||
      u.displayEmail?.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === "all" || u.role === roleFilter;
    const matchPayment =
      paymentFilter === "all" ||
      (paymentFilter === "paid"   &&  u.hasPaid) ||
      (paymentFilter === "unpaid" && !u.hasPaid);
    return matchSearch && matchRole && matchPayment;
  });

  const paidCount   = users.filter((u: any) =>  u.hasPaid).length;
  const unpaidCount = users.filter((u: any) => !u.hasPaid).length;

  // ── Actions ───────────────────────────────────────────────────
  const handleApprove = async (userId: string) => {
    setApprovingId(userId);
    try {
      await approveUser({ userId: userId as Id<"users"> });
      if (selectedUser?._id === userId) setSelectedUser(null);
    } catch (err: any) {
      alert(err.message || "حدث خطأ");
    } finally {
      setApprovingId(null);
    }
  };

  const handleReject = async (userId: string) => {
    setRejectingId(userId);
    try {
      await rejectUser({
        userId: userId as Id<"users">,
        reason: rejectReason || undefined,
      });
      setShowRejectInput(null);
      setRejectReason("");
      if (selectedUser?._id === userId) setSelectedUser(null);
    } catch (err: any) {
      alert(err.message || "حدث خطأ");
    } finally {
      setRejectingId(null);
    }
  };

  const toggleExpandParent = (userId: string) => {
    setExpandedParent(expandedParent === userId ? null : userId);
  };

  // ── Loading ───────────────────────────────────────────────────
  if (pendingUsers === undefined) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-[#1a7a8a]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7fafa]" dir="rtl">
      {/* Header */}
      <header className="bg-linear-to-r from-[#001f24] to-[#03363d] px-8 py-5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <Users className="h-5 w-5" /> طلبات التسجيل
            </h1>
            <p className="text-[#a3ced6] text-sm mt-0.5">
              مراجعة والموافقة على طلبات التسجيل الجديدة
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs bg-white/15 text-white px-3 py-1.5 rounded-full border border-white/20">
              {users.length} طلب معلق
            </span>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "إجمالي الطلبات", value: users.length,  icon: Users,        bg: "bg-blue-50",   color: "text-blue-500"   },
            { label: "دفعوا الإيصال",  value: paidCount,    icon: CheckCircle,  bg: "bg-green-50",  color: "text-green-500"  },
            { label: "لم يدفعوا بعد", value: unpaidCount,  icon: AlertCircle,  bg: "bg-amber-50",  color: "text-amber-500"  },
          ].map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.label} className="bg-white rounded-xl p-5 border border-[#c0c8c9] flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-[#001f24]">{s.value}</p>
                  <p className="text-xs text-gray-500 mt-1">{s.label}</p>
                </div>
                <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center`}>
                  <Icon className={`h-5 w-5 ${s.color}`} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl border border-[#c0c8c9] p-4 flex flex-wrap gap-3 items-center">
          <div className="flex-1 min-w-50 relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              placeholder="بحث بالاسم أو الإيميل أو الهاتف..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full border border-gray-200 rounded-lg pr-9 pl-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a7a8a]/20"
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none"
          >
            <option value="all">جميع الأدوار</option>
            <option value="student">طالب</option>
            <option value="teacher">معلم</option>
            <option value="parent">ولي أمر</option>
          </select>
          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none"
          >
            <option value="all">جميع الطلبات</option>
            <option value="paid">دفعوا الإيصال</option>
            <option value="unpaid">لم يدفعوا</option>
          </select>
          {(search || roleFilter !== "all" || paymentFilter !== "all") && (
            <button
              onClick={() => { setSearch(""); setRoleFilter("all"); setPaymentFilter("all"); }}
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 border border-gray-200 px-3 py-2 rounded-lg"
            >
              <RefreshCw className="h-3.5 w-3.5" /> إعادة ضبط
            </button>
          )}
        </div>

        {/* Main layout */}
        <div className={`grid gap-6 ${selectedUser ? "lg:grid-cols-5" : "grid-cols-1"}`}>

          {/* ── Users list ─────────────────────────────────────── */}
          <div className={selectedUser ? "lg:col-span-2" : "col-span-1"}>
            <div className="bg-white rounded-xl border border-[#c0c8c9] overflow-hidden">
              {filtered.length === 0 ? (
                <div className="py-16 text-center">
                  <Users className="h-12 w-12 text-gray-200 mx-auto mb-3" />
                  <p className="text-gray-400 text-sm">لا توجد طلبات تسجيل معلقة</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {filtered.map((user: any) => {
                    const role = roleMap[user.role];
                    const isSelected = selectedUser?._id === user._id;
                    return (
                      <div
                        key={user._id}
                        onClick={() => setSelectedUser(isSelected ? null : user)}
                        className={`flex items-center gap-4 px-5 py-4 cursor-pointer transition-colors ${
                          isSelected ? "bg-[#e0f5f7]" : "hover:bg-[#f7fafa]"
                        }`}
                      >
                        {/* Avatar */}
                        <div className="w-11 h-11 rounded-xl bg-[#001f24] flex items-center justify-center text-white font-bold text-lg shrink-0">
                          {user.name?.charAt(0) ?? "؟"}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-semibold text-[#001f24] text-sm truncate">
                              {user.name}
                            </p>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${role?.color ?? "bg-gray-100 text-gray-600"}`}>
                              {role?.label ?? user.role}
                            </span>
                            {/* ✅ أيقونة حالة الاتصال بولي الأمر */}
                            {user.role === "parent" && (
                              user.hasStudents ? (
                                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                                  <Link2 className="h-3 w-3" />
                                  متصل بـ {user.linkedStudents.length} طالب
                                </span>
                              ) : (
                                <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                                  <Link2Off className="h-3 w-3" />
                                  غير متصل
                                </span>
                              )
                            )}
                          </div>
                          {/* ✅ عرض البريد الإلكتروني بشكل صحيح */}
                          <p className="text-xs text-gray-400 truncate mt-0.5">
                            <Mail className="h-3 w-3 inline ml-1" />
                            {user.displayEmail || user.email || "لا يوجد بريد"}
                          </p>
                          <div className="flex items-center gap-3 mt-1">
                            {user.hasPaid ? (
                              <span className="flex items-center gap-1 text-xs text-green-600">
                                <CheckCircle className="h-3 w-3" /> رفع إيصال
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-xs text-amber-600">
                                <AlertCircle className="h-3 w-3" /> لم يدفع
                              </span>
                            )}
                            <span className="text-xs text-gray-400">
                              {formatDate(user.createdAt)}
                            </span>
                          </div>
                        </div>

                        {/* Quick actions */}
                        <div className="flex flex-col gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => handleApprove(user._id)}
                            disabled={approvingId === user._id}
                            className="w-8 h-8 bg-green-500 hover:bg-green-600 text-white rounded-lg flex items-center justify-center transition-colors disabled:opacity-50"
                            title="موافقة"
                          >
                            {approvingId === user._id
                              ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              : <Check className="h-3.5 w-3.5" />
                            }
                          </button>
                          <button
                            onClick={() => setShowRejectInput(user._id)}
                            className="w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded-lg flex items-center justify-center transition-colors"
                            title="رفض"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* ── User detail panel ───────────────────────────────── */}
          {selectedUser && (
            <div className="lg:col-span-3 space-y-4">

              {/* Header card */}
              <div className="bg-white rounded-xl border border-[#c0c8c9] p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-[#001f24] flex items-center justify-center text-white text-2xl font-bold">
                      {selectedUser.name?.charAt(0)}
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-[#001f24]">{selectedUser.name}</h2>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${roleMap[selectedUser.role]?.color}`}>
                          {roleMap[selectedUser.role]?.label}
                        </span>
                        {selectedUser.hasPaid ? (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <CheckCircle className="h-3 w-3" /> دفع الإيصال
                          </span>
                        ) : (
                          <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" /> لم يدفع بعد
                          </span>
                        )}
                      </div>
                      {/* ✅ عرض البريد الإلكتروني في الـ Header */}
                      <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {selectedUser.displayEmail || selectedUser.email || "لا يوجد بريد"}
                      </p>
                      <p className="text-xs text-gray-400">
                        تاريخ التسجيل: {formatDateTime(selectedUser.createdAt)}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedUser(null)}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                  >
                    <X className="h-4 w-4 text-gray-400" />
                  </button>
                </div>

                {/* ✅ عرض حالة الاتصال بولي الأمر */}
                {selectedUser.role === "parent" && (
                  <div className="mb-4 p-3 rounded-xl border">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {selectedUser.hasStudents ? (
                          <>
                            <Link2 className="h-5 w-5 text-green-500" />
                            <span className="text-sm font-medium text-green-700">
                              متصل بـ {selectedUser.linkedStudents.length} طالب
                            </span>
                          </>
                        ) : (
                          <>
                            <Link2Off className="h-5 w-5 text-red-500" />
                            <span className="text-sm font-medium text-red-700">
                              غير متصل بأي طالب
                            </span>
                          </>
                        )}
                      </div>
                      {selectedUser.hasStudents && (
                        <button
                          onClick={() => toggleExpandParent(selectedUser._id)}
                          className="text-xs text-[#1a7a8a] hover:underline flex items-center gap-1"
                        >
                          {expandedParent === selectedUser._id ? "إخفاء" : "عرض الطلاب"}
                          <ChevronDown className={`h-3 w-3 transition-transform ${expandedParent === selectedUser._id ? "rotate-180" : ""}`} />
                        </button>
                      )}
                    </div>
                    
                    {/* ✅ عرض قائمة الطلاب المرتبطين مع البريد الإلكتروني */}
                    {expandedParent === selectedUser._id && selectedUser.hasStudents && (
                      <div className="mt-3 space-y-2 border-t pt-3">
                        {selectedUser.linkedStudents.map((student: any, idx: number) => (
                          <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center">
                                <span className="text-blue-600 font-bold text-xs">
                                  {student.studentName?.charAt(0) || "ط"}
                                </span>
                              </div>
                              <div>
                                <p className="text-sm font-medium text-[#001f24]">{student.studentName}</p>
                                {/* ✅ عرض البريد الإلكتروني للطالب */}
                                <p className="text-xs text-gray-400 flex items-center gap-1">
                                  <Mail className="h-3 w-3" />
                                  {student.studentEmail || student.student?.email || "لا يوجد بريد"}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                                {student.relationship}
                              </span>
                              {student.isPrimary && (
                                <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                                  رئيسي
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Action buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={() => handleApprove(selectedUser._id)}
                    disabled={approvingId === selectedUser._id}
                    className="flex-1 flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 disabled:opacity-60 text-white font-semibold py-2.5 rounded-xl transition-colors text-sm"
                  >
                    {approvingId === selectedUser._id
                      ? <Loader2 className="h-4 w-4 animate-spin" />
                      : <Check className="h-4 w-4" />
                    }
                    موافقة على الطلب
                  </button>
                  <button
                    onClick={() => setShowRejectInput(selectedUser._id)}
                    className="flex-1 flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 text-white font-semibold py-2.5 rounded-xl transition-colors text-sm"
                  >
                    <X className="h-4 w-4" /> رفض الطلب
                  </button>
                </div>

                {/* Reject reason input */}
                {showRejectInput === selectedUser._id && (
                  <div className="mt-3 space-y-2">
                    <input
                      type="text"
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      placeholder="سبب الرفض (اختياري)"
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-200"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleReject(selectedUser._id)}
                        disabled={rejectingId === selectedUser._id}
                        className="flex-1 bg-red-500 hover:bg-red-600 disabled:opacity-60 text-white text-sm font-medium py-2 rounded-lg"
                      >
                        {rejectingId === selectedUser._id
                          ? <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                          : "تأكيد الرفض"
                        }
                      </button>
                      <button
                        onClick={() => { setShowRejectInput(null); setRejectReason(""); }}
                        className="flex-1 border border-gray-200 text-gray-600 text-sm py-2 rounded-lg hover:bg-gray-50"
                      >
                        إلغاء
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Contact info */}
              <div className="bg-white rounded-xl border border-[#c0c8c9] p-5">
                <h3 className="text-sm font-bold text-[#001f24] mb-4 flex items-center gap-2">
                  <User className="h-4 w-4 text-[#1a7a8a]" /> معلومات التواصل
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                      <Mail className="h-4 w-4 text-blue-500" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">البريد الإلكتروني</p>
                      <p className="text-sm text-[#001f24] font-medium">
                        {selectedUser.displayEmail || selectedUser.email || "لا يوجد بريد"}
                      </p>
                    </div>
                  </div>
                  {selectedUser.phoneNumber && (
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center shrink-0">
                        <Phone className="h-4 w-4 text-green-500" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">رقم الهاتف</p>
                        <p className="text-sm text-[#001f24] font-medium">{selectedUser.phoneNumber}</p>
                      </div>
                    </div>
                  )}
                  {selectedUser.address && (
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center shrink-0">
                        <MapPin className="h-4 w-4 text-purple-500" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">العنوان</p>
                        <p className="text-sm text-[#001f24] font-medium">{selectedUser.address}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Role-specific details */}
              {selectedUser.role === "student" && (
                <div className="bg-white rounded-xl border border-[#c0c8c9] p-5">
                  <h3 className="text-sm font-bold text-[#001f24] mb-4 flex items-center gap-2">
                    <GraduationCap className="h-4 w-4 text-[#1a7a8a]" /> بيانات الطالب
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { label: "تاريخ الميلاد", value: formatDate(selectedUser.birthDate), icon: Calendar },
                      { label: "الجنس",          value: selectedUser.gender === "male" ? "ذكر" : selectedUser.gender === "female" ? "أنثى" : "—", icon: User },
                      { label: "الصف",           value: selectedUser.grade ?? "غير محدد", icon: GraduationCap },
                      { label: "رقم الطالب",     value: selectedUser.studentId ?? "سيتم توليده", icon: FileText },
                      { label: "البريد الإلكتروني", value: selectedUser.displayEmail || selectedUser.email || "لا يوجد بريد", icon: Mail },
                    ].map((item) => {
                      const Icon = item.icon;
                      return (
                        <div key={item.label} className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                            <Icon className="h-3.5 w-3.5 text-blue-500" />
                          </div>
                          <div>
                            <p className="text-xs text-gray-400">{item.label}</p>
                            <p className="text-sm text-[#001f24] font-medium">{item.value}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {selectedUser.role === "teacher" && (
                <div className="bg-white rounded-xl border border-[#c0c8c9] p-5">
                  <h3 className="text-sm font-bold text-[#001f24] mb-4 flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-[#1a7a8a]" /> بيانات المعلم
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { label: "التخصص",       value: selectedUser.specialization ?? "—" },
                      { label: "المؤهل",        value: selectedUser.qualification  ?? "—" },
                      { label: "سنوات الخبرة", value: selectedUser.experience != null ? `${selectedUser.experience} سنة` : "—" },
                      { label: "رقم المعلم",   value: selectedUser.teacherId ?? "سيتم توليده" },
                      { label: "البريد الإلكتروني", value: selectedUser.displayEmail || selectedUser.email || "لا يوجد بريد", icon: Mail },
                    ].map((item) => (
                      <div key={item.label}>
                        <p className="text-xs text-gray-400">{item.label}</p>
                        <p className="text-sm text-[#001f24] font-medium mt-0.5">{item.value}</p>
                      </div>
                    ))}
                  </div>
                  {selectedUser.subjects && selectedUser.subjects.length > 0 && (
                    <div className="mt-4">
                      <p className="text-xs text-gray-400 mb-2">المواد التي يدرسها</p>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedUser.subjects.map((s: string) => (
                          <span key={s} className="text-xs bg-purple-50 text-purple-700 px-2.5 py-1 rounded-full">
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {selectedUser.role === "parent" && (
                <div className="bg-white rounded-xl border border-[#c0c8c9] p-5">
                  <h3 className="text-sm font-bold text-[#001f24] mb-4 flex items-center gap-2">
                    <Users className="h-4 w-4 text-[#1a7a8a]" /> بيانات ولي الأمر
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { label: "صلة القرابة",    value: selectedUser.relationship ?? "—"  },
                      { label: "المسمى الوظيفي", value: selectedUser.jobTitle     ?? "—"  },
                      { label: "هاتف العمل",     value: selectedUser.workPhone    ?? "—"  },
                      { label: "الرقم القومي",   value: selectedUser.nationalId   ?? "—"  },
                      { label: "البريد الإلكتروني", value: selectedUser.displayEmail || selectedUser.email || "لا يوجد بريد", icon: Mail },
                    ].map((item) => (
                      <div key={item.label}>
                        <p className="text-xs text-gray-400">{item.label}</p>
                        <p className="text-sm text-[#001f24] font-medium mt-0.5">{item.value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Payment / Receipt section */}
              <div className="bg-white rounded-xl border border-[#c0c8c9] p-5">
                <h3 className="text-sm font-bold text-[#001f24] mb-4 flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-[#1a7a8a]" /> حالة الدفع
                </h3>

                {selectedUser.hasPaid ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-green-50 border border-green-100 rounded-xl">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        <div>
                          <p className="text-sm font-semibold text-green-700">تم رفع الإيصال</p>
                          {selectedUser.requestedAt && (
                            <p className="text-xs text-green-600 mt-0.5">
                              {formatDateTime(selectedUser.requestedAt)}
                            </p>
                          )}
                        </div>
                      </div>
                      {selectedUser.amount != null && selectedUser.amount > 0 && (
                        <div className="text-left">
                          <p className="text-lg font-bold text-green-700">{selectedUser.amount}</p>
                          <p className="text-xs text-green-600">{selectedUser.currency || "ج.م"}</p>
                        </div>
                      )}
                    </div>

                    {selectedUser.referenceNumber && (
                      <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                        <p className="text-xs text-gray-400">رقم المرجع</p>
                        <p className="text-sm font-medium text-[#001f24]">{selectedUser.referenceNumber}</p>
                      </div>
                    )}

                    {selectedUser.receiptUrl && (
                      <div>
                        <p className="text-xs text-gray-400 mb-2 flex items-center gap-1">
                          <Image className="h-3.5 w-3.5" /> صورة الإيصال
                        </p>
                        <div
                          className="relative rounded-xl overflow-hidden border border-gray-200 cursor-pointer group"
                          onClick={() => setImageModalUrl(selectedUser.receiptUrl)}
                        >
                          <img
                            src={selectedUser.receiptUrl}
                            alt="إيصال الدفع"
                            className="w-full h-48 object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = "/images/no-image.png";
                            }}
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                            <Eye className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        </div>
                        <button
                          onClick={() => setImageModalUrl(selectedUser.receiptUrl)}
                          className="w-full mt-2 flex items-center justify-center gap-2 text-sm text-[#1a7a8a] hover:text-[#001f24] border border-[#1a7a8a]/20 hover:border-[#1a7a8a] py-2 rounded-xl transition-colors"
                        >
                          <Eye className="h-4 w-4" /> عرض بالحجم الكامل
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-100 rounded-xl">
                    <AlertCircle className="h-5 w-5 text-amber-500 shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-amber-700">لم يتم رفع إيصال الدفع</p>
                      <p className="text-xs text-amber-600 mt-0.5">
                        يمكنك الموافقة على الطلب بدون إيصال إذا أردت
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Image modal ──────────────────────────────────────────── */}
      {imageModalUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setImageModalUrl(null)}
        >
          <div className="relative max-w-2xl w-full" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setImageModalUrl(null)}
              className="absolute -top-10 left-0 text-white hover:text-gray-300 flex items-center gap-2 text-sm"
            >
              <X className="h-5 w-5" /> إغلاق
            </button>
            <img
              src={imageModalUrl}
              alt="إيصال الدفع"
              className="w-full rounded-2xl shadow-2xl"
              onError={(e) => {
                (e.target as HTMLImageElement).src = "/images/no-image.png";
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}