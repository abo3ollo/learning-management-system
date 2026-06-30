// app/(pages)/(roles)/student/my-assignments/[assignmentId]/page.tsx

"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRight,
  Calendar,
  Clock,
  FileText,
  Upload,
  Download,
  CheckCircle,
  AlertCircle,
  Loader2,
  BookOpen,
  Send,
  X,
  Eye,
  ListChecks,
  FileQuestion,
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

export default function StudentAssignmentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const assignmentId = params.assignmentId as string;

  // ✅ State للتسليم
  const [content, setContent] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // ✅ State للإجابات
  const [answers, setAnswers] = useState<Record<string, any>>({});

  // ✅ جلب بيانات الواجب
  const assignment = useQuery(
    api.assignments.assignments.getAssignmentById,
    assignmentId ? { assignmentId: assignmentId as any } : "skip"
  );

  // ✅ جلب بيانات الطالب الحالي
  const currentUser = useQuery(api.user.auth.getCurrentUser);

  // ✅ جلب تسليم الطالب لهذا الواجب
  const studentSubmission = useQuery(
    api.submissions.submissions.getStudentSubmissions,
    currentUser?._id && assignmentId
      ? {
          studentId: currentUser._id as any,
          assignmentId: assignmentId as any,
        }
      : "skip"
  );

  // ✅ دوال الـ Mutations
  const submitAssignment = useMutation(api.submissions.submissions.submitAssignment);
  const resubmitAssignment = useMutation(api.submissions.submissions.resubmitAssignment);

  // حالة التحميل
  if (
    assignment === undefined ||
    currentUser === undefined ||
    studentSubmission === undefined
  ) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-[#1a7a8a]" />
      </div>
    );
  }

  // لو الواجب مش موجود
  if (!assignment) {
    return (
      <div className="container mx-auto p-6" dir="rtl">
        <Card className="p-12 text-center">
          <AlertCircle className="h-12 w-12 mx-auto text-red-500 mb-4" />
          <h2 className="text-2xl font-bold text-gray-700 mb-2">الواجب غير موجود</h2>
          <p className="text-gray-500">الواجب الذي تبحث عنه غير موجود أو تم حذفه</p>
          <Link href="/student/my-assignments">
            <Button className="mt-4 bg-[#001f24] hover:bg-[#03363d] text-white">
              <ArrowRight className="h-4 w-4 ml-2" />
              العودة للواجبات
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  // ✅ بيانات التسليم الحالي
  const submission = studentSubmission?.[0] || null;
  const isSubmitted = !!submission;
  const isGraded = submission?.status === "graded";
  const isLate = submission?.isLate || false;
  const canSubmit = !isSubmitted || assignment.allowResubmission;

  // ✅ الأسئلة
  const assignmentQuestions = assignment.questionDetails || [];

  // ✅ دوال مساعدة
  const getStatusBadge = () => {
    if (isGraded) {
      return <Badge className="bg-green-500 text-white">تم التصحيح</Badge>;
    }
    if (isSubmitted) {
      return <Badge className="bg-blue-500 text-white">مسلم</Badge>;
    }
    return <Badge className="bg-amber-500 text-white">في الانتظار</Badge>;
  };

  const getStatusIcon = () => {
    if (isGraded) {
      return <CheckCircle className="h-6 w-6 text-green-500" />;
    }
    if (isSubmitted) {
      return <FileText className="h-6 w-6 text-blue-500" />;
    }
    return <Clock className="h-6 w-6 text-amber-500" />;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFiles(Array.from(e.target.files));
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // ✅ دوال الأسئلة
  const handleAnswerChange = (questionId: string, value: any) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: value,
    }));
  };

  const handleMCQAnswer = (questionId: string, optionId: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: optionId,
    }));
  };

  const handleTrueFalseAnswer = (questionId: string, value: boolean) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: value,
    }));
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

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "easy": return "bg-green-100 text-green-700";
      case "medium": return "bg-amber-100 text-amber-700";
      case "hard": return "bg-red-100 text-red-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  const getDifficultyLabel = (difficulty: string) => {
    switch (difficulty) {
      case "easy": return "سهل";
      case "medium": return "متوسط";
      case "hard": return "صعب";
      default: return difficulty;
    }
  };

  // ✅ تقديم الواجب - مع إرسال الإجابات
  const handleSubmit = async () => {
    if (!currentUser) return;

    // ✅ التحقق من الإجابة على جميع الأسئلة
    if (assignmentQuestions.length > 0) {
      const unanswered = assignmentQuestions.filter(
        (q: any) => !answers[q._id] || answers[q._id] === "" || answers[q._id] === undefined
      );

      if (unanswered.length > 0) {
        setError(`⚠️ يرجى الإجابة على ${unanswered.length} سؤال غير مجاب`);
        return;
      }
    }

    // ✅ التحقق من وجود محتوى أو ملفات
    if (!content.trim() && selectedFiles.length === 0) {
      setError("يرجى إضافة محتوى أو رفع ملفات");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const attachments = selectedFiles.map((file) => ({
        name: file.name,
        url: URL.createObjectURL(file),
        size: file.size,
        type: file.type,
      }));

      // ✅ تحويل answers إلى الصيغة المطلوبة
      const answersArray = Object.entries(answers).map(([questionId, answer]) => ({
        questionId: questionId as any,
        answer: String(answer),
      }));

      const submissionData = {
        content: content,
        attachments: attachments,
        answers: answersArray,
      };

      if (isSubmitted && assignment.allowResubmission) {
        await resubmitAssignment({
          submissionId: submission!._id,
          ...submissionData,
        });
        setSuccess("تم إعادة تسليم الواجب بنجاح");
      } else {
        await submitAssignment({
          assignmentId: assignmentId as any,
          classId: assignment.classIds[0] as any,
          ...submissionData,
        });
        setSuccess("تم تسليم الواجب بنجاح");
      }

      setSelectedFiles([]);
      setContent("");
      setAnswers({});

      setTimeout(() => {
        router.refresh();
      }, 1000);
    } catch (error: any) {
      setError(error.message || "حدث خطأ أثناء التسليم");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getTimeRemaining = (dueDate: number) => {
    const now = Date.now();
    const diff = dueDate - now;

    if (diff <= 0) {
      return { text: "انتهى الوقت", color: "text-red-500", expired: true };
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) {
      return {
        text: `${days} يوم متبقي`,
        color: "text-green-600",
        expired: false,
      };
    } else if (hours > 0) {
      return {
        text: `${hours} ساعة متبقي`,
        color: "text-amber-600",
        expired: false,
      };
    } else {
      return {
        text: `${minutes} دقيقة متبقي`,
        color: "text-orange-600",
        expired: false,
      };
    }
  };

  const timeRemaining = getTimeRemaining(assignment.dueDate);

  // ✅ دالة عرض السؤال حسب نوعه
  const renderQuestion = (question: any, index: number) => {
    const userAnswer = answers[question._id];

    switch (question.type) {
      case "mcq":
        return (
          <div className="space-y-3">
            {question.options?.map((option: any) => (
              <label
                key={option.id}
                className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                  userAnswer === option.id
                    ? "border-[#1a7a8a] bg-[#e0f5f7]"
                    : "border-[#c0c8c9] hover:border-[#1a7a8a]"
                }`}
              >
                <input
                  type="radio"
                  name={`question-${question._id}`}
                  value={option.id}
                  checked={userAnswer === option.id}
                  onChange={() => handleMCQAnswer(question._id, option.id)}
                  className="w-4 h-4 text-[#1a7a8a] focus:ring-[#1a7a8a]"
                />
                <span className="text-sm text-gray-700">{option.text}</span>
              </label>
            ))}
          </div>
        );

      case "true_false":
        return (
          <div className="grid grid-cols-2 gap-4">
            {[
              { value: true, label: "صح ✅" },
              { value: false, label: "خطأ ❌" },
            ].map((opt) => (
              <label
                key={String(opt.value)}
                className={`flex items-center justify-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                  userAnswer === opt.value
                    ? "border-[#1a7a8a] bg-[#e0f5f7]"
                    : "border-[#c0c8c9] hover:border-[#1a7a8a]"
                }`}
              >
                <input
                  type="radio"
                  name={`question-${question._id}`}
                  value={String(opt.value)}
                  checked={userAnswer === opt.value}
                  onChange={() => handleTrueFalseAnswer(question._id, opt.value)}
                  className="w-4 h-4 text-[#1a7a8a] focus:ring-[#1a7a8a]"
                />
                <span className="text-sm font-medium">{opt.label}</span>
              </label>
            ))}
          </div>
        );

      case "essay":
        return (
          <textarea
            value={userAnswer || ""}
            onChange={(e) => handleAnswerChange(question._id, e.target.value)}
            className="w-full px-3 py-2 border border-[#c0c8c9] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a7a8a] resize-none"
            rows={4}
            placeholder="أدخل إجابتك هنا..."
            disabled={isSubmitting}
          />
        );

      case "fill_blank":
        return (
          <Input
            value={userAnswer || ""}
            onChange={(e) => handleAnswerChange(question._id, e.target.value)}
            className="w-full"
            placeholder="أدخل الإجابة الصحيحة..."
            disabled={isSubmitting}
          />
        );

      default:
        return (
          <textarea
            value={userAnswer || ""}
            onChange={(e) => handleAnswerChange(question._id, e.target.value)}
            className="w-full px-3 py-2 border border-[#c0c8c9] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a7a8a] resize-none"
            rows={3}
            placeholder="أدخل إجابتك هنا..."
            disabled={isSubmitting}
          />
        );
    }
  };

  // ✅ عدد الأسئلة المجاب عليها
  const answeredCount = Object.keys(answers).filter(
    (qId) => answers[qId] && answers[qId] !== ""
  ).length;

  return (
    <div className="container mx-auto p-6 space-y-6" dir="rtl">
      {/* ✅ Back Button */}
      <Link href="/student/my-assignments">
        <Button variant="ghost" className="gap-2">
          <ArrowRight className="h-4 w-4" />
          العودة للواجبات
        </Button>
      </Link>

      {/* ✅ Assignment Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-bold text-[#001f24]">
                  {assignment.title}
                </h1>
                {getStatusBadge()}
              </div>
              <div className="flex flex-wrap gap-4 mt-3">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="h-4 w-4 text-[#1a7a8a]" />
                  <span>
                    التسليم:{" "}
                    {format(new Date(assignment.dueDate), "dd MMMM yyyy - h:mm a", {
                      locale: ar,
                    })}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-[#1a7a8a]" />
                  <span className={timeRemaining.color}>{timeRemaining.text}</span>
                </div>
                {isLate && (
                  <div className="flex items-center gap-2 text-sm text-red-500">
                    <AlertCircle className="h-4 w-4" />
                    <span>متأخر</span>
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {getStatusIcon()}
              <span className="text-sm font-medium">
                {isGraded
                  ? `الدرجة: ${submission?.grade || 0} / ${assignment.fullGrade}`
                  : isSubmitted
                  ? "تم التسليم"
                  : "في انتظار التسليم"}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ✅ Assignment Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          {assignment.description && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">وصف الواجب</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 whitespace-pre-wrap">
                  {assignment.description}
                </p>
              </CardContent>
            </Card>
          )}

          {/* ✅ Questions Section */}
          {assignmentQuestions.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <ListChecks className="h-5 w-5 text-[#1a7a8a]" />
                    أسئلة الواجب
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">
                      {answeredCount}/{assignmentQuestions.length}
                    </Badge>
                    {answeredCount === assignmentQuestions.length ? (
                      <Badge className="bg-green-500 text-white">✓ مكتمل</Badge>
                    ) : (
                      <Badge variant="outline" className="text-amber-500 border-amber-500">
                        {assignmentQuestions.length - answeredCount} متبقي
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {assignmentQuestions.map((question: any, index: number) => (
                  <div
                    key={question._id}
                    className="border border-[#c0c8c9] rounded-lg p-4 hover:border-[#1a7a8a] transition-colors"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-[#1a7a8a]">
                          سؤال {index + 1}
                        </span>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full ${getDifficultyColor(
                            question.difficulty
                          )}`}
                        >
                          {getDifficultyLabel(question.difficulty)}
                        </span>
                        <span className="text-xs text-gray-500">
                          {question.points} نقطة
                        </span>
                      </div>
                      <Badge
                        variant="outline"
                        className={`text-xs ${getDifficultyColor(
                          question.difficulty
                        )}`}
                      >
                        {getTypeLabel(question.type)}
                      </Badge>
                    </div>

                    <div className="space-y-3">
                      <p className="text-sm font-medium text-[#001f24]">
                        {question.questionText}
                      </p>

                      {question.imageUrl && (
                        <img
                          src={question.imageUrl}
                          alt="Question"
                          className="max-h-48 rounded-lg"
                        />
                      )}

                      {/* ✅ Render question based on type */}
                      {renderQuestion(question, index)}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Attachments */}
          {assignment.attachments && assignment.attachments.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">ملفات الواجب</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {assignment.attachments.map((file: any, index: number) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-[#f7fafa] rounded-lg border border-[#c0c8c9]"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-[#1a7a8a]" />
                        <div>
                          <p className="text-sm font-medium text-[#001f24]">
                            {file.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {(file.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                      <a href={file.url} target="_blank" rel="noopener noreferrer">
                        <Button variant="ghost" size="sm">
                          <Download className="h-4 w-4" />
                        </Button>
                      </a>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* ✅ Submission Area */}
          {canSubmit && !isGraded && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  {isSubmitted ? "إعادة تسليم الواجب" : "تسليم الواجب"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    {error}
                  </div>
                )}

                {success && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700 flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    {success}
                  </div>
                )}

                {isSubmitted && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
                    <p>
                      📝{" "}
                      {assignment.allowResubmission
                        ? "يمكنك إعادة تسليم الواجب، سيتم استبدال التسليم السابق"
                        : "لقد قمت بتسليم هذا الواجب بالفعل"}
                    </p>
                  </div>
                )}

                {/* Content */}
                <div className="space-y-2">
                  <Label htmlFor="content">المحتوى</Label>
                  <textarea
                    id="content"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="w-full px-3 py-2 border border-[#c0c8c9] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a7a8a] resize-none"
                    rows={4}
                    placeholder="أدخل محتوى الواجب..."
                    disabled={isSubmitting}
                  />
                </div>

                {/* File Upload */}
                <div>
                  <Label>الملفات المرفقة</Label>
                  <div className="mt-2 border-2 border-dashed border-[#c0c8c9] rounded-lg p-6 text-center hover:border-[#1a7a8a] transition-colors">
                    <Upload className="h-10 w-10 mx-auto text-gray-400 mb-2" />
                    <p className="text-sm text-gray-500">
                      اسحب الملفات هنا أو اضغط للاختيار
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {assignment.allowedFileTypes?.join(", ") || "جميع الأنواع"}
                      (حد أقصى {assignment.maxFileSize || 10}MB)
                    </p>
                    <input
                      type="file"
                      multiple
                      className="hidden"
                      id="file-upload"
                      onChange={handleFileChange}
                      disabled={isSubmitting}
                    />
                    <Button
                      variant="outline"
                      className="mt-3"
                      onClick={() => document.getElementById("file-upload")?.click()}
                      disabled={isSubmitting}
                    >
                      <Upload className="h-4 w-4 ml-2" />
                      اختر ملفات
                    </Button>
                  </div>
                </div>

                {/* Selected Files */}
                {selectedFiles.length > 0 && (
                  <div className="space-y-2">
                    <Label>الملفات المختارة</Label>
                    {selectedFiles.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-[#f7fafa] rounded-lg border border-[#c0c8c9]"
                      >
                        <div className="flex items-center gap-3">
                          <FileText className="h-5 w-5 text-[#1a7a8a]" />
                          <div>
                            <p className="text-sm font-medium text-[#001f24]">
                              {file.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {(file.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => removeFile(index)}
                          className="p-1 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          disabled={isSubmitting}
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* ✅ Submit Button */}
                <Button
                  onClick={handleSubmit}
                  disabled={
                    isSubmitting ||
                    (!content.trim() && selectedFiles.length === 0) ||
                    (assignmentQuestions.length > 0 && answeredCount < assignmentQuestions.length)
                  }
                  className="w-full bg-[#001f24] hover:bg-[#03363d] text-white"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin ml-2" />
                      جاري التسليم...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 ml-2" />
                      {isSubmitted ? "إعادة التسليم" : "تسليم الواجب"}
                    </>
                  )}
                </Button>

                {/* ✅ حالة الإجابات */}
                {assignmentQuestions.length > 0 && (
                  <div className="text-center text-sm">
                    {answeredCount === assignmentQuestions.length ? (
                      <p className="text-green-600">✅ تم الإجابة على جميع الأسئلة</p>
                    ) : (
                      <p className="text-amber-600">
                        ⚠️ تم الإجابة على {answeredCount} من {assignmentQuestions.length} سؤال
                        <span className="block text-xs text-gray-400 mt-1">
                          يرجى الإجابة على جميع الأسئلة قبل التسليم
                        </span>
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* ✅ Sidebar */}
        <div className="space-y-6">
          {/* Assignment Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">معلومات الواجب</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-xs text-gray-500">النوع</p>
                <p className="text-sm font-medium">
                  {assignment.type === "assignment" && "واجب"}
                  {assignment.type === "quiz" && "اختبار"}
                  {assignment.type === "exam" && "امتحان"}
                  {assignment.type === "project" && "مشروع"}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">الدرجة الكاملة</p>
                <p className="text-sm font-medium">{assignment.fullGrade}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">درجة النجاح</p>
                <p className="text-sm font-medium">{assignment.passingGrade}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">الوزن</p>
                <p className="text-sm font-medium">{assignment.weight}%</p>
              </div>
              {assignment.maxAttempts && (
                <div>
                  <p className="text-xs text-gray-500">أقصى عدد محاولات</p>
                  <p className="text-sm font-medium">{assignment.maxAttempts}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Submission Info */}
          {isSubmitted && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">معلومات التسليم</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-xs text-gray-500">تاريخ التسليم</p>
                  <p className="text-sm font-medium">
                    {format(
                      new Date(submission.submittedAt),
                      "dd MMMM yyyy - HH:mm",
                      { locale: ar }
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">عدد المحاولة</p>
                  <p className="text-sm font-medium">{submission.attemptNumber}</p>
                </div>
                {submission.isLate && (
                  <div className="p-2 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                    ⚠️ تم التسليم متأخراً
                  </div>
                )}
                {isGraded && submission.grade !== undefined && (
                  <div className="p-2 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm text-green-700 font-medium">
                      الدرجة: {submission.grade} / {assignment.fullGrade}
                    </p>
                    {submission.feedback && (
                      <p className="text-sm text-gray-600 mt-1">
                        الملاحظات: {submission.feedback}
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Files */}
          {submission?.attachments && submission.attachments.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">ملفات التسليم</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {submission.attachments.map((file: any, index: number) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 bg-[#f7fafa] rounded-lg border border-[#c0c8c9]"
                    >
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-[#1a7a8a]" />
                        <span className="text-sm truncate max-w-37.5">
                          {file.name}
                        </span>
                      </div>
                      <a href={file.url} target="_blank" rel="noopener noreferrer">
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </a>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}