"use client";

import { useState, useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Loader2, RefreshCw, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Id } from "@/convex/_generated/dataModel";
import { TransactionStats } from "@/app/_components/transactions/TransactionStats";
import { TransactionsTable } from "@/app/_components/transactions/TransactionsTable";
import { TransactionDetailsModal } from "@/app/_components/transactions/TransactionDetailsModal";

export default function ParentTransactionsPage() {
  const router = useRouter();
  const { isSignedIn, isLoaded } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedChildId, setSelectedChildId] = useState<string>("all");
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [lang] = useState<"en" | "ar">("ar");

  // ✅ جلب البيانات
  const currentUser = useQuery(api.user.auth.getCurrentUser, isSignedIn ? {} : "skip");
  
  // ✅ جلب أبناء ولي الأمر
  const children = useQuery(
      api.relationships.parentStudent.getChildrenByParent,
      currentUser?._id
        ? { parentId: currentUser._id as Id<"users"> }
        : "skip"
    );

  // ✅ جلب معاملات الأبناء
  const transactions = useQuery(
    api.transactions.transactions.getChildrenTransactions,
    currentUser?._id ? {
      parentId: currentUser._id as Id<"users">,
      childId: selectedChildId !== "all" ? selectedChildId as Id<"users"> : undefined,
      type: typeFilter !== "all" ? typeFilter as any : undefined,
      status: statusFilter !== "all" ? statusFilter as any : undefined,
    } : "skip"
  );

  const stats = useQuery(
    api.transactions.transactions.getTransactionStats,
    currentUser?._id ? { parentId: currentUser._id as Id<"users"> } : "skip"
  );

  // ✅ التحقق من تسجيل الدخول
  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      router.replace("/sign-in");
      return;
    }
    if (currentUser !== undefined && currentUser !== null) {
      if (currentUser.role !== "parent") {
        router.replace("/");
        return;
      }
    }
  }, [isLoaded, isSignedIn, currentUser, router]);

  // حالة التحميل
  if (!isLoaded || transactions === undefined || stats === undefined || currentUser === undefined) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-[#1a7a8a]" />
      </div>
    );
  }

  const childOptions = children?.map((child: any) => ({
    value: child._id,
    label: child.name,
  }));

  return (
    <div className="min-h-screen bg-[#f7fafa]" dir="rtl">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/parent" className="text-gray-600 hover:text-gray-900 transition-colors">
              <ArrowRight className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-gray-900">كشف حساب الأبناء</h1>
              <p className="text-sm text-gray-500">معاملات أبنائك المالية</p>
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
        {/* ✅ اختيار الابن - استخدام select عادي */}
        <div className="flex items-center gap-4">
          <Users className="h-5 w-5 text-gray-400" />
          <select
            value={selectedChildId}
            onChange={(e) => setSelectedChildId(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#1a7a8a]/20 focus:border-[#1a7a8a]"
          >
            <option value="all">جميع الأبناء</option>
            {childOptions?.map((child: any) => (
              <option key={child.value} value={child.value}>
                {child.label}
              </option>
            ))}
          </select>
        </div>

        {/* ✅ الإحصائيات */}
        <TransactionStats stats={stats} currency="EGP" lang={lang} />

        {/* ✅ الفلاتر */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-50 relative">
            <Input
              placeholder="بحث..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#1a7a8a]/20 focus:border-[#1a7a8a]"
          >
            <option value="all">جميع الأنواع</option>
            <option value="platform">منصة أونلاين</option>
            <option value="aptitude">تحصيلات</option>
            <option value="purchase">مشتريات</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#1a7a8a]/20 focus:border-[#1a7a8a]"
          >
            <option value="all">جميع الحالات</option>
            <option value="pending">قيد المراجعة</option>
            <option value="completed">مكتمل</option>
            <option value="refunded">مرتجع</option>
            <option value="failed">فاشل</option>
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
            showStudent={true}
            showActions={false}
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