"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { TransactionStats } from "@/app/_components/transactions/TransactionStats";
import { TransactionsTable } from "@/app/_components/transactions/TransactionsTable";
import { TransactionDetailsModal } from "@/app/_components/transactions/TransactionDetailsModal";

export default function AdminTransactionsPage() {
  const router = useRouter();
  const { isSignedIn, isLoaded } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [lang] = useState<"en" | "ar">("ar");

  // ✅ جلب البيانات
  const currentUser = useQuery(api.user.auth.getCurrentUser, isSignedIn ? {} : "skip");
  const transactions = useQuery(api.transactions.transactions.getAllTransactions, {
    searchQuery: searchQuery || undefined,
    type: typeFilter !== "all" ? typeFilter as any : undefined,
    status: statusFilter !== "all" ? statusFilter as any : undefined,
  });
  const stats = useQuery(api.transactions.transactions.getTransactionStats, {});

  // ✅ دوال Convex
  const updateStatus = useMutation(api.transactions.transactions.updateTransactionStatus);

  // ✅ التحقق من الصلاحية
  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      router.replace("/sign-in");
      return;
    }
    if (currentUser !== undefined && currentUser !== null) {
      if (currentUser.role !== "admin") {
        router.replace("/");
        return;
      }
    }
  }, [isLoaded, isSignedIn, currentUser, router]);

  // ✅ معالج تحديث الحالة
  const handleStatusChange = async (id: string, status: string) => {
    try {
      await updateStatus({ transactionId: id as any, status: status as any });
      toast.success("✅ تم تحديث حالة المعاملة بنجاح");
    } catch (error) {
      toast.error("حدث خطأ أثناء تحديث الحالة");
    }
  };

  // حالة التحميل
  if (!isLoaded || transactions === undefined || stats === undefined || currentUser === undefined) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-[#1a7a8a]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7fafa]" dir="rtl">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin" className="text-gray-600 hover:text-gray-900 transition-colors">
              <ArrowRight className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-gray-900">كشف الحساب</h1>
              <p className="text-sm text-gray-500">جميع المعاملات المالية للطلاب</p>
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
        <TransactionStats stats={stats} currency="EGP" lang={lang} />

        {/* ✅ الفلاتر */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-50 relative">
            <Input
              placeholder="بحث بالطالب أو الوصف..."
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
            <option value="platform">منصة أونلاين</option>
            <option value="aptitude">تحصيلات</option>
            <option value="purchase">مشتريات</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border rounded-lg text-sm bg-white"
          >
            <option value="all">جميع الحالات</option>
            <option value="pending">⏳ قيد المراجعة</option>
            <option value="completed">✅ مكتمل</option>
            <option value="refunded">↩️ مرتجع</option>
            <option value="failed">❌ فاشل</option>
          </select>
        </div>

        {/* ✅ جدول المعاملات */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <TransactionsTable
            transactions={transactions}
            onViewDetails={(transaction) => {
              setSelectedTransaction(transaction);
              setIsDetailsOpen(true);
            }}
            onStatusChange={handleStatusChange}
            showStudent={true}
            showActions={true}
            lang={lang}
          />
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