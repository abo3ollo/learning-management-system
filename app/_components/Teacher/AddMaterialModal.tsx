// app/_components/Teacher/AddMaterialModal.tsx

"use client";

import { useState, useEffect } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Loader2,
  FileText,
  Video,
  BookOpen,
  CheckCircle,
  Eye,
} from "lucide-react";
import { toast } from "sonner";

interface AddMaterialModalProps {
  isOpen: boolean;
  onClose: () => void;
  teacherId: string;
  editingMaterial?: any;
}

export function AddMaterialModal({
  isOpen,
  onClose,
  teacherId,
  editingMaterial,
}: AddMaterialModalProps) {
  const [formData, setFormData] = useState({
    title: "",
    titleAr: "",
    description: "",
    descriptionAr: "",
    type: "pdf" as "pdf" | "video" | "exam" | "assignment" | "revision",
    fileUrl: "",
    fileSize: "",
    duration: "",
    subject: "",
    grade: "",
    deadline: "",
    isPublished: true,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createMaterial = useMutation(api.teacherMaterials.teacherMaterials.createMaterial);
  const updateMaterial = useMutation(api.teacherMaterials.teacherMaterials.updateMaterial);

  useEffect(() => {
    if (editingMaterial) {
      setFormData({
        title: editingMaterial.title || "",
        titleAr: editingMaterial.titleAr || "",
        description: editingMaterial.description || "",
        descriptionAr: editingMaterial.descriptionAr || "",
        type: editingMaterial.type || "pdf",
        fileUrl: editingMaterial.fileUrl || "",
        fileSize: editingMaterial.fileSize || "",
        duration: editingMaterial.duration || "",
        subject: editingMaterial.subject || "",
        grade: editingMaterial.grade || "",
        deadline: editingMaterial.deadline ? new Date(editingMaterial.deadline).toISOString().split("T")[0] : "",
        isPublished: editingMaterial.isPublished ?? true,
      });
    } else {
      setFormData({
        title: "",
        titleAr: "",
        description: "",
        descriptionAr: "",
        type: "pdf",
        fileUrl: "",
        fileSize: "",
        duration: "",
        subject: "",
        grade: "",
        deadline: "",
        isPublished: true,
      });
    }
  }, [editingMaterial, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.titleAr) {
      toast.error("العنوان مطلوب باللغتين العربية والإنجليزية");
      return;
    }

    setIsSubmitting(true);
    try {
      const data = {
        teacherId: teacherId as any,
        title: formData.title,
        titleAr: formData.titleAr,
        description: formData.description || undefined,
        descriptionAr: formData.descriptionAr || undefined,
        type: formData.type,
        fileUrl: formData.fileUrl || undefined,
        fileSize: formData.fileSize || undefined,
        duration: formData.duration || undefined,
        subject: formData.subject,
        grade: formData.grade,
        deadline: formData.deadline ? new Date(formData.deadline).getTime() : undefined,
        isPublished: formData.isPublished,
        displayOrder: 0,
      };

      if (editingMaterial) {
        await updateMaterial({
          materialId: editingMaterial._id,
          ...data,
        });
        toast.success("✅ تم تحديث المادة بنجاح");
      } else {
        await createMaterial(data);
        toast.success("✅ تم إضافة المادة بنجاح");
      }
      onClose();
    } catch (error: any) {
      toast.error(error.message || "حدث خطأ");
    } finally {
      setIsSubmitting(false);
    }
  };

  const typeOptions = [
    { value: "pdf", label: "ملف PDF", icon: FileText },
    { value: "video", label: "فيديو", icon: Video },
    { value: "exam", label: "امتحان", icon: BookOpen },
    { value: "assignment", label: "واجب", icon: CheckCircle },
    { value: "revision", label: "مراجعة", icon: Eye },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-[#001f24]">
            {editingMaterial ? "تعديل المادة" : "إضافة مادة جديدة"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>العنوان (عربي) <span className="text-red-500">*</span></Label>
              <Input
                value={formData.titleAr}
                onChange={(e) => setFormData({ ...formData, titleAr: e.target.value })}
                placeholder="العنوان بالعربية"
              />
            </div>
            <div className="space-y-2">
              <Label>العنوان (إنجليزي) <span className="text-red-500">*</span></Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Title in English"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>الوصف (عربي)</Label>
              <Textarea
                value={formData.descriptionAr}
                onChange={(e) => setFormData({ ...formData, descriptionAr: e.target.value })}
                placeholder="وصف المادة بالعربية"
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>نوع المادة</Label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a7a8a]"
              >
                {typeOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>المادة الدراسية</Label>
              <Input
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                placeholder="مثال: رياضيات"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>المرحلة الدراسية</Label>
              <Input
                value={formData.grade}
                onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                placeholder="مثال: ثانوي"
              />
            </div>
            <div className="space-y-2">
              <Label>رابط الملف</Label>
              <Input
                value={formData.fileUrl}
                onChange={(e) => setFormData({ ...formData, fileUrl: e.target.value })}
                placeholder="https://example.com/file.pdf"
              />
            </div>
          </div>

          {/* ✅ إصلاح الشرط - استخدام OR بشكل صحيح */}
          {(formData.type === "pdf" || formData.type === "video") && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{formData.type === "pdf" ? "حجم الملف" : "مدة الفيديو"}</Label>
                <Input
                  value={formData.type === "pdf" ? formData.fileSize : formData.duration}
                  onChange={(e) => {
                    if (formData.type === "pdf") {
                      setFormData({ ...formData, fileSize: e.target.value });
                    } else {
                      setFormData({ ...formData, duration: e.target.value });
                    }
                  }}
                  placeholder={formData.type === "pdf" ? "2.5 MB" : "15:30"}
                />
              </div>
            </div>
          )}

          {/* ✅ واجبات - عرض منفصل */}
          {formData.type === "assignment" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>تاريخ التسليم</Label>
                <Input
                  type="date"
                  value={formData.deadline}
                  onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                />
              </div>
            </div>
          )}

          <div className="flex items-center gap-4">
            <Label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.isPublished}
                onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
              />
              منشور
            </Label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              إلغاء
            </Button>
            <Button type="submit" disabled={isSubmitting} className="bg-[#001f24] hover:bg-[#03363d] text-white">
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin ml-2" />
                  جاري الحفظ...
                </>
              ) : (
                editingMaterial ? "تحديث" : "إضافة"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}