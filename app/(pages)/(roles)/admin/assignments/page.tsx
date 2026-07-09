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
  Send,
  Layers,
  GraduationCap,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AddAssignmentModal } from "@/app/_components/Assignment/AddAssignmentModal";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export default function AdminAssignmentsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedGrade, setSelectedGrade] = useState<string>("all");
  const [selectedGroup, setSelectedGroup] = useState<string>("all");
  
  // ✅ State للعرض والتعديل
  const [viewingAssignment, setViewingAssignment] = useState<any>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [editingAssignmentId, setEditingAssignmentId] = useState<string | null>(null);

  // ✅ جلب البيانات
  const grades = useQuery(api.grades.grades.getActiveGrades, {});
  const groups = useQuery(api.groups.groups.getGroups, {});
  const assignments = useQuery(api.assignments.assignments.getFilteredAssignments, {
  status: selectedStatus !== "all" ? (selectedStatus as any) : undefined,
  search: searchQuery || undefined,
  gradeId: selectedGrade !== "all" ? (selectedGrade as any) : undefined,
  groupId: selectedGroup !== "all" ? (selectedGroup as any) : undefined,
});

  const stats = useQuery(api.assignments.assignments.getAssignmentsStats);

  const deleteAssignment = useMutation(api.assignments.assignments.deleteAssignment);
  const publishAssignment = useMutation(api.assignments.assignments.publishAssignment);

  const isLoading = assignments === undefined || stats === undefined || grades === undefined || groups === undefined;

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

  // ✅ فلترة الواجبات
  const filteredAssignments = assignments?.filter((assignment: any) => {
    if (selectedStatus !== "all" && assignment.status !== selectedStatus) {
      return false;
    }
    if (selectedGrade !== "all" && assignment.gradeId !== selectedGrade) {
      return false;
    }
    if (selectedGroup !== "all" && assignment.groupIds && !assignment.groupIds.includes(selectedGroup)) {
      return false;
    }
    if (searchQuery && !assignment.title.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    return true;
  });

  // ✅ جلب اسم الصف والمجموعة
  const getGradeName = (gradeId: string) => {
    const grade = grades?.find((g: any) => g._id === gradeId);
    return grade?.name || "غير محدد";
  };

  const getGroupNames = (groupIds: string[]) => {
    if (!groupIds || groupIds.length === 0) return "جميع المجموعات";
    const names = groupIds.map((id) => {
      const group = groups?.find((g: any) => g._id === id);
      return group?.name || "";
    }).filter(Boolean);
    return names.join(", ") || "غير محدد";
  };

  // ✅ عرض تفاصيل الواجب
  const handleViewAssignment = (assignment: any) => {
    setViewingAssignment(assignment);
    setIsViewDialogOpen(true);
  };

  // ✅ فتح مودال التعديل
  const handleEditAssignment = (assignmentId: string) => {
    setEditingAssignmentId(assignmentId);
    setIsAddModalOpen(true);
  };

  const statsCards = [
    { label: "إجمالي الواجبات", value: stats?.total || 0, icon: FileText },
    { label: "منشورة", value: stats?.published || 0, icon: CheckCircle },
    { label: "قادمة", value: stats?.upcoming || 0, icon: Clock },
    { label: "متأخرة", value: stats?.overdue || 0, icon: Calendar },
  ];

  const handleResetFilters = () => {
    setSearchQuery("");
    setSelectedStatus("all");
    setSelectedGrade("all");
    setSelectedGroup("all");
  };

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
            onClick={() => {
              setEditingAssignmentId(null);
              setIsAddModalOpen(true);
            }}
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
              className="border border-gray-200 rounded-lg px-4 py-2 text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#1a7a8a] bg-white min-w-40"
            >
              {statusOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>

            <select
              value={selectedGrade}
              onChange={(e) => setSelectedGrade(e.target.value)}
              className="border border-gray-200 rounded-lg px-4 py-2 text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#1a7a8a] bg-white min-w-40"
            >
              <option value="all">جميع الصفوف</option>
              {grades?.map((grade: any) => (
                <option key={grade._id} value={grade._id}>
                  {grade.name}
                </option>
              ))}
            </select>

            <select
              value={selectedGroup}
              onChange={(e) => setSelectedGroup(e.target.value)}
              className="border border-gray-200 rounded-lg px-4 py-2 text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#1a7a8a] bg-white min-w-40"
            >
              <option value="all">جميع المجموعات</option>
              {groups?.map((group: any) => (
                <option key={group._id} value={group._id}>
                  {group.name}
                </option>
              ))}
            </select>

            <Button
              variant="outline"
              onClick={handleResetFilters}
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
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">الصف</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">المجموعة</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">النوع</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">تاريخ التسليم</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">الحالة</th>
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
                ) : filteredAssignments?.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <FileText className="h-12 w-12 text-gray-300" />
                        <p className="text-gray-500 font-medium">لا توجد واجبات</p>
                        <Button variant="outline" size="sm" onClick={() => {
                          setEditingAssignmentId(null);
                          setIsAddModalOpen(true);
                        }}>
                          <Plus className="h-4 w-4 ml-2" />
                          إنشاء أول واجب
                        </Button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredAssignments?.map((assignment: any) => {
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
                          <span className="text-sm text-gray-600 flex items-center gap-1">
                            <GraduationCap className="h-3 w-3 text-[#1a7a8a]" />
                            {getGradeName(assignment.gradeId)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-gray-600 flex items-center gap-1">
                            <Users className="h-3 w-3 text-[#1a7a8a]" />
                            {getGroupNames(assignment.groupIds || [])}
                          </span>
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
                            {/* ✅ زر العرض */}
                            <button
                              onClick={() => handleViewAssignment(assignment)}
                              className="p-1.5 hover:bg-blue-50 rounded-lg transition-colors"
                              title="عرض التفاصيل"
                            >
                              <Eye className="h-4 w-4 text-gray-400 hover:text-blue-600" />
                            </button>

                            {/* ✅ زر التعديل */}
                            <button
                              onClick={() => handleEditAssignment(assignment._id)}
                              className="p-1.5 hover:bg-blue-50 rounded-lg transition-colors"
                              title="تعديل"
                            >
                              <Edit className="h-4 w-4 text-gray-400 hover:text-blue-600" />
                            </button>

                            {/* ✅ زر النشر */}
                            {assignment.status !== "published" && (
                              <button
                                onClick={() => handlePublish(assignment._id)}
                                className="p-1.5 hover:bg-green-50 rounded-lg transition-colors"
                                title="نشر"
                              >
                                <Send className="h-4 w-4 text-gray-400 hover:text-green-600" />
                              </button>
                            )}

                            {/* ✅ زر الحذف */}
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
          عرض {filteredAssignments?.length || 0} واجب
        </div>
      </div>

      {/* ✅ Add/Edit Assignment Modal */}
      <AddAssignmentModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingAssignmentId(null);
        }}
        editAssignmentId={editingAssignmentId}
      />

      {/* ✅ View Assignment Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader className="border-b pb-4">
            <DialogTitle className="text-2xl font-bold text-[#001f24] flex items-center gap-3">
              <div className="p-2 bg-[#e0f5f7] rounded-xl">
                <FileText className="h-6 w-6 text-[#1a7a8a]" />
              </div>
              تفاصيل الواجب
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-500 mt-1">
              عرض تفاصيل الواجب: <span className="font-semibold text-[#001f24]">{viewingAssignment?.title}</span>
            </DialogDescription>
          </DialogHeader>

          {viewingAssignment && (
            <div className="space-y-6 mt-4">
              {/* بطاقة المعلومات الأساسية */}
              <div className="bg-linear-to-r from-[#001f24] to-[#03363d] rounded-xl p-6 text-white">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-xs text-[#a3ced6]">الحالة</p>
                    <span className={`inline-flex items-center gap-1 px-3 py-1 mt-1 text-xs rounded-full border ${
                      viewingAssignment.status === "published" 
                        ? "bg-green-500/20 text-green-300 border-green-500/30" 
                        : viewingAssignment.status === "draft" 
                        ? "bg-amber-500/20 text-amber-300 border-amber-500/30"
                        : "bg-gray-500/20 text-gray-300 border-gray-500/30"
                    }`}>
                      {getStatusBadge(viewingAssignment.status).label}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs text-[#a3ced6]">النوع</p>
                    <p className="font-semibold mt-1">{getTypeLabel(viewingAssignment.type)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[#a3ced6]">الوزن</p>
                    <p className="font-semibold mt-1">{viewingAssignment.weight}%</p>
                  </div>
                  <div>
                    <p className="text-xs text-[#a3ced6]">الدرجة الكاملة</p>
                    <p className="font-semibold mt-1">{viewingAssignment.fullGrade}</p>
                  </div>
                </div>
              </div>

              {/* العنوان والوصف */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-[#f7fafa] rounded-xl p-5 border border-[#c0c8c9]">
                  <p className="text-xs text-gray-500 font-medium mb-2">📌 العنوان</p>
                  <p className="text-lg font-bold text-[#001f24]">{viewingAssignment.title}</p>
                </div>
                <div className="bg-[#f7fafa] rounded-xl p-5 border border-[#c0c8c9]">
                  <p className="text-xs text-gray-500 font-medium mb-2">📅 التواريخ</p>
                  <div className="space-y-1">
                    <p className="text-sm text-[#001f24]">
                      <span className="text-gray-500">البداية:</span> {new Date(viewingAssignment.startDate).toLocaleString("ar-EG")}
                    </p>
                    <p className="text-sm text-[#001f24]">
                      <span className="text-gray-500">التسليم:</span> {new Date(viewingAssignment.dueDate).toLocaleString("ar-EG")}
                    </p>
                  </div>
                </div>
              </div>

              {/* الصف والمجموعة */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-[#f7fafa] rounded-xl p-5 border border-[#c0c8c9]">
                  <p className="text-xs text-gray-500 font-medium mb-2 flex items-center gap-2">
                    <GraduationCap className="h-4 w-4 text-[#1a7a8a]" />
                    الصف
                  </p>
                  <p className="text-lg font-semibold text-[#001f24]">{getGradeName(viewingAssignment.gradeId)}</p>
                </div>
                <div className="bg-[#f7fafa] rounded-xl p-5 border border-[#c0c8c9]">
                  <p className="text-xs text-gray-500 font-medium mb-2 flex items-center gap-2">
                    <Users className="h-4 w-4 text-[#1a7a8a]" />
                    المجموعة
                  </p>
                  <p className="text-lg font-semibold text-[#001f24]">{getGroupNames(viewingAssignment.groupIds || [])}</p>
                </div>
              </div>

              {/* الوصف */}
              {viewingAssignment.description && (
                <div className="bg-[#f7fafa] rounded-xl p-5 border border-[#c0c8c9]">
                  <p className="text-xs text-gray-500 font-medium mb-2">📝 الوصف</p>
                  <p className="text-sm text-[#001f24] whitespace-pre-wrap leading-relaxed">
                    {viewingAssignment.description}
                  </p>
                </div>
              )}

              {/* الدرجات */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-[#f7fafa] rounded-xl p-4 text-center border border-[#c0c8c9]">
                  <p className="text-xs text-gray-500">الدرجة الكاملة</p>
                  <p className="text-2xl font-bold text-[#1a7a8a]">{viewingAssignment.fullGrade}</p>
                </div>
                <div className="bg-[#f7fafa] rounded-xl p-4 text-center border border-[#c0c8c9]">
                  <p className="text-xs text-gray-500">درجة النجاح</p>
                  <p className="text-2xl font-bold text-amber-500">{viewingAssignment.passingGrade}</p>
                </div>
                <div className="bg-[#f7fafa] rounded-xl p-4 text-center border border-[#c0c8c9]">
                  <p className="text-xs text-gray-500">الوزن</p>
                  <p className="text-2xl font-bold text-[#001f24]">{viewingAssignment.weight}%</p>
                </div>
                <div className="bg-[#f7fafa] rounded-xl p-4 text-center border border-[#c0c8c9]">
                  <p className="text-xs text-gray-500">عدد الأسئلة</p>
                  <p className="text-2xl font-bold text-[#1a7a8a]">{viewingAssignment.questions?.length || 0}</p>
                </div>
              </div>

              {/* خيارات إضافية */}
              <div className="grid grid-cols-3 gap-4">
                <div className={`rounded-xl p-4 text-center border-2 ${viewingAssignment.allowResubmission ? "border-green-200 bg-green-50" : "border-gray-200 bg-gray-50"}`}>
                  <p className="text-sm font-medium text-[#001f24]">🔄 إعادة التسليم</p>
                  <p className={`text-sm font-bold mt-1 ${viewingAssignment.allowResubmission ? "text-green-600" : "text-gray-400"}`}>
                    {viewingAssignment.allowResubmission ? "✅ مسموح" : "❌ غير مسموح"}
                  </p>
                </div>
                <div className={`rounded-xl p-4 text-center border-2 ${viewingAssignment.isGroupWork ? "border-blue-200 bg-blue-50" : "border-gray-200 bg-gray-50"}`}>
                  <p className="text-sm font-medium text-[#001f24]">👥 عمل جماعي</p>
                  <p className={`text-sm font-bold mt-1 ${viewingAssignment.isGroupWork ? "text-blue-600" : "text-gray-400"}`}>
                    {viewingAssignment.isGroupWork ? "✅ نعم" : "❌ لا"}
                  </p>
                </div>
                <div className={`rounded-xl p-4 text-center border-2 ${viewingAssignment.showGrade ? "border-purple-200 bg-purple-50" : "border-gray-200 bg-gray-50"}`}>
                  <p className="text-sm font-medium text-[#001f24]">📊 إظهار الدرجة</p>
                  <p className={`text-sm font-bold mt-1 ${viewingAssignment.showGrade ? "text-purple-600" : "text-gray-400"}`}>
                    {viewingAssignment.showGrade ? "✅ نعم" : "❌ لا"}
                  </p>
                </div>
              </div>

              {/* الأسئلة */}
              {viewingAssignment.questions && viewingAssignment.questions.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold text-lg text-[#001f24] flex items-center gap-2">
                      <FileText className="h-5 w-5 text-[#1a7a8a]" />
                      الأسئلة ({viewingAssignment.questions.length})
                    </h4>
                    <span className="text-sm text-gray-500">إجمالي النقاط: {viewingAssignment.questions.reduce((acc: number, q: any) => acc + (q.points || 0), 0)}</span>
                  </div>
                  <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                    {viewingAssignment.questions.map((q: any, index: number) => (
                      <div key={q._id || index} className="bg-[#f7fafa] rounded-xl p-4 border border-[#c0c8c9] hover:border-[#1a7a8a] transition-colors">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <span className="font-bold text-[#1a7a8a] bg-[#e0f5f7] px-3 py-1 rounded-lg text-sm">
                                س{index + 1}
                              </span>
                              <span className="text-xs bg-[#e0f5f7] text-[#1a7a8a] px-2 py-0.5 rounded">
                                {getTypeLabel(q.type)}
                              </span>
                              <span className={`text-xs px-2 py-0.5 rounded-full ${q.difficulty === "easy" ? "bg-green-100 text-green-700" : q.difficulty === "medium" ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"}`}>
                                {q.difficulty === "easy" ? "سهل" : q.difficulty === "medium" ? "متوسط" : "صعب"}
                              </span>
                            </div>
                            <p className="font-medium text-[#001f24]">{q.title || "بدون عنوان"}</p>
                            {q.questionText && (
                              <p className="text-sm text-gray-600 mt-1">{q.questionText}</p>
                            )}
                          </div>
                          <span className="text-sm font-semibold text-[#1a7a8a] bg-[#e0f5f7] px-3 py-1 rounded-lg whitespace-nowrap">
                            {q.points || 0} نقطة
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* المرفقات */}
              {viewingAssignment.attachments && viewingAssignment.attachments.length > 0 && (
                <div>
                  <h4 className="font-semibold text-lg text-[#001f24] mb-3 flex items-center gap-2">
                    <FileText className="h-5 w-5 text-[#1a7a8a]" />
                    المرفقات ({viewingAssignment.attachments.length})
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {viewingAssignment.attachments.map((file: any, index: number) => (
                      <div key={index} className="flex items-center gap-3 bg-[#f7fafa] rounded-xl p-4 border border-[#c0c8c9] hover:border-[#1a7a8a] transition-colors">
                        <div className="w-10 h-10 rounded-lg bg-[#e0f5f7] flex items-center justify-center">
                          <FileText className="h-5 w-5 text-[#1a7a8a]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-[#001f24] truncate">{file.name}</p>
                          <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
                        </div>
                        <a href={file.url} target="_blank" rel="noopener noreferrer" className="p-2 hover:bg-[#e0f5f7] rounded-lg transition-colors">
                          <FileText className="h-4 w-4 text-[#1a7a8a]" />
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* أزرار الإجراءات */}
              <div className="flex justify-end gap-3 pt-4 border-t border-[#c0c8c9]">
                <Button variant="outline" onClick={() => setIsViewDialogOpen(false)} className="gap-2">
                  إغلاق
                </Button>
                <Button
                  onClick={() => {
                    setIsViewDialogOpen(false);
                    handleEditAssignment(viewingAssignment._id);
                  }}
                  className="bg-[#001f24] hover:bg-[#03363d] text-white gap-2"
                >
                  <Edit className="h-4 w-4" />
                  تعديل الواجب
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}