// app/(pages)/(roles)/admin/assignments/page.tsx
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
  CheckCircle,
  Clock,
  Calendar,
  BookOpen,
  Users,
  Eye,
  MoreVertical,
  Download,
  Send,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AddAssignmentModal } from "@/app/_components/Assignment/AddAssignmentModal";

export default function AdminAssignmentsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const assignments = useQuery(api.assignments.assignments.getAssignments, {
    status: selectedStatus !== "all" ? (selectedStatus as any) : undefined,
    search: searchQuery || undefined,
  });
  console.log(assignments)
  const stats = useQuery(api.assignments.assignments.getAssignmentsStats);

  const deleteAssignment = useMutation(api.assignments.assignments.deleteAssignment);
  const publishAssignment = useMutation(api.assignments.assignments.publishAssignment);

  const isLoading = assignments === undefined;

  const getTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      assignment: "واجب",
      quiz: "اختبار",
      exam: "امتحان",
      project: "مشروع",
    };
    return types[type] || type;
  };

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

  const handleDelete = async (assignmentId: string) => {
    if (!confirm("هل أنت متأكد من حذف هذا الواجب؟ لا يمكن التراجع عن هذا الإجراء.")) return;

    setDeletingId(assignmentId);
    try {
      await deleteAssignment({ assignmentId: assignmentId as any });
    } catch (error: any) {
      console.error("Error deleting assignment:", error);
      alert(error.message || "حدث خطأ أثناء حذف الواجب");
    } finally {
      setDeletingId(null);
    }
  };

  const handlePublish = async (assignmentId: string) => {
    try {
      await publishAssignment({ assignmentId: assignmentId as any });
    } catch (error) {
      console.error("Error publishing assignment:", error);
      alert("حدث خطأ أثناء نشر الواجب");
    }
  };

  const statusOptions = [
    { value: "all", label: "جميع الحالات" },
    { value: "published", label: "منشور" },
    { value: "draft", label: "مسودة" },
    { value: "archived", label: "مؤرشف" },
  ];

  const statsCards = [
    { label: "إجمالي الواجبات", value: stats?.total || 0, icon: FileText },
    { label: "منشورة", value: stats?.published || 0, icon: CheckCircle },
    { label: "قادمة", value: stats?.upcoming || 0, icon: Clock },
    { label: "متأخرة", value: stats?.overdue || 0, icon: Calendar },
  ];

  return (
    <div className="min-h-screen bg-[#f7fafa]" dir="rtl">
      {/* Header */}
      <header className="bg-linear-to-r from-[#001f24] to-[#03363d] px-8 py-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <FileText className="h-6 w-6" />
              الواجبات
            </h1>
            <p className="text-[#a3ced6] text-sm mt-0.5">إدارة الواجبات والتكليفات الدراسية</p>
          </div>
          <Button
            onClick={() => setIsAddModalOpen(true)}
            className="bg-white/15 hover:bg-white/25 text-white border border-white/20"
          >
            <Plus className="h-4 w-4 ml-2" />
            إنشاء واجب
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
                  <div className="w-10 h-10 rounded-xl bg-[#e0f5f7] flex items-center justify-center">
                    <Icon className="h-5 w-5 text-[#1a7a8a]" />
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
              <Input
                placeholder="بحث بالعنوان..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-10"
              />
            </div>
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
              onClick={() => { setSearchQuery(""); setSelectedStatus("all"); }}
              className="border-gray-200 text-gray-600 hover:bg-gray-50"
            >
              <Filter className="h-4 w-4 ml-2" />
              إعادة ضبط
            </Button>
          </div>
        </div>

        {/* Assignments Table */}
        <div className="bg-white rounded-xl border border-[#c0c8c9] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#f7fafa] border-b border-[#c0c8c9]">
                <tr>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">الواجب</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">الفصول</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">النوع</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">تاريخ التسليم</th>
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
                ) : assignments?.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <FileText className="h-12 w-12 text-gray-300" />
                        <p className="text-gray-500 font-medium">لا توجد واجبات</p>
                        <Button variant="outline" size="sm" onClick={() => setIsAddModalOpen(true)}>
                          <Plus className="h-4 w-4 ml-2" />
                          إنشاء أول واجب
                        </Button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  assignments?.map((assignment: any) => {
                    const statusBadge = getStatusBadge(assignment.status);
                    return (
                      <tr key={assignment._id} className="hover:bg-[#f7fafa] transition-colors">
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-medium text-[#001f24] text-sm">{assignment.title}</p>
                            <p className="text-xs text-gray-400 line-clamp-1">{assignment.description || "لا يوجد وصف"}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1">
                            {assignment.classNames?.slice(0, 2).map((name: string, i: number) => (
                              <span key={i} className="px-1.5 py-0.5 text-xs bg-[#e0f5f7] text-[#1a7a8a] rounded">
                                {name}
                              </span>
                            ))}
                            {assignment.classNames?.length > 2 && (
                              <span className="px-1.5 py-0.5 text-xs bg-gray-100 text-gray-500 rounded">
                                +{assignment.classNames.length - 2}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {getTypeLabel(assignment.type)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {new Date(assignment.dueDate).toLocaleDateString("ar-EG")}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs rounded-full border ${statusBadge.className}`}>
                            {statusBadge.label}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1.5">
                            <Link href={`/admin/assignments/${assignment._id}`}>
                              <button className="p-1.5 hover:bg-blue-50 rounded-lg transition-colors" title="عرض">
                                <Eye className="h-4 w-4 text-gray-400 hover:text-blue-600" />
                              </button>
                            </Link>
                            <Link href={`/admin/assignments/edit/${assignment._id}`}>
                              <button className="p-1.5 hover:bg-blue-50 rounded-lg transition-colors" title="تعديل">
                                <Edit className="h-4 w-4 text-gray-400 hover:text-blue-600" />
                              </button>
                            </Link>
                            {assignment.status !== "published" && (
                              <button
                                onClick={() => handlePublish(assignment._id)}
                                className="p-1.5 hover:bg-green-50 rounded-lg transition-colors"
                                title="نشر"
                              >
                                <Send className="h-4 w-4 text-gray-400 hover:text-green-600" />
                              </button>
                            )}
                            <button
                              onClick={() => handleDelete(assignment._id)}
                              disabled={deletingId === assignment._id}
                              className="p-1.5 hover:bg-red-50 rounded-lg transition-colors"
                              title="حذف"
                            >
                              {deletingId === assignment._id ? (
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
          عرض {assignments?.length || 0} واجب
        </div>
      </div>

      {/* Add Assignment Modal */}
      <AddAssignmentModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />
    </div>
  );
}