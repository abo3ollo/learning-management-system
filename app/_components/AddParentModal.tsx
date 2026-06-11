// app/_components/AddParentModal.tsx
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
  Building2,
  MapPin,
  AlertCircle,
  IdCard
} from "lucide-react";

interface AddParentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AddParentModal({ isOpen, onClose }: AddParentModalProps) {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    workPhone: "",
    workAddress: "",
    jobTitle: "",
    nationalId: "",
    address: "",
    relationship: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createParent = useMutation(api.user.parents.createParent);

  if (!isOpen) return null;

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.fullName.trim()) {
      newErrors.fullName = "اسم ولي الأمر مطلوب";
    }
    if (!formData.email.trim()) {
      newErrors.email = "البريد الإلكتروني مطلوب";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "بريد إلكتروني غير صحيح";
    }
    if (!formData.phone.trim()) {
      newErrors.phone = "رقم الهاتف مطلوب";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    try {
      await createParent({
        name: formData.fullName,
        email: formData.email,
        phoneNumber: formData.phone,
        workPhone: formData.workPhone || undefined,
        workAddress: formData.workAddress || undefined,
        jobTitle: formData.jobTitle || undefined,
        nationalId: formData.nationalId || undefined,
        address: formData.address || undefined,
        relationship: formData.relationship || undefined,
      });
      
      setFormData({
        fullName: "",
        email: "",
        phone: "",
        workPhone: "",
        workAddress: "",
        jobTitle: "",
        nationalId: "",
        address: "",
        relationship: "",
      });
      onClose();
    } catch (error) {
      console.error("Error creating parent:", error);
      setErrors({ submit: "حدث خطأ أثناء إضافة ولي الأمر" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="sticky top-0 bg-white border-b border-[#c0c8c9] px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-[#0a2540]">إضافة ولي أمر</h2>
            <p className="text-sm text-gray-500 mt-1">تسجيل ولي أمر جديد في النظام</p>
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
          {/* البيانات الشخصية */}
          <div>
            <h3 className="text-lg font-semibold text-[#0a2540] mb-4 pb-2 border-b border-[#c0c8c9]">
              البيانات الشخصية
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fullName" className="flex items-center gap-1">
                  اسم ولي الأمر <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <User className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="fullName"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className={`pr-10 ${errors.fullName ? 'border-red-500' : ''}`}
                    placeholder="أدخل اسم ولي الأمر كاملاً"
                  />
                </div>
                {errors.fullName && (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" /> {errors.fullName}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="nationalId">رقم الهوية الوطنية</Label>
                <div className="relative">
                  <IdCard className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="nationalId"
                    value={formData.nationalId}
                    onChange={(e) => setFormData({ ...formData, nationalId: e.target.value })}
                    className="pr-10"
                    placeholder="أدخل رقم الهوية"
                  />
                </div>
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
                    placeholder="parent@example.com"
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
            </div>
          </div>

          {/* بيانات العمل */}
          <div>
            <h3 className="text-lg font-semibold text-[#0a2540] mb-4 pb-2 border-b border-[#c0c8c9]">
              بيانات العمل
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="jobTitle">المسمى الوظيفي</Label>
                <div className="relative">
                  <Briefcase className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="jobTitle"
                    value={formData.jobTitle}
                    onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
                    className="pr-10"
                    placeholder="مثال: مهندس, طبيب, مدير"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="workPhone">هاتف العمل</Label>
                <div className="relative">
                  <Phone className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="workPhone"
                    type="tel"
                    value={formData.workPhone}
                    onChange={(e) => setFormData({ ...formData, workPhone: e.target.value })}
                    className="pr-10"
                    placeholder="هاتف العمل"
                  />
                </div>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="workAddress">عنوان العمل</Label>
                <div className="relative">
                  <Building2 className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
                  <textarea
                    id="workAddress"
                    value={formData.workAddress}
                    onChange={(e) => setFormData({ ...formData, workAddress: e.target.value })}
                    className="w-full px-3 py-2 pr-10 border border-[#c0c8c9] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a7a8a] resize-none"
                    rows={2}
                    placeholder="عنوان جهة العمل"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* العنوان */}
          <div>
            <h3 className="text-lg font-semibold text-[#0a2540] mb-4 pb-2 border-b border-[#c0c8c9]">
              العنوان
            </h3>
            <div className="space-y-2">
              <Label htmlFor="address">العنوان الكامل</Label>
              <div className="relative">
                <MapPin className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
                <textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3 py-2 pr-10 border border-[#c0c8c9] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a7a8a] resize-none"
                  rows={2}
                  placeholder="العنوان الكامل لولي الأمر"
                />
              </div>
            </div>
          </div>

          {/* Auto-generated Info */}
          <div className="bg-[#e0f5f7] rounded-xl p-4">
            <p className="text-sm text-[#0a2540]">
              <span className="font-medium">ملاحظة:</span> سيتم توليد رمز ولي الأمر تلقائياً
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
              {isSubmitting ? "جاري الإضافة..." : "إضافة ولي أمر"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}