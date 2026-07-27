// app/(pages)/(roles)/admin/store/reports/page.tsx

"use client";

import { useState, useRef } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import Link from "next/link";
import {
  FileText,
  Printer,
  Download,
  Loader2,
  ArrowRight,
  Package,
  TrendingUp,
  AlertTriangle,
  PackageOpen,
  Calendar,
  Filter,
  RefreshCw,
  FileBarChart,
  FilePieChart,
  FileSpreadsheet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

function formatDate(ts: number) {
  return format(new Date(ts), "dd MMM yyyy - HH:mm", { locale: ar });
}

function formatDateShort(ts: number) {
  return format(new Date(ts), "dd MMM yyyy", { locale: ar });
}

const typeLabels: Record<string, string> = {
  books: "كتب",
  stationery: "قرطاسية",
  electronics: "إلكترونيات",
  uniforms: "زي مدرسي",
  supplies: "مستلزمات",
  other: "أخرى",
};

const statusLabels: Record<string, string> = {
  active: "نشط",
  inactive: "غير نشط",
  out_of_stock: "نفد",
};

export default function AdminStoreReportsPage() {
  const [reportType, setReportType] = useState<"inventory" | "movement">("inventory");
  const printRef = useRef<HTMLDivElement>(null);

  // ── Queries ───────────────────────────────────────────────────
  const inventoryReport = useQuery(api.store.reports.getInventoryReport);
  const movementReport = useQuery(api.store.reports.getMovementReport, {});

  // ── Loading ──────────────────────────────────────────────────
  if (inventoryReport === undefined || movementReport === undefined) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-[#1a7a8a]" />
      </div>
    );
  }

  // ── Handlers ─────────────────────────────────────────────────
  const handlePrint = () => {
    if (printRef.current) {
      const printContents = printRef.current.innerHTML;
      const originalContents = document.body.innerHTML;
      document.body.innerHTML = printContents;
      window.print();
      document.body.innerHTML = originalContents;
      window.location.reload();
    }
  };

  const handleExportPDF = () => {
    // سيتم تنفيذ التصدير باستخدام مكتبة مثل jsPDF أو html2canvas
    alert("سيتم إضافة ميزة تصدير PDF قريباً");
  };

  // ── Stats ────────────────────────────────────────────────────
  const inventoryStats = inventoryReport?.summary || {
    totalItems: 0,
    totalQuantity: 0,
    totalValue: 0,
    lowStock: 0,
    outOfStock: 0,
  };

  const movementStats = movementReport?.summary || {
    totalPurchases: 0,
    totalSales: 0,
    totalTransactions: 0,
    purchaseCount: 0,
    saleCount: 0,
  };

  return (
    <div className="min-h-screen bg-[#f7fafa]" dir="rtl">
      {/* Header */}
      <header className="bg-linear-to-r from-[#001f24] to-[#03363d] px-8 py-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <FileBarChart className="h-6 w-6" />
              تقارير المخزن
            </h1>
            <p className="text-[#a3ced6] text-sm mt-0.5">
              تقارير المخزون وحركة الأصناف
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
              onClick={handlePrint}
              className="bg-[#1a7a8a] hover:bg-[#15707e] text-white"
            >
              <Printer className="h-4 w-4 ml-2" />
              طباعة
            </Button>
            <Button
              onClick={handleExportPDF}
              variant="outline"
              className="bg-white/15 hover:bg-white/25 text-white border border-white/20"
            >
              <Download className="h-4 w-4 ml-2" />
              PDF
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        {/* Stats Cards */}
        {reportType === "inventory" ? (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Card>
              <CardContent className="p-4">
                <p className="text-2xl font-bold text-[#001f24]">{inventoryStats.totalItems}</p>
                <p className="text-xs text-gray-500">إجمالي الأصناف</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-2xl font-bold text-[#001f24]">{inventoryStats.totalQuantity}</p>
                <p className="text-xs text-gray-500">إجمالي الوحدات</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-2xl font-bold text-[#1a7a8a]">
                  {inventoryStats.totalValue.toFixed(2)}
                </p>
                <p className="text-xs text-gray-500">قيمة المخزون</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-2xl font-bold text-amber-600">{inventoryStats.lowStock}</p>
                <p className="text-xs text-gray-500">مخزون منخفض</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-2xl font-bold text-red-600">{inventoryStats.outOfStock}</p>
                <p className="text-xs text-gray-500">نفد من المخزون</p>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <p className="text-2xl font-bold text-[#001f24]">{movementStats.totalTransactions}</p>
                <p className="text-xs text-gray-500">إجمالي المعاملات</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-2xl font-bold text-green-600">
                  {movementStats.totalPurchases.toFixed(2)}
                </p>
                <p className="text-xs text-gray-500">إجمالي المشتريات</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-2xl font-bold text-blue-600">
                  {movementStats.totalSales.toFixed(2)}
                </p>
                <p className="text-xs text-gray-500">إجمالي المبيعات</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-green-600">+{movementStats.purchaseCount}</span>
                  <span className="text-sm text-blue-600">-{movementStats.saleCount}</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">المشتريات / المبيعات</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Report Content */}
        <div ref={printRef}>
          <Tabs
            defaultValue="inventory"
            className="w-full"
            onValueChange={(v) => setReportType(v as "inventory" | "movement")}
          >
            <TabsList className="grid grid-cols-2 max-w-md">
              <TabsTrigger value="inventory">تقرير المخزون</TabsTrigger>
              <TabsTrigger value="movement">تقرير الحركة</TabsTrigger>
            </TabsList>

            {/* Inventory Report */}
            <TabsContent value="inventory" className="mt-4">
              <div className="bg-white rounded-xl border border-[#c0c8c9] overflow-hidden">
                <div className="px-6 py-4 border-b border-[#c0c8c9] bg-[#f7fafa] flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-[#001f24]">تقرير المخزون</h3>
                    <p className="text-xs text-gray-500">
                      تم الإنشاء: {formatDate(inventoryReport.generatedAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-[#001f24] text-white">
                      {inventoryReport.items.length} صنف
                    </Badge>
                  </div>
                </div>

                {inventoryReport.items.length === 0 ? (
                  <div className="py-16 text-center">
                    <Package className="h-12 w-12 text-gray-200 mx-auto mb-3" />
                    <p className="text-gray-400">لا توجد أصناف في المخزون</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto" dir="rtl">
                    <table className="w-full">
                      <thead className="bg-[#f7fafa] border-b border-[#c0c8c9]">
                        <tr>
                          <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">#</th>
                          <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">الكود</th>
                          <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">الاسم</th>
                          <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">النوع</th>
                          <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">الكمية</th>
                          <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">متوسط التكلفة</th>
                          <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">قيمة المخزون</th>
                          <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">الحالة</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50" dir="rtl">
                        {inventoryReport.items.map((item: any, index: number) => (
                          <tr key={index} className="hover:bg-[#f7fafa] transition-colors">
                            <td className="px-4 py-3 text-sm text-gray-500">{index + 1}</td>
                            <td className="px-4 py-3">
                              <code className="text-xs font-mono bg-gray-100 px-2 py-1 rounded">
                                {item.code}
                              </code>
                            </td>
                            <td className="px-4 py-3">
                              <p className="font-medium text-[#001f24] text-sm">{item.name}</p>
                            </td>
                            <td className="px-4 py-3">
                              <Badge className="bg-gray-100 text-gray-700">
                                {typeLabels[item.type] || item.type}
                              </Badge>
                            </td>
                            <td className="px-4 py-3">
                              <span className={item.quantity === 0 ? "text-red-600" : "text-[#001f24]"}>
                                {item.quantity}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">
                              {item.avgCost.toFixed(2)}
                            </td>
                            <td className="px-4 py-3 text-sm font-medium text-[#1a7a8a]">
                              {item.stockValue.toFixed(2)}
                            </td>
                            <td className="px-4 py-3">
                              <Badge
                                className={
                                  item.status === "active"
                                    ? "bg-green-100 text-green-700"
                                    : item.status === "out_of_stock"
                                    ? "bg-red-100 text-red-700"
                                    : "bg-gray-100 text-gray-600"
                                }
                              >
                                {statusLabels[item.status] || item.status}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Footer */}
                {inventoryReport.items.length > 0 && (
                  <div className="px-6 py-3 border-t border-gray-50 bg-[#f7fafa]">
                    <p className="text-xs text-gray-400">
                      عرض {inventoryReport.items.length} صنف
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Movement Report */}
            <TabsContent value="movement" className="mt-4">
              <div className="bg-white rounded-xl border border-[#c0c8c9] overflow-hidden">
                <div className="px-6 py-4 border-b border-[#c0c8c9] bg-[#f7fafa] flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-[#001f24]">تقرير حركة المخزون</h3>
                    <p className="text-xs text-gray-500">
                      تم الإنشاء: {formatDate(movementReport.generatedAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-[#001f24] text-white">
                      {movementReport.transactions.length} معاملة
                    </Badge>
                  </div>
                </div>

                {movementReport.transactions.length === 0 ? (
                  <div className="py-16 text-center">
                    <Package className="h-12 w-12 text-gray-200 mx-auto mb-3" />
                    <p className="text-gray-400">لا توجد معاملات</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto" dir="rtl">
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
                      <tbody className="divide-y divide-gray-50" dir="rtl">
                        {movementReport.transactions.map((t: any, index: number) => (
                          <tr key={index} className="hover:bg-[#f7fafa] transition-colors">
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
                              <Badge
                                className={
                                  t.type === "purchase"
                                    ? "bg-green-100 text-green-700"
                                    : t.type === "sale"
                                    ? "bg-blue-100 text-blue-700"
                                    : t.type === "return"
                                    ? "bg-amber-100 text-amber-700"
                                    : "bg-gray-100 text-gray-700"
                                }
                              >
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
                              {formatDateShort(t.createdAt)}
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

                {/* Footer */}
                {movementReport.transactions.length > 0 && (
                  <div className="px-6 py-3 border-t border-gray-50 bg-[#f7fafa]">
                    <p className="text-xs text-gray-400">
                      عرض {movementReport.transactions.length} معاملة
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}