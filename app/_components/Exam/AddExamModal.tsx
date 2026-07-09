// app/_components/Exam/AddExamModal.tsx

"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  X,
  Plus,
  Trash2,
  AlertCircle,
  Loader2,
  BookOpen,
  Send,
  Save,
  GraduationCap,
  School,
  ListChecks,
  Search,
  Check,
  FileQuestion,
  Calendar,
  Clock,
  Layers,
  Users,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

interface AddExamModalProps {
  isOpen: boolean;
  onClose: () => void;
  editExamId?: string | null;
  onSuccess?: () => void;
}

export function AddExamModal({ isOpen, onClose, editExamId, onSuccess }: AddExamModalProps) {
  // ✅ جلب البيانات - استخدام grades و groups بدلاً من courses و classes
  const grades = useQuery(api.grades.grades.getActiveGrades, {});
  const groups = useQuery(api.groups.groups.getGroups, {});
  
  // ✅ جلب جميع الأسئلة المنشورة
  const questions = useQuery(
    api.questions.questions.getQuestions,
    { status: "published" }
  );

  const createExam = useMutation(api.exams.exams.createExam);
  const updateExam = useMutation(api.exams.exams.updateExam);

  // ✅ State
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    model: "",
    gradeId: "",           // ✅ بدلاً من courseId
    groupIds: [] as string[], // ✅ بدلاً من classIds
    grade: "",
    subject: "",
    totalMarks: 0,
    duration: 60,
    date: "",
    instructions: "",
    footerText: "",
    headerBorderColor: "#1a7a8a",
    showInstructions: true,
    showAnswerSheet: true,
    showQrCode: true,
    status: "draft" as "draft" | "published" | "archived",
  });

  // ✅ State للأسئلة
  const [selectedQuestions, setSelectedQuestions] = useState<{
    questionId: string;
    marks: number;
    order: number;
  }[]>([]);
  const [isQuestionDialogOpen, setIsQuestionDialogOpen] = useState(false);
  const [questionSearch, setQuestionSearch] = useState("");
  const [questionDifficulty, setQuestionDifficulty] = useState<string>("all");
  const [questionType, setQuestionType] = useState<string>("all");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState<"basic" | "settings" | "questions">("basic");

  const normalizeGradeValue = (gradeValue: unknown) => {
    if (typeof gradeValue === "string") {
      return gradeValue;
    }

    if (
      gradeValue &&
      typeof gradeValue === "object" &&
      "name" in gradeValue &&
      typeof (gradeValue as { name?: unknown }).name === "string"
    ) {
      return (gradeValue as { name: string }).name;
    }

    return "";
  };

  // ✅ Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setFormData({
        title: "",
        description: "",
        model: "",
        gradeId: "",
        groupIds: [],
        grade: "",
        subject: "",
        totalMarks: 0,
        duration: 60,
        date: "",
        instructions: "",
        footerText: "",
        headerBorderColor: "#1a7a8a",
        showInstructions: true,
        showAnswerSheet: true,
        showQrCode: true,
        status: "draft",
      });
      setSelectedQuestions([]);
      setErrors({});
      setActiveTab("basic");
    }
  }, [isOpen]);

  // ✅ جلب بيانات الامتحان للتعديل
  const editExam = useQuery(
    api.exams.exams.getExamById,
    editExamId && isOpen ? { examId: editExamId as any } : "skip"
  );

  // ✅ تعبئة النموذج عند التعديل
  useEffect(() => {
    if (editExam && isOpen) {
      setFormData({
        title: editExam.title || "",
        description: editExam.description || "",
        model: editExam.model || "",
        gradeId: editExam.gradeId || "",
        groupIds: editExam.groupIds || [],
        grade: normalizeGradeValue(editExam.grade),
        subject: editExam.subject || "",
        totalMarks: editExam.totalMarks || 0,
        duration: editExam.duration || 60,
        date: editExam.date ? new Date(editExam.date).toISOString().slice(0, 16) : "",
        instructions: editExam.instructions || "",
        footerText: editExam.footerText || "",
        headerBorderColor: editExam.headerBorderColor || "#1a7a8a",
        showInstructions: editExam.showInstructions ?? true,
        showAnswerSheet: editExam.showAnswerSheet ?? true,
        showQrCode: editExam.showQrCode ?? true,
        status: editExam.status || "draft",
      });
      if (editExam.questions) {
        setSelectedQuestions(editExam.questions);
      }
    }
  }, [editExam, isOpen]);

  // ✅ حساب المجموع الكلي للدرجات
  const getTotalMarks = () => {
    return selectedQuestions.reduce((sum, q) => sum + q.marks, 0);
  };

  // ✅ دوال الأسئلة
  const toggleQuestion = (questionId: string) => {
    const existing = selectedQuestions.find(q => q.questionId === questionId);
    if (existing) {
      setSelectedQuestions(prev => prev.filter(q => q.questionId !== questionId));
    } else {
      const question = questions?.find((q: any) => q._id === questionId);
      setSelectedQuestions(prev => [
        ...prev,
        {
          questionId,
          marks: question?.points || 1,
          order: prev.length + 1,
        }
      ]);
    }
  };

  const removeQuestion = (questionId: string) => {
    setSelectedQuestions(prev => {
      const filtered = prev.filter(q => q.questionId !== questionId);
      return filtered.map((q, index) => ({
        ...q,
        order: index + 1,
      }));
    });
  };

  const updateQuestionMarks = (questionId: string, marks: number) => {
    setSelectedQuestions(prev =>
      prev.map(q =>
        q.questionId === questionId ? { ...q, marks } : q
      )
    );
  };

  const toggleGroup = (groupId: string) => {
    setFormData((prev) => ({
      ...prev,
      groupIds: prev.groupIds.includes(groupId)
        ? prev.groupIds.filter((id) => id !== groupId)
        : [...prev.groupIds, groupId],
    }));
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "easy": return "bg-green-100 text-green-700";
      case "medium": return "bg-amber-100 text-amber-700";
      case "hard": return "bg-red-100 text-red-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  const getTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      mcq: "اختيار من متعدد",
      true_false: "صح/خطأ",
      essay: "مقالي",
      fill_blank: "ملء الفراغ",
      matching: "مطابقة",
    };
    return types[type] || type;
  };

  const getDifficultyLabel = (difficulty: string) => {
    switch (difficulty) {
      case "easy": return "سهل";
      case "medium": return "متوسط";
      case "hard": return "صعب";
      default: return difficulty;
    }
  };

  // ✅ التحقق من صحة النموذج
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = "عنوان الامتحان مطلوب";
    }
    if (!formData.gradeId) {
      newErrors.gradeId = "يرجى اختيار الصف";
    }
    if (formData.groupIds.length === 0) {
      newErrors.groupIds = "يرجى اختيار مجموعة واحدة على الأقل";
    }
    if (!formData.date) {
      newErrors.date = "تاريخ الامتحان مطلوب";
    }
    if (selectedQuestions.length === 0) {
      newErrors.questions = "يرجى اختيار سؤال واحد على الأقل";
    }
    if (!formData.duration || formData.duration < 1) {
      newErrors.duration = "مدة الامتحان مطلوبة";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };


