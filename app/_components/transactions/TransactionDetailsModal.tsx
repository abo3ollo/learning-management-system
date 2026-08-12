// app/_components/transactions/TransactionDetailsModal.tsx
"use client";

import { useState, useEffect } from "react";
import { X, User, Package, Calendar, DollarSign, FileText, CheckCircle, XCircle, Clock, Image as ImageIcon, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { arSA } from "date-fns/locale";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

interface TransactionDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: any;
  lang?: "en" | "ar";
}

const statusMap: Record<string, { label: string; color: string; icon: any }> = {
  pending: { 
    label: "قيد المراجعة", 
    color: "bg-yellow-100 text-yellow-700 border-yellow-200", 
    icon: Clock 
  },
  completed: { 
    label: "مكتمل", 
    color: "bg-green-100 text-green-700 border-green-200", 
    icon: CheckCircle 
  },
  refunded: { 
    label: "مرتجع", 
    color: "bg-orange-100 text-orange-700 border-orange-200", 
    icon: XCircle 
  },
  failed: { 
    label: "فاشل", 
    color: "bg-red-100 text-red-700 border-red-200", 
    icon: XCircle 
  },
};

export function TransactionDetailsModal({
  isOpen,
  onClose,
  transaction,
  lang = "ar",
}: TransactionDetailsModalProps) {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  // ✅ استخدم mutation لجلب الرابط من storageId
  const getFileUrl = useMutation(api.teacherMaterials.teacherMaterials.getFileUrl);

  // ✅ جلب الرابط عند فتح المودال
  useEffect(() => {
    const fetchImageUrl = async () => {
      if (!transaction?.paymentProof) {
        setImageLoading(false);
        return;
      }

      // ✅ إذا كان الرابط مباشر (http, data:image, /api/storage)
      if (transaction.paymentProof.startsWith("http") || 
          transaction.paymentProof.startsWith("data:image") || 
          transaction.paymentProof.startsWith("/api/storage/")) {
        setImageUrl(transaction.paymentProof);
        setImageLoading(false);
        return;
      }

      // ✅ إذا كان storageId (نخزنها كـ string)
      try {
        const url = await getFileUrl({ storageId: transaction.paymentProof as any });
        if (url) {
          setImageUrl(url);
        } else {
          setImageError(true);
        }
      } catch (error) {
        console.error("Error fetching file URL:", error);
        setImageError(true);
      } finally {
        setImageLoading(false);
      }
    };

    if (isOpen) {
      setImageLoading(true);
      setImageError(false);
      setImageUrl(null);
      fetchImageUrl();
    }
  }, [isOpen, transaction, getFileUrl]);

  if (!isOpen || !transaction) return null;

  const status = statusMap[transaction.status] || statusMap.pending;
  const StatusIcon = status.icon;

  const formatDate = (timestamp: number) => {
    if (!timestamp) return "غير معروف";
    return format(new Date(timestamp), "dd MMMM yyyy, HH:mm", { locale: arSA });
  };

  const typeLabels = {
    platform: lang === "ar" ? "منصة أونلاين" : "Platform",
    aptitude: lang === "ar" ? "تحصيلات" : "Aptitude",
    purchase: lang === "ar" ? "مشتريات" : "Purchase",
  };

  // ✅ الحصول على رابط الصورة النهائي
  const displayImageUrl = imageUrl || transaction?.paymentProof;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <FileText className="h-5 w-5 text-[#1a7a8a]" />
              تفاصيل المعاملة
            </h2>
            <p className="text-sm text-gray-500">رقم: {transaction._id?.slice(0, 8)}</p>
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

          {/* بيانات الطالب والمعلم */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border border-gray-100 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2 border-b border-gray-100 pb-2">
                <User className="h-4 w-4 text-[#1a7a8a]" />
                بيانات الطالب
              </h3>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-gray-400 text-xs">الاسم</p>
                  <p className="font-medium text-gray-700">{transaction.studentName || "غير معروف"}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs">البريد الإلكتروني</p>
                  <p className="font-medium text-gray-700">{transaction.studentEmail || "غير معروف"}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs">تاريخ المعاملة</p>
                  <p className="font-medium text-gray-700 flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    {formatDate(transaction.createdAt)}
                  </p>
                </div>
              </div>
            </div>

            <div className="border border-gray-100 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2 border-b border-gray-100 pb-2">
                <Package className="h-4 w-4 text-[#1a7a8a]" />
                تفاصيل المعاملة
              </h3>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-gray-400 text-xs">النوع</p>
                  <p className="font-medium text-gray-700">{typeLabels[transaction.type as keyof typeof typeLabels]}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs">الفئة</p>
                  <p className="font-medium text-gray-700">
                    {lang === "ar" ? transaction.descriptionAr : transaction.description}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs">المبلغ</p>
                  <p className="font-medium text-[#1a7a8a] text-lg flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    {transaction.amount.toFixed(2)} {transaction.currency}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* إيصال الدفع */}
          {transaction.paymentProof && (
            <div className="border border-gray-100 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2 border-b border-gray-100 pb-2">
                <ImageIcon className="h-4 w-4 text-[#1a7a8a]" />
                إيصال الدفع
              </h3>
              {imageLoading ? (
                <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
                  <Loader2 className="h-8 w-8 animate-spin text-[#1a7a8a]" />
                </div>
              ) : displayImageUrl && !imageError ? (
                <div className="relative w-full h-64 md:h-96 rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
                  <img
                    src={displayImageUrl}
                    alt="إيصال الدفع"
                    className="w-full h-full object-contain"
                    onError={() => {
                      setImageError(true);
                      setImageLoading(false);
                    }}
                    onLoad={() => {
                      setImageLoading(false);
                    }}
                  />
                </div>
              ) : (
                <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="text-center">
                    <ImageIcon className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">لا يوجد إيصال مرفق</p>
                  </div>
                </div>
              )}
              {displayImageUrl && !imageError && (
                <p className="text-xs text-gray-400 mt-2 text-center">
                  اضغط مع الاستمرار (أو زر الفتح) لتكبير الصورة
                </p>
              )}
            </div>
          )}

          {/* معلومات إضافية */}
          <div className="border-t border-gray-100 pt-4 flex flex-wrap gap-4 text-xs text-gray-400">
            <div className="flex items-center gap-1">
              <span className="font-medium">رقم المرجع:</span>
              <span className="font-mono">{transaction.referenceId?.slice(0, 8)}</span>
            </div>
            {transaction.updatedAt && (
              <div className="flex items-center gap-1">
                <span className="font-medium">آخر تحديث:</span>
                <span>{formatDate(transaction.updatedAt)}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}