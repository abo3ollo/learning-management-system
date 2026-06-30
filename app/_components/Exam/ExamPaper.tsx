"use client";

import  { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Download,
  Printer,
  QrCode,
  FileText,
  Calendar,
  Clock,
  BookOpen,
  User,
  Hash,
  Circle,
  Eye,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

interface Question {
  id: string;
  number: number;
  text: string;
  marks: number;
  type: "mcq" | "true_false" | "essay" | "fill_blank" | "matching";
  options?: { id: string; text: string }[];
  image?: string;
}

interface ExamPaperProps {
  title: string;
  model: string;
  date: Date;
  grade: string;
  subject: string;
  questionsCount: number;
  totalMarks: number;
  duration: number;
  instructions?: string;
  questions: Question[];
  institutionName?: string;
  departmentName?: string;
  footerText?: string;
  showInstructions?: boolean;
  showAnswerSheet?: boolean;
  showQrCode?: boolean;
  headerBorderColor?: string;
  students?: { id: string; name: string }[];
}

export function ExamPaper({
  title = "Sample Exam Title",
  model = "Model A",
  date = new Date(),
  grade = "Grade 10",
  subject = "Mathematics",
  questionsCount = 20,
  totalMarks = 40,
  duration = 60,
  instructions = "Read each question carefully before answering",
  questions = [],
  institutionName = "INSTITUTION NAME",
  departmentName = "Academic Assessment Department",
  footerText = "End of Exam — Good Luck",
  showInstructions = true,
  showAnswerSheet = true,
  showQrCode = true,
  headerBorderColor = "#1a7a8a",
  students = [],
}: ExamPaperProps) {
  const [showAnswerSheetPage, setShowAnswerSheetPage] = useState(showAnswerSheet);
  const [showInstructionsBox, setShowInstructionsBox] = useState(showInstructions);
  const [showQRCode, setShowQRCode] = useState(showQrCode);
  const [borderColor, setBorderColor] = useState(headerBorderColor);
  const paperRef = useRef<HTMLDivElement>(null);

  // Get question type label
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

  // Render question based on type
  const renderQuestion = (question: Question) => {
    switch (question.type) {
      case "mcq":
        return (
          <div className="mr-6 space-y-2 mt-2">
            {question.options?.map((option, index) => (
              <div key={option.id} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full border-2 border-gray-300 flex items-center justify-center">
                  <span className="text-xs text-gray-500">
                    {String.fromCharCode(65 + index)}
                  </span>
                </div>
                <span className="text-sm text-gray-700">{option.text}</span>
              </div>
            ))}
          </div>
        );
      case "true_false":
        return (
          <div className="mr-6 flex gap-6 mt-2">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full border-2 border-gray-300 flex items-center justify-center">
                <CheckCircle className="h-3 w-3 text-green-500" />
              </div>
              <span className="text-sm font-medium">صح</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full border-2 border-gray-300 flex items-center justify-center">
                <XCircle className="h-3 w-3 text-red-500" />
              </div>
              <span className="text-sm font-medium">خطأ</span>
            </div>
          </div>
        );
      case "essay":
        return (
          <div className="mr-6 mt-2">
            <div className="border-b border-dashed border-gray-300 w-full h-16"></div>
            <p className="text-xs text-gray-400 mt-1">مساحة للإجابة</p>
          </div>
        );
      case "fill_blank":
        return (
          <div className="mr-6 mt-2">
            <div className="inline-block border-b-2 border-gray-400 w-32 h-8"></div>
            <span className="text-xs text-gray-400 mr-2">أكمل الفراغ</span>
          </div>
        );
      default:
        return (
          <div className="mr-6 mt-2">
            <div className="border-b border-dashed border-gray-300 w-full h-12"></div>
          </div>
        );
    }
  };

  // Render answer sheet
  const renderAnswerSheet = () => {
    return (
      <div className="mt-8 pt-8 border-t-2 border-gray-300">
        <h3 className="text-center text-lg font-bold mb-6">ورقة الإجابة</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {questions.map((q) => (
            <div key={q.id} className="flex items-center gap-2">
              <span className="text-sm font-medium">س{q.number}:</span>
              <div className="border-b border-gray-400 w-16 h-6"></div>
              <span className="text-xs text-gray-500">({q.marks} درجات)</span>
            </div>
          ))}
        </div>
        <div className="mt-8 grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-gray-500">الطالب: </span>
            <span className="border-b border-gray-400 inline-block w-32">_________________</span>
          </div>
          <div>
            <span className="text-gray-500">التوقيع: </span>
            <span className="border-b border-gray-400 inline-block w-32">_________________</span>
          </div>
          <div>
            <span className="text-gray-500">التاريخ: </span>
            <span className="border-b border-gray-400 inline-block w-32">_________________</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6" dir="rtl">
      {/* Controls */}
      <div className="max-w-4xl mx-auto mb-6 bg-white rounded-xl shadow-sm p-4 border border-gray-200">
        <div className="flex flex-wrap gap-3 items-center justify-between">
          <div className="flex flex-wrap gap-3 items-center">
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => window.print()}
            >
              <Printer className="h-4 w-4" />
              طباعة
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              تحميل PDF
            </Button>
          </div>

          <div className="flex flex-wrap gap-3 items-center">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={showInstructionsBox}
                onChange={(e) => setShowInstructionsBox(e.target.checked)}
                className="w-4 h-4 text-[#1a7a8a]"
              />
              إظهار التعليمات
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={showAnswerSheetPage}
                onChange={(e) => setShowAnswerSheetPage(e.target.checked)}
                className="w-4 h-4 text-[#1a7a8a]"
              />
              ورقة الإجابة
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={showQRCode}
                onChange={(e) => setShowQRCode(e.target.checked)}
                className="w-4 h-4 text-[#1a7a8a]"
              />
              رمز QR
            </label>
            <div className="flex items-center gap-2">
              <span className="text-sm">لون الحدود:</span>
              <input
                type="color"
                value={borderColor}
                onChange={(e) => setBorderColor(e.target.value)}
                className="w-8 h-8 rounded border border-gray-300 cursor-pointer"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Exam Paper */}
      <div
        ref={paperRef}
        className="max-w-4xl mx-auto bg-white shadow-xl rounded-xl overflow-hidden"
        style={{ borderTop: `6px solid ${borderColor}` }}
      >
        {/* Header */}
        <div className="p-8 border-b border-gray-200">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-800">{institutionName}</h1>
            <p className="text-sm text-gray-500">{departmentName}</p>
          </div>

          <div className="flex justify-between items-center mt-6">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-[#1a7a8a]" />
              <h2 className="text-xl font-bold text-gray-800">{title}</h2>
            </div>
            <div className="px-4 py-1 bg-[#e0f5f7] rounded-full">
              <span className="text-sm font-semibold text-[#1a7a8a]">{model}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-400" />
              <span className="text-sm text-gray-600">
                التاريخ: {format(date, "dd/MM/yyyy", { locale: ar })}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-gray-400" />
              <span className="text-sm text-gray-600">
                المادة: {subject}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-gray-400" />
              <span className="text-sm text-gray-600">
                الصف: {grade}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Hash className="h-4 w-4 text-gray-400" />
              <span className="text-sm text-gray-600">
                عدد الأسئلة: {questionsCount}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-gray-400" />
              <span className="text-sm text-gray-600">
                الدرجة الكلية: {totalMarks}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-gray-400" />
              <span className="text-sm text-gray-600">
                المدة: {duration} دقيقة
              </span>
            </div>
          </div>
        </div>

        {/* Instructions */}
        {showInstructionsBox && (
          <div className="mx-8 mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start gap-3">
              <Eye className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold text-yellow-800">تعليمات الامتحان</h4>
                <p className="text-sm text-yellow-700 mt-1">{instructions}</p>
                <ul className="text-sm text-yellow-700 mt-2 list-disc list-inside">
                  <li>اقرأ كل سؤال بعناية قبل الإجابة</li>
                  <li>هذه الورقة تحتوي على {questionsCount} سؤال بمجموع {totalMarks} درجات</li>
                  <li>الوقت المتاح: {duration} دقيقة</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Questions */}
        <div className="p-8 space-y-6">
          <h3 className="text-lg font-bold text-gray-800 border-b border-gray-200 pb-2">
            أسئلة الامتحان
          </h3>

          {questions.map((question) => (
            <div
              key={question.id}
              className="border border-gray-200 rounded-lg p-4 hover:border-[#1a7a8a] transition-colors"
            >
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <span className="font-bold text-[#1a7a8a] bg-[#e0f5f7] px-3 py-1 rounded-lg text-sm">
                    سوال {question.number}
                  </span>
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                    {getTypeLabel(question.type)}
                  </span>
                </div>
                <span className="text-sm text-gray-500">
                  {question.marks} درجات
                </span>
              </div>

              <p className="mt-3 text-gray-700">{question.text}</p>

              {question.image && (
                <img
                  src={question.image}
                  alt={`Question ${question.number}`}
                  className="mt-3 max-h-32 rounded-lg"
                />
              )}

              {renderQuestion(question)}
            </div>
          ))}
        </div>

        {/* Answer Sheet */}
        {showAnswerSheetPage && renderAnswerSheet()}

        {/* Footer */}
        <div className="p-8 border-t border-gray-200">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              {showQRCode && (
                <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                  <QrCode className="h-10 w-10 text-gray-600" />
                </div>
              )}
              <div>
                <p className="text-sm text-gray-600">___________________</p>
                <p className="text-xs text-gray-400">توقيع الطالب</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">___________________</p>
                <p className="text-xs text-gray-400">توقيع الملاحظ</p>
              </div>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">{footerText}</p>
              <p className="text-xs text-gray-400">نهاية الامتحان - بالتوفيق</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Sample usage
export function ExamPaperPreview() {
  const sampleQuestions: Question[] = [
    {
      id: "1",
      number: 1,
      text: "ما هو ناتج 2 + 2؟",
      marks: 2,
      type: "mcq",
      options: [
        { id: "a", text: "3" },
        { id: "b", text: "4" },
        { id: "c", text: "5" },
        { id: "d", text: "6" },
      ],
    },
    {
      id: "2",
      number: 2,
      text: "اشرح نظرية النسبية العامة بإيجاز.",
      marks: 5,
      type: "essay",
    },
    {
      id: "3",
      number: 3,
      text: "هل الأرض كروية الشكل؟",
      marks: 1,
      type: "true_false",
    },
    {
      id: "4",
      number: 4,
      text: "أكمل الفراغ: 1 + 1 = ___",
      marks: 2,
      type: "fill_blank",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-4xl mx-auto mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">معاينة ورقة الامتحان</h1>
        <p className="text-gray-500">تصميم احترافي لورقة امتحان مع خيارات التخصيص</p>
      </div>

      <ExamPaper
        title="امتحان الرياضيات النهائي"
        model="النموذج أ"
        date={new Date()}
        grade="الصف العاشر"
        subject="الرياضيات"
        questionsCount={sampleQuestions.length}
        totalMarks={10}
        duration={60}
        instructions="اقرأ كل سؤال بعناية قبل الإجابة. هذا الامتحان يتكون من 4 أسئلة بمجموع 10 درجات. الوقت المتاح 60 دقيقة."
        questions={sampleQuestions}
        institutionName="مدرسة النهضة"
        departmentName="قسم التقييم الأكاديمي"
        footerText="انتهى الامتحان - بالتوفيق"
        headerBorderColor="#1a7a8a"
      />
    </div>
  );
}