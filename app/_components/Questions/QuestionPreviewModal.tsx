// app/_components/QuestionPreviewModal.tsx
"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { 
  X, 
  Eye, 
  CheckCircle, 
  XCircle,
  Clock,
  FileQuestion,
  BookOpen,
  GraduationCap,
  AlertCircle,
  Loader2,
  Check,
  Image as ImageIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface QuestionPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  questionId: string | null;
}

export function QuestionPreviewModal({ isOpen, onClose, questionId }: QuestionPreviewModalProps) {
  const question = useQuery(api.questions.questions.getQuestionById,
    questionId ? { questionId: questionId as any } : "skip"
  );

  if (!isOpen) return null;

  if (!question) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl p-8 text-center">
          <Loader2 className="h-12 w-12 animate-spin text-[#1a7a8a] mx-auto mb-4" />
          <p className="text-gray-500">جاري تحميل السؤال...</p>
        </div>
      </div>
    );
  }

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
    const map: Record<string, string> = {
      easy: "سهل",
      medium: "متوسط",
      hard: "صعب",
    };
    return map[difficulty] || difficulty;
  };

  const getDifficultyColor = (difficulty: string) => {
    const colors: Record<string, string> = {
      easy: "text-green-600 bg-green-50",
      medium: "text-amber-600 bg-amber-50",
      hard: "text-red-600 bg-red-50",
    };
    return colors[difficulty] || "text-gray-600 bg-gray-50";
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "published":
        return { label: "منشور", icon: CheckCircle, className: "bg-green-100 text-green-700" };
      case "draft":
        return { label: "مسودة", icon: Clock, className: "bg-amber-100 text-amber-700" };
      case "archived":
        return { label: "مؤرشف", icon: XCircle, className: "bg-gray-100 text-gray-600" };
      default:
        return { label: "مسودة", icon: Clock, className: "bg-amber-100 text-amber-700" };
    }
  };

  const statusBadge = getStatusBadge(question.status);
  const StatusIcon = statusBadge.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header - معاينة السؤال */}
        <div className="sticky top-0 bg-white border-b border-[#c0c8c9] px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#e0f5f7] rounded-xl">
              <FileQuestion className="h-5 w-5 text-[#1a7a8a]" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#001f24]">معاينة السؤال</h2>
              <p className="text-sm text-gray-500">
                {question.title || "سؤال بدون عنوان"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Question Info Tags */}
          <div className="flex flex-wrap gap-2 items-center">
            <span className={`px-3 py-1 text-xs font-medium rounded-full ${getDifficultyColor(question.difficulty)}`}>
              {getDifficultyLabel(question.difficulty)}
            </span>
            <span className="px-3 py-1 text-xs font-medium rounded-full bg-blue-50 text-blue-700">
              {getTypeLabel(question.type)}
            </span>
            <span className="px-3 py-1 text-xs font-medium rounded-full bg-purple-50 text-purple-700">
              {question.points} نقاط
            </span>
            <span className={`inline-flex items-center gap-1 px-3 py-1 text-xs font-medium rounded-full ${statusBadge.className}`}>
              <StatusIcon className="h-3 w-3" />
              {statusBadge.label}
            </span>
          </div>

          {/* Question Text */}
          <div className="bg-[#f7fafa] rounded-xl p-5 border border-[#c0c8c9]">
            <h3 className="text-sm font-semibold text-gray-500 mb-2">نص السؤال</h3>
            <p className="text-lg text-[#001f24] leading-relaxed">
              {question.questionText}
            </p>
          </div>

          {/* Question Image */}
          {question.imageUrl && (
            <div className="bg-[#f7fafa] rounded-xl p-4 border border-[#c0c8c9]">
              <img
                src={question.imageUrl}
                alt={question.title}
                className="max-h-64 mx-auto rounded-lg object-contain"
              />
            </div>
          )}

          {/* Options (for MCQ) */}
          {question.type === "mcq" && question.options && question.options.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-500 mb-3">خيارات الإجابة</h3>
              <div className="space-y-2">
                {question.options.map((option: any) => (
                  <div
                    key={option.id}
                    className={`flex items-center gap-3 p-3 rounded-lg border ${
                      option.isCorrect
                        ? "bg-green-50 border-green-300"
                        : "bg-white border-[#c0c8c9]"
                    }`}
                  >
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      option.isCorrect
                        ? "bg-green-500 text-white"
                        : "bg-gray-200 text-gray-600"
                    }`}>
                      {option.id.toUpperCase()}
                    </div>
                    <span className="flex-1 text-sm text-[#001f24]">{option.text}</span>
                    {option.isCorrect && (
                      <Check className="h-5 w-5 text-green-500" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Explanation */}
          {question.explanation && (
            <div>
              <h3 className="text-sm font-semibold text-gray-500 mb-2">الشرح</h3>
              <div className="bg-[#e0f5f7] rounded-xl p-4 border border-[#1a7a8a]/20">
                <p className="text-sm text-[#001f24] leading-relaxed">
                  {question.explanation}
                </p>
              </div>
            </div>
          )}

          {/* Additional Info */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            {question.subject && (
              <div className="bg-[#f7fafa] rounded-lg p-3">
                <p className="text-xs text-gray-500">المادة</p>
                <p className="font-medium text-[#001f24]">{question.subject}</p>
              </div>
            )}
            {question.lesson && (
              <div className="bg-[#f7fafa] rounded-lg p-3">
                <p className="text-xs text-gray-500">الدرس</p>
                <p className="font-medium text-[#001f24]">{question.lesson}</p>
              </div>
            )}
            {question.grade && (
              <div className="bg-[#f7fafa] rounded-lg p-3">
                <p className="text-xs text-gray-500">الصف الدراسي</p>
                <p className="font-medium text-[#001f24]">{question.grade}</p>
              </div>
            )}
            {question.section && (
              <div className="bg-[#f7fafa] rounded-lg p-3">
                <p className="text-xs text-gray-500">الشعبة</p>
                <p className="font-medium text-[#001f24]">{question.section}</p>
              </div>
            )}
            {question.tags && question.tags.length > 0 && (
              <div className="bg-[#f7fafa] rounded-lg p-3 col-span-2">
                <p className="text-xs text-gray-500">الوسوم</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {question.tags.map((tag: string) => (
                    <span key={tag} className="px-2 py-0.5 bg-[#e0f5f7] text-[#1a7a8a] rounded-full text-xs">
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Usage Info */}
          {question.usageCount > 0 && (
            <div className="bg-[#f7fafa] rounded-lg p-3 text-center">
              <p className="text-sm text-gray-500">
                تم استخدام هذا السؤال <span className="font-bold text-[#1a7a8a]">{question.usageCount}</span> مرة في الامتحانات
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-[#c0c8c9] px-6 py-4 flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={onClose}
          >
            إغلاق
          </Button>
          <Button
            className="bg-[#001f24] hover:bg-[#03363d] text-white"
            onClick={() => {
              // يمكن إضافة منطق لاستخدام السؤال في امتحان
              onClose();
            }}
          >
            <Check className="h-4 w-4 ml-2" />
            استعمال
          </Button>
        </div>
      </div>
    </div>
  );
}