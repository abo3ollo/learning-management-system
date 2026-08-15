// app/subscription/page.tsx
"use client";

export const dynamic = 'force-dynamic';

import { Suspense } from "react";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import {
  X, Upload, CheckCircle, Loader2,
  CreditCard, AlertCircle, ImageIcon,
  Copy, Check,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

// ── المكون الداخلي الذي يستخدم useSearchParams ──────────────
function SubscriptionContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoaded } = useUser();

  // ✅ جلب البيانات من الـ URL
  const userId = searchParams.get("userId");
  const gradeId = searchParams.get("gradeId");
  const childId = searchParams.get("childId");
  const childName = searchParams.get("childName");
  const role = searchParams.get("role") as "student" | "parent" | null;

  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [referenceNumber, setReferenceNumber] = useState("");
  const [referenceError, setReferenceError] = useState<string | null>(null);


  // ── Queries ───────────────────────────────────────────────────
  const currentUser = useQuery(api.user.auth.getCurrentUser);
  const gradeInfo = useQuery(
    api.grades.grades.getGradeById,
    gradeId ? { gradeId: gradeId as Id<"grades"> } : "skip"
  );

  const gradePrice = useQuery(
    api.payments.gradePricing.getGradePrice,
    gradeId ? { gradeId: gradeId as Id<"grades"> } : "skip"
  );

  const createApprovalRequest = useMutation(
    api.admin.approvals.createApprovalRequest
  );

  const createTransaction = useMutation(api.transactions.transactions.createTransaction);
  const generateUploadUrl = useMutation(api.teacherMaterials.teacherMaterials.generateUploadUrl);

  // ── التحقق من البيانات ──────────────────────────────────────
  useEffect(() => {
    if (!isLoaded) return;
    if (!user) {
      router.push("/sign-in");
      return;
    }
    if (!userId || !gradeId) {
      toast.error("بيانات غير مكتملة");
      router.push("/");
    }
  }, [isLoaded, user, userId, gradeId, router]);

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

  // ── Upload file to Convex Storage ─────────────────────────────
  const uploadFileToStorage = async (file: File): Promise<string> => {
    try {
      const uploadUrl = await generateUploadUrl();
      
      const response = await fetch(uploadUrl, {
        method: "POST",
        headers: {
          "Content-Type": file.type,
        },
        body: file,
      });

      if (!response.ok) {
        throw new Error("فشل رفع الملف");
      }

      const result = await response.json();
      
      return result.storageId;
    } catch (error) {
      console.error("Upload error:", error);
      throw new Error("فشل رفع الملف");
    }
  };

  // ── Submit ────────────────────────────────────────────────────
  const handleSubmit = async () => {
    // ✅ التحقق من رقم المرجع (إجباري)
    if (!referenceNumber || referenceNumber.trim() === "") {
      setReferenceError("رقم المرجع مطلوب *");
      return;
    }
    setReferenceError(null);

    if (!receiptFile) {
      setError("يرجى اختيار صورة الإيصال أولاً");
      return;
    }

    if (!gradeId) {
      setError("لم يتم تحديد الصف الدراسي");
      return;
    }

    setIsSubmitting(true);
    setIsUploading(true);
    setError(null);

    try {
      const storageId = await uploadFileToStorage(receiptFile);

      const approvalResult = await createApprovalRequest({
        studentId: (childId || userId) as Id<"users">,
        gradeId: gradeId as Id<"grades">,
        paymentProof: storageId,
        amount: gradePrice?.price ?? 0,
        currency: gradePrice?.currency ?? "EGP",
        referenceNumber: referenceNumber.trim(),
      });

      let referenceId: string;
      if (typeof approvalResult === 'string') {
        referenceId = approvalResult;
      } else if (approvalResult && typeof approvalResult === 'object') {
        referenceId = (approvalResult as any).requestId || (approvalResult as any).paymentId || String(approvalResult);
      } else {
        referenceId = String(approvalResult);
      }

      const studentId = (childId || userId) as Id<"users">;
      
      const transactionData: any = {
        studentId: studentId,
        type: "platform",
        category: "subscription",
        amount: gradePrice?.price ?? 0,
        currency: gradePrice?.currency ?? "EGP",
        status: "pending",
        referenceId: referenceId,
        referenceType: "subscription",
        description: `Subscription to platform - Grade ${gradeInfo?.name || ''}`,
        descriptionAr: `اشتراك في المنصة - ${gradeInfo?.name || ''}`,
        paymentProof: storageId,
      };

      if (childId) {
        transactionData.parentId = userId as Id<"users">;
      }

      await createTransaction(transactionData);

      setSubmitted(true);
      setIsUploading(false);
      
      toast.success("تم إرسال طلب الاشتراك بنجاح");
      
      setTimeout(() => {
        router.push("/pending-approval");
      }, 2000);

    } catch (err: any) {
      setError(err.message || "حدث خطأ أثناء تقديم الطلب");
      toast.error(err.message || "حدث خطأ أثناء تقديم الطلب");
    } finally {
      setIsSubmitting(false);
      setIsUploading(false);
    }
  };

  // ── Skip ──────────────────────────────────────────────────────
  const handleSkip = () => {
    router.push("/pending-approval");
  };

  // ── Loading state ──────────────────────────────────────────────
  if (!isLoaded || !currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f7fafa]">
        <Loader2 className="h-8 w-8 animate-spin text-[#1a7a8a]" />
      </div>
    );
  }

  const price = gradePrice?.price ?? 0;
  const currency = gradePrice?.currency ?? "ج.م";

  return (
    <div className="min-h-screen bg-[#f7fafa] flex items-center justify-center p-4" dir="rtl">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">

        {submitted ? (
          <div className="p-10 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
              <CheckCircle className="h-10 w-10 text-green-500" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">تم التقديم بنجاح!</h2>
            <p className="text-gray-500 text-sm leading-relaxed">
              تم استلام طلب اشتراكك. سيتم مراجعة الإيصال والموافقة على حسابك قريباً.
            </p>
            <div className="mt-5 flex items-center justify-center gap-2 text-[#1a7a8a] text-sm">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>جاري التوجيه...</span>
            </div>
          </div>
        ) : (
          <>
            {/* Header */}
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

              {/* Price */}
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

              {/* ✅ معلومات الدفع */}
              {/* <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
                <p className="text-sm font-semibold text-blue-800 mb-3 flex items-center gap-2">
                  <span className="text-lg">🏦</span>
                  معلومات الدفع
                </p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">البنك:</span>
                    <span className="font-medium text-gray-900">{paymentInfo.bankName}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">اسم الحساب:</span>
                    <span className="font-medium text-gray-900">{paymentInfo.accountName}</span>
                  </div>
                  <div className="flex justify-between items-center group">
                    <span className="text-gray-600">رقم الحساب:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-medium text-gray-900 text-sm">
                        {paymentInfo.accountNumber}
                      </span>
                      <button
                        onClick={() => copyToClipboard(paymentInfo.accountNumber)}
                        className="p-1 hover:bg-blue-200 rounded transition-colors"
                        title="نسخ رقم الحساب"
                      >
                        {copied ? (
                          <Check className="h-4 w-4 text-green-600" />
                        ) : (
                          <Copy className="h-4 w-4 text-blue-600" />
                        )}
                      </button>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">رقم IBAN:</span>
                    <span className="font-mono font-medium text-gray-900 text-xs">
                      {paymentInfo.iban}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">SWIFT:</span>
                    <span className="font-mono font-medium text-gray-900">
                      {paymentInfo.swift}
                    </span>
                  </div>
                  <div className="border-t border-blue-200 pt-2 mt-1">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">📧 البريد الإلكتروني:</span>
                      <a href={`mailto:${paymentInfo.email}`} className="font-medium text-blue-700 hover:underline">
                        {paymentInfo.email}
                      </a>
                    </div>
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-gray-600">📱 الهاتف:</span>
                      <a href={`tel:${paymentInfo.phone}`} className="font-medium text-blue-700 hover:underline">
                        {paymentInfo.phone}
                      </a>
                    </div>
                  </div>
                </div>
              </div> */}

              {/* ✅ Reference Number - إجباري */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 block text-right">
                  رقم المرجع <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={referenceNumber}
                  onChange={(e) => {
                    setReferenceNumber(e.target.value);
                    if (e.target.value.trim() !== "") {
                      setReferenceError(null);
                    }
                  }}
                  placeholder="أدخل رقم تحويل البنك أو المرجع"
                  className={`w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a7a8a]/20 ${
                    referenceError ? "border-red-500 ring-2 ring-red-200" : "border-gray-200"
                  }`}
                />
                {referenceError && (
                  <p className="text-xs text-red-500">{referenceError}</p>
                )}
                <p className="text-xs text-gray-400">
                  ⚠️ رقم المرجع مطلوب لتأكيد عملية الدفع
                </p>
              </div>

              {/* Upload Receipt */}
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
                    {isUploading ? (
                      <Loader2 className="h-10 w-10 text-[#1a7a8a] animate-spin mb-2" />
                    ) : (
                      <>
                        <ImageIcon className="h-10 w-10 text-gray-300 mb-2" />
                        <p className="text-sm text-gray-500 font-medium">اضغط لرفع صورة الإيصال</p>
                        <p className="text-xs text-gray-400 mt-1">JPG, PNG, WebP — الحد الأقصى 5 ميجابايت</p>
                      </>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              {/* Error */}
              {error && (
                <div className="flex items-center gap-2 text-red-600 bg-red-50 border border-red-100 px-4 py-3 rounded-xl text-sm">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {error}
                </div>
              )}

              {/* Info Message */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                <p className="text-sm text-amber-700 flex items-start gap-2">
                  <span className="text-lg">⏳</span>
                  <span>
                    سيتم مراجعة إيصال الدفع من قبل الإدارة. سيتم إعلامك عند الموافقة أو الرفض.
                  </span>
                </p>
              </div>

              {/* Actions */}
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
                  disabled={isSubmitting || !receiptFile || !gradeId || !referenceNumber.trim()}
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

// ── الصفحة الرئيسية مع Suspense ──────────────────────────────
export default function SubscriptionPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#f7fafa]">
        <Loader2 className="h-8 w-8 animate-spin text-[#1a7a8a]" />
        <span className="mr-3 text-gray-500">جاري التحميل...</span>
      </div>
    }>
      <SubscriptionContent />
    </Suspense>
  );
}