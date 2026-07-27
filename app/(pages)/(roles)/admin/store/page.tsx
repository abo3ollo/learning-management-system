// app/(pages)/(roles)/admin/store/page.tsx

"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import Link from "next/link";
import {
  Plus,
  Search,
  Loader2,
  Package,
  ShoppingBag,
  TrendingUp,
  AlertTriangle,
  PackageOpen,
  Eye,
  Edit,
  Trash2,
  FileText,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

// ── Helpers ───────────────────────────────────────────────────────
const typeMap: Record<string, { label: string; color: string }> = {
  books: { label: "كتب", color: "bg-blue-100 text-blue-700" },
  stationery: { label: "قرطاسية", color: "bg-green-100 text-green-700" },
  electronics: { label: "إلكترونيات", color: "bg-purple-100 text-purple-700" },
  uniforms: { label: "زي مدرسي", color: "bg-amber-100 text-amber-700" },
  supplies: { label: "مستلزمات", color: "bg-cyan-100 text-cyan-700" },
  other: { label: "أخرى", color: "bg-gray-100 text-gray-700" },
};

const statusMap: Record<string, { label: string; color: string }> = {
  active: { label: "نشط", color: "bg-green-100 text-green-700" },
  inactive: { label: "غير نشط", color: "bg-gray-100 text-gray-600" },
  out_of_stock: { label: "نفد", color: "bg-red-100 text-red-700" },
};

export default function AdminStorePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");

  // ── Queries ───────────────────────────────────────────────────
  const items = useQuery(api.store.items.getItems, {
    search: searchQuery || undefined,
    type: selectedType !== "all" ? selectedType : undefined,
    status: selectedStatus !== "all" ? selectedStatus : undefined,
  });

  const stats = useQuery(api.store.items.getInventoryStats);

  // ── Loading ──────────────────────────────────────────────────
  if (items === undefined || stats === undefined) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-[#1a7a8a]" />
      </div>
    );
  }

  const typeOptions = [
    { value: "all", label: "جميع الأنواع" },
    { value: "books", label: "كتب" },
    { value: "stationery", label: "قرطاسية" },
    { value: "electronics", label: "إلكترونيات" },
    { value: "uniforms", label: "زي مدرسي" },
    { value: "supplies", label: "مستلزمات" },
    { value: "other", label: "أخرى" },
  ];

  const statusOptions = [
    { value: "all", label: "جميع الحالات" },
    { value: "active", label: "نشط" },
    { value: "inactive", label: "غير نشط" },
    { value: "out_of_stock", label: "نفد" },
  ];

  const getStatusBadge = (status: string) => {
    const s = statusMap[status] || { label: status, color: "bg-gray-100 text-gray-700" };
    return <Badge className={s.color}>{s.label}</Badge>;
  };

  const getTypeBadge = (type: string) => {
    const t = typeMap[type] || { label: type, color: "bg-gray-100 text-gray-700" };
    return <Badge className={t.color}>{t.label}</Badge>;
  };

  return (
    <div className="min-h-screen bg-[#f7fafa]" dir="rtl">
      {/* Header */}
      <header className="bg-linear-to-r from-[#001f24] to-[#03363d] px-8 py-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Package className="h-6 w-6" />
              المخـــزن
            </h1>
            <p className="text-[#a3ced6] text-sm mt-0.5">
              إدارة الأصناف والمخزون والمشتريات
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/admin/store/purchases">
              <Button className="bg-white/15 hover:bg-white/25 text-white border border-white/20">
                <ShoppingBag className="h-4 w-4 ml-2" />
                المشتريات
              </Button>
            </Link>
            <Link href="/admin/store/reports">
              <Button className="bg-white/15 hover:bg-white/25 text-white border border-white/20">
                <FileText className="h-4 w-4 ml-2" />
                تقارير
              </Button>
            </Link>
            <Link href="/admin/store/add">
              <Button className="bg-[#1a7a8a] hover:bg-[#15707e] text-white">
                <Plus className="h-4 w-4 ml-2" />
                إضافة صنف
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-[#001f24]">{stats.totalItems}</p>
                <p className="text-xs text-gray-500">إجمالي الأصناف</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                <Package className="h-5 w-5 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-[#001f24]">{stats.totalQuantity}</p>
                <p className="text-xs text-gray-500">إجمالي الوحدات</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
                <PackageOpen className="h-5 w-5 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-[#1a7a8a]">
                  {stats.totalValue.toFixed(2)}
                </p>
                <p className="text-xs text-gray-500">قيمة المخزون</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-teal-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-amber-600">{stats.lowStock}</p>
                <p className="text-xs text-gray-500">مخزون منخفض</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-red-600">{stats.outOfStock}</p>
                <p className="text-xs text-gray-500">نفد من المخزون</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
                <PackageOpen className="h-5 w-5 text-red-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl border border-[#c0c8c9] p-4 flex flex-wrap gap-3 items-center">
          <div className="flex-1 min-w-48 relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="بحث بالاسم أو الكود..."
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
            {typeOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="border border-gray-200 rounded-lg px-4 py-2 text-sm bg-white"
          >
            {statusOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <button
            onClick={() => {
              setSearchQuery("");
              setSelectedType("all");
              setSelectedStatus("all");
            }}
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
          >
            <RefreshCw className="h-4 w-4" />
            إعادة ضبط
          </button>
        </div>

        {/* Items Table */}
        <div className="bg-white rounded-xl border border-[#c0c8c9] overflow-hidden">
          {items.length === 0 ? (
            <div className="py-16 text-center">
              <Package className="h-12 w-12 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-400">لا توجد أصناف</p>
              <Link href="/admin/store/add">
                <Button className="mt-4 bg-[#001f24] hover:bg-[#03363d] text-white">
                  <Plus className="h-4 w-4 ml-2" />
                  إضافة أول صنف
                </Button>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#f7fafa] border-b border-[#c0c8c9]">
                  <tr>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">#</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">الكود</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">الاسم</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">النوع</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">الكمية</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">سعر الشراء</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">سعر البيع</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">قيمة المخزون</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">الحالة</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {items.map((item: any, index: number) => (
                    <tr key={item._id} className="hover:bg-[#f7fafa] transition-colors">
                      <td className="px-4 py-3 text-sm text-gray-500">{index + 1}</td>
                      <td className="px-4 py-3">
                        <code className="text-xs font-mono bg-gray-100 px-2 py-1 rounded">
                          {item.code}
                        </code>
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-[#001f24] text-sm">{item.name}</p>
                          {item.description && (
                            <p className="text-xs text-gray-400 truncate max-w-40">
                              {item.description}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">{getTypeBadge(item.type)}</td>
                      <td className="px-4 py-3">
                        <span className={`font-medium ${item.quantity <= (item.minStock || 0) && item.quantity > 0 ? "text-amber-600" : item.quantity === 0 ? "text-red-600" : "text-[#001f24]"}`}>
                          {item.quantity}
                        </span>
                        {item.minStock && (
                          <span className="text-xs text-gray-400 mr-1">
                            / حد {item.minStock}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {item.purchasePrice.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {item.sellingPrice.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-[#1a7a8a]">
                        {item.stockValue.toFixed(2)}
                      </td>
                      <td className="px-4 py-3">{getStatusBadge(item.status)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <Link href={`/admin/store/${item._id}`}>
                            <button className="p-1.5 hover:bg-blue-50 rounded-lg transition-colors">
                              <Eye className="h-4 w-4 text-gray-400 hover:text-blue-600" />
                            </button>
                          </Link>
                          <Link href={`/admin/store/${item._id}/edit`}>
                            <button className="p-1.5 hover:bg-blue-50 rounded-lg transition-colors">
                              <Edit className="h-4 w-4 text-gray-400 hover:text-blue-600" />
                            </button>
                          </Link>
                          <button className="p-1.5 hover:bg-red-50 rounded-lg transition-colors">
                            <Trash2 className="h-4 w-4 text-gray-400 hover:text-red-600" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Footer */}
          {items.length > 0 && (
            <div className="px-5 py-3 border-t border-gray-50 bg-[#f7fafa]">
              <p className="text-xs text-gray-400">
                عرض <span className="font-semibold text-[#001f24]">{items.length}</span> صنف
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}