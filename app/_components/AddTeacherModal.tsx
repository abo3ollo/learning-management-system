// app/_components/AddTeacherModal.tsx
"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  X, 
  User, 
  Phone, 
  Mail, 
  Briefcase, 
  GraduationCap, 
  Calendar,
  MapPin,
  AlertCircle,
  DollarSign,
  BookOpen,
  Clock,
  ChevronDown
} from "lucide-react";

// ✅ تعريف نوع EmploymentType (أضف هذا قبل الـ interface)
type EmploymentType = "full_time" | "part_time" | "contract";

interface AddTeacherModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AddTeacherModal({ isOpen, onClose }: AddTeacherModalProps) {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    specialization: "",
    qualification: "",
    experience: "",
    salary: "",
    employmentType: "full_time" as EmploymentType, // ✅ الآن EmploymentType معرف
    address: "",
    subjects: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createTeacher = useMutation(api.user.teachers.createTeacher);

  if (!isOpen) return null;

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.fullName.trim()) {
      newErrors.fullName = "اسم المعلم مطلوب";
    }
    if (!formData.email.trim()) {
      newErrors.email = "البريد الإلكتروني مطلوب";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "بريد إلكتروني غير صحيح";
    }
    if (!formData.phone.trim()) {
      newErrors.phone = "رقم الهاتف مطلوب";
    }
    if (formData.salary && !/^\d+(\.\d{1,2})?$/.test(formData.salary)) {
      newErrors.salary = "الراتب يجب أن يكون رقماً صحيحاً";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    try {
      await createTeacher({
        name: formData.fullName,
        email: formData.email,
        phoneNumber: formData.phone,
        specialization: formData.specialization || undefined,
        qualification: formData.qualification || undefined,
        experience: formData.experience ? parseInt(formData.experience) : undefined,
        salary: formData.salary ? parseFloat(formData.salary) : undefined,
        employmentType: formData.employmentType,
        address: formData.address || undefined,
        subjects: formData.subjects ? formData.subjects.split(",").map(s => s.trim()) : undefined,
      });
      
      setFormData({
        fullName: "",
        email: "",
        phone: "",
        specialization: "",
        qualification: "",
        experience: "",
        salary: "",
        employmentType: "full_time",
        address: "",
        subjects: "",
      });
      onClose();
    } catch (error) {
      console.error("Error creating teacher:", error);
      setErrors({ submit: "حدث خطأ أثناء إضافة المعلم" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEmploymentTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData({ ...formData, employmentType: e.target.value as EmploymentType });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="sticky top-0 bg-white border-b border-[#c0c8c9] px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-[#0a2540]">إضافة معلم</h2>
            <p className="text-sm text-gray-500 mt-1">تسجيل معلم جديد في النظام</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* المعلومات الشخصية */}
          <div>
            <h3 className="text-lg font-semibold text-[#0a2540] mb-4 pb-2 border-b border-[#c0c8c9]">
              المعلومات الشخصية
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fullName" className="flex items-center gap-1">
                  اسم المعلم <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <User className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="fullName"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className={`pr-10 ${errors.fullName ? 'border-red-500' : ''}`}
                    placeholder="أدخل اسم المعلم كاملاً"
                  />
                </div>
                {errors.fullName && (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" /> {errors.fullName}
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
                    className={`pr-10 ${errors.email ? 'border-red-500' : ''}`}
                    placeholder="teacher@example.com"
                  />
                </div>
                {errors.email && (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" /> {errors.email}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="flex items-center gap-1">
                  رقم الهاتف <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Phone className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className={`pr-10 ${errors.phone ? 'border-red-500' : ''}`}
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
                <Label htmlFor="specialization">التخصص</Label>
                <div className="relative">
                  <Briefcase className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="specialization"
                    value={formData.specialization}
                    onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                    className="pr-10"
                    placeholder="مثال: رياضيات, علوم, لغة عربية"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* المعلومات المهنية */}
          <div>
            <h3 className="text-lg font-semibold text-[#0a2540] mb-4 pb-2 border-b border-[#c0c8c9]">
              المعلومات المهنية
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="qualification">المؤهل العلمي</Label>
                <div className="relative">
                  <GraduationCap className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="qualification"
                    value={formData.qualification}
                    onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
                    className="pr-10"
                    placeholder="مثال: بكالوريوس, ماجستير, دكتوراه"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="experience">سنوات الخبرة</Label>
                <div className="relative">
                  <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="experience"
                    type="number"
                    min="0"
                    value={formData.experience}
                    onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                    className="pr-10"
                    placeholder="عدد سنوات الخبرة"
                  />
                </div>
              </div>

              {/* حقل الراتب */}
              <div className="space-y-2">
                <Label htmlFor="salary" className="flex items-center gap-1">
                  الراتب الشهري (ريال)
                </Label>
                <div className="relative">
                  <DollarSign className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="salary"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.salary}
                    onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                    className={`pr-10 ${errors.salary ? 'border-red-500' : ''}`}
                    placeholder="مثال: 5000"
                  />
                </div>
                {errors.salary && (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" /> {errors.salary}
                  </p>
                )}
              </div>

              {/* حقل نوع المعلم */}
              <div className="space-y-2">
                <Label htmlFor="employmentType" className="flex items-center gap-1">
                  نوع المعلم
                </Label>
                <div className="relative">
                  <Clock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <select
                    id="employmentType"
                    value={formData.employmentType}
                    onChange={handleEmploymentTypeChange}
                    className="w-full px-3 py-2 pr-10 border border-[#c0c8c9] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a7a8a] bg-white appearance-none"
                  >
                    <option value="full_time">دوام كامل</option>
                    <option value="part_time">دوام جزئي</option>
                    <option value="contract">عقد مؤقت</option>
                  </select>
                  <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                </div>
                <p className="text-xs text-gray-400">سيتم تعيين دوام المعلم تلقائياً</p>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="subjects">المواد التي يدرسها</Label>
                <div className="relative">
                  <BookOpen className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="subjects"
                    value={formData.subjects}
                    onChange={(e) => setFormData({ ...formData, subjects: e.target.value })}
                    className="pr-10"
                    placeholder="مثال: رياضيات, فيزياء, كيمياء (افصل بينها بفاصلة)"
                  />
                </div>
                <p className="text-xs text-gray-400">افصل بين المواد بفاصلة</p>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="address">العنوان</Label>
                <div className="relative">
                  <MapPin className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
                  <textarea
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full px-3 py-2 pr-10 border border-[#c0c8c9] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a7a8a] resize-none"
                    rows={2}
                    placeholder="العنوان الكامل للمعلم"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Auto-generated Info */}
          <div className="bg-[#e0f5f7] rounded-xl p-4">
            <p className="text-sm text-[#0a2540]">
              <span className="font-medium">ملاحظة:</span> سيتم توليد رقم المعلم تلقائياً
            </p>
          </div>

          {/* Submit Error */}
          {errors.submit && (
            <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm">
              {errors.submit}
            </div>
          )}

          {/* Modal Footer */}
          <div className="flex justify-end gap-3 pt-4 border-t border-[#c0c8c9]">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              إلغاء
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="min-w-30 bg-[#0a2540] hover:bg-[#1a7a8a]"
            >
              {isSubmitting ? "جاري الإضافة..." : "إضافة معلم"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}