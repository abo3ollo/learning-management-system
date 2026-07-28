"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { DataTable } from "@/app/_components/ui/DataTable";

import { Package, ArrowRight } from "lucide-react";
import Link from "next/link";
import { UnitModal } from "@/app/_components/inventory/UnitModal";

export default function UnitsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<any>(null);

  const units = useQuery(api.units.getAll);
  const createUnit = useMutation(api.units.create);
  const updateUnit = useMutation(api.units.update);
  const deleteUnit = useMutation(api.units.remove);

  const handleSubmit = async (data: { name: string }) => {
    if (editingUnit) {
      await updateUnit({
        id: editingUnit._id,
        name: data.name,
      });
    } else {
      await createUnit(data);
    }
    setIsModalOpen(false);
    setEditingUnit(null);
  };

  const handleDelete = async (unit: any) => {
    if (confirm("هل أنت متأكد من حذف هذه الوحدة؟")) {
      await deleteUnit({ id: unit._id });
    }
  };

  const columns = [
    { key: "name", label: "اسم الوحدة" },
    {
      key: "_creationTime",
      label: "تاريخ الإضافة",
      render: (value: number) => new Date(value).toLocaleDateString("ar-EG"),
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-8" dir="rtl">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link
              href="/admin/inventory"
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowRight className="h-5 w-5 text-gray-600" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">الوحدات</h1>
              <p className="text-gray-500 text-sm">إدارة وحدات القياس</p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-green-50 px-4 py-2 rounded-xl">
            <Package className="h-5 w-5 text-green-600" />
            <span className="text-sm font-medium text-green-600">
              عدد الوحدات: {units?.length || 0}
            </span>
          </div>
        </div>

        {/* Table */}
        <DataTable
          columns={columns}
          data={units || []}
          onAdd={() => {
            setEditingUnit(null);
            setIsModalOpen(true);
          }}
          onEdit={(item) => {
            setEditingUnit(item);
            setIsModalOpen(true);
          }}
          onDelete={handleDelete}
          isLoading={units === undefined}
          searchPlaceholder="بحث عن وحدة..."
        />

        {/* Modal */}
        <UnitModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setEditingUnit(null);
          }}
          onSubmit={handleSubmit}
          initialData={editingUnit}
        />
      </div>
    </div>
  );
}