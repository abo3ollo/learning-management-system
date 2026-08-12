// app/(pages)/aptitude/page.tsx

"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation } from "convex/react";
import { useUser, useAuth, SignInButton } from "@clerk/nextjs";
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
  Users,
  DollarSign,
  Upload,
  AlertCircle,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/app/hooks/use-toast";
import { MaterialsDisplay } from "@/app/_components/aptitude/MaterialsDisplay";

// ── Types ──────────────────────────────────────────────────────────
type MaterialType = "pdf" | "video" | "exam" | "assignment" | "revision";

const materialTypeLabels: Record<MaterialType, { ar: string; en: string; icon: any }> = {
  pdf: { ar: "ملف PDF", en: "PDF", icon: FileText },
  video: { ar: "فيديو", en: "Video", icon: Video },
  exam: { ar: "امتحان", en: "Exam", icon: BookOpen },
  assignment: { ar: "واجب", en: "Assignment", icon: CheckCircle },
  revision: { ar: "مراجعة", en: "Revision", icon: Eye },
};

// ═══════════════════════════════════════════════════════════════════
export default function AptitudePage() {
  const { toast } = useToast();
  const { user: clerkUser, isLoaded: userLoaded } = useUser();
  const { userId, isSignedIn, isLoaded: authLoaded } = useAuth();
  
  const [lang, setLang] = useState<"en" | "ar">("ar");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTeacher, setSelectedTeacher] = useState<any>(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isMaterialsOpen, setIsMaterialsOpen] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentProof, setPaymentProof] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [purchaseStatus, setPurchaseStatus] = useState<"idle" | "pending" | "approved" | "rejected">("idle");
  const [purchaseId, setPurchaseId] = useState<string | null>(null);

  // ── Queries ───────────────────────────────────────────────────
  const isUserReady = authLoaded && userLoaded && isSignedIn && userId;
  
  const currentUser = useQuery(
    api.user.auth.getCurrentUser,
    isUserReady ? {} : "skip"
  );
  
  const teachersData = useQuery(api.user.teachers.getPublicTeachers, {});
  const materials = useQuery(api.teacherMaterials.teacherMaterials.getPublicTeacherMaterials, {});
  const generateUploadUrl = useMutation(api.teacherMaterials.teacherMaterials.generateUploadUrl);
  
  // ✅ جلب حالة الشراء لكل معلم
  const purchaseStatuses = useQuery(
    api.aptitude.aptitude.getMyAptitudePurchasesWithStatus,
    isUserReady ? {} : "skip"
  );

  // ── Mutations ────────────────────────────────────────────────
  const createPurchase = useMutation(api.aptitude.aptitude.createAptitudePurchase);
  const createUser = useMutation(api.user.auth.createUser);

  // ✅ تحديد متى تكون البيانات جاهزة
  useEffect(() => {
    if (authLoaded && userLoaded && isSignedIn !== undefined) {
      setIsReady(true);
    }
  }, [authLoaded, userLoaded, isSignedIn]);

  // ✅ إنشاء المستخدم في Convex إذا مش موجود
  useEffect(() => {
    if (isUserReady && clerkUser && !currentUser) {
      console.log("🔄 [Aptitude] Creating user in Convex...");
      createUser({
        clerkId: clerkUser.id,
        email: clerkUser.emailAddresses?.[0]?.emailAddress || "",
        name: clerkUser.fullName || clerkUser.username || "مستخدم",
        phoneNumber: clerkUser.phoneNumbers?.[0]?.phoneNumber || "",
        role: "student",
        status: "pending",
        tracks: ["aptitude"],
      }).then((userId) => {
        console.log("✅ [Aptitude] User created in Convex:", userId);
        window.location.reload();
      }).catch((error) => {
        console.error("❌ [Aptitude] Error creating user:", error);
      });
    }
  }, [isUserReady, clerkUser, currentUser, createUser]);

  useEffect(() => {
    console.log("🔵 isCheckoutOpen changed:", isCheckoutOpen);
  }, [isCheckoutOpen]);

  useEffect(() => {
    console.log("🔵 selectedTeacher changed:", selectedTeacher?.name);
  }, [selectedTeacher]);

  // ── Handlers ──────────────────────────────────────────────────
  const toggleLang = () => setLang((l) => (l === "en" ? "ar" : "en"));

  // ✅ اختيار معلم للدفع
  const selectTeacher = useCallback((teacher: any) => {
    console.log("🟢 1. selectTeacher START", { teacher: teacher?.name });
    console.log("🟢 2. isReady:", isReady);
    console.log("🟢 3. currentUser:", currentUser);
    console.log("🟢 4. clerkUser:", clerkUser);
    console.log("🟢 5. isSignedIn:", isSignedIn);
    
    if (!isReady) {
      toast({
        title: "جاري التحميل",
        description: "يتم تحميل بيانات المستخدم...",
      });
      return;
    }

    if (!isSignedIn) {
      toast({
        title: "تنبيه",
        description: "الرجاء تسجيل الدخول أولاً",
        variant: "destructive",
      });
      return;
    }

    if (!currentUser && clerkUser) {
      console.log("🟡 6. User not in Convex yet, waiting for creation...");
      toast({
        title: "جاري التسجيل",
        description: "يتم إنشاء حسابك... يرجى الانتظار",
      });
      return;
    }

    if (currentUser) {
      console.log("🟢 7. Setting selectedTeacher:", teacher);
      setSelectedTeacher(teacher);
      setIsCheckoutOpen(true);
    }
  }, [isReady, isSignedIn, currentUser, clerkUser, toast]);

  // ✅ معالج رفع الصورة
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

  // ✅ معالج الدفع
  const handlePaymentSubmit = async () => {
    if (!selectedTeacher) return;
    if (!currentUser) {
      setError("الرجاء تسجيل الدخول أولاً");
      return;
    }
    if (!paymentProof) {
      setError("يرجى رفع إيصال الدفع");
      return;
    }

    setIsProcessingPayment(true);
    try {
      const result = await createPurchase({
        teacherId: selectedTeacher._id as Id<"users">,
        amount: selectedTeacher.coursePrice || 150,
        paymentProof: paymentProof,
      });

      setPurchaseId(result as string);
      setPurchaseStatus("pending");
      setIsCheckoutOpen(false);
      setPaymentProof("");
      setError(null);

      toast({
        title: "تم إرسال الطلب",
        description: "تم إرسال طلب الدفع للمراجعة، سيتم إعلامك عند الموافقة",
      });

      // ✅ لا نفتح المواد مباشرة - ننتظر الموافقة
    } catch (error: any) {
      setError(error.message || "حدث خطأ أثناء الدفع");
    } finally {
      setIsProcessingPayment(false);
    }
  };

  // ✅ التحقق من حالة الشراء للمعلم المختار
  const getTeacherPurchaseStatus = (teacherId: string) => {
    const status = purchaseStatuses?.find((p: any) => p.teacherId === teacherId);
    return status || null;
  };

  // ✅ عرض المواد بعد الموافقة
  const viewApprovedMaterials = (teacher: any) => {
    setSelectedTeacher(teacher);
    setIsMaterialsOpen(true);
  };

  // ── فلترة المعلمين ──────────────────────────────────────────
  const filteredTeachers = (teachersData || []).filter((teacher: any) => {
    const search = searchQuery.toLowerCase();
    const matchSearch =
      !searchQuery ||
      teacher.name?.toLowerCase().includes(search) ||
      teacher.email?.toLowerCase().includes(search) ||
      teacher.specialization?.toLowerCase().includes(search) ||
      teacher.subjects?.some((s: string) => s.toLowerCase().includes(search));

    return matchSearch;
  });

  // ── جلب مواد المعلم المختار ──────────────────────────────────
  const teacherMaterials = (materials || []).filter(
    (m: any) => m.teacherId === selectedTeacher?._id
  );

  // ── حالة التحميل ──────────────────────────────────────────────
  if (!authLoaded || !userLoaded || teachersData === undefined || materials === undefined) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-[#1a7a8a]" />
      </div>
    );
  }

  // ✅ لو مش مسجل دخول
  if (!isSignedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f7fafa]">
        <div className="text-center bg-white p-8 rounded-2xl shadow-lg max-w-md">
          <h1 className="text-2xl font-bold text-[#001f24] mb-4">
            {lang === "ar" ? "الرجاء تسجيل الدخول" : "Please Sign In"}
          </h1>
          <p className="text-gray-500 mb-6">
            {lang === "ar" 
              ? "يجب تسجيل الدخول أولاً للوصول إلى برامج القدرات"
              : "You must sign in first to access aptitude programs"}
          </p>
          <SignInButton mode="modal">
            <button className="bg-[#001f24] hover:bg-[#03363d] text-white font-semibold px-8 py-3 rounded-xl transition-colors">
              {lang === "ar" ? "تسجيل الدخول" : "Sign In"}
            </button>
          </SignInButton>
        </div>
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
                {lang === "ar" ? "برامج القدرات" : "Aptitude Programs"}
              </h1>
              <p className="text-[#a3ced6] text-sm">
                {lang === "ar" 
                  ? "استعد لاختبارات القدرات مع أفضل المعلمين" 
                  : "Prepare for aptitude tests with the best teachers"}
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
        {/* Search */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder={lang === "ar" ? "ابحث عن معلم أو مادة..." : "Search for teacher or subject..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-10 border-gray-200"
            />
          </div>
        </div>

        {/* Teachers Grid */}
        {filteredTeachers.length === 0 ? (
          <div className="text-center py-16">
            <Users className="h-12 w-12 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">
              {lang === "ar" ? "لا توجد نتائج مطابقة للبحث" : "No results match your search"}
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTeachers.map((teacher: any) => {
              const purchaseStatus = getTeacherPurchaseStatus(teacher._id);
              const isFree = (teacher.coursePrice || 0) === 0;
              const isPending = purchaseStatus?.status === "pending";
              const isApproved = purchaseStatus?.status === "approved";
              const isRejected = purchaseStatus?.status === "rejected";

              // ✅ المواد متاحة فقط لو تمت الموافقة
              const hasAccess = isApproved || isFree;

              return (
                <Card key={teacher._id} className="overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border border-gray-100 bg-white">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-full bg-[#e0f5f7] flex items-center justify-center">
                        <span className="text-2xl font-bold text-[#1a7a8a]">
                          {teacher.name?.charAt(0) || "?"}
                        </span>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-[#0a2540] text-lg line-clamp-1">
                          {teacher.name}
                        </h3>
                        <p className="text-sm text-gray-500 line-clamp-1">
                          {teacher.specialization || teacher.subjects?.join(" • ")}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 space-y-2">
                      <div className="flex flex-wrap gap-2">
                        {teacher.subjects?.slice(0, 3).map((subject: string) => (
                          <Badge key={subject} className="bg-[#1a7a8a]/10 text-[#1a7a8a] border-none text-xs">
                            {subject}
                          </Badge>
                        ))}
                        {teacher.subjects?.length > 3 && (
                          <Badge className="bg-gray-100 text-gray-500 border-none text-xs">
                            +{teacher.subjects.length - 3}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Clock className="h-4 w-4" />
                        <span>{teacher.experience || 0} {lang === "ar" ? "سنوات خبرة" : "years experience"}</span>
                      </div>
                      {teacher.qualification && (
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <GraduationCap className="h-4 w-4" />
                          <span className="line-clamp-1">{teacher.qualification}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1 text-[#1a7a8a] font-bold">
                        <DollarSign className="h-4 w-4" />
                        <span>
                          {isFree ? (lang === "ar" ? "مجاني" : "Free") : `${teacher.coursePrice || 150} ${teacher.courseCurrency || "EGP"}`}
                        </span>
                      </div>

                      {/* ✅ عرض حالة الشراء */}
                      {isPending && (
                        <div className="flex items-center gap-2 text-amber-600 bg-amber-50 px-3 py-1.5 rounded-lg text-sm">
                          <Clock className="h-4 w-4 animate-pulse" />
                          <span>{lang === "ar" ? "في انتظار الموافقة" : "Awaiting approval"}</span>
                        </div>
                      )}
                      {isRejected && (
                        <div className="flex items-center gap-2 text-red-600 bg-red-50 px-3 py-1.5 rounded-lg text-sm">
                          <AlertCircle className="h-4 w-4" />
                          <span>{lang === "ar" ? "تم رفض الطلب" : "Rejected"}</span>
                        </div>
                      )}
                      {isApproved && (
                        <div className="flex items-center gap-2 text-green-600 bg-green-50 px-3 py-1.5 rounded-lg text-sm">
                          <CheckCircle className="h-4 w-4" />
                          <span>{lang === "ar" ? "تمت الموافقة ✅" : "Approved ✅"}</span>
                        </div>
                      )}
                    </div>

                    <div className="mt-4 flex gap-2">
                      {hasAccess ? (
                        // ✅ زر عرض المواد (للموافق عليه أو المجاني)
                        <Button
                          className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                          onClick={() => viewApprovedMaterials(teacher)}
                        >
                          {lang === "ar" ? "عرض المواد" : "View Materials"}
                          <Eye className="h-4 w-4 ml-2" />
                        </Button>
                      ) : isPending ? (
                        // ✅ زر معطل - في انتظار الموافقة
                        <Button
                          className="flex-1 bg-amber-500 hover:bg-amber-600 text-white cursor-not-allowed"
                          disabled
                        >
                          {lang === "ar" ? "في انتظار الموافقة" : "Awaiting Approval"}
                          <Clock className="h-4 w-4 ml-2 animate-pulse" />
                        </Button>
                      ) : (
                        // ✅ زر شراء المواد
                        <Button
                          className="flex-1 bg-[#0a2540] hover:bg-[#1a3a5c] text-white"
                          onClick={() => selectTeacher(teacher)}
                          disabled={!isReady || !isSignedIn}
                        >
                          {lang === "ar" ? "شراء المواد" : "Purchase"}
                          <DollarSign className="h-4 w-4 ml-2" />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Checkout Modal ──────────────────────────────────────── */}
      {isCheckoutOpen && selectedTeacher && currentUser && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="flex items-center justify-between p-6 border-b border-gray-100 sticky top-0 bg-white z-10">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {lang === "ar" ? "الدفع والاشتراك" : "Payment & Subscription"}
                </h2>
                <p className="text-sm text-gray-500">
                  {selectedTeacher.name} - {selectedTeacher.specialization || selectedTeacher.subjects?.join(" • ")}
                </p>
              </div>
              <button
                onClick={() => {
                  setIsCheckoutOpen(false);
                  setPaymentProof("");
                  setError(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <span className="text-2xl text-gray-500">×</span>
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-full bg-[#e0f5f7] flex items-center justify-center">
                    <User className="h-7 w-7 text-[#1a7a8a]" />
                  </div>
                  <div>
                    <p className="font-semibold text-[#0a2540]">{selectedTeacher.name}</p>
                    <p className="text-sm text-gray-500">{selectedTeacher.specialization}</p>
                    <div className="flex items-center gap-1 text-xs text-gray-400">
                      <GraduationCap className="h-3 w-3" />
                      <span>{selectedTeacher.experience || 0} {lang === "ar" ? "سنوات خبرة" : "years exp"}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-semibold text-[#0a2540]">
                  {lang === "ar" ? "تفاصيل الدفع" : "Payment Details"}
                </p>
                <div className="bg-gray-50 rounded-xl p-3 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">{lang === "ar" ? "سعر الكورس" : "Course Price"}</span>
                    <span className="font-semibold">
                      {selectedTeacher.coursePrice || 150} {selectedTeacher.courseCurrency || "EGP"}
                    </span>
                  </div>
                  <div className="border-t border-gray-200 pt-2 flex justify-between text-sm font-bold">
                    <span>{lang === "ar" ? "الإجمالي" : "Total"}</span>
                    <span className="text-[#1a7a8a]">
                      {selectedTeacher.coursePrice || 150} {selectedTeacher.courseCurrency || "EGP"}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-2">
                  {lang === "ar" ? "رفع إيصال الدفع" : "Upload Payment Receipt"}
                  <span className="text-red-500 mr-1">*</span>
                </label>

                {!paymentProof ? (
                  <div
                    onClick={() => document.getElementById("receipt-upload")?.click()}
                    className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-[#1a7a8a] transition-colors cursor-pointer"
                  >
                    {isUploading ? (
                      <Loader2 className="h-10 w-10 text-[#1a7a8a] animate-spin mx-auto" />
                    ) : (
                      <>
                        <Upload className="h-10 w-10 text-gray-400 mx-auto mb-3" />
                        <p className="text-sm font-medium text-gray-600">
                          {lang === "ar" ? "رفع إيصال الدفع" : "Upload Payment Receipt"}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {lang === "ar" ? "PNG, JPG, JPEG (حد أقصى 5MB)" : "PNG, JPG, JPEG (Max 5MB)"}
                        </p>
                      </>
                    )}
                    <input
                      id="receipt-upload"
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
                        <p className="text-sm font-medium text-gray-700">
                          {lang === "ar" ? "تم رفع الإيصال" : "Receipt Uploaded"}
                        </p>
                        <p className="text-xs text-gray-400">صورة الإيصال</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => document.getElementById("receipt-upload")?.click()}
                        className="px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors text-sm"
                      >
                        {lang === "ar" ? "تغيير" : "Change"}
                      </button>
                      <input
                        id="receipt-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </div>
                  </div>
                )}
              </div>

              {error && (
                <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl text-sm">
                  {error}
                </div>
              )}

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

              <div className="flex gap-3 pt-4 border-t border-gray-100">
                <Button
                  onClick={handlePaymentSubmit}
                  disabled={isProcessingPayment || !paymentProof}
                  className="flex-1 bg-[#001f24] hover:bg-[#03363d] disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition-colors"
                >
                  {isProcessingPayment ? (
                    <Loader2 className="h-5 w-5 animate-spin mx-auto" />
                  ) : (
                    lang === "ar" ? "تأكيد الدفع" : "Confirm Payment"
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsCheckoutOpen(false);
                    setPaymentProof("");
                    setError(null);
                  }}
                  className="px-6"
                >
                  {lang === "ar" ? "إلغاء" : "Cancel"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Materials Display Modal ────────────────────────────── */}
      <MaterialsDisplay
        isOpen={isMaterialsOpen}
        onClose={() => {
          setIsMaterialsOpen(false);
          setSelectedTeacher(null);
        }}
        teacher={selectedTeacher}
        materials={teacherMaterials}
        lang={lang}
      />
    </div>
  );
}