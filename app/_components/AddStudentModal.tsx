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
  Calendar, 
  MapPin, 
  Mail,
  AlertCircle
} from "lucide-react";

interface AddStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AddStudentModal({ isOpen, onClose }: AddStudentModalProps) {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    birthDate: "",
    gender: "",
    address: "",
    guardianName: "",
    guardianPhone: "",
    guardianEmail: "",
    guardianRelationship: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createStudent = useMutation(api.user.students.createStudent);

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

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Convert date string to timestamp (number)
  const convertDateToTimestamp = (dateString: string): number => {
    return new Date(dateString).getTime();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    try {
      await createStudent({
        name: formData.fullName,
        email: formData.email || undefined,
        phoneNumber: formData.phone, // Changed from 'phone' to 'phoneNumber'
        birthDate: convertDateToTimestamp(formData.birthDate), // Convert string to number
        gender: formData.gender as "male" | "female", // Type assertion
        address: formData.address || undefined,
        guardianName: formData.guardianName || undefined,
        guardianPhone: formData.guardianPhone || undefined,
        guardianEmail: formData.guardianEmail || undefined,
        guardianRelationship: formData.guardianRelationship || undefined,
      });
      
      // Reset form and close
      setFormData({
        fullName: "",
        email: "",
        phone: "",
        birthDate: "",
        gender: "",
        address: "",
        guardianName: "",
        guardianPhone: "",
        guardianEmail: "",
        guardianRelationship: "",
      });
      onClose();
    } catch (error) {
      console.error("Error creating student:", error);
      setErrors({ submit: "حدث خطأ أثناء إضافة الطالب" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">إضافة طالب</h2>
            <p className="text-sm text-gray-500 mt-1">تسجيل طالب جديد في النظام</p>
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
          {/* Section: Personal Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-100">
              المعلومات الشخصية
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Full Name */}
              <div className="space-y-2">
                <Label htmlFor="fullName" className="flex items-center gap-1">
                  اسم الطالب <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <User className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="fullName"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className={`pr-10 ${errors.fullName ? 'border-red-500' : ''}`}
                    placeholder="أدخل اسم الطالب كاملاً"
                  />
                </div>
                {errors.fullName && (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" /> {errors.fullName}
                  </p>
                )}
              </div>

              {/* Phone */}
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

              {/* Birth Date */}
              <div className="space-y-2">
                <Label htmlFor="birthDate" className="flex items-center gap-1">
                  تاريخ الميلاد <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="birthDate"
                    type="date"
                    value={formData.birthDate}
                    onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                    className={`pr-10 ${errors.birthDate ? 'border-red-500' : ''}`}
                  />
                </div>
                {errors.birthDate && (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" /> {errors.birthDate}
                  </p>
                )}
              </div>

              {/* Gender */}
              <div className="space-y-2">
                <Label htmlFor="gender" className="flex items-center gap-1">
                  الجنس <span className="text-red-500">*</span>
                </Label>
                <select
                  id="gender"
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                    errors.gender ? 'border-red-500' : 'border-gray-200'
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

              {/* Email */}
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="email">
                  البريد الإلكتروني <span className="text-gray-400 text-xs">(اختياري)</span>
                </Label>
                <div className="relative">
                  <Mail className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="pr-10"
                    placeholder="student@example.com"
                  />
                </div>
                <p className="text-xs text-gray-400">سيتم التوليد تلقائياً إذا ترك فارغاً</p>
              </div>
            </div>
          </div>

          {/* Section: Guardian Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-100">
              معلومات ولي الأمر
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Guardian Name */}
              <div className="space-y-2">
                <Label htmlFor="guardianName">اسم ولي الأمر</Label>
                <Input
                  id="guardianName"
                  value={formData.guardianName}
                  onChange={(e) => setFormData({ ...formData, guardianName: e.target.value })}
                  placeholder="أدخل اسم ولي الأمر"
                />
              </div>

              {/* Guardian Phone */}
              <div className="space-y-2">
                <Label htmlFor="guardianPhone">هاتف ولي الأمر</Label>
                <Input
                  id="guardianPhone"
                  type="tel"
                  value={formData.guardianPhone}
                  onChange={(e) => setFormData({ ...formData, guardianPhone: e.target.value })}
                  placeholder="05XXXXXXXX"
                />
              </div>

              {/* Guardian Email */}
              <div className="space-y-2">
                <Label htmlFor="guardianEmail">بريد ولي الأمر</Label>
                <Input
                  id="guardianEmail"
                  type="email"
                  value={formData.guardianEmail}
                  onChange={(e) => setFormData({ ...formData, guardianEmail: e.target.value })}
                  placeholder="parent@example.com"
                />
              </div>

              {/* Guardian Relationship */}
              <div className="space-y-2">
                <Label htmlFor="guardianRelationship">صلة القرابة</Label>
                <select
                  id="guardianRelationship"
                  value={formData.guardianRelationship}
                  onChange={(e) => setFormData({ ...formData, guardianRelationship: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">-- اختر --</option>
                  <option value="father">أب</option>
                  <option value="mother">أم</option>
                  <option value="brother">أخ</option>
                  <option value="sister">أخت</option>
                  <option value="grandfather">جد</option>
                  <option value="grandmother">جدة</option>
                  <option value="uncle">عم/خال</option>
                  <option value="aunt">عمة/خالة</option>
                  <option value="guardian">وصي</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section: Address */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-100">
              العنوان
            </h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="address">العنوان الكامل</Label>
                <div className="relative">
                  <MapPin className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
                  <textarea
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full px-3 py-2 pr-10 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                    rows={3}
                    placeholder="العنوان الكامل للطالب"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Auto-generated Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-600">
              <span className="font-medium">ملاحظة:</span> سيتم توليد رقم طالب تلقائياً
            </p>
          </div>

          {/* Submit Error */}
          {errors.submit && (
            <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm">
              {errors.submit}
            </div>
          )}

          {/* Modal Footer */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
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
              className="min-w-25"
            >
              {isSubmitting ? "جاري الإضافة..." : "إضافة طالب"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}