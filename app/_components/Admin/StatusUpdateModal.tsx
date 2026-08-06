"use client";

import { useState, useEffect } from "react";
import { X, Loader2, Check, CheckCircle, XCircle, MessageSquare } from "lucide-react";

interface StatusUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  purchase: any;
  onUpdate: (status: string, reason?: string, notes?: string) => Promise<void>;
}

export function StatusUpdateModal({
  isOpen,
  onClose,
  purchase,
  onUpdate,
}: StatusUpdateModalProps) {
  const [status, setStatus] = useState<"approved" | "rejected">("approved");
  const [rejectionReason, setRejectionReason] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // إعادة تعيين النموذج عند فتح المودال
  useEffect(() => {
    if (isOpen) {
      setStatus("approved");
      setRejectionReason("");
      setNotes("");
    }
  }, [isOpen]);

  if (!isOpen || !purchase) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (status === "rejected" && !rejectionReason.trim()) {
      alert("يرجى إدخال سبب الرفض");
      return;
    }

    setIsSubmitting(true);
    try {
      // ✅ تأكد من إرسال notes في جميع الحالات
      const notesToSend = notes.trim() || undefined;
      
      console.log("Submitting status update:", {
        status,
        rejectionReason: status === "rejected" ? rejectionReason : undefined,
        notes: notesToSend,
      });

      await onUpdate(
        status, 
        status === "rejected" ? rejectionReason : undefined,
        notesToSend
      );
      
      // Reset form after successful submission
      setRejectionReason("");
      setNotes("");
      setStatus("approved");
      
      // ✅ إغلاق المودال بعد النجاح
      onClose();
    } catch (error) {
      console.error("Error updating status:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setRejectionReason("");
    setNotes("");
    setStatus("approved");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-xl font-bold text-gray-900">تحديث حالة الطلب</h2>
            <p className="text-sm text-gray-500 mt-1">
              {purchase.itemName} - {purchase.studentName}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Product Info Summary */}
          <div className="bg-gray-50 rounded-xl p-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">المنتج:</span>
              <span className="font-medium text-gray-700">{purchase.itemName}</span>
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-gray-500">الكمية:</span>
              <span className="font-medium text-gray-700">{purchase.quantity}</span>
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-gray-500">الإجمالي:</span>
              <span className="font-medium text-[#001f24]">
                {purchase.totalPrice.toFixed(2)} ج.م
              </span>
            </div>
          </div>

          {/* Status Selection */}
          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-2">
              اختر الحالة <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setStatus("approved")}
                className={`flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all ${
                  status === "approved"
                    ? "border-green-500 bg-green-50 text-green-700 shadow-sm"
                    : "border-gray-200 hover:border-green-200 hover:bg-green-50/50"
                }`}
              >
                <CheckCircle className={`h-5 w-5 ${status === "approved" ? "text-green-500" : "text-gray-400"}`} />
                <span className="font-medium">موافقة</span>
              </button>
              <button
                type="button"
                onClick={() => setStatus("rejected")}
                className={`flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all ${
                  status === "rejected"
                    ? "border-red-500 bg-red-50 text-red-700 shadow-sm"
                    : "border-gray-200 hover:border-red-200 hover:bg-red-50/50"
                }`}
              >
                <XCircle className={`h-5 w-5 ${status === "rejected" ? "text-red-500" : "text-gray-400"}`} />
                <span className="font-medium">رفض</span>
              </button>
            </div>
          </div>

          {/* ✅ Notes for Approval - يظهر في حالة الموافقة */}
          {status === "approved" && (
            <div className="animate-fadeIn">
              <label className="text-sm font-semibold text-gray-700 block mb-2">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-green-600" />
                  <span>تعليمات الاستلام <span className="text-gray-400 text-xs font-normal">(اختياري)</span></span>
                </div>
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="أدخل تعليمات الاستلام للطالب..."
                rows={4}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 resize-none"
              />
              <div className="flex items-start gap-2 mt-1.5">
                <div className="text-xs text-gray-400">
                  <p>💡 يمكنك إضافة:</p>
                  <ul className="list-disc list-inside mr-4 mt-0.5 space-y-0.5">
                    <li>مكان الاستلام (العنوان)</li>
                    <li>موعد الاستلام</li>
                    <li>رقم التواصل للتنسيق</li>
                    <li>تعليمات إضافية</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Rejection Reason - يظهر فقط في حالة الرفض */}
          {status === "rejected" && (
            <div className="animate-fadeIn">
              <label className="text-sm font-semibold text-gray-700 block mb-2">
                سبب الرفض <span className="text-red-500">*</span>
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="أدخل سبب الرفض بوضوح..."
                rows={3}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 resize-none"
                required={status === "rejected"}
                autoFocus={status === "rejected"}
              />
              <p className="text-xs text-gray-400 mt-1">
                سيتم إرسال هذا السبب للطالب
              </p>
            </div>
          )}

          {/* Success Message Preview */}
          <div className={`rounded-xl p-3 text-sm ${
            status === "approved" 
              ? "bg-green-50 border border-green-100 text-green-700"
              : "bg-red-50 border border-red-100 text-red-700"
          }`}>
            <div className="flex items-center gap-2">
              {status === "approved" ? (
                <Check className="h-4 w-4" />
              ) : (
                <XCircle className="h-4 w-4" />
              )}
              <span>
                {status === "approved" 
                  ? "✅ سيتم إعلام الطالب بموافقة طلبه" 
                  : "❌ سيتم إعلام الطالب برفض طلبه مع ذكر السبب"}
              </span>
            </div>
            {status === "approved" && notes.trim() && (
              <div className="mt-2 pt-2 border-t border-green-200 text-xs text-green-600">
                <span className="font-medium">📋 سيتم إرسال الملاحظات التالية:</span>
                <p className="mt-1 whitespace-pre-wrap bg-green-50/50 p-2 rounded-lg">
                  {notes}
                </p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-gray-100">
            <button
              type="submit"
              disabled={isSubmitting || (status === "rejected" && !rejectionReason.trim())}
              className={`flex-1 text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-60 ${
                status === "approved"
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-red-600 hover:bg-red-700"
              }`}
            >
              {isSubmitting ? (
                <Loader2 className="h-5 w-5 animate-spin mx-auto" />
              ) : (
                status === "approved" ? "تأكيد الموافقة" : "تأكيد الرفض"
              )}
            </button>
            <button
              type="button"
              onClick={handleClose}
              className="px-6 py-3 hover:bg-gray-100 rounded-xl transition-colors text-gray-600 font-medium"
            >
              إلغاء
            </button>
          </div>
        </form>
      </div>

      {/* Custom Animation Style */}
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}