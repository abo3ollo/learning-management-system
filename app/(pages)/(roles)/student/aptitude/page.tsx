"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight,
  Award,
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
  AlertCircle,
  Check,
  X,
  Eye,
  Download,
  Play,
  Calendar,
  Users,
  ShoppingBag,
  DollarSign,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { CheckoutModal } from "@/app/_components/aptitude/CheckoutModal";
import { MaterialsDisplay } from "@/app/_components/aptitude/MaterialsDisplay";
import { toast } from "sonner";
import { Id } from "@/convex/_generated/dataModel";

export default function StudentAptitudePage() {
  const router = useRouter();
  const { isSignedIn, isLoaded } = useAuth();
  const [lang, setLang] = useState<"en" | "ar">("ar");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTeacher, setSelectedTeacher] = useState<any>(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isMaterialsOpen, setIsMaterialsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [approvedPurchase, setApprovedPurchase] = useState<any>(null);
  const [teacherMaterials, setTeacherMaterials] = useState<any[]>([]);

  // ✅ جلب بيانات المستخدم من Convex
  const currentUser = useQuery(
    api.user.auth.getCurrentUser,
    isSignedIn ? {} : "skip"
  );

  // ✅ جلب بيانات المعلمين من Convex
  const teachersData = useQuery(api.aptitude.aptitude.getAvailableTeachers, {});
  
  // ✅ جلب طلبات القدرات للطالب الحالي
  const myPurchases = useQuery(api.aptitude.aptitude.getMyAptitudePurchases, 
    isSignedIn ? {} : "skip"
  );

  // ✅ دوال Convex
  const createPurchase = useMutation(api.aptitude.aptitude.createAptitudePurchase);
  
  // ✅ جلب دوال المعاملات
  const createTransaction = useMutation(api.transactions.transactions.createTransaction);

  const toggleLang = () => setLang((l) => (l === "en" ? "ar" : "en"));

  // ✅ التحقق من حالة المستخدم
  useEffect(() => {
    if (!isLoaded) return;
    
    if (!isSignedIn) {
      router.replace("/sign-in");
      return;
    }

    if (currentUser !== undefined && currentUser !== null) {
      if (!currentUser?.role) {
        router.replace("/onboarding?from=aptitude");
        return;
      }
      
      if (currentUser.status === "pending") {
        router.replace("/pending-approval");
        return;
      }
      
      if (currentUser.status === "rejected") {
        router.replace("/account-rejected");
        return;
      }
    }
  }, [isLoaded, isSignedIn, currentUser, router]);

  // ✅ جلب المواد المنشورة للمعلم المحدد (باستخدام useQuery)
  const publicMaterials = useQuery(
    api.teacherMaterials.teacherMaterials.getPublicTeacherMaterials,
    selectedTeacher?._id ? { teacherId: selectedTeacher._id as any } : "skip"
  );

  // ✅ تحديث المواد عندما تتغير من useQuery
  useEffect(() => {
    if (publicMaterials) {
      setTeacherMaterials(publicMaterials as any[]);
    }
  }, [publicMaterials]);

  // ✅ التحقق من وجود طلب معتمد لهذا المعلم
  useEffect(() => {
    if (myPurchases && selectedTeacher) {
      const approved = myPurchases.find(
        (p: any) => p.teacherId === selectedTeacher._id && p.status === "approved"
      );
      
      if (approved) {
        setApprovedPurchase(approved);
      } else {
        setApprovedPurchase(null);
        setTeacherMaterials([]);
      }
    }
  }, [myPurchases, selectedTeacher]);

  // حالة التحميل
  if (!isLoaded || teachersData === undefined || currentUser === undefined) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-[#1a7a8a]" />
      </div>
    );
  }

  // ✅ التحقق من تسجيل الدخول
  if (!isSignedIn) {
    return (
      <div className="min-h-screen bg-[#f7fafa] flex items-center justify-center" dir={lang === "ar" ? "rtl" : "ltr"}>
        <div className="max-w-md w-full mx-4">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="w-20 h-20 bg-[#e0f5f7] rounded-full flex items-center justify-center mx-auto mb-4">
              <User className="h-10 w-10 text-[#1a7a8a]" />
            </div>
            <h2 className="text-2xl font-bold text-[#0a2540] mb-2">
              {lang === "ar" ? "تسجيل الدخول مطلوب" : "Login Required"}
            </h2>
            <p className="text-gray-500 mb-6">
              {lang === "ar"
                ? "يرجى تسجيل الدخول للوصول إلى برامج القدرات"
                : "Please login to access aptitude programs"}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ✅ إذا لم يكن للمستخدم دور (لم يكمل Onboarding)
  if (!currentUser?.role) {
    return (
      <div className="min-h-screen bg-[#f7fafa] flex items-center justify-center" dir={lang === "ar" ? "rtl" : "ltr"}>
        <div className="max-w-md w-full mx-4">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Award className="h-10 w-10 text-purple-500" />
            </div>
            <h2 className="text-2xl font-bold text-[#0a2540] mb-2">
              {lang === "ar" ? "أكمل بياناتك أولاً" : "Complete Your Data First"}
            </h2>
            <p className="text-gray-500 mb-6">
              {lang === "ar"
                ? "يرجى إكمال بياناتك الأساسية أولاً للوصول إلى برامج القدرات"
                : "Please complete your basic data first to access aptitude programs"}
            </p>
            <Link href="/onboarding?from=aptitude">
              <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white text-lg py-6">
                {lang === "ar" ? "إكمال البيانات" : "Complete Data"}
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // فلترة المعلمين حسب البحث
  const filteredTeachers = teachersData?.filter((teacher: any) => {
    const search = searchQuery.toLowerCase();
    return (
      teacher.name?.toLowerCase().includes(search) ||
      teacher.email?.toLowerCase().includes(search) ||
      teacher.specialization?.toLowerCase().includes(search) ||
      teacher.subjects?.some((s: string) => s.toLowerCase().includes(search))
    );
  });

  // ✅ اختيار معلم وفتح مودال الدفع أو عرض المواد
  const selectTeacher = (teacher: any) => {
    setSelectedTeacher(teacher);
    
    const approved = myPurchases?.find(
      (p: any) => p.teacherId === teacher._id && p.status === "approved"
    );

    if (approved) {
      setApprovedPurchase(approved);
      setIsMaterialsOpen(true);
    } else {
      setIsCheckoutOpen(true);
    }
  };

  // ✅ معالجة الدفع مع إنشاء معاملة مالية
  const handlePaymentSubmit = async (data: { paymentProof: string }) => {
    if (!selectedTeacher) return;
    if (!currentUser) {
      toast.error("يرجى تسجيل الدخول أولاً");
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. إنشاء طلب شراء التحصيلات
      const aptitudeResult = await createPurchase({
        teacherId: selectedTeacher._id,
        amount: selectedTeacher.coursePrice || 0,
        paymentProof: data.paymentProof,
      });

      // ✅ 2. إنشاء معاملة مالية
      const transactionData: any = {
        studentId: currentUser._id,
        type: "aptitude",
        category: "material_purchase",
        amount: selectedTeacher.coursePrice || 0,
        currency: selectedTeacher.courseCurrency || "EGP",
        status: "pending", // ينتظر موافقة الأدمن
        referenceId: aptitudeResult,
        referenceType: "aptitude_purchase",
        description: `Aptitude materials from ${selectedTeacher.name}`,
        descriptionAr: `مواد قدرات من ${selectedTeacher.name}`,
        paymentProof: data.paymentProof,
      };

      if (currentUser.parentId) {
        transactionData.parentId = currentUser.parentId as Id<"users">;
      }

      await createTransaction(transactionData);

      setIsCheckoutOpen(false);
      toast.success("✅ تم إرسال طلب الشراء بنجاح، في انتظار الموافقة");
      window.location.reload();
    } catch (error: any) {
      toast.error(error.message || "حدث خطأ أثناء الدفع");
    } finally {
      setIsSubmitting(false);
    }
  };

  // عرض حالة طلب الطالب
  const renderPurchaseStatus = () => {
    if (!myPurchases || myPurchases.length === 0) return null;

    const pendingPurchase = myPurchases.find((p: any) => p.status === "pending");
    if (!pendingPurchase) return null;

    return (
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-amber-700">
              {lang === "ar" ? "طلب قيد المراجعة" : "Pending Request"}
            </p>
            <p className="text-sm text-amber-600">
              {lang === "ar"
                ? `طلبك للمعلم ${pendingPurchase.teacherName} قيد المراجعة من قبل الإدارة`
                : `Your request for teacher ${pendingPurchase.teacherName} is under review`}
            </p>
            <Button 
              variant="outline" 
              className="mt-2 border-amber-300 text-amber-700 hover:bg-amber-100"
              onClick={() => window.location.reload()}
            >
              {lang === "ar" ? "تحديث" : "Refresh"}
            </Button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#f7fafa]" dir={lang === "ar" ? "rtl" : "ltr"}>
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-6 py-4 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/student" className="text-gray-600 hover:text-gray-900 transition-colors">
              <ArrowRight className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                {lang === "ar" ? "برامج القدرات" : "Aptitude Programs"}
              </h1>
              <p className="text-sm text-gray-500">
                {lang === "ar" 
                  ? "استعد لاختبارات القدرات مع أفضل المعلمين" 
                  : "Prepare for aptitude tests with the best teachers"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/student/purchases" className="text-sm text-gray-500 hover:text-gray-700">
              <ShoppingBag className="h-5 w-5" />
            </Link>
            <button
              onClick={toggleLang}
              className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 border border-gray-200 rounded-lg px-3 py-1.5 transition-colors"
            >
              <Globe className="h-4 w-4" />
              {lang === "en" ? "AR" : "EN"}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* ✅ عرض حالة الطلبات المعلقة */}
        {renderPurchaseStatus()}

        {/* Search */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder={lang === "ar" ? "ابحث عن معلم..." : "Search for a teacher..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-10 border-gray-200 focus-visible:ring-[#03363d]/20"
            />
          </div>
        </div>

        {/* Teachers Grid */}
        {filteredTeachers?.length === 0 ? (
          <div className="text-center py-12">
            <Users className="h-12 w-12 mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500">
              {lang === "ar" ? "لا توجد نتائج مطابقة للبحث" : "No results match your search"}
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTeachers?.map((teacher: any) => {
              const purchase = myPurchases?.find((p: any) => p.teacherId === teacher._id);
              const isApproved = purchase?.status === "approved";
              const isPending = purchase?.status === "pending";
              const isRejected = purchase?.status === "rejected";

              return (
                <Card key={teacher._id} className="overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border border-gray-100 bg-white">
                  <div className="p-6">
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

                      {/* ✅ عرض سعر الكورس */}
                      {teacher.coursePrice && teacher.coursePrice > 0 && (
                        <div className="flex items-center gap-1.5 text-sm font-medium text-green-600 bg-green-50 px-3 py-1.5 rounded-lg mt-2">
                          <DollarSign className="h-4 w-4" />
                          <span>{teacher.coursePrice} {teacher.courseCurrency || "EGP"}</span>
                          <span className="text-xs text-gray-400">(الكورس كامل)</span>
                        </div>
                      )}
                    </div>

                    <Button
                      className={`w-full mt-4 transition-colors ${
                        isApproved
                          ? "bg-green-600 hover:bg-green-700 text-white"
                          : isPending
                          ? "bg-amber-500 hover:bg-amber-600 text-white"
                          : isRejected
                          ? "bg-gray-400 hover:bg-gray-500 text-white"
                          : "bg-[#0a2540] hover:bg-[#1a3a5c] text-white"
                      }`}
                      onClick={() => selectTeacher(teacher)}
                      disabled={isPending}
                    >
                      {isApproved ? (
                        <>
                          <CheckCircle className="h-4 w-4 ml-2" />
                          {lang === "ar" ? "عرض المواد" : "View Materials"}
                        </>
                      ) : isPending ? (
                        <>
                          <Clock className="h-4 w-4 ml-2 animate-pulse" />
                          {lang === "ar" ? "قيد المراجعة" : "Pending"}
                        </>
                      ) : isRejected ? (
                        <>
                          <X className="h-4 w-4 ml-2" />
                          {lang === "ar" ? "مرفوض" : "Rejected"}
                        </>
                      ) : (
                        <>
                          <ArrowRight className="h-4 w-4 ml-2" />
                          {lang === "ar" ? "شراء المواد" : "Purchase Materials"}
                        </>
                      )}
                    </Button>

                    {isPending && (
                      <p className="text-xs text-amber-600 text-center mt-2">
                        {lang === "ar" 
                          ? "جاري مراجعة طلبك من قبل الإدارة" 
                          : "Your request is being reviewed"}
                      </p>
                    )}
                    {isRejected && purchase?.rejectionReason && (
                      <p className="text-xs text-red-500 text-center mt-2">
                        {lang === "ar" 
                          ? `السبب: ${purchase.rejectionReason}` 
                          : `Reason: ${purchase.rejectionReason}`}
                      </p>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Checkout Modal */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => {
          setIsCheckoutOpen(false);
          setSelectedTeacher(null);
        }}
        teacher={selectedTeacher}
        onSubmit={handlePaymentSubmit}
        isSubmitting={isSubmitting}
        lang={lang}
      />

      {/* Materials Display */}
      <MaterialsDisplay
        isOpen={isMaterialsOpen}
        onClose={() => {
          setIsMaterialsOpen(false);
          setSelectedTeacher(null);
          setApprovedPurchase(null);
        }}
        teacher={selectedTeacher}
        materials={teacherMaterials}
        lang={lang}
      />
    </div>
  );
}