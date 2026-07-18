// app/_components/EditTeacherModal.tsx

"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
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
  User,
  Mail,
  Phone,
  Briefcase,
  GraduationCap,
  Clock,
  MapPin,
  Loader2,
  Plus,
  Trash2,
  AlertCircle,
  Save,
} from "lucide-react";
import { toast } from "sonner";

// ✅ تعريف نوع الحالة المسموح بها للمعلمين
type TeacherStatus = "active" | "inactive" | "on_leave";

interface EditTeacherModalProps {
  isOpen: boolean;
  onClose: () => void;
  teacherId: string | null;
}

export function EditTeacherModal({ isOpen, onClose, teacherId }: EditTeacherModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phoneNumber: "",
    specialization: "",
    qualification: "",
    experience: 0,
    address: "",
    status: "active" as TeacherStatus,
    subjects: [] as string[],
    salary: 0,
  });
  const [newSubject, setNewSubject] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // جلب بيانات المعلم
  const teacher = useQuery(
    api.user.teachers.getTeacherById,
    teacherId ? { teacherId: teacherId as any } : "skip"
  );

  const updateTeacher = useMutation(api.user.teachers.updateTeacher);

  // تعبئة النموذج عند جلب البيانات
  useEffect(() => {
    if (teacher && isOpen) {
      // ✅ تحويل الحالة إلى النوع الصحيح للمعلمين
      let status: TeacherStatus = "active";
      if (teacher.status === "active" || teacher.status === "inactive" || teacher.status === "on_leave") {
        status = teacher.status as TeacherStatus;
      }

      setFormData({
        name: teacher.name || "",
        email: teacher.email || "",
        phoneNumber: teacher.phoneNumber || "",
        specialization: teacher.specialization || "",
        qualification: teacher.qualification || "",
        experience: teacher.experience || 0,
        address: teacher.address || "",
        status: status,
        subjects: teacher.subjects || [],
        salary: teacher.salary || 0,
      });
    }
  }, [teacher, isOpen]);

  // reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setFormData({
        name: "",
        email: "",
        phoneNumber: "",
        specialization: "",
        qualification: "",
        experience: 0,
        address: "",
        status: "active",
        subjects: [],
        salary: 0,
      });
      setNewSubject("");
      setErrors({});
    }
  }, [isOpen]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) {
      newErrors.name = "اسم المعلم مطلوب";
    }
    if (!formData.email.trim()) {
      newErrors.email = "البريد الإلكتروني مطلوب";
    }
    if (!formData.specialization.trim()) {
      newErrors.specialization = "التخصص مطلوب";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm() || !teacherId) return;

    setIsSubmitting(true);
    try {
      await updateTeacher({
        teacherId: teacherId as any,
        ...formData,
      });
      toast.success("✅ تم تحديث بيانات المعلم بنجاح");
      onClose();
    } catch (error: any) {
      toast.error(error.message || "حدث خطأ أثناء تحديث البيانات");
    } finally {
      setIsSubmitting(false);
    }
  };

  const addSubject = () => {
    if (newSubject.trim() && !formData.subjects.includes(newSubject.trim())) {
      setFormData({
        ...formData,
        subjects: [...formData.subjects, newSubject.trim()],
      });
      setNewSubject("");
    }
  };

  const removeSubject = (subject: string) => {
    setFormData({
      ...formData,
      subjects: formData.subjects.filter((s) => s !== subject),
    });
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-[#001f24] flex items-center gap-2">
            <User className="h-5 w-5 text-[#1a7a8a]" />
            تعديل بيانات المعلم
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          {/* المعلومات الشخصية */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-4 border-b pb-2">
              المعلومات الشخصية
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="flex items-center gap-1">
                  اسم المعلم <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <User className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className={`pr-10 ${errors.name ? "border-red-500" : ""}`}
                    placeholder="أدخل اسم المعلم"
                  />
                </div>
                {errors.name && (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" /> {errors.name}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-1">
                  البريد الإلكتروني <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Mail className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className={`pr-10 ${errors.email ? "border-red-500" : ""}`}
                    placeholder="teacher@example.com"
                  />
                </div>
                {errors.email && (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" /> {errors.email}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">رقم الهاتف</Label>
                <div className="relative">
                  <Phone className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="phone"
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                    className="pr-10"
                    placeholder="05XXXXXXXX"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">الحالة</Label>
                <select
                  id="status"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as TeacherStatus })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a7a8a]"
                >
                  <option value="active">نشط</option>
                  <option value="on_leave">في إجازة</option>
                  <option value="inactive">غير نشط</option>
                </select>
              </div>
            </div>
          </div>

          {/* المعلومات المهنية */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-4 border-b pb-2">
              المعلومات المهنية
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="specialization" className="flex items-center gap-1">
                  التخصص <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Briefcase className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="specialization"
                    value={formData.specialization}
                    onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                    className={`pr-10 ${errors.specialization ? "border-red-500" : ""}`}
                    placeholder="مثال: رياضيات، فيزياء"
                  />
                </div>
                {errors.specialization && (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" /> {errors.specialization}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="qualification">المؤهل العلمي</Label>
                <div className="relative">
                  <GraduationCap className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="qualification"
                    value={formData.qualification}
                    onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
                    className="pr-10"
                    placeholder="مثال: بكالوريوس، ماجستير"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="experience">سنوات الخبرة</Label>
                <div className="relative">
                  <Clock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="experience"
                    type="number"
                    min="0"
                    value={formData.experience}
                    onChange={(e) => setFormData({ ...formData, experience: parseInt(e.target.value) || 0 })}
                    className="pr-10"
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="salary">المرتب الشهري</Label>
                <div className="relative">
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">جنيه</span>
                  <Input
                    id="salary"
                    type="number"
                    min="0"
                    value={formData.salary}
                    onChange={(e) => setFormData({ ...formData, salary: parseInt(e.target.value) || 0 })}
                    className="pl-10"
                    placeholder="0"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* المواد */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-4 border-b pb-2">
              المواد الدراسية
            </h3>
            <div className="flex gap-2 mb-3">
              <Input
                value={newSubject}
                onChange={(e) => setNewSubject(e.target.value)}
                placeholder="أضف مادة جديدة..."
                className="flex-1"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addSubject();
                  }
                }}
              />
              <Button type="button" variant="outline" onClick={addSubject} className="shrink-0">
                <Plus className="h-4 w-4" />
                إضافة
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.subjects.map((subject) => (
                <span
                  key={subject}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-[#e0f5f7] text-[#1a7a8a] rounded-full text-sm"
                >
                  {subject}
                  <button
                    type="button"
                    onClick={() => removeSubject(subject)}
                    className="hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </span>
              ))}
              {formData.subjects.length === 0 && (
                <p className="text-sm text-gray-400">لا توجد مواد مضافة</p>
              )}
            </div>
          </div>

          {/* العنوان */}
          <div className="space-y-2">
            <Label htmlFor="address">العنوان</Label>
            <div className="relative">
              <MapPin className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="pr-10 resize-none"
                rows={2}
                placeholder="العنوان الكامل للمعلم"
              />
            </div>
          </div>

          {/* الأخطاء العامة */}
          {errors.submit && (
            <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              {errors.submit}
            </div>
          )}

          {/* Footer */}
          <DialogFooter className="gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              إلغاء
            </Button>
            <Button type="submit" disabled={isSubmitting} className="bg-[#001f24] hover:bg-[#03363d] text-white gap-2">
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  جاري الحفظ...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  حفظ التغييرات
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}