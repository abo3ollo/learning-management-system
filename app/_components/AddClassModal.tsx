// app/_components/AddClassModal.tsx
"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  X, 
  BookOpen, 
  Users, 
  Calendar, 
  MapPin, 
  AlertCircle,
  ChevronDown,
  GraduationCap
} from "lucide-react";

interface AddClassModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AddClassModal({ isOpen, onClose }: AddClassModalProps) {
  const [formData, setFormData] = useState({
    classNameEn: "",
    classNameAr: "",
    grade: "",
    gradeLevel: "",
    section: "",
    supervisorId: "",
    academicYear: "2025-2026",
    maxStudents: "30",
    location: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // جلب قائمة المعلمين للمشرفين
  const teachers = useQuery(api.user.teachers.getTeachers, {}); // ✅ إضافة {} كمعامل ثانٍ

  const createClass = useMutation(api.classes.classes.createClass);

  if (!isOpen) return null;

  const gradeOptions = [
    { value: "الصف الأول الابتدائي", level: 1 },
    { value: "الصف الثاني الابتدائي", level: 2 },
    { value: "الصف الثالث الابتدائي", level: 3 },
    { value: "الصف الرابع الابتدائي", level: 4 },
    { value: "الصف الخامس الابتدائي", level: 5 },
    { value: "الصف السادس الابتدائي", level: 6 },
    { value: "الصف الأول الاعدادي", level: 7 },
    { value: "الصف الثاني الاعدادي", level: 8 },
    { value: "الصف الثالث الاعدادي", level: 9 },
    { value: "الصف الأول الثانوي", level: 10 },
    { value: "الصف الثاني الثانوي", level: 11 },
    { value: "الصف الثالث الثانوي", level: 12 },
  ];

  const academicYears = [ "2025-2026" , "2026-2027", "2027-2028", "2028-2029" ];

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.classNameAr.trim()) {
      newErrors.classNameAr = "اسم الفصل بالعربية مطلوب";
    }
    if (!formData.classNameEn.trim()) {
      newErrors.classNameEn = "اسم الفصل بالإنجليزية مطلوب";
    }
    if (!formData.grade) {
      newErrors.grade = "الصف مطلوب";
    }
    if (!formData.section.trim()) {
      newErrors.section = "الشعبة مطلوبة";
    }
    if (!formData.academicYear) {
      newErrors.academicYear = "العام الدراسي مطلوب";
    }
    if (!formData.maxStudents || parseInt(formData.maxStudents) <= 0) {
      newErrors.maxStudents = "الحد الأقصى للطلاب مطلوب";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    try {
      const selectedGrade = gradeOptions.find(g => g.value === formData.grade);
      
      await createClass({
        classNameEn: formData.classNameEn,
        classNameAr: formData.classNameAr,
        grade: formData.grade,
        gradeLevel: selectedGrade?.level || 1,
        section: formData.section,
        // ✅ تأكد من أن supervisorId هو من النوع الصحيح أو undefined
        supervisorId: formData.supervisorId ? formData.supervisorId as any : undefined,
        academicYear: formData.academicYear,
        maxStudents: parseInt(formData.maxStudents),
        location: formData.location || undefined,
      });
      
      setFormData({
        classNameEn: "",
        classNameAr: "",
        grade: "",
        gradeLevel: "",
        section: "",
        supervisorId: "",
        academicYear: "2025-2026",
        maxStudents: "30",
        location: "",
      });
      onClose();
    } catch (error) {
      console.error("Error creating class:", error);
      setErrors({ submit: "حدث خطأ أثناء إضافة الفصل" });
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
            <h2 className="text-xl font-bold text-[#0a2540]">إنشاء فصل</h2>
            <p className="text-sm text-gray-500 mt-1">إضافة فصل دراسي جديد للمنصة</p>
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
          {/* معلومات الفصل */}
          <div>
            <h3 className="text-lg font-semibold text-[#0a2540] mb-4 pb-2 border-b border-[#c0c8c9]">
              معلومات الفصل
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="classNameEn" className="flex items-center gap-1">
                  الاسم (إنجليزي) <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <BookOpen className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="classNameEn"
                    value={formData.classNameEn}
                    onChange={(e) => setFormData({ ...formData, classNameEn: e.target.value })}
                    className={`pr-10 ${errors.classNameEn ? 'border-red-500' : ''}`}
                    placeholder="مثال: Grade 5 - Section A"
                  />
                </div>
                {errors.classNameEn && (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" /> {errors.classNameEn}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="classNameAr" className="flex items-center gap-1">
                  الاسم (عربي) <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <BookOpen className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="classNameAr"
                    value={formData.classNameAr}
                    onChange={(e) => setFormData({ ...formData, classNameAr: e.target.value })}
                    className={`pr-10 ${errors.classNameAr ? 'border-red-500' : ''}`}
                    placeholder="مثال: الصف الخامس - شعبة أ"
                  />
                </div>
                {errors.classNameAr && (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" /> {errors.classNameAr}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="grade" className="flex items-center gap-1">
                  الصف <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <GraduationCap className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <select
                    id="grade"
                    value={formData.grade}
                    onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                    className={`w-full px-3 py-2 pr-10 border ${errors.grade ? 'border-red-500' : 'border-[#c0c8c9]'} rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a7a8a] bg-white appearance-none`}
                  >
                    <option value="">-- اختر --</option>
                    {gradeOptions.map((option) => (
                      <option key={option.value} value={option.value}>{option.value}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                </div>
                {errors.grade && (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" /> {errors.grade}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="section" className="flex items-center gap-1">
                  الشعبة <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="section"
                    value={formData.section}
                    onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                    className={`pr-10 ${errors.section ? 'border-red-500' : ''}`}
                    placeholder="مثال: أ, ب, ج أو A, B, C"
                  />
                </div>
                {errors.section && (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" /> {errors.section}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="supervisorId">مشرف الفصل</Label>
                <div className="relative">
                  <GraduationCap className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <select
                    id="supervisorId"
                    value={formData.supervisorId}
                    onChange={(e) => setFormData({ ...formData, supervisorId: e.target.value })}
                    className="w-full px-3 py-2 pr-10 border border-[#c0c8c9] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a7a8a] bg-white appearance-none"
                  >
                    <option value="">-- اختر --</option>
                    {teachers?.map((teacher: any) => (
                      <option key={teacher._id} value={teacher._id}>{teacher.name}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="academicYear" className="flex items-center gap-1">
                  العام الدراسي <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <select
                    id="academicYear"
                    value={formData.academicYear}
                    onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
                    className={`w-full px-3 py-2 pr-10 border ${errors.academicYear ? 'border-red-500' : 'border-[#c0c8c9]'} rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a7a8a] bg-white appearance-none`}
                  >
                    {academicYears.map((year) => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                </div>
                {errors.academicYear && (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" /> {errors.academicYear}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxStudents" className="flex items-center gap-1">
                  الحد الأقصى للطلاب <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Users className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="maxStudents"
                    type="number"
                    min="1"
                    max="50"
                    value={formData.maxStudents}
                    onChange={(e) => setFormData({ ...formData, maxStudents: e.target.value })}
                    className={`pr-10 ${errors.maxStudents ? 'border-red-500' : ''}`}
                    placeholder="مثال: 30"
                  />
                </div>
                {errors.maxStudents && (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" /> {errors.maxStudents}
                  </p>
                )}
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="location">الموقع</Label>
                <div className="relative">
                  <MapPin className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="pr-10"
                    placeholder="مثال: مبنى أ - غرفة 101"
                  />
                </div>
              </div>
            </div>
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
              {isSubmitting ? "جاري الإضافة..." : "إنشاء فصل"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}