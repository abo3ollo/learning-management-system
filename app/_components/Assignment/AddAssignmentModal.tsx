// app/_components/Assignment/AddAssignmentModal.tsx
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
  Upload,
  File,
  Calendar as CalendarIcon,
  BookOpen,
  Send,
  Save,
  GraduationCap,
  School,
  ListChecks,
  Search,
  Check,
  FileQuestion,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

interface AddAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  editAssignmentId?: string | null;
}

interface Attachment {
  id?: string;
  name: string;
  url: string;
  size: number;
  type: string;
}

interface Question {
  _id: string;
  title: string;
  questionText: string;
  type: "mcq" | "true_false" | "essay" | "fill_blank" | "matching";
  difficulty: "easy" | "medium" | "hard";
  points: number;
  options?: { id: string; text: string; isCorrect: boolean }[];
  status: "draft" | "published" | "archived";
}

interface AssignmentType {
  _id?: string;
  title?: string;
  description?: string;
  courseId?: string;
  classIds?: string[];
  type?: string;
  maxAttempts?: number;
  allowResubmission?: boolean;
  isGroupWork?: boolean;
  maxGroupSize?: number;
  showGrade?: boolean;
  location?: string;
  logic?: string;
  startDate?: number;
  dueDate?: number;
  weight?: number;
  fullGrade?: number;
  passingGrade?: number;
  allowLateSubmission?: boolean;
  lateSubmissionPenalty?: number;
  attachments?: Attachment[];
  allowedFileTypes?: string[];
  maxFileSize?: number;
  status?: "draft" | "published" | "archived";
  questions?: string[];
}

