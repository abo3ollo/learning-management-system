"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { DataTable } from "@/app/_components/ui/DataTable";
import { FileText, ArrowRight } from "lucide-react";
import Link from "next/link";
import { InvoiceModal } from "@/app/_components/inventory/InvoiceModal";

export default function InvoicesPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<any>(null);

  const invoices = useQuery(api.invoices.getAll);
  const createInvoice = useMutation(api.invoices.create);
  const updateInvoice = useMutation(api.invoices.update);
  const deleteInvoice = useMutation(api.invoices.remove);

  const handleSubmit = async (data: any) => {
    if (editingInvoice) {
      await updateInvoice({
        invoiceId: editingInvoice._id,
        ...data,
      });
    } else {
      await createInvoice(data);
    }
    setIsModalOpen(false);
    setEditingInvoice(null);
  };

  const handleDelete = async (invoice: any) => {
    if (confirm("هل أنت متأكد من حذف هذه الفاتورة؟")) {
      await deleteInvoice({ invoiceId: invoice._id });
    }
  };

  const columns = [
    { key: "invoiceNumber", label: "رقم الفاتورة" },
    {
      key: "date",
      label: "التاريخ",
      render: (value: number) => new Date(value).toLocaleDateString("ar-EG"),
    },
    { key: "warehouseName", label: "المخزن" },
    {
      key: "totalAmount",
      label: "الإجمالي",
      render: (value: number) => `${value.toFixed(2)} ج.م`,
    },
    {
      key: "status",
      label: "الحالة",
      render: (value: string) => {
        const statusMap = {
          draft: "مسودة",
          saved: "محفوظة",
          cancelled: "ملغاة",
        };
        const colors = {
          draft: "bg-gray-100 text-gray-600",
          saved: "bg-green-100 text-green-600",
          cancelled: "bg-red-100 text-red-600",
        };
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[value as keyof typeof colors]}`}>
            {statusMap[value as keyof typeof statusMap]}
          </span>
        );
      },
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-8" dir="rtl">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link
              href="/inventory"
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowRight className="h-5 w-5 text-gray-600" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">الفواتير</h1>
              <p className="text-gray-500 text-sm">إدارة فواتير المشتريات</p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-red-50 px-4 py-2 rounded-xl">
            <FileText className="h-5 w-5 text-red-600" />
            <span className="text-sm font-medium text-red-600">
              عدد الفواتير: {invoices?.length || 0}
            </span>
          </div>
        </div>

        <DataTable
          columns={columns}
          data={invoices || []}
          onAdd={() => {
            setEditingInvoice(null);
            setIsModalOpen(true);
          }}
          onEdit={(item) => {
            setEditingInvoice(item);
            setIsModalOpen(true);
          }}
          onDelete={handleDelete}
          isLoading={invoices === undefined}
          searchPlaceholder="بحث عن فاتورة..."
        />

        <InvoiceModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setEditingInvoice(null);
          }}
          onSubmit={handleSubmit}
          initialData={editingInvoice}
        />
      </div>
    </div>
  );
}