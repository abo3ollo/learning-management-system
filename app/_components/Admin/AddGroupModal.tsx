// app/_components/Admin/AddGroupModal.tsx

"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
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

interface AddGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  gradeId?: string;
  onSuccess?: () => void;
}

export function AddGroupModal({ isOpen, onClose, gradeId, onSuccess }: AddGroupModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    nameEn: "",
    subject: "",
    maxStudents: 30,
    supervisorId: "",
    location: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // جلب المعلمين المتاحين
  const teachers = useQuery(api.user.teachers.getAvailableTeachers, {});

  const createGroup = useMutation(api.groups.groups.createGroup);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "اسم المجموعة (عربي) مطلوب";
    }
    if (!formData.nameEn.trim()) {
      newErrors.nameEn = "اسم المجموعة (إنجليزي) مطلوب";
    }
    if (!formData.subject.trim()) {
      newErrors.subject = "المادة مطلوبة";
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
      await createGroup({
        name: formData.name,
        nameEn: formData.nameEn,
        gradeId: gradeId as any,
        subject: formData.subject,
        maxStudents: Number(formData.maxStudents),
        supervisorId: formData.supervisorId ? (formData.supervisorId as any) : undefined,
        location: formData.location || undefined,
      });

      setFormData({
        name: "",
        nameEn: "",
        subject: "",
        maxStudents: 30,
        supervisorId: "",
        location: "",
      });
      setErrors({});

      if (onSuccess) onSuccess();
      onClose();
    } catch (error: any) {
      console.error("Error creating group:", error);
      setErrors({ submit: error.message || "حدث خطأ أثناء إنشاء المجموعة" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({
      name: "",
      nameEn: "",
      subject: "",
      maxStudents: 30,
      supervisorId: "",
      location: "",
    });
    setErrors({});
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md" dir="rtl">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-bold text-[#001f24]">
              إضافة مجموعة جديدة
            </DialogTitle>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            أدخل بيانات المجموعة الجديدة
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
              اسم المجموعة (عربي) <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="مثال: مجموعة عربي 1"
              className={errors.name ? "border-red-500" : ""}
            />
            {errors.name && (
              <p className="text-xs text-red-500">{errors.name}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="nameEn" className="flex items-center gap-1">
              اسم المجموعة (إنجليزي) <span className="text-red-500">*</span>
            </Label>
            <Input
              id="nameEn"
              value={formData.nameEn}
              onChange={(e) =>
                setFormData({ ...formData, nameEn: e.target.value })
              }
              placeholder="Example: Arabic Group 1"
              className={errors.nameEn ? "border-red-500" : ""}
            />
            {errors.nameEn && (
              <p className="text-xs text-red-500">{errors.nameEn}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="subject" className="flex items-center gap-1">
              المادة <span className="text-red-500">*</span>
            </Label>
            <Input
              id="subject"
              value={formData.subject}
              onChange={(e) =>
                setFormData({ ...formData, subject: e.target.value })
              }
              placeholder="مثال: اللغة العربية"
              className={errors.subject ? "border-red-500" : ""}
            />
            {errors.subject && (
              <p className="text-xs text-red-500">{errors.subject}</p>
            )}
          </div>

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
          </div>

          <div className="space-y-2">
            <Label htmlFor="supervisorId">المشرف (اختياري)</Label>
            <select
              id="supervisorId"
              value={formData.supervisorId}
              onChange={(e) =>
                setFormData({ ...formData, supervisorId: e.target.value })
              }
              className="w-full px-3 py-2 border border-[#c0c8c9] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a7a8a] bg-white"
            >
              <option value="">اختر المشرف</option>
              {teachers?.map((teacher: any) => (
                <option key={teacher._id} value={teacher._id}>
                  {teacher.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
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
                "إضافة المجموعة"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}