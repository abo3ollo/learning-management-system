"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { DataTable } from "@/app/_components/ui/DataTable";
import { WarehouseModal } from "@/app/_components/inventory/WarehouseModal";
import { Warehouse, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function WarehousesPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState<any>(null);

  const warehouses = useQuery(api.warehouses.getAll);
  const createWarehouse = useMutation(api.warehouses.create);
  const updateWarehouse = useMutation(api.warehouses.update);
  const deleteWarehouse = useMutation(api.warehouses.remove);

  const handleSubmit = async (data: { name: string }) => {
    if (editingWarehouse) {
      await updateWarehouse({
        id: editingWarehouse._id,
        name: data.name,
      });
    } else {
      await createWarehouse(data);
    }
    setIsModalOpen(false);
    setEditingWarehouse(null);
  };

  const handleDelete = async (warehouse: any) => {
    if (confirm("هل أنت متأكد من حذف هذا المخزن؟")) {
      await deleteWarehouse({ id: warehouse._id });
    }
  };

  const columns = [
    { key: "name", label: "اسم المخزن" },
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
              <h1 className="text-2xl font-bold text-gray-900">المخازن</h1>
              <p className="text-gray-500 text-sm">إدارة المخازن في النظام</p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-xl">
            <Warehouse className="h-5 w-5 text-blue-600" />
            <span className="text-sm font-medium text-blue-600">
              عدد المخازن: {warehouses?.length || 0}
            </span>
          </div>
        </div>

        {/* Table */}
        <DataTable
          columns={columns}
          data={warehouses || []}
          onAdd={() => {
            setEditingWarehouse(null);
            setIsModalOpen(true);
          }}
          onEdit={(item) => {
            setEditingWarehouse(item);
            setIsModalOpen(true);
          }}
          onDelete={handleDelete}
          isLoading={warehouses === undefined}
          searchPlaceholder="بحث عن مخزن..."
        />

        {/* Modal */}
        <WarehouseModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setEditingWarehouse(null);
          }}
          onSubmit={handleSubmit}
          initialData={editingWarehouse}
        />
      </div>
    </div>
  );
}