"use client";

import { format } from "date-fns";
import { arSA } from "date-fns/locale";
import { X, User, Package, ShoppingBag, AlertCircle, Calendar, DollarSign, Hash, MessageSquare } from "lucide-react";
import Image from "next/image";

interface PurchaseDetailsModalProps {
  purchase: any;
  isOpen: boolean;
  onClose: () => void;
}

export function PurchaseDetailsModal({
  purchase,
  isOpen,
  onClose,
}: PurchaseDetailsModalProps) {
  if (!isOpen || !purchase) return null;

  const statusMap: Record<string, { label: string; color: string }> = {
    pending: { label: "قيد المراجعة", color: "bg-yellow-100 text-yellow-700" },
    approved: { label: "تم الموافقة", color: "bg-green-100 text-green-700" },
    rejected: { label: "مرفوض", color: "bg-red-100 text-red-700" },
    completed: { label: "مكتمل", color: "bg-blue-100 text-blue-700" },
  };

  const status = statusMap[purchase.status] || statusMap.pending;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-xl font-bold text-gray-900">تفاصيل الطلب</h2>
            <p className="text-sm text-gray-500">رقم الطلب: {purchase._id.slice(0, 8)}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Status */}
          <div className="flex items-center justify-between bg-gray-50 rounded-xl p-4">
            <span className="text-sm font-medium text-gray-700">الحالة</span>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${status.color}`}>
              {status.label}
            </span>
          </div>

          {/* Student Info */}
          <div className="border border-gray-100 rounded-xl p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <User className="h-4 w-4 text-gray-400" />
              بيانات الطالب
            </h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-gray-500">الاسم</p>
                <p className="font-medium text-gray-700">{purchase.studentName}</p>
              </div>
              <div>
                <p className="text-gray-500">البريد الإلكتروني</p>
                <p className="font-medium text-gray-700">{purchase.studentEmail}</p>
              </div>
              <div>
                <p className="text-gray-500">الهاتف</p>
                <p className="font-medium text-gray-700">{purchase.studentPhone || "غير متوفر"}</p>
              </div>
              <div>
                <p className="text-gray-500">تاريخ الطلب</p>
                <p className="font-medium text-gray-700">
                  {format(new Date(purchase.createdAt), "dd MMMM yyyy, HH:mm", { locale: arSA })}
                </p>
              </div>
            </div>
          </div>

          {/* Product Info */}
          <div className="border border-gray-100 rounded-xl p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <Package className="h-4 w-4 text-gray-400" />
              بيانات المنتج
            </h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-gray-500">اسم المنتج</p>
                <p className="font-medium text-gray-700">{purchase.itemName}</p>
              </div>
              <div>
                <p className="text-gray-500">الكود</p>
                <p className="font-medium text-gray-700">{purchase.itemCode}</p>
              </div>
              <div>
                <p className="text-gray-500">الوحدة</p>
                <p className="font-medium text-gray-700">{purchase.unitName}</p>
              </div>
              <div>
                <p className="text-gray-500">المجموعة</p>
                <p className="font-medium text-gray-700">{purchase.categoryName}</p>
              </div>
              <div>
                <p className="text-gray-500">المخزن</p>
                <p className="font-medium text-gray-700">{purchase.warehouseName}</p>
              </div>
              <div>
                <p className="text-gray-500">سعر البيع</p>
                <p className="font-medium text-gray-700">
                  {purchase.itemSellingPrice.toFixed(2)} ج.م
                </p>
              </div>
            </div>
          </div>

          {/* Order Details */}
          <div className="border border-gray-100 rounded-xl p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <ShoppingBag className="h-4 w-4 text-gray-400" />
              تفاصيل الطلب
            </h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-gray-500">الكمية</p>
                <p className="font-medium text-gray-700">{purchase.quantity}</p>
              </div>
              <div>
                <p className="text-gray-500">السعر الإجمالي</p>
                <p className="font-medium text-[#001f24] text-lg">
                  {purchase.totalPrice.toFixed(2)} ج.م
                </p>
              </div>
            </div>
          </div>

          {/* Payment Proof Image */}
          {purchase.paymentProof && (
            <div className="border border-gray-100 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">إيصال الدفع</h3>
              <div className="relative w-full h-64 rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
                <Image
                  src={purchase.paymentProof}
                  alt="إيصال الدفع"
                  fill
                  className="object-contain"
                />
              </div>
            </div>
          )}


          {/* Admin Notes (Approval Notes) */}
          {purchase.adminNotes && purchase.status === "approved" && (
            <div className="bg-green-50 border border-green-100 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-green-700 mb-2 flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                تعليمات الاستلام
              </h3>
              <p className="text-sm text-green-600 whitespace-pre-wrap">{purchase.adminNotes}</p>
            </div>
          )}

          {/* Admin Notes (Rejection Notes) - تظهر مع سبب الرفض */}
          {purchase.adminNotes && purchase.status === "rejected" && (
            <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 mt-3">
              <h3 className="text-sm font-semibold text-amber-700 mb-2 flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                ملاحظات إضافية
              </h3>
              <p className="text-sm text-amber-600 whitespace-pre-wrap">{purchase.adminNotes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}