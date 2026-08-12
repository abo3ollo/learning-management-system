"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight,
  Search,
  Loader2,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  User,
  Package,
  Calendar,
  Filter,
  RefreshCw,
  FileText,
  Award,
  TrendingUp,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ApprovalDetailsModal } from "@/app/_components/Admin/ApprovalDetailsModal";
import { StatusUpdateModal } from "@/app/_components/Admin/StatusUpdateModal";
import { StatusUpdateModalAptitude } from "@/app/_components/Admin/StatusUpdateModalAptitude";

// ═══════════════════════════════════════════════════════════════════
// الصفحة الرئيسية
// ═══════════════════════════════════════════════════════════════════

export default function AdminAptitudeApprovalsPage() {
  const router = useRouter();
  const { isSignedIn, isLoaded } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedPurchase, setSelectedPurchase] = useState<any>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isStatusUpdateOpen, setIsStatusUpdateOpen] = useState(false);

  // ✅ جلب جميع طلبات التحصيلي
  const purchases = useQuery(api.aptitude.aptitude.getAllAptitudePurchases);
  
  // ✅ تحديث حالة الطلب
  const updateStatus = useMutation(api.aptitude.aptitude.updateAptitudePurchaseStatus);

  // ✅ التحقق من صلاحية الأدمن
  const currentUser = useQuery(
    api.user.auth.getCurrentUser,
    isSignedIn ? {} : "skip"
  );

  // ✅ التحقق من تسجيل الدخول وصلاحية الأدمن
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

  // ✅ فلترة الطلبات
  const filteredPurchases = purchases?.filter((p: any) => {
    const matchesSearch = 
      p.studentName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.teacherName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.studentEmail?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || p.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // ✅ إحصائيات
  const stats = {
    total: purchases?.length || 0,
    pending: purchases?.filter((p: any) => p.status === "pending").length || 0,
    approved: purchases?.filter((p: any) => p.status === "approved").length || 0,
    rejected: purchases?.filter((p: any) => p.status === "rejected").length || 0,
    totalAmount: purchases?.reduce((sum: number, p: any) => sum + (p.amount || 0), 0) || 0,
  };

  // ✅ معالج تحديث الحالة
  const handleStatusUpdate = async (status: string, rejectionReason?: string, adminNotes?: string) => {
    if (!selectedPurchase) return;

    await updateStatus({
      purchaseId: selectedPurchase._id,
      status: status as any,
      rejectionReason,
      adminNotes,
    });

    toast.success("✅ تم تحديث حالة الطلب بنجاح");
  };

  // حالة التحميل
  if (!isLoaded || purchases === undefined || currentUser === undefined) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-[#1a7a8a]" />
      </div>
    );
  }

  const statusMap: Record<string, { label: string; color: string; icon: any }> = {
    pending: { label: "قيد المراجعة", color: "bg-yellow-100 text-yellow-700", icon: Clock },
    approved: { label: "تم الموافقة", color: "bg-green-100 text-green-700", icon: CheckCircle },
    rejected: { label: "مرفوض", color: "bg-red-100 text-red-700", icon: XCircle },
  };

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
              <h1 className="text-xl font-bold text-gray-900">قبول القدرات</h1>
              <p className="text-sm text-gray-500">مراجعة وإدارة طلبات برامج القدرات</p>
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
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          <Card className="bg-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-400">الكل</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                </div>
                <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                  <FileText className="h-5 w-5 text-gray-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-yellow-600">قيد المراجعة</p>
                  <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
                </div>
                <div className="w-10 h-10 bg-yellow-100 rounded-xl flex items-center justify-center">
                  <Clock className="h-5 w-5 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-green-600">تم الموافقة</p>
                  <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
                </div>
                <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-red-600">مرفوض</p>
                  <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
                </div>
                <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                  <XCircle className="h-5 w-5 text-red-600" />
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
                    {stats.totalAmount.toFixed(2)} <span className="text-sm font-normal">EGP</span>
                  </p>
                </div>
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                  <DollarSign className="h-5 w-5 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ✅ البحث والفلترة */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-50 relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="بحث بالطالب أو المعلم..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-10"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border rounded-lg text-sm bg-white"
          >
            <option value="all">جميع الحالات</option>
            <option value="pending">قيد المراجعة</option>
            <option value="approved">تم الموافقة</option>
            <option value="rejected">مرفوض</option>
          </select>
        </div>

        {/* ✅ جدول الطلبات */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase">#</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase">الطالب</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase">المعلم</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase">المبلغ</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase">الحالة</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase">التاريخ</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredPurchases?.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                      <Award className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                      لا توجد طلبات
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
                          <p className="text-sm text-gray-700">{purchase.teacherName}</p>
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-[#1a7a8a]">
                          {purchase.amount} {purchase.currency || "EGP"}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${status.color} w-fit`}>
                            <StatusIcon className="h-3 w-3" />
                            {status.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {new Date(purchase.createdAt).toLocaleDateString("ar-EG")}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                setSelectedPurchase(purchase);
                                setIsDetailsOpen(true);
                              }}
                              className="p-1.5 hover:bg-blue-50 rounded-lg transition-colors text-blue-600"
                              title="عرض التفاصيل"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            {purchase.status === "pending" && (
                              <button
                                onClick={() => {
                                  setSelectedPurchase(purchase);
                                  setIsStatusUpdateOpen(true);
                                }}
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

      {/* ✅ مودال تفاصيل الطلب */}
      <ApprovalDetailsModal
        isOpen={isDetailsOpen}
        onClose={() => {
          setIsDetailsOpen(false);
          setSelectedPurchase(null);
        }}
        purchase={selectedPurchase}
      />

      {/* ✅ مودال تحديث الحالة */}
      <StatusUpdateModalAptitude
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