// app/(pages)/(roles)/admin/exams/preview/[examId]/page.tsx

"use client";

import { useQuery } from "convex/react";
import { useParams } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { ExamPaper } from "@/app/_components/Exam/ExamPaper";
import { Loader2 } from "lucide-react";

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

  // تحويل الأسئلة إلى الصيغة المطلوبة لـ ExamPaper
  const questions = exam.questions.map((item: any, index: number) => ({
    id: item.question._id,
    number: index + 1,
    text: item.question.questionText,
    marks: item.marks,
    type: item.question.type,
    options: item.question.options,
    image: item.question.imageUrl,
  }));

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <ExamPaper
        title={exam.title}
        model={exam.model}
        date={new Date(exam.date)}
        grade={exam.grade}
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
  );
}