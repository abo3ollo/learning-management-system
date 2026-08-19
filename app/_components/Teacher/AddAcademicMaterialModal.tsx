// app/_components/Teacher/AddAcademicMaterialModal.tsx
"use client";

import { useState, useEffect } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
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
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

interface AddAcademicMaterialModalProps {
  isOpen: boolean;
  onClose: () => void;
  teacherId: Id<"users">;
  editingMaterial?: any;
}

export function AddAcademicMaterialModal({
  isOpen,
  onClose,
  teacherId,
  editingMaterial,
}: AddAcademicMaterialModalProps) {
  const [formData, setFormData] = useState({
    title: "",
    titleAr: "",
    description: "",
    descriptionAr: "",
    type: "pdf" as "pdf" | "video" | "exam" | "assignment" | "revision",
    subject: "",
    grade: "",
    academicLevel: "primary" as "primary" | "middle" | "high",
    fileUrl: "",
    fileSize: "",
    duration: "",
    isPublished: true,
    displayOrder: 0,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createMaterial = useMutation(api.teacherMaterials.teacherMaterials.createAcademicMaterial);
  const updateMaterial = useMutation(api.teacherMaterials.teacherMaterials.updateAcademicMaterial);

  useEffect(() => {
    if (editingMaterial) {
      setFormData({
        title: editingMaterial.title || "",
        titleAr: editingMaterial.titleAr || "",
        description: editingMaterial.description || "",
        descriptionAr: editingMaterial.descriptionAr || "",
        type: editingMaterial.type || "pdf",
        subject: editingMaterial.subject || "",
        grade: editingMaterial.grade || "",
        academicLevel: editingMaterial.academicLevel || "primary",
        fileUrl: editingMaterial.fileUrl || "",
        fileSize: editingMaterial.fileSize || "",
        duration: editingMaterial.duration || "",
        isPublished: editingMaterial.isPublished !== undefined ? editingMaterial.isPublished : true,
        displayOrder: editingMaterial.displayOrder || 0,
      });
    } else {
      setFormData({
        title: "",
        titleAr: "",
        description: "",
        descriptionAr: "",
        type: "pdf",
        subject: "",
        grade: "",
        academicLevel: "primary",
        fileUrl: "",
        fileSize: "",
        duration: "",
        isPublished: true,
        displayOrder: 0,
      });
    }
  }, [editingMaterial, isOpen]);

  const handleSubmit = async () => {
    if (!formData.title || !formData.subject || !formData.grade) {
      toast.error("الرجاء إدخال جميع الحقول المطلوبة");
      return;
    }

    setIsSubmitting(true);
    try {
      const data = {
        ...formData,
        teacherId,
      };

      if (editingMaterial) {
        await updateMaterial({
          materialId: editingMaterial._id,
          ...data,
        });
        toast.success("تم تحديث المادة بنجاح");
      } else {
        await createMaterial(data);
        toast.success("تم إضافة المادة بنجاح");
      }

      onClose();
    } catch (error: any) {
      toast.error(error.message || "حدث خطأ");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle>
            {editingMaterial ? "تعديل مادة تحصيلي" : "إضافة مادة تحصيلي جديدة"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>العنوان (عربي) *</Label>
              <Input
                value={formData.titleAr}
                onChange={(e) => setFormData({ ...formData, titleAr: e.target.value })}
                placeholder="العنوان بالعربية"
              />
            </div>
            <div className="space-y-2">
              <Label>العنوان (إنجليزي) *</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Title in English"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>الوصف (عربي)</Label>
              <Textarea
                value={formData.descriptionAr}
                onChange={(e) => setFormData({ ...formData, descriptionAr: e.target.value })}
                placeholder="الوصف بالعربية"
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label>الوصف (إنجليزي)</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Description in English"
                rows={2}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>المادة *</Label>
              <Input
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                placeholder="مثل: الرياضيات"
              />
            </div>
            <div className="space-y-2">
              <Label>المرحلة *</Label>
              <select
                value={formData.grade}
                onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                className="w-full border rounded-lg px-3 py-2"
              >
                <option value="">اختر المرحلة</option>
                <option value="الصف الأول">الصف الأول</option>
                <option value="الصف الثاني">الصف الثاني</option>
                <option value="الصف الثالث">الصف الثالث</option>
                <option value="الصف الرابع">الصف الرابع</option>
                <option value="الصف الخامس">الصف الخامس</option>
                <option value="الصف السادس">الصف السادس</option>
                <option value="الإعدادي">الإعدادي</option>
                <option value="الثانوي">الثانوي</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>النوع *</Label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                className="w-full border rounded-lg px-3 py-2"
              >
                <option value="pdf">ملف PDF</option>
                <option value="video">فيديو</option>
                <option value="exam">امتحان</option>
                <option value="assignment">واجب</option>
                <option value="revision">مراجعة</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>حجم الملف</Label>
              <Input
                value={formData.fileSize}
                onChange={(e) => setFormData({ ...formData, fileSize: e.target.value })}
                placeholder="2.5 MB"
              />
            </div>
            <div className="space-y-2">
              <Label>المدة</Label>
              <Input
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                placeholder="15:30"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>رابط الملف</Label>
            <Input
              value={formData.fileUrl}
              onChange={(e) => setFormData({ ...formData, fileUrl: e.target.value })}
              placeholder="https://example.com/file.pdf"
            />
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isPublished}
                onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
              />
              منشور
            </label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            إلغاء
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="bg-[#001f24] hover:bg-[#03363d]"
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              editingMaterial ? "تحديث" : "إضافة"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}