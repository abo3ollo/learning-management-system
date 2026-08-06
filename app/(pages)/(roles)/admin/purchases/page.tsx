"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  ShoppingBag,
  Search,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  Filter,
  Loader2,
  ArrowRight
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { PurchaseDetailsModal } from "@/app/_components/Admin/PurchaseDetailsModal";
import { StatusUpdateModal } from "@/app/_components/Admin/StatusUpdateModal";



export default function AdminPurchasesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedPurchase, setSelectedPurchase] = useState<any>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isStatusUpdateOpen, setIsStatusUpdateOpen] = useState(false);

  const purchases = useQuery(api.purchases.getAllPurchasesWithDetails);
  const stats = useQuery(api.purchases.getPurchaseStats);
  const updateStatus = useMutation(api.purchases.updatePurchaseStatus);

  // فلترة الطلبات
  const filteredPurchases = purchases?.filter((p: any) => {
    const matchesSearch =
      p.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.itemCode.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === "all" || p.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleStatusUpdate = async (status: string, reason?: string, notes?: string) => {
    if (!selectedPurchase) return;

    console.log("Updating status with:", { status, reason, notes }); // للتتبع

    await updateStatus({
      purchaseId: selectedPurchase._id,
      status: status as any,
      rejectionReason: reason,
      notes: notes, // ✅ هذا هو adminNotes
    });

    setIsStatusUpdateOpen(false);
    setSelectedPurchase(null);
  };

  const handleViewDetails = (purchase: any) => {
    setSelectedPurchase(purchase);
    setIsDetailsOpen(true);
  };

  const handleOpenStatusUpdate = (purchase: any) => {
    setSelectedPurchase(purchase);
    setIsStatusUpdateOpen(true);
  };

  const statusMap: Record<string, { label: string; color: string; icon: any }> = {
    pending: { label: "قيد المراجعة", color: "bg-yellow-100 text-yellow-700", icon: Clock },
    approved: { label: "تم الموافقة", color: "bg-green-100 text-green-700", icon: CheckCircle },
    rejected: { label: "مرفوض", color: "bg-red-100 text-red-700", icon: XCircle },
    completed: { label: "مكتمل", color: "bg-blue-100 text-blue-700", icon: CheckCircle },
  };

  if (purchases === undefined || stats === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-[#1a7a8a]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8" dir="rtl">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <Link
              href="/admin/dashboard"
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowRight className="h-5 w-5 text-gray-600" />
            </Link>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                متابعة مشتريات الطلاب
              </h1>
              <p className="text-gray-500 text-sm">
                مراجعة وإدارة طلبات الشراء من الطلاب
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-100">
            <ShoppingBag className="h-5 w-5 text-[#1a7a8a]" />
            <span className="text-sm font-medium text-gray-700">
              إجمالي الطلبات: {stats.total}
            </span>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400">الكل</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                <ShoppingBag className="h-5 w-5 text-gray-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-yellow-600">قيد المراجعة</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
              <div className="w-10 h-10 bg-yellow-100 rounded-xl flex items-center justify-center">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-green-600">تم الموافقة</p>
                <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
              </div>
              <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-red-600">مرفوض</p>
                <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
              </div>
              <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                <XCircle className="h-5 w-5 text-red-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-blue-600">الإيرادات</p>
                <p className="text-2xl font-bold text-blue-600">
                  {stats.totalRevenue.toFixed(0)}
                </p>
              </div>
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-50">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="بحث بالمنتج، الطالب، أو الكود..."
                  className="w-full border border-gray-200 rounded-xl pr-10 pl-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a7a8a]/20 focus:border-[#1a7a8a]"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a7a8a]/20 focus:border-[#1a7a8a] bg-white"
              >
                <option value="all">جميع الحالات</option>
                <option value="pending">قيد المراجعة</option>
                <option value="approved">تم الموافقة</option>
                <option value="rejected">مرفوض</option>
                <option value="completed">مكتمل</option>
              </select>
            </div>
          </div>
        </div>

        {/* Purchases Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    #
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    الطالب
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    المنتج
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    الكمية
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    الإجمالي
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    الحالة
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    التاريخ
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    الإجراءات
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredPurchases?.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                      لا توجد طلبات شراء
                    </td>
                  </tr>
                ) : (
                  filteredPurchases?.map((purchase: any, index: number) => {
                    const status = statusMap[purchase.status] || statusMap.pending;
                    const StatusIcon = status.icon;

                    return (
                      <tr key={purchase._id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 text-sm text-gray-500">{index + 1}</td>
                        <td className="px-6 py-4">
                          <div>
                            <p className="text-sm font-medium text-gray-700">{purchase.studentName}</p>
                            <p className="text-xs text-gray-400">{purchase.studentEmail}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <p className="text-sm font-medium text-gray-700">{purchase.itemName}</p>
                            <p className="text-xs text-gray-400">كود: {purchase.itemCode}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700">{purchase.quantity}</td>
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                          {purchase.totalPrice.toFixed(2)} ج.م
                        </td>
                        <td className="px-6 py-4">
                          <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${status.color} w-fit`}>
                            <StatusIcon className="h-3 w-3" />
                            {status.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {format(new Date(purchase.createdAt), "dd/MM/yyyy")}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleViewDetails(purchase)}
                              className="p-1.5 hover:bg-blue-50 rounded-lg transition-colors text-blue-600"
                              title="عرض التفاصيل"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            {purchase.status === "pending" && (
                              <button
                                onClick={() => handleOpenStatusUpdate(purchase)}
                                className="p-1.5 hover:bg-green-50 rounded-lg transition-colors text-green-600"
                                title="تحديث الحالة"
                              >
                                <CheckCircle className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modals */}
      <PurchaseDetailsModal
        purchase={selectedPurchase}
        isOpen={isDetailsOpen}
        onClose={() => {
          setIsDetailsOpen(false);
          setSelectedPurchase(null);
        }}
      />

      <StatusUpdateModal
        isOpen={isStatusUpdateOpen}
        onClose={() => {
          setIsStatusUpdateOpen(false);
          setSelectedPurchase(null);
        }}
        purchase={selectedPurchase}
        onUpdate={handleStatusUpdate}
      />
    </div>
  );
}