export function AddAssignmentModal({ isOpen, onClose, editAssignmentId }: AddAssignmentModalProps) {
  // ✅ جلب البيانات
  const courses = useQuery(api.courses.courses.getCourses, {});
  const classes = useQuery(api.classes.classes.getClasses, {});

  const editAssignment = useQuery(
    api.assignments.assignments.getAssignmentById,
    editAssignmentId ? { assignmentId: editAssignmentId as any } : "skip"
  ) as AssignmentType | undefined;

  const createAssignment = useMutation(api.assignments.assignments.createAssignment);
  const updateAssignment = useMutation(api.assignments.assignments.updateAssignment);

  // ✅ State
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    courseId: "",
    classIds: [] as string[],
    type: "assignment",
    maxAttempts: "",
    allowResubmission: true,
    isGroupWork: false,
    maxGroupSize: "",
    showGrade: true,
    location: "",
    logic: "",
    startDate: "",
    dueDate: "",
    weight: "",
    fullGrade: "",
    passingGrade: "",
    allowLateSubmission: true,
    lateSubmissionPenalty: "",
    allowedFileTypes: "",
    maxFileSize: "",
    status: "draft" as "draft" | "published",
  });
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState<"basic" | "schedule" | "files">("basic");

  // ✅ State للأسئلة
  const [selectedQuestions, setSelectedQuestions] = useState<string[]>([]);
  const [isQuestionDialogOpen, setIsQuestionDialogOpen] = useState(false);
  const [questionSearch, setQuestionSearch] = useState("");
  const [questionDifficulty, setQuestionDifficulty] = useState<string>("all");
  const [questionType, setQuestionType] = useState<string>("all");

  // ✅ جلب جميع الأسئلة المنشورة (بدون الحاجة لاختيار مادة)
  const questions = useQuery(
    api.questions.questions.getQuestions,
    {
      status: "published",
      search: questionSearch || undefined,
      difficulty: questionDifficulty !== "all" ? questionDifficulty as any : undefined,
      type: questionType !== "all" ? questionType as any : undefined,
    }
  );

  // ✅ تعبئة النموذج عند التعديل
  useEffect(() => {
    if (editAssignment) {
      setFormData({
        title: editAssignment.title || "",
        description: editAssignment.description || "",
        courseId: editAssignment.courseId || "",
        classIds: editAssignment.classIds || [],
        type: editAssignment.type || "assignment",
        maxAttempts: editAssignment.maxAttempts?.toString() || "",
        allowResubmission: editAssignment.allowResubmission ?? true,
        isGroupWork: editAssignment.isGroupWork ?? false,
        maxGroupSize: editAssignment.maxGroupSize?.toString() || "",
        showGrade: editAssignment.showGrade ?? true,
        location: editAssignment.location || "",
        logic: editAssignment.logic || "",
        startDate: editAssignment.startDate ? new Date(editAssignment.startDate).toISOString().slice(0, 16) : "",
        dueDate: editAssignment.dueDate ? new Date(editAssignment.dueDate).toISOString().slice(0, 16) : "",
        weight: editAssignment.weight?.toString() || "",
        fullGrade: editAssignment.fullGrade?.toString() || "",
        passingGrade: editAssignment.passingGrade?.toString() || "",
        allowLateSubmission: editAssignment.allowLateSubmission ?? true,
        lateSubmissionPenalty: editAssignment.lateSubmissionPenalty?.toString() || "",
        allowedFileTypes: editAssignment.allowedFileTypes?.join(", ") || "",
        maxFileSize: editAssignment.maxFileSize?.toString() || "",
        status: (editAssignment.status === "draft" || editAssignment.status === "published")
          ? editAssignment.status
          : "draft",
      });
      if (editAssignment.attachments) {
        setAttachments(editAssignment.attachments);
      }
      if (editAssignment.questions) {
        setSelectedQuestions(editAssignment.questions);
      }
    }
  }, [editAssignment]);

  if (!isOpen) return null;

  // ✅ دوال مساعدة
  const toggleClass = (classId: string) => {
    setFormData((prev) => ({
      ...prev,
      classIds: prev.classIds.includes(classId)
        ? prev.classIds.filter((id) => id !== classId)
        : [...prev.classIds, classId],
    }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newAttachments: Attachment[] = [];
    for (const file of Array.from(files)) {
      newAttachments.push({
        id: Date.now().toString() + Math.random().toString(36).substring(2, 9),
        name: file.name,
        url: URL.createObjectURL(file),
        size: file.size,
        type: file.type,
      });
    }
    setAttachments((prev) => [...prev, ...newAttachments]);
    e.target.value = "";
  };

  const removeAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  // ✅ دوال الأسئلة
  const toggleQuestion = (questionId: string) => {
    setSelectedQuestions((prev) =>
      prev.includes(questionId)
        ? prev.filter((id) => id !== questionId)
        : [...prev, questionId]
    );
  };

  const removeQuestion = (questionId: string) => {
    setSelectedQuestions((prev) => prev.filter((id) => id !== questionId));
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

  const getTotalPoints = () => {
    if (!questions || selectedQuestions.length === 0) return 0;
    let total = 0;
    for (const qId of selectedQuestions) {
      const q = questions.find((q: any) => q._id === qId);
      if (q) total += q.points;
    }
    return total;
  };

  // ✅ التحقق من صحة النموذج
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = "عنوان الواجب مطلوب";
    }
    if (!formData.courseId) {
      newErrors.courseId = "يرجى اختيار المادة";
    }
    if (formData.classIds.length === 0) {
      newErrors.classIds = "يرجى اختيار فصل واحد على الأقل";
    }
    if (!formData.startDate) {
      newErrors.startDate = "تاريخ البداية مطلوب";
    }
    if (!formData.dueDate) {
      newErrors.dueDate = "تاريخ التسليم مطلوب";
    }
    if (!formData.weight || parseFloat(formData.weight) <= 0) {
      newErrors.weight = "الوزن مطلوب";
    }
    if (!formData.fullGrade || parseFloat(formData.fullGrade) <= 0) {
      newErrors.fullGrade = "الدرجة الكاملة مطلوبة";
    } else if (parseFloat(formData.fullGrade) > 1000) {
      newErrors.fullGrade = "الدرجة الكاملة يجب أن تكون أقل من 1000";
    }
    if (!formData.passingGrade || parseFloat(formData.passingGrade) <= 0) {
      newErrors.passingGrade = "درجة النجاح مطلوبة";
    } else if (parseFloat(formData.passingGrade) > parseFloat(formData.fullGrade || "0")) {
      newErrors.passingGrade = "درجة النجاح يجب أن تكون أقل من أو تساوي الدرجة الكاملة";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (status: "draft" | "published") => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const data = {
        title: formData.title,
        description: formData.description || undefined,
        courseId: formData.courseId as any,
        classIds: formData.classIds as any,
        type: formData.type as any,
        maxAttempts: formData.maxAttempts ? parseInt(formData.maxAttempts) : undefined,
        allowResubmission: formData.allowResubmission,
        isGroupWork: formData.isGroupWork,
        maxGroupSize: formData.maxGroupSize ? parseInt(formData.maxGroupSize) : undefined,
        showGrade: formData.showGrade,
        location: formData.location || undefined,
        logic: formData.logic || undefined,
        startDate: new Date(formData.startDate).getTime(),
        dueDate: new Date(formData.dueDate).getTime(),
        weight: parseFloat(formData.weight),
        fullGrade: parseFloat(formData.fullGrade),
        passingGrade: parseFloat(formData.passingGrade),
        allowLateSubmission: formData.allowLateSubmission,
        lateSubmissionPenalty: formData.lateSubmissionPenalty ? parseFloat(formData.lateSubmissionPenalty) : undefined,
        attachments: attachments,
        allowedFileTypes: formData.allowedFileTypes ? formData.allowedFileTypes.split(",").map(s => s.trim()) : [],
        maxFileSize: formData.maxFileSize ? parseInt(formData.maxFileSize) : undefined,
        status: status,
        questions: selectedQuestions as any,
      };

      if (editAssignmentId) {
        await updateAssignment({ assignmentId: editAssignmentId as any, ...data });
      } else {
        await createAssignment(data);
      }

      onClose();
    } catch (error) {
      console.error("Error saving assignment:", error);
      setErrors({ submit: "حدث خطأ أثناء حفظ الواجب" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="sticky top-0 bg-linear-to-r from-[#001f24] to-[#03363d] px-6 py-4 flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-xl font-bold text-white">
              {editAssignmentId ? "تعديل الواجب" : "إنشاء واجب"}
            </h2>
            <p className="text-[#a3ced6] text-sm mt-0.5">
              {editAssignmentId ? "تحديث تفاصيل الواجب" : "إنشاء واجب أو تكليف جديد للطلاب"}
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
            className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 ${activeTab === "basic"
                ? "border-[#1a7a8a] text-[#1a7a8a]"
                : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
          >
            <BookOpen className="h-4 w-4 inline ml-2" />
            المعلومات الأساسية
          </button>
          <button
            onClick={() => setActiveTab("schedule")}
            className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 ${activeTab === "schedule"
                ? "border-[#1a7a8a] text-[#1a7a8a]"
                : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
          >
            <CalendarIcon className="h-4 w-4 inline ml-2" />
            جدول التقييم
          </button>
          <button
            onClick={() => setActiveTab("files")}
            className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 ${activeTab === "files"
                ? "border-[#1a7a8a] text-[#1a7a8a]"
                : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
          >
            <Upload className="h-4 w-4 inline ml-2" />
            المرفقات
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === "basic" && (
            <div className="space-y-4">
              {/* العنوان */}
              <div className="space-y-2">
                <Label htmlFor="title" className="flex items-center gap-1">
                  العنوان <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className={errors.title ? "border-red-500" : ""}
                  placeholder="أدخل عنوان الواجب"
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
                  placeholder="وصف الواجب..."
                />
              </div>

              {/* المادة */}
              <div className="space-y-2">
                <Label className="flex items-center gap-1">
                  <GraduationCap className="h-4 w-4 text-[#1a7a8a]" />
                  المادة <span className="text-red-500">*</span>
                </Label>
                <select
                  value={formData.courseId}
                  onChange={(e) => setFormData({ ...formData, courseId: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a7a8a] bg-white ${errors.courseId ? "border-red-500" : "border-[#c0c8c9]"
                    }`}
                >
                  <option value="">اختر المادة</option>
                  {courses?.map((course: any) => (
                    <option key={course._id} value={course._id}>
                      {course.title}
                    </option>
                  ))}
                </select>
                {errors.courseId && (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" /> {errors.courseId}
                  </p>
                )}
                {courses?.length === 0 && (
                  <p className="text-xs text-amber-600">
                    ⚠️ لا توجد مواد متاحة. قم بإنشاء مادة أولاً
                  </p>
                )}
              </div>

              {/* الفصول */}
              <div className="space-y-2">
                <Label className="flex items-center gap-1">
                  <School className="h-4 w-4 text-[#1a7a8a]" />
                  الفصول <span className="text-red-500">*</span>
                  <span className="text-xs text-gray-400">(يمكنك اختيار أكثر من فصل)</span>
                </Label>
                <div className="flex flex-wrap gap-2 p-3 border border-[#c0c8c9] rounded-lg max-h-32 overflow-y-auto bg-white">
                  {classes?.map((cls: any) => (
                    <button
                      key={cls._id}
                      onClick={() => toggleClass(cls._id)}
                      className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${formData.classIds.includes(cls._id)
                          ? "bg-[#1a7a8a] text-white hover:bg-[#15707e]"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                    >
                      {cls.classNameAr || cls.className || cls.name || "فصل"}
                    </button>
                  ))}
                  {classes?.length === 0 && (
                    <p className="text-sm text-gray-500 w-full text-center py-2">
                      لا توجد فصول متاحة. قم بإنشاء فصل أولاً
                    </p>
                  )}
                </div>
                {errors.classIds && (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" /> {errors.classIds}
                  </p>
                )}
                <p className="text-xs text-gray-400">
                  اختر الفصل/الفصول التي ستقدم هذا الواجب فيها
                </p>
              </div>

              {/* نوع الواجب */}
              <div className="space-y-2">
                <Label htmlFor="type">نوع الواجب</Label>
                <select
                  id="type"
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-3 py-2 border border-[#c0c8c9] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a7a8a] bg-white"
                >
                  <option value="assignment">واجب</option>
                  <option value="quiz">اختبار</option>
                  <option value="exam">امتحان</option>
                  <option value="project">مشروع</option>
                </select>
              </div>

              {/* ✅ الأسئلة - تظهر دائماً بدون شرط */}
              <div className="space-y-2 border-t pt-4">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2">
                    <ListChecks className="h-4 w-4 text-[#1a7a8a]" />
                    الأسئلة
                    <Badge variant="secondary" className="mr-2">
                      {selectedQuestions.length}
                    </Badge>
                    {selectedQuestions.length > 0 && (
                      <span className="text-xs text-gray-500">
                        (إجمالي النقاط: {getTotalPoints()})
                      </span>
                    )}
                  </Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsQuestionDialogOpen(true)}
                    className="gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    إضافة من بنك الأسئلة
                  </Button>
                </div>

                {/* ✅ إزالة الشرط !formData.courseId */}

                {/* قائمة الأسئلة المختارة */}
                {selectedQuestions.length > 0 ? (
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {selectedQuestions.map((questionId) => {
                      const question = questions?.find((q: any) => q._id === questionId);
                      if (!question) return null;
                      return (
                        <div
                          key={questionId}
                          className="flex items-center justify-between p-3 bg-[#f7fafa] rounded-lg border border-[#c0c8c9] hover:border-[#1a7a8a] transition-colors"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <FileQuestion className="h-4 w-4 text-[#1a7a8a]" />
                              <p className="text-sm font-medium text-[#001f24]">
                                {question.title}
                              </p>
                            </div>
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
                          <button
                            type="button"
                            onClick={() => removeQuestion(questionId)}
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-6 bg-[#f7fafa] rounded-lg border border-dashed border-[#c0c8c9]">
                    <FileQuestion className="h-8 w-8 mx-auto text-gray-300 mb-2" />
                    <p className="text-sm text-gray-500">لا توجد أسئلة مضافة</p>
                    <p className="text-xs text-gray-400">اضغط على "إضافة من بنك الأسئلة" لاختيار أسئلة</p>
                  </div>
                )}
              </div>

              {/* خيارات إضافية */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="location">الموقع</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="مثال: غرفة 101"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="logic">المنطق</Label>
                  <Input
                    id="logic"
                    value={formData.logic}
                    onChange={(e) => setFormData({ ...formData, logic: e.target.value })}
                    placeholder="المنطق..."
                  />
                </div>
              </div>

              {/* خيارات متقدمة */}
              <div className="grid grid-cols-2 gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.allowResubmission}
                    onChange={(e) => setFormData({ ...formData, allowResubmission: e.target.checked })}
                    className="w-4 h-4 text-[#1a7a8a] focus:ring-[#1a7a8a]"
                  />
                  <span className="text-sm text-gray-700">السماح بإعادة التسليم</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isGroupWork}
                    onChange={(e) => setFormData({ ...formData, isGroupWork: e.target.checked })}
                    className="w-4 h-4 text-[#1a7a8a] focus:ring-[#1a7a8a]"
                  />
                  <span className="text-sm text-gray-700">واجب جماعي</span>
                </label>
              </div>

              {formData.isGroupWork && (
                <div className="space-y-2">
                  <Label htmlFor="maxGroupSize">الحد الأقصى لعدد المجموعة</Label>
                  <Input
                    id="maxGroupSize"
                    type="number"
                    min="1"
                    value={formData.maxGroupSize}
                    onChange={(e) => setFormData({ ...formData, maxGroupSize: e.target.value })}
                    placeholder="مثال: 4"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="maxAttempts">أقصى عدد محاولات</Label>
                <Input
                  id="maxAttempts"
                  type="number"
                  min="1"
                  value={formData.maxAttempts}
                  onChange={(e) => setFormData({ ...formData, maxAttempts: e.target.value })}
                  placeholder="اترك فارغاً لغير محدود"
                />
              </div>
            </div>
          )}

          {activeTab === "schedule" && (
            <div className="space-y-4">
              {/* تاريخ البداية والنهاية */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate" className="flex items-center gap-1">
                    تاريخ البداية <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="startDate"
                    type="datetime-local"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className={errors.startDate ? "border-red-500" : ""}
                  />
                  {errors.startDate && (
                    <p className="text-xs text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" /> {errors.startDate}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dueDate" className="flex items-center gap-1">
                    تاريخ التسليم <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="dueDate"
                    type="datetime-local"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    className={errors.dueDate ? "border-red-500" : ""}
                  />
                  {errors.dueDate && (
                    <p className="text-xs text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" /> {errors.dueDate}
                    </p>
                  )}
                </div>
              </div>

              {/* الوزن والدرجة الكاملة ودرجة النجاح */}
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="weight" className="flex items-center gap-1">
                    الوزن (%) <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="weight"
                    type="number"
                    min="0"
                    max="100"
                    value={formData.weight}
                    onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                    className={errors.weight ? "border-red-500" : ""}
                    placeholder="مثال: 10"
                  />
                  {errors.weight && (
                    <p className="text-xs text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" /> {errors.weight}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fullGrade" className="flex items-center gap-1">
                    الدرجة الكاملة <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="fullGrade"
                    type="number"
                    min="0"
                    max="1000"
                    value={formData.fullGrade}
                    onChange={(e) => {
                      setFormData({ ...formData, fullGrade: e.target.value });
                      if (parseFloat(formData.passingGrade) > parseFloat(e.target.value || "0")) {
                        setFormData(prev => ({ ...prev, passingGrade: e.target.value }));
                      }
                    }}
                    className={errors.fullGrade ? "border-red-500" : ""}
                    placeholder="مثال: 100"
                  />
                  {errors.fullGrade && (
                    <p className="text-xs text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" /> {errors.fullGrade}
                    </p>
                  )}
                  <p className="text-xs text-gray-400">الحد الأقصى 1000</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="passingGrade" className="flex items-center gap-1">
                    درجة النجاح <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="passingGrade"
                    type="number"
                    min="0"
                    max={parseFloat(formData.fullGrade || "100")}
                    value={formData.passingGrade}
                    onChange={(e) => setFormData({ ...formData, passingGrade: e.target.value })}
                    className={errors.passingGrade ? "border-red-500" : ""}
                    placeholder="مثال: 50"
                  />
                  {errors.passingGrade && (
                    <p className="text-xs text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" /> {errors.passingGrade}
                    </p>
                  )}
                  <p className="text-xs text-gray-400">
                    يجب أن تكون ≤ {formData.fullGrade || "الدرجة الكاملة"}
                  </p>
                </div>
              </div>

              {/* التسليم المتأخر */}
              <div className="space-y-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.allowLateSubmission}
                    onChange={(e) => setFormData({ ...formData, allowLateSubmission: e.target.checked })}
                    className="w-4 h-4 text-[#1a7a8a] focus:ring-[#1a7a8a]"
                  />
                  <span className="text-sm text-gray-700">السماح بالتسليم المتأخر</span>
                </label>

                {formData.allowLateSubmission && (
                  <div className="space-y-2">
                    <Label htmlFor="lateSubmissionPenalty">خصم التأخير (%)</Label>
                    <Input
                      id="lateSubmissionPenalty"
                      type="number"
                      min="0"
                      max="100"
                      value={formData.lateSubmissionPenalty}
                      onChange={(e) => setFormData({ ...formData, lateSubmissionPenalty: e.target.value })}
                      placeholder="مثال: 10"
                    />
                  </div>
                )}
              </div>

              {/* إظهار الدرجة */}
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.showGrade}
                  onChange={(e) => setFormData({ ...formData, showGrade: e.target.checked })}
                  className="w-4 h-4 text-[#1a7a8a] focus:ring-[#1a7a8a]"
                />
                <span className="text-sm text-gray-700">إظهار الدرجة للطلاب</span>
              </label>
            </div>
          )}

          {activeTab === "files" && (
            <div className="space-y-4">
              {/* رفع الملفات */}
              <div>
                <Label>المرفقات</Label>
                <div className="mt-2 border-2 border-dashed border-[#c0c8c9] rounded-lg p-6 text-center hover:border-[#1a7a8a] transition-colors">
                  <Upload className="h-10 w-10 mx-auto text-gray-400 mb-2" />
                  <p className="text-sm text-gray-500">اسحب الملفات هنا أو اضغط للاختيار</p>
                  <p className="text-xs text-gray-400 mt-1">PDF, DOC, DOCX, JPG, PNG (حد أقصى 10MB)</p>
                  <input
                    type="file"
                    multiple
                    className="hidden"
                    id="file-upload"
                    onChange={handleFileUpload}
                  />
                  <Button
                    variant="outline"
                    className="mt-3"
                    onClick={() => document.getElementById("file-upload")?.click()}
                  >
                    <Upload className="h-4 w-4 ml-2" />
                    اختر ملفات
                  </Button>
                </div>
              </div>

              {/* قائمة الملفات المرفوعة */}
              {attachments.length > 0 && (
                <div className="space-y-2">
                  <Label>الملفات المرفوعة</Label>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {attachments.map((attachment) => (
                      <div
                        key={attachment.id}
                        className="flex items-center justify-between p-3 bg-[#f7fafa] rounded-lg border border-[#c0c8c9]"
                      >
                        <div className="flex items-center gap-3">
                          <File className="h-5 w-5 text-[#1a7a8a]" />
                          <div>
                            <p className="text-sm font-medium text-[#001f24]">{attachment.name}</p>
                            <p className="text-xs text-gray-500">{formatFileSize(attachment.size)}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => removeAttachment(attachment.id || "")}
                          className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* أنواع الملفات المسموحة */}
              <div className="space-y-2">
                <Label htmlFor="allowedFileTypes">أنواع الملفات المسموحة</Label>
                <Input
                  id="allowedFileTypes"
                  value={formData.allowedFileTypes}
                  onChange={(e) => setFormData({ ...formData, allowedFileTypes: e.target.value })}
                  placeholder="pdf, doc, docx, jpg, png (افصل بينها بفاصلة)"
                />
                <p className="text-xs text-gray-400">اترك فارغاً للسماح بجميع الأنواع</p>
              </div>

              {/* الحد الأقصى لحجم الملف */}
              <div className="space-y-2">
                <Label htmlFor="maxFileSize">الحد الأقصى لحجم الملف (MB)</Label>
                <Input
                  id="maxFileSize"
                  type="number"
                  min="1"
                  value={formData.maxFileSize}
                  onChange={(e) => setFormData({ ...formData, maxFileSize: e.target.value })}
                  placeholder="مثال: 10"
                />
              </div>
            </div>
          )}

          {errors.submit && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              {errors.submit}
            </div>
          )}
        </div>

        {/* ✅ Dialog لإضافة الأسئلة */}
        <Dialog open={isQuestionDialogOpen} onOpenChange={setIsQuestionDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-[#001f24]">
                <ListChecks className="h-5 w-5 inline ml-2" />
                بنك الأسئلة
                <span className="text-sm font-normal text-gray-500 mr-2">
                  (جميع الأسئلة المنشورة)
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

              {/* عدد الأسئلة */}
              <div className="text-sm text-gray-500 mb-2">
                عدد الأسئلة: {questions?.length || 0}
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
                  questions?.map((question: Question) => {
                    const isSelected = selectedQuestions.includes(question._id);
                    return (
                      <div
                        key={question._id}
                        className={`flex items-start gap-3 p-3 rounded-lg border transition-all cursor-pointer hover:shadow-sm ${isSelected
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
                  تم اختيار {selectedQuestions.length} سؤال (إجمالي {getTotalPoints()} نقطة)
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