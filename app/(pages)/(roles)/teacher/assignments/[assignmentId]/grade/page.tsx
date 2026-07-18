// app/(pages)/(roles)/teacher/assignments/[assignmentId]/grade/page.tsx

"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRight,
  Loader2,
  FileText,
  User,
  CheckCircle,
  XCircle,
  Send,
  AlertCircle,
  Users,
  Clock,
  FileEdit,
} from "lucide-react";
import Link from "next/link";

export default function GradeAssignmentPage() {
  const params = useParams();
  const router = useRouter();
  const assignmentId = params.assignmentId as string;

  const [selectedSubmission, setSelectedSubmission] = useState<any>(null);
  const [grade, setGrade] = useState<number>(0);
  const [feedback, setFeedback] = useState("");
  const [isGrading, setIsGrading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // ✅ جلب بيانات الواجب
  const assignment = useQuery(
    api.assignments.assignments.getAssignmentById,
    assignmentId ? { assignmentId: assignmentId as any } : "skip",
  );

  // ✅ جلب تسليمات الواجب
  const submissions = useQuery(
    api.submissions.submissions.getSubmissionsByAssignment,
    assignmentId ? { assignmentId: assignmentId as any } : "skip",
  );

  // ✅ جلب بيانات المستخدم الحالي
  const currentUser = useQuery(api.user.auth.getCurrentUser);

  // ✅ جلب المجموعات التي يتبعها المعلم
  const myGroups = useQuery(api.groups.groups.getTeacherGroups, {});

  // ✅ Mutation للتصحيح
  const gradeSubmission = useMutation(
    api.submissions.submissions.gradeSubmission,
  );

  // حالة التحميل
  if (
    assignment === undefined ||
    submissions === undefined ||
    currentUser === undefined ||
    myGroups === undefined
  ) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-[#1a7a8a]" />
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="container mx-auto p-6" dir="rtl">
        <Card className="p-12 text-center">
          <AlertCircle className="h-12 w-12 mx-auto text-red-500 mb-4" />
          <h2 className="text-2xl font-bold text-gray-700 mb-2">
            الواجب غير موجود
          </h2>
          <Link href="/teacher/assignments">
            <Button className="mt-4 bg-[#001f24] hover:bg-[#03363d] text-white">
              <ArrowRight className="h-4 w-4 ml-2" />
              العودة للواجبات
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  // ✅ التحقق من صلاحية المعلم (موسع)
  const canGrade = () => {
    if (!currentUser || !assignment) return false;

    // الأدمن يسمح له بكل شيء
    if (currentUser.role === "admin") return true;

    // المعلم فقط
    if (currentUser.role !== "teacher") return false;

    // 1. هل المعلم هو منشئ الواجب؟
    if (assignment.createdBy === currentUser._id) return true;

    // 2. هل المعلم مشرف أو مدرس في أي من المجموعات المستهدفة؟
    if (assignment.groupIds && assignment.groupIds.length > 0) {
      for (const groupId of assignment.groupIds) {
        const group = myGroups?.find((g: any) => g._id === groupId);
        if (group) {
          const isSupervisor = group.supervisorId === currentUser._id;
          const isTeacher =
            group.teachers && group.teachers.includes(currentUser._id);
          if (isSupervisor || isTeacher) {
            return true;
          }
        }
      }
    }

    return false;
  };

  // ✅ إذا لم يكن لديه صلاحية
  if (!canGrade()) {
    return (
      <div className="container mx-auto p-6" dir="rtl">
        <Card className="p-12 text-center">
          <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="h-10 w-10 text-red-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-700 mb-2">غير مصرح</h2>
          <p className="text-gray-500">ليس لديك صلاحية لتصحيح هذا الواجب</p>
          <div className="mt-4 text-sm text-gray-400">
            <p>أنت لست:</p>
            <ul className="list-disc list-inside mt-2">
              <li>منشئ الواجب</li>
              <li>مشرف على أي من المجموعات المستهدفة</li>
              <li>مدرس في أي من المجموعات المستهدفة</li>
            </ul>
          </div>
          <Link href="/teacher/assignments">
            <Button className="mt-6 bg-[#001f24] hover:bg-[#03363d] text-white">
              <ArrowRight className="h-4 w-4 ml-2" />
              العودة للواجبات
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  // ✅ إحصائيات التسليمات
  const totalSubmissions = submissions.length;
  const gradedCount = submissions.filter(
    (s: any) => s.status === "graded",
  ).length;
  const pendingCount = totalSubmissions - gradedCount;

  // ✅ دوال مساعدة
  const getTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      assignment: "واجب",
      quiz: "اختبار",
      exam: "امتحان",
      project: "مشروع",
    };
    return types[type] || type;
  };

  const handleSelectSubmission = (submission: any) => {
    setSelectedSubmission(submission);
    setGrade(submission.grade || 0);
    setFeedback(submission.feedback || "");
    setError(null);
  };

  const handleGrade = async () => {
    if (!selectedSubmission) {
      setError("يرجى اختيار تسليم للتصحيح");
      return;
    }

    if (grade < 0 || grade > assignment.fullGrade) {
      setError(`الدرجة يجب أن تكون بين 0 و ${assignment.fullGrade}`);
      return;
    }

    setIsGrading(true);
    setError(null);

    try {
      await gradeSubmission({
        submissionId: selectedSubmission._id,
        grade: grade,
        feedback: feedback || undefined,
      });

      setSuccess("تم تصحيح التسليم بنجاح!");
      setSelectedSubmission(null);
      setGrade(0);
      setFeedback("");

      setTimeout(() => {
        setSuccess(null);
        router.refresh();
      }, 2000);
    } catch (error: any) {
      setError(error.message || "حدث خطأ أثناء التصحيح");
    } finally {
      setIsGrading(false);
    }
  };

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6" dir="rtl">
      {/* Back Button */}
      <Link href="/teacher/assignments">
        <Button variant="ghost" className="gap-2">
          <ArrowRight className="h-4 w-4" />
          العودة للواجبات
        </Button>
      </Link>

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#001f24]">
            تصحيح الواجب
          </h1>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-lg font-semibold text-[#001f24]">
              {assignment.title}
            </span>
            <Badge className="bg-[#1a7a8a] text-white">
              {getTypeLabel(assignment.type)}
            </Badge>
            <span className="text-sm text-gray-500">
              الدرجة الكاملة: {assignment.fullGrade}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-[#1a7a8a]">
              {totalSubmissions}
            </p>
            <p className="text-xs text-gray-500">إجمالي التسليمات</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-500">{gradedCount}</p>
            <p className="text-xs text-gray-500">مصحح</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-amber-500">{pendingCount}</p>
            <p className="text-xs text-gray-500">قيد الانتظار</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* قائمة التسليمات */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="h-5 w-5 text-[#1a7a8a]" />
                التسليمات ({totalSubmissions})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {submissions.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 mx-auto text-gray-300 mb-2" />
                  <p className="text-gray-500">لا توجد تسليمات لهذا الواجب</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {submissions.map((submission: any) => {
                    const isSelected =
                      selectedSubmission?._id === submission._id;
                    const isGraded = submission.status === "graded";

                    return (
                      <div
                        key={submission._id}
                        onClick={() => handleSelectSubmission(submission)}
                        className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                          isSelected
                            ? "border-[#1a7a8a] bg-[#e0f5f7]"
                            : isGraded
                              ? "border-green-200 bg-green-50/30 hover:bg-green-50"
                              : "border-[#c0c8c9] hover:bg-[#f7fafa]"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-[#e0f5f7] flex items-center justify-center">
                            <User className="h-5 w-5 text-[#1a7a8a]" />
                          </div>
                          <div>
                            <p className="font-medium text-[#001f24]">
                              {submission.studentName || "طالب غير معروف"}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              <span>
                                {new Date(
                                  submission.submittedAt,
                                ).toLocaleDateString("ar-EG")}
                              </span>
                              {submission.isLate && (
                                <Badge className="bg-red-100 text-red-700">
                                  متأخر
                                </Badge>
                              )}
                              {isGraded && (
                                <Badge className="bg-green-100 text-green-700">
                                  الدرجة: {submission.grade}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {isGraded ? (
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          ) : (
                            <Clock className="h-5 w-5 text-amber-500" />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* منطقة التصحيح */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileEdit className="h-5 w-5 text-[#1a7a8a]" />
                تصحيح التسليم
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedSubmission ? (
                <div className="space-y-4">
                  {/* معلومات الطالب */}
                  <div className="bg-[#f7fafa] rounded-lg p-3">
                    <p className="text-xs text-gray-500">الطالب</p>
                    <p className="font-semibold text-[#001f24]">
                      {selectedSubmission.studentName || "طالب غير معروف"}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      التسليم:{" "}
                      {new Date(selectedSubmission.submittedAt).toLocaleString(
                        "ar-EG",
                      )}
                    </p>
                    {selectedSubmission.isLate && (
                      <Badge className="mt-1 bg-red-100 text-red-700">
                        متأخر
                      </Badge>
                    )}
                  </div>

                  {/* محتوى التسليم */}
                  {selectedSubmission.content && (
                    <div className="bg-[#f7fafa] rounded-lg p-3">
                      <p className="text-xs text-gray-500">المحتوى</p>
                      <p className="text-sm text-[#001f24] whitespace-pre-wrap">
                        {selectedSubmission.content}
                      </p>
                    </div>
                  )}

                  {/* المرفقات */}
                  {selectedSubmission.attachments &&
                    selectedSubmission.attachments.length > 0 && (
                      <div className="bg-[#f7fafa] rounded-lg p-3">
                        <p className="text-xs text-gray-500">المرفقات</p>
                        <div className="space-y-1 mt-1">
                          {selectedSubmission.attachments.map(
                            (file: any, index: number) => (
                              <a
                                key={index}
                                href={file.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 text-sm text-[#1a7a8a] hover:underline"
                              >
                                <FileText className="h-4 w-4" />
                                {file.name}
                              </a>
                            ),
                          )}
                        </div>
                      </div>
                    )}

                  {/* إجابات الأسئلة */}
                  {selectedSubmission.answers &&
                    selectedSubmission.answers.length > 0 && (
                      <div className="bg-[#f7fafa] rounded-lg p-3">
                        <p className="text-xs text-gray-500">الإجابات</p>
                        <div className="space-y-2 mt-1">
                          {selectedSubmission.answers.map(
                            (ans: any, index: number) => (
                              <div
                                key={index}
                                className="border-b border-gray-200 pb-2 last:border-0"
                              >
                                <p className="text-sm font-medium text-[#001f24]">
                                  سؤال {index + 1}
                                </p>
                                <p className="text-sm text-gray-600">
                                  الإجابة: {ans.answer}
                                </p>
                              </div>
                            ),
                          )}
                        </div>
                      </div>
                    )}

                  {/* التقييم */}
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label
                        htmlFor="grade"
                        className="flex items-center gap-1"
                      >
                        الدرجة <span className="text-red-500">*</span>
                        <span className="text-xs text-gray-400">
                          (الحد الأقصى: {assignment.fullGrade})
                        </span>
                      </Label>
                      <Input
                        id="grade"
                        type="number"
                        min="0"
                        max={assignment.fullGrade}
                        step="0.5"
                        value={grade}
                        onChange={(e) =>
                          setGrade(parseFloat(e.target.value) || 0)
                        }
                        className={error ? "border-red-500" : ""}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="feedback">ملاحظات (اختياري)</Label>
                      <textarea
                        id="feedback"
                        value={feedback}
                        onChange={(e) => setFeedback(e.target.value)}
                        className="w-full px-3 py-2 border border-[#c0c8c9] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a7a8a] resize-none"
                        rows={3}
                        placeholder="أدخل ملاحظاتك..."
                      />
                    </div>

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

                    <Button
                      onClick={handleGrade}
                      disabled={isGrading}
                      className="w-full bg-[#001f24] hover:bg-[#03363d] text-white"
                    >
                      {isGrading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin ml-2" />
                          جاري التصحيح...
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4 ml-2" />
                          تصحيح التسليم
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <FileEdit className="h-12 w-12 mx-auto text-gray-300 mb-2" />
                  <p className="text-gray-500">اختر تسليماً للتصحيح</p>
                  <p className="text-sm text-gray-400">
                    اضغط على أي تسليم من القائمة
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
