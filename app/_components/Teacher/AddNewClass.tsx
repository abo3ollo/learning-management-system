// app/_components/Teacher/AddNewClass.tsx

"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, X } from "lucide-react";

interface AddNewClassProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

// ✅ مساعدة لتحويل اسم الصف إلى gradeLevel
const getGradeLevel = (grade: string): number => {
  const gradeMap: Record<string, number> = {
    "الأول الابتدائي": 1,
    "الثاني الابتدائي": 2,
    "الثالث الابتدائي": 3,
    "الرابع الابتدائي": 4,
    "الخامس الابتدائي": 5,
    "السادس الابتدائي": 6,
    "الأول الإعدادي": 7,
    "الثاني الإعدادي": 8,
    "الثالث الإعدادي": 9,
    "الأول الثانوي": 10,
    "الثاني الثانوي": 11,
    "الثالث الثانوي": 12,
  };
  return gradeMap[grade] || 0;
};

export function AddNewClass({ isOpen, onClose, onSuccess }: AddNewClassProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    classNameAr: "",
    classNameEn: "",
    grade: "",
    section: "",
    academicYear: "",
    maxStudents: 30,
    location: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const createClass = useMutation(api.classes.classes.createClass);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.classNameAr.trim()) {
      newErrors.classNameAr = "اسم المجموعة (عربي) مطلوب";
    }
    if (!formData.classNameEn.trim()) {
      newErrors.classNameEn = "اسم المجموعة (إنجليزي) مطلوب";
    }
    if (!formData.grade) {
      newErrors.grade = "الصف مطلوب";
    }
    if (!formData.section.trim()) {
      newErrors.section = "الشعبة مطلوبة";
    }
    if (!formData.academicYear.trim()) {
      newErrors.academicYear = "العام الدراسي مطلوب";
    }
    if (formData.maxStudents < 1) {
      newErrors.maxStudents = "السعة القصوى يجب أن تكون 1 على الأقل";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const gradeLevel = getGradeLevel(formData.grade);

      await createClass({
        classNameAr: formData.classNameAr,
        classNameEn: formData.classNameEn,
        grade: formData.grade,
        gradeLevel: gradeLevel,
        section: formData.section,
        academicYear: formData.academicYear,
        maxStudents: Number(formData.maxStudents),
        location: formData.location || undefined,
        // ✅ supervisorId اختياري
        // ✅ schedule اختياري
      });

      // Reset form
      setFormData({
        classNameAr: "",
        classNameEn: "",
        grade: "",
        section: "",
        academicYear: "",
        maxStudents: 30,
        location: "",
      });
      setErrors({});

      if (onSuccess) onSuccess();
      onClose();
    } catch (error: any) {
      console.error("Error creating class:", error);
      setErrors({ submit: error.message || "حدث خطأ أثناء إنشاء المجموعة" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({
      classNameAr: "",
      classNameEn: "",
      grade: "",
      section: "",
      academicYear: "",
      maxStudents: 30,
      location: "",
    });
    setErrors({});
    onClose();
  };

  const gradeOptions = [
    { value: "الأول الابتدائي", label: "الأول الابتدائي" },
    { value: "الثاني الابتدائي", label: "الثاني الابتدائي" },
    { value: "الثالث الابتدائي", label: "الثالث الابتدائي" },
    { value: "الرابع الابتدائي", label: "الرابع الابتدائي" },
    { value: "الخامس الابتدائي", label: "الخامس الابتدائي" },
    { value: "السادس الابتدائي", label: "السادس الابتدائي" },
    { value: "الأول الإعدادي", label: "الأول الإعدادي" },
    { value: "الثاني الإعدادي", label: "الثاني الإعدادي" },
    { value: "الثالث الإعدادي", label: "الثالث الإعدادي" },
    { value: "الأول الثانوي", label: "الأول الثانوي" },
    { value: "الثاني الثانوي", label: "الثاني الثانوي" },
    { value: "الثالث الثانوي", label: "الثالث الثانوي" },
  ];

  const academicYears = [
    "2026-2027",
    "2027-2028",
  ];

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent
        className="max-w-2xl max-h-[90vh] overflow-y-auto"
        dir="rtl"
      >
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl font-bold text-[#001f24]">
              إنشاء مجموعة جديدة
            </DialogTitle>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            أدخل بيانات المجموعة الدراسية الجديدة
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          {errors.submit && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {errors.submit}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* اسم المجموعة (عربي) */}
            <div className="space-y-2">
              <Label htmlFor="classNameAr" className="flex items-center gap-1">
                اسم المجموعة (عربي) <span className="text-red-500">*</span>
              </Label>
              <Input
                id="classNameAr"
                value={formData.classNameAr}
                onChange={(e) =>
                  setFormData({ ...formData, classNameAr: e.target.value })
                }
                placeholder="مثال: مجموعة حياء رقم 1"
                className={errors.classNameAr ? "border-red-500" : ""}
              />
              {errors.classNameAr && (
                <p className="text-xs text-red-500">{errors.classNameAr}</p>
              )}
            </div>

            {/* اسم المجموعة (إنجليزي) */}
            <div className="space-y-2">
              <Label htmlFor="classNameEn" className="flex items-center gap-1">
                اسم المجموعة (إنجليزي) <span className="text-red-500">*</span>
              </Label>
              <Input
                id="classNameEn"
                value={formData.classNameEn}
                onChange={(e) =>
                  setFormData({ ...formData, classNameEn: e.target.value })
                }
                placeholder="Example: Biology Group 1"
                className={errors.classNameEn ? "border-red-500" : ""}
              />
              {errors.classNameEn && (
                <p className="text-xs text-red-500">{errors.classNameEn}</p>
              )}
            </div>

            {/* الصف */}
            <div className="space-y-2">
              <Label htmlFor="grade" className="flex items-center gap-1">
                الصف <span className="text-red-500">*</span>
              </Label>
              <select
                id="grade"
                value={formData.grade}
                onChange={(e) =>
                  setFormData({ ...formData, grade: e.target.value })
                }
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a7a8a] bg-white ${
                  errors.grade ? "border-red-500" : "border-[#c0c8c9]"
                }`}
              >
                <option value="">اختر الصف</option>
                {gradeOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              {errors.grade && (
                <p className="text-xs text-red-500">{errors.grade}</p>
              )}
            </div>

            {/* الشعبة */}
            <div className="space-y-2">
              <Label htmlFor="section" className="flex items-center gap-1">
                الشعبة <span className="text-red-500">*</span>
              </Label>
              <Input
                id="section"
                value={formData.section}
                onChange={(e) =>
                  setFormData({ ...formData, section: e.target.value })
                }
                placeholder="مثال: أ"
                className={errors.section ? "border-red-500" : ""}
              />
              {errors.section && (
                <p className="text-xs text-red-500">{errors.section}</p>
              )}
            </div>

            {/* العام الدراسي */}
            <div className="space-y-2">
              <Label htmlFor="academicYear" className="flex items-center gap-1">
                العام الدراسي <span className="text-red-500">*</span>
              </Label>
              <select
                id="academicYear"
                value={formData.academicYear}
                onChange={(e) =>
                  setFormData({ ...formData, academicYear: e.target.value })
                }
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a7a8a] bg-white ${
                  errors.academicYear ? "border-red-500" : "border-[#c0c8c9]"
                }`}
              >
                <option value="">اختر العام الدراسي</option>
                {academicYears.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
              {errors.academicYear && (
                <p className="text-xs text-red-500">{errors.academicYear}</p>
              )}
            </div>

            {/* السعة القصوى */}
            <div className="space-y-2">
              <Label htmlFor="maxStudents" className="flex items-center gap-1">
                السعة القصوى <span className="text-red-500">*</span>
              </Label>
              <Input
                id="maxStudents"
                type="number"
                min="1"
                max="60"
                value={formData.maxStudents}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    maxStudents: parseInt(e.target.value) || 30,
                  })
                }
                className={errors.maxStudents ? "border-red-500" : ""}
              />
              {errors.maxStudents && (
                <p className="text-xs text-red-500">{errors.maxStudents}</p>
              )}
              <p className="text-xs text-gray-400">الحد الأقصى 60 طالب</p>
            </div>

            {/* الموقع (اختياري) */}
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="location">الموقع (اختياري)</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) =>
                  setFormData({ ...formData, location: e.target.value })
                }
                placeholder="مثال: الدور الأول - غرفة 101"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              إلغاء
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-[#001f24] hover:bg-[#03363d] text-white min-w-32"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin ml-2" />
                  جاري الإنشاء...
                </>
              ) : (
                "إنشاء المجموعة"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}