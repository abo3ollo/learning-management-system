// app/_components/EditCourseModal.tsx
"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  X,
  BookOpen,
  User,
  Tag,
  DollarSign,
  Image as ImageIcon,
  AlertCircle,
  ChevronDown,
  Loader2,
} from "lucide-react";

interface EditCourseModalProps {
  isOpen: boolean;
  onClose: () => void;
  courseId: string | null;
}

export function EditCourseModal({ isOpen, onClose, courseId }: EditCourseModalProps) {
  const course = useQuery(api.courses.courses.getCourseById,
    courseId ? { courseId: courseId as any } : "skip"
  );
  const teachers = useQuery(api.user.teachers.getTeachers, {});
  const updateCourse = useMutation(api.courses.courses.updateCourse);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    teacherId: "",
    category: "",
    price: "",
    isPublished: true,
  });
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);

  // تعبئة النموذج ببيانات المادة عند التحميل
  useEffect(() => {
    if (course) {
      setFormData({
        title: course.title || "",
        description: course.description || "",
        teacherId: course.teacherId || "",
        category: course.category || "",
        price: course.price ? String(course.price) : "",
        isPublished: course.isPublished ?? true,
      });
      if (course.thumbnail) {
        setThumbnailPreview(course.thumbnail);
      }
      setIsLoading(false);
    }
  }, [course]);

  if (!isOpen) return null;

  if (isLoading || !course) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl p-8 text-center">
          <Loader2 className="h-12 w-12 animate-spin text-[#1a7a8a] mx-auto mb-4" />
          <p className="text-gray-500">جاري تحميل المادة...</p>
        </div>
      </div>
    );
  }

  const categoryOptions = [
    "اللغة العربية",
    "الرياضيات",
    "العلوم",
    "الدراسات الاجتماعية",
    "اللغة الإنجليزية",
    "التربية الإسلامية",
    "الحاسب الآلي",
    "التربية الفنية",
    "التربية البدنية",
    "أخرى",
  ];

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setThumbnail(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setThumbnailPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = "عنوان المادة مطلوب";
    }
    if (!formData.description.trim()) {
      newErrors.description = "وصف المادة مطلوب";
    }
    if (!formData.teacherId) {
      newErrors.teacherId = "يرجى اختيار المعلم";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const thumbnailUrl = thumbnailPreview || undefined;

      await updateCourse({
        courseId: courseId as any,
        title: formData.title,
        description: formData.description,
        teacherId: formData.teacherId as any,
        thumbnail: thumbnailUrl,
        isPublished: formData.isPublished,
        price: formData.price ? parseFloat(formData.price) : undefined,
        category: formData.category || undefined,
      });

      onClose();
    } catch (error) {
      console.error("Error updating course:", error);
      setErrors({ submit: "حدث خطأ أثناء تحديث المادة" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-[#c0c8c9] px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-[#001f24]">تعديل المادة</h2>
            <p className="text-sm text-gray-500 mt-1">تحديث تفاصيل المادة الدراسية</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="title" className="flex items-center gap-1">
                عنوان المادة <span className="text-red-500">*</span>
              </Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className={errors.title ? 'border-red-500' : ''}
                placeholder="مثال: الرياضيات - الفصل الأول"
              />
              {errors.title && (
                <p className="text-xs text-red-500 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" /> {errors.title}
                </p>
              )}
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="description" className="flex items-center gap-1">
                وصف المادة <span className="text-red-500">*</span>
              </Label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a7a8a] resize-none ${
                  errors.description ? 'border-red-500' : 'border-[#c0c8c9]'
                }`}
                rows={3}
                placeholder="وصف مختصر للمادة..."
              />
              {errors.description && (
                <p className="text-xs text-red-500 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" /> {errors.description}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="teacherId" className="flex items-center gap-1">
                المعلم <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <User className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <select
                  id="teacherId"
                  value={formData.teacherId}
                  onChange={(e) => setFormData({ ...formData, teacherId: e.target.value })}
                  className={`w-full px-3 py-2 pr-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a7a8a] bg-white appearance-none ${
                    errors.teacherId ? 'border-red-500' : 'border-[#c0c8c9]'
                  }`}
                >
                  <option value="">اختر المعلم</option>
                  {teachers?.map((teacher: any) => (
                    <option key={teacher._id} value={teacher._id}>{teacher.name}</option>
                  ))}
                </select>
                <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              </div>
              {errors.teacherId && (
                <p className="text-xs text-red-500 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" /> {errors.teacherId}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">التصنيف</Label>
              <div className="relative">
                <Tag className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <select
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 pr-10 border border-[#c0c8c9] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a7a8a] bg-white appearance-none"
                >
                  <option value="">اختر التصنيف</option>
                  {categoryOptions.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">السعر (ريال)</Label>
              <div className="relative">
                <DollarSign className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className="pr-10"
                  placeholder="0 = مجاني"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>صورة المادة (اختياري)</Label>
              <label className="block cursor-pointer">
                <div className={`border-2 border-dashed rounded-lg p-4 text-center hover:border-[#1a7a8a] transition-colors ${
                  thumbnailPreview ? 'border-[#1a7a8a]' : 'border-[#c0c8c9]'
                }`}>
                  {thumbnailPreview ? (
                    <img src={thumbnailPreview} alt="Preview" className="max-h-32 mx-auto rounded" />
                  ) : (
                    <>
                      <ImageIcon className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                      <p className="text-sm text-gray-500">اختر صورة</p>
                      <p className="text-xs text-gray-400">PNG, JPG, WEBP</p>
                    </>
                  )}
                </div>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageChange}
                />
              </label>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label>حالة النشر</Label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={formData.isPublished === true}
                    onChange={() => setFormData({ ...formData, isPublished: true })}
                    className="w-4 h-4 text-[#1a7a8a] focus:ring-[#1a7a8a]"
                  />
                  <span className="text-sm text-gray-700">منشور</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={formData.isPublished === false}
                    onChange={() => setFormData({ ...formData, isPublished: false })}
                    className="w-4 h-4 text-[#1a7a8a] focus:ring-[#1a7a8a]"
                  />
                  <span className="text-sm text-gray-700">مسودة</span>
                </label>
              </div>
            </div>
          </div>

          {errors.submit && (
            <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              {errors.submit}
            </div>
          )}

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
              className="min-w-30 bg-[#001f24] hover:bg-[#03363d] text-white"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "تحديث المادة"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}