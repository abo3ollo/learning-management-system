// app/_components/TeacherRegistrationModal.tsx

"use client";

import { useState, useEffect } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  User,
  Mail,
  Phone,
  Briefcase,
  GraduationCap,
  Clock,
  MapPin,
  Loader2,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle,
  ArrowLeft,
} from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface TeacherRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void; 
}

export function TeacherRegistrationModal({ isOpen, onClose, onSuccess }: TeacherRegistrationModalProps) {
  const router = useRouter();
  const { user } = useUser();
  const createUser = useMutation(api.user.auth.createUser);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phoneNumber: "",
    specialization: "",
    qualification: "",
    experience: 0,
    address: "",
    subjects: [] as string[],
  });
  const [newSubject, setNewSubject] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [step, setStep] = useState(1);
  const [showSuccess, setShowSuccess] = useState(false);

  // تعبئة البيانات من Clerk
  useEffect(() => {
    if (user && isOpen) {
      const primaryEmail = user.emailAddresses?.[0]?.emailAddress || "";
      setFormData((prev) => ({
        ...prev,
        name: user.fullName || user.username || "",
        email: primaryEmail,
      }));
    }
  }, [user, isOpen]);

  // reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setFormData({
        name: "",
        email: "",
        phoneNumber: "",
        specialization: "",
        qualification: "",
        experience: 0,
        address: "",
        subjects: [],
      });
      setNewSubject("");
      setErrors({});
      setStep(1);
      setShowSuccess(false);
    }
  }, [isOpen]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) {
      newErrors.name = "اسم المعلم مطلوب";
    }
    if (!formData.email.trim()) {
      newErrors.email = "البريد الإلكتروني مطلوب";
    }
    if (!formData.specialization.trim()) {
      newErrors.specialization = "التخصص مطلوب";
    }
    if (!formData.qualification.trim()) {
      newErrors.qualification = "المؤهل العلمي مطلوب";
    }
    if (formData.experience < 0) {
      newErrors.experience = "سنوات الخبرة يجب أن تكون 0 أو أكثر";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      // ✅ تمرير جميع حقول المعلم إلى createUser (بدون status)
      await createUser({
        clerkId: user?.id || "",
        name: formData.name,
        email: formData.email,
        role: "teacher",
        phoneNumber: formData.phoneNumber || undefined,
        specialization: formData.specialization,
        qualification: formData.qualification,
        experience: formData.experience,
        address: formData.address || undefined,
        subjects: formData.subjects,
      });

      setShowSuccess(true);
      toast.success("✅ تم تسجيل بيانات المعلم بنجاح");
      
      // انتظر 2 ثانية ثم اذهب إلى pending-approval
      setTimeout(() => {
        onClose();
        router.push("/pending-approval");
      }, 2000);
    } catch (error: any) {
      toast.error(error.message || "حدث خطأ أثناء تسجيل المعلم");
    } finally {
      setIsSubmitting(false);
    }
  };

  const addSubject = () => {
    if (newSubject.trim() && !formData.subjects.includes(newSubject.trim())) {
      setFormData({
        ...formData,
        subjects: [...formData.subjects, newSubject.trim()],
      });
      setNewSubject("");
    }
  };

  const removeSubject = (subject: string) => {
    setFormData({
      ...formData,
      subjects: formData.subjects.filter((s) => s !== subject),
    });
  };

  if (!isOpen) return null;

  // صفحة النجاح
  if (showSuccess) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md text-center" dir="rtl">
          <div className="py-8">
            <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-10 w-10 text-green-500" />
            </div>
            <h3 className="text-2xl font-bold text-[#001f24] mb-2">
              تم التسجيل بنجاح! 🎉
            </h3>
            <p className="text-gray-500">
              سيتم مراجعة طلبك من قبل الإدارة وسيتم إعلامك عند الموافقة.
            </p>
            <Button
              className="mt-6 bg-[#001f24] hover:bg-[#03363d] text-white"
              onClick={() => {
                onClose();
                router.push("/pending-approval");
              }}
            >
              الذهاب إلى صفحة الانتظار
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-[#001f24] flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-[#1a7a8a]" />
            تسجيل بيانات المعلم
          </DialogTitle>
          <p className="text-sm text-gray-500">
            أكمل بياناتك لتسجيل حسابك كمعلم في المنصة
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          {/* خطوات التقدم */}
          <div className="flex items-center gap-2 mb-6">
            <div className={`flex-1 h-1 rounded-full ${step >= 1 ? 'bg-[#1a7a8a]' : 'bg-gray-200'}`} />
            <div className={`flex-1 h-1 rounded-full ${step >= 2 ? 'bg-[#1a7a8a]' : 'bg-gray-200'}`} />
          </div>

          {/* Step 1: المعلومات الشخصية */}
          {step === 1 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-4 border-b pb-2">
                المعلومات الشخصية
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="flex items-center gap-1">
                    اسم المعلم <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <User className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className={`pr-10 ${errors.name ? "border-red-500" : ""}`}
                      placeholder="أدخل اسم المعلم"
                    />
                  </div>
                  {errors.name && (
                    <p className="text-xs text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" /> {errors.name}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="flex items-center gap-1">
                    البريد الإلكتروني <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Mail className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className={`pr-10 ${errors.email ? "border-red-500" : ""}`}
                      placeholder="teacher@example.com"
                      disabled
                    />
                  </div>
                  {errors.email && (
                    <p className="text-xs text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" /> {errors.email}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">رقم الهاتف</Label>
                  <div className="relative">
                    <Phone className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="phone"
                      value={formData.phoneNumber}
                      onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                      className="pr-10"
                      placeholder="05XXXXXXXX"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="specialization" className="flex items-center gap-1">
                    التخصص <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Briefcase className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="specialization"
                      value={formData.specialization}
                      onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                      className={`pr-10 ${errors.specialization ? "border-red-500" : ""}`}
                      placeholder="مثال: رياضيات، فيزياء"
                    />
                  </div>
                  {errors.specialization && (
                    <p className="text-xs text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" /> {errors.specialization}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="qualification" className="flex items-center gap-1">
                    المؤهل العلمي <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <GraduationCap className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="qualification"
                      value={formData.qualification}
                      onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
                      className={`pr-10 ${errors.qualification ? "border-red-500" : ""}`}
                      placeholder="مثال: بكالوريوس، ماجستير"
                    />
                  </div>
                  {errors.qualification && (
                    <p className="text-xs text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" /> {errors.qualification}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="experience">سنوات الخبرة</Label>
                  <div className="relative">
                    <Clock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="experience"
                      type="number"
                      min="0"
                      value={formData.experience}
                      onChange={(e) => setFormData({ ...formData, experience: parseInt(e.target.value) || 0 })}
                      className={`pr-10 ${errors.experience ? "border-red-500" : ""}`}
                      placeholder="0"
                    />
                  </div>
                  {errors.experience && (
                    <p className="text-xs text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" /> {errors.experience}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex justify-end mt-6">
                <Button
                  type="button"
                  onClick={() => setStep(2)}
                  className="bg-[#1a7a8a] hover:bg-[#15707e] text-white"
                >
                  التالي
                  <ArrowLeft className="h-4 w-4 mr-2" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: المواد والعنوان */}
          {step === 2 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-4 border-b pb-2">
                المواد الدراسية والعنوان
              </h3>

              <div className="space-y-4">
                {/* المواد */}
                <div>
                  <Label className="mb-2 block">المواد الدراسية</Label>
                  <div className="flex gap-2 mb-3">
                    <Input
                      value={newSubject}
                      onChange={(e) => setNewSubject(e.target.value)}
                      placeholder="أضف مادة جديدة..."
                      className="flex-1"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addSubject();
                        }
                      }}
                    />
                    <Button type="button" variant="outline" onClick={addSubject} className="shrink-0">
                      <Plus className="h-4 w-4" />
                      إضافة
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.subjects.map((subject) => (
                      <span
                        key={subject}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-[#e0f5f7] text-[#1a7a8a] rounded-full text-sm"
                      >
                        {subject}
                        <button
                          type="button"
                          onClick={() => removeSubject(subject)}
                          className="hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                    {formData.subjects.length === 0 && (
                      <p className="text-sm text-gray-400">لا توجد مواد مضافة</p>
                    )}
                  </div>
                </div>

                {/* العنوان */}
                <div className="space-y-2">
                  <Label htmlFor="address">العنوان</Label>
                  <div className="relative">
                    <MapPin className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
                    <Textarea
                      id="address"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="pr-10 resize-none"
                      rows={2}
                      placeholder="العنوان الكامل للمعلم"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-between mt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(1)}
                >
                  السابق
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-[#001f24] hover:bg-[#03363d] text-white gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      جاري التسجيل...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4" />
                      تسجيل المعلم
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
}