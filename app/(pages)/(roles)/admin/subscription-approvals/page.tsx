// app/(pages)/(roles)/admin/subscription-approvals/page.tsx

"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import {
  Users, Check, X, Eye, Search, Loader2,
  Phone, Mail, MapPin, GraduationCap, BookOpen,
  Calendar, CreditCard, AlertCircle, CheckCircle,
  Clock, User, Briefcase, FileText, Image,
  ChevronDown, Filter, RefreshCw, DollarSign,
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

// ═══════════════════════════════════════════════════════════════════
export default function AdminSubscriptionApprovalsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectInput, setShowRejectInput] = useState<string | null>(null);
  const [imageModalUrl, setImageModalUrl] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [receiptUrls, setReceiptUrls] = useState<Record<string, string>>({});
  const [loadingReceipts, setLoadingReceipts] = useState<Record<string, boolean>>({});

  // ── Queries ───────────────────────────────────────────────────
  const subscriptionRequests = useQuery(
    api.user.admin.getAllSubscriptionRequests
  );

  // ── Mutations ───────────────────────────────────────────────────
  const approveUser = useMutation(api.user.admin.approveUser);
  const rejectUser = useMutation(api.user.admin.rejectUser);
  const getFileUrl = useMutation(api.teacherMaterials.teacherMaterials.getFileUrl);
  const updateSubscriptionStatus = useMutation(api.user.auth.updateSubscriptionStatus);
  const updateTransactionStatusByReference = useMutation(
    api.transactions.transactions.updateTransactionStatusByReference
  );

  // ✅ جلب رابط الإيصال عند اختيار طلب
  useEffect(() => {
    const fetchReceiptUrl = async () => {
      if (!selectedRequest?.paymentProof) return;
      if (receiptUrls[selectedRequest._id]) return;
      
      const isStorageId = selectedRequest.paymentProof && 
        !selectedRequest.paymentProof.startsWith("http") && 
        !selectedRequest.paymentProof.startsWith("data:image") && 
        !selectedRequest.paymentProof.startsWith("/api/storage/");
      
      if (!isStorageId) {
        setReceiptUrls(prev => ({ ...prev, [selectedRequest._id]: selectedRequest.paymentProof }));
        return;
      }
      
      setLoadingReceipts(prev => ({ ...prev, [selectedRequest._id]: true }));
      try {
        const url = await getFileUrl({ 
          storageId: selectedRequest.paymentProof as any 
        });
        if (url) {
          setReceiptUrls(prev => ({ ...prev, [selectedRequest._id]: url }));
        }
      } catch (error) {
        console.error("Error fetching receipt URL:", error);
      } finally {
        setLoadingReceipts(prev => ({ ...prev, [selectedRequest._id]: false }));
      }
    };

    fetchReceiptUrl();
  }, [selectedRequest, getFileUrl, receiptUrls]);

  // ── استخدام البيانات مباشرة ──────────────────────────────────
  const requests = subscriptionRequests || [];

  // ── فلترة الطلبات ──────────────────────────────────────────
  const filtered = requests.filter((r: any) => {
    const matchSearch =
      !search ||
      r.studentName?.toLowerCase().includes(search.toLowerCase()) ||
      r.studentEmail?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || r.displayStatus === statusFilter || r.status === statusFilter;
    return matchSearch && matchStatus;
  });

  // ── إحصائيات ──────────────────────────────────────────────────
  const stats = {
    total: requests.length,
    pending: requests.filter((r: any) => r.status === "pending" || r.displayStatus === "pending").length,
    approved: requests.filter((r: any) => r.status === "approved" || r.displayStatus === "approved").length,
    rejected: requests.filter((r: any) => r.status === "rejected" || r.displayStatus === "rejected").length,
    totalAmount: requests.reduce((sum: number, r: any) => sum + (r.amount || 0), 0),
  };

  // ── Actions ───────────────────────────────────────────────────
  const handleApprove = async (requestId: string, studentId: string) => {
    setApprovingId(requestId);
    setActionSuccess(null);
    try {
      // ✅ 1. تحديث حالة المستخدم إلى active
      await approveUser({ 
        userId: studentId as Id<"users">,
        approveSubscription: true,
      });
      
      // ✅ 2. تحديث حالة الاشتراك
      await updateSubscriptionStatus({
        userId: studentId as Id<"users">,
        status: "active",
      });

      // ✅ 3. تحديث حالة المعاملة إلى completed
      await updateTransactionStatusByReference({
        referenceId: requestId,
        status: "completed",
      });
      
      setActionSuccess("✅ تمت الموافقة على الاشتراك بنجاح");
      if (selectedRequest?._id === requestId) setSelectedRequest(null);
    } catch (err: any) {
      alert(err.message || "حدث خطأ");
    } finally {
      setApprovingId(null);
    }
  };

  const handleReject = async (requestId: string, studentId: string) => {
    setRejectingId(requestId);
    setActionSuccess(null);
    try {
      // ✅ 1. تحديث حالة المستخدم إلى rejected
      await rejectUser({
        userId: studentId as Id<"users">,
        reason: rejectReason || "تم رفض الاشتراك",
        rejectSubscription: true,
      });
      
      // ✅ 2. تحديث حالة الاشتراك
      await updateSubscriptionStatus({
        userId: studentId as Id<"users">,
        status: "rejected",
      });

      // ✅ 3. تحديث حالة المعاملة إلى failed
      await updateTransactionStatusByReference({
        referenceId: requestId,
        status: "failed",
      });
      
      setShowRejectInput(null);
      setRejectReason("");
      setActionSuccess("❌ تم رفض الاشتراك");
      if (selectedRequest?._id === requestId) setSelectedRequest(null);
    } catch (err: any) {
      alert(err.message || "حدث خطأ");
    } finally {
      setRejectingId(null);
    }
  };

  // ── Loading ───────────────────────────────────────────────────
  if (subscriptionRequests === undefined) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-[#1a7a8a]" />
      </div>
    );
  }

  // ✅ الحصول على رابط الإيصال للعرض
  const getReceiptDisplayUrl = (request: any) => {
    if (receiptUrls[request._id]) {
      return receiptUrls[request._id];
    }
    return request.paymentProof || null;
  };

  // ✅ تحديد الحالة المعروضة
  const getDisplayStatus = (request: any) => {
    return request.displayStatus || request.status || "pending";
  };

  const statusColors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-700",
    approved: "bg-green-100 text-green-700",
    rejected: "bg-red-100 text-red-700",
  };

  const statusLabels: Record<string, string> = {
    pending: "⏳ قيد المراجعة",
    approved: "✅ تمت الموافقة",
    rejected: "❌ مرفوض",
  };

  return (
    <div className="min-h-screen bg-[#f7fafa]" dir="rtl">
      {/* Header */}
      <header className="bg-linear-to-r from-[#001f24] to-[#03363d] px-8 py-5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <CreditCard className="h-5 w-5" /> طلبات الاشتراكات
            </h1>
            <p className="text-[#a3ced6] text-sm mt-0.5">
              مراجعة والموافقة على طلبات الاشتراكات المدفوعة
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs bg-white/15 text-white px-3 py-1.5 rounded-full border border-white/20">
              {stats.pending} طلب معلق
            </span>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: "إجمالي الطلبات", value: stats.total, icon: CreditCard, bg: "bg-blue-50", color: "text-blue-500" },
            { label: "قيد المراجعة", value: stats.pending, icon: Clock, bg: "bg-yellow-50", color: "text-yellow-600" },
            { label: "تمت الموافقة", value: stats.approved, icon: CheckCircle, bg: "bg-green-50", color: "text-green-600" },
            { label: "مرفوضة", value: stats.rejected, icon: X, bg: "bg-red-50", color: "text-red-600" },
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

        {/* Stats - إجمالي المبالغ */}
        <div className="bg-white rounded-xl p-4 border border-[#c0c8c9] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-[#1a7a8a]" />
            <span className="text-sm text-gray-600">إجمالي مبالغ الاشتراكات:</span>
          </div>
          <span className="text-xl font-bold text-[#1a7a8a]">
            {stats.totalAmount.toFixed(2)} <span className="text-sm font-normal">ج.م</span>
          </span>
        </div>

        {/* Success Message */}
        {actionSuccess && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            {actionSuccess}
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-xl border border-[#c0c8c9] p-4 flex flex-wrap gap-3 items-center">
          <div className="flex-1 min-w-50 relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              placeholder="بحث بالطالب أو الإيميل..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full border border-gray-200 rounded-lg pr-9 pl-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a7a8a]/20"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none"
          >
            <option value="all">جميع الحالات</option>
            <option value="pending">⏳ قيد المراجعة</option>
            <option value="approved">✅ تمت الموافقة</option>
            <option value="rejected">❌ مرفوضة</option>
          </select>
          {(search || statusFilter !== "all") && (
            <button
              onClick={() => { setSearch(""); setStatusFilter("all"); }}
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 border border-gray-200 px-3 py-2 rounded-lg"
            >
              <RefreshCw className="h-3.5 w-3.5" /> إعادة ضبط
            </button>
          )}
        </div>

        {/* Main layout */}
        <div className={`grid gap-6 ${selectedRequest ? "lg:grid-cols-5" : "grid-cols-1"}`}>

          {/* ── Requests list ──────────────────────────────────── */}
          <div className={selectedRequest ? "lg:col-span-2" : "col-span-1"}>
            <div className="bg-white rounded-xl border border-[#c0c8c9] overflow-hidden">
              {filtered.length === 0 ? (
                <div className="py-16 text-center">
                  <CreditCard className="h-12 w-12 text-gray-200 mx-auto mb-3" />
                  <p className="text-gray-400 text-sm">لا توجد طلبات اشتراك</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {filtered.map((request: any, index: number) => {
                    const isSelected = selectedRequest?._id === request._id;
                    const displayStatus = getDisplayStatus(request);
                    const statusColor = statusColors[displayStatus] || statusColors.pending;
                    const statusLabel = statusLabels[displayStatus] || statusLabels.pending;

                    return (
                      <div
                        key={`${request._id}-${index}`}
                        onClick={() => setSelectedRequest(isSelected ? null : request)}
                        className={`flex items-center gap-4 px-5 py-4 cursor-pointer transition-colors ${
                          isSelected ? "bg-[#e0f5f7]" : "hover:bg-[#f7fafa]"
                        }`}
                      >
                        {/* Avatar */}
                        <div className="w-11 h-11 rounded-xl bg-[#001f24] flex items-center justify-center text-white font-bold text-lg shrink-0">
                          {request.studentName?.charAt(0) ?? "؟"}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-semibold text-[#001f24] text-sm truncate">
                              {request.studentName}
                            </p>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${statusColor}`}>
                              {statusLabel}
                            </span>
                          </div>
                          <p className="text-xs text-gray-400 truncate mt-0.5">
                            <Mail className="h-3 w-3 inline ml-1" />
                            {request.studentEmail}
                          </p>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-xs font-medium text-[#1a7a8a]">
                              {request.amount} {request.currency}
                            </span>
                            <span className="text-xs text-gray-400">
                              {formatDate(request.createdAt)}
                            </span>
                          </div>
                        </div>

                        {/* Quick actions - فقط للطلبات المعلقة */}
                        {displayStatus === "pending" && (
                          <div className="flex flex-col gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => handleApprove(request._id, request.studentId)}
                              disabled={approvingId === request._id}
                              className="w-8 h-8 bg-green-500 hover:bg-green-600 text-white rounded-lg flex items-center justify-center transition-colors disabled:opacity-50"
                              title="موافقة"
                            >
                              {approvingId === request._id
                                ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                : <Check className="h-3.5 w-3.5" />
                              }
                            </button>
                            <button
                              onClick={() => setShowRejectInput(request._id)}
                              className="w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded-lg flex items-center justify-center transition-colors"
                              title="رفض"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* ── Request detail panel ───────────────────────────── */}
          {selectedRequest && (
            <div className="lg:col-span-3 space-y-4">
              {/* Header card */}
              <div className="bg-white rounded-xl border border-[#c0c8c9] p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-[#001f24] flex items-center justify-center text-white text-2xl font-bold">
                      {selectedRequest.studentName?.charAt(0)}
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-[#001f24]">{selectedRequest.studentName}</h2>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                          طالب
                        </span>
                        <span className="text-xs bg-[#e0f5f7] text-[#1a7a8a] px-2 py-0.5 rounded-full">
                          {selectedRequest.gradeName}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {selectedRequest.studentEmail}
                      </p>
                      {selectedRequest.studentPhone && (
                        <p className="text-xs text-gray-400 flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {selectedRequest.studentPhone}
                        </p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedRequest(null)}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                  >
                    <X className="h-4 w-4 text-gray-400" />
                  </button>
                </div>

                {/* Payment details */}
                <div className="bg-[#e0f5f7] border border-[#b0dde4] rounded-xl p-4 mb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-[#1a7a8a] font-medium">قيمة الاشتراك</p>
                      <p className="text-2xl font-bold text-[#001f24] mt-0.5">
                        {selectedRequest.amount}
                        <span className="text-sm font-normal text-gray-500 mr-1">
                          {selectedRequest.currency}
                        </span>
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-[#1a7a8a] rounded-2xl flex items-center justify-center">
                      <CreditCard className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  {selectedRequest.referenceNumber && (
                    <p className="text-xs text-gray-500 mt-2">
                      رقم المرجع: {selectedRequest.referenceNumber}
                    </p>
                  )}
                </div>

                {/* Action buttons - فقط للطلبات المعلقة */}
                {getDisplayStatus(selectedRequest) === "pending" && (
                  <>
                    <div className="flex gap-3">
                      <button
                        onClick={() => handleApprove(selectedRequest._id, selectedRequest.studentId)}
                        disabled={approvingId === selectedRequest._id}
                        className="flex-1 flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 disabled:opacity-60 text-white font-semibold py-2.5 rounded-xl transition-colors text-sm"
                      >
                        {approvingId === selectedRequest._id
                          ? <Loader2 className="h-4 w-4 animate-spin" />
                          : <Check className="h-4 w-4" />
                        }
                        موافقة على الاشتراك
                      </button>
                      <button
                        onClick={() => setShowRejectInput(selectedRequest._id)}
                        className="flex-1 flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 text-white font-semibold py-2.5 rounded-xl transition-colors text-sm"
                      >
                        <X className="h-4 w-4" /> رفض الاشتراك
                      </button>
                    </div>

                    {/* Reject reason input */}
                    {showRejectInput === selectedRequest._id && (
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
                            onClick={() => handleReject(selectedRequest._id, selectedRequest.studentId)}
                            disabled={rejectingId === selectedRequest._id}
                            className="flex-1 bg-red-500 hover:bg-red-600 disabled:opacity-60 text-white text-sm font-medium py-2 rounded-lg"
                          >
                            {rejectingId === selectedRequest._id
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
                  </>
                )}

                {getDisplayStatus(selectedRequest) !== "pending" && (
                  <div className="text-center p-3 bg-gray-50 rounded-xl">
                    <span className={`text-sm font-medium ${
                      getDisplayStatus(selectedRequest) === "approved" ? "text-green-600" : "text-red-600"
                    }`}>
                      {getDisplayStatus(selectedRequest) === "approved" 
                        ? "✅ تمت الموافقة على هذا الاشتراك"
                        : "❌ تم رفض هذا الاشتراك"
                      }
                    </span>
                  </div>
                )}
              </div>

              {/* Receipt section */}
              {selectedRequest.paymentProof && (
                <div className="bg-white rounded-xl border border-[#c0c8c9] p-5">
                  <h3 className="text-sm font-bold text-[#001f24] mb-4 flex items-center gap-2">
                    <Image className="h-4 w-4 text-[#1a7a8a]" /> إيصال الدفع
                  </h3>
                  
                  {loadingReceipts[selectedRequest._id] ? (
                    <div className="flex items-center justify-center h-48 bg-gray-100 rounded-xl">
                      <Loader2 className="h-8 w-8 animate-spin text-[#1a7a8a]" />
                    </div>
                  ) : (
                    <div
                      className="relative rounded-xl overflow-hidden border border-gray-200 cursor-pointer group"
                      onClick={() => {
                        const displayUrl = getReceiptDisplayUrl(selectedRequest);
                        if (displayUrl) setImageModalUrl(displayUrl);
                      }}
                    >
                      <img
                        src={getReceiptDisplayUrl(selectedRequest) || "/images/no-image.png"}
                        alt="إيصال الدفع"
                        className="w-full h-64 object-contain bg-gray-50"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "/images/no-image.png";
                        }}
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                        <Eye className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>
                  )}
                  {getReceiptDisplayUrl(selectedRequest) && (
                    <button
                      onClick={() => {
                        const displayUrl = getReceiptDisplayUrl(selectedRequest);
                        if (displayUrl) setImageModalUrl(displayUrl);
                      }}
                      className="w-full mt-2 flex items-center justify-center gap-2 text-sm text-[#1a7a8a] hover:text-[#001f24] border border-[#1a7a8a]/20 hover:border-[#1a7a8a] py-2 rounded-xl transition-colors"
                    >
                      <Eye className="h-4 w-4" /> عرض بالحجم الكامل
                    </button>
                  )}
                </div>
              )}

              {/* Info message */}
              {getDisplayStatus(selectedRequest) === "pending" && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                  <p className="text-sm text-amber-700 flex items-start gap-2">
                    <span className="text-lg">ℹ️</span>
                    <span>
                      هذا الطلب ينتظر الموافقة. بعد الموافقة سيتم تفعيل حساب الطالب والاشتراك.
                    </span>
                  </p>
                </div>
              )}
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