"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, CheckCircle, XCircle, DollarSign, User, Package } from "lucide-react";
import { toast } from "sonner";

interface StatusUpdateModalAptitudeProps {
  isOpen: boolean;
  onClose: () => void;
  purchase: any;
  onUpdate: (status: string, rejectionReason?: string, adminNotes?: string) => Promise<void>;
  lang?: "en" | "ar";
}

export function StatusUpdateModalAptitude({
  isOpen,
  onClose,
  purchase,
  onUpdate,
  lang = "ar",
}: StatusUpdateModalAptitudeProps) {
  const [status, setStatus] = useState<"approved" | "rejected">("approved");
  const [rejectionReason, setRejectionReason] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !purchase) return null;

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (status === "rejected" && !rejectionReason.trim()) {
      toast.error("يرجى إدخال سبب الرفض");
      return;
    }

    setIsSubmitting(true);
    try {
      await onUpdate(
        status,
        status === "rejected" ? rejectionReason : undefined,
        adminNotes || undefined
      );
      toast.success(`✅ تم ${status === "approved" ? "الموافقة على" : "رفض"} الطلب بنجاح`);
      onClose();
    } catch (error: any) {
      toast.error(error.message || "حدث خطأ");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-[#001f24] flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-[#1a7a8a]" />
            تحديث حالة الطلب
          </DialogTitle>
          <p className="text-sm text-gray-500">
            {purchase.studentName} - {purchase.teacherName}
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 py-4">
          {/* ✅ ملخص الطلب */}
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              ملخص الطلب
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-gray-500 flex items-center gap-2">
                  <User className="h-4 w-4" />
                  الطالب
                </span>
                <span className="font-medium text-gray-700">{purchase.studentName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500 flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  المعلم
                </span>
                <span className="font-medium text-gray-700">{purchase.teacherName}</span>
              </div>
              <div className="flex justify-between items-center border-t border-gray-200 pt-2">
                <span className="text-gray-500 flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  المبلغ
                </span>
                <span className="font-medium text-[#1a7a8a] text-lg">
                  {formatAmount(purchase.amount, purchase.currency)}
                </span>
              </div>
            </div>
          </div>

          {/* ✅ اختيار الحالة */}
          <div>
            <Label className="text-sm font-semibold text-gray-700 block mb-2">
              اختر الحالة <span className="text-red-500">*</span>
            </Label>
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

          {/* ✅ سبب الرفض */}
          {status === "rejected" && (
            <div className="animate-fadeIn">
              <Label className="text-sm font-semibold text-gray-700 block mb-2">
                سبب الرفض <span className="text-red-500">*</span>
              </Label>
              <Textarea
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

          {/* ✅ ملاحظات إضافية (للموافقة والرفض) */}
          <div>
            <Label className="text-sm font-semibold text-gray-700 block mb-2">
              ملاحظات إضافية <span className="text-gray-400 text-xs font-normal">(اختياري)</span>
            </Label>
            <Textarea
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              placeholder={status === "approved" 
                ? "أضف تعليمات للطالب (مثال: موعد الاستلام، مكان التسليم...)"
                : "أضف ملاحظات إضافية للطالب..."
              }
              rows={2}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a7a8a]/20 focus:border-[#1a7a8a] resize-none"
            />
          </div>

          {/* ✅ معاينة الرسالة */}
          <div className={`rounded-xl p-3 text-sm ${
            status === "approved" 
              ? "bg-green-50 border border-green-100 text-green-700"
              : "bg-red-50 border border-red-100 text-red-700"
          }`}>
            <div className="flex items-center gap-2">
              {status === "approved" ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <XCircle className="h-4 w-4" />
              )}
              <span>
                {status === "approved" 
                  ? "✅ سيتم إعلام الطالب بموافقة طلبه" 
                  : "❌ سيتم إعلام الطالب برفض طلبه مع ذكر السبب"}
              </span>
            </div>
            {status === "approved" && adminNotes && (
              <div className="mt-2 pt-2 border-t border-green-200 text-xs text-green-600">
                <span className="font-medium">📋 سيتم إرسال الملاحظات التالية:</span>
                <p className="mt-1 whitespace-pre-wrap bg-green-50/50 p-2 rounded-lg">
                  {adminNotes}
                </p>
              </div>
            )}
            {status === "rejected" && rejectionReason && (
              <div className="mt-2 pt-2 border-t border-red-200 text-xs text-red-600">
                <span className="font-medium">📋 سبب الرفض:</span>
                <p className="mt-1 whitespace-pre-wrap bg-red-50/50 p-2 rounded-lg">
                  {rejectionReason}
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              إلغاء
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || (status === "rejected" && !rejectionReason.trim())}
              className={`text-white font-semibold ${
                status === "approved"
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-red-600 hover:bg-red-700"
              }`}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin ml-2" />
                  جاري المعالجة...
                </>
              ) : (
                status === "approved" ? "تأكيد الموافقة" : "تأكيد الرفض"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>

      {/* Animation Styles */}
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
    </Dialog>
  );
}