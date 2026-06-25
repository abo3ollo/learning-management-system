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
  console.log(studentSubmission);
  

  // ✅ جلب اسم المادة - استخدم courseId من assignment مباشرة
  // لا تستخدم useQuery منفصل هنا لتجنب المشكلة

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

  const handleSubmit = async () => {
    if (!currentUser) return;

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

      if (isSubmitted && assignment.allowResubmission) {
        await resubmitAssignment({
          submissionId: submission!._id,
          content: content,
          attachments: attachments,
        });
        setSuccess("تم إعادة تسليم الواجب بنجاح");
      } else {
        await submitAssignment({
          assignmentId: assignmentId as any,
          classId: assignment.classIds[0] as any,
          content: content,
          attachments: attachments,
        });
        setSuccess("تم تسليم الواجب بنجاح");
      }

      setSelectedFiles([]);
      setContent("");
      
      setTimeout(() => {
        router.refresh();
      }, 1000);
      
    } catch (error: any) {
      setError(error.message || "حدث خطأ أثناء التسليم");
    } finally {
      setIsSubmitting(false);
    }
  };

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
                    التسليم: {format(new Date(assignment.dueDate), "dd MMMM yyyy", { locale: ar })}
                  </span>
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
                      <a
                        href={file.url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
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

          {/* Submission Area */}
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
                    <p>📝 {assignment.allowResubmission
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

                {/* Submit Button */}
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting || (!content.trim() && selectedFiles.length === 0)}
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
                    {format(new Date(submission.submittedAt), "dd MMMM yyyy - HH:mm", { locale: ar })}
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
                      <a
                        href={file.url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
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