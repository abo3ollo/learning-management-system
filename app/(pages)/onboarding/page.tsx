"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

import {
  User, Phone, Mail, Calendar, MapPin,
  BookOpen, GraduationCap, Users, ChevronRight,
  ChevronLeft, Check, Loader2, AlertCircle,
  Building, Briefcase, Heart, Shield,
} from "lucide-react";
import SubscriptionModal from "@/app/_components/SubscriptionModal";
import { ChildRegistrationModal } from "@/app/_components/ChildRegistrationModal";

// ── Types ──────────────────────────────────────────────────────────
type Role = "student" | "teacher" | "parent" | "admin";

interface FormData {
  // Common
  name: string;
  phoneNumber: string;
  email: string;
  role: Role | "";
  // Student
  birthDate: string;
  gender: "male" | "female" | "";
  address: string;
  gradeId: string;
  groupId: string;
  // Teacher
  specialization: string;
  qualification: string;
  experience: string;
  subjects: string[];
  // Parent
  relationship: string;
  workPhone: string;
  jobTitle: string;
  nationalId: string;
}

const initialForm: FormData = {
  name: "", phoneNumber: "", email: "", role: "",
  birthDate: "", gender: "", address: "", gradeId: "", groupId: "",
  specialization: "", qualification: "", experience: "", subjects: [],
  relationship: "", workPhone: "", jobTitle: "", nationalId: "",
};

