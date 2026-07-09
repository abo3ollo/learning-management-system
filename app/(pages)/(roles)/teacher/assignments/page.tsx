// app/(pages)/(roles)/teacher/assignments/page.tsx

"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Search,
  Loader2,
  FileText,
  CheckCircle,
  Clock,
  Calendar,
  Eye,
  Edit,
  Trash2,
  Send,
  Users,
  GraduationCap,
  Filter,
  X,
  UserCheck,
  FileEdit,
} from "lucide-react";
import Link from "next/link";
import { AddAssignmentModal } from "@/app/_components/Assignment/AddAssignmentModal";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export default function TeacherAssignmentsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedGroup, setSelectedGroup] = useState("all");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingAssignmentId, setEditingAssignmentId] = useState<string | null>(null);
  const [viewingAssignment, setViewingAssignment] = useState<any>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // ✅ جلب بيانات المعلم الحالي
  const currentUser = useQuery(api.user.auth.getCurrentUser);

  // ✅ جلب المجموعات التي أنشأها المعلم
  const myGroups = useQuery(
    api.groups.groups.getTeacherGroups,
    {}
  );

  // ✅ جلب الواجبات
  const assignments = useQuery(api.assignments.assignments.getAssignments, {
    search: searchQuery || undefined,
    status: selectedStatus !== "all" ? (selectedStatus as any) : undefined,
  });

  // ✅ جلب إحصائيات الواجبات
  const stats = useQuery(api.assignments.assignments.getAssignmentsStats);

  // ✅ Mutations
  const deleteAssignment = useMutation(api.assignments.assignments.deleteAssignment);
  const publishAssignment = useMutation(api.assignments.assignments.publishAssignment);

  // حالة التحميل
  if (currentUser === undefined || assignments === undefined || stats === undefined || myGroups === undefined) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-[#1a7a8a]" />
      </div>
    );
  }

  // ✅ دوال مساعدة
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

  const getTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      assignment: "واجب",
      quiz: "اختبار",
      exam: "امتحان",
      project: "مشروع",
    };
    return types[type] || type;
  };

  // ✅ فلترة الواجبات
  const filteredAssignments = assignments?.filter((assignment: any) => {
    if (selectedStatus !== "all" && assignment.status !== selectedStatus) {
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

  // ✅ دوال الترجمة
  const getStatusLabel = (value: string) => {
    const map: Record<string, string> = {
      all: "جميع الحالات",
      published: "منشور",
      draft: "مسودة",
      archived: "مؤرشف",
    };
    return map[value] || value;
  };

  const statusOptions = [
    { value: "all", label: "جميع الحالات" },
    { value: "published", label: "منشور" },
    { value: "draft", label: "مسودة" },
    { value: "archived", label: "مؤرشف" },
  ];

  const activeFiltersCount = [
    selectedStatus !== "all",
    selectedGroup !== "all",
    searchQuery !== "",
  ].filter(Boolean).length;

  const resetFilters = () => {
    setSelectedStatus("all");
    setSelectedGroup("all");
    setSearchQuery("");
  };

  // ✅ جلب اسم المجموعة
  const getGroupName = (groupId: string) => {
    const group = myGroups?.find((g: any) => g._id === groupId);
    return group?.name || "غير محدد";
  };

  const getGroupNames = (groupIds: string[]) => {
    if (!groupIds || groupIds.length === 0) return "جميع المجموعات";
    const names = groupIds.map((id) => {
      const group = myGroups?.find((g: any) => g._id === id);
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

  // ✅ حذف الواجب
  const handleDelete = async (assignmentId: string) => {
    if (!confirm("هل أنت متأكد من حذف هذا الواجب؟ لا يمكن التراجع عن هذا الإجراء.")) return;
    try {
      await deleteAssignment({ assignmentId: assignmentId as any });
    } catch (error: any) {
      alert(error.message || "حدث خطأ أثناء حذف الواجب");
    }
  };

  // ✅ نشر الواجب
  const handlePublish = async (assignmentId: string) => {
    try {
      await publishAssignment({ assignmentId: assignmentId as any });
    } catch (error) {
      alert("حدث خطأ أثناء نشر الواجب");
    }
  };

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
              واجباتي
            </h1>
            <p className="text-[#a3ced6] text-sm mt-0.5">إدارة الواجبات وتوجيهها للمجموعات</p>
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
        <div className={`bg-white rounded-xl border border-[#c0c8c9] p-4 mb-6 ${showFilters ? 'block' : 'hidden md:block'}`}>
          <div className="flex flex-wrap gap-3 items-center">
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
              value={selectedGroup}
              onChange={(e) => setSelectedGroup(e.target.value)}
              className="border border-gray-200 rounded-lg px-4 py-2 text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#1a7a8a] bg-white min-w-40"
            >
              <option value="all">جميع المجموعات</option>
              {myGroups?.map((group: any) => (
                <option key={group._id} value={group._id}>
                  {group.name}
                </option>
              ))}
            </select>

            <Button
              variant="outline"
              onClick={resetFilters}
              className="border-gray-200 text-gray-600 hover:bg-gray-50 gap-2"
            >
              <Filter className="h-4 w-4 ml-2" />
              إعادة ضبط
              {activeFiltersCount > 0 && (
                <span className="bg-[#1a7a8a] text-white text-xs rounded-full px-2 py-0.5">
                  {activeFiltersCount}
                </span>
              )}
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
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">المجموعة</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">النوع</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">التسليم</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">الحالة</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredAssignments?.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <FileText className="h-12 w-12 text-gray-300" />
                        <p className="text-gray-500 font-medium">لا توجد واجبات</p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingAssignmentId(null);
                            setIsAddModalOpen(true);
                          }}
                        >
                          <Plus className="h-4 w-4 ml-2" />
                          إنشاء واجب
                        </Button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredAssignments?.map((assignment: any) => {
                    const statusBadge = getStatusBadge(assignment.status);
                    const isTeacher = currentUser?._id === assignment.createdBy;

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
                            {/* عرض */}
                            <button
                              onClick={() => handleViewAssignment(assignment)}
                              className="p-1.5 hover:bg-blue-50 rounded-lg transition-colors"
                              title="عرض التفاصيل"
                            >
                              <Eye className="h-4 w-4 text-gray-400 hover:text-blue-600" />
                            </button>

                            {/* تعديل */}
                            {isTeacher && (
                              <button
                                onClick={() => handleEditAssignment(assignment._id)}
                                className="p-1.5 hover:bg-blue-50 rounded-lg transition-colors"
                                title="تعديل"
                              >
                                <Edit className="h-4 w-4 text-gray-400 hover:text-blue-600" />
                              </button>
                            )}

                            {/* تصحيح */}
                            {assignment.status === "published" && (
                              <Link href={`/teacher/assignments/${assignment._id}/grade`}>
                                <button
                                  className="p-1.5 hover:bg-purple-50 rounded-lg transition-colors"
                                  title="تصحيح"
                                >
                                  <FileEdit className="h-4 w-4 text-gray-400 hover:text-purple-600" />
                                </button>
                              </Link>
                            )}

                            {/* نشر */}
                            {isTeacher && assignment.status !== "published" && (
                              <button
                                onClick={() => handlePublish(assignment._id)}
                                className="p-1.5 hover:bg-green-50 rounded-lg transition-colors"
                                title="نشر"
                              >
                                <Send className="h-4 w-4 text-gray-400 hover:text-green-600" />
                              </button>
                            )}

                            {/* حذف */}
                            {isTeacher && (
                              <button
                                onClick={() => handleDelete(assignment._id)}
                                className="p-1.5 hover:bg-red-50 rounded-lg transition-colors"
                                title="حذف"
                              >
                                <Trash2 className="h-4 w-4 text-gray-400 hover:text-red-600" />
                              </button>
                            )}
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

        <div className="mt-4 text-center text-xs text-gray-400">
          عرض {filteredAssignments?.length || 0} واجب
        </div>
      </div>

      {/* Add/Edit Assignment Modal */}
      <AddAssignmentModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingAssignmentId(null);
        }}
        editAssignmentId={editingAssignmentId}
      />

      {/* View Assignment Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-[#001f24] flex items-center gap-2">
              <FileText className="h-6 w-6 text-[#1a7a8a]" />
              تفاصيل الواجب
            </DialogTitle>
            <DialogDescription>
              عرض تفاصيل الواجب {viewingAssignment?.title}
            </DialogDescription>
          </DialogHeader>

          {viewingAssignment && (
            <div className="space-y-4 mt-4">
              {/* معلومات أساسية */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#f7fafa] rounded-lg p-4">
                  <p className="text-xs text-gray-500">العنوان</p>
                  <p className="font-semibold text-[#001f24]">{viewingAssignment.title}</p>
                </div>
                <div className="bg-[#f7fafa] rounded-lg p-4">
                  <p className="text-xs text-gray-500">النوع</p>
                  <p className="font-semibold text-[#001f24]">{getTypeLabel(viewingAssignment.type)}</p>
                </div>
                <div className="bg-[#f7fafa] rounded-lg p-4">
                  <p className="text-xs text-gray-500">المجموعة</p>
                  <p className="font-semibold text-[#001f24]">{getGroupNames(viewingAssignment.groupIds || [])}</p>
                </div>
                <div className="bg-[#f7fafa] rounded-lg p-4">
                  <p className="text-xs text-gray-500">الحالة</p>
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs rounded-full border ${getStatusBadge(viewingAssignment.status).className}`}>
                    {getStatusBadge(viewingAssignment.status).label}
                  </span>
                </div>
              </div>

              {/* التواريخ */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#f7fafa] rounded-lg p-4">
                  <p className="text-xs text-gray-500">تاريخ البداية</p>
                  <p className="font-semibold text-[#001f24]">
                    {new Date(viewingAssignment.startDate).toLocaleString("ar-EG")}
                  </p>
                </div>
                <div className="bg-[#f7fafa] rounded-lg p-4">
                  <p className="text-xs text-gray-500">تاريخ التسليم</p>
                  <p className="font-semibold text-[#001f24]">
                    {new Date(viewingAssignment.dueDate).toLocaleString("ar-EG")}
                  </p>
                </div>
              </div>

              {/* الوصف */}
              {viewingAssignment.description && (
                <div className="bg-[#f7fafa] rounded-lg p-4">
                  <p className="text-xs text-gray-500">الوصف</p>
                  <p className="text-sm text-[#001f24] whitespace-pre-wrap">
                    {viewingAssignment.description}
                  </p>
                </div>
              )}

              {/* أزرار الإجراءات */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
                  إغلاق
                </Button>
                {currentUser?._id === viewingAssignment.createdBy && (
                  <>
                    <Button
                      onClick={() => {
                        setIsViewDialogOpen(false);
                        handleEditAssignment(viewingAssignment._id);
                      }}
                      className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
                    >
                      <Edit className="h-4 w-4" />
                      تعديل
                    </Button>
                    {viewingAssignment.status === "published" && (
                      <Link href={`/teacher/assignments/${viewingAssignment._id}/grade`}>
                        <Button className="bg-purple-600 hover:bg-purple-700 text-white gap-2">
                          <FileEdit className="h-4 w-4" />
                          تصحيح
                        </Button>
                      </Link>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}