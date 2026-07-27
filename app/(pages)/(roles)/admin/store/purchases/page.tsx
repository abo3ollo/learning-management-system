// app/(pages)/(roles)/admin/store/purchases/page.tsx

"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import Link from "next/link";
import {
  ShoppingBag,
  Plus,
  Search,
  Loader2,
  ArrowRight,
  AlertCircle,
  Check,
  X,
  Calendar,
  Package,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
  purchase: "شراء",
  sale: "بيع",
  adjustment: "تعديل",
  return: "مرتجع",
};

const typeColors: Record<string, string> = {
  purchase: "bg-green-100 text-green-700",
  sale: "bg-blue-100 text-blue-700",
  adjustment: "bg-amber-100 text-amber-700",
  return: "bg-red-100 text-red-700",
};

export default function AdminPurchasesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  // ── Queries ───────────────────────────────────────────────────
  const transactions = useQuery(api.store.transactions.getAllTransactions, {
    type: selectedType !== "all" ? (selectedType as any) : undefined,
  });

  const items = useQuery(api.store.items.getItems, {});

  // ── Mutations ─────────────────────────────────────────────────
  const addPurchase = useMutation(api.store.items.addPurchase);

  // ── State ────────────────────────────────────────────────────
  const [purchaseData, setPurchaseData] = useState({
    itemId: "",
    quantity: "",
    unitPrice: "",
    notes: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // ✅ معالجة تغيير الـ Select - تقبل string | null
  const handleItemSelect = (value: string | null) => {
    setPurchaseData({ ...purchaseData, itemId: value || "" });
  };

  // ── Handlers ─────────────────────────────────────────────────
  const handlePurchaseSubmit = async () => {
    if (!purchaseData.itemId || !purchaseData.quantity || !purchaseData.unitPrice) {
      setError("يرجى ملء جميع الحقول المطلوبة");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await addPurchase({
        itemId: purchaseData.itemId as any,
        quantity: parseInt(purchaseData.quantity),
        unitPrice: parseFloat(purchaseData.unitPrice),
        notes: purchaseData.notes || undefined,
      });

      setSuccess("✅ تم إضافة المشتريات بنجاح");
      setPurchaseData({
        itemId: "",
        quantity: "",
        unitPrice: "",
        notes: "",
      });
      setIsAddDialogOpen(false);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || "حدث خطأ أثناء إضافة المشتريات");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Loading ──────────────────────────────────────────────────
  if (transactions === undefined) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-[#1a7a8a]" />
      </div>
    );
  }

  const filteredTransactions = transactions.filter((t: any) => {
    if (!searchQuery) return true;
    const search = searchQuery.toLowerCase();
    return (
      t.itemName?.toLowerCase().includes(search) ||
      t.itemCode?.toLowerCase().includes(search) ||
      t.createdByName?.toLowerCase().includes(search)
    );
  });

  return (
    <div className="min-h-screen bg-[#f7fafa]" dir="rtl">
      {/* Header */}
      <header className="bg-linear-to-r from-[#001f24] to-[#03363d] px-8 py-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <ShoppingBag className="h-6 w-6" />
              المشتريات
            </h1>
            <p className="text-[#a3ced6] text-sm mt-0.5">
              إدارة مشتريات المخزون والحركات
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/admin/store">
              <Button className="bg-white/15 hover:bg-white/25 text-white border border-white/20">
                <ArrowRight className="h-4 w-4 ml-2" />
                العودة للمخزن
              </Button>
            </Link>
            <Button
              onClick={() => setIsAddDialogOpen(true)}
              className="bg-[#1a7a8a] hover:bg-[#15707e] text-white"
            >
              <Plus className="h-4 w-4 ml-2" />
              إضافة مشتريات
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <p className="text-2xl font-bold text-[#001f24]">
                {transactions.length}
              </p>
              <p className="text-xs text-gray-500">إجمالي المعاملات</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-2xl font-bold text-green-600">
                {transactions.filter((t: any) => t.type === "purchase").length}
              </p>
              <p className="text-xs text-gray-500">مشتريات</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-2xl font-bold text-blue-600">
                {transactions.filter((t: any) => t.type === "sale").length}
              </p>
              <p className="text-xs text-gray-500">مبيعات</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-2xl font-bold text-[#001f24]">
                {transactions
                  .filter((t: any) => t.type === "purchase")
                  .reduce((sum: number, t: any) => sum + t.totalPrice, 0)
                  .toFixed(2)}
              </p>
              <p className="text-xs text-gray-500">إجمالي المشتريات</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl border border-[#c0c8c9] p-4 flex flex-wrap gap-3 items-center">
          <div className="flex-1 min-w-48 relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="بحث عن معاملة..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-10"
            />
          </div>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="border border-gray-200 rounded-lg px-4 py-2 text-sm bg-white"
          >
            <option value="all">جميع المعاملات</option>
            <option value="purchase">مشتريات</option>
            <option value="sale">مبيعات</option>
            <option value="adjustment">تعديلات</option>
            <option value="return">مرتجعات</option>
          </select>
        </div>

        {/* Transactions Table */}
        <div className="bg-white rounded-xl border border-[#c0c8c9] overflow-hidden">
          {filteredTransactions.length === 0 ? (
            <div className="py-16 text-center">
              <ShoppingBag className="h-12 w-12 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-400">لا توجد معاملات</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#f7fafa] border-b border-[#c0c8c9]">
                  <tr>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">#</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">الصنف</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">النوع</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">الكمية</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">سعر الوحدة</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">الإجمالي</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">التاريخ</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">بواسطة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredTransactions.map((t: any, index: number) => (
                    <tr key={t._id} className="hover:bg-[#f7fafa] transition-colors">
                      <td className="px-4 py-3 text-sm text-gray-500">{index + 1}</td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-[#001f24] text-sm">
                            {t.itemName}
                          </p>
                          <code className="text-xs font-mono bg-gray-100 px-1.5 py-0.5 rounded">
                            {t.itemCode}
                          </code>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge className={typeColors[t.type] || "bg-gray-100 text-gray-700"}>
                          {typeLabels[t.type] || t.type}
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
                        {t.createdByName}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {filteredTransactions.length > 0 && (
            <div className="px-5 py-3 border-t border-gray-50 bg-[#f7fafa]">
              <p className="text-xs text-gray-400">
                عرض {filteredTransactions.length} معاملة
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ✅ Add Purchase Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-[#001f24] flex items-center gap-2">
              <ShoppingBag className="h-5 w-5 text-[#1a7a8a]" />
              إضافة مشتريات
            </DialogTitle>
            <p className="text-sm text-gray-500">
              أضف كمية جديدة من صنف موجود في المخزن
            </p>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}
            {success && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700 flex items-center gap-2">
                <Check className="h-4 w-4" />
                {success}
              </div>
            )}

            <div className="space-y-2">
              <Label className="flex items-center gap-1">
                الصنف <span className="text-red-500">*</span>
              </Label>
              <Select
                value={purchaseData.itemId}
                onValueChange={handleItemSelect}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر الصنف" />
                </SelectTrigger>
                <SelectContent>
                  {items?.map((item: any) => (
                    <SelectItem key={item._id} value={item._id}>
                      {item.name} ({item.code}) - الكمية: {item.quantity}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

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
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setIsAddDialogOpen(false);
                setError(null);
              }}
            >
              إلغاء
            </Button>
            <Button
              onClick={handlePurchaseSubmit}
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
    </div>
  );
}