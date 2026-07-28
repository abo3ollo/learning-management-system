"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useParams, useRouter } from "next/navigation";
import { ArrowRight, Printer, Download, FileText, Building, User, Calendar } from "lucide-react";
import Link from "next/link";
import { useRef } from "react";

export default function InvoiceViewPage() {
  const params = useParams();
  const router = useRouter();
  const invoiceId = params.id as string;
  const printRef = useRef<HTMLDivElement>(null);

  const invoiceData = useQuery(api.invoices.getInvoiceForView, {
    invoiceId: invoiceId as any,
  });

  const handlePrint = () => {
    window.print();
  };

  if (invoiceData === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#001f24]"></div>
      </div>
    );
  }

  if (!invoiceData) {
    return (
      <div className="min-h-screen bg-gray-50 p-8" dir="rtl">
        <div className="max-w-4xl mx-auto text-center py-12">
          <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-700">الفاتورة غير موجودة</h2>
          <p className="text-gray-500 mt-2">قد تكون الفاتورة قد تم حذفها أو لا توجد</p>
          <Link
            href="/inventory/invoices"
            className="inline-block mt-4 text-[#1a7a8a] hover:underline"
          >
            العودة إلى قائمة الفواتير
          </Link>
        </div>
      </div>
    );
  }

  const statusMap: Record<string, { label: string; color: string }> = {
    draft: { label: "مسودة", color: "bg-gray-100 text-gray-600" },
    saved: { label: "محفوظة", color: "bg-green-100 text-green-600" },
    cancelled: { label: "ملغاة", color: "bg-red-100 text-red-600" },
  };

  const status = statusMap[invoiceData.status] || statusMap.draft;

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8" dir="rtl">
      <div className="max-w-5xl mx-auto">
        {/* Header with actions */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <Link
              href="/admin/inventory/invoices"
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowRight className="h-5 w-5 text-gray-600" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">عرض الفاتورة</h1>
              <p className="text-sm text-gray-500">{invoiceData.invoiceNumber}</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 bg-[#001f24] hover:bg-[#03363d] text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors"
            >
              <Printer className="h-4 w-4" />
              طباعة
            </button>
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors"
            >
              <Download className="h-4 w-4" />
              تحميل PDF
            </button>
          </div>
        </div>

        {/* Invoice Card */}
        <div
          ref={printRef}
          className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
        >
          {/* Invoice Header */}
          <div className="p-6 md:p-8 border-b border-gray-100">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-12 bg-[#001f24] rounded-xl flex items-center justify-center">
                    <FileText className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">فاتورة شراء</h2>
                    <p className="text-sm text-gray-500">رقم: {invoiceData.invoiceNumber}</p>
                  </div>
                </div>
              </div>
              <div className="text-left">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${status.color}`}>
                  {status.label}
                </span>
              </div>
            </div>
          </div>

          {/* Invoice Info */}
          <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-3 gap-6 border-b border-gray-100 bg-gray-50">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">التاريخ</p>
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <Calendar className="h-4 w-4 text-gray-400" />
                {new Date(invoiceData.date).toLocaleDateString("ar-EG", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </div>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">المخزن</p>
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <Building className="h-4 w-4 text-gray-400" />
                {invoiceData.warehouseName}
              </div>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">تم الإنشاء بواسطة</p>
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <User className="h-4 w-4 text-gray-400" />
                {invoiceData.createdByName || "غير معروف"}
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="p-6 md:p-8">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">تفاصيل الفاتورة</h3>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      #
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      الكود
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      اسم الصنف
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      الكمية
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      سعر الشراء
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      الإجمالي
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {invoiceData.items.map((item: any, index: number) => (
                    <tr key={index} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-sm text-gray-500">{index + 1}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{item.itemCode}</td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-700">{item.itemName}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{item.quantity}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {item.purchasePrice.toFixed(2)} ج.م
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        {item.totalPrice.toFixed(2)} ج.م
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="border-t-2 border-gray-200">
                  <tr>
                    <td colSpan={5} className="px-4 py-4 text-left">
                      <span className="text-sm font-bold text-gray-700">الإجمالي الكلي</span>
                    </td>
                    <td className="px-4 py-4  font-bold text-[#001f24] text-lg">
                      {invoiceData.totalAmount.toFixed(2)} ج.م
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Notes */}
            {invoiceData.notes && (
              <div className="mt-6 p-4 bg-gray-50 rounded-xl">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">ملاحظات</p>
                <p className="text-sm text-gray-700">{invoiceData.notes}</p>
              </div>
            )}

            {/* Footer */}
            <div className="mt-8 pt-6 border-t border-gray-100 text-center text-xs text-gray-400">
              <p>تم إنشاء هذه الفاتورة بواسطة نظام إدارة المخازن</p>
              <p className="mt-1">© {new Date().getFullYear()} جميع الحقوق محفوظة</p>
            </div>
          </div>
        </div>
      </div>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-area,
          #printable-area * {
            visibility: visible;
          }
          #printable-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 20px;
            background: white;
          }
          .no-print {
            display: none !important;
          }
          .print-only {
            display: block !important;
          }
          .bg-gray-50 {
            background: white !important;
          }
          .border-b {
            border-bottom: 1px solid #e5e7eb !important;
          }
        }
        .print-only {
          display: none;
        }
      `}</style>
    </div>
  );
}