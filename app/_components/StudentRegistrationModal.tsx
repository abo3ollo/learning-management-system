// app/_components/StudentRegistrationModal.tsx

"use client";

import { useState, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import {
  X,
  User,
  Phone,
  Calendar,
  MapPin,
  Mail,
  AlertCircle,
  School,
  ChevronDown,
  Loader2,
} from "lucide-react";
import { SubscriptionModal } from "./SubscriptionModal";

interface StudentRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void; 
}

export function StudentRegistrationModal({ isOpen, onClose ,onSuccess}: StudentRegistrationModalProps) {
  const { user } = useUser();
  const router = useRouter();

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    birthDate: "",
    gender: "",
    address: "",
    gradeId: "",
    groupId: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // ✅ State for subscription modal
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [registeredStudentId, setRegisteredStudentId] = useState<string | null>(null);
  const [registeredGradeId, setRegisteredGradeId] = useState<string | null>(null);
  const [isRegistrationComplete, setIsRegistrationComplete] = useState(false);

  // ✅ جلب الصفوف النشطة
  const grades = useQuery(api.grades.grades.getActiveGrades, {});

  // ✅ جلب المجموعات حسب الصف المختار
  const groups = useQuery(
    api.groups.groups.getGroupsByGrade,
    formData.gradeId ? { gradeId: formData.gradeId as any, status: "active" } : "skip"
  );

  // ✅ تسجيل طالب
  const registerStudent = useMutation(api.user.students.registerStudent);

  // ✅ تعبئة البيانات من Clerk عند فتح المودال
  useEffect(() => {
    if (isOpen && user) {
      const primaryEmail = user.emailAddresses?.[0]?.emailAddress || "";
      setFormData((prev) => ({
        ...prev,
        fullName: user.fullName || user.username || "",
        email: primaryEmail,
      }));
    }
  }, [isOpen, user]);

  // ✅ عند اختيار الصف، نمسح المجموعة المختارة
  useEffect(() => {
    setFormData(prev => ({ ...prev, groupId: "" }));
  }, [formData.gradeId]);

  // ✅ Reset when modal closes
  useEffect(() => {
    if (!isOpen) {
      // ✅ إذا كان التسجيل مكتملاً، لا نغلق مودل الاشتراك
      if (!isRegistrationComplete) {
        setShowSubscriptionModal(false);
        setRegisteredStudentId(null);
        setRegisteredGradeId(null);
      }
    }
  }, [isOpen, isRegistrationComplete]);

  if (!isOpen) return null;

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = "اسم الطالب مطلوب";
    }
    if (!formData.phone.trim()) {
      newErrors.phone = "رقم الهاتف مطلوب";
    } else if (!/^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/.test(formData.phone)) {
      newErrors.phone = "رقم هاتف غير صحيح";
    }
    if (!formData.birthDate) {
      newErrors.birthDate = "تاريخ الميلاد مطلوب";
    }
    if (!formData.gender) {
      newErrors.gender = "يرجى اختيار الجنس";
    }
    if (!formData.gradeId) {
      newErrors.gradeId = "يرجى اختيار الصف";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const convertDateToTimestamp = (dateString: string): number => {
    return new Date(dateString).getTime();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const result = await registerStudent({
        name: formData.fullName,
        email: formData.email || user?.emailAddresses?.[0]?.emailAddress || undefined,
        phoneNumber: formData.phone,
        birthDate: convertDateToTimestamp(formData.birthDate),
        gender: formData.gender as "male" | "female",
        address: formData.address || undefined,
        gradeId: formData.gradeId as any,
        groupId: formData.groupId ? (formData.groupId as any) : undefined,
      });

      // ✅ Store student data for subscription modal
      setRegisteredStudentId(result.userId);
      setRegisteredGradeId(formData.gradeId);
      setIsRegistrationComplete(true);
      
      // ✅ Close registration modal
      onClose();
      
      // ✅ Open subscription modal after a short delay
      setTimeout(() => {
        setShowSubscriptionModal(true);
        setIsSubmitting(false);
      }, 500);
      
    } catch (error) {
      console.error("Error registering student:", error);
      setErrors({ submit: "حدث خطأ أثناء التسجيل. يرجى المحاولة مرة أخرى." });
      setIsSubmitting(false);
    }
  };

  // ✅ Handle subscription success
  const handleSubscriptionSuccess = () => {
    setShowSubscriptionModal(false);
    router.push("/pending-approval");
  };

  // ✅ Handle subscription close
  const handleSubscriptionClose = () => {
    setShowSubscriptionModal(false);
    router.push("/pending-approval");
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          {/* Modal Header */}
          <div className="sticky top-0 bg-white border-b border-[#c0c8c9] px-6 py-4 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-[#001f24]">تسجيل طالب جديد</h2>
              <p className="text-sm text-gray-500 mt-1">أدخل بياناتك للتسجيل في المنصة</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* المعلومات الشخصية */}
            <div>
              <h3 className="text-lg font-semibold text-[#001f24] mb-4 pb-2 border-b border-[#c0c8c9] flex items-center gap-2">
                <User className="h-5 w-5 text-[#1a7a8a]" />
                المعلومات الشخصية
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName" className="flex items-center gap-1 text-sm font-medium text-gray-700">
                    اسم الطالب <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <User className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="fullName"
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      className={`pr-10 ${errors.fullName ? 'border-red-500' : 'border-[#c0c8c9]'} focus:ring-2 focus:ring-[#1a7a8a]`}
                      placeholder="أدخل اسم الطالب كاملاً"
                    />
                  </div>
                  {errors.fullName && (
                    <p className="text-xs text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" /> {errors.fullName}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="flex items-center gap-1 text-sm font-medium text-gray-700">
                    رقم الهاتف <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Phone className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className={`pr-10 ${errors.phone ? 'border-red-500' : 'border-[#c0c8c9]'} focus:ring-2 focus:ring-[#1a7a8a]`}
                      placeholder="05XXXXXXXX"
                    />
                  </div>
                  {errors.phone && (
                    <p className="text-xs text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" /> {errors.phone}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="birthDate" className="flex items-center gap-1 text-sm font-medium text-gray-700">
                    تاريخ الميلاد <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="birthDate"
                      type="date"
                      value={formData.birthDate}
                      onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                      className={`pr-10 ${errors.birthDate ? 'border-red-500' : 'border-[#c0c8c9]'} focus:ring-2 focus:ring-[#1a7a8a]`}
                    />
                  </div>
                  {errors.birthDate && (
                    <p className="text-xs text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" /> {errors.birthDate}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gender" className="flex items-center gap-1 text-sm font-medium text-gray-700">
                    الجنس <span className="text-red-500">*</span>
                  </Label>
                  <select
                    id="gender"
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a7a8a] bg-white ${
                      errors.gender ? 'border-red-500' : 'border-[#c0c8c9]'
                    }`}
                  >
                    <option value="">-- اختر --</option>
                    <option value="male">ذكر</option>
                    <option value="female">أنثى</option>
                  </select>
                  {errors.gender && (
                    <p className="text-xs text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" /> {errors.gender}
                    </p>
                  )}
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                    البريد الإلكتروني <span className="text-gray-400 text-xs">(اختياري)</span>
                  </Label>
                  <div className="relative">
                    <Mail className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="pr-10 border-[#c0c8c9] focus:ring-2 focus:ring-[#1a7a8a]"
                      placeholder="student@example.com"
                    />
                  </div>
                  <p className="text-xs text-gray-400">سيتم استخدام البريد الإلكتروني المسجل في حسابك إذا ترك فارغاً</p>
                </div>
              </div>
            </div>

            {/* الفصل الدراسي */}
            <div>
              <h3 className="text-lg font-semibold text-[#001f24] mb-4 pb-2 border-b border-[#c0c8c9] flex items-center gap-2">
                <School className="h-5 w-5 text-[#1a7a8a]" />
                الفصل الدراسي
              </h3>
              <div className="space-y-4">
                {/* اختيار الصف */}
                <div className="space-y-2">
                  <Label htmlFor="gradeId" className="text-sm font-medium text-gray-700">
                    الصف <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <select
                      id="gradeId"
                      value={formData.gradeId}
                      onChange={(e) => setFormData({ ...formData, gradeId: e.target.value })}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a7a8a] bg-white appearance-none ${
                        errors.gradeId ? 'border-red-500' : 'border-[#c0c8c9]'
                      }`}
                    >
                      <option value="">-- اختر الصف --</option>
                      {grades?.map((grade: any) => (
                        <option key={grade._id} value={grade._id}>
                          {grade.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                  </div>
                  {errors.gradeId && (
                    <p className="text-xs text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" /> {errors.gradeId}
                    </p>
                  )}
                  {grades?.length === 0 && (
                    <p className="text-xs text-amber-600">⚠️ لا توجد صفوف نشطة حالياً. يرجى التواصل مع الإدارة.</p>
                  )}
                </div>

                {/* اختيار المجموعة - يظهر فقط عند اختيار الصف */}
                {formData.gradeId && (
                  <div className="space-y-2">
                    <Label htmlFor="groupId" className="text-sm font-medium text-gray-700">
                      المجموعة <span className="text-gray-400 text-xs">(اختياري)</span>
                    </Label>
                    <div className="relative">
                      <select
                        id="groupId"
                        value={formData.groupId}
                        onChange={(e) => setFormData({ ...formData, groupId: e.target.value })}
                        className="w-full px-3 py-2 border border-[#c0c8c9] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a7a8a] bg-white appearance-none"
                      >
                        <option value="">-- بدون مجموعة --</option>
                        {groups?.map((group: any) => (
                          <option key={group._id} value={group._id}>
                            {group.name} - {group.subject}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                    </div>
                    {groups?.length === 0 && (
                      <p className="text-xs text-gray-400">لا توجد مجموعات متاحة في هذا الصف</p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* العنوان */}
            <div>
              <h3 className="text-lg font-semibold text-[#001f24] mb-4 pb-2 border-b border-[#c0c8c9] flex items-center gap-2">
                <MapPin className="h-5 w-5 text-[#1a7a8a]" />
                العنوان
              </h3>
              <div className="space-y-2">
                <Label htmlFor="address" className="text-sm font-medium text-gray-700">العنوان الكامل</Label>
                <div className="relative">
                  <MapPin className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
                  <textarea
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full px-3 py-2 pr-10 border border-[#c0c8c9] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a7a8a] resize-none"
                    rows={3}
                    placeholder="العنوان الكامل للطالب"
                  />
                </div>
              </div>
            </div>

            {/* Info Note */}
            <div className="bg-[#e0f5f7] rounded-xl p-4">
              <p className="text-sm text-[#001f24]">
                <span className="font-medium">📌 ملاحظة:</span> سيتم توليد رقم طالب تلقائياً، وسيتم مراجعة طلبك من قبل الإدارة قبل التفعيل.
              </p>
            </div>

            {errors.submit && (
              <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                {errors.submit}
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t border-[#c0c8c9]">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isSubmitting}
                className="border-[#c0c8c9] hover:bg-gray-50"
              >
                إلغاء
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="min-w-30 bg-[#001f24] hover:bg-[#03363d] text-white"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin ml-2" />
                    جاري التسجيل...
                  </>
                ) : (
                  "تسجيل"
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>

      {/* ✅ Subscription Modal */}
      {showSubscriptionModal && registeredStudentId && registeredGradeId && (
        <SubscriptionModal
          isOpen={showSubscriptionModal}
          onClose={handleSubscriptionClose}
          studentId={registeredStudentId}
          gradeId={registeredGradeId}
          onSuccess={handleSubscriptionSuccess}
        />
      )}
    </>
  );
}