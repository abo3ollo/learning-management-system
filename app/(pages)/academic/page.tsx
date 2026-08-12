"use client";

import React, { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Video,
  FileText,
  CheckCircle,
  Clock,
  User,
  GraduationCap,
  Search,
  Loader2,
  Globe,
  Eye,
  Download,
  Play,
  Users,
  DollarSign,
  Upload,
  X,
  AlertCircle,
  Check,
  Calendar,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/app/hooks/use-toast";


// ── Types ──────────────────────────────────────────────────────────
type MaterialType = "pdf" | "video" | "exam" | "assignment" | "revision";

interface Material {
  _id: string;
  _creationTime: number;
  title: string;
  titleAr: string;
  description?: string;
  descriptionAr?: string;
  type: MaterialType;
  fileUrl?: string;
  fileSize?: string;
  duration?: string;
  subject: string;
  grade: string;
  questions?: Array<{
    id: string;
    text: string;
    options?: string[];
    correctAnswer?: string;
    marks: number;
  }>;
  deadline?: number;
  isPublished: boolean;
  displayOrder: number;
  teacherId: string;
  teacherName: string;
  teacherEmail: string;
  teacherSpecialization?: string;
  teacherCoursePrice?: number;
  teacherCourseCurrency?: string;
  createdAt: number;
  updatedAt: number;
}

// ── Constants ─────────────────────────────────────────────────────
const materialTypeLabels: Record<MaterialType, { ar: string; en: string; icon: any }> = {
  pdf: { ar: "ملف PDF", en: "PDF", icon: FileText },
  video: { ar: "فيديو", en: "Video", icon: Video },
  exam: { ar: "امتحان", en: "Exam", icon: BookOpen },
  assignment: { ar: "واجب", en: "Assignment", icon: CheckCircle },
  revision: { ar: "مراجعة", en: "Revision", icon: Eye },
};

// ═══════════════════════════════════════════════════════════════════
export default function AcademicPage() {
  const { toast } = useToast();
  const [lang, setLang] = useState<"en" | "ar">("ar");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isPaid, setIsPaid] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentProof, setPaymentProof] = useState<string>("");
  const [paymentProofFile, setPaymentProofFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [purchaseStatus, setPurchaseStatus] = useState<"idle" | "pending" | "approved" | "rejected">("idle");
  const [purchaseId, setPurchaseId] = useState<string | null>(null);
  const [imageModalUrl, setImageModalUrl] = useState<string | null>(null);

  // ── Queries ───────────────────────────────────────────────────
  const currentUser = useQuery(api.user.auth.getCurrentUser);
  const materials = useQuery(
  api.teacherMaterials.teacherMaterials.getPublicTeacherMaterials,
  {}
);
  const generateUploadUrl = useMutation(api.teacherMaterials.teacherMaterials.generateUploadUrl);
  

  // ── Mutations ────────────────────────────────────────────────
  const createPurchase = useMutation(api.academic.academic.createAcademicPurchase);

  // ── Handlers ──────────────────────────────────────────────────
  const toggleLang = () => setLang((l) => (l === "en" ? "ar" : "en"));

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;

  // ✅ التحقق من نوع الملف
  if (!file.type.startsWith("image/")) {
    toast({
      title: "خطأ",
      description: "الرجاء رفع صورة فقط (jpg, png, jpeg)",
      variant: "destructive",
    });
    return;
  }

  // ✅ التحقق من الحجم
  if (file.size > 5 * 1024 * 1024) {
    toast({
      title: "خطأ",
      description: "حجم الصورة يجب أن يكون أقل من 5 ميجابايت",
      variant: "destructive",
    });
    return;
  }

  setPaymentProofFile(file);
  setIsUploading(true);

  try {
    // ✅ 1. الحصول على رابط التحميل من Convex
    const uploadUrl = await generateUploadUrl();
    
    // ✅ 2. رفع الملف إلى Convex Storage
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

    // ✅ 3. الحصول على storageId من الـ response
    const result = await response.json();
    const storageId = result.storageId;

    // ✅ 4. بناء رابط الملف
    // Convex storage URLs are available at /api/storage/{storageId}
    // or you can use the storage URL directly from the response
    const fileUrl = result.url || `/api/storage/${storageId}`;
    
    setPaymentProof(fileUrl);
    
    toast({
      title: "تم الرفع",
      description: "تم رفع إيصال الدفع بنجاح",
    });
  } catch (error) {
    console.error("Upload error:", error);
    toast({
      title: "خطأ",
      description: "حدث خطأ أثناء رفع الإيصال",
      variant: "destructive",
    });
  } finally {
    setIsUploading(false);
  }
};

  const handlePayment = async () => {
    if (!selectedMaterial) return;
    if (!paymentProof) {
      toast({
        title: "خطأ",
        description: "الرجاء رفع إيصال الدفع",
        variant: "destructive",
      });
      return;
    }

    setIsProcessingPayment(true);
    try {
      const result = await createPurchase({
        materialId: selectedMaterial._id as Id<"teacherMaterials">,
        teacherId: selectedMaterial.teacherId as Id<"users">,
        amount: selectedMaterial.teacherCoursePrice || 150,
        currency: selectedMaterial.teacherCourseCurrency || "EGP",
        paymentProof: paymentProof,
      });

      setPurchaseId(result as string);
      setPurchaseStatus("pending");
      setIsPaid(true);
      setIsCheckoutOpen(false);

      toast({
        title: "تم إرسال الطلب",
        description: "تم إرسال طلب الدفع للمراجعة، سيتم إعلامك عند الموافقة",
      });

      setTimeout(() => {
        setIsPaid(false);
        setSelectedMaterial(null);
        setPaymentProof("");
        setPaymentProofFile(null);
      }, 3000);
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error.message || "حدث خطأ أثناء الدفع",
        variant: "destructive",
      });
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const selectMaterial = (material: Material) => {
    if (!currentUser) {
      toast({
        title: "تنبيه",
        description: "الرجاء تسجيل الدخول أولاً",
        variant: "destructive",
      });
      return;
    }

    setSelectedMaterial(material);
    setIsCheckoutOpen(true);
    setIsPaid(false);
    setPurchaseStatus("idle");
    setPaymentProof("");
    setPaymentProofFile(null);
  };

  const getTypeIcon = (type: MaterialType) => {
    return materialTypeLabels[type]?.icon || FileText;
  };

  const getTypeLabel = (type: MaterialType, lang: "en" | "ar") => {
    return materialTypeLabels[type]?.[lang] || type;
  };

  // ── فلترة المواد ──────────────────────────────────────────────
  const filteredMaterials = (materials || []).filter((material: any) => {
    const matchesSearch =
      !searchQuery ||
      material.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      material.titleAr?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      material.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      material.teacherName?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType = selectedType === "all" || material.type === selectedType;

    return matchesSearch && matchesType;
  });

  // ── حالة التحميل ──────────────────────────────────────────────
  if (materials === undefined || (currentUser === undefined && currentUser !== null)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-[#1a7a8a]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7fafa]" dir={lang === "ar" ? "rtl" : "ltr"}>
      {/* Header */}
      <header className="bg-linear-to-r from-[#001f24] to-[#03363d] px-8 py-6 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-white/80 hover:text-white transition-colors">
              <ArrowRight className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-white">
                {lang === "ar" ? "التحصيل الدراسي" : "Academic Achievement"}
              </h1>
              <p className="text-[#a3ced6] text-sm">
                {lang === "ar"
                  ? "مواد تعليمية لتحسين مستواك الأكاديمي"
                  : "Educational materials to improve your academic level"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={toggleLang}
              className="flex items-center gap-1.5 text-sm text-white/80 hover:text-white border border-white/20 rounded-lg px-3 py-1.5 transition-colors"
            >
              <Globe className="h-4 w-4" />
              {lang === "en" ? "AR" : "EN"}
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        {/* Search & Filter */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder={lang === "ar" ? "بحث عن مادة أو معلم..." : "Search for material or teacher..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-10 border-gray-200"
            />
          </div>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-4 py-2 border rounded-lg text-sm bg-white"
          >
            <option value="all">{lang === "ar" ? "جميع المواد" : "All Materials"}</option>
            {Object.entries(materialTypeLabels).map(([key, value]) => (
              <option key={key} value={key}>
                {lang === "ar" ? value.ar : value.en}
              </option>
            ))}
          </select>
        </div>

        {/* Materials Grid */}
        {filteredMaterials.length === 0 ? (
          <div className="text-center py-16">
            <BookOpen className="h-12 w-12 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">
              {lang === "ar" ? "لا توجد مواد تعليمية متاحة" : "No educational materials available"}
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMaterials.map((material: any) => {
              const Icon = getTypeIcon(material.type);
              return (
                <Card
                  key={material._id}
                  className="overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border border-gray-100 bg-white"
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#e0f5f7] flex items-center justify-center">
                          <Icon className="h-5 w-5 text-[#1a7a8a]" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-[#0a2540] line-clamp-1">
                            {lang === "ar" ? material.titleAr || material.title : material.title}
                          </h3>
                          <p className="text-xs text-gray-500">{material.subject}</p>
                        </div>
                      </div>
                      <Badge className="bg-[#1a7a8a]/10 text-[#1a7a8a] border-none">
                        {getTypeLabel(material.type, lang)}
                      </Badge>
                    </div>

                    <div className="mt-4 space-y-2">
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <User className="h-4 w-4" />
                        <span>{material.teacherName || "غير معروف"}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <GraduationCap className="h-4 w-4" />
                        <span>{material.grade}</span>
                      </div>
                      {material.fileSize && (
                        <div className="flex items-center gap-2 text-sm text-gray-400">
                          <FileText className="h-4 w-4" />
                          <span>{material.fileSize}</span>
                        </div>
                      )}
                      {material.duration && (
                        <div className="flex items-center gap-2 text-sm text-gray-400">
                          <Clock className="h-4 w-4" />
                          <span>{material.duration}</span>
                        </div>
                      )}
                      {material.deadline && (
                        <div className="flex items-center gap-2 text-sm text-amber-600">
                          <Calendar className="h-4 w-4" />
                          <span>
                            {lang === "ar" ? "تسليم: " : "Deadline: "}
                            {new Date(material.deadline).toLocaleDateString(lang === "ar" ? "ar-EG" : "en-US")}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="mt-4 pt-4 border-t flex items-center justify-between">
                      <div className="flex items-center gap-1 text-[#1a7a8a] font-bold">
                        <DollarSign className="h-4 w-4" />
                        <span>
                          {material.teacherCoursePrice || 150} {material.teacherCourseCurrency || "EGP"}
                        </span>
                      </div>
                      <Button
                        onClick={() => selectMaterial(material)}
                        className="bg-[#0a2540] hover:bg-[#1a3a5c] text-white"
                      >
                        {lang === "ar" ? "شراء المادة" : "Purchase"}
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Checkout Dialog ────────────────────────────────────── */}
      <Dialog open={isCheckoutOpen} onOpenChange={setIsCheckoutOpen}>
        <DialogContent className="max-w-lg" dir={lang === "ar" ? "rtl" : "ltr"}>
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-[#0a2540]">
              {lang === "ar" ? "الدفع والاشتراك" : "Payment & Subscription"}
            </DialogTitle>
            <DialogDescription>
              {lang === "ar"
                ? "قم برفع إيصال الدفع للموافقة على طلبك"
                : "Upload payment receipt for approval"}
            </DialogDescription>
          </DialogHeader>

          {selectedMaterial && (
            <div className="space-y-4 py-4">
              <div className="bg-[#f7fafa] rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-[#e0f5f7] flex items-center justify-center">
                    {React.createElement(getTypeIcon(selectedMaterial.type), {
                      className: "h-6 w-6 text-[#1a7a8a]",
                    })}
                  </div>
                  <div>
                    <p className="font-semibold text-[#0a2540]">
                      {lang === "ar" ? selectedMaterial.titleAr || selectedMaterial.title : selectedMaterial.title}
                    </p>
                    <p className="text-sm text-gray-500">
                      {selectedMaterial.teacherName || "غير معروف"} • {selectedMaterial.subject}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-semibold text-[#0a2540]">
                  {lang === "ar" ? "تفاصيل الدفع" : "Payment Details"}
                </p>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">
                    {lang === "ar" ? "سعر المادة" : "Material Price"}
                  </span>
                  <span className="font-semibold">
                    {selectedMaterial.teacherCoursePrice || 150} {selectedMaterial.teacherCourseCurrency || "EGP"}
                  </span>
                </div>
                <div className="border-t border-gray-200 pt-2 flex justify-between text-sm font-bold">
                  <span>{lang === "ar" ? "الإجمالي" : "Total"}</span>
                  <span className="text-[#1a7a8a]">
                    {selectedMaterial.teacherCoursePrice || 150} {selectedMaterial.teacherCourseCurrency || "EGP"}
                  </span>
                </div>
              </div>

              {/* رفع الإيصال */}
              <div className="space-y-2">
                <p className="text-sm font-semibold text-[#0a2540]">
                  {lang === "ar" ? "رفع إيصال الدفع" : "Upload Payment Receipt"}
                  <span className="text-red-500 mr-1">*</span>
                </p>
                <div className="flex items-center gap-4">
                  <Button
                    variant="outline"
                    className="flex-1 relative"
                    disabled={isUploading}
                    onClick={() => document.getElementById("receipt-upload")?.click()}
                  >
                    {isUploading ? (
                      <Loader2 className="h-4 w-4 animate-spin ml-2" />
                    ) : paymentProof ? (
                      <Check className="h-4 w-4 text-green-500 ml-2" />
                    ) : (
                      <Upload className="h-4 w-4 ml-2" />
                    )}
                    {paymentProof ? (
                      lang === "ar" ? "تم الرفع" : "Uploaded"
                    ) : (
                      lang === "ar" ? "اختر ملف" : "Choose File"
                    )}
                  </Button>
                  <input
                    id="receipt-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileChange}
                    disabled={isUploading}
                  />
                  {paymentProof && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setPaymentProof("");
                        setPaymentProofFile(null);
                      }}
                    >
                      <X className="h-4 w-4 text-red-500" />
                    </Button>
                  )}
                </div>
                {paymentProof && (
                  <div className="relative w-32 h-32 rounded-lg overflow-hidden border">
                    <img
                      src={paymentProof}
                      alt="إيصال الدفع"
                      className="w-full h-full object-cover cursor-pointer"
                      onClick={() => setImageModalUrl(paymentProof)}
                    />
                    <div className="absolute bottom-1 left-1 right-1 bg-black/50 text-white text-xs text-center py-0.5 rounded">
                      {lang === "ar" ? "اضغط للتكبير" : "Tap to expand"}
                    </div>
                  </div>
                )}
                <p className="text-xs text-gray-400">
                  {lang === "ar"
                    ? "يرجى رفع صورة واضحة لإيصال الدفع (jpg, png, jpeg - max 5MB)"
                    : "Please upload a clear image of the payment receipt (jpg, png, jpeg - max 5MB)"}
                </p>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                  <p className="text-sm text-amber-700">
                    {lang === "ar"
                      ? "سيتم مراجعة إيصال الدفع من قبل الإدارة قبل تفعيل المادة"
                      : "The payment receipt will be reviewed by the admin before activating the material"}
                  </p>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCheckoutOpen(false)}>
              {lang === "ar" ? "إلغاء" : "Cancel"}
            </Button>
            <Button
              onClick={handlePayment}
              disabled={isProcessingPayment || !paymentProof}
              className="bg-[#1a7a8a] hover:bg-[#15707e] text-white"
            >
              {isProcessingPayment ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin ml-2" />
                  {lang === "ar" ? "جاري المعالجة..." : "Processing..."}
                </>
              ) : (
                <>
                  {lang === "ar" ? "إرسال الطلب" : "Submit Request"}
                  <ArrowRight className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Payment Status Dialog ──────────────────────────────── */}
      <Dialog open={isPaid && purchaseStatus === "pending"} onOpenChange={() => {}}>
        <DialogContent className="max-w-md text-center" dir={lang === "ar" ? "rtl" : "ltr"}>
          <div className="py-6">
            <div className="w-20 h-20 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
              <Clock className="h-10 w-10 text-amber-500" />
            </div>
            <h3 className="text-xl font-bold text-[#0a2540]">
              {lang === "ar" ? "في انتظار الموافقة" : "Awaiting Approval"}
            </h3>
            <p className="text-gray-500 text-sm mt-2">
              {lang === "ar"
                ? "تم إرسال طلبك بنجاح، سيتم مراجعته من قبل الإدارة"
                : "Your request has been sent successfully, it will be reviewed by admin"}
            </p>
            {purchaseId && (
              <p className="text-xs text-gray-400 mt-2">
                {lang === "ar" ? "رقم الطلب: " : "Request ID: "}
                {purchaseId}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button
              onClick={() => {
                setIsPaid(false);
                setSelectedMaterial(null);
                setPaymentProof("");
                setPaymentProofFile(null);
              }}
              className="w-full bg-[#1a7a8a] hover:bg-[#15707e] text-white"
            >
              {lang === "ar" ? "حسناً" : "OK"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Image Modal ────────────────────────────────────────── */}
      <Dialog open={!!imageModalUrl} onOpenChange={() => setImageModalUrl(null)}>
        <DialogContent className="max-w-2xl" dir={lang === "ar" ? "rtl" : "ltr"}>
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-[#0a2540]">
              {lang === "ar" ? "صورة الإيصال" : "Receipt Image"}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            {imageModalUrl && (
              <img
                src={imageModalUrl}
                alt="إيصال الدفع"
                className="w-full rounded-xl"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "/images/no-image.png";
                }}
              />
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setImageModalUrl(null)}>
              {lang === "ar" ? "إغلاق" : "Close"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}