// ═══════════════════════════════════════════════════════════════════
export default function OnboardingPage() {
  const router = useRouter();
  const { user, isLoaded } = useUser();

  // ── Form state ────────────────────────────────────────────────
  const [formData, setFormData] = useState<FormData>(initialForm);
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ✅ Flow control flags
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [showChildModal, setShowChildModal] = useState(false);
  const [subscriptionData, setSubscriptionData] = useState<{
    studentId: string;
    gradeId: string;
    role: "student" | "parent";
    childName?: string;
  } | null>(null);

  // ── Queries ───────────────────────────────────────────────────
  const currentUser = useQuery(
    api.user.auth.getCurrentUser,
    isLoaded && user ? {} : "skip"
  );
  const grades = useQuery(api.grades.grades.getActiveGrades);
  const groups = useQuery(
    api.groups.groups.getGroupsByGrade,
    formData.gradeId ? { gradeId: formData.gradeId as Id<"grades"> } : "skip"
  );

  const createUser = useMutation(api.user.auth.createUser);

  // ── Pre-fill email AND name from Clerk ────────────────────────
  useEffect(() => {
    if (user) {
      const primaryEmail = user.emailAddresses?.[0]?.emailAddress || "";
      const fullName = user.fullName || user.username || "";

      setFormData((prev) => ({
        ...prev,
        email: primaryEmail,
        name: fullName,
      }));
    }
  }, [user]);

  // ✅ Redirect logic - منع التوجيه أثناء وجود أي مودال
  useEffect(() => {
    if (!currentUser) return;

    // ✅ إذا كان أي مودال مفتوحاً، لا تقم بالتوجيه
    if (showSubscriptionModal || showChildModal) {
      return;
    }

    if (currentUser.status === "active" || currentUser.status === "approved") {
      const routes: Record<string, string> = {
        student: "/student",
        teacher: "/teacher",
        parent: "/parent",
        admin: "/admin",
      };
      router.replace(routes[currentUser.role] ?? "/dashboard");
      return;
    }

    if (currentUser.status === "rejected") {
      router.replace("/account-rejected");
      return;
    }

    if (currentUser.status === "pending") {
      router.replace("/pending-approval");
    }
  }, [currentUser, showSubscriptionModal, showChildModal, router]);

  // ✅ Called by SubscriptionModal when user completes or skips
  const handleSubscriptionDone = useCallback(() => {
    setShowSubscriptionModal(false);
    router.replace("/pending-approval");
  }, [router]);

  // ✅ معالج إكمال تسجيل الطفل - يفتح SubscriptionModal مباشرة
  const handleChildRegistered = useCallback((childId: string, gradeId: string, childName: string) => {
    // ✅ إغلاق مودال تسجيل الطفل أولاً
    setShowChildModal(false);

    // ✅ تعيين بيانات الاشتراك
    setSubscriptionData({
      studentId: childId,
      gradeId: gradeId,
      role: "parent",
      childName: childName || "الطفل",
    });

    // ✅ فتح SubscriptionModal مباشرة
    setShowSubscriptionModal(true);
  }, []);

  // ── Form helpers ──────────────────────────────────────────────
  const update = (field: keyof FormData, value: any) =>
    setFormData((prev) => ({ ...prev, [field]: value }));

  const validateStep1 = () => {
    if (!formData.role) return "يرجى اختيار الدور";
    if (!formData.name.trim()) return "يرجى إدخال الاسم";
    if (!formData.phoneNumber) return "يرجى إدخال رقم الهاتف";
    return null;
  };

  const validateStep2 = () => {
    if (formData.role === "student") {
      if (!formData.birthDate) return "يرجى إدخال تاريخ الميلاد";
      if (!formData.gender) return "يرجى اختيار الجنس";
      if (!formData.gradeId) return "يرجى اختيار الصف الدراسي";
    }
    if (formData.role === "teacher") {
      if (!formData.specialization) return "يرجى إدخال التخصص";
      if (!formData.qualification) return "يرجى إدخال المؤهل العلمي";
    }
    if (formData.role === "parent") {
      if (!formData.relationship) return "يرجى إدخال صلة القرابة";
    }
    if (formData.role === "admin") {
      return null;
    }
    return null;
  };

  const handleNext = () => {
    setError(null);
    const err = currentStep === 1 ? validateStep1() : validateStep2();
    if (err) { setError(err); return; }
    setCurrentStep((s) => s + 1);
  };

  // ── Submit ────────────────────────────────────────────────────
  const handleSubmit = async () => {
    setError(null);
    const err = validateStep2();
    if (err) { setError(err); return; }
    if (!user) return;

    setIsSubmitting(true);
    try {
      const selectedGrade = grades?.find((g: any) => g._id === formData.gradeId);
      const gradeName = selectedGrade?.name || "";

      const result = await createUser({
        clerkId: user.id,
        email: user.emailAddresses[0]?.emailAddress ?? "",
        name: formData.name.trim(),
        phoneNumber: formData.phoneNumber,
        role: formData.role as Role,
        birthDate: formData.birthDate
          ? new Date(formData.birthDate).getTime()
          : undefined,
        gender: formData.gender || undefined,
        address: formData.address || undefined,
        grade: gradeName,
        gradeId: formData.gradeId
          ? (formData.gradeId as Id<"grades">)
          : undefined,
        groupId: formData.groupId
          ? (formData.groupId as Id<"groups">)
          : undefined,
        specialization: formData.specialization || undefined,
        qualification: formData.qualification || undefined,
        experience: formData.experience
          ? Number(formData.experience)
          : undefined,
        subjects: formData.subjects.length > 0
          ? formData.subjects
          : undefined,
        relationship: formData.relationship || undefined,
        workPhone: formData.workPhone || undefined,
        jobTitle: formData.jobTitle || undefined,
        nationalId: formData.nationalId || undefined,
      });

      const newUserId = result as unknown as string;
      const gradeId = formData.gradeId;

      if (formData.role === "student") {
        // ✅ الطالب: فتح SubscriptionModal مباشرة
        setShowSubscriptionModal(true);
        setSubscriptionData({
          studentId: newUserId,
          gradeId: gradeId,
          role: "student",
        });
      } else if (formData.role === "parent") {
        // ✅ ولي الأمر: فتح ChildRegistrationModal لتسجيل الطفل
        setShowChildModal(true);
      } else {
        // ✅ Teacher, Admin يذهبون مباشرة إلى pending-approval
        router.replace("/pending-approval");
      }

    } catch (err: any) {
      setError(err.message || "حدث خطأ أثناء التسجيل، يرجى المحاولة مجدداً");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Loading state ─────────────────────────────────────────────
  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-[#1a7a8a]" />
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────
  const roleOptions: { value: Role; label: string; icon: any; desc: string }[] = [
    { value: "student", label: "طالب", icon: GraduationCap, desc: "سجّل كطالب للوصول للدورات والامتحانات" },
    { value: "teacher", label: "معلم", icon: BookOpen, desc: "سجّل كمعلم لإدارة الدورات والطلاب" },
    { value: "parent", label: "ولي أمر", icon: Users, desc: "سجّل كولي أمر لمتابعة أداء أبنائك" },
    { value: "admin", label: "أدمن", icon: Shield, desc: "سجّل كأدمن لإدارة المنصة والمستخدمين" },
  ];

  if (currentUser?.role === "admin" && (currentUser.status === "active" || currentUser.status === "approved")) {
    router.replace("/admin");
    return null;
  }

  return (
    <>
      <div className="min-h-screen bg-linear-to-br from-[#f0f4f8] to-[#e8f4f8] flex items-center justify-center p-4" dir="rtl">
        <div className="w-full max-w-lg">

          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-[#001f24] rounded-2xl flex items-center justify-center mx-auto mb-4">
              <GraduationCap className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-[#001f24]">إنشاء حسابك</h1>
            <p className="text-gray-500 text-sm mt-1">أكمل بياناتك للانضمام إلى المنصة</p>
          </div>

          {/* Step indicator */}
          <div className="flex items-center justify-center gap-2 mb-6">
            {[1, 2].map((s) => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${currentStep >= s
                    ? "bg-[#001f24] text-white"
                    : "bg-gray-200 text-gray-500"
                  }`}>
                  {currentStep > s ? <Check className="h-4 w-4" /> : s}
                </div>
                {s < 2 && <div className={`w-12 h-0.5 ${currentStep > s ? "bg-[#001f24]" : "bg-gray-200"}`} />}
              </div>
            ))}
          </div>

          {/* Card */}
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 text-red-600 bg-red-50 border border-red-100 px-4 py-3 rounded-xl mb-5 text-sm">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            {/* ── STEP 1 ────────────────────────────────────── */}
            {currentStep === 1 && (
              <div className="space-y-5">
                <h2 className="text-lg font-bold text-[#001f24]">المعلومات الأساسية</h2>

                <div>
                  <label className="text-sm font-semibold text-gray-700 block mb-3">
                    اختر دورك <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {roleOptions.map((opt) => {
                      const Icon = opt.icon;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => update("role", opt.value)}
                          className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 text-center transition-all ${formData.role === opt.value
                              ? "border-[#1a7a8a] bg-[#e0f5f7]"
                              : "border-gray-100 hover:border-gray-200 bg-gray-50"
                            }`}
                        >
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${formData.role === opt.value ? "bg-[#1a7a8a]" : "bg-gray-200"
                            }`}>
                            <Icon className={`h-6 w-6 ${formData.role === opt.value ? "text-white" : "text-gray-500"}`} />
                          </div>
                          <div>
                            <p className="font-semibold text-[#001f24] text-sm">{opt.label}</p>
                            <p className="text-xs text-gray-400 line-clamp-2">{opt.desc}</p>
                          </div>
                          {formData.role === opt.value && (
                            <Check className="h-4 w-4 text-[#1a7a8a]" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-semibold text-gray-700 block mb-1">
                    الاسم الكامل <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => update("name", e.target.value)}
                      placeholder="أدخل اسمك الكامل"
                      className="w-full border border-gray-200 rounded-xl pr-10 pl-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a7a8a]/20 focus:border-[#1a7a8a]"
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    {formData.name ? "✅ تم جلب الاسم من حسابك" : "سيتم جلب الاسم من حسابك"}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-semibold text-gray-700 block mb-1">
                    رقم الهاتف <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="tel"
                      value={formData.phoneNumber}
                      onChange={(e) => update("phoneNumber", e.target.value)}
                      placeholder="01xxxxxxxxx"
                      className="w-full border border-gray-200 rounded-xl pr-10 pl-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a7a8a]/20 focus:border-[#1a7a8a]"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-semibold text-gray-700 block mb-1">البريد الإلكتروني</label>
                  <div className="relative">
                    <Mail className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="email"
                      value={formData.email}
                      readOnly
                      className="w-full border border-gray-100 rounded-xl pr-10 pl-4 py-3 text-sm bg-gray-50 text-gray-500 cursor-not-allowed"
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-1">✅ تم جلب البريد الإلكتروني من حسابك</p>
                </div>

                <button
                  type="button"
                  onClick={handleNext}
                  className="w-full flex items-center justify-center gap-2 bg-[#001f24] hover:bg-[#03363d] text-white font-semibold py-3 rounded-xl transition-colors"
                >
                  التالي
                  <ChevronLeft className="h-4 w-4" />
                </button>
              </div>
            )}

            {/* ── STEP 2 ────────────────────────────────────── */}
            {currentStep === 2 && (
              <div className="space-y-5">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(1)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <ChevronRight className="h-4 w-4 text-gray-500" />
                  </button>
                  <h2 className="text-lg font-bold text-[#001f24]">
                    {formData.role === "student" && "بيانات الطالب"}
                    {formData.role === "teacher" && "بيانات المعلم"}
                    {formData.role === "parent" && "بيانات ولي الأمر"}
                    {formData.role === "admin" && "بيانات الأدمن"}
                  </h2>
                </div>

                {/* ── Admin fields ──────────────────────────── */}
                {formData.role === "admin" && (
                  <div className="space-y-4">
                    <div className="bg-[#e0f5f7] rounded-xl p-4 text-center">
                      <Shield className="h-12 w-12 text-[#1a7a8a] mx-auto mb-3" />
                      <p className="text-sm text-[#001f24] font-semibold">✅ تم اختيار دور الأدمن</p>
                      <p className="text-xs text-gray-500 mt-1">سيتم إنشاء حسابك كأدمن مع صلاحيات كاملة</p>
                      <div className="mt-3 text-xs text-amber-600 bg-amber-50 p-2 rounded-lg">
                        ⏳ سيتم تفعيل حسابك بعد موافقة الأدمن الرئيسي
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-semibold text-gray-700 block mb-1">العنوان (اختياري)</label>
                      <div className="relative">
                        <MapPin className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
                        <textarea
                          value={formData.address}
                          onChange={(e) => update("address", e.target.value)}
                          placeholder="العنوان الكامل (اختياري)"
                          rows={2}
                          className="w-full border border-gray-200 rounded-xl pr-10 pl-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#1a7a8a]/20 focus:border-[#1a7a8a]"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* ── Student fields ───────────────────────── */}
                {formData.role === "student" && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-semibold text-gray-700 block mb-1">
                          تاريخ الميلاد <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <input
                            type="date"
                            value={formData.birthDate}
                            onChange={(e) => update("birthDate", e.target.value)}
                            className="w-full border border-gray-200 rounded-xl pr-10 pl-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a7a8a]/20 focus:border-[#1a7a8a]"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-semibold text-gray-700 block mb-1">
                          الجنس <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={formData.gender}
                          onChange={(e) => update("gender", e.target.value)}
                          className="w-full border border-gray-200 rounded-xl px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a7a8a]/20 focus:border-[#1a7a8a] bg-white"
                        >
                          <option value="">اختر</option>
                          <option value="male">ذكر</option>
                          <option value="female">أنثى</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-semibold text-gray-700 block mb-1">
                        الصف الدراسي <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={formData.gradeId}
                        onChange={(e) => {
                          update("gradeId", e.target.value);
                          update("groupId", "");
                        }}
                        className="w-full border border-gray-200 rounded-xl px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a7a8a]/20 focus:border-[#1a7a8a] bg-white"
                      >
                        <option value="">اختر الصف</option>
                        {grades?.map((g) => (
                          <option key={g._id} value={g._id}>{g.name}</option>
                        ))}
                      </select>
                    </div>

                    {formData.gradeId && groups && groups.length > 0 && (
                      <div>
                        <label className="text-sm font-semibold text-gray-700 block mb-1">المجموعة</label>
                        <select
                          value={formData.groupId}
                          onChange={(e) => update("groupId", e.target.value)}
                          className="w-full border border-gray-200 rounded-xl px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a7a8a]/20 focus:border-[#1a7a8a] bg-white"
                        >
                          <option value="">اختر المجموعة (اختياري)</option>
                          {groups.map((g) => (
                            <option key={g._id} value={g._id}>{g.name}</option>
                          ))}
                        </select>
                      </div>
                    )}

                    <div>
                      <label className="text-sm font-semibold text-gray-700 block mb-1">العنوان</label>
                      <div className="relative">
                        <MapPin className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
                        <textarea
                          value={formData.address}
                          onChange={(e) => update("address", e.target.value)}
                          placeholder="العنوان الكامل (اختياري)"
                          rows={2}
                          className="w-full border border-gray-200 rounded-xl pr-10 pl-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#1a7a8a]/20 focus:border-[#1a7a8a]"
                        />
                      </div>
                    </div>
                  </>
                )}

                {/* ── Teacher fields ───────────────────────── */}
                {formData.role === "teacher" && (
                  <>
                    <div>
                      <label className="text-sm font-semibold text-gray-700 block mb-1">
                        التخصص <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.specialization}
                        onChange={(e) => update("specialization", e.target.value)}
                        placeholder="مثال: رياضيات، لغة عربية"
                        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a7a8a]/20 focus:border-[#1a7a8a]"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-gray-700 block mb-1">
                        المؤهل العلمي <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={formData.qualification}
                        onChange={(e) => update("qualification", e.target.value)}
                        className="w-full border border-gray-200 rounded-xl px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a7a8a]/20 focus:border-[#1a7a8a] bg-white"
                      >
                        <option value="">اختر المؤهل</option>
                        <option value="diploma">دبلوم</option>
                        <option value="bachelor">بكالوريوس</option>
                        <option value="master">ماجستير</option>
                        <option value="phd">دكتوراه</option>
                        <option value="diploma education teaching">دبلوم تربية وتعليم</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-gray-700 block mb-1">سنوات الخبرة</label>
                      <input
                        type="number"
                        min={0}
                        value={formData.experience}
                        onChange={(e) => update("experience", e.target.value)}
                        placeholder="عدد سنوات الخبرة"
                        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a7a8a]/20 focus:border-[#1a7a8a]"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-gray-700 block mb-1">العنوان</label>
                      <div className="relative">
                        <MapPin className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
                        <textarea
                          value={formData.address}
                          onChange={(e) => update("address", e.target.value)}
                          placeholder="العنوان الكامل (اختياري)"
                          rows={2}
                          className="w-full border border-gray-200 rounded-xl pr-10 pl-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#1a7a8a]/20 focus:border-[#1a7a8a]"
                        />
                      </div>
                    </div>
                  </>
                )}

                {/* ── Parent fields ────────────────────────── */}
                {formData.role === "parent" && (
                  <>
                    <div>
                      <label className="text-sm font-semibold text-gray-700 block mb-1">
                        صلة القرابة <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={formData.relationship}
                        onChange={(e) => update("relationship", e.target.value)}
                        className="w-full border border-gray-200 rounded-xl px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a7a8a]/20 focus:border-[#1a7a8a] bg-white"
                      >
                        <option value="">اختر صلة القرابة</option>
                        <option value="father">أب</option>
                        <option value="mother">أم</option>
                        <option value="guardian">وصي</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-gray-700 block mb-1">هاتف العمل</label>
                      <div className="relative">
                        <Briefcase className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                          type="tel"
                          value={formData.workPhone}
                          onChange={(e) => update("workPhone", e.target.value)}
                          placeholder="رقم هاتف العمل (اختياري)"
                          className="w-full border border-gray-200 rounded-xl pr-10 pl-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a7a8a]/20 focus:border-[#1a7a8a]"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-gray-700 block mb-1">المسمى الوظيفي</label>
                      <div className="relative">
                        <Building className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                          type="text"
                          value={formData.jobTitle}
                          onChange={(e) => update("jobTitle", e.target.value)}
                          placeholder="المسمى الوظيفي (اختياري)"
                          className="w-full border border-gray-200 rounded-xl pr-10 pl-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a7a8a]/20 focus:border-[#1a7a8a]"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-gray-700 block mb-1">الرقم القومي</label>
                      <input
                        type="text"
                        value={formData.nationalId}
                        onChange={(e) => update("nationalId", e.target.value)}
                        placeholder="الرقم القومي (اختياري)"
                        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a7a8a]/20 focus:border-[#1a7a8a]"
                      />
                    </div>
                  </>
                )}

                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="w-full flex items-center justify-center gap-2 bg-[#001f24] hover:bg-[#03363d] disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition-colors"
                >
                  {isSubmitting
                    ? <><Loader2 className="h-4 w-4 animate-spin" /> جاري التسجيل...</>
                    : <><Check className="h-4 w-4" /> إنشاء الحساب</>
                  }
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ✅ Child Registration Modal - for parents */}
      <ChildRegistrationModal
        isOpen={showChildModal}
        onClose={() => {
          setShowChildModal(false);
          // لو المستخدم أغلق المودال يدوياً بدون تسجيل طفل → pending-approval
          if (!showSubscriptionModal) {
            setTimeout(() => router.replace("/pending-approval"), 100);
          }
        }}
        parentId={currentUser?._id || ""}
        onSuccess={handleChildRegistered}
      />

      {/* ✅ Subscription modal - with high z-index */}
      {showSubscriptionModal && currentUser && subscriptionData && (
        <div className="relative z-9999">
          <SubscriptionModal
            isOpen={showSubscriptionModal}
            userId={currentUser._id}
            gradeId={subscriptionData.gradeId as Id<"grades">}
            childId={subscriptionData.role === "parent" ? subscriptionData.studentId as Id<"users"> : undefined}
            childName={subscriptionData.role === "parent" ? subscriptionData.childName : undefined}
            onClose={handleSubscriptionDone}
            onSuccess={handleSubscriptionDone}
          />
        </div>
      )}
    </>
  );
}