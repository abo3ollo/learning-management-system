"use client";

import Link from "next/link";
import { 
  Warehouse, 
  Package, 
  Layers, 
  Box, 
  FileText,
  ArrowLeft 
} from "lucide-react";

const menuItems = [
  {
    title: "المخازن",
    description: "إدارة المخازن",
    icon: Warehouse,
    href: "/admin/inventory/warehouses",
    color: "bg-blue-50 text-blue-600",
  },
  {
    title: "الوحدات",
    description: "إدارة وحدات القياس",
    icon: Package,
    href: "/admin/inventory/units",
    color: "bg-green-50 text-green-600",
  },
  {
    title: "مجموعات الأصناف",
    description: "إدارة مجموعات الأصناف",
    icon: Layers,
    href: "/admin/inventory/categories",
    color: "bg-purple-50 text-purple-600",
  },
  {
    title: "الأصناف",
    description: "إدارة الأصناف",
    icon: Box,
    href: "/admin/inventory/items",
    color: "bg-orange-50 text-orange-600",
  },
  {
    title: "الفواتير",
    description: "إدارة الفواتير",
    icon: FileText,
    href: "/admin/inventory/invoices",
    color: "bg-red-50 text-red-600",
  },
];

export default function InventoryPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-8" dir="rtl">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link
            href="/dashboard"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">نظام المخازن</h1>
            <p className="text-gray-500 mt-1">إدارة المخازن والوحدات والأصناف والفواتير</p>
          </div>
        </div>

        {/* Grid Menu */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="bg-white rounded-2xl shadow-sm hover:shadow-md border border-gray-100 p-6 transition-all hover:scale-105 group"
              >
                <div className={`w-14 h-14 rounded-2xl ${item.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <Icon className="h-7 w-7" />
                </div>
                <h3 className="font-semibold text-gray-900">{item.title}</h3>
                <p className="text-sm text-gray-500 mt-1">{item.description}</p>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}