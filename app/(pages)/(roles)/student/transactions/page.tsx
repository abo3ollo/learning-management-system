// app/(pages)/(roles)/student/transactions/page.tsx

"use client";

import React, { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Loader2, RefreshCw, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { format } from "date-fns";
import { arSA } from "date-fns/locale";
import { Id } from "@/convex/_generated/dataModel";
import { TransactionDetailsModal } from "@/app/_components/transactions/TransactionDetailsModal";

// ═══════════════════════════════════════════════════════════════════
// صفحة كشف حساب الطالب
// ═══════════════════════════════════════════════════════════════════

export default function StudentTransactionsPage() {
  const router = useRouter();
  const { isSignedIn, isLoaded } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [lang] = useState<"en" | "ar">("ar");

  // ── Queries ───────────────────────────────────────────────────
  const currentUser = useQuery(api.user.auth.getCurrentUser, isSignedIn ? {} : "skip");
  
  // ✅ جلب جميع المعاملات (منصة + قدرات + تحصيلي + مشتريات)
  const transactions = useQuery(
    api.transactions.transactions.getStudentTransactionsWithDetails,
    currentUser?._id ? { 
      studentId: currentUser._id as Id<"users">,
    } : "skip"
  );

  // ✅ جلب إحصائيات الطالب
  const stats = useQuery(
    api.transactions.transactions.getStudentStats,
    currentUser?._id ? { studentId: currentUser._id as Id<"users"> } : "skip"
  );

  // ── Effects ───────────────────────────────────────────────────
  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      router.replace("/sign-in");
      return;
    }
    if (currentUser !== undefined && currentUser !== null) {
      if (currentUser.role !== "student") {
        router.replace("/");
        return;
      }
    }
  }, [isLoaded, isSignedIn, currentUser, router]);

  // ── المعاملات ──────────────────────────────────────────────────
  const allTransactions = React.useMemo(() => {
    const txs = transactions || [];
    
    // إضافة uniqueKey لكل معاملة
    const allWithKeys = txs.map((t: any) => ({
      ...t,
      uniqueKey: t.uniqueKey || `transaction_${t._id}`,
    }));

    // ترتيب من الأحدث للأقدم
    return allWithKeys.sort((a, b) => b.createdAt - a.createdAt);
  }, [transactions]);

  // ── فلترة المعاملات ──────────────────────────────────────────
  const filteredTransactions = allTransactions.filter((t: any) => {
    const matchesSearch = 
      !searchQuery ||
      t.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.descriptionAr?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.teacherName?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesType = typeFilter === "all" || t.type === typeFilter;
    const matchesStatus = statusFilter === "all" || t.status === statusFilter;
    
    return matchesSearch && matchesType && matchesStatus;
  });

  // ── حالة التحميل ──────────────────────────────────────────────
  if (!isLoaded || transactions === undefined || stats === undefined || currentUser === undefined) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-[#1a7a8a]" />
      </div>
    );
  }

  // ── دوال مساعدة ──────────────────────────────────────────────
  const formatDate = (timestamp: number) => {
    if (!timestamp) return "غير معروف";
    return format(new Date(timestamp), "dd MMM yyyy, HH:mm", { locale: arSA });
  };

  const getStatusBadge = (status: string) => {
    const map: Record<string, { label: string; color: string }> = {
      pending: { label: "قيد المراجعة", color: "bg-yellow-100 text-yellow-700" },
      completed: { label: "مكتمل", color: "bg-green-100 text-green-700" },
      approved: { label: "تمت الموافقة", color: "bg-green-100 text-green-700" },
      rejected: { label: "مرفوض", color: "bg-red-100 text-red-700" },
      refunded: { label: "مرتجع", color: "bg-orange-100 text-orange-700" },
      failed: { label: "فاشل", color: "bg-red-100 text-red-700" },
    };
    return map[status] || { label: status, color: "bg-gray-100 text-gray-700" };
  };

  const getTypeLabel = (type: string) => {
    const map: Record<string, string> = {
      platform: "منصة",
      aptitude: "قدرات",
      academic: "تحصيلي",
      purchase: "مشتريات",
    };
    return map[type] || type;
  };

  const getTypeIcon = (type: string) => {
    const map: Record<string, string> = {
      platform: "💻",
      aptitude: "🎯",
      academic: "📚",
      purchase: "🛒",
    };
    return map[type] || "📄";
  };

  // ── إحصائيات مخصصة ────────────────────────────────────────────
  const customStats = {
    total: allTransactions.length,
    pending: allTransactions.filter((t: any) => t.status === "pending").length,
    completed: allTransactions.filter((t: any) => t.status === "approved" || t.status === "completed").length,
    rejected: allTransactions.filter((t: any) => t.status === "rejected" || t.status === "failed").length,
    totalAmount: allTransactions.reduce((sum: number, t: any) => sum + (t.amount || 0), 0),
  };

  return (
    <div className="min-h-screen bg-[#f7fafa]" dir="rtl">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/student" className="text-gray-600 hover:text-gray-900 transition-colors">
              <ArrowRight className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-gray-900">كشف الحساب</h1>
              <p className="text-sm text-gray-500">جميع معاملاتك المالية (منصة، قدرات، تحصيلي، مشتريات)</p>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={() => window.location.reload()}
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            تحديث
          </Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        {/* ✅ الإحصائيات */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card className="bg-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-400">إجمالي المعاملات</p>
                  <p className="text-2xl font-bold text-gray-900">{customStats.total}</p>
                </div>
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                  <span className="text-blue-600 text-lg">📊</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-yellow-600">قيد المراجعة</p>
                  <p className="text-2xl font-bold text-yellow-600">{customStats.pending}</p>
                </div>
                <div className="w-10 h-10 bg-yellow-100 rounded-xl flex items-center justify-center">
                  <span className="text-yellow-600 text-lg">⏳</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-green-600">مكتملة</p>
                  <p className="text-2xl font-bold text-green-600">{customStats.completed}</p>
                </div>
                <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                  <span className="text-green-600 text-lg">✅</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-red-600">مرفوضة</p>
                  <p className="text-2xl font-bold text-red-600">{customStats.rejected}</p>
                </div>
                <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                  <span className="text-red-600 text-lg">❌</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-blue-600">إجمالي المبالغ</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {customStats.totalAmount.toFixed(2)} <span className="text-sm font-normal">EGP</span>
                  </p>
                </div>
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                  <span className="text-blue-600 text-lg">💰</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ✅ الفلاتر */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-50 relative">
            <Input
              placeholder="بحث بالوصف أو اسم المعلم..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-4 py-2 border rounded-lg text-sm bg-white"
          >
            <option value="all">جميع الأنواع</option>
            <option value="platform">💻 منصة</option>
            <option value="aptitude">🎯 قدرات</option>
            <option value="academic">📚 تحصيلي</option>
            <option value="purchase">🛒 مشتريات</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border rounded-lg text-sm bg-white"
          >
            <option value="all">جميع الحالات</option>
            <option value="pending">⏳ قيد المراجعة</option>
            <option value="approved">✅ تمت الموافقة</option>
            <option value="completed">✅ مكتمل</option>
            <option value="rejected">❌ مرفوض</option>
            <option value="refunded">↩️ مرتجع</option>
            <option value="failed">❌ فاشل</option>
          </select>
        </div>

        {/* ✅ جدول المعاملات */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {filteredTransactions.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📭</div>
              <p className="text-gray-500">لا توجد معاملات</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase">#</th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase">النوع</th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase">الوصف</th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase">المبلغ</th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase">الحالة</th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase">التاريخ</th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredTransactions.map((transaction: any, index: number) => {
                    const status = getStatusBadge(transaction.status);
                    
                    return (
                      <tr key={transaction.uniqueKey} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 text-sm text-gray-500">{index + 1}</td>
                        <td className="px-6 py-4">
                          <span className="flex items-center gap-2 text-sm">
                            <span>{getTypeIcon(transaction.type)}</span>
                            <span className="font-medium">{getTypeLabel(transaction.type)}</span>
                          </span>
                          {(transaction.isAptitude || transaction.isAcademic) && (
                            <p className="text-xs text-gray-400">معلم: {transaction.teacherName}</p>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm text-gray-700">
                            {lang === "ar" ? transaction.descriptionAr || transaction.description : transaction.description}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`text-sm font-bold ${transaction.amount > 0 ? 'text-[#1a7a8a]' : 'text-red-500'}`}>
                            {transaction.amount > 0 ? '+' : ''}{transaction.amount.toFixed(2)} {transaction.currency || 'EGP'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${status.color}`}>
                            {status.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {formatDate(transaction.createdAt)}
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => {
                              setSelectedTransaction(transaction);
                              setIsDetailsOpen(true);
                            }}
                            className="p-1.5 hover:bg-blue-50 rounded-lg transition-colors text-blue-600"
                            title="عرض التفاصيل"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ✅ مودال التفاصيل */}
      <TransactionDetailsModal
        isOpen={isDetailsOpen}
        onClose={() => {
          setIsDetailsOpen(false);
          setSelectedTransaction(null);
        }}
        transaction={selectedTransaction}
        lang={lang}
      />
    </div>
  );
}