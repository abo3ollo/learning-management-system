"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { DataTable } from "@/app/_components/ui/DataTable";
import { Layers, ArrowRight } from "lucide-react";
import Link from "next/link";
import { CategoryModal } from "@/app/_components/inventory/CategoryModal";

export default function CategoriesPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);

  const categories = useQuery(api.categories.getAll);
  const createCategory = useMutation(api.categories.create);
  const updateCategory = useMutation(api.categories.update);
  const deleteCategory = useMutation(api.categories.remove);

  const handleSubmit = async (data: { name: string }) => {
    if (editingCategory) {
      await updateCategory({
        id: editingCategory._id,
        name: data.name,
      });
    } else {
      await createCategory(data);
    }
    setIsModalOpen(false);
    setEditingCategory(null);
  };

  const handleDelete = async (category: any) => {
    if (confirm("هل أنت متأكد من حذف هذه المجموعة؟")) {
      await deleteCategory({ id: category._id });
    }
  };

  const columns = [
    { key: "name", label: "اسم المجموعة" },
    {
      key: "_creationTime",
      label: "تاريخ الإضافة",
      render: (value: number) => new Date(value).toLocaleDateString("ar-EG"),
    },
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
              <h1 className="text-2xl font-bold text-gray-900">مجموعات الأصناف</h1>
              <p className="text-gray-500 text-sm">إدارة مجموعات الأصناف</p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-purple-50 px-4 py-2 rounded-xl">
            <Layers className="h-5 w-5 text-purple-600" />
            <span className="text-sm font-medium text-purple-600">
              عدد المجموعات: {categories?.length || 0}
            </span>
          </div>
        </div>

        <DataTable
          columns={columns}
          data={categories || []}
          onAdd={() => {
            setEditingCategory(null);
            setIsModalOpen(true);
          }}
          onEdit={(item) => {
            setEditingCategory(item);
            setIsModalOpen(true);
          }}
          onDelete={handleDelete}
          isLoading={categories === undefined}
          searchPlaceholder="بحث عن مجموعة..."
        />

        <CategoryModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setEditingCategory(null);
          }}
          onSubmit={handleSubmit}
          initialData={editingCategory}
        />
      </div>
    </div>
  );
}