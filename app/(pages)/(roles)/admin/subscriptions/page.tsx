"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  Users,
  CreditCard,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Loader2,
  Search,
  Filter,
  Plus,
  Edit,
  Trash2,
  DollarSign,
  School,
  RefreshCw,
  Eye,
  ChevronDown,
  ChevronUp,
  GraduationCap,
  Mail,
  Phone,
} from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// ── Helpers ───────────────────────────────────────────────────────
function formatDate(ts?: number) {
  if (!ts) return "—";
  return format(new Date(ts), "dd MMM yyyy", { locale: ar });
}

// ✅ حالة الدفع
const PaymentStatusBadge = ({ status }: { status: string }) => {
  switch (status) {
    case "paid":
      return (
        <Badge className="bg-green-100 text-green-700 border-green-200">
          مدفوع ✅
        </Badge>
      );
    case "pending":
      return (
        <Badge className="bg-amber-100 text-amber-700 border-amber-200">
          قيد المراجعة ⏳
        </Badge>
      );
    case "unpaid":
      return (
        <Badge className="bg-red-100 text-red-700 border-red-200">
          غير مدفوع ❌
        </Badge>
      );
    default:
      return <Badge variant="outline">غير محدد</Badge>;
  }
};

// ✅ حالة الاشتراك
const SubscriptionStatusBadge = ({ status }: { status: string }) => {
  switch (status) {
    case "active":
      return (
        <Badge className="bg-green-100 text-green-700 border-green-200">
          نشط
        </Badge>
      );
    case "awaiting_approval":
      return (
        <Badge className="bg-amber-100 text-amber-700 border-amber-200">
          في انتظار الموافقة
        </Badge>
      );
    case "pending":
      return (
        <Badge className="bg-blue-100 text-blue-700 border-blue-200">
          قيد الانتظار
        </Badge>
      );
    case "rejected":
      return (
        <Badge className="bg-red-100 text-red-700 border-red-200">مرفوض</Badge>
      );
    default:
      return <Badge variant="outline">غير محدد</Badge>;
  }
};

