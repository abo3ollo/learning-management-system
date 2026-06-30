// app/(pages)/(roles)/admin/exams/page.tsx

"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Filter,
  Loader2,
  FileText,
  Eye,
  Send,
  Calendar,
  BookOpen,
  Users,
  Clock,
  CheckCircle,
  AlertCircle,
  MoreVertical,
  Copy,
  Printer,
  Download,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AddExamModal } from "@/app/_components/Exam/AddExamModal";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function AdminExamsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedGrade, setSelectedGrade] = useState("all");
  const [selectedSubject, setSelectedSubject] = useState("all");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editExamId, setEditExamId] = useState<string | null>(null);

  // جلب الامتحانات
  const exams = useQuery(api.exams.exams.getExams, {
    status: selectedStatus !== "all" ? (selectedStatus as any) : undefined,
    search: searchQuery || undefined,
  });

  // جلب المواد والصفوف للفلترة
  const courses = useQuery(api.courses.courses.getCourses, {});

  const deleteExam = useMutation(api.exams.exams.deleteExam);
  const publishExam = useMutation(api.exams.exams.publishExam);

  const isLoading = exams === undefined;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "published":
        return { label: "منشور", className: "bg-green-100 text-green-700 border-green-200" };
      case "draft":
        return { label: "مسودة", className: "bg-amber-100 text-amber-700 border-amber-200" };
      case "archived":
        return { label: "مؤرشف", className: "bg-gray-100 text-gray-600 border-gray-200" };
      default:
        return { label: "مسودة", className: "bg-amber-100 text-amber-700 border-amber-200" };
    }
  };

  const getExamTypeLabel = (type?: string) => {
    const types: Record<string, string> = {
      lesson: "درس",
      monthly: "شهري",
      midterm: "نصف الفصل",
      final: "نهائي",
      quiz: "اختبار قصير",
    };
    return types[type || ""] || type || "عام";
  };

  const handleDelete = async (examId: string) => {
    if (!confirm("هل أنت متأكد من حذف هذا الامتحان؟ لا يمكن التراجع عن هذا الإجراء.")) return;
    setDeletingId(examId);
    try {
      await deleteExam({ examId: examId as any });
    } catch (error: any) {
      alert(error.message || "حدث خطأ أثناء حذف الامتحان");
    } finally {
      setDeletingId(null);
    }
  };

  const handlePublish = async (examId: string) => {
    try {
      await publishExam({ examId: examId as any });
    } catch (error) {
      alert("حدث خطأ أثناء نشر الامتحان");
    }
  };

  const statusOptions = [
    { value: "all", label: "جميع الحالات" },
    { value: "published", label: "منشور" },
    { value: "draft", label: "مسودة" },
    { value: "archived", label: "مؤرشف" },
  ];

  // إحصائيات
  const stats = {
    total: exams?.length || 0,
    published: exams?.filter(e => e.status === "published").length || 0,
    draft: exams?.filter(e => e.status === "draft").length || 0,
    archived: exams?.filter(e => e.status === "archived").length || 0,
  };


  return (
    <div className="min-h-screen bg-[#f7fafa]" dir="rtl">
      {/* Header */}
      <header className="bg-linear-to-r from-[#001f24] to-[#03363d] px-8 py-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <FileText className="h-6 w-6" />
              الامتحانات
            </h1>
            <p className="text-[#a3ced6] text-sm mt-0.5">إدارة الامتحانات وإنشاء ورقات امتحانية</p>
          </div>
          <Button
            onClick={() => {
              setEditExamId(null);
              setIsAddModalOpen(true);
            }}
            className="bg-white/15 hover:bg-white/25 text-white border border-white/20"
          >
            <Plus className="h-4 w-4 ml-2" />
            إنشاء امتحان
          </Button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 border border-[#c0c8c9] hover:shadow-sm transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-[#001f24]">{stats.total}</p>
                <p className="text-xs text-gray-500">إجمالي الامتحانات</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-[#e0f5f7] flex items-center justify-center">
                <FileText className="h-5 w-5 text-[#1a7a8a]" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-[#c0c8c9] hover:shadow-sm transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-green-600">{stats.published}</p>
                <p className="text-xs text-gray-500">منشور</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-green-500" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-[#c0c8c9] hover:shadow-sm transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-amber-600">{stats.draft}</p>
                <p className="text-xs text-gray-500">مسودة</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                <AlertCircle className="h-5 w-5 text-amber-500" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-[#c0c8c9] hover:shadow-sm transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-gray-600">{stats.archived}</p>
                <p className="text-xs text-gray-500">مؤرشف</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center">
                <FileText className="h-5 w-5 text-gray-500" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl border border-[#c0c8c9] p-4 mb-6">
          <div className="flex flex-wrap gap-3 items-center">
            {/* بحث */}
            <div className="flex-1 min-w-50 relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="البحث في الامتحانات..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-10"
              />
            </div>

            {/* فلتر الصف */}
            <select
              value={selectedGrade}
              onChange={(e) => setSelectedGrade(e.target.value)}
              className="border border-gray-200 rounded-lg px-4 py-2 text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#1a7a8a] bg-white min-w-40"
            >
              <option value="all">جميع الصفوف</option>
              <option value="grade1">الصف الأول</option>
              <option value="grade2">الصف الثاني</option>
              <option value="grade3">الصف الثالث</option>
              <option value="grade4">الصف الرابع</option>
              <option value="grade5">الصف الخامس</option>
              <option value="grade6">الصف السادس</option>
            </select>

            {/* فلتر المادة */}
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="border border-gray-200 rounded-lg px-4 py-2 text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#1a7a8a] bg-white min-w-40"
            >
              <option value="all">جميع المواد</option>
              {courses?.map((course: any) => (
                <option key={course._id} value={course._id}>
                  {course.title}
                </option>
              ))}
            </select>

            {/* فلتر الحالة */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="border border-gray-200 rounded-lg px-4 py-2 text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#1a7a8a] bg-white min-w-40"
            >
              {statusOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>

            <Button
              variant="outline"
              onClick={() => { 
                setSearchQuery(""); 
                setSelectedStatus("all");
                setSelectedGrade("all");
                setSelectedSubject("all");
              }}
              className="border-gray-200 text-gray-600 hover:bg-gray-50"
            >
              <Filter className="h-4 w-4 ml-2" />
              إعادة ضبط
            </Button>
          </div>
        </div>

        {/* Exams Table */}
        <div className="bg-white rounded-xl border border-[#c0c8c9] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#f7fafa] border-b border-[#c0c8c9]">
                <tr>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">#</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">عنوان الامتحان</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">النوع</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">الحالة</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">المدة (دقيقة)</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">الأسئلة</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-16 text-center">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto text-[#1a7a8a]" />
                    </td>
                  </tr>
                ) : exams?.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <FileText className="h-12 w-12 text-gray-300" />
                        <p className="text-gray-500 font-medium">لا توجد امتحانات</p>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => {
                            setEditExamId(null);
                            setIsAddModalOpen(true);
                          }}
                        >
                          <Plus className="h-4 w-4 ml-2" />
                          إنشاء أول امتحان
                        </Button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  exams?.map((exam: any, index: number) => {
                    const statusBadge = getStatusBadge(exam.status);
                    return (
                      <tr key={exam._id} className="hover:bg-[#f7fafa] transition-colors">
                        <td className="px-4 py-3 text-sm text-gray-500">{index + 1}</td>
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-medium text-[#001f24] text-sm">{exam.title}</p>
                            <p className="text-xs text-gray-400 line-clamp-1">{exam.description || "لا يوجد وصف"}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="outline" className="border-[#1a7a8a] text-[#1a7a8a]">
                            {getExamTypeLabel(exam.type)}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs rounded-full border ${statusBadge.className}`}>
                            {statusBadge.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">{exam.duration}</td>
                        <td className="px-4 py-3 text-sm text-gray-500">{exam.questionsCount || exam.questions?.length || 0}</td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1.5">
                            {/* معاينة */}
                            <Link href={`/admin/exams/preview/${exam._id}`}>
                              <button 
                                className="p-1.5 hover:bg-green-50 rounded-lg transition-colors" 
                                title="معاينة الورقة"
                              >
                                <Eye className="h-4 w-4 text-gray-400 hover:text-green-600" />
                              </button>
                            </Link>

                            {/* تعديل */}
                            <button
                              onClick={() => {
                                setEditExamId(exam._id);
                                setIsAddModalOpen(true);
                              }}
                              className="p-1.5 hover:bg-blue-50 rounded-lg transition-colors"
                              title="تعديل"
                            >
                              <Edit className="h-4 w-4 text-gray-400 hover:text-blue-600" />
                            </button>

                            {/* نشر */}
                            {exam.status !== "published" && (
                              <button
                                onClick={() => handlePublish(exam._id)}
                                className="p-1.5 hover:bg-green-50 rounded-lg transition-colors"
                                title="نشر"
                              >
                                <Send className="h-4 w-4 text-gray-400 hover:text-green-600" />
                              </button>
                            )}

                            {/* نسخ */}
                            <button
                              className="p-1.5 hover:bg-purple-50 rounded-lg transition-colors"
                              title="نسخ"
                            >
                              <Copy className="h-4 w-4 text-gray-400 hover:text-purple-600" />
                            </button>

                            {/* حذف */}
                            <button
                              onClick={() => handleDelete(exam._id)}
                              disabled={deletingId === exam._id}
                              className="p-1.5 hover:bg-red-50 rounded-lg transition-colors"
                              title="حذف"
                            >
                              {deletingId === exam._id ? (
                                <Loader2 className="h-4 w-4 animate-spin text-red-400" />
                              ) : (
                                <Trash2 className="h-4 w-4 text-gray-400 hover:text-red-600" />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-4 flex items-center justify-between text-xs text-gray-400">
          <span>عرض {exams?.length || 0} امتحان</span>
          <span>آخر تحديث: {new Date().toLocaleDateString("ar-EG")}</span>
        </div>
      </div>

      {/* Add/Edit Exam Modal */}
      <AddExamModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditExamId(null);
        }}
        editExamId={editExamId}
      />
    </div>
  );
}