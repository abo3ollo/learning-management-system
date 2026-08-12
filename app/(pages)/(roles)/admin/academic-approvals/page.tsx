"use client";


import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import {
  Users,
  Check,
  X,
  Eye,
  Search,
  Loader2,
  Phone,
  Mail,
  Clock,
  CreditCard,
  AlertCircle,
  CheckCircle,
  FileText,
  Image,
  RefreshCw,
  DollarSign,
  BookOpen,
} from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

// ── Helpers ───────────────────────────────────────────────────────
function formatDateTime(ts?: number) {
  if (!ts) return "—";
  return format(new Date(ts), "dd MMM yyyy – HH:mm", { locale: ar });
}

// ═══════════════════════════════════════════════════════════════════
export default function AcademicApprovalsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedPurchase, setSelectedPurchase] = useState<any>(null);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectInput, setShowRejectInput] = useState<string | null>(null);
  const [imageModalUrl, setImageModalUrl] = useState<string | null>(null);

  // ── Queries ───────────────────────────────────────────────────
  const purchases = useQuery(api.academic.academic.getAllAcademicPurchases);
  const stats = useQuery(api.academic.academic.getAcademicStats);

  // ── Mutations ────────────────────────────────────────────────
  const updateStatus = useMutation(api.academic.academic.updateAcademicPurchaseStatus);

  // ── Loading ───────────────────────────────────────────────────
  if (purchases === undefined || stats === undefined) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-[#1a7a8a]" />
      </div>
    );
  }

  // ── Filters ───────────────────────────────────────────────────
  const filtered = purchases.filter((p: any) => {
    const matchSearch =
      !search ||
      p.studentName?.toLowerCase().includes(search.toLowerCase()) ||
      p.teacherName?.toLowerCase().includes(search.toLowerCase()) ||
      p.materialTitle?.toLowerCase().includes(search.toLowerCase()) ||
      p.studentEmail?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  // ── Stats ────────────────────────────────────────────────────
  const pendingCount = purchases.filter((p: any) => p.status === "pending").length;
  const approvedCount = purchases.filter((p: any) => p.status === "approved").length;
  const rejectedCount = purchases.filter((p: any) => p.status === "rejected").length;

  // ── Actions ───────────────────────────────────────────────────
  const handleApprove = async (purchaseId: string) => {
    setApprovingId(purchaseId);
    try {
      await updateStatus({
        purchaseId: purchaseId as Id<"academicPurchases">,
        status: "approved",
        adminNotes: "تم الموافقة على طلب التحصيلي",
      });
      if (selectedPurchase?._id === purchaseId) {
        setSelectedPurchase(null);
      }
    } catch (err: any) {
      alert(err.message || "حدث خطأ");
    } finally {
      setApprovingId(null);
    }
  };

  const handleReject = async (purchaseId: string) => {
    setRejectingId(purchaseId);
    try {
      await updateStatus({
        purchaseId: purchaseId as Id<"academicPurchases">,
        status: "rejected",
        rejectionReason: rejectReason || "تم رفض الطلب",
        adminNotes: rejectReason || "تم رفض الطلب",
      });
      setShowRejectInput(null);
      setRejectReason("");
      if (selectedPurchase?._id === purchaseId) {
        setSelectedPurchase(null);
      }
    } catch (err: any) {
      alert(err.message || "حدث خطأ");
    } finally {
      setRejectingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#f7fafa]" dir="rtl">
      {/* Header */}
      <header className="bg-linear-to-r from-[#001f24] to-[#03363d] px-8 py-5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <BookOpen className="h-5 w-5" /> طلبات التحصيلي
            </h1>
            <p className="text-[#a3ced6] text-sm mt-0.5">
              مراجعة والموافقة على طلبات شراء مواد التحصيلي
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs bg-white/15 text-white px-3 py-1.5 rounded-full border border-white/20">
              {pendingCount} طلب معلق
            </span>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: "إجمالي الطلبات", value: purchases.length, icon: Users, bg: "bg-blue-50", color: "text-blue-500" },
            { label: "قيد المراجعة", value: pendingCount, icon: Clock, bg: "bg-amber-50", color: "text-amber-500" },
            { label: "تمت الموافقة", value: approvedCount, icon: CheckCircle, bg: "bg-green-50", color: "text-green-500" },
            { label: "مرفوضة", value: rejectedCount, icon: X, bg: "bg-red-50", color: "text-red-500" },
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
            <Input
              placeholder="بحث بالاسم أو المادة..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pr-9 border-gray-200"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none"
          >
            <option value="all">جميع الطلبات</option>
            <option value="pending">قيد المراجعة</option>
            <option value="approved">مقبولة</option>
            <option value="rejected">مرفوضة</option>
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

        {/* Table */}
        <div className="bg-white rounded-xl border border-[#c0c8c9] overflow-hidden">
          {filtered.length === 0 ? (
            <div className="py-16 text-center">
              <BookOpen className="h-12 w-12 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-400 text-sm">لا توجد طلبات تحصيلي</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr className="text-right">
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">الطالب</th>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">المادة</th>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">المعلم</th>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">المبلغ</th>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">الإيصال</th>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">الحالة</th>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map((purchase: any) => (
                    <tr key={purchase._id} className="hover:bg-[#f7fafa] transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-[#001f24]">{purchase.studentName}</p>
                          <p className="text-xs text-gray-400">{purchase.studentEmail}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-[#001f24]">{purchase.materialTitle}</p>
                          <Badge className="text-xs bg-[#1a7a8a]/10 text-[#1a7a8a] border-none">
                            {purchase.materialType}
                          </Badge>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-medium text-[#001f24]">{purchase.teacherName}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-semibold text-[#1a7a8a]">
                          {purchase.amount} {purchase.currency}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {purchase.paymentProof ? (
                          <button
                            onClick={() => setImageModalUrl(purchase.paymentProof)}
                            className="flex items-center gap-1 text-[#1a7a8a] hover:underline text-xs"
                          >
                            <Eye className="h-3.5 w-3.5" /> عرض
                          </button>
                        ) : (
                          <span className="text-xs text-gray-400">لا يوجد</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <Badge
                          className={
                            purchase.status === "pending"
                              ? "bg-amber-100 text-amber-700 hover:bg-amber-200"
                              : purchase.status === "approved"
                              ? "bg-green-100 text-green-700 hover:bg-green-200"
                              : "bg-red-100 text-red-700 hover:bg-red-200"
                          }
                        >
                          {purchase.status === "pending"
                            ? "قيد المراجعة"
                            : purchase.status === "approved"
                            ? "مقبولة"
                            : "مرفوضة"}
                        </Badge>
                        {purchase.rejectionReason && purchase.status === "rejected" && (
                          <p className="text-xs text-red-500 mt-1">{purchase.rejectionReason}</p>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {purchase.status === "pending" ? (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleApprove(purchase._id)}
                              disabled={approvingId === purchase._id}
                              className="w-8 h-8 bg-green-500 hover:bg-green-600 text-white rounded-lg flex items-center justify-center transition-colors disabled:opacity-50"
                              title="موافقة"
                            >
                              {approvingId === purchase._id ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <Check className="h-3.5 w-3.5" />
                              )}
                            </button>
                            <button
                              onClick={() => setShowRejectInput(purchase._id)}
                              className="w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded-lg flex items-center justify-center transition-colors"
                              title="رفض"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">
                            {purchase.status === "approved" ? "✅ تمت" : "❌ مرفوض"}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ── Reject Modal ────────────────────────────────────────── */}
      <Dialog open={!!showRejectInput} onOpenChange={() => setShowRejectInput(null)}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-[#001f24]">
              رفض الطلب
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-gray-500">
              أدخل سبب الرفض (اختياري):
            </p>
            <Textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="سبب الرفض..."
              className="min-h-[100px]"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectInput(null)}>
              إلغاء
            </Button>
            <Button
              onClick={() => {
                if (showRejectInput) {
                  handleReject(showRejectInput);
                }
              }}
              disabled={rejectingId === showRejectInput}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              {rejectingId === showRejectInput ? (
                <Loader2 className="h-4 w-4 animate-spin ml-2" />
              ) : (
                "تأكيد الرفض"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Image Modal ────────────────────────────────────────── */}
      <Dialog open={!!imageModalUrl} onOpenChange={() => setImageModalUrl(null)}>
        <DialogContent className="max-w-2xl" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-[#001f24]">
              صورة الإيصال
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            {imageModalUrl && (
              <img
                src={imageModalUrl}
                alt="إيصال الدفع"
                className="w-full rounded-xl"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "/images/no-image.png";
                }}
              />
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setImageModalUrl(null)}>
              إغلاق
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}