export default function AdminSubscriptionsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRole, setSelectedRole] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [isPriceDialogOpen, setIsPriceDialogOpen] = useState(false);
  const [editingPrice, setEditingPrice] = useState<any>(null);
  const [priceData, setPriceData] = useState({
    gradeId: "",
    price: "",
    currency: "SAR",
    description: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [expandedUser, setExpandedUser] = useState<string | null>(null);

  // ── Queries ───────────────────────────────────────────────────
  const usersWithSubscription = useQuery(
    api.payments.gradePricing.getUsersWithSubscription,
  );
  const pricing = useQuery(api.payments.gradePricing.getAllPricing);
  const grades = useQuery(api.grades.grades.getActiveGrades);

  const setGradePrice = useMutation(api.payments.gradePricing.setGradePrice);
  const toggleGradePrice = useMutation(
    api.payments.gradePricing.toggleGradePrice,
  );

  // ✅ معالجة تغيير الـ Select - تقبل string | null
  const handleGradeChange = (value: string | null) => {
    setPriceData({ ...priceData, gradeId: value || "" });
  };

  const handleCurrencyChange = (value: string | null) => {
    setPriceData({ ...priceData, currency: value || "SAR" });
  };

  // ── Handlers ───────────────────────────────────────────────────
  const handleSetPrice = async () => {
    if (!priceData.gradeId || !priceData.price) {
      setError("يرجى إدخال الصف والسعر");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await setGradePrice({
        gradeId: priceData.gradeId as any,
        price: parseFloat(priceData.price),
        currency: priceData.currency,
        description: priceData.description || undefined,
      });

      setSuccess("✅ تم حفظ السعر بنجاح");
      setIsPriceDialogOpen(false);
      setPriceData({
        gradeId: "",
        price: "",
        currency: "SAR",
        description: "",
      });
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || "حدث خطأ أثناء حفظ السعر");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTogglePrice = async (pricingId: string, isActive: boolean) => {
    try {
      await toggleGradePrice({
        pricingId: pricingId as any,
        isActive: !isActive,
      });
      setSuccess(`✅ تم ${!isActive ? "تفعيل" : "إلغاء"} السعر بنجاح`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || "حدث خطأ");
    }
  };

  const openEditPrice = (price: any) => {
    setEditingPrice(price);
    setPriceData({
      gradeId: price.gradeId,
      price: price.price.toString(),
      currency: price.currency,
      description: price.description || "",
    });
    setIsPriceDialogOpen(true);
  };

  // ── Filters ───────────────────────────────────────────────────
  // ✅ عرض الطلاب وأولياء الأمور فقط (مع جميع حالات الدفع)
  const filteredUsers = usersWithSubscription?.filter((u: any) => {
    // ✅ فقط الطلاب وأولياء الأمور (نستثني المعلمين والمشرفين)
    const isStudentOrParent = u.role === "student" || u.role === "parent";
    
    // ✅ البحث
    const matchSearch =
      !searchQuery ||
      u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchRole = selectedRole === "all" || u.role === selectedRole;
    const matchStatus =
      selectedStatus === "all" || u.paymentStatus === selectedStatus;
    
    return isStudentOrParent && matchSearch && matchRole && matchStatus;
  });

  // ── Stats ────────────────────────────────────────────────────
  const studentUsers = usersWithSubscription?.filter(
    (u: any) => u.role === "student"
  ) || [];
  const parentUsers = usersWithSubscription?.filter(
    (u: any) => u.role === "parent"
  ) || [];
  
  const paidStudents = studentUsers.filter(
    (u: any) => u.paymentStatus === "paid"
  ).length;
  const unpaidStudents = studentUsers.filter(
    (u: any) => u.paymentStatus === "unpaid" || u.paymentStatus === "pending"
  ).length;
  
  const paidParents = parentUsers.filter(
    (u: any) => u.paymentStatus === "paid"
  ).length;
  const unpaidParents = parentUsers.filter(
    (u: any) => u.paymentStatus === "unpaid" || u.paymentStatus === "pending"
  ).length;

  const stats = {
    totalStudents: studentUsers.length,
    totalParents: parentUsers.length,
    paidStudents,
    unpaidStudents,
    paidParents,
    unpaidParents,
    totalPaid: paidStudents + paidParents,
    totalUnpaid: unpaidStudents + unpaidParents,
  };

  // ── Loading ──────────────────────────────────────────────────
  if (usersWithSubscription === undefined) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-[#1a7a8a]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7fafa]" dir="rtl">
      {/* Header */}
      <header className="bg-linear-to-r from-[#001f24] to-[#03363d] px-8 py-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <CreditCard className="h-6 w-6" />
              إدارة الاشتراكات
            </h1>
            <p className="text-[#a3ced6] text-sm mt-0.5">
              إدارة اشتراكات الطلاب وأولياء الأمور
            </p>
          </div>
          <Button
            onClick={() => {
              setEditingPrice(null);
              setPriceData({
                gradeId: "",
                price: "",
                currency: "SAR",
                description: "",
              });
              setIsPriceDialogOpen(true);
            }}
            className="bg-white/15 hover:bg-white/25 text-white border border-white/20"
          >
            <Plus className="h-4 w-4 ml-2" />
            إضافة سعر صف
          </Button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        {/* Error / Success */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-500 shrink-0" />
            <p className="text-red-700 text-sm flex-1">{error}</p>
            <button
              onClick={() => setError(null)}
              className="p-1 hover:bg-red-100 rounded-lg"
            >
              <XCircle className="h-4 w-4 text-red-400" />
            </button>
          </div>
        )}
        {success && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3">
            <CheckCircle className="h-5 w-5 text-green-500 shrink-0" />
            <p className="text-green-700 text-sm flex-1">{success}</p>
            <button
              onClick={() => setSuccess(null)}
              className="p-1 hover:bg-green-100 rounded-lg"
            >
              <XCircle className="h-4 w-4 text-green-400" />
            </button>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-4 border border-[#c0c8c9] hover:shadow-sm transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-blue-600">{stats.totalStudents}</p>
                <p className="text-xs text-gray-500">إجمالي الطلاب</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                <GraduationCap className="h-5 w-5 text-blue-500" />
              </div>
            </div>
            <div className="flex items-center gap-3 mt-2 text-xs">
              <span className="text-green-600">✅ {stats.paidStudents} مدفوع</span>
              <span className="text-red-600">❌ {stats.unpaidStudents} غير مدفوع</span>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-[#c0c8c9] hover:shadow-sm transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-purple-600">{stats.totalParents}</p>
                <p className="text-xs text-gray-500">إجمالي أولياء الأمور</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
                <Users className="h-5 w-5 text-purple-500" />
              </div>
            </div>
            <div className="flex items-center gap-3 mt-2 text-xs">
              <span className="text-green-600">✅ {stats.paidParents} مدفوع</span>
              <span className="text-red-600">❌ {stats.unpaidParents} غير مدفوع</span>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-[#c0c8c9] hover:shadow-sm transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-green-600">{stats.totalPaid}</p>
                <p className="text-xs text-gray-500">إجمالي المدفوع</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-green-500" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-[#c0c8c9] hover:shadow-sm transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-red-600">{stats.totalUnpaid}</p>
                <p className="text-xs text-gray-500">إجمالي غير المدفوع</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
                <XCircle className="h-5 w-5 text-red-500" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl border border-[#c0c8c9] p-4 flex flex-wrap gap-3 items-center">
          <div className="flex-1 min-w-48 relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              placeholder="بحث بالاسم أو البريد..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full border border-gray-200 rounded-lg pr-9 pl-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a7a8a]"
            />
          </div>
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="border border-gray-200 rounded-lg px-4 py-2 text-sm bg-white"
          >
            <option value="all">جميع الأدوار</option>
            <option value="student">طالب</option>
            <option value="parent">ولي أمر</option>
          </select>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="border border-gray-200 rounded-lg px-4 py-2 text-sm bg-white"
          >
            <option value="all">جميع الحالات</option>
            <option value="paid">مدفوع</option>
            <option value="pending">قيد المراجعة</option>
            <option value="unpaid">غير مدفوع</option>
          </select>
          <button
            onClick={() => {
              setSearchQuery("");
              setSelectedRole("all");
              setSelectedStatus("all");
            }}
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
          >
            <RefreshCw className="h-4 w-4" />
            إعادة ضبط
          </button>
        </div>

        {/* Tabs: Users & Pricing */}
        <Tabs defaultValue="users" className="w-full" dir="rtl">
          <TabsList className="grid grid-cols-2 max-w-md">
            <TabsTrigger value="users">المستخدمين</TabsTrigger>
            <TabsTrigger value="pricing">أسعار الصفوف</TabsTrigger>
          </TabsList>

          {/* Tab: Users - عرض الطلاب وأولياء الأمور فقط */}
          <TabsContent value="users" className="mt-4">
            <div className="bg-white rounded-xl border border-[#c0c8c9] overflow-hidden">
              {filteredUsers?.length === 0 ? (
                <div className="py-16 text-center">
                  <Users className="h-12 w-12 text-gray-200 mx-auto mb-3" />
                  <p className="text-gray-400">لا يوجد طلاب أو أولياء أمور</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-[#f7fafa] border-b border-[#c0c8c9]">
                      <tr>
                        <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 whitespace-nowrap">
                          المستخدم
                        </th>
                        <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 whitespace-nowrap">
                          الدور
                        </th>
                        <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 whitespace-nowrap">
                          الصف
                        </th>
                        <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 whitespace-nowrap">
                          حالة الدفع
                        </th>
                        <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 whitespace-nowrap">
                          الاشتراك
                        </th>
                        <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 whitespace-nowrap">
                          المبلغ
                        </th>
                        <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 whitespace-nowrap">
                          الإجراءات
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {filteredUsers?.map((u: any) => (
                        <tr
                          key={u._id}
                          className="hover:bg-[#f7fafa] transition-colors"
                        >
                          {/* المستخدم */}
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-[#e0f5f7] flex items-center justify-center text-[#1a7a8a] font-bold text-sm shrink-0">
                                {u.name?.charAt(0)}
                              </div>
                              <div>
                                <p className="font-medium text-[#001f24] text-sm">
                                  {u.name}
                                </p>
                                <div className="space-y-0.5">
                                  <p className="text-xs text-gray-400 flex items-center gap-1">
                                    <Mail className="h-3 w-3" />
                                    {u.email}
                                  </p>
                                  {u.phoneNumber && (
                                    <p className="text-xs text-gray-400 flex items-center gap-1">
                                      <Phone className="h-3 w-3" />
                                      {u.phoneNumber}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>
                          {/* الدور */}
                          <td className="px-4 py-3">
                            <span className="text-sm capitalize">
                              {u.role === "student" ? "طالب" : "ولي أمر"}
                            </span>
                          </td>
                          {/* الصف */}
                          <td className="px-4 py-3">
                            <span className="text-sm">{u.gradeName}</span>
                          </td>
                          {/* حالة الدفع */}
                          <td className="px-4 py-3">
                            <PaymentStatusBadge status={u.paymentStatus} />
                          </td>
                          {/* الاشتراك */}
                          <td className="px-4 py-3">
                            <SubscriptionStatusBadge
                              status={u.subscriptionStatus}
                            />
                          </td>
                          {/* المبلغ */}
                          <td className="px-4 py-3">
                            {u.gradePrice ? (
                              <span className="text-sm font-medium text-[#1a7a8a]">
                                {u.gradePrice} {u.gradePriceCurrency}
                              </span>
                            ) : (
                              <span className="text-sm text-gray-400">—</span>
                            )}
                          </td>
                          {/* الإجراءات */}
                          <td className="px-4 py-3">
                            <button
                              onClick={() =>
                                setExpandedUser(
                                  expandedUser === u._id ? null : u._id,
                                )
                              }
                              className="p-1.5 hover:bg-gray-100 rounded-lg"
                              title={
                                expandedUser === u._id
                                  ? "إخفاء"
                                  : "عرض التفاصيل"
                              }
                            >
                              {expandedUser === u._id ? (
                                <ChevronUp className="h-4 w-4 text-gray-400" />
                              ) : (
                                <ChevronDown className="h-4 w-4 text-gray-400" />
                              )}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {/* Footer */}
              <div className="px-5 py-3 border-t border-gray-50 bg-[#f7fafa]">
                <p className="text-xs text-gray-400">
                  عرض {filteredUsers?.length || 0} مستخدم
                </p>
              </div>
            </div>
          </TabsContent>

          {/* Tab: Pricing */}
          <TabsContent value="pricing" className="mt-4">
            <div className="bg-white rounded-xl border border-[#c0c8c9] overflow-hidden">
              <div className="p-4 border-b border-[#c0c8c9]">
                <h3 className="font-semibold text-[#001f24]">
                  أسعار الاشتراك حسب الصف
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  تحديد سعر الاشتراك لكل صف دراسي
                </p>
              </div>
              {pricing?.length === 0 ? (
                <div className="py-16 text-center">
                  <DollarSign className="h-12 w-12 text-gray-200 mx-auto mb-3" />
                  <p className="text-gray-400">لا توجد أسعار محددة</p>
                  <Button
                    onClick={() => setIsPriceDialogOpen(true)}
                    className="mt-4 bg-[#001f24] hover:bg-[#03363d] text-white"
                  >
                    <Plus className="h-4 w-4 ml-2" />
                    إضافة سعر
                  </Button>
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {pricing?.map((p: any) => (
                    <div
                      key={p._id}
                      className="flex items-center justify-between p-4 hover:bg-[#f7fafa]"
                    >
                      <div>
                        <p className="font-medium text-[#001f24]">
                          {p.gradeName || p.gradeNameEn || "غير محدد"}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {p.description || "لا يوجد وصف"}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-lg font-bold text-[#1a7a8a]">
                          {p.price} {p.currency}
                        </span>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full ${p.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}
                        >
                          {p.isActive ? "نشط" : "غير نشط"}
                        </span>
                        <button
                          onClick={() => openEditPrice(p)}
                          className="p-1.5 hover:bg-blue-50 rounded-lg"
                        >
                          <Edit className="h-4 w-4 text-gray-400 hover:text-blue-600" />
                        </button>
                        <button
                          onClick={() => handleTogglePrice(p._id, p.isActive)}
                          className="p-1.5 hover:bg-amber-50 rounded-lg"
                        >
                          <RefreshCw className="h-4 w-4 text-gray-400 hover:text-amber-600" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* ✅ Dialog: إضافة/تعديل سعر الصف */}
      <Dialog open={isPriceDialogOpen} onOpenChange={setIsPriceDialogOpen}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-[#001f24] flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-[#1a7a8a]" />
              {editingPrice ? "تعديل سعر الصف" : "إضافة سعر صف"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>الصف الدراسي *</Label>
              <Select
                value={priceData.gradeId}
                onValueChange={handleGradeChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر الصف" />
                </SelectTrigger>
                <SelectContent>
                  {grades?.map((g: any) => (
                    <SelectItem key={g._id} value={g._id}>
                      {g.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>السعر *</Label>
              <div className="relative">
                <DollarSign className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={priceData.price}
                  onChange={(e) =>
                    setPriceData({ ...priceData, price: e.target.value })
                  }
                  className="pr-10"
                  placeholder="أدخل السعر"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>العملة</Label>
              <Select
                value={priceData.currency}
                onValueChange={handleCurrencyChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر العملة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SAR">ريال سعودي (SAR)</SelectItem>
                  <SelectItem value="EGP">جنيه مصري (EGP)</SelectItem>
                  <SelectItem value="USD">دولار أمريكي (USD)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>الوصف (اختياري)</Label>
              <Input
                value={priceData.description}
                onChange={(e) =>
                  setPriceData({ ...priceData, description: e.target.value })
                }
                placeholder="وصف السعر"
              />
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setIsPriceDialogOpen(false);
                setError(null);
              }}
            >
              إلغاء
            </Button>
            <Button
              onClick={handleSetPrice}
              disabled={isSubmitting}
              className="bg-[#001f24] hover:bg-[#03363d] text-white"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "حفظ السعر"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}