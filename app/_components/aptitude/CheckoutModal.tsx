// app/_components/aptitude/CheckoutModal.tsx

"use client";

import { useState, useRef } from "react";
import { Loader2, Upload, User, GraduationCap, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  teacher: any;
  onSubmit: (data: { paymentProof: string }) => Promise<void>;
  isSubmitting: boolean;
  lang: "en" | "ar";
}

export function CheckoutModal({
  isOpen,
  onClose,
  teacher,
  onSubmit,
  isSubmitting,
  lang,
}: CheckoutModalProps) {
  const [paymentProof, setPaymentProof] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ✅ إزالة الشرط - الـ Dialog نفسه بيتحكم في الإظهار والإخفاء
  // if (!isOpen || !teacher) return null; // ❌ امسح السطر ده

  const coursePrice = teacher?.coursePrice || 0;
  const currency = teacher?.courseCurrency || "EGP";
  const isFree = coursePrice === 0;

  const t = {
    title: lang === "ar" ? "الدفع والاشتراك" : "Payment & Subscription",
    price: lang === "ar" ? "سعر الكورس" : "Course Price",
    total: lang === "ar" ? "الإجمالي" : "Total",
    free: lang === "ar" ? "مجاني" : "Free",
    upload: lang === "ar" ? "رفع إيصال الدفع" : "Upload Payment Receipt",
    uploadDesc: lang === "ar" ? "PNG, JPG, JPEG (حد أقصى 5MB)" : "PNG, JPG, JPEG (Max 5MB)",
    submit: lang === "ar" ? "تأكيد الدفع" : "Confirm Payment",
    cancel: lang === "ar" ? "إلغاء" : "Cancel",
    processing: lang === "ar" ? "جاري المعالجة..." : "Processing...",
    change: lang === "ar" ? "تغيير" : "Change",
    uploaded: lang === "ar" ? "تم رفع الإيصال" : "Receipt Uploaded",
    experience: lang === "ar" ? "سنوات خبرة" : "Years Experience",
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError("حجم الصورة يجب أن لا يتجاوز 5 ميجابايت");
      return;
    }

    if (!file.type.startsWith("image/")) {
      setError("يرجى رفع ملف صورة فقط");
      return;
    }

    setIsUploading(true);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPaymentProof(reader.result as string);
      setError(null);
      setIsUploading(false);
    };
    reader.onerror = () => {
      setError("حدث خطأ أثناء قراءة الصورة");
      setIsUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!paymentProof && !isFree) {
      setError("يرجى رفع إيصال الدفع");
      return;
    }

    try {
      await onSubmit({ paymentProof });
    } catch (err: any) {
      setError(err.message || "حدث خطأ أثناء إتمام الطلب");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md" dir={lang === "ar" ? "rtl" : "ltr"}>
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-[#0a2540]">
            {t.title}
          </DialogTitle>
          <DialogDescription>
            {teacher?.name || "غير محدد"} - {teacher?.specialization || teacher?.subjects?.join(" • ") || ""}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          {/* Teacher Info */}
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-[#e0f5f7] flex items-center justify-center">
                <User className="h-6 w-6 text-[#1a7a8a]" />
              </div>
              <div>
                <p className="font-semibold text-[#0a2540]">{teacher?.name || "غير محدد"}</p>
                <p className="text-sm text-gray-500">{teacher?.specialization || ""}</p>
                <div className="flex items-center gap-1 text-xs text-gray-400">
                  <GraduationCap className="h-3 w-3" />
                  <span>{teacher?.experience || 0} {t.experience}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Details */}
          <div className="space-y-2">
            <p className="text-sm font-semibold text-[#0a2540]">
              {lang === "ar" ? "تفاصيل الدفع" : "Payment Details"}
            </p>
            <div className="bg-gray-50 rounded-xl p-3 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">{t.price}</span>
                <span className="font-semibold">
                  {isFree ? t.free : `${coursePrice} ${currency}`}
                </span>
              </div>
              <div className="border-t border-gray-200 pt-2 flex justify-between text-sm font-bold">
                <span>{t.total}</span>
                <span className="text-[#1a7a8a]">
                  {isFree ? t.free : `${coursePrice} ${currency}`}
                </span>
              </div>
            </div>
          </div>

          {/* Free course message */}
          {isFree && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-3">
              <p className="text-sm text-green-700 flex items-start gap-2">
                <CheckCircle className="h-5 w-5 shrink-0" />
                <span>
                  {lang === "ar"
                    ? "هذا الكورس مجاني! يمكنك متابعة الشراء بدون دفع."
                    : "This course is free! You can proceed with purchase without payment."}
                </span>
              </p>
            </div>
          )}

          {/* Upload Payment Proof */}
          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-2">
              {t.upload} {!isFree && <span className="text-red-500">*</span>}
            </label>

            {!paymentProof ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-[#1a7a8a] transition-colors cursor-pointer"
              >
                {isUploading ? (
                  <Loader2 className="h-10 w-10 text-[#1a7a8a] animate-spin mx-auto" />
                ) : (
                  <>
                    <Upload className="h-10 w-10 text-gray-400 mx-auto mb-3" />
                    <p className="text-sm font-medium text-gray-600">{t.upload}</p>
                    <p className="text-xs text-gray-400 mt-1">{t.uploadDesc}</p>
                  </>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                  disabled={isUploading}
                />
              </div>
            ) : (
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center gap-4">
                  <div className="relative w-16 h-16 rounded-lg overflow-hidden border border-gray-200 shrink-0">
                    <img
                      src={paymentProof}
                      alt="إيصال الدفع"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-700">{t.uploaded}</p>
                    <p className="text-xs text-gray-400">صورة الإيصال</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors text-sm"
                  >
                    {t.change}
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl text-sm">
              {error}
            </div>
          )}

          {/* Info Message */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
            <p className="text-sm text-amber-700 flex items-start gap-2">
              <span className="text-lg">⏳</span>
              <span>
                {lang === "ar"
                  ? "سيتم مراجعة إيصال الدفع من قبل الإدارة. سيتم إعلامك عند الموافقة أو الرفض."
                  : "Your payment receipt will be reviewed by the admin. You will be notified upon approval or rejection."}
              </span>
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-gray-100">
            <Button
              type="submit"
              disabled={isSubmitting || (!paymentProof && !isFree)}
              className="flex-1 bg-[#001f24] hover:bg-[#03363d] disabled:opacity-60 text-white font-semibold py-6 rounded-xl transition-colors"
            >
              {isSubmitting ? (
                <Loader2 className="h-5 w-5 animate-spin mx-auto" />
              ) : (
                isFree ? (lang === "ar" ? "تأكيد الاشتراك" : "Confirm Subscription") : t.submit
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="px-6"
            >
              {t.cancel}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}