"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { DataTable } from "@/app/_components/ui/DataTable";
import { Box, ArrowRight } from "lucide-react";
import Link from "next/link";
import { ItemModal } from "@/app/_components/inventory/ItemModal";

export default function ItemsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);

  const items = useQuery(api.items.getAll);
  const createItem = useMutation(api.items.create);
  const updateItem = useMutation(api.items.update);
  const deleteItem = useMutation(api.items.remove);

  const handleSubmit = async (data: any) => {
    if (editingItem) {
      await updateItem({
        id: editingItem._id,
        ...data,
        purchasePrice: Number(data.purchasePrice),
        sellingPrice: Number(data.sellingPrice),
        averageCost: Number(data.averageCost),
      });
    } else {
      await createItem({
        ...data,
        purchasePrice: Number(data.purchasePrice),
        sellingPrice: Number(data.sellingPrice),
        averageCost: Number(data.averageCost),
      });
    }
    setIsModalOpen(false);
    setEditingItem(null);
  };

  const handleDelete = async (item: any) => {
    if (confirm("هل أنت متأكد من حذف هذا الصنف؟")) {
      await deleteItem({ id: item._id });
    }
  };

  const columns = [
    { key: "code", label: "الكود" },
    { key: "name", label: "اسم الصنف" },
    {
      key: "purchasePrice",
      label: "سعر الشراء",
      render: (value: number) => `${value.toFixed(2)} ج.م`,
    },
    {
      key: "sellingPrice",
      label: "سعر البيع",
      render: (value: number) => `${value.toFixed(2)} ج.م`,
    },
    {
      key: "averageCost",
      label: "متوسط التكلفة",
      render: (value: number) => `${value.toFixed(2)} ج.م`,
    },
    { key: "unitName", label: "الوحدة" },
    { key: "categoryName", label: "المجموعة" },
    { key: "warehouseName", label: "المخزن" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-8" dir="rtl">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link
              href="/admin/inventory"
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowRight className="h-5 w-5 text-gray-600" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">الأصناف</h1>
              <p className="text-gray-500 text-sm">إدارة الأصناف في المخازن</p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-orange-50 px-4 py-2 rounded-xl">
            <Box className="h-5 w-5 text-orange-600" />
            <span className="text-sm font-medium text-orange-600">
              عدد الأصناف: {items?.length || 0}
            </span>
          </div>
        </div>

        <DataTable
          columns={columns}
          data={items || []}
          onAdd={() => {
            setEditingItem(null);
            setIsModalOpen(true);
          }}
          onEdit={(item) => {
            setEditingItem(item);
            setIsModalOpen(true);
          }}
          onDelete={handleDelete}
          isLoading={items === undefined}
          searchPlaceholder="بحث عن صنف..."
        />

        <ItemModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setEditingItem(null);
          }}
          onSubmit={handleSubmit}
          initialData={editingItem}
        />
      </div>
    </div>
  );
}