"use client";

import { useState, useEffect, useRef } from "react";
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
  Upload,
  X,
  File,
  Film,
  FileIcon,
} from "lucide-react";
import { toast } from "sonner";

interface AddMaterialModalProps {
  isOpen: boolean;
  onClose: () => void;
  teacherId: string;
  editingMaterial?: any;
}

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

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
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const createMaterial = useMutation(api.teacherMaterials.teacherMaterials.createMaterial);
  const updateMaterial = useMutation(api.teacherMaterials.teacherMaterials.updateMaterial);
  const generateUploadUrl = useMutation(api.teacherMaterials.teacherMaterials.generateUploadUrl);

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
      setUploadedFile(null);
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
      setUploadedFile(null);
    }
    setUploadProgress(0);
  }, [editingMaterial, isOpen]);

  // ✅ معالج رفع الملف
  const handleFileUpload = async (file: File) => {
    if (file.size > MAX_FILE_SIZE) {
      toast.error(`حجم الملف يتجاوز الحد المسموح (50MB)`);
      return;
    }

    let isValidType = false;
    const fileType = file.type;
    const fileExtension = file.name.split('.').pop()?.toLowerCase();

    if (formData.type === "pdf") {
      isValidType = fileType === "application/pdf" || fileExtension === "pdf";
    } else if (formData.type === "video") {
      isValidType = fileType.startsWith("video/") || ["mp4", "webm", "ogg", "mov"].includes(fileExtension || "");
    } else {
      isValidType = true;
    }

    if (!isValidType) {
      toast.error(`نوع الملف غير مدعوم لهذا النوع من المواد`);
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const uploadUrl = await generateUploadUrl();

      const response = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });

      if (!response.ok) {
        throw new Error("فشل رفع الملف");
      }

      const result = await response.json();
      const storageIdValue = typeof result === 'string' ? result : result.storageId || result.id;
      
      setFormData(prev => ({
        ...prev,
        fileUrl: storageIdValue,
        fileSize: (file.size / (1024 * 1024)).toFixed(2) + " MB",
      }));

      setUploadedFile(file);
      setUploadProgress(100);
      toast.success("✅ تم رفع الملف بنجاح");

    } catch (error: any) {
      toast.error(error.message || "حدث خطأ أثناء رفع الملف");
    } finally {
      setIsUploading(false);
    }
  };

  // ✅ معالج اختيار الملف
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  // ✅ إزالة الملف
  const handleRemoveFile = () => {
    setUploadedFile(null);
    setFormData(prev => ({
      ...prev,
      fileUrl: "",
      fileSize: "",
    }));
    setUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.titleAr) {
      toast.error("العنوان مطلوب باللغتين العربية والإنجليزية");
      return;
    }

    if (!editingMaterial && !formData.fileUrl) {
      toast.error("يرجى رفع ملف للمادة");
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
        fileUrl: formData.fileUrl,
        fileSize: formData.fileSize || undefined,
        duration: formData.duration || undefined,
        subject: formData.subject,
        grade: formData.grade,
        deadline: formData.deadline ? new Date(formData.deadline).getTime() : undefined,
        isPublished: formData.isPublished,
        displayOrder: 0,
      };

      if (editingMaterial) {
        // ✅ للتحديث: إزالة teacherId من البيانات
        const { teacherId: _, ...updateData } = data;
        await updateMaterial({
          materialId: editingMaterial._id,
          ...updateData,
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

  // ✅ عرض معلومات الملف المرفوع
  const renderFileInfo = () => {
    if (!uploadedFile && !formData.fileUrl) return null;

    const fileName = uploadedFile?.name || editingMaterial?.fileUrl || "ملف";
    const fileSize = uploadedFile ? (uploadedFile.size / (1024 * 1024)).toFixed(2) + " MB" : formData.fileSize || "غير معروف";
    const fileIcon = formData.type === "pdf" ? FileText : 
                     formData.type === "video" ? Film : File;

    return (
      <div className="bg-green-50 border border-green-200 rounded-xl p-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
            <FileIcon className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700 truncate max-w-50">{fileName}</p>
            <p className="text-xs text-gray-400">{fileSize}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleRemoveFile}
          className="p-1.5 hover:bg-red-50 rounded-lg transition-colors text-red-500 hover:text-red-600"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  };

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
              <Label>المادة الدراسية</Label>
              <Input
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                placeholder="مثال: رياضيات"
              />
            </div>
            <div className="space-y-2">
              <Label>المرحلة الدراسية</Label>
              <Input
                value={formData.grade}
                onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                placeholder="مثال: ثانوي"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>نوع المادة</Label>
              <select
                value={formData.type}
                onChange={(e) => {
                  setFormData({ ...formData, type: e.target.value as any });
                  if (uploadedFile) {
                    setUploadedFile(null);
                    setFormData(prev => ({ ...prev, fileUrl: "", fileSize: "" }));
                  }
                }}
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
              <Label>رابط الملف (بديل)</Label>
              <Input
                value={formData.fileUrl}
                onChange={(e) => setFormData({ ...formData, fileUrl: e.target.value })}
                placeholder="https://example.com/file.pdf"
                disabled={!!uploadedFile}
              />
            </div>
          </div>

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

          {/* ✅ رفع الملف */}
          <div className="space-y-2">
            <Label>رفع الملف {!editingMaterial && <span className="text-red-500">*</span>}</Label>
            
            {!uploadedFile && !formData.fileUrl ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                  isUploading ? "border-blue-400 bg-blue-50" : "border-gray-300 hover:border-[#1a7a8a] hover:bg-gray-50"
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileSelect}
                  className="hidden"
                  accept={
                    formData.type === "pdf" ? ".pdf" :
                    formData.type === "video" ? "video/*" :
                    "*/*"
                  }
                />
                {isUploading ? (
                  <div className="space-y-3">
                    <Loader2 className="h-10 w-10 animate-spin text-[#1a7a8a] mx-auto" />
                    <p className="text-sm text-gray-500">جاري رفع الملف...</p>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-[#1a7a8a] h-2 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-400">{uploadProgress}%</p>
                  </div>
                ) : (
                  <>
                    <Upload className="h-10 w-10 text-gray-400 mx-auto mb-3" />
                    <p className="text-sm font-medium text-gray-600">اضغط لرفع ملف</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {formData.type === "pdf" && "PDF, DOCX, (حد أقصى 50MB)"}
                      {formData.type === "video" && "MP4, WebM, OGG (حد أقصى 50MB)"}
                      {formData.type === "exam" && "PNG, JPG, PDF (حد أقصى 50MB)"}
                      {formData.type === "assignment" && "PDF, DOCX, (حد أقصى 50MB)"}
                      {formData.type === "revision" && "PDF, DOCX, (حد أقصى 50MB)"}
                    </p>
                  </>
                )}
              </div>
            ) : (
              renderFileInfo()
            )}
          </div>

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
            <Button 
              type="submit" 
              disabled={isSubmitting || isUploading || (!editingMaterial && !formData.fileUrl)}
              className="bg-[#001f24] hover:bg-[#03363d] text-white"
            >
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