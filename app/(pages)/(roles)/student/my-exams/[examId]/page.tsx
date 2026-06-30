// app/(pages)/(roles)/student/exam/[examId]/page.tsx

"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Clock,
  FileText,
  AlertCircle,
  Loader2,
  Send,
  CheckCircle,
  ArrowRight,
  Timer,
  Shield,
  Maximize2,
  Lock,
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { useExamSecurity } from "@/app/hooks/useExamSecurity";

export default function StudentExamPage() {
  const params = useParams();
  const router = useRouter();
  const examId = params.examId as string;

  // ============ STATE ============
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isExamEnded, setIsExamEnded] = useState(false);
  const [isExamActive, setIsExamActive] = useState(false);
  const [isLocking, setIsLocking] = useState(false); // ✅ منع تنفيذ القفل مرتين

  // ============ REFS ============
  const lockAttemptedRef = useRef(false);

  // ============ QUERIES ============
  const exam = useQuery(
    api.exams.exams.getExamById,
    examId ? { examId: examId as any } : "skip"
  );
  const currentUser = useQuery(api.user.auth.getCurrentUser);
  const submission = useQuery(
    api.exams.exams.getStudentExamSubmission,
    currentUser?._id && examId
      ? { examId: examId as any, studentId: currentUser._id as any }
      : "skip"
  );

  // ============ MUTATIONS ============
  const submitExam = useMutation(api.exams.exams.submitExam);
  const lockExam = useMutation(api.exams.exams.lockExamForStudent);

  // ============ LOCK EXAM FUNCTION ============
  const lockExamForStudent = useCallback(async (reason: string) => {
    if (isLocking || lockAttemptedRef.current || !currentUser || !exam) return;
    
    lockAttemptedRef.current = true;
    setIsLocking(true);

    try {
      await lockExam({
        examId: examId as any,
        studentId: currentUser._id as any,
        classId: exam.classIds[0] as any,
        reason: reason,
      });
      
      setIsExamEnded(true);
      setError(`🔒 ${reason}`);
    } catch (error) {
      console.error("Lock exam failed:", error);
    } finally {
      setIsLocking(false);
    }
  }, [currentUser, exam, examId, lockExam, isLocking]);

  // ============ USE EXAM SECURITY ============
  const {
    isFullscreen,
    exitCount,
    warningMessage,
    requestFullscreen,
    maxExitAttempts,
  } = useExamSecurity({
    maxExitAttempts: 2,
    enabled: isExamActive && !submission,
    onMaxAttempts: () => {
      // ✅ عند تجاوز الحد الأقصى، قفل الامتحان
      lockExamForStudent("تم قفل الامتحان بسبب محاولات الخروج المتكررة");
    },
  });

  // ============ HELPERS ============
  const formatTime = useCallback((ms: number) => {
    if (ms <= 0) return "00:00";
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }, []);

  // ============ EXAM STATUS ============
  const examStatus = useMemo(() => {
    if (!exam) return null;
    const now = Date.now();
    const endTime = exam.date + exam.duration * 60 * 1000;
    return {
      isActive: now >= exam.date && now <= endTime,
      isEnded: now > endTime,
      notStarted: now < exam.date,
      remaining: Math.max(0, endTime - now),
    };
  }, [exam]);

  // ============ EFFECTS ============
  useEffect(() => {
    if (exam && !submission && examStatus) {
      setIsExamActive(examStatus.isActive);
    } else {
      setIsExamActive(false);
    }
  }, [exam, submission, examStatus]);

  // Timer
  useEffect(() => {
    if (!exam || !examStatus?.isActive || submission || isExamEnded) return;

    setTimeLeft(examStatus.remaining);

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        const newTime = Math.max(0, prev - 1000);
        if (newTime === 0) handleAutoSubmit();
        return newTime;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [exam, examStatus, submission, isExamEnded]);

  // ============ AUTO SUBMIT ============
  const handleAutoSubmit = useCallback(async () => {
    if (!exam || Object.keys(answers).length === 0) return;

    try {
      const answersArray = Object.entries(answers).map(([qId, answer]) => ({
        questionId: qId as any,
        answer,
      }));

      await submitExam({
        examId: examId as any,
        classId: exam.classIds[0] as any,
        answers: answersArray as any,
      });

      setSuccess("✅ تم التسليم تلقائياً بعد انتهاء الوقت");
      setIsExamActive(false);
      setTimeout(() => router.push("/student/my-exams"), 1500);
    } catch (error) {
      console.error("Auto submit failed:", error);
    }
  }, [answers, exam, examId, submitExam, router]);

  // ============ HANDLERS ============
  const handleAnswerChange = (questionId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleMCQAnswer = (questionId: string, optionId: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: optionId }));
  };

  const handleSubmit = async () => {
    if (!exam) return;

    const unanswered = exam.questions.filter((q: any) => !answers[q.question._id]);
    if (unanswered.length > 0) {
      setError(`⚠️ يرجى الإجابة على ${unanswered.length} سؤال غير مجاب`);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const answersArray = Object.entries(answers).map(([qId, answer]) => ({
        questionId: qId as any,
        answer,
      }));

      await submitExam({
        examId: examId as any,
        classId: exam.classIds[0] as any,
        answers: answersArray as any,
      });

      setSuccess("✅ تم تسليم الامتحان بنجاح");
      setIsExamActive(false);
      if (document.fullscreenElement) await document.exitFullscreen();
      setTimeout(() => router.push("/student/my-exams"), 1500);
    } catch (error: any) {
      setError(error.message || "حدث خطأ أثناء التسليم");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ============ LOADING ============
  if (exam === undefined || currentUser === undefined) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-[#1a7a8a]" />
      </div>
    );
  }

  // ============ NOT FOUND ============
  if (!exam) {
    return (
      <div className="container mx-auto p-6" dir="rtl">
        <Card className="p-12 text-center">
          <AlertCircle className="h-12 w-12 mx-auto text-red-500 mb-4" />
          <h2 className="text-xl font-bold">الامتحان غير موجود</h2>
          <Link href="/student/my-exams">
            <Button className="mt-4 bg-[#001f24] text-white hover:bg-[#03363d]">
              <ArrowRight className="h-4 w-4 ml-2" />
              العودة
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  // ============ CHECK LOCK ============
  // ✅ التحقق من القفل - أولوية قصوى
  if (submission?.locked) {
    return (
      <div className="container mx-auto p-6" dir="rtl">
        <Card className="p-8 text-center border-red-500 border-2">
          <Lock className="h-16 w-16 mx-auto text-red-500 mb-4" />
          <h2 className="text-2xl font-bold text-red-600 mb-2">🔒 الامتحان مقفل</h2>
          <p className="text-gray-600 mb-4">
            {submission.lockReason || "تم قفل الامتحان بسبب محاولات الخروج المتكررة"}
          </p>
          <div className="p-4 bg-red-50 rounded-lg mb-4">
            <p className="text-sm text-red-700">
              📅 تم القفل: {submission.lockedAt ? format(new Date(submission.lockedAt), "dd MMMM yyyy - HH:mm", { locale: ar }) : "غير معروف"}
            </p>
            <p className="text-sm text-red-700 mt-1">
              📊 الدرجة: 0 / {exam.totalMarks}
            </p>
          </div>
          <Link href="/student/my-exams">
            <Button className="bg-[#001f24] text-white hover:bg-[#03363d]">
              <ArrowRight className="h-4 w-4 ml-2" />
              العودة للامتحانات
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  // ============ NOT STARTED ============
  if (examStatus?.notStarted) {
    return (
      <div className="container mx-auto p-6" dir="rtl">
        <Card className="p-8 text-center">
          <Clock className="h-16 w-16 mx-auto text-blue-500 mb-4" />
          <h2 className="text-xl font-bold">الامتحان لم يبدأ بعد</h2>
          <p className="text-gray-500">
            سيبدأ في {format(new Date(exam.date), "dd MMMM yyyy - HH:mm", { locale: ar })}
          </p>
          <Link href="/student/my-exams">
            <Button className="mt-4 bg-[#001f24] text-white hover:bg-[#03363d]">
              <ArrowRight className="h-4 w-4 ml-2" />
              العودة
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  // ============ SUBMITTED ============
  if (submission) {
    const isGraded = submission.status === "graded";
    return (
      <div className="container mx-auto p-6" dir="rtl">
        <Card className="p-8 text-center">
          {isGraded ? (
            <>
              <CheckCircle className="h-16 w-16 mx-auto text-green-500 mb-4" />
              <h2 className="text-xl font-bold">تم التصحيح</h2>
              {submission.totalMarks !== undefined && (
                <div className="mt-4 p-4 bg-green-50 rounded-lg">
                  <p className="text-lg font-bold text-green-700">
                    درجتك: {submission.totalMarks} / {exam.totalMarks}
                  </p>
                </div>
              )}
            </>
          ) : (
            <>
              <Clock className="h-16 w-16 mx-auto text-amber-500 mb-4 animate-pulse" />
              <h2 className="text-xl font-bold">في انتظار التصحيح</h2>
              <p className="text-gray-500">تم التسليم بنجاح، ينتظر تصحيح المعلم</p>
            </>
          )}
          <Link href="/student/my-exams">
            <Button className="mt-4 bg-[#001f24] text-white hover:bg-[#03363d]">
              <ArrowRight className="h-4 w-4 ml-2" />
              العودة
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  // ============ ENDED ============
  if (examStatus?.isEnded || isExamEnded) {
    return (
      <div className="container mx-auto p-6" dir="rtl">
        <Card className="p-8 text-center">
          <AlertCircle className="h-16 w-16 mx-auto text-red-500 mb-4" />
          <h2 className="text-xl font-bold">انتهى وقت الامتحان</h2>
          <p className="text-gray-500">عذراً، انتهى الوقت المخصص لهذا الامتحان</p>
          <Link href="/student/my-exams">
            <Button className="mt-4 bg-[#001f24] text-white hover:bg-[#03363d]">
              <ArrowRight className="h-4 w-4 ml-2" />
              العودة
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  // ============ RENDER EXAM ============
  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* Warning Bar */}
      {isExamActive && warningMessage && (
        <div className={`sticky top-0 z-50 px-4 py-2 text-center text-sm font-medium ${
          exitCount >= maxExitAttempts ? "bg-red-500 text-white animate-pulse" : "bg-amber-500 text-white"
        }`}>
          <Shield className="h-4 w-4 inline ml-2" />
          {warningMessage}
        </div>
      )}

      {/* Fullscreen Notice */}
      {isExamActive && !isFullscreen && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-amber-500 text-white px-6 py-3 rounded-lg shadow-lg animate-pulse">
          <div className="flex items-center gap-3">
            <Maximize2 className="h-5 w-5" />
            <span>⚠️ الرجاء تفعيل ملء الشاشة</span>
            <Button 
              onClick={requestFullscreen}
              size="sm"
              className="bg-white text-amber-600 hover:bg-gray-100"
            >
              تفعيل
            </Button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="container mx-auto p-4 space-y-4">
        {/* Header */}
        <div className="flex flex-wrap justify-between items-center gap-2">
          <div>
            <h1 className="text-xl font-bold text-[#001f24]">{exam.title}</h1>
            <p className="text-sm text-gray-500">{exam.subject}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-[#e0f5f7] rounded-lg">
              <Timer className="h-4 w-4 text-[#1a7a8a]" />
              <span className="font-mono font-bold text-[#1a7a8a]">{formatTime(timeLeft)}</span>
            </div>
            {exitCount > 0 && (
              <Badge variant="outline" className="border-red-500 text-red-500">
                ⚠️ {exitCount}/{maxExitAttempts}
              </Badge>
            )}
          </div>
        </div>

        {/* Instructions */}
        <Card>
          <CardContent className="p-4">
            <ul className="text-sm text-gray-600 space-y-1">
              <li>📝 عدد الأسئلة: {exam.questions.length}</li>
              <li>📊 الدرجة الكلية: {exam.totalMarks}</li>
              <li>⏱️ المدة: {exam.duration} دقيقة</li>
              {isExamActive && (
                <li className="text-red-500">⚠️ ممنوع الخروج (الحد الأقصى {maxExitAttempts} محاولات)</li>
              )}
            </ul>
          </CardContent>
        </Card>

        {/* Questions */}
        <div className="space-y-4">
          {exam.questions.map((item: any, idx: number) => {
            const q = item.question;
            const userAnswer = answers[q._id];

            return (
              <Card key={q._id}>
                <CardHeader className="pb-1">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-[#1a7a8a] bg-[#e0f5f7] px-3 py-0.5 rounded text-sm">
                      س{idx + 1}
                    </span>
                    <Badge variant="outline">{item.marks} درجات</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-gray-700">{q.questionText}</p>

                  {q.type === "mcq" && q.options && (
                    <div className="space-y-2">
                      {q.options.map((opt: any) => (
                        <label
                          key={opt.id}
                          className={`flex items-center gap-3 p-2 rounded-lg border-2 cursor-pointer transition ${
                            userAnswer === opt.id ? "border-[#1a7a8a] bg-[#e0f5f7]" : "border-gray-200 hover:border-[#1a7a8a]"
                          }`}
                        >
                          <input
                            type="radio"
                            name={`q-${q._id}`}
                            value={opt.id}
                            checked={userAnswer === opt.id}
                            onChange={() => handleMCQAnswer(q._id, opt.id)}
                            className="w-4 h-4"
                          />
                          <span className="text-sm">{opt.text}</span>
                        </label>
                      ))}
                    </div>
                  )}

                  {q.type === "true_false" && (
                    <div className="grid grid-cols-2 gap-3">
                      {["true", "false"].map((val) => (
                        <label
                          key={val}
                          className={`flex items-center justify-center p-3 rounded-lg border-2 cursor-pointer transition ${
                            userAnswer === val ? "border-[#1a7a8a] bg-[#e0f5f7]" : "border-gray-200 hover:border-[#1a7a8a]"
                          }`}
                        >
                          <input
                            type="radio"
                            name={`q-${q._id}`}
                            value={val}
                            checked={userAnswer === val}
                            onChange={() => handleAnswerChange(q._id, val)}
                            className="w-4 h-4"
                          />
                          <span className="text-sm">{val === "true" ? "صح ✅" : "خطأ ❌"}</span>
                        </label>
                      ))}
                    </div>
                  )}

                  {q.type === "essay" && (
                    <textarea
                      value={userAnswer || ""}
                      onChange={(e) => handleAnswerChange(q._id, e.target.value)}
                      className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-[#1a7a8a]"
                      rows={3}
                      placeholder="أدخل إجابتك..."
                    />
                  )}

                  {q.type === "fill_blank" && (
                    <input
                      type="text"
                      value={userAnswer || ""}
                      onChange={(e) => handleAnswerChange(q._id, e.target.value)}
                      className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-[#1a7a8a]"
                      placeholder="أدخل الإجابة..."
                    />
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Submit */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          {error && (
            <div className="flex-1 p-2 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {error}
            </div>
          )}
          {success && (
            <div className="flex-1 p-2 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
              {success}
            </div>
          )}
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || timeLeft <= 0 || isLocking}
            className="bg-[#001f24] hover:bg-[#03363d] text-white"
          >
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4 ml-2" />}
            تسليم
          </Button>
        </div>
      </div>
    </div>
  );
}