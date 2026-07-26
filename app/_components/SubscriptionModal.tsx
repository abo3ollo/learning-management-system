// app/_components/SubscriptionModal.tsx

"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import {
  X, Upload, CheckCircle, Loader2,
  CreditCard, AlertCircle, ImageIcon,
} from "lucide-react";

interface SubscriptionModalProps {
  isOpen: boolean;
  userId: Id<"users">;
  gradeId?: Id<"grades">;
  childId?: Id<"users">;
  childName?: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function SubscriptionModal({
  isOpen,
  userId,
  gradeId,
  childId,
  childName,
  onClose,
  onSuccess,
}: SubscriptionModalProps) {
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [referenceNumber, setReferenceNumber] = useState("");

  // ── Queries ───────────────────────────────────────────────────
  const gradeInfo = useQuery(
    api.grades.grades.getGradeById,
    gradeId ? { gradeId } : "skip"
  );

  const gradePrice = useQuery(
    api.payments.gradePricing.getGradePrice,
    gradeId ? { gradeId } : "skip"
  );

  const createApprovalRequest = useMutation(
    api.admin.approvals.createApprovalRequest
  );

  // ── Cleanup preview URL on unmount ───────────────────────────
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  // ── File selection ────────────────────────────────────────────
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError("حجم الصورة يجب أن يكون أقل من 5 ميجابايت");
      return;
    }

    if (!file.type.startsWith("image/")) {
      setError("يرجى اختيار صورة فقط (JPG, PNG, WebP)");
      return;
    }

    setError(null);
    setReceiptFile(file);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(URL.createObjectURL(file));
  };

  // ── Submit ────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!receiptFile) {
      setError("يرجى اختيار صورة الإيصال أولاً");
      return;
    }

    if (!gradeId) {
      setError("لم يتم تحديد الصف الدراسي");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const fileReader = new FileReader();
      const fileData = await new Promise<string>((resolve, reject) => {
        fileReader.onload = () => resolve(fileReader.result as string);
        fileReader.onerror = reject;
        fileReader.readAsDataURL(receiptFile);
      });

      await createApprovalRequest({
        studentId: (childId || userId) as Id<"users">,
        gradeId: gradeId,
        paymentProof: fileData,
        amount: gradePrice?.price ?? 0,
        currency: gradePrice?.currency ?? "SAR",
        referenceNumber: referenceNumber || undefined,
      });

      setSubmitted(true);
      
      setTimeout(() => {
        onSuccess();
      }, 2000);

    } catch (err: any) {
      setError(err.message || "حدث خطأ أثناء تقديم الطلب");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Skip ──────────────────────────────────────────────────────
  const handleSkip = () => {
    onSuccess();
  };

  if (!isOpen) return null;

  const price = gradePrice?.price ?? 0;
  const currency = gradePrice?.currency ?? "ج.م";

  return (
    <div className="fixed inset-0 z-9999 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" dir="rtl">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">

        {submitted ? (
          <div className="p-10 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
              <CheckCircle className="h-10 w-10 text-green-500" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">تم التقديم بنجاح!</h2>
            <p className="text-gray-500 text-sm leading-relaxed">
              تم استلام طلب اشتراكك. سيقوم الأدمن بمراجعة الإيصال والموافقة على حسابك قريباً.
            </p>
            <div className="mt-5 flex items-center justify-center gap-2 text-[#1a7a8a] text-sm">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>جاري التوجيه...</span>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
              <button
                onClick={handleSkip}
                disabled={isSubmitting}
                className="p-2 hover:bg-gray-100 rounded-xl transition-colors disabled:opacity-40"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
              <div className="text-right">
                <h2 className="text-lg font-bold text-[#001f24]">الاشتراك في المنصة</h2>
                <p className="text-xs text-gray-400 mt-0.5">ارفع إيصال الدفع لتفعيل حسابك</p>
              </div>
            </div>

            <div className="p-6 space-y-5">
              {childId && childName && (
                <div className="bg-blue-50 border border-blue-200 rounded-2xl px-5 py-3 flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-bold text-sm">
                      {childName.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs text-blue-600 font-medium">الدفع عن الطفل</p>
                    <p className="text-sm font-bold text-[#001f24]">{childName}</p>
                  </div>
                </div>
              )}

              <div className="bg-[#e0f5f7] border border-[#b0dde4] rounded-2xl px-5 py-4 flex items-center justify-between">
                <div className="text-right">
                  <p className="text-xs text-[#1a7a8a] font-medium">سعر الاشتراك</p>
                  <p className="text-2xl font-bold text-[#001f24] mt-0.5">
                    {price}
                    <span className="text-sm font-normal text-gray-500 mr-1">{currency}</span>
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">{gradeInfo?.name || "غير محدد"}</p>
                </div>
                <div className="w-12 h-12 bg-[#1a7a8a] rounded-2xl flex items-center justify-center">
                  <CreditCard className="h-6 w-6 text-white" />
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-100 rounded-2xl px-5 py-4 text-right">
                <p className="text-sm font-semibold text-amber-800 mb-1">تعليمات الدفع</p>
                <p className="text-xs text-amber-700 leading-relaxed">
                  يرجى تحويل المبلغ على الرقم المحدد ثم رفع صورة الإيصال للتحقق منه وتفعيل حسابك.
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 block text-right">
                  رقم المرجع <span className="text-gray-400 text-xs">(اختياري)</span>
                </label>
                <input
                  type="text"
                  value={referenceNumber}
                  onChange={(e) => setReferenceNumber(e.target.value)}
                  placeholder="رقم تحويل البنك أو المرجع"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a7a8a]/20"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-2 text-right">
                  صورة الإيصال <span className="text-red-500">*</span>
                </label>

                {previewUrl ? (
                  <div className="relative w-full">
                    <img
                      src={previewUrl}
                      alt="معاينة الإيصال"
                      className="w-full h-48 object-cover rounded-2xl border border-gray-200"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setReceiptFile(null);
                        if (previewUrl) URL.revokeObjectURL(previewUrl);
                        setPreviewUrl(null);
                      }}
                      className="absolute top-2 left-2 bg-red-500 text-white rounded-full p-1.5 hover:bg-red-600 transition-colors"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                    <div className="absolute bottom-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" />
                      تم اختيار الصورة
                    </div>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-gray-200 rounded-2xl cursor-pointer hover:border-[#1a7a8a] hover:bg-[#f7fafa] transition-all">
                    <ImageIcon className="h-10 w-10 text-gray-300 mb-2" />
                    <p className="text-sm text-gray-500 font-medium">اضغط لرفع صورة الإيصال</p>
                    <p className="text-xs text-gray-400 mt-1">JPG, PNG, WebP — الحد الأقصى 5 ميجابايت</p>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              {error && (
                <div className="flex items-center gap-2 text-red-600 bg-red-50 border border-red-100 px-4 py-3 rounded-xl text-sm">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {error}
                </div>
              )}

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={handleSkip}
                  disabled={isSubmitting}
                  className="flex-1 border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 font-medium py-3 rounded-xl transition-colors text-sm"
                >
                  لاحقاً
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSubmitting || !receiptFile || !gradeId}
                  className="flex-2 flex items-center justify-center gap-2 bg-[#001f24] hover:bg-[#03363d] disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition-colors text-sm"
                >
                  {isSubmitting || isUploading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {isUploading ? "جاري الرفع..." : "جاري التقديم..."}
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4" />
                      تقديم الإيصال
                    </>
                  )}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}