"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Id } from "@/convex/_generated/dataModel";
import {
  ArrowRight, Loader2, CheckCircle, Shield,
  Users, Clock, Star, Save, ChevronDown, ChevronUp,
  AlertCircle, Lock,
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

// Question type mapping for display
const typeMap: Record<string, string> = {
  mcq: "اختيار من متعدد",
  true_false: "صح / خطأ",
  essay: "مقالي",
  fill_blank: "ملء الفراغ",
  matching: "مطابقة",
};

export default function GradeExamPage() {
  const params = useParams();
  const examId = params.examId as string;

  const [selectedSubmissionId, setSelectedSubmissionId] = useState<string | null>(null);
  const [answerGrades, setAnswerGrades] = useState<Record<string, number>>({});
  const [generalFeedback, setGeneralFeedback] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const exam = useQuery(
    api.exams.exams.getExamById,
    examId ? { examId: examId as Id<"exams"> } : "skip"
  );

  const submissions = useQuery(
    api.exams.exams.getExamSubmissions,
    examId ? { examId: examId as Id<"exams"> } : "skip"
  );

  const gradeSubmission = useMutation(api.exams.exams.gradeExamSubmission);

  const isLoading = exam === undefined || submissions === undefined;
  const selectedSub = submissions?.find((s: any) => s._id === selectedSubmissionId);

  // ── Load submission grades into state ─────────────────────────
  const loadSubmission = (sub: any) => {
    setSelectedSubmissionId(sub._id);
    setGeneralFeedback(sub.feedback || "");
    const grades: Record<string, number> = {};
    sub.answers?.forEach((a: any) => {
      if (a.marksObtained !== undefined) {
        grades[a.questionId] = a.marksObtained;
      }
    });
    setAnswerGrades(grades);
    setError(null);
  };

  const totalGiven = Object.values(answerGrades).reduce((s, v) => s + (v || 0), 0);
  const examTotalMarks = exam?.totalMarks ?? 0;

  // ── Save grades ───────────────────────────────────────────────
  const handleSave = async () => {
    if (!selectedSubmissionId || !selectedSub) return;
    setError(null);

    // Validate — every question must have a grade
    const questionIds = exam?.questions?.map((q: any) => q.question?._id) ?? [];
    const missing = questionIds.filter((qId: string) => answerGrades[qId] === undefined);
    if (missing.length > 0) {
      setError(`يرجى إدخال درجة لجميع الأسئلة (${missing.length} سؤال بدون درجة)`);
      return;
    }

    setIsSaving(true);
    try {
      const gradedAnswers = selectedSub.answers.map((a: any) => ({
        questionId: a.questionId,
        answer:     a.answer,
        marksObtained: answerGrades[a.questionId] ?? 0,
      }));

      await gradeSubmission({
        submissionId: selectedSubmissionId as Id<"examSubmissions">,
        gradedAnswers,
        totalMarks:   totalGiven,
        feedback:     generalFeedback.trim() || undefined,
      });

      setSavedId(selectedSubmissionId);
      setTimeout(() => setSavedId(null), 2000);
    } catch (err: any) {
      setError(err.message || "حدث خطأ أثناء الحفظ");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-[#1a7a8a]" />
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]" dir="rtl">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-3" />
          <p className="text-gray-600">الامتحان غير موجود</p>
          <Link href="/teacher/exams">
            <Button className="mt-4 bg-[#001f24] text-white">رجوع</Button>
          </Link>
        </div>
      </div>
    );
  }

  const gradedCount   = submissions?.filter((s: any) => s.status === "graded").length ?? 0;
  const pendingCount  = submissions?.filter((s: any) => s.status === "submitted").length ?? 0;
  const lockedCount   = submissions?.filter((s: any) => s.locked).length ?? 0;

  return (
    <div className="min-h-screen bg-[#f7fafa]" dir="rtl">
      {/* Header */}
      <header className="bg-linear-to-r from-[#001f24] to-[#03363d] px-8 py-5">
        <div className="max-w-7xl mx-auto flex items-center gap-4">
          <Link href="/teacher/exams">
            <button className="flex items-center gap-2 bg-white/15 hover:bg-white/25 text-white text-sm px-3 py-2 rounded-xl border border-white/20">
              <ArrowRight className="h-4 w-4" /> رجوع
            </button>
          </Link>
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <CheckCircle className="h-5 w-5" /> تصحيح الامتحان
            </h1>
            <p className="text-[#a3ced6] text-sm">{exam.title} — {exam.subject}</p>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: "إجمالي التسليمات", value: submissions?.length ?? 0, icon: Users,       color: "text-[#1a7a8a]", bg: "bg-[#e0f5f7]" },
            { label: "بانتظار التصحيح",  value: pendingCount,            icon: Clock,       color: "text-amber-600", bg: "bg-amber-50"  },
            { label: "تم التصحيح",       value: gradedCount,             icon: CheckCircle, color: "text-green-600", bg: "bg-green-50"  },
          ].map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.label} className="bg-white rounded-xl p-4 border border-[#c0c8c9]">
                <div className="flex items-center justify-between mb-2">
                  <div className={`w-9 h-9 rounded-xl ${s.bg} flex items-center justify-center`}>
                    <Icon className={`h-5 w-5 ${s.color}`} />
                  </div>
                </div>
                <p className="text-2xl font-bold text-[#001f24]">{s.value}</p>
                <p className="text-xs text-gray-500">{s.label}</p>
              </div>
            );
          })}
        </div>

        <div className="grid lg:grid-cols-5 gap-6">
          {/* ── Left: Submissions list (2 cols) ─────────────── */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl border border-[#c0c8c9] overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 bg-[#f7fafa]">
                <p className="text-sm font-semibold text-[#001f24]">التسليمات ({submissions?.length ?? 0})</p>
              </div>
              <div className="divide-y divide-gray-50 max-h-150 overflow-y-auto">
                {submissions?.length === 0 ? (
                  <div className="py-12 text-center text-sm text-gray-400">
                    لا توجد تسليمات حتى الآن
                  </div>
                ) : (
                  submissions?.map((sub: any) => {
                    const isSelected = selectedSubmissionId === sub._id;
                    const isGraded   = sub.status === "graded";
                    const isLocked   = sub.locked;

                    return (
                      <div
                        key={sub._id}
                        onClick={() => loadSubmission(sub)}
                        className={`flex items-center gap-3 p-4 cursor-pointer transition-colors ${
                          isSelected ? "bg-[#e0f5f7]" : "hover:bg-gray-50"
                        }`}
                      >
                        {/* Avatar */}
                        <div className="w-10 h-10 rounded-xl bg-[#001f24] flex items-center justify-center text-white font-bold text-sm shrink-0">
                          {sub.studentName?.charAt(0) || "؟"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-[#001f24] truncate">
                            {sub.studentName || "طالب غير معروف"}
                          </p>
                          <p className="text-xs text-gray-400">
                            {format(new Date(sub.submittedAt), "dd MMM - HH:mm", { locale: ar })}
                          </p>
                        </div>
                        <div className="text-left shrink-0">
                          {isLocked ? (
                            <span className="flex items-center gap-1 text-xs text-red-500">
                              <Lock className="h-3 w-3" /> مقفل
                            </span>
                          ) : isGraded ? (
                            <div className="text-center">
                              <p className="text-sm font-bold text-green-600">{sub.totalMarks}</p>
                              <p className="text-xs text-gray-400">/{examTotalMarks}</p>
                            </div>
                          ) : (
                            <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                              انتظار
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* ── Right: Grading panel (3 cols) ────────────────── */}
          <div className="lg:col-span-3">
            {!selectedSub ? (
              <div className="bg-white rounded-xl border border-[#c0c8c9] flex items-center justify-center h-64">
                <div className="text-center text-gray-400">
                  <Shield className="h-12 w-12 mx-auto mb-3 text-gray-200" />
                  <p>اختر تسليماً من القائمة لبدء التصحيح</p>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-[#c0c8c9] overflow-hidden">
                {/* Panel header */}
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-[#f7fafa]">
                  <div>
                    <p className="text-base font-bold text-[#001f24]">{selectedSub.studentName}</p>
                    <p className="text-xs text-gray-400">
                      سُلّم: {format(new Date(selectedSub.submittedAt), "dd MMM yyyy HH:mm", { locale: ar })}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-[#1a7a8a]">{totalGiven}</p>
                    <p className="text-xs text-gray-400">/ {examTotalMarks} درجة</p>
                  </div>
                </div>

                {/* Locked warning */}
                {selectedSub.locked && (
                  <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-sm">
                    <Lock className="h-4 w-4 shrink-0" />
                    <span>هذا الامتحان مقفل: {selectedSub.lockReason}</span>
                  </div>
                )}

                {/* Questions */}
                <div className="p-6 space-y-4 max-h-130 overflow-y-auto">
                  {exam.questions?.map((item: any, idx: number) => {
                    const q = item.question;
                    const studentAnswer = selectedSub.answers?.find(
                      (a: any) => a.questionId === q?._id
                    );
                    const maxMarks   = item.marks;
                    const givenMarks = answerGrades[q?._id] ?? "";

                    return (
                      <div key={q?._id || idx} className="border border-gray-100 rounded-xl p-4 space-y-3">
                        {/* Question */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <span className="text-xs font-semibold text-[#1a7a8a] bg-[#e0f5f7] px-2 py-0.5 rounded mb-2 inline-block">
                              س{idx + 1} — {typeMap[q?.type] || q?.type}
                            </span>
                            <p className="text-sm text-[#001f24] mt-1">{q?.questionText}</p>
                          </div>
                          <span className="text-xs text-gray-400 shrink-0">{maxMarks} درجة</span>
                        </div>

                        {/* Student answer */}
                        <div className="bg-gray-50 rounded-lg p-3">
                          <p className="text-xs text-gray-400 mb-1">إجابة الطالب:</p>
                          <p className="text-sm text-[#001f24]">
                            {studentAnswer?.answer || <span className="text-gray-400 italic">لم يجب</span>}
                          </p>
                        </div>

                        {/* MCQ: show correct answer */}
                        {q?.type === "mcq" && q?.options && (
                          <div className="flex flex-wrap gap-2">
                            {q.options.map((opt: any) => (
                              <span
                                key={opt.id}
                                className={`text-xs px-2 py-1 rounded-full border ${
                                  opt.isCorrect
                                    ? "bg-green-100 text-green-700 border-green-200 font-semibold"
                                    : opt.id === studentAnswer?.answer
                                    ? "bg-red-100 text-red-600 border-red-200"
                                    : "bg-gray-100 text-gray-500 border-gray-200"
                                }`}
                              >
                                {opt.isCorrect ? "✓ " : ""}{opt.text}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* True/False: show correct answer */}
                        {q?.type === "true_false" && (
                          <p className="text-xs text-green-600">
                            الإجابة الصحيحة: {q?.correctAnswer === "true" ? "صح ✅" : "خطأ ❌"}
                          </p>
                        )}

                        {/* Marks input */}
                        <div className="flex items-center gap-3 pt-1">
                          <label className="text-sm font-semibold text-gray-700">الدرجة:</label>
                          <Input
                            type="number"
                            min={0}
                            max={maxMarks}
                            value={givenMarks}
                            onChange={(e) => {
                              const val = Math.min(maxMarks, Math.max(0, Number(e.target.value)));
                              setAnswerGrades((prev) => ({ ...prev, [q._id]: val }));
                            }}
                            className="w-20 text-center h-8 text-sm"
                            disabled={selectedSub.locked}
                          />
                          <span className="text-xs text-gray-400">من {maxMarks}</span>
                          {/* Quick fill buttons */}
                          {!selectedSub.locked && (
                            <div className="flex gap-1 ms-auto">
                              <button
                                onClick={() => setAnswerGrades((prev) => ({ ...prev, [q._id]: maxMarks }))}
                                className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
                              >
                                كامل
                              </button>
                              <button
                                onClick={() => setAnswerGrades((prev) => ({ ...prev, [q._id]: 0 }))}
                                className="text-xs px-2 py-1 bg-red-100 text-red-600 rounded hover:bg-red-200 transition-colors"
                              >
                                صفر
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {/* General feedback */}
                  <div className="border border-gray-100 rounded-xl p-4">
                    <label className="text-sm font-semibold text-gray-700 mb-2 block">
                      ملاحظات عامة (اختياري)
                    </label>
                    <textarea
                      value={generalFeedback}
                      onChange={(e) => setGeneralFeedback(e.target.value)}
                      rows={3}
                      placeholder="ملاحظات للطالب..."
                      disabled={selectedSub.locked}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#1a7a8a] disabled:opacity-50"
                    />
                  </div>
                </div>

                {/* Save button */}
                {!selectedSub.locked && (
                  <div className="px-6 py-4 border-t border-gray-100 bg-[#f7fafa]">
                    {error && (
                      <p className="text-sm text-red-600 mb-3 flex items-center gap-2">
                        <AlertCircle className="h-4 w-4" /> {error}
                      </p>
                    )}
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-gray-500">
                        إجمالي الدرجات: <span className="font-bold text-[#001f24]">{totalGiven}</span> / {examTotalMarks}
                      </p>
                      <Button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="bg-[#001f24] hover:bg-[#03363d] text-white gap-2"
                      >
                        {isSaving ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : savedId === selectedSub._id ? (
                          <CheckCircle className="h-4 w-4 text-green-400" />
                        ) : (
                          <Save className="h-4 w-4" />
                        )}
                        {savedId === selectedSub._id ? "تم الحفظ ✓" : "حفظ التصحيح"}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}