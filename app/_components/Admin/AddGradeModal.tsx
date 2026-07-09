// app/_components/Admin/AddGradeModal.tsx

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

interface AddGradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function AddGradeModal({ isOpen, onClose, onSuccess }: AddGradeModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    nameEn: "",
    gradeLevel: "",
    academicYear: "",
    maxGroups: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const createGrade = useMutation(api.grades.grades.createGrade);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "اسم الصف (عربي) مطلوب";
    }
    if (!formData.nameEn.trim()) {
      newErrors.nameEn = "اسم الصف (إنجليزي) مطلوب";
    }
    if (!formData.gradeLevel) {
      newErrors.gradeLevel = "المستوى الدراسي مطلوب";
    }
    if (!formData.academicYear.trim()) {
      newErrors.academicYear = "العام الدراسي مطلوب";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      await createGrade({
        name: formData.name,
        nameEn: formData.nameEn,
        gradeLevel: parseInt(formData.gradeLevel),
        academicYear: formData.academicYear,
        maxGroups: formData.maxGroups ? parseInt(formData.maxGroups) : undefined,
      });

      setFormData({
        name: "",
        nameEn: "",
        gradeLevel: "",
        academicYear: "",
        maxGroups: "",
      });
      setErrors({});

      if (onSuccess) onSuccess();
      onClose();
    } catch (error: any) {
      console.error("Error creating grade:", error);
      setErrors({ submit: error.message || "حدث خطأ أثناء إنشاء الصف" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({
      name: "",
      nameEn: "",
      gradeLevel: "",
      academicYear: "",
      maxGroups: "",
    });
    setErrors({});
    onClose();
  };

  const academicYears = [
    "2024-2025",
    "2025-2026",
    "2026-2027",
    "2027-2028",
  ];

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md" dir="rtl">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-bold text-[#001f24]">
              إضافة صف جديد
            </DialogTitle>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            أدخل بيانات الصف الدراسي الجديد
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {errors.submit && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {errors.submit}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="name" className="flex items-center gap-1">
              اسم الصف (عربي) <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="مثال: الصف الأول الابتدائي"
              className={errors.name ? "border-red-500" : ""}
            />
            {errors.name && (
              <p className="text-xs text-red-500">{errors.name}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="nameEn" className="flex items-center gap-1">
              اسم الصف (إنجليزي) <span className="text-red-500">*</span>
            </Label>
            <Input
              id="nameEn"
              value={formData.nameEn}
              onChange={(e) =>
                setFormData({ ...formData, nameEn: e.target.value })
              }
              placeholder="Example: Grade 1"
              className={errors.nameEn ? "border-red-500" : ""}
            />
            {errors.nameEn && (
              <p className="text-xs text-red-500">{errors.nameEn}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="gradeLevel" className="flex items-center gap-1">
              المستوى الدراسي <span className="text-red-500">*</span>
            </Label>
            <Input
              id="gradeLevel"
              type="number"
              min="1"
              max="12"
              value={formData.gradeLevel}
              onChange={(e) =>
                setFormData({ ...formData, gradeLevel: e.target.value })
              }
              placeholder="مثال: 1"
              className={errors.gradeLevel ? "border-red-500" : ""}
            />
            {errors.gradeLevel && (
              <p className="text-xs text-red-500">{errors.gradeLevel}</p>
            )}
          </div>

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

          <div className="space-y-2">
            <Label htmlFor="maxGroups">الحد الأقصى للمجموعات (اختياري)</Label>
            <Input
              id="maxGroups"
              type="number"
              min="1"
              value={formData.maxGroups}
              onChange={(e) =>
                setFormData({ ...formData, maxGroups: e.target.value })
              }
              placeholder="مثال: 10"
            />
            <p className="text-xs text-gray-400">
              اترك فارغاً لعدم وجود حد أقصى
            </p>
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
                "إضافة الصف"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}