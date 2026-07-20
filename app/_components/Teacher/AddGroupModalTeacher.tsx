// app/_components/Teacher/AddGroupModalTeacher.tsx

"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";

interface AddGroupModalTeacherProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function AddGroupModalTeacher({
  isOpen,
  onClose,
  onSuccess,
}: AddGroupModalTeacherProps) {
  const createGroup = useMutation(api.groups.groups.createGroup);

  // ✅ جلب قائمة الصفوف
  const grades = useQuery(api.grades.grades.getActiveGrades);

  const [formData, setFormData] = useState({
    name: "",
    nameEn: "",
    gradeId: "",
    subject: "",
    maxStudents: 30,
    location: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      if (!formData.gradeId) {
        setError("يرجى اختيار الصف الدراسي");
        setIsSubmitting(false);
        return;
      }

      await createGroup({
        name: formData.name,
        nameEn: formData.nameEn,
        gradeId: formData.gradeId as any,
        subject: formData.subject,
        maxStudents: formData.maxStudents,
        location: formData.location || undefined,
      });

      setFormData({
        name: "",
        nameEn: "",
        gradeId: "",
        subject: "",
        maxStudents: 30,
        location: "",
      });

      onClose();
      if (onSuccess) onSuccess();

    } catch (err: any) {
      setError(err.message || "حدث خطأ أثناء إنشاء المجموعة");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGradeChange = (value: string | null) => {
    setFormData({ ...formData, gradeId: value || "" });
  };

  // ✅ الحصول على اسم الصف المحدد
  const getSelectedGradeName = () => {
    if (!formData.gradeId || !grades) return "اختر الصف";
    const grade = grades.find((g: any) => g._id === formData.gradeId);
    return grade ? `${grade.name} ${grade.nameEn ? `- ${grade.nameEn}` : ""}` : "اختر الصف";
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-[#001f24]">
            إنشاء مجموعة جديدة
          </DialogTitle>
          <p className="text-sm text-gray-500">
            أضف مجموعة جديدة للطلاب
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          {/* ✅ اختيار الصف */}
          <div className="space-y-2">
            <Label>الصف الدراسي <span className="text-red-500">*</span></Label>
            <Select
              value={formData.gradeId}
              onValueChange={handleGradeChange}
            >
              <SelectTrigger className="w-full">
                {/* ✅ عرض اسم الصف بدلاً من ID */}
                <SelectValue placeholder="اختر الصف">
                  {getSelectedGradeName()}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {grades?.map((grade: any) => (
                  <SelectItem key={grade._id} value={grade._id}>
                    {grade.name} {grade.nameEn ? `- ${grade.nameEn}` : ""}
                  </SelectItem>
                ))}
                {(!grades || grades.length === 0) && (
                  <div className="p-2 text-sm text-gray-500 text-center">
                    لا توجد صفوف متاحة
                  </div>
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>اسم المجموعة (عربي) <span className="text-red-500">*</span></Label>
            <Input
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="مثال: رياضيات 1"
              required
            />
          </div>

          <div className="space-y-2">
            <Label>اسم المجموعة (إنجليزي) <span className="text-red-500">*</span></Label>
            <Input
              value={formData.nameEn}
              onChange={(e) =>
                setFormData({ ...formData, nameEn: e.target.value })
              }
              placeholder="Example: Math Group 1"
              required
            />
          </div>

          <div className="space-y-2">
            <Label>المادة <span className="text-red-500">*</span></Label>
            <Input
              value={formData.subject}
              onChange={(e) =>
                setFormData({ ...formData, subject: e.target.value })
              }
              placeholder="مثال: رياضيات"
              required
            />
          </div>

          <div className="space-y-2">
            <Label>الحد الأقصى للطلاب <span className="text-red-500">*</span></Label>
            <Input
              type="number"
              min="1"
              value={formData.maxStudents}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  maxStudents: parseInt(e.target.value) || 30,
                })
              }
              required
            />
          </div>

          <div className="space-y-2">
            <Label>الموقع (اختياري)</Label>
            <Input
              value={formData.location}
              onChange={(e) =>
                setFormData({ ...formData, location: e.target.value })
              }
              placeholder="مثال: مبنى A - غرفة 101"
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">
              {error}
            </div>
          )}

          <DialogFooter className="gap-2">
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
              className="bg-[#001f24] hover:bg-[#03363d] text-white"
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