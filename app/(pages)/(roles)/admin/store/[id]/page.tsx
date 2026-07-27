// app/(pages)/(roles)/admin/store/[id]/page.tsx

"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import Link from "next/link";
import {
  ArrowRight,
  Loader2,
  Package,
  Edit,
  Trash2,
  Plus,
  ShoppingBag,
  AlertCircle,
  Check,
  X,
  Calendar,
  User,
  TrendingUp,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

function formatDate(ts: number) {
  return format(new Date(ts), "dd MMM yyyy - HH:mm", { locale: ar });
}

const typeLabels: Record<string, string> = {
  books: "كتب",
  stationery: "قرطاسية",
  electronics: "إلكترونيات",
  uniforms: "زي مدرسي",
  supplies: "مستلزمات",
  other: "أخرى",
};

const typeColors: Record<string, string> = {
  books: "bg-blue-100 text-blue-700",
  stationery: "bg-green-100 text-green-700",
  electronics: "bg-purple-100 text-purple-700",
  uniforms: "bg-amber-100 text-amber-700",
  supplies: "bg-cyan-100 text-cyan-700",
  other: "bg-gray-100 text-gray-700",
};

const statusLabels: Record<string, string> = {
  active: "نشط",
  inactive: "غير نشط",
  out_of_stock: "نفد",
};

const statusColors: Record<string, string> = {
  active: "bg-green-100 text-green-700",
  inactive: "bg-gray-100 text-gray-600",
  out_of_stock: "bg-red-100 text-red-700",
};

const transactionLabels: Record<string, string> = {
  purchase: "شراء",
  sale: "بيع",
  adjustment: "تعديل",
  return: "مرتجع",
};

const transactionColors: Record<string, string> = {
  purchase: "bg-green-100 text-green-700",
  sale: "bg-blue-100 text-blue-700",
  adjustment: "bg-amber-100 text-amber-700",
  return: "bg-red-100 text-red-700",
};

export default function StoreItemDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const itemId = params.id as string;

  const [isAddPurchaseOpen, setIsAddPurchaseOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // ── Purchase form state ──────────────────────────────────────
  const [purchaseData, setPurchaseData] = useState({
    quantity: "",
    unitPrice: "",
    notes: "",
  });

  // ── Queries ───────────────────────────────────────────────────
  const item = useQuery(api.store.items.getItemById, {
    itemId: itemId as any,
  });

  // ── Mutations ─────────────────────────────────────────────────
  const addPurchase = useMutation(api.store.items.addPurchase);
  const deleteItem = useMutation(api.store.items.deleteItem);

  // ── Handlers ─────────────────────────────────────────────────
  const handleAddPurchase = async () => {
    if (!purchaseData.quantity || !purchaseData.unitPrice) {
      setError("يرجى ملء جميع الحقول المطلوبة");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await addPurchase({
        itemId: itemId as any,
        quantity: parseInt(purchaseData.quantity),
        unitPrice: parseFloat(purchaseData.unitPrice),
        notes: purchaseData.notes || undefined,
      });

      setSuccess("✅ تم إضافة المشتريات بنجاح");
      setPurchaseData({ quantity: "", unitPrice: "", notes: "" });
      setIsAddPurchaseOpen(false);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || "حدث خطأ أثناء إضافة المشتريات");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      await deleteItem({
        itemId: itemId as any,
      });
      router.push("/admin/store");
    } catch (err: any) {
      setError(err.message || "حدث خطأ أثناء حذف الصنف");
      setIsSubmitting(false);
    }
  };

  // ── Loading ──────────────────────────────────────────────────
  if (item === undefined) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-[#1a7a8a]" />
      </div>
    );
  }

  if (!item) {
    return (
      <div className="min-h-screen bg-[#f7fafa] flex items-center justify-center">
        <Card className="p-12 text-center max-w-md">
          <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-700">الصنف غير موجود</h2>
          <p className="text-gray-500 text-sm mt-2">لم يتم العثور على هذا الصنف</p>
          <Link href="/admin/store">
            <Button className="mt-4">
              <ArrowRight className="h-4 w-4 ml-2" />
              العودة للمخزن
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  const stockValue = item.avgCost * item.quantity;

  return (
    <div className="min-h-screen bg-[#f7fafa]" dir="rtl">
      {/* Header */}
      <header className="bg-linear-to-r from-[#001f24] to-[#03363d] px-8 py-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <Link href="/admin/store">
                <Button variant="ghost" className="text-white/70 hover:text-white p-0">
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
              <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                <Package className="h-6 w-6" />
                {item.name}
              </h1>
            </div>
            <p className="text-[#a3ced6] text-sm mt-0.5">
              تفاصيل الصنف ومعاملات المخزون
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              onClick={() => setIsAddPurchaseOpen(true)}
              className="bg-[#1a7a8a] hover:bg-[#15707e] text-white"
            >
              <ShoppingBag className="h-4 w-4 ml-2" />
              إضافة مشتريات
            </Button>
            <Link href={`/admin/store/${itemId}/edit`}>
              <Button variant="outline" className="bg-white/15 hover:bg-white/25 text-white border border-white/20">
                <Edit className="h-4 w-4 ml-2" />
                تعديل
              </Button>
            </Link>
            <Button
              onClick={() => setIsDeleteDialogOpen(true)}
              variant="outline"
              className="bg-red-500/15 hover:bg-red-500/25 text-red-400 border-red-500/20"
            >
              <Trash2 className="h-4 w-4 ml-2" />
              حذف
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        {/* Error / Success */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-500 shrink-0" />
            <p className="text-red-700 text-sm flex-1">{error}</p>
            <button onClick={() => setError(null)} className="p-1 hover:bg-red-100 rounded-lg">
              <X className="h-4 w-4 text-red-400" />
            </button>
          </div>
        )}
        {success && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3">
            <Check className="h-5 w-5 text-green-500 shrink-0" />
            <p className="text-green-700 text-sm flex-1">{success}</p>
            <button onClick={() => setSuccess(null)} className="p-1 hover:bg-green-100 rounded-lg">
              <X className="h-4 w-4 text-green-400" />
            </button>
          </div>
        )}

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Basic Info */}
          <Card className="md:col-span-2">
            <CardHeader className="border-b">
              <CardTitle className="text-lg">معلومات الصنف</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-400">الكود</p>
                  <code className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                    {item.code}
                  </code>
                </div>
                <div>
                  <p className="text-xs text-gray-400">الحالة</p>
                  <Badge className={statusColors[item.status] || "bg-gray-100 text-gray-700"}>
                    {statusLabels[item.status] || item.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs text-gray-400">النوع</p>
                  <Badge className={typeColors[item.type] || "bg-gray-100 text-gray-700"}>
                    {typeLabels[item.type] || item.type}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs text-gray-400">وحدة القياس</p>
                  <p className="text-sm font-medium text-[#001f24]">
                    {item.unit === "piece" ? "قطعة" :
                     item.unit === "kg" ? "كيلو" :
                     item.unit === "meter" ? "متر" :
                     item.unit === "box" ? "علبة" :
                     item.unit === "liter" ? "لتر" : item.unit}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">الصف الدراسي</p>
                  <p className="text-sm font-medium text-[#001f24]">{item.gradeName || "غير محدد"}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">تاريخ الإضافة</p>
                  <p className="text-sm font-medium text-[#001f24]">{formatDate(item.createdAt)}</p>
                </div>
              </div>
              {item.description && (
                <div>
                  <p className="text-xs text-gray-400">الوصف</p>
                  <p className="text-sm text-[#001f24]">{item.description}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Stock Summary */}
          <Card>
            <CardHeader className="border-b">
              <CardTitle className="text-lg">ملخص المخزون</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="text-center p-4 bg-[#f7fafa] rounded-xl">
                <p className="text-3xl font-bold text-[#001f24]">{item.quantity}</p>
                <p className="text-xs text-gray-500">الكمية المتاحة</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-[#f7fafa] rounded-xl text-center">
                  <p className="text-sm font-bold text-[#1a7a8a]">{item.purchasePrice.toFixed(2)}</p>
                  <p className="text-xs text-gray-500">سعر الشراء</p>
                </div>
                <div className="p-3 bg-[#f7fafa] rounded-xl text-center">
                  <p className="text-sm font-bold text-[#1a7a8a]">{item.sellingPrice.toFixed(2)}</p>
                  <p className="text-xs text-gray-500">سعر البيع</p>
                </div>
                <div className="p-3 bg-[#f7fafa] rounded-xl text-center">
                  <p className="text-sm font-bold text-[#1a7a8a]">{item.avgCost.toFixed(2)}</p>
                  <p className="text-xs text-gray-500">متوسط التكلفة</p>
                </div>
                <div className="p-3 bg-[#f7fafa] rounded-xl text-center">
                  <p className="text-sm font-bold text-[#1a7a8a]">{stockValue.toFixed(2)}</p>
                  <p className="text-xs text-gray-500">قيمة المخزون</p>
                </div>
              </div>
              {item.minStock && (
                <div className="flex items-center gap-2 p-2 bg-amber-50 rounded-lg">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  <p className="text-xs text-amber-700">
                    الحد الأدنى: {item.minStock} وحدة
                    {item.quantity <= item.minStock && (
                      <span className="font-bold mr-1">⚠️ مخزون منخفض!</span>
                    )}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Transactions */}
        <Card>
          <CardHeader className="border-b flex flex-row items-center justify-between">
            <CardTitle className="text-lg">سجل المعاملات</CardTitle>
            <Badge className="bg-[#1a7a8a] text-white">
              {item.transactions?.length || 0} معاملة
            </Badge>
          </CardHeader>
          <CardContent className="p-0">
            {item.transactions?.length === 0 ? (
              <div className="py-12 text-center">
                <ShoppingBag className="h-12 w-12 text-gray-200 mx-auto mb-3" />
                <p className="text-gray-400">لا توجد معاملات</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-[#f7fafa] border-b border-[#c0c8c9]">
                    <tr>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">#</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">النوع</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">الكمية</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">سعر الوحدة</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">الإجمالي</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">التاريخ</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">بواسطة</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">ملاحظات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {item.transactions.map((t: any, index: number) => (
                      <tr key={t._id || index} className="hover:bg-[#f7fafa] transition-colors">
                        <td className="px-4 py-3 text-sm text-gray-500">{index + 1}</td>
                        <td className="px-4 py-3">
                          <Badge className={transactionColors[t.type] || "bg-gray-100 text-gray-700"}>
                            {transactionLabels[t.type] || t.type}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <span className={t.quantity > 0 ? "text-green-600" : "text-red-600"}>
                            {t.quantity > 0 ? `+${t.quantity}` : t.quantity}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {t.unitPrice.toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-[#1a7a8a]">
                          {t.totalPrice.toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {formatDate(t.createdAt)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {t.createdByName || "غير معروف"}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-400 max-w-32 truncate">
                          {t.notes || "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {item.transactions?.length > 0 && (
              <div className="px-6 py-3 border-t border-gray-50 bg-[#f7fafa]">
                <p className="text-xs text-gray-400">
                  عرض {item.transactions.length} معاملة
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ✅ Add Purchase Dialog */}
      <Dialog open={isAddPurchaseOpen} onOpenChange={setIsAddPurchaseOpen}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-[#001f24] flex items-center gap-2">
              <ShoppingBag className="h-5 w-5 text-[#1a7a8a]" />
              إضافة مشتريات
            </DialogTitle>
            <p className="text-sm text-gray-500">
              أضف كمية جديدة من {item.name} إلى المخزون
            </p>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-1">
                  الكمية <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="number"
                  min="1"
                  value={purchaseData.quantity}
                  onChange={(e) =>
                    setPurchaseData({ ...purchaseData, quantity: e.target.value })
                  }
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-1">
                  سعر الوحدة <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">ج.م</span>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={purchaseData.unitPrice}
                    onChange={(e) =>
                      setPurchaseData({ ...purchaseData, unitPrice: e.target.value })
                    }
                    placeholder="0.00"
                    className="pr-12"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>ملاحظات</Label>
              <Input
                value={purchaseData.notes}
                onChange={(e) =>
                  setPurchaseData({ ...purchaseData, notes: e.target.value })
                }
                placeholder="ملاحظات إضافية (اختياري)"
              />
            </div>

            <div className="p-3 bg-[#f7fafa] rounded-lg">
              <p className="text-sm text-gray-600">
                <span className="font-medium">الكمية الحالية:</span> {item.quantity} وحدة
              </p>
              <p className="text-sm text-gray-600">
                <span className="font-medium">متوسط التكلفة الحالي:</span> {item.avgCost.toFixed(2)}
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setIsAddPurchaseOpen(false);
                setError(null);
              }}
            >
              إلغاء
            </Button>
            <Button
              onClick={handleAddPurchase}
              disabled={isSubmitting}
              className="bg-[#001f24] hover:bg-[#03363d] text-white"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Check className="h-4 w-4 ml-2" />
                  إضافة
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ✅ Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="max-w-sm" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-red-600 flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              تأكيد الحذف
            </DialogTitle>
          </DialogHeader>

          <div className="py-4">
            <p className="text-gray-700">
              هل أنت متأكد من حذف الصنف <span className="font-bold">{item.name}</span>؟
            </p>
            {item.quantity > 0 && (
              <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  لا يمكن حذف الصنف لأنه يحتوي على {item.quantity} وحدة في المخزون.
                  يجب سحب الكمية أولاً.
                </p>
              </div>
            )}
            {error && (
              <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setIsDeleteDialogOpen(false);
                setError(null);
              }}
              disabled={isSubmitting}
            >
              إلغاء
            </Button>
            <Button
              onClick={handleDelete}
              disabled={isSubmitting || item.quantity > 0}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Trash2 className="h-4 w-4 ml-2" />
                  حذف
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}