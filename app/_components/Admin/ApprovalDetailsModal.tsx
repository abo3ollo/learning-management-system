"use client";

import { X, User, Package, Calendar, DollarSign, ImageIcon, FileText, CheckCircle, XCircle, Clock } from "lucide-react";
import Image from "next/image";
import { format } from "date-fns";
import { arSA } from "date-fns/locale";

interface ApprovalDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  purchase: any;
  lang?: "en" | "ar";
}

const statusMap: Record<string, { label: string; color: string; icon: any }> = {
  pending: { 
    label: "قيد المراجعة", 
    color: "bg-yellow-100 text-yellow-700 border-yellow-200", 
    icon: Clock 
  },
  approved: { 
    label: "تم الموافقة", 
    color: "bg-green-100 text-green-700 border-green-200", 
    icon: CheckCircle 
  },
  rejected: { 
    label: "مرفوض", 
    color: "bg-red-100 text-red-700 border-red-200", 
    icon: XCircle 
  },
};

export function ApprovalDetailsModal({
  isOpen,
  onClose,
  purchase,
  lang = "ar",
}: ApprovalDetailsModalProps) {
  if (!isOpen || !purchase) return null;

  const status = statusMap[purchase.status] || statusMap.pending;
  const StatusIcon = status.icon;

  // تنسيق التاريخ
  const formatDate = (timestamp: number) => {
    if (!timestamp) return "غير معروف";
    return format(new Date(timestamp), "dd MMMM yyyy, HH:mm", { locale: arSA });
  };

  // تنسيق المبلغ
  const formatAmount = (amount: number, currency?: string) => {
    const symbols: Record<string, string> = {
      EGP: "ج.م",
      USD: "$",
      SAR: "ر.س",
      AED: "د.إ",
      KWD: "د.ك",
      BHD: "ب.د",
      QAR: "ر.ق",
    };
    const symbol = currency ? symbols[currency] || currency : "ج.م";
    return `${amount?.toFixed(2) || 0} ${symbol}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <FileText className="h-5 w-5 text-[#1a7a8a]" />
              تفاصيل طلب التحصيلي
            </h2>
            <p className="text-sm text-gray-500">رقم الطلب: {purchase._id?.slice(0, 8)}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* الحالة */}
          <div className="flex items-center justify-between bg-gray-50 rounded-xl p-4 border border-gray-100">
            <span className="text-sm font-medium text-gray-700">الحالة</span>
            <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${status.color} border`}>
              <StatusIcon className="h-4 w-4" />
              {status.label}
            </span>
          </div>

          {/* معلومات الطالب والمعلم - شبكة متساوية */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* معلومات الطالب */}
            <div className="border border-gray-100 rounded-xl p-4 hover:bg-gray-50/50 transition-colors">
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2 border-b border-gray-100 pb-2">
                <User className="h-4 w-4 text-[#1a7a8a]" />
                بيانات الطالب
              </h3>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-gray-400 text-xs">الاسم</p>
                  <p className="font-medium text-gray-700">{purchase.studentName || "غير معروف"}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs">البريد الإلكتروني</p>
                  <p className="font-medium text-gray-700">{purchase.studentEmail || "غير معروف"}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs">تاريخ الطلب</p>
                  <p className="font-medium text-gray-700 flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    {formatDate(purchase.createdAt)}
                  </p>
                </div>
              </div>
            </div>

            {/* معلومات المعلم */}
            <div className="border border-gray-100 rounded-xl p-4 hover:bg-gray-50/50 transition-colors">
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2 border-b border-gray-100 pb-2">
                <Package className="h-4 w-4 text-[#1a7a8a]" />
                بيانات المعلم
              </h3>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-gray-400 text-xs">اسم المعلم</p>
                  <p className="font-medium text-gray-700">{purchase.teacherName || "غير معروف"}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs">التخصص</p>
                  <p className="font-medium text-gray-700">{purchase.teacherSpecialization || "غير محدد"}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs">المبلغ</p>
                  <p className="font-medium text-[#1a7a8a] text-lg flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    {formatAmount(purchase.amount, purchase.currency)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* إيصال الدفع */}
          {purchase.paymentProof && (
            <div className="border border-gray-100 rounded-xl p-4 hover:bg-gray-50/50 transition-colors">
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2 border-b border-gray-100 pb-2">
                <ImageIcon className="h-4 w-4 text-[#1a7a8a]" />
                إيصال الدفع
              </h3>
              <div className="relative w-full h-100 rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
                <Image
                  src={purchase.paymentProof}
                  alt="إيصال الدفع"
                  fill
                  className="object-contain"
                  sizes="(max-width: 768px) 90vw, 60vw"
                />
              </div>
              <p className="text-xs text-gray-400 mt-2 text-center">
                اضغط على الصورة لتكبيرها
              </p>
            </div>
          )}

          {/* سبب الرفض */}
          {purchase.status === "rejected" && purchase.rejectionReason && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-red-700 mb-2 flex items-center gap-2">
                <XCircle className="h-4 w-4" />
                سبب الرفض
              </h3>
              <div className="bg-white/70 rounded-lg p-3">
                <p className="text-sm text-red-600 whitespace-pre-wrap">{purchase.rejectionReason}</p>
              </div>
            </div>
          )}

          {/* ملاحظات الأدمن */}
          {purchase.adminNotes && (
            <div className={`rounded-xl p-4 ${
              purchase.status === "approved" 
                ? "bg-green-50 border border-green-200" 
                : "bg-blue-50 border border-blue-200"
            }`}>
              <h3 className={`text-sm font-semibold mb-2 flex items-center gap-2 ${
                purchase.status === "approved" ? "text-green-700" : "text-blue-700"
              }`}>
                <FileText className="h-4 w-4" />
                {purchase.status === "approved" ? "تعليمات الاستلام" : "ملاحظات الأدمن"}
              </h3>
              <div className="bg-white/70 rounded-lg p-3">
                <p className={`text-sm whitespace-pre-wrap ${
                  purchase.status === "approved" ? "text-green-600" : "text-blue-600"
                }`}>
                  {purchase.adminNotes}
                </p>
              </div>
            </div>
          )}

          {/* معلومات إضافية */}
          <div className="border-t border-gray-100 pt-4 flex flex-wrap gap-4 text-xs text-gray-400">
            <div className="flex items-center gap-1">
              <span className="font-medium">رقم الطلب:</span>
              <span className="font-mono">{purchase._id?.slice(0, 8)}</span>
            </div>
            {purchase.updatedAt && (
              <div className="flex items-center gap-1">
                <span className="font-medium">آخر تحديث:</span>
                <span>{formatDate(purchase.updatedAt)}</span>
              </div>
            )}
            {purchase.status === "approved" && (
              <div className="flex items-center gap-1 text-green-600">
                <CheckCircle className="h-3 w-3" />
                <span>تمت الموافقة على هذا الطلب</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}