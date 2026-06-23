// app/_components/EditQuestionModal.tsx
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
  Image as ImageIcon,
  AlertCircle,
  ChevronDown,
  Check,
  Loader2
} from "lucide-react";

interface EditQuestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  questionId: string | null;
}

interface Option {
  id: string;
  text: string;
  isCorrect: boolean;
  imageUrl?: string;
}

export function EditQuestionModal({ isOpen, onClose, questionId }: EditQuestionModalProps) {
  const question = useQuery(api.questions.questions.getQuestionById,
    questionId ? { questionId: questionId as any } : "skip"
  );
  const updateQuestion = useMutation(api.questions.questions.updateQuestion);

  const [formData, setFormData] = useState({
    title: "",
    type: "mcq",
    questionText: "",
    explanation: "",
    difficulty: "medium",
    points: 1,
    subject: "",
    lesson: "",
    grade: "",
    section: "",
    tags: "",
    status: "draft",
  });
  const [options, setOptions] = useState<Option[]>([
    { id: "a", text: "", isCorrect: false },
    { id: "b", text: "", isCorrect: false },
    { id: "c", text: "", isCorrect: false },
    { id: "d", text: "", isCorrect: false },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // تعبئة النموذج ببيانات السؤال عند التحميل
  useEffect(() => {
    if (question) {
      setFormData({
        title: question.title || "",
        type: question.type || "mcq",
        questionText: question.questionText || "",
        explanation: question.explanation || "",
        difficulty: question.difficulty || "medium",
        points: question.points || 1,
        subject: question.subject || "",
        lesson: question.lesson || "",
        grade: question.grade || "",
        section: question.section || "",
        tags: question.tags ? question.tags.join(", ") : "",
        status: question.status || "draft",
      });
      if (question.options && question.options.length > 0) {
        setOptions(question.options);
      }
      if (question.imageUrl) {
        setImagePreview(question.imageUrl);
      }
      setIsLoading(false);
    }
  }, [question]);

  if (!isOpen) return null;

  if (isLoading || !question) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl p-8 text-center">
          <Loader2 className="h-12 w-12 animate-spin text-[#1a7a8a] mx-auto mb-4" />
          <p className="text-gray-500">جاري تحميل السؤال...</p>
        </div>
      </div>
    );
  }

  const typeOptions = [
    { value: "mcq", label: "اختيار من متعدد" },
    { value: "true_false", label: "صح / خطأ" },
    { value: "essay", label: "مقالي" },
    { value: "fill_blank", label: "ملء الفراغ" },
    { value: "matching", label: "مطابقة" },
  ];

  const difficultyOptions = [
    { value: "easy", label: "سهل" },
    { value: "medium", label: "متوسط" },
    { value: "hard", label: "صعب" },
  ];

  const statusOptions = [
    { value: "draft", label: "مسودة" },
    { value: "published", label: "منشور" },
  ];

  const addOption = () => {
    const newId = String.fromCharCode(97 + options.length);
    setOptions([...options, { id: newId, text: "", isCorrect: false }]);
  };

  const removeOption = (index: number) => {
    if (options.length <= 2) return;
    setOptions(options.filter((_, i) => i !== index));
  };

  const updateOption = (index: number, field: keyof Option, value: string | boolean) => {
    const newOptions = [...options];
    newOptions[index] = { ...newOptions[index], [field]: value };
    setOptions(newOptions);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.title.trim()) {
      newErrors.title = "عنوان السؤال مطلوب";
    }
    if (!formData.questionText.trim()) {
      newErrors.questionText = "نص السؤال مطلوب";
    }
    if (formData.type === "mcq") {
      const hasCorrect = options.some(opt => opt.isCorrect);
      if (!hasCorrect) {
        newErrors.options = "يجب تحديد إجابة صحيحة واحدة على الأقل";
      }
      const hasEmpty = options.some(opt => !opt.text.trim());
      if (hasEmpty) {
        newErrors.optionsText = "جميع الخيارات يجب أن تحتوي على نص";
      }
    }
    if (!formData.points || formData.points < 1) {
      newErrors.points = "يجب أن تكون النقاط 1 على الأقل";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    try {
      const imageUrl = imagePreview || undefined;

      await updateQuestion({
        questionId: questionId as any,
        title: formData.title,
        type: formData.type as any,
        questionText: formData.questionText,
        imageUrl: imageUrl,
        explanation: formData.explanation || undefined,
        difficulty: formData.difficulty as any,
        points: formData.points,
        options: formData.type === "mcq" ? options : [],
        correctAnswer: formData.type === "essay" ? "" : undefined,
        subject: formData.subject || undefined,
        lesson: formData.lesson || undefined,
        grade: formData.grade || undefined,
        section: formData.section || undefined,
        tags: formData.tags ? formData.tags.split(",").map(t => t.trim()) : [],
        status: formData.status as any,
      });

      onClose();
    } catch (error) {
      console.error("Error updating question:", error);
      setErrors({ submit: "حدث خطأ أثناء تحديث السؤال" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-[#c0c8c9] px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-[#001f24]">تعديل السؤال</h2>
            <p className="text-sm text-gray-500 mt-1">تحديث تفاصيل السؤال والخيارات</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* معلومات السؤال */}
          <div>
            <h3 className="text-lg font-semibold text-[#001f24] mb-4 pb-2 border-b border-[#c0c8c9]">
              معلومات السؤال
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="title" className="flex items-center gap-1">
                  عنوان السؤال <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className={errors.title ? 'border-red-500' : ''}
                  placeholder="مثال: سؤال النحو - إعراب الجملة"
                />
                {errors.title && (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" /> {errors.title}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">نوع السؤال</Label>
                <div className="relative">
                  <select
                    id="type"
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-3 py-2 border border-[#c0c8c9] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a7a8a] bg-white appearance-none"
                  >
                    {typeOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="difficulty">مستوى الصعوبة</Label>
                <div className="relative">
                  <select
                    id="difficulty"
                    value={formData.difficulty}
                    onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                    className="w-full px-3 py-2 border border-[#c0c8c9] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a7a8a] bg-white appearance-none"
                  >
                    {difficultyOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="points">النقاط <span className="text-red-500">*</span></Label>
                <Input
                  id="points"
                  type="number"
                  min="1"
                  value={formData.points}
                  onChange={(e) => setFormData({ ...formData, points: parseInt(e.target.value) || 1 })}
                  className={errors.points ? 'border-red-500' : ''}
                />
                {errors.points && (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" /> {errors.points}
                  </p>
                )}
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="questionText" className="flex items-center gap-1">
                  نص السؤال <span className="text-red-500">*</span>
                </Label>
                <textarea
                  id="questionText"
                  value={formData.questionText}
                  onChange={(e) => setFormData({ ...formData, questionText: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a7a8a] resize-none ${errors.questionText ? 'border-red-500' : 'border-[#c0c8c9]'}`}
                  rows={3}
                  placeholder="أدخل نص السؤال هنا..."
                />
                {errors.questionText && (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" /> {errors.questionText}
                  </p>
                )}
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label>صورة السؤال (اختياري)</Label>
                <div className="flex items-center gap-4">
                  <label className="flex-1 cursor-pointer">
                    <div className={`border-2 border-dashed rounded-lg p-4 text-center hover:border-[#1a7a8a] transition-colors ${
                      imagePreview ? 'border-[#1a7a8a]' : 'border-[#c0c8c9]'
                    }`}>
                      {imagePreview ? (
                        <img src={imagePreview} alt="Preview" className="max-h-32 mx-auto rounded" />
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
                  {imagePreview && (
                    <button
                      type="button"
                      onClick={() => { setImageFile(null); setImagePreview(null); }}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="explanation">شرح مفصل (اختياري)</Label>
                <textarea
                  id="explanation"
                  value={formData.explanation}
                  onChange={(e) => setFormData({ ...formData, explanation: e.target.value })}
                  className="w-full px-3 py-2 border border-[#c0c8c9] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a7a8a] resize-none"
                  rows={3}
                  placeholder="شرح مفصل للإجابة..."
                />
              </div>
            </div>
          </div>

          {/* خيارات الإجابة (لـ MCQ فقط) */}
          {formData.type === "mcq" && (
            <div>
              <h3 className="text-lg font-semibold text-[#001f24] mb-4 pb-2 border-b border-[#c0c8c9]">
                خيارات الإجابة
              </h3>

              {errors.options && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  {errors.options}
                </div>
              )}

              <div className="space-y-3">
                {options.map((option, index) => (
                  <div key={option.id} className="flex items-center gap-3 p-3 bg-[#f7fafa] rounded-lg hover:bg-[#e0f5f7] transition-colors">
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="correctAnswer"
                        checked={option.isCorrect}
                        onChange={() => {
                          const newOptions = options.map((opt, i) => ({
                            ...opt,
                            isCorrect: i === index,
                          }));
                          setOptions(newOptions);
                        }}
                        className="w-4 h-4 text-[#1a7a8a] focus:ring-[#1a7a8a]"
                      />
                      <span className="text-sm font-medium text-gray-500 min-w-5">
                        {option.id.toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1">
                      <Input
                        value={option.text}
                        onChange={(e) => updateOption(index, 'text', e.target.value)}
                        placeholder={`نص الخيار ${option.id.toUpperCase()}`}
                        className={errors.optionsText ? 'border-red-500' : ''}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeOption(index)}
                      className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                      disabled={options.length <= 2}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={addOption}
                className="mt-3 w-full border-dashed"
              >
                <Plus className="h-4 w-4 ml-2" />
                إضافة خيار
              </Button>
            </div>
          )}

          {/* معلومات إضافية */}
          <div>
            <h3 className="text-lg font-semibold text-[#001f24] mb-4 pb-2 border-b border-[#c0c8c9]">
              معلومات إضافية
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="subject">المادة (اختياري)</Label>
                <Input
                  id="subject"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  placeholder="مثال: اللغة العربية"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="lesson">الدرس (اختياري)</Label>
                <Input
                  id="lesson"
                  value={formData.lesson}
                  onChange={(e) => setFormData({ ...formData, lesson: e.target.value })}
                  placeholder="مثال: درس النحو"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="grade">الصف الدراسي (اختياري)</Label>
                <Input
                  id="grade"
                  value={formData.grade}
                  onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                  placeholder="مثال: الصف الخامس"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="section">الشعبة (اختياري)</Label>
                <Input
                  id="section"
                  value={formData.section}
                  onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                  placeholder="مثال: أ"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="tags">وسوم (اختياري)</Label>
                <Input
                  id="tags"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  placeholder="أدخل الوسوم مفصولة بفاصلة: نحو, إعراب, جملة"
                />
                <p className="text-xs text-gray-400">افصل بين الوسوم بفاصلة</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">الحالة</Label>
                <div className="relative">
                  <select
                    id="status"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 border border-[#c0c8c9] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a7a8a] bg-white appearance-none"
                  >
                    {statusOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>
          </div>

          {errors.submit && (
            <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              {errors.submit}
            </div>
          )}

          {/* Footer */}
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
              {isSubmitting ? "جاري التحديث..." : "تحديث السؤال"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}