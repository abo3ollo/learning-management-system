// app/(pages)/(roles)/admin/exams/preview/[examId]/page.tsx

"use client";

import { useQuery } from "convex/react";
import { useParams } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { ExamPaper } from "@/app/_components/Exam/ExamPaper";
import { ArrowRight, Loader2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function ExamPreviewPage() {
  const params = useParams();
  const examId = params.examId as string;

  const exam = useQuery(
    api.exams.exams.getExamById,
    examId ? { examId: examId as any } : "skip"
  );
  console.log(exam);
  

  if (!exam) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-[#1a7a8a]" />
      </div>
    );
  }

  const gradeLabel: string =
    typeof exam.grade === "string"
      ? exam.grade
      : exam.grade?.name || exam.grade?.nameEn || "غير محدد";

  // تحويل الأسئلة إلى الصيغة المطلوبة لـ ExamPaper
  const questions = (exam.questions || []).map((item: any, index: number) => {
    const question = item?.question;

    return {
      id: question?._id || `question-${index + 1}`,
      number: index + 1,
      text: question?.questionText || "السؤال غير متاح",
      marks: item?.marks || 1,
      type: question?.type || "essay",
      options: question?.options || [],
      image: question?.imageUrl,
    };
  });

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-linear-to-r from-[#001f24] to-[#03363d] px-8 py-4">
        <div className="max-w-7xl mx-auto flex items-center gap-4">
          <Link href="/admin/exams">
            <button className="flex items-center gap-2 bg-white/15 hover:bg-white/25 text-white text-sm px-3 py-2 rounded-xl border border-white/20 transition-colors">
              <ArrowRight className="h-4 w-4" /> رجوع
            </button>
          </Link>
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              معاينة الورقة الامتحانية
            </h1>
            <p className="text-[#a3ced6] text-sm">{exam.title} — {exam.subject}</p>
          </div>
          <div className="mr-auto flex gap-2">
            <Link href={`/admin/exams/${examId}/edit`}>
              <Button variant="outline" size="sm" className="bg-white/10 text-white border-white/20 hover:bg-white/20">
                تعديل الامتحان
              </Button>
            </Link>
            <Link href={`/admin/exams/${examId}/grade`}>
              <Button size="sm" className="bg-[#1a7a8a] hover:bg-[#15707e] text-white">
                تصحيح الامتحان
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Exam Paper */}
      <div className="p-6">
        <ExamPaper
          title={exam.title}
          model={exam.model}
          date={new Date(exam.date)}
          grade={gradeLabel}
          subject={exam.subject}
          questionsCount={exam.questions.length}
          totalMarks={exam.totalMarks}
          duration={exam.duration}
          instructions={exam.instructions}
          questions={questions}
          institutionName="Marine Academy"
          departmentName="قسم التقييم الأكاديمي"
          footerText={exam.footerText}
          headerBorderColor={exam.headerBorderColor}
          showInstructions={exam.showInstructions}
          showAnswerSheet={exam.showAnswerSheet}
          showQrCode={exam.showQrCode}
        />
      </div>
    </div>
  );
}