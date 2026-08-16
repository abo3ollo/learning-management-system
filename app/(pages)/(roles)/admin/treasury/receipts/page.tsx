// app/(pages)/(roles)/admin/treasury/receipts/page.tsx
"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import Link from "next/link";
import {
  ArrowRight,
  Plus,
  Search,
  Edit,
  Trash2,
  Loader2,
  RefreshCw,
  Printer,
  Receipt,
  DollarSign,
  AlertCircle,
} from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";

function formatDate(ts?: number) {
  if (!ts) return "—";
  return format(new Date(ts), "dd MMM yyyy", { locale: ar });
}

export default function ReceiptVouchersPage() {
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVoucher, setEditingVoucher] = useState<any>(null);
  const [formData, setFormData] = useState({
    recipientName: "",
    amount: "",
    currency: "EGP",
    notes: "",
    date: new Date().toISOString().split("T")[0],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Queries ───────────────────────────────────────────────────
  const vouchers = useQuery(api.treasury.treasury.getReceiptVouchers, {});
  const currentUser = useQuery(api.user.auth.getCurrentUser);

  // ── Mutations ─────────────────────────────────────────────────
  const createVoucher = useMutation(api.treasury.treasury.createReceiptVoucher);
  const updateVoucher = useMutation(api.treasury.treasury.updateReceiptVoucher);
  const deleteVoucher = useMutation(api.treasury.treasury.deleteReceiptVoucher);

  // ── Handlers ─────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!formData.recipientName || !formData.amount) {
      setError("يرجى إدخال المستلم والمبلغ");
      return;
    }

    if (!currentUser) {
      setError("يرجى تسجيل الدخول أولاً");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const data = {
        recipientId: currentUser._id as Id<"users">,
        recipientName: formData.recipientName,
        amount: parseFloat(formData.amount),
        currency: formData.currency,
        notes: formData.notes || undefined,
        date: new Date(formData.date).getTime(),
      };

      if (editingVoucher) {
        await updateVoucher({
          voucherId: editingVoucher._id,
          ...data,
        });
        toast.success("✅ تم تحديث السند بنجاح");
      } else {
        await createVoucher(data);
        toast.success("✅ تم إنشاء السند بنجاح");
      }

      setIsModalOpen(false);
      resetForm();
    } catch (err: any) {
      console.error("Error:", err);
      setError(err.message || "حدث خطأ في حفظ السند");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (voucherId: string) => {
    if (!confirm("هل أنت متأكد من حذف هذا السند؟")) return;
    try {
      await deleteVoucher({ voucherId: voucherId as Id<"receiptVouchers"> });
      toast.success("✅ تم حذف السند بنجاح");
    } catch (err: any) {
      toast.error(err.message || "حدث خطأ");
    }
  };

  const resetForm = () => {
    setFormData({
      recipientName: "",
      amount: "",
      currency: "EGP",
      notes: "",
      date: new Date().toISOString().split("T")[0],
    });
    setEditingVoucher(null);
    setError(null);
  };

  const openEdit = (voucher: any) => {
    setEditingVoucher(voucher);
    setFormData({
      recipientName: voucher.recipientName,
      amount: voucher.amount.toString(),
      currency: voucher.currency || "EGP",
      notes: voucher.notes || "",
      date: new Date(voucher.date).toISOString().split("T")[0],
    });
    setIsModalOpen(true);
  };

  const handlePrint = (voucher: any) => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html dir="rtl">
          <head>
            <title>سند قبض</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 40px; max-width: 600px; margin: 0 auto; }
              h2 { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; }
              .info { margin: 10px 0; }
              .label { font-weight: bold; }
            </style>
          </head>
          <body>
            <h2>سند قبض</h2>
            <div class="info"><span class="label">رقم السند:</span> ${voucher.voucherNumber}</div>
            <div class="info"><span class="label">المستلم:</span> ${voucher.recipientName}</div>
            <div class="info"><span class="label">المبلغ:</span> ${voucher.amount.toFixed(2)} ${voucher.currency}</div>
            <div class="info"><span class="label">البيان:</span> ${voucher.notes || "—"}</div>
            <div class="info"><span class="label">التاريخ:</span> ${formatDate(voucher.date)}</div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  // ── Filters ───────────────────────────────────────────────────
  const filteredVouchers = (vouchers || []).filter((v: any) => {
    const matchSearch =
      !search ||
      v.voucherNumber?.toLowerCase().includes(search.toLowerCase()) ||
      v.recipientName?.toLowerCase().includes(search.toLowerCase()) ||
      v.notes?.toLowerCase().includes(search.toLowerCase());
    return matchSearch;
  });

  // ── Loading ──────────────────────────────────────────────────
  if (vouchers === undefined || currentUser === undefined) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-[#1a7a8a]" />
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-3" />
          <p className="text-gray-600">يرجى تسجيل الدخول للوصول إلى هذه الصفحة</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7fafa]" dir="rtl">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <Link
              href="/admin/treasury"
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="العودة للرئيسية"
            >
              <ArrowRight className="h-5 w-5 text-gray-400 hover:text-gray-600" />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Receipt className="h-5 w-5 text-green-600" />
                سندات القبض
              </h1>
              <p className="text-sm text-gray-500">إدارة سندات القبض المالية</p>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <Button
              variant="outline"
              onClick={() => window.location.reload()}
              className="gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              تحديث
            </Button>
            <Button
              onClick={() => {
                resetForm();
                setIsModalOpen(true);
              }}
              className="bg-[#001f24] hover:bg-[#03363d] text-white gap-2"
            >
              <Plus className="h-4 w-4" />
              سند قبض جديد
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        {/* Search */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-48 relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="بحث برقم السند أو المستلم..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pr-10"
            />
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {filteredVouchers.length === 0 ? (
            <div className="py-16 text-center">
              <Receipt className="h-12 w-12 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-400">لا توجد سندات قبض</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">#</TableHead>
                      <TableHead>رقم السند</TableHead>
                      <TableHead>المستلم</TableHead>
                      <TableHead>المبلغ</TableHead>
                      <TableHead>البيان</TableHead>
                      <TableHead>التاريخ</TableHead>
                      <TableHead className="text-center">الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredVouchers.map((voucher: any, index: number) => (
                      <TableRow key={voucher._id}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell className="font-mono font-medium">
                          {voucher.voucherNumber}
                        </TableCell>
                        <TableCell>{voucher.recipientName}</TableCell>
                        <TableCell className="font-bold text-green-600">
                          {voucher.amount.toFixed(2)} {voucher.currency}
                        </TableCell>
                        <TableCell className="max-w-32 truncate">
                          {voucher.notes || "—"}
                        </TableCell>
                        <TableCell>{formatDate(voucher.date)}</TableCell>
                        <TableCell>
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handlePrint(voucher)}
                              className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                              title="طباعة"
                            >
                              <Printer className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                            </button>
                            <button
                              onClick={() => openEdit(voucher)}
                              className="p-1.5 hover:bg-blue-50 rounded-lg transition-colors"
                              title="تعديل"
                            >
                              <Edit className="h-4 w-4 text-blue-400 hover:text-blue-600" />
                            </button>
                            <button
                              onClick={() => handleDelete(voucher._id)}
                              className="p-1.5 hover:bg-red-50 rounded-lg transition-colors"
                              title="حذف"
                            >
                              <Trash2 className="h-4 w-4 text-red-400 hover:text-red-600" />
                            </button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="px-5 py-3 border-t border-gray-50 bg-[#f7fafa] flex items-center justify-between flex-wrap gap-2">
                <p className="text-xs text-gray-400">
                  إجمالي السندات: {filteredVouchers.length}
                </p>
                <p className="text-sm font-bold text-green-600">
                  إجمالي المبالغ:{" "}
                  {filteredVouchers.reduce((sum: number, v: any) => sum + v.amount, 0).toFixed(2)}{" "}
                  EGP
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Modal ────────────────────────────────────────────────── */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5 text-green-600" />
              {editingVoucher ? "تعديل سند قبض" : "سند قبض جديد"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">المستلم *</label>
              <Input
                value={formData.recipientName}
                onChange={(e) =>
                  setFormData({ ...formData, recipientName: e.target.value })
                }
                placeholder="أدخل اسم المستلم"
              />
              <p className="text-xs text-gray-400">
                * سيتم ربط السند بالمستخدم الحالي
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">المبلغ *</label>
              <div className="relative">
                <DollarSign className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) =>
                    setFormData({ ...formData, amount: e.target.value })
                  }
                  placeholder="أدخل المبلغ"
                  className="pr-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">العملة</label>
              <select
                value={formData.currency}
                onChange={(e) =>
                  setFormData({ ...formData, currency: e.target.value })
                }
                className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a7a8a]/20"
              >
                <option value="EGP">جنيه مصري (EGP)</option>
                <option value="SAR">ريال سعودي (SAR)</option>
                <option value="USD">دولار أمريكي (USD)</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">البيان (ملاحظات)</label>
              <Input
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                placeholder="أدخل البيان"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">التاريخ *</label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) =>
                  setFormData({ ...formData, date: e.target.value })
                }
                className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a7a8a]/20"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-600 bg-red-50 border border-red-100 px-4 py-3 rounded-xl text-sm">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsModalOpen(false);
                resetForm();
              }}
            >
              إلغاء
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="bg-[#001f24] hover:bg-[#03363d] text-white"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                editingVoucher ? "تحديث" : "حفظ"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}