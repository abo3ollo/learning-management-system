// app/(pages)/(roles)/admin/courses/page.tsx
"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Users,
  Download,
  Loader2,
  Filter,
  BookOpen,
  CheckCircle,
  XCircle,
  Eye,
  EyeOff,
  DollarSign,
  Tag,
  User,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AddCourseModal } from "@/app/_components/Courses/AddCourseModal";
import { EditCourseModal } from "@/app/_components/Courses/EditCourseModal";


export default function AdminCoursesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const coursesData = useQuery(api.courses.courses.getCourses, {
    category: selectedCategory !== "all" ? selectedCategory : undefined,
    isPublished: selectedStatus !== "all" ? selectedStatus === "published" : undefined,
    search: searchQuery || undefined,
  });
  const coursesStats = useQuery(api.courses.courses.getCoursesStats);
  const deleteCourse = useMutation(api.courses.courses.deleteCourse);
  const togglePublish = useMutation(api.courses.courses.togglePublishCourse);

  const courses = coursesData || [];
  const isLoading = coursesData === undefined;

  // استخراج التصنيفات من الإحصائيات
  const categories = coursesStats?.categories?.map((c: any) => c.name) || [];

  const handleDelete = async (courseId: string, courseName: string) => {
    if (!confirm(`هل أنت متأكد من حذف المادة "${courseName}"؟ لا يمكن التراجع عن هذا الإجراء.`)) return;

    setDeletingId(courseId);
    try {
      await deleteCourse({ courseId: courseId as any });
    } catch (error: any) {
      console.error("Error deleting course:", error);
      alert(error.message || "حدث خطأ أثناء حذف المادة");
    } finally {
      setDeletingId(null);
    }
  };

  const handleTogglePublish = async (courseId: string, currentStatus: boolean) => {
    try {
      await togglePublish({
        courseId: courseId as any,
        isPublished: !currentStatus
      });
    } catch (error) {
      console.error("Error toggling publish:", error);
      alert("حدث خطأ أثناء تغيير حالة النشر");
    }
  };

  const handleExportCSV = () => {
    setIsExporting(true);
    try {
      const exportData = courses.map((course: any) => ({
        "العنوان": course.title,
        "الوصف": course.description,
        "المعلم": course.teacherName,
        "التصنيف": course.category || "غير محدد",
        "السعر": course.price ? `${course.price} ريال` : "مجاني",
        "الحالة": course.isPublished ? "منشور" : "مسودة",
        "عدد الطلاب": course.studentsCount || 0,
      }));

      const headers = Object.keys(exportData[0] || {});
      const csvRows = [
        headers.join(","),
        ...exportData.map((row: Record<string, unknown>) =>
          headers.map(header => {
            const value = row[header as keyof typeof row];
            if (typeof value === "string" && (value.includes(",") || value.includes('"'))) {
              return `"${value.replace(/"/g, '""')}"`;
            }
            return value;
          }).join(",")
        ),
      ];

      const csvContent = csvRows.join("\n");
      const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `courses_${new Date().toISOString().slice(0, 19)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error exporting data:", error);
      alert("فشل تصدير البيانات");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f7fafa]" dir="rtl">
      {/* Header */}
      <header className="bg-linear-to-r from-[#001f24] to-[#03363d] px-8 py-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <BookOpen className="h-6 w-6" />
              المواد الدراسية
            </h1>
            <p className="text-[#a3ced6] text-sm mt-0.5">إدارة المواد الدراسية والفصول</p>
          </div>
          <Button
            onClick={() => setIsAddModalOpen(true)}
            className="bg-white/15 hover:bg-white/25 text-white border border-white/20"
          >
            <Plus className="h-4 w-4 ml-2" />
            إضافة مادة
          </Button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 border border-[#c0c8c9] hover:shadow-sm transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-[#001f24]">{coursesStats?.total || 0}</p>
                <p className="text-xs text-gray-500">إجمالي المواد</p>
              </div>
              <BookOpen className="h-8 w-8 text-blue-400" />
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-[#c0c8c9] hover:shadow-sm transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-[#001f24]">{coursesStats?.published || 0}</p>
                <p className="text-xs text-gray-500">منشورة</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-400" />
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-[#c0c8c9] hover:shadow-sm transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-[#001f24]">{coursesStats?.draft || 0}</p>
                <p className="text-xs text-gray-500">مسودة</p>
              </div>
              <EyeOff className="h-8 w-8 text-amber-400" />
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-[#c0c8c9] hover:shadow-sm transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-[#001f24]">{coursesStats?.totalStudents || 0}</p>
                <p className="text-xs text-gray-500">إجمالي الطلاب</p>
              </div>
              <Users className="h-8 w-8 text-purple-400" />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl border border-[#c0c8c9] p-4 mb-6">
          <div className="flex flex-wrap gap-3">
            <div className="flex-1 min-w-50 relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="بحث بالعنوان أو الوصف..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full border border-gray-200 rounded-lg pr-9 pl-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a7a8a]"
              />
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="border border-gray-200 rounded-lg px-4 py-2 text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#1a7a8a] bg-white"
            >
              <option value="all">جميع التصنيفات</option>
              {categories.map((cat: string) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="border border-gray-200 rounded-lg px-4 py-2 text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#1a7a8a] bg-white"
            >
              <option value="all">جميع الحالات</option>
              <option value="published">منشور</option>
              <option value="draft">مسودة</option>
            </select>
            <Button
              variant="outline"
              onClick={() => { setSearchQuery(""); setSelectedCategory("all"); setSelectedStatus("all"); }}
              className="border-gray-200 text-gray-600 hover:bg-gray-50"
            >
              <Filter className="h-4 w-4 ml-2" />
              إعادة ضبط
            </Button>
            <Button
              variant="outline"
              onClick={handleExportCSV}
              disabled={isExporting || courses.length === 0}
              className="border-gray-200 text-gray-600 hover:bg-gray-50"
            >
              <Download className="h-4 w-4 ml-2" />
              تصدير
            </Button>
          </div>
        </div>

        {/* Courses Table */}
        <div className="bg-white rounded-xl border border-[#c0c8c9] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#f7fafa] border-b border-[#c0c8c9]">
                <tr>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">المادة</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">المعلم</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">التصنيف</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">السعر</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">الطلاب</th>
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
                ) : courses.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <BookOpen className="h-12 w-12 text-gray-300" />
                        <p className="text-gray-500 font-medium">لا توجد مواد دراسية</p>
                        <Button variant="outline" size="sm" onClick={() => setIsAddModalOpen(true)}>
                          <Plus className="h-4 w-4 ml-2" />
                          إضافة أول مادة
                        </Button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  courses.map((course: any) => (
                    <tr key={course._id} className="hover:bg-[#f7fafa] transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {course.thumbnail ? (
                            <img src={course.thumbnail} alt={course.title} className="w-10 h-10 rounded-lg object-cover" />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-[#e0f5f7] flex items-center justify-center">
                              <BookOpen className="h-5 w-5 text-[#1a7a8a]" />
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-[#001f24] text-sm">{course.title}</p>
                            <p className="text-xs text-gray-400 line-clamp-1">{course.description}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 flex items-center gap-1.5">
                        <User className="h-3.5 w-3.5 text-gray-400" />
                        {course.teacherName}
                      </td>
                      <td className="px-4 py-3">
                        {course.category ? (
                          <span className="px-2 py-1 text-xs rounded-full bg-blue-50 text-blue-700">
                            {course.category}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {course.price ? `${course.price} ريال` : "مجاني"}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {course.studentsCount || 0}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleTogglePublish(course._id, course.isPublished)}
                          className={`px-2.5 py-1 text-xs rounded-full flex items-center gap-1 ${course.isPublished
                              ? "bg-green-100 text-green-700 hover:bg-green-200"
                              : "bg-amber-100 text-amber-700 hover:bg-amber-200"
                            }`}
                        >
                          {course.isPublished ? (
                            <CheckCircle className="h-3 w-3" />
                          ) : (
                            <EyeOff className="h-3 w-3" />
                          )}
                          {course.isPublished ? "منشور" : "مسودة"}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => {
                              setSelectedCourseId(course._id);
                              setIsEditModalOpen(true);
                            }}
                            className="p-1.5 hover:bg-blue-50 rounded-lg transition-colors"
                            title="تعديل"
                          >
                            <Edit className="h-4 w-4 text-gray-400 hover:text-blue-600" />
                          </button>
                          <button
                            onClick={() => handleDelete(course._id, course.title)}
                            disabled={deletingId === course._id}
                            className="p-1.5 hover:bg-red-50 rounded-lg transition-colors"
                            title="حذف"
                          >
                            {deletingId === course._id ? (
                              <Loader2 className="h-4 w-4 animate-spin text-red-400" />
                            ) : (
                              <Trash2 className="h-4 w-4 text-gray-400 hover:text-red-600" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-4 text-center text-xs text-gray-400">
          عرض {courses.length} مادة
        </div>
      </div>

      {/* Modals */}
      <AddCourseModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} />
      <EditCourseModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedCourseId(null);
        }}
        courseId={selectedCourseId}
      />
    </div>
  );
}