// ✅ في handleSubmit
const handleSubmit = async (status: "draft" | "published") => {
  if (!validateForm()) return;

  setIsSubmitting(true);
  try {
    const data = {
      title: formData.title,
      description: formData.description || undefined,
      model: formData.model || `النموذج ${String.fromCharCode(65 + Math.floor(Math.random() * 26))}`,
      grade: formData.grade || "غير محدد",
      subject: formData.subject || "غير محدد",
      gradeId: formData.gradeId as any,
      groupIds: formData.groupIds as any,
      totalMarks: getTotalMarks(),
      duration: formData.duration,
      date: new Date(formData.date).getTime(),
      instructions: formData.instructions || undefined,
      footerText: formData.footerText || undefined,
      headerBorderColor: formData.headerBorderColor,
      showInstructions: formData.showInstructions,
      showAnswerSheet: formData.showAnswerSheet,
      showQrCode: formData.showQrCode,
      status: status,
      questions: selectedQuestions.map(q => ({
        questionId: q.questionId as any,
        marks: q.marks,
        order: q.order,
      })),
    };

    if (editExamId) {
      await updateExam({ examId: editExamId as any, ...data });
    } else {
      await createExam(data);
    }

    onClose();
  } catch (error) {
    console.error("Error saving exam:", error);
    setErrors({ submit: "حدث خطأ أثناء حفظ الامتحان" });
  } finally {
    setIsSubmitting(false);
  }
};

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="sticky top-0 bg-linear-to-r from-[#001f24] to-[#03363d] px-6 py-4 flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-xl font-bold text-white">
              {editExamId ? "تعديل الامتحان" : "إنشاء ورقة امتحان"}
            </h2>
            <p className="text-[#a3ced6] text-sm mt-0.5">
              إنشاء ورقة امتحان مع أسئلة من بنك الأسئلة
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
            <X className="h-5 w-5 text-white" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[#c0c8c9] bg-[#f7fafa] px-6 shrink-0">
          <button
            onClick={() => setActiveTab("basic")}
            className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
              activeTab === "basic"
                ? "border-[#1a7a8a] text-[#1a7a8a]"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            <BookOpen className="h-4 w-4 inline ml-2" />
            المعلومات الأساسية
          </button>
          <button
            onClick={() => setActiveTab("settings")}
            className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
              activeTab === "settings"
                ? "border-[#1a7a8a] text-[#1a7a8a]"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            <Calendar className="h-4 w-4 inline ml-2" />
            الإعدادات
          </button>
          <button
            onClick={() => setActiveTab("questions")}
            className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
              activeTab === "questions"
                ? "border-[#1a7a8a] text-[#1a7a8a]"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            <ListChecks className="h-4 w-4 inline ml-2" />
            الأسئلة ({selectedQuestions.length})
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === "basic" && (
            <div className="space-y-4">
              {/* العنوان */}
              <div className="space-y-2">
                <Label htmlFor="title" className="flex items-center gap-1">
                  عنوان الامتحان <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className={errors.title ? "border-red-500" : ""}
                  placeholder="أدخل عنوان الامتحان"
                />
                {errors.title && (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" /> {errors.title}
                  </p>
                )}
              </div>

              {/* الوصف */}
              <div className="space-y-2">
                <Label htmlFor="description">الوصف</Label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-[#c0c8c9] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a7a8a] resize-none"
                  rows={3}
                  placeholder="وصف الامتحان..."
                />
              </div>

              {/* ✅ الصف - اختيار منفرد */}
              <div className="space-y-2">
                <Label className="flex items-center gap-1">
                  <Layers className="h-4 w-4 text-[#1a7a8a]" />
                  الصف <span className="text-red-500">*</span>
                </Label>
                <select
                  value={formData.gradeId}
                  onChange={(e) => setFormData({ ...formData, gradeId: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a7a8a] bg-white ${errors.gradeId ? "border-red-500" : "border-[#c0c8c9]"}`}
                >
                  <option value="">اختر الصف</option>
                  {grades?.map((grade: any) => (
                    <option key={grade._id} value={grade._id}>
                      {grade.name}
                    </option>
                  ))}
                </select>
                {errors.gradeId && (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" /> {errors.gradeId}
                  </p>
                )}
                {grades?.length === 0 && (
                  <p className="text-xs text-amber-600">
                    ⚠️ لا توجد صفوف متاحة. قم بإنشاء صف أولاً
                  </p>
                )}
              </div>

              {/* ✅ المجموعات - اختيار متعدد */}
              <div className="space-y-2">
                <Label className="flex items-center gap-1">
                  <Users className="h-4 w-4 text-[#1a7a8a]" />
                  المجموعات <span className="text-red-500">*</span>
                  <span className="text-xs text-gray-400">(يمكنك اختيار أكثر من مجموعة)</span>
                </Label>
                <div className="flex flex-wrap gap-2 p-3 border border-[#c0c8c9] rounded-lg max-h-32 overflow-y-auto bg-white">
                  {groups?.filter((g: any) => g.gradeId === formData.gradeId).map((group: any) => (
                    <button
                      key={group._id}
                      onClick={() => toggleGroup(group._id)}
                      className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                        formData.groupIds.includes(group._id)
                          ? "bg-[#1a7a8a] text-white hover:bg-[#15707e]"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      {group.name} - {group.subject}
                    </button>
                  ))}
                  {(!groups || groups.length === 0) && (
                    <p className="text-sm text-gray-500 w-full text-center py-2">
                      لا توجد مجموعات متاحة. قم بإنشاء مجموعة أولاً
                    </p>
                  )}
                  {formData.gradeId && groups?.filter((g: any) => g.gradeId === formData.gradeId).length === 0 && (
                    <p className="text-sm text-gray-500 w-full text-center py-2">
                      لا توجد مجموعات في هذا الصف
                    </p>
                  )}
                  {!formData.gradeId && (
                    <p className="text-sm text-gray-400 w-full text-center py-2">
                      يرجى اختيار الصف أولاً لعرض المجموعات المتاحة
                    </p>
                  )}
                </div>
                {errors.groupIds && (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" /> {errors.groupIds}
                  </p>
                )}
                <p className="text-xs text-gray-400">
                  اختر المجموعة/المجموعات التي ستقدم هذا الامتحان فيها
                </p>
              </div>

              {/* النموذج والصف والمادة */}
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="model">النموذج</Label>
                  <Input
                    id="model"
                    value={formData.model}
                    onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                    placeholder="مثال: النموذج أ"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="grade">الصف الدراسي (للطباعة)</Label>
                  <Input
                    id="grade"
                    value={formData.grade}
                    onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                    placeholder="مثال: الصف العاشر"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subject">المادة (للطباعة)</Label>
                  <Input
                    id="subject"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    placeholder="مثال: الرياضيات"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === "settings" && (
            <div className="space-y-4">
              {/* التاريخ والمدة */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date" className="flex items-center gap-1">
                    تاريخ الامتحان <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="date"
                    type="datetime-local"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className={errors.date ? "border-red-500" : ""}
                  />
                  {errors.date && (
                    <p className="text-xs text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" /> {errors.date}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="duration" className="flex items-center gap-1">
                    المدة (دقيقة) <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="duration"
                    type="number"
                    min="1"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || 60 })}
                    className={errors.duration ? "border-red-500" : ""}
                  />
                  {errors.duration && (
                    <p className="text-xs text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" /> {errors.duration}
                    </p>
                  )}
                </div>
              </div>

              {/* التعليمات */}
              <div className="space-y-2">
                <Label htmlFor="instructions">تعليمات الامتحان</Label>
                <textarea
                  id="instructions"
                  value={formData.instructions}
                  onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                  className="w-full px-3 py-2 border border-[#c0c8c9] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a7a8a] resize-none"
                  rows={3}
                  placeholder="أدخل تعليمات الامتحان..."
                />
              </div>

              {/* تذييل الصفحة */}
              <div className="space-y-2">
                <Label htmlFor="footerText">نص التذييل</Label>
                <Input
                  id="footerText"
                  value={formData.footerText}
                  onChange={(e) => setFormData({ ...formData, footerText: e.target.value })}
                  placeholder="مثال: نهاية الامتحان - بالتوفيق"
                />
              </div>

              {/* خيارات العرض */}
              <div className="space-y-4">
                <Label>خيارات العرض</Label>
                <div className="grid grid-cols-2 gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.showInstructions}
                      onChange={(e) => setFormData({ ...formData, showInstructions: e.target.checked })}
                      className="w-4 h-4 text-[#1a7a8a]"
                    />
                    <span className="text-sm text-gray-700">إظهار التعليمات</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.showAnswerSheet}
                      onChange={(e) => setFormData({ ...formData, showAnswerSheet: e.target.checked })}
                      className="w-4 h-4 text-[#1a7a8a]"
                    />
                    <span className="text-sm text-gray-700">ورقة الإجابة</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.showQrCode}
                      onChange={(e) => setFormData({ ...formData, showQrCode: e.target.checked })}
                      className="w-4 h-4 text-[#1a7a8a]"
                    />
                    <span className="text-sm text-gray-700">رمز QR</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-700">لون الحدود:</span>
                    <input
                      type="color"
                      value={formData.headerBorderColor}
                      onChange={(e) => setFormData({ ...formData, headerBorderColor: e.target.value })}
                      className="w-10 h-10 rounded border border-gray-300 cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "questions" && (
            <div className="space-y-4">
              {/* إحصائيات الأسئلة */}
              <div className="bg-[#f7fafa] rounded-lg p-4 border border-[#c0c8c9]">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-[#1a7a8a]">{selectedQuestions.length}</p>
                    <p className="text-xs text-gray-500">عدد الأسئلة</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-[#1a7a8a]">{getTotalMarks()}</p>
                    <p className="text-xs text-gray-500">إجمالي الدرجات</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-[#1a7a8a]">
                      {selectedQuestions.length > 0 ? Math.round(getTotalMarks() / selectedQuestions.length) : 0}
                    </p>
                    <p className="text-xs text-gray-500">متوسط الدرجات</p>
                  </div>
                </div>
              </div>

              {/* زر إضافة أسئلة */}
              <Button
                type="button"
                onClick={() => setIsQuestionDialogOpen(true)}
                className="w-full bg-[#1a7a8a] hover:bg-[#15707e] text-white"
              >
                <Plus className="h-4 w-4 ml-2" />
                إضافة أسئلة من بنك الأسئلة
              </Button>

              {errors.questions && (
                <p className="text-xs text-red-500 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" /> {errors.questions}
                </p>
              )}

              {/* قائمة الأسئلة المختارة */}
              {selectedQuestions.length > 0 ? (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {selectedQuestions.map((item) => {
                    const question = questions?.find((q: any) => q._id === item.questionId);
                    if (!question) return null;
                    return (
                      <div
                        key={item.questionId}
                        className="flex items-start gap-3 p-4 bg-white rounded-lg border border-[#c0c8c9] hover:border-[#1a7a8a] transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-[#1a7a8a]">
                              س{item.order}
                            </span>
                            <p className="text-sm font-medium text-[#001f24]">
                              {question.title}
                            </p>
                          </div>
                          <p className="text-xs text-gray-500 line-clamp-2 mt-0.5">
                            {question.questionText}
                          </p>
                          <div className="flex flex-wrap gap-2 mt-1">
                            <span className="text-xs text-gray-500">
                              {getTypeLabel(question.type)}
                            </span>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${getDifficultyColor(question.difficulty)}`}>
                              {getDifficultyLabel(question.difficulty)}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-20">
                            <Input
                              type="number"
                              min="1"
                              value={item.marks}
                              onChange={(e) => updateQuestionMarks(item.questionId, parseInt(e.target.value) || 1)}
                              className="h-8 text-center"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => removeQuestion(item.questionId)}
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12 bg-[#f7fafa] rounded-lg border border-dashed border-[#c0c8c9]">
                  <FileQuestion className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                  <p className="text-gray-500">لا توجد أسئلة مضافة</p>
                  <p className="text-sm text-gray-400">اضغط على "إضافة أسئلة من بنك الأسئلة"</p>
                </div>
              )}
            </div>
          )}

          {errors.submit && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              {errors.submit}
            </div>
          )}
        </div>

        {/* Dialog لإضافة الأسئلة */}
        <Dialog open={isQuestionDialogOpen} onOpenChange={setIsQuestionDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-[#001f24]">
                <ListChecks className="h-5 w-5 inline ml-2" />
                بنك الأسئلة
                <span className="text-sm font-normal text-gray-500 mr-2">
                  (اختر الأسئلة المطلوبة للامتحان)
                </span>
              </DialogTitle>
            </DialogHeader>

            <div className="flex-1 overflow-hidden flex flex-col">
              {/* فلاتر الأسئلة */}
              <div className="flex flex-wrap gap-2 mb-4">
                <div className="flex-1 min-w-40 relative">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="بحث عن سؤال..."
                    value={questionSearch}
                    onChange={(e) => setQuestionSearch(e.target.value)}
                    className="pr-10"
                  />
                </div>
                <select
                  value={questionDifficulty}
                  onChange={(e) => setQuestionDifficulty(e.target.value)}
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#1a7a8a] bg-white"
                >
                  <option value="all">جميع المستويات</option>
                  <option value="easy">سهل</option>
                  <option value="medium">متوسط</option>
                  <option value="hard">صعب</option>
                </select>
                <select
                  value={questionType}
                  onChange={(e) => setQuestionType(e.target.value)}
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#1a7a8a] bg-white"
                >
                  <option value="all">جميع الأنواع</option>
                  <option value="mcq">اختيار من متعدد</option>
                  <option value="true_false">صح/خطأ</option>
                  <option value="essay">مقالي</option>
                  <option value="fill_blank">ملء الفراغ</option>
                  <option value="matching">مطابقة</option>
                </select>
              </div>

              {/* قائمة الأسئلة */}
              <div className="flex-1 overflow-y-auto space-y-2">
                {questions?.length === 0 ? (
                  <div className="text-center py-12">
                    <FileQuestion className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                    <p className="text-gray-500">لا توجد أسئلة في بنك الأسئلة</p>
                    <p className="text-sm text-gray-400">قم بإنشاء أسئلة في بنك الأسئلة أولاً</p>
                  </div>
                ) : (
                  questions?.map((question: any) => {
                    const isSelected = selectedQuestions.some(q => q.questionId === question._id);
                    return (
                      <div
                        key={question._id}
                        className={`flex items-start gap-3 p-3 rounded-lg border transition-all cursor-pointer hover:shadow-sm ${
                          isSelected
                            ? "border-[#1a7a8a] bg-[#e0f5f7]"
                            : "border-[#c0c8c9] hover:border-[#1a7a8a]"
                        }`}
                        onClick={() => toggleQuestion(question._id)}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-[#001f24]">
                              {question.title}
                            </p>
                            {isSelected && (
                              <Check className="h-4 w-4 text-[#1a7a8a]" />
                            )}
                          </div>
                          {question.questionText && (
                            <p className="text-xs text-gray-500 line-clamp-2 mt-0.5">
                              {question.questionText}
                            </p>
                          )}
                          <div className="flex flex-wrap gap-2 mt-1">
                            <span className="text-xs text-gray-500">
                              {getTypeLabel(question.type)}
                            </span>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${getDifficultyColor(question.difficulty)}`}>
                              {getDifficultyLabel(question.difficulty)}
                            </span>
                            <span className="text-xs text-gray-500">
                              {question.points} نقطة
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* زر الإغلاق */}
              <div className="border-t pt-4 mt-4 flex justify-between items-center">
                <span className="text-sm text-gray-500">
                  تم اختيار {selectedQuestions.length} سؤال (إجمالي {getTotalMarks()} نقطة)
                </span>
                <Button
                  onClick={() => setIsQuestionDialogOpen(false)}
                  className="bg-[#001f24] hover:bg-[#03363d] text-white"
                >
                  تم الاختيار
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Footer */}
        <div className="border-t border-[#c0c8c9] px-6 py-4 flex justify-end gap-3 bg-[#f7fafa] shrink-0">
          <Button variant="outline" onClick={onClose}>
            إلغاء
          </Button>
          <Button
            onClick={() => handleSubmit("draft")}
            disabled={isSubmitting}
            variant="outline"
            className="border-amber-500 text-amber-600 hover:bg-amber-50"
          >
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 ml-2" />}
            حفظ كمسودة
          </Button>
          <Button
            onClick={() => handleSubmit("published")}
            disabled={isSubmitting}
            className="bg-[#001f24] hover:bg-[#03363d] text-white"
          >
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4 ml-2" />}
            حفظ ونشر
          </Button>
        </div>
      </div>
    </div>
  );
}