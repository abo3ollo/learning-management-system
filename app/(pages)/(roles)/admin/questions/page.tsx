// app/(pages)/(roles)/admin/questions/page.tsx
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
  Eye,
  Copy,
  CheckCircle,
  XCircle,
  Clock,
  FileQuestion,
  BookOpen,
  GraduationCap,
  TrendingUp,
  MoreVertical,
  Download,
  Upload,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";



import { AddQuestionModal } from "@/app/_components/Questions/AddQuestionModal";
import { QuestionPreviewModal } from "@/app/_components/Questions/QuestionPreviewModal";
import { EditQuestionModal } from "@/app/_components/Questions/EditQuestionModal";

export default function AdminQuestionsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  const [selectedDifficulty, setSelectedDifficulty] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const questions = useQuery(api.questions.questions.getQuestions, {
    type: selectedType !== "all" ? (selectedType as any) : undefined,
    difficulty: selectedDifficulty !== "all" ? (selectedDifficulty as any) : undefined,
    status: selectedStatus !== "all" ? (selectedStatus as any) : undefined,
    search: searchQuery || undefined,
  });
  const stats = useQuery(api.questions.questions.getQuestionsStats);

  const deleteQuestion = useMutation(api.questions.questions.deleteQuestion);
  const publishQuestion = useMutation(api.questions.questions.publishQuestion);

  const isLoading = questions === undefined;

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

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      mcq: "bg-blue-100 text-blue-700 border-blue-200",
      true_false: "bg-green-100 text-green-700 border-green-200",
      essay: "bg-purple-100 text-purple-700 border-purple-200",
      fill_blank: "bg-amber-100 text-amber-700 border-amber-200",
      matching: "bg-pink-100 text-pink-700 border-pink-200",
    };
    return colors[type] || "bg-gray-100 text-gray-700 border-gray-200";
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
      easy: "bg-green-100 text-green-700",
      medium: "bg-amber-100 text-amber-700",
      hard: "bg-red-100 text-red-700",
    };
    return colors[difficulty] || "bg-gray-100 text-gray-700";
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "published":
        return { label: "منشور", icon: CheckCircle, className: "bg-green-100 text-green-700 border-green-200" };
      case "draft":
        return { label: "مسودة", icon: Clock, className: "bg-amber-100 text-amber-700 border-amber-200" };
      case "archived":
        return { label: "مؤرشف", icon: XCircle, className: "bg-gray-100 text-gray-600 border-gray-200" };
      default:
        return { label: "مسودة", icon: Clock, className: "bg-amber-100 text-amber-700 border-amber-200" };
    }
  };

  const handleDelete = async (questionId: string) => {
    if (!confirm("هل أنت متأكد من حذف هذا السؤال؟ لا يمكن التراجع عن هذا الإجراء.")) return;
    
    setDeletingId(questionId);
    try {
      await deleteQuestion({ questionId: questionId as any });
    } catch (error: any) {
      console.error("Error deleting question:", error);
      alert(error.message || "حدث خطأ أثناء حذف السؤال");
    } finally {
      setDeletingId(null);
    }
  };

  const handlePublish = async (questionId: string) => {
    try {
      await publishQuestion({ questionId: questionId as any });
    } catch (error) {
      console.error("Error publishing question:", error);
      alert("حدث خطأ أثناء نشر السؤال");
    }
  };

  const typeOptions = [
    { value: "all", label: "جميع الأنواع" },
    { value: "mcq", label: "اختيار من متعدد" },
    { value: "true_false", label: "صح/خطأ" },
    { value: "essay", label: "مقالي" },
    { value: "fill_blank", label: "ملء الفراغ" },
    { value: "matching", label: "مطابقة" },
  ];

  const difficultyOptions = [
    { value: "all", label: "جميع المستويات" },
    { value: "easy", label: "سهل" },
    { value: "medium", label: "متوسط" },
    { value: "hard", label: "صعب" },
  ];

  const statusOptions = [
    { value: "all", label: "جميع الحالات" },
    { value: "published", label: "منشور" },
    { value: "draft", label: "مسودة" },
    { value: "archived", label: "مؤرشف" },
  ];

  const statsCards = [
    { label: "إجمالي الأسئلة", value: stats?.total || 0, icon: FileQuestion, color: "bg-blue-50 text-blue-500" },
    { label: "منشور", value: stats?.published || 0, icon: CheckCircle, color: "bg-green-50 text-green-500" },
    { label: "مسودة", value: stats?.draft || 0, icon: Clock, color: "bg-amber-50 text-amber-500" },
    { label: "متوسط الصعوبة", value: "─", icon: TrendingUp, color: "bg-purple-50 text-purple-500" },
  ];

  return (
    <div className="min-h-screen bg-[#f7fafa] " dir="rtl">
      {/* Header */}
      <header className="bg-linear-to-r from-[#001f24] to-[#03363d] px-8 py-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-2">
              <FileQuestion className="h-6 w-6" />
              بنك الأسئلة
            </h1>
            <p className="text-[#a3ced6] text-sm mt-0.5">إدارة الأسئلة وإنشاء اختبارات</p>
          </div>
          <Button
            onClick={() => setIsAddModalOpen(true)}
            className="bg-white/15 hover:bg-white/25 text-white border border-white/20"
          >
            <Plus className="h-4 w-4 ml-2" />
            إضافة سؤال
          </Button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {statsCards.map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="bg-white rounded-xl p-4 border border-[#c0c8c9] hover:shadow-sm transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-[#001f24]">{stat.value}</p>
                    <p className="text-xs text-gray-500">{stat.label}</p>
                  </div>
                  <div className={`w-10 h-10 rounded-xl ${stat.color} bg-opacity-10 flex items-center justify-center`}>
                    <Icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl border border-[#c0c8c9] p-4 mb-6">
          <div className="flex flex-wrap gap-3">
            <div className="flex-1 min-w-50 relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="بحث بالعنوان أو النص..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full border border-gray-200 rounded-lg pr-9 pl-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a7a8a]"
              />
            </div>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="border border-gray-200 rounded-lg px-4 py-2 text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#1a7a8a] bg-white"
            >
              {typeOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <select
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
              className="border border-gray-200 rounded-lg px-4 py-2 text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#1a7a8a] bg-white"
            >
              {difficultyOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="border border-gray-200 rounded-lg px-4 py-2 text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#1a7a8a] bg-white"
            >
              {statusOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <Button
              variant="outline"
              onClick={() => { setSearchQuery(""); setSelectedType("all"); setSelectedDifficulty("all"); setSelectedStatus("all"); }}
              className="border-gray-200 text-gray-600 hover:bg-gray-50"
            >
              <Filter className="h-4 w-4 ml-2" />
              إعادة ضبط
            </Button>
          </div>
        </div>

        {/* Questions Table */}
        <div className="bg-white rounded-xl border border-[#c0c8c9] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#f7fafa] border-b border-[#c0c8c9]">
                <tr>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">السؤال</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">النوع</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">الصعوبة</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">النقاط</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">الحالة</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-16 text-center">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto text-[#1a7a8a]" />
                    </td>
                  </tr>
                ) : questions?.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <FileQuestion className="h-12 w-12 text-gray-300" />
                        <p className="text-gray-500 font-medium">لا توجد أسئلة</p>
                        <Button variant="outline" size="sm" onClick={() => setIsAddModalOpen(true)}>
                          <Plus className="h-4 w-4 ml-2" />
                          إضافة أول سؤال
                        </Button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  questions?.map((question: any) => {
                    const statusBadge = getStatusBadge(question.status);
                    const StatusIcon = statusBadge.icon;
                    return (
                      <tr key={question._id} className="hover:bg-[#f7fafa] transition-colors">
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-medium text-[#001f24] text-sm line-clamp-1">{question.title}</p>
                            <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{question.questionText}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2.5 py-1 text-xs rounded-full border ${getTypeColor(question.type)}`}>
                            {getTypeLabel(question.type)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2.5 py-1 text-xs rounded-full ${getDifficultyColor(question.difficulty)}`}>
                            {getDifficultyLabel(question.difficulty)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">{question.points}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs rounded-full border ${statusBadge.className}`}>
                            <StatusIcon className="h-3 w-3" />
                            {statusBadge.label}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1.5">
                            <button
                              onClick={() => {
                                setSelectedQuestionId(question._id);
                                setIsPreviewModalOpen(true);
                              }}
                              className="p-1.5 hover:bg-blue-50 rounded-lg transition-colors"
                              title="معاينة"
                            >
                              <Eye className="h-4 w-4 text-gray-400 hover:text-blue-600" />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedQuestionId(question._id);
                                setIsEditModalOpen(true);
                              }}
                              className="p-1.5 hover:bg-blue-50 rounded-lg transition-colors"
                              title="تعديل"
                            >
                              <Edit className="h-4 w-4 text-gray-400 hover:text-blue-600" />
                            </button>
                            {question.status !== "published" && (
                              <button
                                onClick={() => handlePublish(question._id)}
                                className="p-1.5 hover:bg-green-50 rounded-lg transition-colors"
                                title="نشر"
                              >
                                <CheckCircle className="h-4 w-4 text-gray-400 hover:text-green-600" />
                              </button>
                            )}
                            <button
                              onClick={() => handleDelete(question._id)}
                              disabled={deletingId === question._id}
                              className="p-1.5 hover:bg-red-50 rounded-lg transition-colors"
                              title="حذف"
                            >
                              {deletingId === question._id ? (
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
        <div className="mt-4 text-center text-xs text-gray-400">
          عرض {questions?.length || 0} سؤال
        </div>
      </div>

      {/* Modals */}
      <AddQuestionModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} />
      <EditQuestionModal 
        isOpen={isEditModalOpen} 
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedQuestionId(null);
        }}
        questionId={selectedQuestionId}
      />
      <QuestionPreviewModal
        isOpen={isPreviewModalOpen}
        onClose={() => {
          setIsPreviewModalOpen(false);
          setSelectedQuestionId(null);
        }}
        questionId={selectedQuestionId}
      />
    </div>
  );
}