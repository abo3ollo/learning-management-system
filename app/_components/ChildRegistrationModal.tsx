// app/_components/ChildRegistrationModal.tsx

"use client";

import { useState, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Loader2, AlertCircle, Check,
  Search, UserPlus, Users, Mail,
} from "lucide-react";

interface ChildRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  parentId: string;
  onSuccess?: (childId: string, gradeId: string, childName: string) => void;
}

export function ChildRegistrationModal({
  isOpen,
  onClose,
  parentId,
  onSuccess,
}: ChildRegistrationModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    birthDate: "",
    gender: "",
    gradeId: "",
    groupId: "",
  });
  const [errors, setErrors]               = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting]   = useState(false);
  const [searchQuery, setSearchQuery]     = useState("");
  const [selectedStudentId, setSelectedStudentId]   = useState<string | null>(null);
  const [selectedStudentName, setSelectedStudentName] = useState<string>("");

  const grades = useQuery(api.grades.grades.getActiveGrades);
  const groups = useQuery(
    api.groups.groups.getGroupsByGrade,
    formData.gradeId ? { gradeId: formData.gradeId as any } : "skip"
  );
  const availableStudents = useQuery(
    api.user.students.getStudentsWithoutParent,
    { search: searchQuery || undefined }
  );

  const registerChild      = useMutation(api.user.students.registerStudent);
  const linkParentToStudent = useMutation(api.relationships.parentStudent.linkParentToStudent);

  useEffect(() => {
    if (!isOpen) {
      setFormData({ name: "", email: "", birthDate: "", gender: "", gradeId: "", groupId: "" });
      setSelectedStudentId(null);
      setSelectedStudentName("");
      setSearchQuery("");
      setErrors({});
    }
  }, [isOpen]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = "اسم الطفل مطلوب";
    if (!formData.email.trim()) {
      newErrors.email = "البريد الإلكتروني مطلوب";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "البريد الإلكتروني غير صحيح";
    }
    if (!formData.birthDate) newErrors.birthDate = "تاريخ الميلاد مطلوب";
    if (!formData.gender)    newErrors.gender    = "الجنس مطلوب";
    if (!formData.gradeId)   newErrors.gradeId   = "الصف الدراسي مطلوب";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ✅ FIX: تسجيل طالب جديد — لا تستدعي onClose بعد onSuccess
  const handleRegisterNew = async () => {
    if (!validateForm()) return;
    setIsSubmitting(true);
    try {
      const result = await registerChild({
        name:        formData.name,
        email:       formData.email,
        phoneNumber: "",
        birthDate:   new Date(formData.birthDate).getTime(),
        gender:      formData.gender as "male" | "female",
        gradeId:     formData.gradeId as any,
        groupId:     formData.groupId ? (formData.groupId as any) : undefined,
        parentId:    parentId as any,
      });

      const childId = result.userId as unknown as string;

      // ✅ فقط استدعاء onSuccess — الـ parent هيغلق المودال
      // ❌ لا تستدعي onClose() هنا — ده كان بيسبب redirect قبل الـ SubscriptionModal
      if (onSuccess) {
        onSuccess(childId, formData.gradeId, formData.name);
      }

    } catch (error: any) {
      setErrors({ submit: error.message || "حدث خطأ أثناء تسجيل الطفل" });
      setIsSubmitting(false);
    }
    // ✅ لا نعمل setIsSubmitting(false) في finally عشان المودال هيتغلق
  };

  // ✅ FIX: اختيار طالب موجود — لا تستدعي onClose بعد onSuccess
  const handleSelectExisting = async () => {
    if (!selectedStudentId) {
      setErrors({ submit: "يرجى اختيار طالب" });
      return;
    }
    setIsSubmitting(true);
    try {
      await linkParentToStudent({
        parentId:     parentId as any,
        studentId:    selectedStudentId as any,
        relationship: "guardian",
        isPrimary:    true,
        permissions: {
          viewGrades:           true,
          financialAccess:      true,
          pickupNotification:   false,
          emergencyContact:     true,
        },
      });

      const student   = availableStudents?.find((s: any) => s._id === selectedStudentId);
      const gradeId   = student?.gradeId || "";
      const childName = student?.name    || "الطفل";

      // ✅ فقط استدعاء onSuccess — الـ parent هيغلق المودال
      // ❌ لا تستدعي onClose() هنا
      if (onSuccess) {
        onSuccess(selectedStudentId, gradeId, childName);
      }

    } catch (error: any) {
      setErrors({ submit: error.message || "حدث خطأ أثناء ربط الطالب" });
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-lg" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-[#001f24]">
            <Users className="h-5 w-5 inline ml-2" />
            إضافة طفل
          </DialogTitle>
          <p className="text-sm text-gray-500">
            اختر من الطلاب الموجودين أو سجل طالب جديد
          </p>
        </DialogHeader>

        <Tabs defaultValue="existing" className="w-full">
          <TabsList className="grid grid-cols-2 mb-4">
            <TabsTrigger value="existing" className="flex items-center gap-2">
              <Users className="h-4 w-4" /> طلاب موجودين
            </TabsTrigger>
            <TabsTrigger value="new" className="flex items-center gap-2">
              <UserPlus className="h-4 w-4" /> تسجيل جديد
            </TabsTrigger>
          </TabsList>

          {/* ── اختيار طالب موجود ───────────────────────────── */}
          <TabsContent value="existing" className="space-y-4">
            <div className="space-y-2">
              <Label>البحث عن طالب</Label>
              <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="ابحث بالاسم أو البريد الإلكتروني..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pr-10"
                />
              </div>
            </div>

            {availableStudents === undefined ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-6 w-6 animate-spin text-[#1a7a8a]" />
              </div>
            ) : availableStudents.length === 0 ? (
              <div className="text-center py-6 text-sm text-gray-400">
                لا يوجد طلاب متاحون
              </div>
            ) : (
              <div className="max-h-48 overflow-y-auto space-y-2 border border-gray-200 rounded-lg p-2">
                {availableStudents.map((student: any) => (
                  <button
                    key={student._id}
                    onClick={() => {
                      setSelectedStudentId(student._id);
                      setSelectedStudentName(student.name);
                    }}
                    className={`w-full text-right p-3 rounded-lg border-2 transition-all ${
                      selectedStudentId === student._id
                        ? "border-[#1a7a8a] bg-[#e0f5f7]"
                        : "border-gray-100 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-[#001f24]">{student.name}</p>
                        <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                          <span>{student.email}</span>
                          <span>•</span>
                          <span>{student.gradeName || "بدون صف"}</span>
                          {student.studentId && (
                            <><span>•</span><span>رقم: {student.studentId}</span></>
                          )}
                        </div>
                      </div>
                      {selectedStudentId === student._id && (
                        <Check className="h-5 w-5 text-[#1a7a8a]" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}

            {errors.submit && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-center gap-2">
                <AlertCircle className="h-4 w-4" /> {errors.submit}
              </div>
            )}

            <Button
              onClick={handleSelectExisting}
              disabled={isSubmitting || !selectedStudentId}
              className="w-full bg-[#001f24] hover:bg-[#03363d] text-white gap-2"
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              إضافة الطالب
            </Button>
          </TabsContent>

          {/* ── تسجيل طالب جديد ─────────────────────────────── */}
          <TabsContent value="new" className="space-y-4">
            <div className="space-y-2">
              <Label>اسم الطفل <span className="text-red-500">*</span></Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="أدخل اسم الطفل"
                className={errors.name ? "border-red-500" : ""}
              />
              {errors.name && (
                <p className="text-xs text-red-500 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" /> {errors.name}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>البريد الإلكتروني <span className="text-red-500">*</span></Label>
              <div className="relative">
                <Mail className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="student@example.com"
                  className={errors.email ? "border-red-500 pr-10" : "pr-10"}
                />
              </div>
              {errors.email && (
                <p className="text-xs text-red-500 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" /> {errors.email}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>تاريخ الميلاد <span className="text-red-500">*</span></Label>
                <Input
                  type="date"
                  value={formData.birthDate}
                  onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                  className={errors.birthDate ? "border-red-500" : ""}
                />
                {errors.birthDate && (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" /> {errors.birthDate}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label>الجنس <span className="text-red-500">*</span></Label>
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a7a8a] bg-white ${
                    errors.gender ? "border-red-500" : "border-[#c0c8c9]"
                  }`}
                >
                  <option value="">اختر</option>
                  <option value="male">ذكر</option>
                  <option value="female">أنثى</option>
                </select>
                {errors.gender && (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" /> {errors.gender}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label>الصف الدراسي <span className="text-red-500">*</span></Label>
              <select
                value={formData.gradeId}
                onChange={(e) => setFormData({ ...formData, gradeId: e.target.value, groupId: "" })}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a7a8a] bg-white ${
                  errors.gradeId ? "border-red-500" : "border-[#c0c8c9]"
                }`}
              >
                <option value="">اختر الصف</option>
                {grades?.map((g: any) => (
                  <option key={g._id} value={g._id}>{g.name}</option>
                ))}
              </select>
              {errors.gradeId && (
                <p className="text-xs text-red-500 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" /> {errors.gradeId}
                </p>
              )}
            </div>

            {formData.gradeId && groups && groups.length > 0 && (
              <div className="space-y-2">
                <Label>المجموعة (اختياري)</Label>
                <select
                  value={formData.groupId}
                  onChange={(e) => setFormData({ ...formData, groupId: e.target.value })}
                  className="w-full px-3 py-2 border border-[#c0c8c9] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a7a8a] bg-white"
                >
                  <option value="">بدون مجموعة</option>
                  {groups.map((g: any) => (
                    <option key={g._id} value={g._id}>{g.name}</option>
                  ))}
                </select>
              </div>
            )}

            {errors.submit && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-center gap-2">
                <AlertCircle className="h-4 w-4" /> {errors.submit}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={onClose} className="flex-1">
                إلغاء
              </Button>
              <Button
                onClick={handleRegisterNew}
                disabled={isSubmitting}
                className="flex-1 bg-[#001f24] hover:bg-[#03363d] text-white gap-2"
              >
                {isSubmitting
                  ? <Loader2 className="h-4 w-4 animate-spin" />
                  : <Check className="h-4 w-4" />
                }
                تسجيل الطفل
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}