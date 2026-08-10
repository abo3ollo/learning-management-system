"use client";

import { useState, useRef } from "react";
import { X, Loader2, Upload, User, GraduationCap, DollarSign } from "lucide-react";
import Image from "next/image";

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
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen || !teacher) return null;

  // ✅ استخدام سعر الكورس من المعلم
  const coursePrice = teacher.coursePrice || 0;
  const currency = teacher.courseCurrency || "EGP";

  const t = {
    title: lang === "ar" ? "الدفع والاشتراك" : "Payment & Subscription",
    amount: lang === "ar" ? "المبلغ" : "Amount",
    upload: lang === "ar" ? "رفع إيصال الدفع" : "Upload Payment Receipt",
    uploadDesc: lang === "ar" ? "PNG, JPG, JPEG (حد أقصى 5MB)" : "PNG, JPG, JPEG (Max 5MB)",
    submit: lang === "ar" ? "تأكيد الدفع" : "Confirm Payment",
    cancel: lang === "ar" ? "إلغاء" : "Cancel",
    processing: lang === "ar" ? "جاري المعالجة..." : "Processing...",
    change: lang === "ar" ? "تغيير" : "Change",
    uploaded: lang === "ar" ? "تم رفع الإيصال" : "Receipt Uploaded",
    price: lang === "ar" ? "سعر الكورس" : "Course Price",
    total: lang === "ar" ? "الإجمالي" : "Total",
    free: lang === "ar" ? "مجاني" : "Free",
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

    const reader = new FileReader();
    reader.onloadend = () => {
      setPaymentProof(reader.result as string);
      setError(null);
    };
    reader.onerror = () => {
      setError("حدث خطأ أثناء قراءة الصورة");
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!paymentProof) {
      setError("يرجى رفع إيصال الدفع");
      return;
    }

    try {
      await onSubmit({ paymentProof });
    } catch (err: any) {
      setError(err.message || "حدث خطأ أثناء إتمام الطلب");
    }
  };

  // ✅ دالة لتنسيق العملة
  const formatCurrency = (amount: number, currencyCode: string) => {
    const symbols: Record<string, string> = {
      EGP: "ج.م",
      USD: "$",
      SAR: "ر.س",
      AED: "د.إ",
      KWD: "د.ك",
      BHD: "ب.د",
      QAR: "ر.ق",
    };
    const symbol = symbols[currencyCode] || currencyCode;
    return `${amount.toFixed(2)} ${symbol}`;
  };

  const isFree = coursePrice === 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{t.title}</h2>
            <p className="text-sm text-gray-500">
              {teacher.name} - {teacher.specialization}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Teacher Info */}
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-full bg-[#e0f5f7] flex items-center justify-center">
                <User className="h-7 w-7 text-[#1a7a8a]" />
              </div>
              <div>
                <p className="font-semibold text-[#0a2540]">{teacher.name}</p>
                <p className="text-sm text-gray-500">{teacher.specialization}</p>
                <div className="flex items-center gap-1 text-xs text-gray-400">
                  <GraduationCap className="h-3 w-3" />
                  <span>{teacher.experience || 0} {lang === "ar" ? "سنوات خبرة" : "years exp"}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Details - ✅ بدون رسوم خدمة */}
          <div className="space-y-2">
            <p className="text-sm font-semibold text-[#0a2540]">
              {lang === "ar" ? "تفاصيل الدفع" : "Payment Details"}
            </p>
            <div className="bg-gray-50 rounded-xl p-3 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">{t.price}</span>
                <span className="font-semibold">
                  {isFree ? t.free : formatCurrency(coursePrice, currency)}
                </span>
              </div>
              {/* ✅ تم إزالة رسوم الخدمة */}
              <div className="border-t border-gray-200 pt-2 flex justify-between text-sm font-bold">
                <span>{t.total}</span>
                <span className="text-[#1a7a8a]">
                  {isFree ? t.free : formatCurrency(coursePrice, currency)}
                </span>
              </div>
            </div>
          </div>

          {/* ✅ رسالة توضيحية للمجاني */}
          {isFree && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-3">
              <p className="text-sm text-green-700 flex items-start gap-2">
                <span className="text-lg">🎉</span>
                <span>
                  {lang === "ar"
                    ? "هذا الكورس مجاني! يمكنك متابعة الشراء بدون دفع."
                    : "This course is free! You can proceed with purchase without payment."}
                </span>
              </p>
            </div>
          )}

          {/* Payment Proof Upload - ✅ يظهر حتى للكورسات المجانية (للتسجيل) */}
          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-2">
              {t.upload} {!isFree && <span className="text-red-500">*</span>}
              {isFree && <span className="text-xs text-gray-400"> (اختياري للكورسات المجانية)</span>}
            </label>

            {!paymentProof ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-[#1a7a8a] transition-colors cursor-pointer"
              >
                <Upload className="h-10 w-10 text-gray-400 mx-auto mb-3" />
                <p className="text-sm font-medium text-gray-600">{t.upload}</p>
                <p className="text-xs text-gray-400 mt-1">{t.uploadDesc}</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>
            ) : (
              <div className="relative bg-gray-50 rounded-xl p-4">
                <div className="flex items-center gap-4">
                  <div className="relative w-16 h-16 rounded-lg overflow-hidden border border-gray-200 shrink-0">
                    <Image
                      src={paymentProof}
                      alt="إيصال الدفع"
                      fill
                      className="object-cover"
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
                  ? isFree 
                    ? "سيتم تفعيل الكورس فوراً بعد تأكيد الطلب."
                    : "سيتم مراجعة إيصال الدفع من قبل الإدارة. سيتم إعلامك عند الموافقة أو الرفض."
                  : isFree
                    ? "The course will be activated immediately after order confirmation."
                    : "Your payment receipt will be reviewed by the admin. You will be notified upon approval or rejection."}
              </span>
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-gray-100">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-[#001f24] hover:bg-[#03363d] disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition-colors"
            >
              {isSubmitting ? (
                <Loader2 className="h-5 w-5 animate-spin mx-auto" />
              ) : (
                isFree ? (lang === "ar" ? "تأكيد الاشتراك" : "Confirm Subscription") : t.submit
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 hover:bg-gray-100 rounded-xl transition-colors text-gray-600 font-medium"
            >
              {t.cancel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}